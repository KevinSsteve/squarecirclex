/**
 * Posts API Handler Lambda
 * Handles CRUD operations for posts with brand authorization
 * Requirements: 7.1, 7.3, 7.4, 7.5, 7.6, 14.3, 14.4
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { EventBridgeClient, DescribeRuleCommand } = require('@aws-sdk/client-eventbridge');

// Try to load from Lambda layer, fall back to local for testing
let PostsDataAccess, BrandsDataAccess, BrandAuthorizer, ErrorHandler, ErrorCodes, RequestValidator;
try {
  ({ PostsDataAccess } = require('/opt/nodejs/db/posts'));
  ({ BrandsDataAccess } = require('/opt/nodejs/db/brands'));
  BrandAuthorizer = require('/opt/nodejs/auth/brand-authorizer');
  ({ ErrorHandler, ErrorCodes } = require('/opt/nodejs/errors/error-handler'));
  ({ RequestValidator } = require('/opt/nodejs/validation/request-validator'));
} catch (e) {
  ({ PostsDataAccess } = require('../../lib/nodejs/db/posts'));
  ({ BrandsDataAccess } = require('../../lib/nodejs/db/brands'));
  BrandAuthorizer = require('../../lib/nodejs/auth/brand-authorizer');
  ({ ErrorHandler, ErrorCodes } = require('../../lib/nodejs/errors/error-handler'));
  ({ RequestValidator } = require('../../lib/nodejs/validation/request-validator'));
}

// Initialize AWS clients
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Main Lambda handler
 * Routes requests to appropriate handler based on HTTP method and path
 */
exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    ErrorHandler.logInfo('Posts API invocation', {
      requestId: context.requestId,
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      method: event.httpMethod,
      path: event.path,
      sourceIp: event.requestContext?.identity?.sourceIp
    });

    // Handle OPTIONS for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        body: '',
      };
    }

    // Extract user context from authorizer
    const userContext = extractUserContext(event);
    
    // Route to appropriate handler
    const { httpMethod, pathParameters } = event;
    const post_id = pathParameters?.post_id;
    
    // Check if this is a regenerate request (POST /posts/{post_id}/regenerate)
    const isRegenerateRequest = httpMethod === 'POST' && 
                                post_id && 
                                event.path && 
                                event.path.endsWith('/regenerate');

    if (httpMethod === 'GET' && !post_id) {
      // GET /posts - List posts with filters
      return await handleListPosts(event, userContext);
    } else if (httpMethod === 'GET' && post_id) {
      // GET /posts/{post_id} - Get single post
      return await handleGetPost(event, userContext, post_id);
    } else if (httpMethod === 'PUT' && post_id) {
      // PUT /posts/{post_id} - Update post
      return await handleUpdatePost(event, userContext, post_id);
    } else if (httpMethod === 'DELETE' && post_id) {
      // DELETE /posts/{post_id} - Delete post
      return await handleDeletePost(event, userContext, post_id);
    } else if (isRegenerateRequest) {
      // POST /posts/{post_id}/regenerate - Regenerate post content
      return await handleRegeneratePost(event, userContext, post_id);
    } else {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Endpoint not found'
      );
    }
  } catch (error) {
    const executionDuration = Date.now() - startTime;
    
    // Handle specific error for missing brand association (Task 1.5)
    if (error.statusCode === 403 && error.errorCode === 'NO_BRAND_ASSOCIATION') {
      ErrorHandler.logWarning('User has no brand association', {
        operation: 'posts_api_handler',
        requestId: context.requestId,
        executionDurationMs: executionDuration
      });
      
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            code: 'NO_BRAND_ASSOCIATION',
            message: 'User has no brand association. Please complete onboarding.',
            details: {
              requiresOnboarding: true
            }
          }
        })
      };
    }
    
    ErrorHandler.logError(error, {
      operation: 'posts_api_handler',
      requestId: context.requestId,
      executionDurationMs: executionDuration
    });
    return ErrorHandler.handleLambdaError(error, event);
  }
};

/**
 * Extract user context from API Gateway authorizer
 * @param {object} event - Lambda event
 * @returns {object} - User context with userId and brandId
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

  // Return structured error response for missing brand association (Task 1.5)
  // This prevents 500 errors and provides clear feedback to frontend
  if (!brandId) {
    // Note: This will be caught by the handler and returned as a response
    const error = new Error('User has no brand association');
    error.statusCode = 403;
    error.errorCode = 'NO_BRAND_ASSOCIATION';
    error.requiresOnboarding = true;
    throw error;
  }

  return {
    userId,
    brandId,
    username: authorizer.username || authorizer.claims?.email || '',
  };
}

/**
 * Handle GET /posts - List posts with filters
 * Requirements: 7.1, 7.5, 7.6
 * @param {object} event - Lambda event
 * @param {object} userContext - User context from authorizer
 * @returns {object} - API Gateway response
 */
async function handleListPosts(event, userContext) {
  const queryParams = event.queryStringParameters || {};
  
  // Extract filter parameters
  const requestedBrandId = queryParams.brand_id;
  const startDate = queryParams.start_date;
  const endDate = queryParams.end_date;
  const status = queryParams.status;

  // Verify brand authorization
  // User can only access posts for their own brand
  const brandIdToQuery = requestedBrandId || userContext.brandId;
  
  if (brandIdToQuery !== userContext.brandId) {
    ErrorHandler.logWarning('Unauthorized brand access attempt', {
      userId: userContext.userId,
      requestedBrandId: brandIdToQuery,
      userBrandId: userContext.brandId,
    });
    return ErrorHandler.formatErrorResponse(
      ErrorCodes.FORBIDDEN,
      'Access denied to requested brand data'
    );
  }

  // Validate date parameters if provided
  if (startDate && !isValidISODate(startDate)) {
    return ErrorHandler.formatErrorResponse(
      ErrorCodes.VALIDATION_ERROR,
      'Invalid start_date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
    );
  }

  if (endDate && !isValidISODate(endDate)) {
    return ErrorHandler.formatErrorResponse(
      ErrorCodes.VALIDATION_ERROR,
      'Invalid end_date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
    );
  }

  // Validate status parameter if provided
  const validStatuses = ['Draft', 'Scheduled', 'Published', 'Failed'];
  if (status && !validStatuses.includes(status)) {
    return ErrorHandler.formatErrorResponse(
      ErrorCodes.VALIDATION_ERROR,
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    );
  }

  try {
    let posts;

    // Query based on filters
    if (status) {
      // Use status GSI
      posts = await PostsDataAccess.getPostsByBrandIdAndStatus(brandIdToQuery, status);
      
      // Apply date filtering in memory if needed
      if (startDate || endDate) {
        posts = posts.filter(post => {
          const scheduledTime = post.scheduled_time;
          if (startDate && scheduledTime < startDate) return false;
          if (endDate && scheduledTime > endDate) return false;
          return true;
        });
      }
    } else {
      // Use scheduled_time GSI with date range
      const options = {};
      if (startDate) options.startTime = startDate;
      if (endDate) options.endTime = endDate;
      
      posts = await PostsDataAccess.getPostsByBrandId(brandIdToQuery, options);
    }

    // Sort by scheduled_time in ascending order (Requirement 7.5)
    posts.sort((a, b) => {
      const timeA = new Date(a.scheduled_time).getTime();
      const timeB = new Date(b.scheduled_time).getTime();
      return timeA - timeB;
    });

    ErrorHandler.logInfo('Posts retrieved successfully', {
      brandId: brandIdToQuery,
      count: posts.length,
      filters: { startDate, endDate, status },
    });

    return ErrorHandler.formatSuccessResponse({
      posts,
      count: posts.length,
    });
  } catch (error) {
    ErrorHandler.logError(error, {
      operation: 'handleListPosts',
      brandId: brandIdToQuery,
    });
    throw error;
  }
}

/**
 * Handle GET /posts/{post_id} - Get single post
 * Requirements: 7.3, 7.6
 * @param {object} event - Lambda event
 * @param {object} userContext - User context from authorizer
 * @param {string} post_id - Post ID from path parameters
 * @returns {object} - API Gateway response
 */
async function handleGetPost(event, userContext, post_id) {
  try {
    // Get post from database
    const post = await PostsDataAccess.getPostById(post_id);

    if (!post) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.NOT_FOUND,
        `Post not found: ${post_id}`
      );
    }

    // Verify brand authorization (Requirement 7.6)
    if (post.brand_id !== userContext.brandId) {
      ErrorHandler.logWarning('Unauthorized post access attempt', {
        userId: userContext.userId,
        postId: post_id,
        postBrandId: post.brand_id,
        userBrandId: userContext.brandId,
      });
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.FORBIDDEN,
        'Access denied to requested post'
      );
    }

    ErrorHandler.logInfo('Post retrieved successfully', {
      postId: post_id,
      brandId: post.brand_id,
    });

    return ErrorHandler.formatSuccessResponse(post);
  } catch (error) {
    ErrorHandler.logError(error, {
      operation: 'handleGetPost',
      postId: post_id,
    });
    throw error;
  }
}

/**
 * Handle PUT /posts/{post_id} - Update post
 * Requirements: 14.3, 14.4
 * @param {object} event - Lambda event
 * @param {object} userContext - User context from authorizer
 * @param {string} post_id - Post ID from path parameters
 * @returns {object} - API Gateway response
 */
async function handleUpdatePost(event, userContext, post_id) {
  try {
    // Validate request body
    let updates;
    try {
      updates = RequestValidator.validateRequest(event, 'updatePost');
    } catch (validationError) {
      return RequestValidator.formatValidationError(validationError);
    }

    // Get existing post
    const existingPost = await PostsDataAccess.getPostById(post_id);

    if (!existingPost) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.NOT_FOUND,
        `Post not found: ${post_id}`
      );
    }

    // Verify brand authorization
    if (existingPost.brand_id !== userContext.brandId) {
      ErrorHandler.logWarning('Unauthorized post update attempt', {
        userId: userContext.userId,
        postId: post_id,
        postBrandId: existingPost.brand_id,
        userBrandId: userContext.brandId,
      });
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.FORBIDDEN,
        'Access denied to update this post'
      );
    }

    // Update post in database
    const updatedPost = await PostsDataAccess.updatePost(post_id, updates);

    ErrorHandler.logInfo('Post updated successfully', {
      postId: post_id,
      brandId: existingPost.brand_id,
      updates: Object.keys(updates),
    });

    return ErrorHandler.formatSuccessResponse(updatedPost);
  } catch (error) {
    ErrorHandler.logError(error, {
      operation: 'handleUpdatePost',
      postId: post_id,
    });
    throw error;
  }
}

/**
 * Handle DELETE /posts/{post_id} - Delete post
 * Requirements: 7.4, 7.6
 * @param {object} event - Lambda event
 * @param {object} userContext - User context from authorizer
 * @param {string} post_id - Post ID from path parameters
 * @returns {object} - API Gateway response
 */
async function handleDeletePost(event, userContext, post_id) {
  try {
    // Get existing post
    const existingPost = await PostsDataAccess.getPostById(post_id);

    if (!existingPost) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.NOT_FOUND,
        `Post not found: ${post_id}`
      );
    }

    // Verify brand authorization
    if (existingPost.brand_id !== userContext.brandId) {
      ErrorHandler.logWarning('Unauthorized post deletion attempt', {
        userId: userContext.userId,
        postId: post_id,
        postBrandId: existingPost.brand_id,
        userBrandId: userContext.brandId,
      });
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.FORBIDDEN,
        'Access denied to delete this post'
      );
    }

    // Delete post from database
    await PostsDataAccess.deletePost(post_id);

    ErrorHandler.logInfo('Post deleted successfully', {
      postId: post_id,
      brandId: existingPost.brand_id,
    });

    return ErrorHandler.formatSuccessResponse({
      message: 'Post deleted successfully',
      post_id: post_id,
    });
  } catch (error) {
    ErrorHandler.logError(error, {
      operation: 'handleDeletePost',
      postId: post_id,
    });
    throw error;
  }
}

/**
 * Handle POST /posts/{post_id}/regenerate - Regenerate post content
 * Requirements: 14.1, 14.2, 14.5
 * @param {object} event - Lambda event
 * @param {object} userContext - User context from authorizer
 * @param {string} post_id - Post ID from path parameters
 * @returns {object} - API Gateway response
 */
async function handleRegeneratePost(event, userContext, post_id) {
  try {
    // Get existing post
    const existingPost = await PostsDataAccess.getPostById(post_id);

    if (!existingPost) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.NOT_FOUND,
        `Post not found: ${post_id}`
      );
    }

    // Verify brand authorization
    if (existingPost.brand_id !== userContext.brandId) {
      ErrorHandler.logWarning('Unauthorized post regeneration attempt', {
        userId: userContext.userId,
        postId: post_id,
        postBrandId: existingPost.brand_id,
        userBrandId: userContext.brandId,
      });
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.FORBIDDEN,
        'Access denied to regenerate this post'
      );
    }

    // Get brand data for regeneration
    const brandData = await BrandsDataAccess.getBrandById(existingPost.brand_id);
    
    if (!brandData) {
      return ErrorHandler.formatErrorResponse(
        ErrorCodes.NOT_FOUND,
        `Brand not found: ${existingPost.brand_id}`
      );
    }

    ErrorHandler.logInfo('Starting post regeneration', {
      postId: post_id,
      brandId: existingPost.brand_id,
      contentPillar: existingPost.content_pillar,
    });

    // Generate new caption using Bedrock Claude
    const newCaption = await generateCaption(
      brandData,
      existingPost.content_pillar
    );

    // Generate new image using Bedrock Titan
    const newImageUrl = await generateAndUploadImage(
      brandData,
      existingPost.content_pillar,
      newCaption,
      post_id
    );

    // Verify EventBridge rule still exists (Requirement 14.5)
    const ruleExists = await verifyEventBridgeRule(post_id);
    
    if (!ruleExists) {
      ErrorHandler.logWarning('EventBridge rule not found for post', {
        postId: post_id,
        scheduledTime: existingPost.scheduled_time,
      });
    }

    // Update post in DynamoDB with new content
    // Preserve scheduled_time and content_pillar (Requirement 14.2)
    const updates = {
      caption: newCaption,
      image_url: newImageUrl,
      updated_at: new Date().toISOString(),
    };

    const updatedPost = await PostsDataAccess.updatePost(post_id, updates);

    ErrorHandler.logInfo('Post regenerated successfully', {
      postId: post_id,
      brandId: existingPost.brand_id,
      preservedFields: {
        scheduled_time: existingPost.scheduled_time,
        content_pillar: existingPost.content_pillar,
      },
      eventBridgeRuleExists: ruleExists,
    });

    return ErrorHandler.formatSuccessResponse({
      ...updatedPost,
      eventbridge_rule_exists: ruleExists,
    });
  } catch (error) {
    ErrorHandler.logError(error, {
      operation: 'handleRegeneratePost',
      postId: post_id,
    });
    throw error;
  }
}

/**
 * Generate caption using Bedrock Claude
 * @param {object} brandData - Brand information
 * @param {string} contentPillar - Content pillar for this post
 * @returns {Promise<string>} - Generated caption text
 */
async function generateCaption(brandData, contentPillar) {
  try {
    // Build prompt for Claude
    const prompt = `Generate an engaging social media caption for ${brandData.brand_name}.

Brand Information:
- Industry: ${brandData.industry || 'N/A'}
- Target Audience: ${brandData.target_audience || 'N/A'}
- Tone of Voice: ${brandData.tone_of_voice || 'professional and friendly'}
- Content Pillar: ${contentPillar}

Requirements:
- Write in the brand's tone of voice
- Focus on the content pillar theme
- Keep it engaging and authentic
- Include 2-3 relevant hashtags
- Maximum 2200 characters (Instagram limit)

Generate only the caption text, no additional commentary.`;

    // Call Bedrock Claude
    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    };

    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_CLAUDE_MODEL_ID || 'global.anthropic.claude-opus-5',
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    let caption = responseBody.content[0].text.trim();

    // Ensure caption doesn't exceed Instagram limit
    if (caption.length > 2200) {
      caption = caption.substring(0, 2197) + '...';
    }

    return caption;
  } catch (error) {
    ErrorHandler.logError(error, {
      operation: 'generateCaption',
      brandId: brandData.brand_id,
      contentPillar,
    });
    // Return fallback caption
    return `Check out our latest update about ${contentPillar}! #brand #${contentPillar.replace(/\s+/g, '')}`;
  }
}

/**
 * Generate image using Bedrock Titan and upload to S3
 * @param {object} brandData - Brand information
 * @param {string} contentPillar - Content pillar for this post
 * @param {string} caption - Generated caption for context
 * @param {string} postId - Post ID for S3 key
 * @returns {Promise<string>} - S3 URL of uploaded image
 */
async function generateAndUploadImage(brandData, contentPillar, caption, postId) {
  try {
    const visualStyle = brandData.visual_style || 'modern and professional';

    // Build image generation prompt
    const imagePrompt = `Professional social media visual, ${visualStyle} style.
Theme: ${contentPillar}. Brand: ${brandData.brand_name}, Industry: ${brandData.industry || 'business'}.
High-quality, studio-lit, vibrant colors, perfect composition, photorealistic, 
editorial quality, trending on social media, Instagram-worthy, sharp focus, 
beautiful lighting, professional photography.`;

    // Call Bedrock Stable Image Ultra v1.1
    const requestBody = {
      prompt: imagePrompt,
      mode: 'text-to-image',
      aspect_ratio: '1:1',
      output_format: 'png'
    };

    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_IMAGE_MODEL_ID || 'stability.stable-image-ultra-v1:0',
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Check for content filtering
    const finishReasons = responseBody.finish_reasons || [];
    if (finishReasons.length > 0 && finishReasons[0] !== null) {
      throw new Error(`Image generation filtered: ${finishReasons[0]}`);
    }

    // Extract image data
    if (!responseBody.images || responseBody.images.length === 0) {
      throw new Error('No image generated by Stable Image Ultra');
    }

    const imageBase64 = responseBody.images[0];
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Generate S3 key
    const s3Bucket = process.env.S3_BUCKET_NAME;
    const s3Key = `images/${brandData.brand_id}/${postId}.png`;

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: 'image/png',
      Metadata: {
        brand_id: brandData.brand_id,
        content_pillar: contentPillar,
        post_id: postId,
      },
    });

    await s3Client.send(putCommand);

    // Generate S3 URL
    const awsRegion = process.env.AWS_REGION || 'us-east-1';
    const s3Url = `https://${s3Bucket}.s3.${awsRegion}.amazonaws.com/${s3Key}`;

    return s3Url;
  } catch (error) {
    ErrorHandler.logError(error, {
      operation: 'generateAndUploadImage',
      brandId: brandData.brand_id,
      contentPillar,
      postId,
    });
    // Return placeholder image URL
    const s3Bucket = process.env.S3_BUCKET_NAME;
    const awsRegion = process.env.AWS_REGION || 'us-east-1';
    return `https://${s3Bucket}.s3.${awsRegion}.amazonaws.com/placeholder.png`;
  }
}

/**
 * Verify EventBridge rule exists for post
 * @param {string} postId - Post ID
 * @returns {Promise<boolean>} - True if rule exists
 */
async function verifyEventBridgeRule(postId) {
  try {
    const ruleName = `experta-publish-post-${postId}`;
    
    const command = new DescribeRuleCommand({
      Name: ruleName,
      EventBusName: 'default',
    });

    await eventBridgeClient.send(command);
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    ErrorHandler.logError(error, {
      operation: 'verifyEventBridgeRule',
      postId,
    });
    // Return true on other errors to avoid blocking regeneration
    return true;
  }
}

/**
 * Validate ISO 8601 date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid ISO 8601 date
 */
function isValidISODate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}
