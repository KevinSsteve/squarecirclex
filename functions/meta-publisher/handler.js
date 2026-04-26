/**
 * Meta Publisher Lambda Function
 * 
 * Publishes posts to Facebook and Instagram using Meta Graph API.
 * Triggered by EventBridge or direct invocation.
 * 
 * Requirements: 3.2, 3.3, 4.1
 */

const MetaGraphClient = require('/opt/nodejs/integrations/meta-graph-client');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsManager = new SecretsManagerClient({});

const POSTS_TABLE = process.env.POSTS_TABLE || 'Experta-Posts-dev';
const BRANDS_TABLE = process.env.BRANDS_TABLE || 'Experta-Brands-dev';

// Determine if we're in mock mode
const MOCK_MODE = process.env.META_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';

/**
 * Main handler
 */
exports.handler = async (event) => {
  console.log('[META PUBLISHER] Invoked', { event, mockMode: MOCK_MODE });

  try {
    // Extract post_id from event
    const postId = event.post_id || event.detail?.post_id;
    
    if (!postId) {
      throw new Error('Missing required parameter: post_id');
    }

    // Get post details from DynamoDB
    const post = await getPost(postId);
    
    if (!post) {
      throw new Error(`Post not found: ${postId}`);
    }

    // Get brand details
    const brand = await getBrand(post.brand_id);
    
    if (!brand) {
      throw new Error(`Brand not found: ${post.brand_id}`);
    }

    // Determine which platforms to publish to
    const platforms = post.platforms || ['facebook', 'instagram'];
    
    // Initialize Meta Graph Client
    const metaClient = new MetaGraphClient({ mockMode: MOCK_MODE });
    
    // Publish to each platform
    const results = [];
    const errors = [];
    
    for (const platform of platforms) {
      try {
        console.log(`[META PUBLISHER] Publishing to ${platform}`, { postId, platform });
        
        const result = await publishToPlatform(
          metaClient,
          platform,
          post,
          brand
        );
        
        results.push(result);
        
        // Update post with publication info
        await updatePostStatus(postId, platform, result);
        
      } catch (error) {
        console.error(`[META PUBLISHER] Failed to publish to ${platform}`, { error: error.message });
        errors.push({
          platform,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // If all platforms failed, mark post as failed
    if (errors.length === platforms.length) {
      await markPostAsFailed(postId, errors);
      throw new Error(`Failed to publish to all platforms: ${JSON.stringify(errors)}`);
    }

    // If some platforms failed, log but don't throw
    if (errors.length > 0) {
      console.warn('[META PUBLISHER] Partial failure', { postId, errors });
      await updatePostErrors(postId, errors);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Post published successfully',
        postId,
        results,
        errors: errors.length > 0 ? errors : undefined
      })
    };

  } catch (error) {
    console.error('[META PUBLISHER] Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};

/**
 * Publish to a specific platform
 */
async function publishToPlatform(metaClient, platform, post, brand) {
  // Get credentials for the platform
  const credentials = await getPlatformCredentials(brand.brand_id, platform);
  
  if (!credentials) {
    throw new Error(`No credentials found for platform: ${platform}`);
  }

  // Publish based on platform
  if (platform === 'facebook') {
    return await metaClient.publishToFacebook(
      credentials.pageId,
      post.caption,
      post.image_url,
      credentials.accessToken
    );
  } else if (platform === 'instagram') {
    return await metaClient.publishToInstagram(
      credentials.accountId,
      post.caption,
      post.image_url,
      credentials.accessToken
    );
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get post from DynamoDB
 */
async function getPost(postId) {
  const command = new GetCommand({
    TableName: POSTS_TABLE,
    Key: { post_id: postId }
  });

  const response = await docClient.send(command);
  return response.Item;
}

/**
 * Get brand from DynamoDB
 */
async function getBrand(brandId) {
  const command = new GetCommand({
    TableName: BRANDS_TABLE,
    Key: { brand_id: brandId }
  });

  const response = await docClient.send(command);
  return response.Item;
}

/**
 * Get platform credentials from Secrets Manager
 * In mock mode, returns mock credentials
 */
async function getPlatformCredentials(brandId, platform) {
  // In mock mode, return fake credentials
  if (MOCK_MODE) {
    console.log('[META PUBLISHER] Using mock credentials', { brandId, platform });
    return {
      pageId: `mock_page_${brandId}`,
      accountId: `mock_account_${brandId}`,
      accessToken: 'mock_access_token'
    };
  }

  // In production, get from Secrets Manager
  try {
    const secretName = `experta/brand/${brandId}/${platform}`;
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsManager.send(command);
    
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error('[META PUBLISHER] Failed to get credentials', { error: error.message });
    return null;
  }
}

/**
 * Update post status after successful publication
 */
async function updatePostStatus(postId, platform, result) {
  const updates = {};
  
  if (platform === 'facebook') {
    updates.facebook_post_id = result.postId;
    updates.facebook_published_at = result.publishedAt;
  } else if (platform === 'instagram') {
    updates.instagram_post_id = result.postId;
    updates.instagram_published_at = result.publishedAt;
  }

  // Build update expression
  const updateExpressions = [];
  const expressionAttributeValues = {};
  
  for (const [key, value] of Object.entries(updates)) {
    updateExpressions.push(`${key} = :${key}`);
    expressionAttributeValues[`:${key}`] = value;
  }

  // Update status to Published if not already
  updateExpressions.push('post_status = :status');
  expressionAttributeValues[':status'] = 'Published';

  const command = new UpdateCommand({
    TableName: POSTS_TABLE,
    Key: { post_id: postId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues
  });

  await docClient.send(command);
  
  console.log('[META PUBLISHER] Post status updated', { postId, platform, updates });
}

/**
 * Mark post as failed
 */
async function markPostAsFailed(postId, errors) {
  const command = new UpdateCommand({
    TableName: POSTS_TABLE,
    Key: { post_id: postId },
    UpdateExpression: 'SET post_status = :status, publication_errors = :errors',
    ExpressionAttributeValues: {
      ':status': 'Failed',
      ':errors': errors
    }
  });

  await docClient.send(command);
  
  console.log('[META PUBLISHER] Post marked as failed', { postId, errors });
}

/**
 * Update post with partial errors
 */
async function updatePostErrors(postId, errors) {
  const command = new UpdateCommand({
    TableName: POSTS_TABLE,
    Key: { post_id: postId },
    UpdateExpression: 'SET publication_errors = :errors',
    ExpressionAttributeValues: {
      ':errors': errors
    }
  });

  await docClient.send(command);
  
  console.log('[META PUBLISHER] Post errors updated', { postId, errors });
}
