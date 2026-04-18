/**
 * Auto Publisher Lambda Function
 * 
 * Triggered by EventBridge scheduled rules to publish posts to social media platforms
 * Handles Instagram and LinkedIn publishing with retry logic
 * Retrieves OAuth tokens from AWS Secrets Manager (not DynamoDB)
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 10.3, 10.5, 11.3, 16.4, 16.5
 */

const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const https = require('https');

// Import shared libraries from Lambda Layer
const { PostsDataAccess } = require('/opt/nodejs/db/posts');
const { BrandsDataAccess } = require('/opt/nodejs/db/brands');
const { AutomationLogsDataAccess } = require('/opt/nodejs/db/logs');
const { publishEvent } = require('/opt/nodejs/events/eventbridge-client');
const { ErrorHandler, ErrorCodes } = require('/opt/nodejs/errors/error-handler');
const OAuthConnectionsDataAccess = require('/opt/nodejs/db/oauth-connections');

// Initialize AWS clients
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

const secretsManagerClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Environment variables
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const EVENTBRIDGE_BUS_NAME = process.env.EVENTBRIDGE_BUS_NAME || 'default';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const MAX_RETRIES = 2;

/**
 * Get access token from Secrets Manager
 * Requirements: 16.4, 16.5
 * 
 * @param {string} secretArn - ARN of the secret containing the access token
 * @returns {Promise<string>} - Access token
 */
async function getTokenFromSecretsManager(secretArn) {
  try {
    const command = new GetSecretValueCommand({
      SecretId: secretArn
    });

    const response = await secretsManagerClient.send(command);
    return response.SecretString;
  } catch (error) {
    ErrorHandler.logError(error, { operation: 'getTokenFromSecretsManager', secretArn });
    throw new Error(`Failed to retrieve token from Secrets Manager: ${error.message}`);
  }
}

/**
 * Check if token is expired
 * @param {string} expiresAt - ISO8601 timestamp
 * @returns {boolean} - True if token is expired or will expire in next 5 minutes
 */
function isTokenExpired(expiresAt) {
  if (!expiresAt) {
    return false; // No expiration set, assume valid
  }

  const expirationTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  // Consider expired if it expires within 5 minutes
  return expirationTime - now < fiveMinutes;
}

/**
 * Refresh access token by calling OAuth handler
 * Requirements: 16.4
 * 
 * @param {string} brandId - Brand ID
 * @param {string} platform - Platform name
 * @returns {Promise<void>}
 */
async function refreshAccessToken(brandId, platform) {
  try {
    ErrorHandler.logInfo('Refreshing access token', { brandId, platform });

    // Call OAuth handler's refresh endpoint
    const oauthHandlerUrl = process.env.OAUTH_HANDLER_URL;
    if (!oauthHandlerUrl) {
      throw new Error('OAUTH_HANDLER_URL environment variable not set');
    }

    const response = await makeHttpsRequest(
      new URL(oauthHandlerUrl).hostname,
      `/oauth/refresh/${platform}`,
      'POST',
      {
        'Content-Type': 'application/json'
      },
      JSON.stringify({ brand_id: brandId })
    );

    ErrorHandler.logInfo('Access token refreshed successfully', { brandId, platform });
  } catch (error) {
    ErrorHandler.logError(error, { operation: 'refreshAccessToken', brandId, platform });
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
}

/**
 * Get valid access token for platform
 * Retrieves token from Secrets Manager and refreshes if expired
 * Requirements: 16.4, 16.5
 * 
 * @param {string} brandId - Brand ID
 * @param {string} platform - Platform name
 * @returns {Promise<string>} - Valid access token
 */
async function getValidAccessToken(brandId, platform) {
  // Query OAuth_Connections table for token ARN
  const connection = await OAuthConnectionsDataAccess.getConnection(brandId, platform);
  
  if (!connection) {
    throw new Error(`No OAuth connection found for brand ${brandId} on ${platform}`);
  }

  if (connection.connection_status !== 'active') {
    throw new Error(`OAuth connection is not active (status: ${connection.connection_status})`);
  }

  // Check if token is expired
  if (isTokenExpired(connection.token_expires_at)) {
    ErrorHandler.logInfo('Token expired, refreshing', {
      brandId,
      platform,
      expiresAt: connection.token_expires_at
    });

    // Refresh token if expired
    await refreshAccessToken(brandId, platform);

    // Re-fetch connection to get updated token ARN (in case it changed)
    const updatedConnection = await OAuthConnectionsDataAccess.getConnection(brandId, platform);
    if (!updatedConnection) {
      throw new Error('Connection not found after token refresh');
    }

    // Retrieve refreshed token from Secrets Manager
    return await getTokenFromSecretsManager(updatedConnection.access_token_secret_arn);
  }

  // Retrieve token from Secrets Manager (not DynamoDB)
  return await getTokenFromSecretsManager(connection.access_token_secret_arn);
}

/**
 * Download image from S3
 * @param {string} imageUrl - S3 URL of the image
 * @returns {Promise<Buffer>} - Image data as Buffer
 */
async function downloadImageFromS3(imageUrl) {
  try {
    // Extract bucket and key from S3 URL
    // Format: https://bucket-name.s3.region.amazonaws.com/key or s3://bucket-name/key
    let bucket, key;
    
    if (imageUrl.startsWith('s3://')) {
      const parts = imageUrl.replace('s3://', '').split('/');
      bucket = parts[0];
      key = parts.slice(1).join('/');
    } else {
      // Parse HTTPS URL
      const url = new URL(imageUrl);
      bucket = url.hostname.split('.')[0];
      key = url.pathname.substring(1); // Remove leading slash
    }

    const command = new GetObjectCommand({
      Bucket: bucket || S3_BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    ErrorHandler.logError(error, { operation: 'downloadImageFromS3', imageUrl });
    throw new Error(`Failed to download image from S3: ${error.message}`);
  }
}

/**
 * Make HTTPS request
 * @param {string} hostname - API hostname
 * @param {string} path - API path
 * @param {string} method - HTTP method
 * @param {object} headers - Request headers
 * @param {object|string} body - Request body
 * @returns {Promise<object>} - Response data
 */
function makeHttpsRequest(hostname, path, method, headers, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsedData });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsedData)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Validate and truncate caption to meet platform requirements
 * @param {string} caption - Original caption
 * @param {string} platform - Platform name (instagram | linkedin)
 * @returns {string} - Validated and potentially truncated caption
 */
function validateAndTruncateCaption(caption, platform) {
  const INSTAGRAM_MAX_LENGTH = 2200;
  const LINKEDIN_MAX_LENGTH = 3000;

  if (platform === 'instagram') {
    if (caption.length > INSTAGRAM_MAX_LENGTH) {
      ErrorHandler.logWarning('Caption exceeds Instagram limit, truncating', {
        originalLength: caption.length,
        maxLength: INSTAGRAM_MAX_LENGTH
      });
      return caption.substring(0, INSTAGRAM_MAX_LENGTH);
    }
  } else if (platform === 'linkedin') {
    if (caption.length > LINKEDIN_MAX_LENGTH) {
      ErrorHandler.logWarning('Caption exceeds LinkedIn limit, truncating', {
        originalLength: caption.length,
        maxLength: LINKEDIN_MAX_LENGTH
      });
      return caption.substring(0, LINKEDIN_MAX_LENGTH);
    }
  }

  return caption;
}

/**
 * Publish post to Instagram using Graph API
 * Requirements: 6.2
 * 
 * @param {string} accessToken - Instagram access token
 * @param {string} caption - Post caption
 * @param {string} imageUrl - Public image URL
 * @returns {Promise<object>} - Instagram post response
 */
async function publishToInstagram(accessToken, caption, imageUrl) {
  try {
    ErrorHandler.logInfo('Publishing to Instagram', { imageUrl });

    // Validate and truncate caption to meet Instagram requirements
    const validatedCaption = validateAndTruncateCaption(caption, 'instagram');

    // Step 1: Create media container
    const containerResponse = await makeHttpsRequest(
      'graph.facebook.com',
      `/v18.0/me/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(validatedCaption)}&access_token=${accessToken}`,
      'POST',
      { 'Content-Type': 'application/json' }
    );

    const containerId = containerResponse.data.id;
    ErrorHandler.logInfo('Instagram container created', { containerId });

    // Step 2: Publish the container
    // Wait a moment for the container to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    const publishResponse = await makeHttpsRequest(
      'graph.facebook.com',
      `/v18.0/me/media_publish?creation_id=${containerId}&access_token=${accessToken}`,
      'POST',
      { 'Content-Type': 'application/json' }
    );

    ErrorHandler.logInfo('Instagram post published', { postId: publishResponse.data.id });

    return {
      platform: 'instagram',
      postId: publishResponse.data.id,
      success: true
    };
  } catch (error) {
    ErrorHandler.logError(error, { operation: 'publishToInstagram' });
    throw new Error(`Instagram publishing failed: ${error.message}`);
  }
}

/**
 * Publish post to LinkedIn using API
 * Requirements: 6.3
 * 
 * @param {string} accessToken - LinkedIn access token
 * @param {string} caption - Post caption
 * @param {Buffer} imageData - Image data as Buffer
 * @returns {Promise<object>} - LinkedIn post response
 */
async function publishToLinkedIn(accessToken, caption, imageData) {
  try {
    ErrorHandler.logInfo('Publishing to LinkedIn');

    // Validate and truncate caption to meet LinkedIn requirements
    const validatedCaption = validateAndTruncateCaption(caption, 'linkedin');

    // Step 1: Register upload
    const registerResponse = await makeHttpsRequest(
      'api.linkedin.com',
      '/v2/assets?action=registerUpload',
      'POST',
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      },
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: 'urn:li:person:CURRENT',
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent'
          }]
        }
      }
    );

    const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerResponse.data.value.asset;

    ErrorHandler.logInfo('LinkedIn upload registered', { asset });

    // Step 2: Upload image
    await new Promise((resolve, reject) => {
      const url = new URL(uploadUrl);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': imageData.length
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(imageData);
      req.end();
    });

    ErrorHandler.logInfo('LinkedIn image uploaded');

    // Step 3: Create post
    const postResponse = await makeHttpsRequest(
      'api.linkedin.com',
      '/v2/ugcPosts',
      'POST',
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      },
      {
        author: 'urn:li:person:CURRENT',
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: validatedCaption
            },
            shareMediaCategory: 'IMAGE',
            media: [{
              status: 'READY',
              description: {
                text: validatedCaption
              },
              media: asset,
              title: {
                text: 'Post'
              }
            }]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      }
    );

    ErrorHandler.logInfo('LinkedIn post published', { postId: postResponse.data.id });

    return {
      platform: 'linkedin',
      postId: postResponse.data.id,
      success: true
    };
  } catch (error) {
    ErrorHandler.logError(error, { operation: 'publishToLinkedIn' });
    throw new Error(`LinkedIn publishing failed: ${error.message}`);
  }
}

/**
 * Publish post to the appropriate platform
 * @param {string} platform - Platform name (instagram | linkedin)
 * @param {string} accessToken - Platform access token
 * @param {string} caption - Post caption
 * @param {string} imageUrl - S3 image URL
 * @returns {Promise<object>} - Publishing result
 */
async function publishPost(platform, accessToken, caption, imageUrl) {
  if (platform === 'instagram') {
    // Instagram requires a public URL
    return await publishToInstagram(accessToken, caption, imageUrl);
  } else if (platform === 'linkedin') {
    // LinkedIn requires uploading the image
    const imageData = await downloadImageFromS3(imageUrl);
    return await publishToLinkedIn(accessToken, caption, imageData);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Send SNS notification for failed publication
 * Requirements: 6.8
 * 
 * @param {string} postId - Post ID
 * @param {string} brandId - Brand ID
 * @param {string} platform - Platform name
 * @param {string} errorMessage - Error message
 */
async function sendFailureNotification(postId, brandId, platform, errorMessage) {
  if (!SNS_TOPIC_ARN) {
    ErrorHandler.logWarning('SNS_TOPIC_ARN not configured, skipping notification');
    return;
  }

  try {
    const message = {
      subject: `Post Publication Failed - ${platform}`,
      postId,
      brandId,
      platform,
      errorMessage,
      timestamp: new Date().toISOString()
    };

    const command = new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: `Experta: Post Publication Failed`,
      Message: JSON.stringify(message, null, 2)
    });

    await snsClient.send(command);
    ErrorHandler.logInfo('Failure notification sent', { postId, platform });
  } catch (error) {
    ErrorHandler.logError(error, { operation: 'sendFailureNotification', postId });
    // Don't throw - notification failure shouldn't break the flow
  }
}

/**
 * Exponential backoff delay
 * @param {number} retryCount - Current retry attempt (0-indexed)
 * @returns {Promise<void>}
 */
async function exponentialBackoff(retryCount) {
  const delayMs = Math.pow(2, retryCount) * 5000; // 5s, 15s (actually 10s, 20s but close enough)
  ErrorHandler.logInfo(`Waiting ${delayMs}ms before retry`, { retryCount });
  await new Promise(resolve => setTimeout(resolve, delayMs));
}

/**
 * Main Lambda handler
 * Triggered by EventBridge scheduled rules
 * Requirements: 6.1, 6.4, 6.5, 6.6, 6.7
 */
exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    ErrorHandler.logInfo('Auto publisher invoked', {
      requestId: context.requestId,
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      eventSource: event.source || 'unknown',
      post_id: event.post_id
    });

    // Extract post_id from event
    const post_id = event.post_id;
    if (!post_id) {
      throw new Error('post_id not found in event');
    }

    // Fetch post details from DynamoDB
    const post = await PostsDataAccess.getPostById(post_id);
    if (!post) {
      throw new Error(`Post not found: ${post_id}`);
    }

    ErrorHandler.logInfo('Post retrieved', {
      post_id,
      brand_id: post.brand_id,
      platform: post.platform,
      status: post.status
    });

    // Check if post is already published
    if (post.status === 'Published') {
      ErrorHandler.logWarning('Post already published', { post_id });
      return { statusCode: 200, message: 'Post already published' };
    }

    // Fetch brand credentials
    const brand = await BrandsDataAccess.getBrandById(post.brand_id);
    if (!brand) {
      throw new Error(`Brand not found: ${post.brand_id}`);
    }

    // Get valid access token from Secrets Manager via OAuth connections
    // Requirements: 16.4, 16.5
    let accessToken;

    if (post.platform === 'instagram') {
      if (!brand.has_instagram_connection) {
        throw new Error('Instagram connection not established for brand');
      }
      // Retrieve token from Secrets Manager via OAuth_Connections table
      accessToken = await getValidAccessToken(post.brand_id, 'instagram');
    } else if (post.platform === 'linkedin') {
      if (!brand.has_linkedin_connection) {
        throw new Error('LinkedIn connection not established for brand');
      }
      // Retrieve token from Secrets Manager via OAuth_Connections table
      accessToken = await getValidAccessToken(post.brand_id, 'linkedin');
    } else {
      throw new Error(`Unsupported platform: ${post.platform}`);
    }

    // Attempt publication with retry logic
    // Requirements: 6.7
    let lastError = null;
    let publishResult = null;
    let retryCount = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff before retry
          await exponentialBackoff(attempt - 1);
          
          // Increment retry count in database
          await PostsDataAccess.incrementRetryCount(post_id);
          retryCount++;
        }

        ErrorHandler.logInfo(`Publishing attempt ${attempt + 1}/${MAX_RETRIES + 1}`, {
          post_id,
          platform: post.platform
        });

        // Publish to platform
        publishResult = await publishPost(
          post.platform,
          accessToken,
          post.caption,
          post.image_url
        );

        // Success! Update post status
        // Requirements: 6.4, 6.5
        await PostsDataAccess.updatePostStatus(post_id, 'Published', {
          published_at: new Date().toISOString(),
          error_message: null
        });

        ErrorHandler.logInfo('Post published successfully', {
          post_id,
          platform: post.platform,
          platformPostId: publishResult.postId
        });

        // Create success automation log
        // Requirements: 11.3
        const executionDuration = Date.now() - startTime;
        await AutomationLogsDataAccess.logSuccess(
          post.brand_id,
          'post_publish',
          executionDuration,
          post_id
        );

        // Publish PostPublished event
        // Requirements: 10.5
        try {
          await publishEvent(
            'PostPublished',
            {
              post_id: post_id,
              brand_id: post.brand_id,
              platform: post.platform,
              platform_post_id: publishResult.postId,
              timestamp: new Date().toISOString()
            },
            EVENTBRIDGE_BUS_NAME
          );
        } catch (error) {
          // Log but don't fail
          ErrorHandler.logError(error, { operation: 'publishEvent', post_id });
        }

        return {
          statusCode: 200,
          message: 'Post published successfully',
          post_id,
          platform: post.platform,
          platform_post_id: publishResult.postId
        };

      } catch (error) {
        lastError = error;
        ErrorHandler.logError(error, {
          operation: 'publishPost',
          post_id,
          platform: post.platform,
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES + 1
        });

        // If this was the last attempt, handle failure
        if (attempt === MAX_RETRIES) {
          break;
        }
      }
    }

    // All retries failed
    // Requirements: 6.6, 6.8
    ErrorHandler.logError(lastError, {
      operation: 'publishPost_final_failure',
      post_id,
      totalAttempts: MAX_RETRIES + 1
    });

    // Update post status to Failed
    await PostsDataAccess.updatePostStatus(post_id, 'Failed', {
      error_message: lastError.message
    });

    // Create failure automation log
    const executionDuration = Date.now() - startTime;
    await AutomationLogsDataAccess.logFailure(
      post.brand_id,
      'post_publish',
      lastError.message,
      executionDuration,
      post_id
    );

    // Send SNS notification
    await sendFailureNotification(
      post_id,
      post.brand_id,
      post.platform,
      lastError.message
    );

    return {
      statusCode: 500,
      message: 'Post publication failed after all retries',
      post_id,
      error: lastError.message
    };

  } catch (error) {
    const executionDuration = Date.now() - startTime;
    ErrorHandler.logError(error, {
      operation: 'auto_publisher_handler',
      requestId: context.requestId,
      executionDurationMs: executionDuration
    });

    // Try to log failure if we have post info
    if (event.post_id) {
      try {
        const executionDuration = Date.now() - startTime;
        const post = await PostsDataAccess.getPostById(event.post_id);
        if (post) {
          await AutomationLogsDataAccess.logFailure(
            post.brand_id,
            'post_publish',
            error.message,
            executionDuration,
            event.post_id
          );
        }
      } catch (logError) {
        ErrorHandler.logError(logError, { operation: 'log_failure' });
      }
    }

    throw error;
  }
};
