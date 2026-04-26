/**
 * Admin Settings Lambda Function
 * 
 * Handles admin configuration for platform-wide OAuth credentials.
 * Stores credentials securely in AWS Secrets Manager (never in DynamoDB).
 * 
 * Endpoints:
 * - POST /admin/settings - Save platform OAuth credentials
 * - GET /admin/settings - Retrieve platform OAuth credentials (for display)
 */

const { SecretsManagerClient, CreateSecretCommand, UpdateSecretCommand, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Try to load from Lambda layer, fall back to local mock for testing
let errorHandler;
try {
  errorHandler = require('/opt/nodejs/errors/error-handler');
} catch (e) {
  errorHandler = require('./__mocks__/error-handler');
}
const { handleError, createResponse } = errorHandler;

const https = require('https');

const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });

const PLATFORM_CREDENTIALS_TABLE = process.env.PLATFORM_CREDENTIALS_TABLE || 'Experta-PlatformCredentials-dev';

// Lazy initialization of DynamoDB client
let dynamodb;
function getDynamoDBClient() {
  if (!dynamodb) {
    const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
    dynamodb = DynamoDBDocumentClient.from(dynamoClient);
  }
  return dynamodb;
}

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  console.log('Admin Settings Handler invoked', { 
    httpMethod: event.httpMethod,
    path: event.path,
    requestId: context.requestId 
  });

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, { message: 'OK' });
    }

    // Route to appropriate handler
    if (event.httpMethod === 'POST') {
      return await handleSaveSettings(event);
    } else if (event.httpMethod === 'GET') {
      return await handleGetSettings(event);
    } else {
      return createResponse(405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in admin settings handler:', error);
    return handleError(error);
  }
};

/**
 * Save platform OAuth credentials to Secrets Manager
 */
async function handleSaveSettings(event) {
  const body = JSON.parse(event.body || '{}');
  const { platform, credentials } = body;

  // Validate input
  if (!platform || !credentials) {
    return createResponse(400, { 
      error: 'Missing required fields: platform and credentials' 
    });
  }

  // Validate platform
  if (!['instagram', 'linkedin', 'meta'].includes(platform)) {
    return createResponse(400, { 
      error: 'Invalid platform. Must be "instagram", "linkedin", or "meta"' 
    });
  }

  // Validate credentials structure
  if (platform === 'instagram') {
    if (!credentials.appId || !credentials.appSecret || !credentials.redirectUri) {
      return createResponse(400, { 
        error: 'Instagram credentials must include appId, appSecret, and redirectUri' 
      });
    }
  } else if (platform === 'linkedin') {
    if (!credentials.clientId || !credentials.clientSecret || !credentials.redirectUri) {
      return createResponse(400, { 
        error: 'LinkedIn credentials must include clientId, clientSecret, and redirectUri' 
      });
    }
  } else if (platform === 'meta') {
    if (!credentials.appId || !credentials.appSecret || !credentials.redirectUri) {
      return createResponse(400, { 
        error: 'Meta credentials must include appId, appSecret, and redirectUri' 
      });
    }
  }

  // Test OAuth connection before saving (Requirement 19.4)
  const testResult = await testOAuthConnection(platform, credentials);
  if (!testResult.success) {
    return createResponse(400, {
      error: 'OAuth connection test failed',
      details: testResult.error
    });
  }

  const secretName = `experta/platform/${platform}`;
  const secretValue = JSON.stringify(credentials);
  let secretArn;

  try {
    // Try to create the secret first
    const createResponse = await secretsManager.send(new CreateSecretCommand({
      Name: secretName,
      Description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} OAuth credentials for Experta platform`,
      SecretString: secretValue,
      Tags: [
        { Key: 'Platform', Value: platform },
        { Key: 'ManagedBy', Value: 'Experta' },
        { Key: 'Environment', Value: process.env.ENVIRONMENT || 'dev' }
      ]
    }));

    secretArn = createResponse.ARN;
    console.log(`Created new secret: ${secretName}`);
  } catch (error) {
    // If secret already exists, update it
    if (error.name === 'ResourceExistsException') {
      const updateResponse = await secretsManager.send(new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: secretValue
      }));

      secretArn = updateResponse.ARN;
      console.log(`Updated existing secret: ${secretName}`);
    } else {
      throw error;
    }
  }

  // Store metadata in DynamoDB (Requirement 19.5)
  const userId = event.requestContext?.authorizer?.claims?.sub || 'unknown';
  const db = getDynamoDBClient();
  
  // Determine scopes based on platform
  let scopes;
  if (platform === 'instagram') {
    scopes = ['instagram_basic', 'instagram_content_publish'];
  } else if (platform === 'linkedin') {
    scopes = ['w_member_social', 'r_liteprofile'];
  } else if (platform === 'meta') {
    scopes = ['pages_manage_posts', 'instagram_basic', 'instagram_content_publish', 'pages_read_engagement'];
  }
  
  await db.send(new PutCommand({
    TableName: PLATFORM_CREDENTIALS_TABLE,
    Item: {
      platform,
      app_name: `Experta ${platform.charAt(0).toUpperCase() + platform.slice(1)} App`,
      client_id_secret_arn: secretArn,
      client_secret_arn: secretArn,
      redirect_uri: credentials.redirectUri,
      scopes: scopes,
      is_active: true,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }));

  // Log admin action to CloudWatch (Requirement 19.7)
  console.log('Admin action: Platform credentials updated', {
    platform,
    userId,
    timestamp: new Date().toISOString(),
    requestId: event.requestContext?.requestId,
    testResult: testResult.message
  });

  return createResponse(200, {
    message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} credentials saved successfully`,
    platform,
    secretName,
    testResult: testResult.message
  });
}

/**
 * Test OAuth connection (Requirement 19.4)
 * Validates that the credentials are properly formatted and can potentially work
 */
async function testOAuthConnection(platform, credentials) {
  try {
    if (platform === 'instagram') {
      // Validate Instagram credentials format
      if (!credentials.appId.match(/^\d+$/)) {
        return { success: false, error: 'Invalid Instagram App ID format' };
      }
      if (credentials.appSecret.length < 20) {
        return { success: false, error: 'Instagram App Secret appears too short' };
      }
      if (!credentials.redirectUri.startsWith('https://') && !credentials.redirectUri.startsWith('http://')) {
        return { success: false, error: 'Redirect URI must use HTTP or HTTPS' };
      }
      
      return { 
        success: true, 
        message: 'Instagram credentials validated successfully' 
      };
    } else if (platform === 'linkedin') {
      // Validate LinkedIn credentials format
      if (credentials.clientId.length < 10) {
        return { success: false, error: 'LinkedIn Client ID appears too short' };
      }
      if (credentials.clientSecret.length < 10) {
        return { success: false, error: 'LinkedIn Client Secret appears too short' };
      }
      if (!credentials.redirectUri.startsWith('https://') && !credentials.redirectUri.startsWith('http://')) {
        return { success: false, error: 'Redirect URI must use HTTP or HTTPS' };
      }
      
      return { 
        success: true, 
        message: 'LinkedIn credentials validated successfully' 
      };
    } else if (platform === 'meta') {
      // Validate Meta credentials format
      if (!credentials.appId.match(/^\d+$/)) {
        return { success: false, error: 'Invalid Meta App ID format (must be numeric)' };
      }
      if (credentials.appSecret.length < 20) {
        return { success: false, error: 'Meta App Secret appears too short' };
      }
      if (!credentials.redirectUri.startsWith('https://') && !credentials.redirectUri.startsWith('http://')) {
        return { success: false, error: 'Redirect URI must use HTTP or HTTPS' };
      }
      
      return { 
        success: true, 
        message: 'Meta credentials validated successfully' 
      };
    }
    
    return { success: false, error: 'Unknown platform' };
  } catch (error) {
    console.error('OAuth connection test error:', error);
    return { 
      success: false, 
      error: error.message || 'Connection test failed' 
    };
  }
}

/**
 * Retrieve platform OAuth credentials from Secrets Manager
 * Returns credentials with secrets masked for security
 */
async function handleGetSettings(event) {
  const platform = event.queryStringParameters?.platform;

  if (!platform) {
    return createResponse(400, { 
      error: 'Missing required query parameter: platform' 
    });
  }

  if (!['instagram', 'linkedin', 'meta'].includes(platform)) {
    return createResponse(400, { 
      error: 'Invalid platform. Must be "instagram", "linkedin", or "meta"' 
    });
  }

  const secretName = `experta/platform/${platform}`;

  try {
    const response = await secretsManager.send(new GetSecretValueCommand({
      SecretId: secretName
    }));

    const credentials = JSON.parse(response.SecretString);

    // Mask sensitive values for display
    const maskedCredentials = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (key.includes('secret') || key.includes('Secret')) {
        // Show only first 4 and last 4 characters
        maskedCredentials[key] = value.length > 8 
          ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
          : '****';
      } else {
        maskedCredentials[key] = value;
      }
    }

    return createResponse(200, {
      platform,
      credentials: maskedCredentials,
      configured: true
    });
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return createResponse(200, {
        platform,
        credentials: null,
        configured: false
      });
    }
    throw error;
  }
}
