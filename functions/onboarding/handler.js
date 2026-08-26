/**
 * Onboarding Handler Lambda Function (Enhanced - Phase 2)
 * 
 * Handles brand onboarding through conversational AI interface with multi-entity extraction
 * POST /onboarding/message - Process conversational messages
 * POST /brands - Create brand after onboarding completion
 * 
 * Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 18.1, 18.2, 18.3, 18.4, 18.5
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Import shared libraries from Lambda Layer
const { BrandsDataAccess } = require('/opt/nodejs/db/brands');
const { publishEvent } = require('/opt/nodejs/events/eventbridge-client');
const { ErrorHandler, ErrorCodes } = require('/opt/nodejs/errors/error-handler');
const OnboardingSessionsDataAccess = require('/opt/nodejs/db/onboarding-sessions');

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const BEDROCK_MODEL_ID = process.env.BEDROCK_CLAUDE_MODEL_ID || 'global.anthropic.claude-opus-5';
const EVENTBRIDGE_BUS_NAME = process.env.EVENTBRIDGE_BUS_NAME || 'default';

/**
 * Validate brand data completeness
 * Requirements: 1.2, 1.3, 1.4
 */
function validateBrandData(brandData) {
  const requiredFields = OnboardingSessionsDataAccess.REQUIRED_FIELDS;

  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!brandData[field]) {
      missingFields.push(field);
    }
  }

  // Validate content_pillars has at least 3 items
  if (brandData.content_pillars && (!Array.isArray(brandData.content_pillars) || brandData.content_pillars.length < 3)) {
    throw new Error('content_pillars must be an array with at least 3 items');
  }

  // Validate post_times is an array
  if (brandData.post_times && !Array.isArray(brandData.post_times)) {
    throw new Error('post_times must be an array');
  }

  // Validate post_times format (HH:MM)
  if (brandData.post_times) {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    for (const time of brandData.post_times) {
      if (!timeRegex.test(time)) {
        throw new Error(`Invalid time format: ${time}. Expected HH:MM format (e.g., "09:00")`);
      }
    }
  }

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  return true;
}

/**
 * Process brand data with Claude for multi-entity extraction
 * Requirements: 1.1, 1.5, 17.1, 17.2, 17.3, 17.4, 17.5
 */
async function processWithClaude(userMessage, session) {
  try {
    // Build conversation messages
    const messages = [
      ...session.conversation_history,
      {
        role: 'user',
        content: userMessage
      }
    ];

    // Enhanced system prompt for multi-entity extraction
    // Requirements: 17.1, 17.2
    const systemPrompt = `You are Experta, an AI social media manager assistant helping brands get onboarded. 

Your goal is to collect the following information through natural conversation:
1. brand_name - The name of the brand
2. industry - The industry or sector (e.g., "technology", "fashion", "food & beverage")
3. target_audience - Description of the target audience (e.g., "young professionals aged 25-35")
4. tone_of_voice - Communication style (e.g., "professional", "casual", "friendly", "authoritative")
5. visual_style - Visual aesthetic preferences (e.g., "minimalist", "vibrant", "corporate", "artistic")
6. content_pillars - At least 3 thematic categories for content (e.g., ["product features", "customer stories", "industry insights"])
7. post_times - Preferred posting times in HH:MM format (e.g., ["09:00", "15:00", "18:00"])

IMPORTANT INSTRUCTIONS:
- Extract ALL entities present in the user's message, even if they provide multiple pieces of information at once
- Be conversational, friendly, and helpful
- Ask clarifying questions ONLY for missing or unclear information
- Do NOT ask for social media tokens or API credentials
- When you have extracted entities, respond with a JSON object in this format:

{
  "extracted_entities": {
    "brand_name": "value or null",
    "industry": "value or null",
    "target_audience": "value or null",
    "tone_of_voice": "value or null",
    "visual_style": "value or null",
    "content_pillars": ["array of values"] or null,
    "post_times": ["array of times"] or null
  },
  "conversational_response": "Your friendly response to the user",
  "clarifying_questions": ["array of questions for missing fields"] or []
}

Current progress:
- Completed fields: ${session.completed_fields.join(', ') || 'none'}
- Pending fields: ${session.pending_fields.join(', ')}
- Completion: ${session.completion_percentage}%

Extract entities from the user's message and update the conversational_response accordingly.`;

    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages,
      temperature: 0.7
    };

    const command = new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      response: responseBody.content[0].text,
      conversationHistory: messages
    };
  } catch (error) {
    ErrorHandler.logError(error, { operation: 'processWithClaude' });
    throw new Error(`Failed to process with Claude: ${error.message}`);
  }
}

/**
 * Extract structured entities from Claude's response
 * Requirements: 17.1, 17.2
 */
function extractEntities(claudeResponse) {
  try {
    // Look for JSON in the response
    const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return data;
    }
    return null;
  } catch (error) {
    ErrorHandler.logError(error, { operation: 'extractEntities' });
    return null;
  }
}

/**
 * Merge extracted entities with existing session data
 * Requirements: 17.2, 18.3
 */
function mergeExtractedData(existingData, extractedEntities) {
  const merged = { ...existingData };
  
  if (!extractedEntities) {
    return merged;
  }
  
  // Merge each field if it has a value
  for (const [key, value] of Object.entries(extractedEntities)) {
    if (value !== null && value !== undefined) {
      // For arrays, only update if not empty
      if (Array.isArray(value) && value.length > 0) {
        merged[key] = value;
      } else if (!Array.isArray(value) && value !== '') {
        merged[key] = value;
      }
    }
  }
  
  return merged;
}

/**
 * Update completed and pending fields based on extracted data
 * Requirements: 17.6, 18.3
 */
function updateFieldStatus(extractedData) {
  const completed = [];
  const pending = [];
  
  for (const field of OnboardingSessionsDataAccess.REQUIRED_FIELDS) {
    const value = extractedData[field];
    
    if (value !== null && value !== undefined) {
      // Check if it's a valid value
      if (Array.isArray(value) && value.length > 0) {
        completed.push(field);
      } else if (!Array.isArray(value) && value !== '') {
        completed.push(field);
      } else {
        pending.push(field);
      }
    } else {
      pending.push(field);
    }
  }
  
  return { completed, pending };
}

/**
 * Handle conversational onboarding message
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 18.1, 18.2, 18.3
 */
async function handleConversationalMessage(user_id, message) {
  // Get or create session
  let session = await OnboardingSessionsDataAccess.getActiveSessionByUserId(user_id);
  
  if (!session) {
    // Create new session
    // Requirements: 18.1
    session = await OnboardingSessionsDataAccess.createSession(user_id);
    ErrorHandler.logInfo('Created new onboarding session', { session_id: session.session_id, user_id });
  }
  
  // Process message with Claude for entity extraction
  // Requirements: 17.1, 17.2
  const claudeResult = await processWithClaude(message, session);
  
  // Extract entities from Claude's response
  const extractionResult = extractEntities(claudeResult.response);
  
  let conversationalResponse = claudeResult.response;
  let extractedEntities = null;
  
  if (extractionResult) {
    extractedEntities = extractionResult.extracted_entities || null;
    conversationalResponse = extractionResult.conversational_response || claudeResult.response;
  }
  
  // Merge extracted entities with existing data
  // Requirements: 17.2, 18.3
  const updatedExtractedData = mergeExtractedData(session.extracted_data, extractedEntities);
  
  // Update field status
  // Requirements: 17.6, 18.3
  const { completed, pending } = updateFieldStatus(updatedExtractedData);
  
  // Calculate completion percentage
  // Requirements: 17.6
  const completionPercentage = OnboardingSessionsDataAccess.calculateCompletionPercentage(completed);
  
  // Update conversation history
  const updatedHistory = [
    ...claudeResult.conversationHistory,
    {
      role: 'assistant',
      content: conversationalResponse
    }
  ];
  
  // Update session in DynamoDB
  // Requirements: 18.2, 18.3
  const updatedSession = await OnboardingSessionsDataAccess.updateSession(session.session_id, {
    conversation_history: updatedHistory,
    extracted_data: updatedExtractedData,
    completed_fields: completed,
    pending_fields: pending,
    completion_percentage: completionPercentage,
    conversation_state: completionPercentage === 100 ? 'ready_to_complete' : 'collecting_info'
  });
  
  return {
    session_id: updatedSession.session_id,
    response: conversationalResponse,
    extracted_data: updatedExtractedData,
    completed_fields: completed,
    pending_fields: pending,
    completion_percentage: completionPercentage,
    is_complete: completionPercentage === 100
  };
}

/**
 * Main Lambda handler
 * POST /onboarding/message - Process conversational messages
 * POST /brands - Create brand after onboarding completion
 */
exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    ErrorHandler.logInfo('Onboarding handler invoked', {
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
    } catch (error) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid JSON in request body'
      );
    }

    // Extract user_id from Cognito authorizer context
    const user_id = event.requestContext?.authorizer?.claims?.sub;
    if (!user_id) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.UNAUTHORIZED,
        'User ID not found in authorization context'
      );
    }

    // Check if this is a conversational message or final brand submission
    if (event.path && event.path.includes('/onboarding/message')) {
      // Conversational onboarding flow with multi-entity extraction
      // Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 18.1, 18.2, 18.3
      
      if (!body.message) {
        return ErrorHandler.formatErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Message field is required'
        );
      }
      
      const result = await handleConversationalMessage(user_id, body.message);
      
      return ErrorHandler.formatSuccessResponse(result);
    }

    // Direct brand creation (all data provided) - POST /brands
    // Requirements: 1.6, 1.7, 1.8, 1.9
    
    // Validate required fields
    try {
      validateBrandData(body);
    } catch (error) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.message
      );
    }

    // Prepare brand data for database
    // Phase 2: Tokens are NO LONGER collected or stored
    // Requirements: 1.9, 2.3, 16.6
    const brandData = {
      brand_name: body.brand_name,
      industry: body.industry,
      target_audience: body.target_audience,
      tone_of_voice: body.tone_of_voice,
      visual_style: body.visual_style,
      content_pillars: body.content_pillars,
      post_times: body.post_times,
      has_instagram_connection: false, // Will be set to true when OAuth connection is established
      has_linkedin_connection: false, // Will be set to true when OAuth connection is established
      onboarding_session_id: body.session_id || null,
      user_id
    };

    // Save brand to DynamoDB
    // Requirements: 1.6, 2.1, 2.2
    let brand;
    try {
      brand = await BrandsDataAccess.createBrand(brandData);
    } catch (error) {
      ErrorHandler.logError(error, { operation: 'createBrand' });
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to create brand'
      );
    }

    // Mark session as completed if session_id provided
    if (body.session_id) {
      try {
        await OnboardingSessionsDataAccess.completeSession(body.session_id, brand.brand_id);
      } catch (error) {
        // Log but don't fail - brand is already created
        ErrorHandler.logError(error, { operation: 'completeSession', session_id: body.session_id });
      }
    }

    // Publish BrandOnboardingComplete event to EventBridge
    // Requirements: 1.7, 10.1
    try {
      await publishEvent(
        'BrandOnboardingComplete',
        {
          brand_id: brand.brand_id,
          brand_name: brand.brand_name,
          user_id: brand.user_id,
          timestamp: new Date().toISOString()
        },
        EVENTBRIDGE_BUS_NAME
      );
      
      ErrorHandler.logInfo('BrandOnboardingComplete event published', {
        brand_id: brand.brand_id
      });
    } catch (error) {
      // Log error but don't fail the request - brand is already created
      ErrorHandler.logError(error, { 
        operation: 'publishEvent',
        brand_id: brand.brand_id 
      });
    }

    // Return success response with redirect to /connections
    // Requirements: 1.7, 1.8
    const executionDuration = Date.now() - startTime;
    ErrorHandler.logInfo('Onboarding handler completed successfully', {
      requestId: context.requestId,
      brand_id: brand.brand_id,
      executionDurationMs: executionDuration
    });
    
    return ErrorHandler.formatSuccessResponse({
      brand_id: brand.brand_id,
      message: 'Brand created successfully',
      redirect_to: '/connections', // Phase 2: Redirect to connections page, not dashboard
      calendar_generation_started: true
    }, 201);

  } catch (error) {
    const executionDuration = Date.now() - startTime;
    ErrorHandler.logError(error, { 
      operation: 'onboarding_handler',
      requestId: context.requestId,
      executionDurationMs: executionDuration
    });
    return ErrorHandler.handleLambdaError(error, event);
  }
};
