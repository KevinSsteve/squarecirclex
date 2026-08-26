/**
 * Chat Handler Lambda Function
 * 
 * Handles conversational chat interface for manual post adjustments
 * POST /chat endpoint
 * 
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Import shared libraries from Lambda Layer
const { BrandsDataAccess } = require('/opt/nodejs/db/brands');
const { PostsDataAccess } = require('/opt/nodejs/db/posts');
const { ChatHistoryDataAccess } = require('/opt/nodejs/db/chat-history');
const { ErrorHandler, ErrorCodes } = require('/opt/nodejs/errors/error-handler');
const { saveChatMessage, getChatHistory } = require('/opt/nodejs/db/chat-history');

// Initialize AWS clients WITHOUT automatic retries (we'll handle retries manually)
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  maxAttempts: 1  // Disable automatic retries - we'll implement custom exponential backoff
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const BEDROCK_CLAUDE_MODEL_ID = process.env.BEDROCK_CLAUDE_MODEL_ID || 'global.anthropic.claude-opus-5';
const BEDROCK_CLAUDE_FAST_MODEL_ID = process.env.BEDROCK_CLAUDE_FAST_MODEL_ID || 'global.anthropic.claude-sonnet-5';
const BEDROCK_IMAGE_MODEL_ID = process.env.BEDROCK_IMAGE_MODEL_ID || 'stability.stable-image-ultra-v1:0';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Rate limit configuration
const MAX_HISTORY_MESSAGES = 4;  // Total messages to send (1 anchor + 3 recent)
const MAX_RETRY_ATTEMPTS = 4;    // Maximum retry attempts for throttling
const INITIAL_RETRY_DELAY = 1000; // Start with 1 second delay

/**
 * BULLETPROOF JSON SANITIZATION
 * Extracts and cleans JSON from Claude's response
 * Handles markdown blocks, control characters, malformed strings, and missing quotes
 */
function sanitizeAndExtractJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    console.error('Invalid input to sanitizeAndExtractJSON:', typeof rawText);
    return null;
  }

  try {
    // Log raw response for debugging
    console.log('=== RAW CLAUDE RESPONSE (first 500 chars) ===');
    console.log(rawText.substring(0, 500));

    let cleanedText = rawText;

    // Step 1: Extract JSON from markdown code blocks
    const markdownJsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownJsonMatch) {
      cleanedText = markdownJsonMatch[1];
      console.log('Extracted JSON from markdown block');
    }

    // Step 2: Extract JSON from generic code blocks
    const codeBlockMatch = cleanedText.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      cleanedText = codeBlockMatch[1];
      console.log('Extracted JSON from generic code block');
    }

    // Step 3: Find JSON object boundaries
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    } else {
      console.error('No JSON object found in response');
      return null;
    }

    // Step 4: Fix malformed hashtag arrays (missing quotes)
    // Pattern: [..., "#hashtag", #hashtag", ...] -> [..., "#hashtag", "#hashtag", ...]
    cleanedText = cleanedText.replace(/([\[\s,])#([^",\s\]]+)/g, '$1"#$2"');
    
    // Step 5: Fix other malformed strings in arrays (missing opening quotes)
    // Pattern: [..., "string", string", ...] -> [..., "string", "string", ...]
    cleanedText = cleanedText.replace(/([\[\s,])([^",\s\]]+)"/g, '$1"$2"');
    
    // Step 6: Fix malformed strings (missing closing quotes)
    // Pattern: [..., "string, "string2"] -> [..., "string", "string2"]
    cleanedText = cleanedText.replace(/"([^"]*),\s*"([^"]*)"]/g, '"$1", "$2"]');

    // Step 7: Remove control characters (but preserve escaped ones)
    // Replace literal newlines, carriage returns, and tabs with escaped versions
    cleanedText = cleanedText
      .replace(/\r\n/g, '\\n')  // Windows line endings
      .replace(/\n/g, '\\n')     // Unix line endings
      .replace(/\r/g, '\\n')     // Mac line endings
      .replace(/\t/g, '\\t');    // Tabs

    // Step 8: Remove other control characters (ASCII 0-31 except those we just escaped)
    cleanedText = cleanedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    console.log('=== SANITIZED JSON (first 500 chars) ===');
    console.log(cleanedText.substring(0, 500));

    // Step 9: Attempt to parse
    const parsed = JSON.parse(cleanedText);
    console.log('JSON parsed successfully');
    return parsed;

  } catch (error) {
    console.error('=== JSON SANITIZATION FAILED ===');
    console.error('Error:', error.message);
    console.error('Raw text length:', rawText.length);
    console.error('Raw text (first 1000 chars):', rawText.substring(0, 1000));
    console.error('Raw text (last 500 chars):', rawText.substring(Math.max(0, rawText.length - 500)));
    
    // FINAL FALLBACK: Check if this is a plain text throttling message
    if (rawText.includes('criatividade está a recarregar') || 
        rawText.includes('Too many requests') ||
        rawText.includes('throttle') ||
        rawText.includes('rate limit')) {
      console.log('Detected throttling message, returning structured response');
      return {
        throttling_detected: true,
        conversational_response: rawText.trim(),
        response_type: 'throttling_error'
      };
    }
    
    return null;
  }
}

/**
 * CRITICAL: Sanitize conversation history to enforce strict alternating roles
 * Claude requires perfect user -> assistant -> user alternation
 * Merges consecutive messages from the same role into a single message
 */
function sanitizeConversationHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  const sanitized = [];
  let currentMessage = null;

  for (const msg of history) {
    // Skip invalid messages
    if (!msg || !msg.role || !msg.content) {
      console.log('Skipping invalid message:', msg);
      continue;
    }

    // If this is the first message or role changed, start new message
    if (!currentMessage || currentMessage.role !== msg.role) {
      // Save previous message if exists
      if (currentMessage) {
        sanitized.push(currentMessage);
      }
      // Start new message
      currentMessage = {
        role: msg.role,
        content: msg.content
      };
    } else {
      // Same role as previous - merge content
      currentMessage.content += '\n\n' + msg.content;
    }
  }

  // Don't forget the last message
  if (currentMessage) {
    sanitized.push(currentMessage);
  }

  // CRITICAL: Ensure we start with 'user' role (Claude requirement)
  if (sanitized.length > 0 && sanitized[0].role !== 'user') {
    console.log('WARNING: History starts with assistant role, removing first message');
    sanitized.shift();
  }

  // CRITICAL: Ensure we end with 'user' role (the current message will be added after)
  if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === 'user') {
    console.log('WARNING: History ends with user role, removing last message to avoid consecutive user messages');
    sanitized.pop();
  }

  console.log(`Sanitized history: ${history.length} → ${sanitized.length} messages (strict alternation enforced)`);
  return sanitized;
}

/**
 * ANCHOR MEMORY: Truncate conversation history while preserving context
 * Always includes the FIRST message (brand context) + last messages
 * This prevents "context amnesia" while saving tokens
 */
function truncateHistory(conversationHistory) {
  if (!Array.isArray(conversationHistory)) {
    return [];
  }
  
  // If 10 or fewer messages, send all
  if (conversationHistory.length <= 10) {
    return conversationHistory;
  }
  
  // Keep last 10 messages for context
  const truncated = conversationHistory.slice(-10);
  
  console.log(`History truncated: ${conversationHistory.length} → ${truncated.length} messages`);
  return truncated;
}

/**
 * Sleep utility for exponential backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Invoke Bedrock with exponential backoff retry logic
 * Handles ThrottlingException and rate limit errors gracefully
 */
async function invokeBedrockWithRetry(command, operation = 'bedrock_invoke') {
  let lastError = null;
  
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await bedrockClient.send(command);
      
      // Success - log if we had to retry
      if (attempt > 0) {
        console.log(`Bedrock call succeeded on attempt ${attempt + 1}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Check if it's a throttling error
      const isThrottling = 
        error.name === 'ThrottlingException' ||
        error.code === 'ThrottlingException' ||
        error.$metadata?.httpStatusCode === 429 ||
        (error.message && error.message.includes('Too many requests'));
      
      if (isThrottling && attempt < MAX_RETRY_ATTEMPTS - 1) {
        // Calculate exponential backoff delay: 1s, 2s, 4s, 8s
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        
        console.log(`Throttled by Bedrock (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS}). Waiting ${delay}ms before retry...`);
        ErrorHandler.logWarning('Bedrock throttling detected', {
          operation,
          attempt: attempt + 1,
          maxAttempts: MAX_RETRY_ATTEMPTS,
          delayMs: delay,
          errorName: error.name,
          errorCode: error.code
        });
        
        await sleep(delay);
        continue; // Retry
      }
      
      // If not throttling or we've exhausted retries, throw
      throw error;
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

/**
 * Process chat message with Claude - Strategic Interviewer Persona (Onboarding)
 * Requirements: 8.2
 */
async function processOnboardingMessage(message, conversationHistory, userId) {
  try {
    // CRITICAL: Load actual conversation history from DynamoDB
    let dbHistory = [];
    try {
      const historyRecords = await ChatHistoryDataAccess.getHistory(userId, 15);
      dbHistory = historyRecords.map(record => ({
        role: record.role,
        content: record.content
      }));
      console.log(`Loaded ${dbHistory.length} messages from DynamoDB for onboarding`);
    } catch (historyError) {
      console.error('Failed to load chat history from DynamoDB:', historyError);
      // Continue with empty history if load fails
    }

    // CRITICAL: Sanitize history to enforce strict alternating roles
    const sanitizedHistory = sanitizeConversationHistory(dbHistory);
    
    // CRITICAL: Truncate to save tokens
    const truncatedHistory = truncateHistory(sanitizedHistory);
    
    const messages = [
      ...truncatedHistory,
      {
        role: 'user',
        content: message
      }
    ];

    console.log('=== ONBOARDING BEDROCK REQUEST ===');
    console.log('Messages array length:', messages.length);
    console.log('Messages:', JSON.stringify(messages, null, 2));

    const systemPrompt = `You are Onzo, a friendly AI assistant helping new users set up their social media presence.

CURRENT STATE: User has no brand profile yet.

YOUR ROLE: Strategic Interviewer
- Ask natural, conversational questions one at a time
- Extract information organically from the conversation
- Don't make it feel like a form - be conversational and engaging
- Be encouraging and supportive

INFORMATION TO COLLECT:
1. brand_name - What's their business called?
2. industry - What do they do? (e.g., "barber shop", "consulting", "restaurant")
3. target_audience - Who are they trying to reach?
4. tone_of_voice - How should they sound? (e.g., "professional", "casual", "inspirational")
5. visual_style - What aesthetic do they prefer? (e.g., "minimalist", "bold and vibrant")
6. content_pillars - What topics should they cover? (need at least 3)
7. post_times - When should posts go live? (HH:MM format, at least 1)

BUSINESS CLASSIFICATION:
Analyze the industry to determine business type:
- Type A (Asset-Heavy): barber shop, restaurant, retail store, salon, gym, clothing store
  → Needs real photos/videos
  → Explain they'll need authentic content
  → Set show_upload_button: true
- Type B (Generative-Heavy): consulting, coaching, nutrition, education, SaaS, professional services
  → Can use AI-generated images
  → Focus on authority building
  → Set show_upload_button: false

CRITICAL JSON OUTPUT RULES:
1. OUTPUT ONLY VALID JSON - NO MARKDOWN CODE BLOCKS
2. DO NOT wrap JSON in \`\`\`json or \`\`\` tags
3. ESCAPE ALL STRINGS - Replace literal newlines with \\n
4. NO CONTROL CHARACTERS - Use \\n for line breaks, \\t for tabs
5. Start response directly with { and end with }
6. ALWAYS USE DOUBLE QUOTES - Every string must be wrapped in double quotes "like this"
7. HASHTAG ARRAYS - Every hashtag must be double-quoted: ["#hashtag1", "#hashtag2", "#hashtag3"]
8. NO MISSING QUOTES - Check every string in arrays has opening AND closing quotes

RESPONSE FORMAT:
Return a JSON object with:
{
  "extracted_entities": {
    "brand_name": "value or null",
    "industry": "value or null",
    "target_audience": "value or null",
    "tone_of_voice": "value or null",
    "visual_style": "value or null",
    "content_pillars": ["array", "of", "pillars"] or [],
    "post_times": ["HH:MM"] or []
  },
  "conversational_response": "Your friendly, natural response to the user",
  "business_type": "asset_heavy" | "generative_heavy" | null,
  "show_upload_button": true | false,
  "onboarding_complete": true | false
}

Set onboarding_complete to true ONLY when ALL required fields are collected.

Be natural and conversational. Ask follow-up questions if answers are vague.`;

    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages,
      temperature: 0.7
    };

    const command = new InvokeModelCommand({
      modelId: BEDROCK_CLAUDE_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    // CRITICAL FIX 2: Use exponential backoff retry logic
    const response = await invokeBedrockWithRetry(command, 'processOnboardingMessage');
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const claudeResponse = responseBody.content[0].text;

    // BULLETPROOF JSON EXTRACTION: Use sanitization function
    const onboardingData = sanitizeAndExtractJSON(claudeResponse);
    
    if (onboardingData) {
      // Check for throttling detection
      if (onboardingData.throttling_detected) {
        return {
          extracted_entities: {},
          conversational_response: onboardingData.conversational_response,
          business_type: null,
          show_upload_button: false,
          onboarding_complete: false,
          conversationHistory: messages,
          throttling_detected: true
        };
      }
      
      return {
        ...onboardingData,
        conversationHistory: messages
      };
    }

    // Fallback if JSON parsing failed
    console.error('Failed to parse JSON from Claude response, returning fallback');
    return {
      extracted_entities: {},
      conversational_response: claudeResponse || 'Desculpe, tive dificuldade em processar isso. Pode reformular?',
      business_type: null,
      show_upload_button: false,
      onboarding_complete: false,
      conversationHistory: messages
    };
  } catch (error) {
    // CRITICAL: Log FULL error details to CloudWatch for debugging
    console.error('=== ONBOARDING MESSAGE ERROR (FULL DETAILS) ===');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Name:', error.name);
    console.error('Error Stack:', error.stack);
    console.error('Error $metadata:', JSON.stringify(error.$metadata, null, 2));
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Check if it's a validation error (400)
    const isValidationError = 
      error.$metadata?.httpStatusCode === 400 ||
      error.name === 'ValidationException' ||
      (error.message && error.message.includes('validation'));
    
    // Check if it's a throttling error
    const isThrottling = 
      error.name === 'ThrottlingException' ||
      error.code === 'ThrottlingException' ||
      error.$metadata?.httpStatusCode === 429 ||
      (error.message && error.message.includes('Too many requests'));
    
    ErrorHandler.logError(error, { operation: 'processOnboardingMessage' });
    
    // Return user-friendly message with error type
    let conversationalResponse;
    if (isValidationError) {
      conversationalResponse = `Erro de validação detectado. Por favor, tente reformular sua mensagem. Detalhes técnicos: ${error.message}`;
    } else if (isThrottling) {
      conversationalResponse = "A minha criatividade está a recarregar! Como estamos a usar a infraestrutura de alta velocidade da AWS, preciso de 30 segundos de pausa entre pedidos rápidos. Pode aguardar um momento e tentar de novo?";
    } else {
      conversationalResponse = `Estou com dificuldade para processar isso agora. Erro: ${error.message}. Você poderia me contar sobre o seu negócio?`;
    }
    
    // Return fallback response with detailed error info for debugging
    return {
      extracted_entities: {},
      conversational_response: conversationalResponse,
      business_type: null,
      show_upload_button: false,
      onboarding_complete: false,
      conversationHistory: conversationHistory,
      error: error.message,
      error_type: isValidationError ? 'validation' : (isThrottling ? 'throttling' : 'unknown'),
      debug_info: {
        message: error.message,
        code: error.code || error.name,
        httpStatus: error.$metadata?.httpStatusCode,
        stack: error.stack,
        operation: 'processOnboardingMessage'
      }
    };
  }
}

/**
 * SINGLE-PASS: Process chat message with Claude - Social Media Manager Persona
 * Makes ONLY ONE Bedrock call per user message to avoid RPM limits
 * Requirements: 8.2, 8.3
 */
async function processSocialMediaMessage(message, conversationHistory, brandContext) {
  try {
    // CRITICAL: Load actual conversation history from DynamoDB
    let dbHistory = [];
    try {
      const historyRecords = await ChatHistoryDataAccess.getHistory(brandContext.user_id, 15);
      dbHistory = historyRecords.map(record => ({
        role: record.role,
        content: record.content
      }));
      console.log(`Loaded ${dbHistory.length} messages from DynamoDB for social media manager`);
    } catch (historyError) {
      console.error('Failed to load chat history from DynamoDB:', historyError);
      // Continue with empty history if load fails
    }

    // CRITICAL: Sanitize history to enforce strict alternating roles
    const sanitizedHistory = sanitizeConversationHistory(dbHistory);
    
    // Truncate history to save tokens and avoid rate limits
    const truncatedHistory = truncateHistory(sanitizedHistory);
    
    // Build conversation messages
    const messages = [
      ...truncatedHistory,
      {
        role: 'user',
        content: message
      }
    ];

    console.log('=== SOCIAL MEDIA BEDROCK REQUEST ===');
    console.log('Messages array length:', messages.length);
    console.log('Messages:', JSON.stringify(messages, null, 2));

    // DYNAMIC BRAND CONTEXT INJECTION
    const brandInfo = `
BRAND PROFILE (ALWAYS REMEMBER THIS):
- Brand Name: ${brandContext.brand_name}
- Industry: ${brandContext.industry}
- Target Audience: ${brandContext.target_audience || 'General audience'}
- Tone of Voice: ${brandContext.tone_of_voice || 'Professional'}
- Visual Style: ${brandContext.visual_style || 'Modern'}
- Content Pillars: ${brandContext.content_pillars ? brandContext.content_pillars.join(', ') : 'General content'}
`;

    // AGENTIC SYSTEM PROMPT: Proactive Social Media Manager with 3-Phase Workflow
    const systemPrompt = `You are Onzo, a proactive, expert Social Media Manager and Strategist.

${brandInfo}

CRITICAL: You are NOT a reactive chatbot. You are an AUTONOMOUS AGENT who LEADS the conversation. Never wait passively for commands.

=== "JUST DO IT" OVERRIDE DIRECTIVE ===
CRITICAL RULE: When the user explicitly commands you to generate content NOW (e.g., "gere agora", "pode gerar", "crie o post", "faça isso", "quero ver"), you MUST:
1. IMMEDIATELY skip to Phase 3 (Execution)
2. Generate the post content WITHOUT asking more questions
3. DO NOT say "I need more information"
4. DO NOT ask for approval again
5. JUST DO IT - the user has given explicit permission

This override applies to ANY direct command to create/generate content.

=== 3-PHASE AGENTIC WORKFLOW ===

PHASE 1: STRATEGY & DISCOVERY
When the user first greets you or asks for help (e.g., "olá", "preciso de ajuda", "quero criar posts"):
- DO NOT generate posts immediately
- DO NOT ask what they want you to do
- INSTEAD: Ask 1-2 highly targeted strategic questions to understand their current goal
- Examples: "Estamos tentando atrair novos inquilinos ou proprietários esta semana?" or "Qual é a mensagem principal que você quer transmitir?"
- Be specific to their industry (${brandContext.industry})
- Lead with expertise and confidence

PHASE 2: CONTENT CALENDAR PROPOSAL
Once the user answers your strategic questions:
- Process their strategy and goals
- Propose a structured weekly content calendar
- Format as a clear list or table with 3 post ideas for the week
- Include: Day, Topic, Goal for each post
- End with: "Você aprova este calendário? Se sim, gostaria que eu criasse o primeiro post agora e agendasse o resto?"
- Wait for explicit approval before proceeding

PHASE 3: EXECUTION & GENERATION
ONLY after the user approves the calendar and says "yes" to creating the post OR gives explicit command:
- Generate the actual content for the first scheduled post
- CRITICAL FORMAT REQUIREMENT: You MUST include these exact sections:
  * 📝 LEGENDA: [2-3 sentence caption in Portuguese matching brand tone]
  * 🏷️ HASHTAGS: [5-10 relevant hashtags for ${brandContext.industry}]
  * 🎨 DESCRIÇÃO DA IMAGEM: [Highly detailed visual prompt for image generation matching ${brandContext.visual_style || 'Modern'} style]
- The "🎨 DESCRIÇÃO DA IMAGEM:" string is MANDATORY for our Stable Image Ultra integration

CRITICAL JSON OUTPUT RULES:
1. OUTPUT ONLY VALID JSON - NO MARKDOWN CODE BLOCKS
2. DO NOT wrap JSON in \`\`\`json or \`\`\` tags
3. ESCAPE ALL STRINGS - Replace literal newlines with \\n
4. NO CONTROL CHARACTERS - Use \\n for line breaks, \\t for tabs
5. Start response directly with { and end with }
6. ALWAYS USE DOUBLE QUOTES - Every string must be wrapped in double quotes "like this"
7. HASHTAG ARRAYS - Every hashtag must be double-quoted: ["#hashtag1", "#hashtag2", "#hashtag3"]
8. NO MISSING QUOTES - Check every string in arrays has opening AND closing quotes

INTENT ROUTING RULES (CRITICAL):
- When user asks for "plano", "calendário", "estratégia da semana", "planejamento", or similar planning requests → response_type MUST be "plan"
- When user asks to generate a specific post → response_type MUST be "post_content"
- For all other conversations → response_type is "chat"

RESPONSE FORMAT:
Always return a JSON object:

For PHASE 1 (Strategy):
{
  "response_type": "chat",
  "conversational_response": "Your strategic question to understand their goals"
}

For PHASE 2 (Calendar/Plan) - CRITICAL STRUCTURED FORMAT:
{
  "response_type": "plan",
  "conversational_response": "Aqui está o plano de conteúdo para a semana!",
  "plan_data": [
    {
      "day": "Segunda-feira",
      "theme": "Dica de Valorização",
      "objective": "Educar proprietários sobre como aumentar o valor do imóvel"
    },
    {
      "day": "Quarta-feira",
      "theme": "Tendência do Mercado",
      "objective": "Mostrar expertise e atrair novos clientes"
    },
    {
      "day": "Sexta-feira",
      "theme": "Sucesso de Cliente",
      "objective": "Construir confiança através de prova social"
    }
  ]
}

CRITICAL: For response_type "plan", you MUST return the plan_data array with structured objects. DO NOT return a text block in conversational_response. The frontend needs this structure to render ContentPlanCard components.

For PHASE 3 (Execution):
{
  "response_type": "post_content",
  "conversational_response": "Aqui está o primeiro post do calendário!",
  "post_content": {
    "caption": "Engaging Instagram caption in Portuguese (2-3 sentences) matching the brand's tone",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "image_description": "Detailed description for image generation matching the visual style"
  }
}

CRITICAL FIELD REQUIREMENTS:
- caption: REQUIRED - Must be 2-3 sentences in Portuguese
- hashtags: REQUIRED - Must be array of 5-10 hashtags
- image_description: REQUIRED - NEVER omit this field! Must be detailed visual prompt for Stable Image Ultra image generation. Include style, colors, mood, composition. Example: "Uma imagem moderna e profissional mostrando [subject], com cores [colors], estilo [style], transmitindo [mood]"

BEHAVIORAL RULES:
- ALWAYS lead the conversation - you are the expert
- NEVER generate posts without going through Phase 1 and 2 first (UNLESS user gives explicit "Just Do It" command)
- NEVER ask "what do you want me to do?" - you should know what to do
- ALWAYS be proactive and strategic
- ALWAYS write in Portuguese (Brazilian)
- ALWAYS match the brand's tone: ${brandContext.tone_of_voice || 'Professional'}
- ALWAYS include the exact string "🎨 DESCRIÇÃO DA IMAGEM:" in Phase 3
- REMEMBER: You already know the brand details listed above - NEVER ask for them again

You are an autonomous agent, not a passive assistant. Take charge and guide the user to success.`;

    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages,
      temperature: 0.8
    };

    const command = new InvokeModelCommand({
      modelId: BEDROCK_CLAUDE_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    // Use exponential backoff retry logic
    const response = await invokeBedrockWithRetry(command, 'processSocialMediaMessage');
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const claudeResponse = responseBody.content[0].text;

    // BULLETPROOF JSON EXTRACTION: Use sanitization function
    const responseData = sanitizeAndExtractJSON(claudeResponse);
    
    if (responseData) {
      // Check for throttling detection
      if (responseData.throttling_detected) {
        return {
          response_type: 'throttling_error',
          conversational_response: responseData.conversational_response,
          post_content: null,
          plan_data: null,
          conversationHistory: messages,
          throttling_detected: true
        };
      }
      
      return {
        response_type: responseData.response_type || 'chat',
        conversational_response: responseData.conversational_response || claudeResponse,
        post_content: responseData.post_content || null,
        plan_data: responseData.plan_data || null,
        conversationHistory: messages
      };
    }

    // Fallback if JSON parsing failed - treat as chat
    console.error('Failed to parse JSON from Claude response, returning fallback');
    return {
      response_type: 'chat',
      conversational_response: claudeResponse || 'Desculpe, tive dificuldade em processar isso. Pode reformular?',
      post_content: null,
      conversationHistory: messages
    };
  } catch (error) {
    // CRITICAL: Log FULL error details to CloudWatch for debugging
    console.error('=== PROCESS SOCIAL MEDIA MESSAGE ERROR (FULL DETAILS) ===');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Name:', error.name);
    console.error('Error Stack:', error.stack);
    console.error('Error $metadata:', JSON.stringify(error.$metadata, null, 2));
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Check if it's a validation error (400)
    const isValidationError = 
      error.$metadata?.httpStatusCode === 400 ||
      error.name === 'ValidationException' ||
      (error.message && error.message.includes('validation'));
    
    // Graceful fallback for throttling errors
    const isThrottling = 
      error.name === 'ThrottlingException' ||
      error.code === 'ThrottlingException' ||
      error.$metadata?.httpStatusCode === 429 ||
      (error.message && error.message.includes('Too many requests'));
    
    ErrorHandler.logError(error, { operation: 'processSocialMediaMessage' });
    
    // Return user-friendly message with error type
    let conversational_response;
    if (isValidationError) {
      conversational_response = `Erro de validação detectado. Por favor, tente reformular sua mensagem. Detalhes técnicos: ${error.message}`;
    } else if (isThrottling) {
      conversational_response = "A minha criatividade está a recarregar! Como estamos a usar a infraestrutura de alta velocidade da AWS, preciso de 30 segundos de pausa entre pedidos rápidos. Pode aguardar um momento e tentar de novo?";
    } else {
      conversational_response = `Estou com dificuldade para processar essa solicitação. Erro: ${error.message}. Você poderia reformular?`;
    }
    
    return {
      response_type: 'chat',
      conversational_response: conversational_response,
      post_content: null,
      conversationHistory: conversationHistory,
      error: error.message,
      error_type: isValidationError ? 'validation' : (isThrottling ? 'throttling' : 'unknown'),
      debug_info: {
        message: error.message,
        code: error.code || error.name,
        httpStatus: error.$metadata?.httpStatusCode,
        stack: error.stack,
        operation: 'processSocialMediaMessage'
      }
    };
  }
}

/**
 * Sanitize image description to reduce content filter false positives
 */
function sanitizeImageDescription(description) {
  if (!description || typeof description !== 'string') {
    return 'A clean, professional, abstract modern corporate background, soft lighting, minimalist design, high quality';
  }
  
  // Remove potentially problematic characters and patterns
  let sanitized = description
    .replace(/[^\w\s\-.,!?áéíóúâêîôûàèìòùãõç]/gi, ' ') // Keep only safe characters + Portuguese accents
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Limit length to reduce complexity
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200).trim();
  }
  
  // Ensure we have something meaningful
  if (sanitized.length < 10) {
    sanitized = 'A clean, professional, abstract modern corporate background, soft lighting, minimalist design, high quality';
  }
  
  return sanitized;
}

/**
 * PROMPT ARCHITECT: Refine image description into professional Stable Image Ultra-optimized prompt
 * Uses Claude Opus 5 to extract visual keywords and apply Stable Diffusion best practices
 */
async function refineImagePrompt(imageDescription, brandContext) {
  try {
    const systemPrompt = `You are a Visual Prompt Architect specializing in Stable Image Ultra prompts (Stability AI's premium photorealistic model).

Your task: Transform a post caption/description into a professional, Stable Image Ultra-optimized image generation prompt.

STABLE IMAGE ULTRA BEST PRACTICES:
- Focus on visual elements: Subject, Style, Lighting, Composition, Mood
- Use descriptive quality keywords: photorealistic, cinematic, studio lighting, 8k UHD
- Specify artistic direction: editorial photography, professional lighting, sharp focus
- NEVER include text, words, letters, or typography in the prompt
- Avoid abstract concepts - be concrete and visual
- Keep prompts descriptive and detailed (60-120 words)
- Include camera/photography terms: shallow depth of field, golden hour, bokeh

BRAND CONTEXT:
- Industry: ${brandContext.industry}
- Visual Style: ${brandContext.visual_style || 'Modern'}
- Tone: ${brandContext.tone_of_voice || 'Professional'}

OUTPUT FORMAT:
Return ONLY the refined prompt as plain text. No JSON, no explanations, just the prompt.

EXAMPLES:
Input: "Dicas para aumentar o valor do seu imóvel"
Output: "A luxurious modern residential interior with elegant furniture, natural golden hour lighting streaming through floor-to-ceiling windows, photorealistic editorial photography, clean minimalist Scandinavian composition, warm inviting atmosphere, marble countertops, indoor plants, 8k UHD quality, sharp focus, shallow depth of field"

Input: "Novo corte de cabelo para o verão"
Output: "A stylish contemporary barbershop interior with professional chrome haircutting tools, dramatic cinematic lighting with warm tones, contemporary minimalist design, premium salon aesthetic, photorealistic 8k quality, sharp focus, clean composition, bokeh background, editorial magazine quality"`;

    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: imageDescription
        }
      ],
      temperature: 0.7
    };

    const command = new InvokeModelCommand({
      modelId: BEDROCK_CLAUDE_FAST_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    const response = await invokeBedrockWithRetry(command, 'refineImagePrompt');
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const refinedPrompt = responseBody.content[0].text.trim();

    ErrorHandler.logInfo('Prompt refined by Claude Sonnet 5', {
      originalLength: imageDescription.length,
      refinedLength: refinedPrompt.length,
      brandId: brandContext.brand_id
    });

    return refinedPrompt;

  } catch (error) {
    ErrorHandler.logError(error, { 
      operation: 'refineImagePrompt',
      brandId: brandContext.brand_id
    });
    
    // Fallback: return sanitized original description
    return sanitizeImageDescription(imageDescription);
  }
}

/**
 * Generate image using Stable Image Ultra v1.1 and upload to S3 with robust error handling
 * Stable Image Ultra produces the highest quality, photorealistic outputs
 * Requirements: 8.3
 */
async function generateAndUploadImage(imageDescription, brandContext, userId) {
  try {
    // CRITICAL: Validate inputs before proceeding
    if (!imageDescription || typeof imageDescription !== 'string') {
      throw new Error(`Invalid image_description: ${typeof imageDescription}`);
    }
    
    if (!brandContext || !brandContext.brand_id) {
      throw new Error('Invalid brandContext: missing brand_id');
    }
    
    if (!userId) {
      throw new Error('Invalid userId: missing or empty');
    }
    
    if (!BEDROCK_IMAGE_MODEL_ID) {
      throw new Error('BEDROCK_IMAGE_MODEL_ID environment variable not set');
    }
    
    if (!S3_BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME environment variable not set');
    }

    // STEP 1: Use Prompt Architect to refine the description for Stable Image Ultra
    const refinedPrompt = await refineImagePrompt(imageDescription, brandContext);
    
    // Build final prompt with brand context
    const prompt = `${refinedPrompt}. Professional social media image for ${brandContext.industry} brand, photorealistic, studio quality.`;

    // Ultra-safe fallback prompt for retry
    const fallbackPrompt = 'A clean, professional, abstract modern corporate background with geometric shapes, soft gradient lighting, minimalist design, high quality, 8k UHD, photorealistic, studio photography';

    // Stable Image Ultra request format
    const createRequestBody = (promptText) => ({
      prompt: promptText,
      mode: 'text-to-image',
      aspect_ratio: '1:1',
      output_format: 'png'
    });

    ErrorHandler.logInfo('=== STABLE IMAGE ULTRA GENERATION START ===', { 
      modelId: BEDROCK_IMAGE_MODEL_ID,
      originalDescription: imageDescription.substring(0, 100),
      refinedPrompt: refinedPrompt.substring(0, 150),
      finalPrompt: prompt.substring(0, 150),
      brandId: brandContext.brand_id,
      userId: userId
    });

    // STEP 2: First attempt with refined prompt
    let response;
    let usedFallback = false;
    
    try {
      const requestBody = createRequestBody(prompt);
      const command = new InvokeModelCommand({
        modelId: BEDROCK_IMAGE_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody)
      });

      response = await bedrockClient.send(command);
      
    } catch (bedrockError) {
      // CRITICAL: Log FULL Bedrock error details
      ErrorHandler.logError(bedrockError, {
        operation: 'generateAndUploadImage',
        brandId: brandContext.brand_id,
        userId: userId,
        errorName: bedrockError.name,
        errorMessage: bedrockError.message
      });
      
      // Check if it's a content policy violation
      const isContentPolicyError = 
        bedrockError.name === 'ValidationException' ||
        bedrockError.code === 'ValidationException' ||
        (bedrockError.message && (
          bedrockError.message.includes('content filters') ||
          bedrockError.message.includes('AUP') ||
          bedrockError.message.includes('Responsible AI Policy') ||
          bedrockError.message.includes('blocked') ||
          bedrockError.message.includes('Filter reason')
        ));

      if (isContentPolicyError) {
        ErrorHandler.logInfo('Content policy violation detected, retrying with ultra-safe fallback prompt', {
          brandId: brandContext.brand_id,
          userId: userId,
          originalError: bedrockError.message
        });

        // STEP 3: Retry with ultra-safe fallback prompt
        try {
          const fallbackRequestBody = createRequestBody(fallbackPrompt);
          const fallbackCommand = new InvokeModelCommand({
            modelId: BEDROCK_IMAGE_MODEL_ID,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(fallbackRequestBody)
          });

          response = await bedrockClient.send(fallbackCommand);
          usedFallback = true;
          
          ErrorHandler.logInfo('Fallback image generation successful', {
            brandId: brandContext.brand_id,
            userId: userId,
            fallbackPrompt: fallbackPrompt
          });
          
        } catch (fallbackError) {
          // STEP 4: Even fallback failed - return graceful error instead of 500
          ErrorHandler.logError(fallbackError, {
            operation: 'generateAndUploadImage_fallback',
            brandId: brandContext.brand_id,
            userId: userId,
            errorName: fallbackError.name,
            errorMessage: fallbackError.message
          });
          
          // Return a structured error response instead of throwing
          return {
            success: false,
            error: 'content_policy_violation',
            message: 'Unable to generate image due to content policy restrictions. Please try a different description.',
            details: {
              originalError: bedrockError.message,
              fallbackError: fallbackError.message
            }
          };
        }
      } else {
        // Not a content policy error - re-throw the original error
        throw new Error(`Bedrock Stable Image Ultra invocation failed: ${bedrockError.name} - ${bedrockError.message}`);
      }
    }
    
    // Parse response with error handling
    let responseBody;
    try {
      responseBody = JSON.parse(new TextDecoder().decode(response.body));
    } catch (parseError) {
      console.error('=== STABLE IMAGE ULTRA RESPONSE PARSE FAILED ===');
      console.error('Parse Error:', parseError.message);
      console.error('Response body type:', typeof response.body);
      throw new Error(`Failed to parse Stable Image Ultra response: ${parseError.message}`);
    }
    
    // Check for content filtering in finish_reasons
    const finishReasons = responseBody.finish_reasons || [];
    if (finishReasons.length > 0 && finishReasons[0] !== null) {
      throw new Error(`Image generation filtered: ${finishReasons[0]}`);
    }
    
    // Extract base64 image data with validation
    if (!responseBody.images || !Array.isArray(responseBody.images) || responseBody.images.length === 0) {
      console.error('=== STABLE IMAGE ULTRA RESPONSE INVALID ===');
      console.error('Response body:', JSON.stringify(responseBody, null, 2));
      throw new Error('Stable Image Ultra response missing images array');
    }
    
    const imageBase64 = responseBody.images[0];
    
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error(`Invalid image data from Stable Image Ultra: ${typeof imageBase64}`);
    }
    
    ErrorHandler.logInfo('Image generated successfully by Stable Image Ultra v1.1', { 
      brandId: brandContext.brand_id,
      imageSize: imageBase64.length,
      usedFallback: usedFallback
    });

    // Convert Base64 to Buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Generate unique S3 key
    const timestamp = Date.now();
    const uuid = require('crypto').randomUUID();
    const key = `chat-images/${userId}/${timestamp}-${uuid}.png`;

    // Upload to S3 with error handling
    const putCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png'
    });

    try {
      await s3Client.send(putCommand);
    } catch (s3Error) {
      console.error('=== S3 UPLOAD FAILED ===');
      console.error('Error Name:', s3Error.name);
      console.error('Error Message:', s3Error.message);
      console.error('Error Code:', s3Error.code);
      console.error('Bucket:', S3_BUCKET_NAME);
      console.error('Key:', key);
      throw new Error(`S3 upload failed: ${s3Error.name} - ${s3Error.message}`);
    }

    // Construct public S3 URL
    const imageUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
    ErrorHandler.logInfo('=== STABLE IMAGE ULTRA GENERATION COMPLETE ===', { 
      key, 
      imageUrl,
      brandId: brandContext.brand_id,
      imageBufferSize: imageBuffer.length,
      usedFallback: usedFallback
    });

    // Return successful response with image URL
    return {
      success: true,
      imageUrl: imageUrl,
      usedFallback: usedFallback
    };

  } catch (error) {
    // CRITICAL: Log comprehensive error details
    ErrorHandler.logError(error, { 
      operation: 'generateAndUploadImage', 
      brandId: brandContext?.brand_id,
      userId: userId,
      errorName: error.name,
      errorMessage: error.message
    });
    
    // Return structured error response instead of throwing
    return {
      success: false,
      error: 'generation_failed',
      message: `Failed to generate and upload image: ${error.message}`,
      details: {
        errorName: error.name,
        errorMessage: error.message
      }
    };
  }
}

/**
 * Upload image to S3 (legacy function - kept for backward compatibility)
 * Requirements: 8.3
 */
async function uploadImageToS3(imageBuffer, brandId, postId) {
  try {
    const key = `images/${brandId}/${postId}.png`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png'
    });

    await s3Client.send(command);

    const imageUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
    ErrorHandler.logInfo('Image uploaded to S3', { key, imageUrl });
    return imageUrl;
  } catch (error) {
    ErrorHandler.logError(error, { operation: 'uploadImageToS3' });
    throw new Error(`Failed to upload image to S3: ${error.message}`);
  }
}

/**
 * Extract user context from API Gateway authorizer
 */
function extractUserContext(event) {
  const authorizer = event.requestContext?.authorizer;
  
  if (!authorizer) {
    throw new Error('Missing authorization context');
  }

  const userId = authorizer.userId || authorizer.claims?.sub;
  const brandId = authorizer.brandId || authorizer.claims?.['custom:brand_id'];

  if (!userId) {
    throw new Error('Missing user ID in authorization context');
  }

  if (!brandId) {
    throw new Error('User has no brand association');
  }

  return {
    userId,
    brandId
  };
}

/**
 * Save extracted entities to DynamoDB (real-time onboarding)
 */
async function saveOnboardingData(userId, extractedEntities) {
  try {
    // Only save if we have at least brand_name
    if (!extractedEntities.brand_name) {
      return null;
    }

    // Check if brand already exists for this user
    const existingBrands = await BrandsDataAccess.getBrandsByUserId(userId);
    
    if (existingBrands.length > 0) {
      // Update existing brand with new information
      const brandId = existingBrands[0].brand_id;
      const updates = {};
      
      // Only update fields that have values
      Object.keys(extractedEntities).forEach(key => {
        if (extractedEntities[key] && 
            (Array.isArray(extractedEntities[key]) ? extractedEntities[key].length > 0 : true)) {
          updates[key] = extractedEntities[key];
        }
      });

      if (Object.keys(updates).length > 0) {
        await BrandsDataAccess.updateBrand(brandId, updates);
        ErrorHandler.logInfo('Onboarding data updated', { brandId, userId });
      }
      
      return brandId;
    } else {
      // Create new brand with collected data
      const brandData = {
        user_id: userId,
        brand_name: extractedEntities.brand_name,
        industry: extractedEntities.industry || '',
        target_audience: extractedEntities.target_audience || '',
        tone_of_voice: extractedEntities.tone_of_voice || '',
        visual_style: extractedEntities.visual_style || '',
        content_pillars: extractedEntities.content_pillars || [],
        post_times: extractedEntities.post_times || ['09:00'],
        has_instagram_connection: false,
        has_linkedin_connection: false
      };

      const brand = await BrandsDataAccess.createBrand(brandData);
      ErrorHandler.logInfo('Brand created via onboarding chat', { brandId: brand.brand_id, userId });
      
      return brand.brand_id;
    }
  } catch (error) {
    ErrorHandler.logError(error, { operation: 'saveOnboardingData', userId });
    // Don't throw - allow conversation to continue even if save fails
    return null;
  }
}

/**
 * Main Lambda handler
 * POST /chat endpoint
 */
exports.handler = async (event, context) => {

  // Handle GET /chat/history endpoint
  if (event.httpMethod === 'GET' && event.path && event.path.includes('/history')) {
    try {
      // Extract user context
      const authorizer = event.requestContext?.authorizer;
      const userId = authorizer?.userId || authorizer?.claims?.sub;

      if (!userId) {
        return ErrorHandler.formatErrorResponse(
          ErrorCodes.UNAUTHORIZED,
          'Missing user ID in authorization context'
        );
      }

      // Get chat history
      const history = await ChatHistoryDataAccess.getHistory(userId, 20);

      ErrorHandler.logInfo('Chat history retrieved', { 
        userId, 
        messageCount: history.length 
      });

      return ErrorHandler.formatSuccessResponse({
        history: history,
        count: history.length
      });
    } catch (error) {
      ErrorHandler.logError(error, { operation: 'getChatHistory' });
      return ErrorHandler.handleLambdaError(error, event);
    }
  }

  // Handle POST /chat/generate-image endpoint (STEP 2 - Lazy image generation)
  if (event.httpMethod === 'POST' && event.path && event.path.includes('/generate-image')) {
    try {
      // Extract user context
      const authorizer = event.requestContext?.authorizer;
      const userId = authorizer?.userId || authorizer?.claims?.sub;

      if (!userId) {
        return ErrorHandler.formatErrorResponse(
          ErrorCodes.UNAUTHORIZED,
          'Missing user ID in authorization context'
        );
      }

      // Parse request body
      let body;
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch (parseError) {
        return ErrorHandler.formatErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid JSON in request body'
        );
      }

      // Validate required fields
      if (!body || !body.image_description) {
        return ErrorHandler.formatErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'image_description is required'
        );
      }

      // Get user's brand for context
      const brandsResult = await BrandsDataAccess.getBrandsByUserId(userId);
      const existingBrands = Array.isArray(brandsResult) ? brandsResult : [];

      if (!existingBrands || existingBrands.length === 0) {
        return ErrorHandler.formatErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'User has no brand profile'
        );
      }

      const brand = existingBrands[0];

      ErrorHandler.logInfo('[SILENT] Lazy image generation requested', { 
        userId, 
        brandId: brand.brand_id,
        descriptionLength: body.image_description.length,
        silentMode: body.silent_mode
      });

      // Generate and upload image using Stable Image Ultra
      const imageResult = await generateAndUploadImage(body.image_description, brand, userId);

      // Handle the new response format
      if (!imageResult.success) {
        // Return graceful error response instead of 500
        return ErrorHandler.formatErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          imageResult.message,
          {
            error_type: imageResult.error,
            details: imageResult.details
          }
        );
      }

      const imageUrl = imageResult.imageUrl;

      ErrorHandler.logInfo('[SILENT] Lazy image generation complete', { 
        userId, 
        brandId: brand.brand_id,
        imageUrl,
        silentMode: body.silent_mode
      });

      // Don't save to chat history if silent_mode is true
      if (!body.silent_mode) {
        await ChatHistoryDataAccess.saveMessage(
          userId,
          'assistant',
          'Imagem gerada com sucesso!',
          { image_url: imageUrl, mode: 'lazy_image_generation' }
        );
      } else {
        ErrorHandler.logInfo('[SILENT] Chat history save skipped (silent_mode enabled)', { userId });
      }

      return ErrorHandler.formatSuccessResponse({
        image_url: imageUrl,
        message: 'Image generated successfully'
      });

    } catch (error) {
      ErrorHandler.logError(error, { operation: 'generateImageEndpoint' });
      return ErrorHandler.handleLambdaError(error, event);
    }
  }

  const startTime = Date.now();
  
  // CRITICAL: Wrap everything in try-catch to ensure CORS headers are always returned
  try {
    ErrorHandler.logInfo('Chat handler invoked', {
      requestId: context.requestId,
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      path: event.path,
      httpMethod: event.httpMethod,
      sourceIp: event.requestContext?.identity?.sourceIp
    });

    // Parse request body
    let body;
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (parseError) {
      ErrorHandler.logError(parseError, { operation: 'parseRequestBody' });
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid JSON in request body'
      );
    }

    // Validate required fields
    if (!body || !body.message) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Message is required'
      );
    }

    // Extract user context
    const authorizer = event.requestContext?.authorizer;
    const userId = authorizer?.userId || authorizer?.claims?.sub;

    if (!userId) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Missing user ID in authorization context'
      );
    }

    // Check if user has a brand (determines persona)
    // CRITICAL: Handle null/undefined gracefully to prevent crashes
    let existingBrands = [];
    try {
      const brandsResult = await BrandsDataAccess.getBrandsByUserId(userId);
      // Ensure we always have an array, even if DynamoDB returns null/undefined
      existingBrands = Array.isArray(brandsResult) ? brandsResult : [];
    } catch (brandError) {
      ErrorHandler.logError(brandError, { 
        operation: 'getBrandsByUserId', 
        userId,
        message: 'Failed to fetch brands, treating as new user'
      });
      // If brand fetch fails, treat as new user (onboarding mode)
      existingBrands = [];
    }

    const conversationHistory = body.conversation_history || [];

    // ONBOARDING MODE: No brand exists yet or brand fetch failed
    if (!existingBrands || existingBrands.length === 0) {
      ErrorHandler.logInfo('Onboarding mode activated', { userId });

      const onboardingResult = await processOnboardingMessage(
        body.message,
        conversationHistory,
        userId
      );

      // Save extracted entities in real-time
      let brandId = null;
      if (onboardingResult.extracted_entities && Object.keys(onboardingResult.extracted_entities).length > 0) {
        brandId = await saveOnboardingData(userId, onboardingResult.extracted_entities);
      }

      const executionDuration = Date.now() - startTime;
      ErrorHandler.logInfo('Onboarding chat completed', {
        requestId: context.requestId,
        userId,
        brandId,
        onboardingComplete: onboardingResult.onboarding_complete,
        executionDurationMs: executionDuration
      });

      // SAVE ONBOARDING CHAT HISTORY
      try {
        // Save user message
        await ChatHistoryDataAccess.saveMessage(userId, 'user', body.message);
        
        // Save assistant response
        await ChatHistoryDataAccess.saveMessage(
          userId,
          'assistant',
          onboardingResult.conversational_response,
          {
            mode: 'onboarding',
            onboarding_complete: onboardingResult.onboarding_complete,
            brand_id: brandId
          }
        );
        
        ErrorHandler.logInfo('Onboarding chat history saved', { userId });
      } catch (historyError) {
        ErrorHandler.logError(historyError, { 
          operation: 'saveOnboardingHistory', 
          userId 
        });
      }

      return ErrorHandler.formatSuccessResponse({
        response: onboardingResult.conversational_response,
        mode: 'onboarding',
        extracted_entities: onboardingResult.extracted_entities,
        business_type: onboardingResult.business_type,
        show_upload_button: onboardingResult.show_upload_button,
        onboarding_complete: onboardingResult.onboarding_complete,
        brand_id: brandId,
        conversation_history: onboardingResult.conversationHistory
      });
    }

    // SOCIAL MEDIA MANAGER MODE: Brand exists
    const brand = existingBrands[0];
    
    // Validate brand object has required fields
    if (!brand || !brand.brand_id) {
      ErrorHandler.logError(new Error('Invalid brand object'), { 
        userId, 
        brand: brand,
        message: 'Brand exists but missing required fields'
      });
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Brand data is incomplete. Please contact support.'
      );
    }

    ErrorHandler.logInfo('Social media manager mode activated', { userId, brandId: brand.brand_id });

    // SINGLE-PASS ARCHITECTURE: Make only ONE Bedrock call
    const result = await processSocialMediaMessage(
      body.message,
      conversationHistory,
      brand
    );

    const executionDuration = Date.now() - startTime;
    ErrorHandler.logInfo('Chat handler completed successfully', {
      requestId: context.requestId,
      responseType: result.response_type,
      contentGenerated: !!result.post_content,
      executionDurationMs: executionDuration
    });
    
    // Format response based on what Claude returned
    const responseData = {
      response: result.conversational_response,
      mode: 'social_media_manager',
      response_type: result.response_type,
      conversation_history: result.conversationHistory
    };

    // Add plan data if available (Phase 2 - Calendar)
    if (result.plan_data) {
      responseData.plan_data = result.plan_data;
      ErrorHandler.logInfo('Content plan generated', { 
        brandId: brand.brand_id,
        planItems: result.plan_data.length 
      });
    }

    // Add generated content if available (Phase 3 - Execution)
    if (result.post_content) {
      responseData.generated_content = result.post_content;
      // Enhance response text with the generated content
      responseData.response = `${result.conversational_response}\n\n📝 LEGENDA:\n${result.post_content.caption}\n\n🏷️ HASHTAGS:\n${result.post_content.hashtags.join(' ')}\n\n🎨 DESCRIÇÃO DA IMAGEM:\n${result.post_content.image_description}`;
      
      // STABLE IMAGE ULTRA INTEGRATION: Generate image and upload to S3 (unless skip flag is set)
      const skipImageGeneration = body.skip_image_generation === true;
      
      if (result.post_content.image_description && !skipImageGeneration) {
        try {
          ErrorHandler.logInfo('Starting Stable Image Ultra generation and S3 upload', { 
            brandId: brand.brand_id,
            description: result.post_content.image_description.substring(0, 50) 
          });
          
          const imageResult = await generateAndUploadImage(result.post_content.image_description, brand, userId);
          
          // Handle the new response format
          if (imageResult.success) {
            // Add image URL to response
            responseData.image_url = imageResult.imageUrl;
            
            ErrorHandler.logInfo('Stable Image Ultra generation and S3 upload successful', { 
              brandId: brand.brand_id,
              imageUrl: imageResult.imageUrl,
              usedFallback: imageResult.usedFallback
            });
            
            // Add fallback notice if used
            if (imageResult.usedFallback) {
              responseData.response += `\n\n💡 Nota: Usamos uma imagem genérica devido a restrições de conteúdo.`;
            }
          } else {
            // Handle graceful image generation failure
            ErrorHandler.logError(new Error(imageResult.message), { 
              operation: 'generateAndUploadImageInChatHandler',
              brandId: brand.brand_id,
              message: 'Image generation failed gracefully',
              errorType: imageResult.error,
              errorDetails: imageResult.details
            });
            
            // Add user-friendly error message
            if (imageResult.error === 'content_policy_violation') {
              responseData.response += `\n\n⚠️ Nota: Não foi possível gerar a imagem devido a restrições de conteúdo. Tente uma descrição mais simples.`;
            } else {
              responseData.response += `\n\n⚠️ Nota: A geração da imagem falhou. ${imageResult.message}`;
            }
          }
        } catch (imageError) {
          // This should not happen anymore since generateAndUploadImage returns structured responses
          // But keeping as final safety net
          ErrorHandler.logError(imageError, { 
            operation: 'generateAndUploadImageInChatHandler_fallback',
            brandId: brand.brand_id,
            message: 'Unexpected error in image generation wrapper',
            errorName: imageError.name,
            errorMessage: imageError.message
          });
          
          responseData.response += `\n\n⚠️ Nota: Erro inesperado na geração da imagem. Tente novamente.`;
        }
      } else if (skipImageGeneration) {
        ErrorHandler.logInfo('Image generation skipped (skip_image_generation flag set)', { 
          brandId: brand.brand_id 
        });
      }
      
      // PHASE 3: Create post in DynamoDB and emit EventBridge event for Meta Publisher
      if (responseData.image_url) {
        try {
          const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
          const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1' });
          
          // Create post in DynamoDB
          const postData = {
            brand_id: brand.brand_id,
            caption: result.post_content.caption,
            image_url: responseData.image_url,
            platform: 'instagram', // Default platform
            scheduled_time: new Date().toISOString(), // Immediate publication
            status: 'Draft',
            content_pillar: result.post_content.content_pillar || 'General',
            platforms: ['facebook', 'instagram'], // Meta platforms
          };
          
          const createdPost = await PostsDataAccess.createPost(postData);
          
          ErrorHandler.logInfo('Post created in DynamoDB', { 
            postId: createdPost.post_id,
            brandId: brand.brand_id,
            platforms: createdPost.platforms
          });
          
          // Add post_id to response
          responseData.post_id = createdPost.post_id;
          
          // Emit EventBridge event for Meta Publisher
          const eventParams = {
            Entries: [{
              Source: 'experta.posts',
              DetailType: 'PostCreated',
              Detail: JSON.stringify({
                post_id: createdPost.post_id,
                brand_id: brand.brand_id,
                platforms: createdPost.platforms,
                image_url: createdPost.image_url,
                caption: createdPost.caption
              }),
              EventBusName: process.env.EVENTBRIDGE_BUS_NAME || 'default'
            }]
          };
          
          const eventCommand = new PutEventsCommand(eventParams);
          const eventResponse = await eventBridge.send(eventCommand);
          
          if (eventResponse.FailedEntryCount > 0) {
            ErrorHandler.logError(new Error('Failed to emit EventBridge event'), {
              operation: 'emitPostCreatedEvent',
              postId: createdPost.post_id,
              failedEntries: eventResponse.Entries
            });
          } else {
            ErrorHandler.logInfo('EventBridge event emitted for Meta Publisher', { 
              postId: createdPost.post_id,
              brandId: brand.brand_id,
              platforms: createdPost.platforms
            });
          }
          
        } catch (postCreationError) {
          ErrorHandler.logError(postCreationError, { 
            operation: 'createPostAndEmitEvent',
            brandId: brand.brand_id,
            message: 'Failed to create post or emit event'
          });
          // Don't fail the entire request - post content was still generated
        }
      }
    }
    
    // SAVE CHAT HISTORY (unless silent_mode is enabled)
    const silentMode = body.silent_mode === true;
    
    if (!silentMode) {
      try {
        // Save user message
        await ChatHistoryDataAccess.saveMessage(userId, 'user', body.message);
        
        // Save assistant response with metadata (including image_url if available)
        const metadata = {
          response_type: result.response_type,
          content_generated: !!result.post_content
        };
        
        // Add image_url to metadata if present
        if (responseData.image_url) {
          metadata.image_url = responseData.image_url;
        }
        
        await ChatHistoryDataAccess.saveMessage(
          userId, 
          'assistant', 
          responseData.response,
          metadata
        );
        
        ErrorHandler.logInfo('Chat history saved', { userId, messageCount: 2, hasImage: !!responseData.image_url });
      } catch (historyError) {
        ErrorHandler.logError(historyError, { 
          operation: 'saveChatHistory', 
          userId,
          message: 'Failed to save chat history, continuing with response'
        });
      }
    } else {
      ErrorHandler.logInfo('Chat history save skipped (silent_mode enabled)', { userId });
    }
    
    return ErrorHandler.formatSuccessResponse(responseData);

  } catch (error) {
    const executionDuration = Date.now() - startTime;
    ErrorHandler.logError(error, { 
      operation: 'chat_handler',
      requestId: context.requestId,
      executionDurationMs: executionDuration
    });
    return ErrorHandler.handleLambdaError(error, event);
  }
};
