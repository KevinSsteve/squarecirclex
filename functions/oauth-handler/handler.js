/**
 * OAuth Handler Lambda Function
 * 
 * Handles OAuth flows for connecting brand social media accounts.
 * Implements secure OAuth 2.0 authorization code flow with CSRF protection.
 * 
 * Endpoints:
 * - GET /oauth/authorize/{platform} - Initiate OAuth flow
 * - GET /oauth/callback/{platform} - Handle OAuth callback
 * - POST /oauth/refresh/{platform} - Refresh access token
 * - DELETE /oauth/disconnect/{platform} - Disconnect OAuth connection
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8
 */

const { SecretsManagerClient, CreateSecretCommand, GetSecretValueCommand, DeleteSecretCommand } = require('@aws-sdk/client-secrets-manager');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

// Try to load from Lambda layer, fall back to local for testing
let errorHandler, oauthConnections, brands;
try {
  errorHandler = require('/opt/nodejs/errors/error-handler');
  oauthConnections = require('/opt/nodejs/db/oauth-connections');
  brands = require('/opt/nodejs/db/brands');
} catch (e) {
  errorHandler = require('../../lib/nodejs/errors/error-handler');
  oauthConnections = require('../../lib/nodejs/db/oauth-connections');
  brands = require('../../lib/nodejs/db/brands');
}

const { handleError, createResponse } = errorHandler;
const { BrandsDataAccess } = brands;

const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });

// Environment variables
const OAUTH_CONNECTIONS_TABLE = process.env.OAUTH_CONNECTIONS_TABLE_NAME;
const BRANDS_TABLE = process.env.BRANDS_TABLE_NAME;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://localhost:3000';

// In-memory state storage (in production, use DynamoDB with TTL)
const stateStore = new Map();

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  console.log('OAuth Handler invoked', {
    httpMethod: event.httpMethod,
    path: event.path,
    requestId: context.requestId
  });

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, { message: 'OK' });
    }

    const pathParts = event.path.split('/');
    const platform = pathParts[pathParts.length - 1];

    // Route to appropriate handler
    if (event.path.includes('/oauth/authorize/')) {
      return await handleAuthorize(event, platform);
    } else if (event.path.includes('/oauth/callback/')) {
      return await handleCallback(event, platform);
    } else if (event.path.includes('/oauth/refresh/')) {
      return await handleRefresh(event, platform);
    } else if (event.path.includes('/oauth/disconnect/')) {
      return await handleDisconnect(event, platform);
    } else {
      return createResponse(404, { error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Error in OAuth handler:', error);
    return handleError(error);
  }
};

/**
 * GET /oauth/authorize/{platform}
 * Initiate OAuth authorization flow
 * Requirements: 16.1, 16.3
 */
async function handleAuthorize(event, platform) {
  const brandId = event.queryStringParameters?.brand_id;

  if (!brandId) {
    return createResponse(400, { error: 'Missing required parameter: brand_id' });
  }

  // Validate platform
  if (!['instagram', 'linkedin'].includes(platform)) {
    return createResponse(400, { error: 'Invalid platform. Must be "instagram" or "linkedin"' });
  }

  // Verify brand exists
  const brand = await BrandsDataAccess.getBrandById(brandId);
  if (!brand) {
    return createResponse(404, { error: 'Brand not found' });
  }

  // Retrieve admin OAuth credentials from Secrets Manager (Requirement 16.1)
  const platformCredentials = await getPlatformCredentials(platform);
  if (!platformCredentials) {
    return createResponse(500, { 
      error: 'Platform OAuth credentials not configured. Please contact administrator.' 
    });
  }

  // Generate state token for CSRF protection (Requirement 16.3)
  const state = generateStateToken(brandId, platform);
  
  // Store state with expiration (5 minutes)
  stateStore.set(state, {
    brandId,
    platform,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  // Build authorization URL
  const authUrl = buildAuthorizationUrl(platform, platformCredentials, state);

  console.log('OAuth authorization initiated', {
    brandId,
    platform,
    state: state.substring(0, 10) + '...'
  });

  return createResponse(200, {
    authorizationUrl: authUrl,
    state
  });
}

/**
 * GET /oauth/callback/{platform}
 * Handle OAuth callback and exchange code for token
 * Requirements: 16.3, 16.4, 16.5, 16.6
 */
async function handleCallback(event, platform) {
  const code = event.queryStringParameters?.code;
  const state = event.queryStringParameters?.state;
  const error = event.queryStringParameters?.error;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth authorization error:', error);
    return createResponse(400, {
      error: 'OAuth authorization failed',
      details: error
    });
  }

  if (!code || !state) {
    return createResponse(400, { error: 'Missing required parameters: code and state' });
  }

  // Verify state token (CSRF protection - Requirement 16.3)
  const stateData = stateStore.get(state);
  if (!stateData) {
    return createResponse(400, { error: 'Invalid or expired state token' });
  }

  if (stateData.expiresAt < Date.now()) {
    stateStore.delete(state);
    return createResponse(400, { error: 'State token expired' });
  }

  const { brandId, platform: statePlatform } = stateData;
  stateStore.delete(state); // Use state only once

  if (statePlatform !== platform) {
    return createResponse(400, { error: 'Platform mismatch' });
  }

  // Retrieve platform credentials
  const platformCredentials = await getPlatformCredentials(platform);
  if (!platformCredentials) {
    return createResponse(500, { error: 'Platform credentials not found' });
  }

  // Exchange authorization code for access token (Requirement 16.3)
  const tokenData = await exchangeCodeForToken(platform, code, platformCredentials);

  // Fetch user profile information
  const profileData = await fetchUserProfile(platform, tokenData.access_token);

  // Store tokens in Secrets Manager (Requirement 16.4, 16.5)
  const accessTokenArn = await storeTokenInSecretsManager(
    brandId,
    platform,
    'access_token',
    tokenData.access_token
  );

  let refreshTokenArn = null;
  if (tokenData.refresh_token) {
    refreshTokenArn = await storeTokenInSecretsManager(
      brandId,
      platform,
      'refresh_token',
      tokenData.refresh_token
    );
  }

  // Calculate token expiration
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  // Save connection metadata in OAuth_Connections table (Requirement 16.4)
  await oauthConnections.createConnection({
    brand_id: brandId,
    platform,
    platform_user_id: profileData.id,
    platform_username: profileData.username,
    access_token_secret_arn: accessTokenArn,
    refresh_token_secret_arn: refreshTokenArn,
    token_expires_at: expiresAt,
    scopes_granted: tokenData.scope ? tokenData.scope.split(',') : [],
    profile_data: profileData
  });

  // Update brand connection status flags (Requirement 16.6)
  const connectionFlag = platform === 'instagram' 
    ? 'has_instagram_connection' 
    : 'has_linkedin_connection';
  
  await BrandsDataAccess.updateBrand(brandId, {
    [connectionFlag]: true
  });

  console.log('OAuth connection established', {
    brandId,
    platform,
    platformUserId: profileData.id
  });

  // Redirect to frontend with success
  const redirectUrl = `${FRONTEND_URL}/connect-accounts?success=true&platform=${platform}`;
  
  return {
    statusCode: 302,
    headers: {
      'Location': redirectUrl,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
    },
    body: ''
  };
}

/**
 * POST /oauth/refresh/{platform}
 * Refresh access token using refresh token
 * Requirements: 16.4, 16.5
 */
async function handleRefresh(event, platform) {
  const body = JSON.parse(event.body || '{}');
  const brandId = body.brand_id;

  if (!brandId) {
    return createResponse(400, { error: 'Missing required field: brand_id' });
  }

  // Get connection
  const connection = await oauthConnections.getConnection(brandId, platform);
  if (!connection) {
    return createResponse(404, { error: 'OAuth connection not found' });
  }

  if (!connection.refresh_token_secret_arn) {
    return createResponse(400, { error: 'No refresh token available' });
  }

  // Retrieve refresh token from Secrets Manager
  const refreshToken = await getTokenFromSecretsManager(connection.refresh_token_secret_arn);

  // Retrieve platform credentials
  const platformCredentials = await getPlatformCredentials(platform);

  // Refresh the token
  const tokenData = await refreshAccessToken(platform, refreshToken, platformCredentials);

  // Update access token in Secrets Manager
  await updateTokenInSecretsManager(connection.access_token_secret_arn, tokenData.access_token);

  // Update expiration in DynamoDB
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  await oauthConnections.updateTokenExpiration(brandId, platform, expiresAt);

  console.log('Access token refreshed', { brandId, platform });

  return createResponse(200, {
    message: 'Token refreshed successfully',
    expires_at: expiresAt
  });
}

/**
 * DELETE /oauth/disconnect/{platform}
 * Disconnect OAuth connection and revoke tokens
 * Requirements: 16.7, 16.8
 */
async function handleDisconnect(event, platform) {
  const body = JSON.parse(event.body || '{}');
  const brandId = body.brand_id;

  if (!brandId) {
    return createResponse(400, { error: 'Missing required field: brand_id' });
  }

  // Get connection
  const connection = await oauthConnections.getConnection(brandId, platform);
  if (!connection) {
    return createResponse(404, { error: 'OAuth connection not found' });
  }

  // Delete tokens from Secrets Manager
  try {
    await deleteTokenFromSecretsManager(connection.access_token_secret_arn);
    if (connection.refresh_token_secret_arn) {
      await deleteTokenFromSecretsManager(connection.refresh_token_secret_arn);
    }
  } catch (error) {
    console.error('Error deleting tokens from Secrets Manager:', error);
    // Continue with disconnection even if token deletion fails
  }

  // Delete connection from DynamoDB
  await oauthConnections.deleteConnection(brandId, platform);

  // Update brand connection status flags
  const connectionFlag = platform === 'instagram'
    ? 'has_instagram_connection'
    : 'has_linkedin_connection';

  await BrandsDataAccess.updateBrand(brandId, {
    [connectionFlag]: false
  });

  console.log('OAuth connection disconnected', { brandId, platform });

  return createResponse(200, {
    message: 'Connection disconnected successfully',
    platform
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate CSRF state token
 */
function generateStateToken(brandId, platform) {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${brandId}:${platform}:${randomBytes}`;
}

/**
 * Build OAuth authorization URL
 */
function buildAuthorizationUrl(platform, credentials, state) {
  if (platform === 'instagram') {
    const params = querystring.stringify({
      client_id: credentials.appId,
      redirect_uri: credentials.redirectUri,
      scope: 'instagram_basic,instagram_content_publish',
      response_type: 'code',
      state
    });
    return `https://api.instagram.com/oauth/authorize?${params}`;
  } else if (platform === 'linkedin') {
    const params = querystring.stringify({
      client_id: credentials.clientId,
      redirect_uri: credentials.redirectUri,
      scope: 'w_member_social r_liteprofile',
      response_type: 'code',
      state
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(platform, code, credentials) {
  if (platform === 'instagram') {
    const postData = querystring.stringify({
      client_id: credentials.appId,
      client_secret: credentials.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: credentials.redirectUri,
      code
    });

    return await makeHttpsRequest('api.instagram.com', '/oauth/access_token', 'POST', postData);
  } else if (platform === 'linkedin') {
    const postData = querystring.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: credentials.redirectUri,
      code
    });

    return await makeHttpsRequest('www.linkedin.com', '/oauth/v2/accessToken', 'POST', postData);
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken(platform, refreshToken, credentials) {
  if (platform === 'instagram') {
    const postData = querystring.stringify({
      client_id: credentials.appId,
      client_secret: credentials.appSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    return await makeHttpsRequest('api.instagram.com', '/oauth/access_token', 'POST', postData);
  } else if (platform === 'linkedin') {
    const postData = querystring.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    return await makeHttpsRequest('www.linkedin.com', '/oauth/v2/accessToken', 'POST', postData);
  }
}

/**
 * Fetch user profile information
 */
async function fetchUserProfile(platform, accessToken) {
  if (platform === 'instagram') {
    const data = await makeHttpsRequest(
      'graph.instagram.com',
      `/me?fields=id,username&access_token=${accessToken}`,
      'GET'
    );
    return {
      id: data.id,
      username: data.username
    };
  } else if (platform === 'linkedin') {
    const data = await makeHttpsRequest(
      'api.linkedin.com',
      '/v2/me',
      'GET',
      null,
      { 'Authorization': `Bearer ${accessToken}` }
    );
    return {
      id: data.id,
      username: `${data.localizedFirstName} ${data.localizedLastName}`
    };
  }
}

/**
 * Make HTTPS request
 */
function makeHttpsRequest(hostname, path, method, postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error_description || parsed.error || 'Request failed'));
          }
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Get platform credentials from Secrets Manager
 */
async function getPlatformCredentials(platform) {
  const secretName = `experta/platform/${platform}`;
  
  try {
    const response = await secretsManager.send(new GetSecretValueCommand({
      SecretId: secretName
    }));
    return JSON.parse(response.SecretString);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.error(`Platform credentials not found: ${secretName}`);
      return null;
    }
    throw error;
  }
}

/**
 * Store token in Secrets Manager
 */
async function storeTokenInSecretsManager(brandId, platform, tokenType, tokenValue) {
  const secretName = `experta/oauth/${brandId}/${platform}/${tokenType}`;
  
  const response = await secretsManager.send(new CreateSecretCommand({
    Name: secretName,
    Description: `${platform} ${tokenType} for brand ${brandId}`,
    SecretString: tokenValue,
    Tags: [
      { Key: 'BrandId', Value: brandId },
      { Key: 'Platform', Value: platform },
      { Key: 'TokenType', Value: tokenType }
    ]
  }));

  return response.ARN;
}

/**
 * Get token from Secrets Manager
 */
async function getTokenFromSecretsManager(secretArn) {
  const response = await secretsManager.send(new GetSecretValueCommand({
    SecretId: secretArn
  }));
  return response.SecretString;
}

/**
 * Update token in Secrets Manager
 */
async function updateTokenInSecretsManager(secretArn, newTokenValue) {
  const { UpdateSecretCommand } = require('@aws-sdk/client-secrets-manager');
  await secretsManager.send(new UpdateSecretCommand({
    SecretId: secretArn,
    SecretString: newTokenValue
  }));
}

/**
 * Delete token from Secrets Manager
 */
async function deleteTokenFromSecretsManager(secretArn) {
  await secretsManager.send(new DeleteSecretCommand({
    SecretId: secretArn,
    ForceDeleteWithoutRecovery: true
  }));
}
