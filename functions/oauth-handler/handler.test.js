/**
 * Unit Tests for OAuth Handler
 * 
 * Tests specific scenarios and edge cases for OAuth operations.
 * Requirements: 16.3, 16.8
 */

const { handler } = require('./handler');

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-secrets-manager');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

// Mock shared libraries
jest.mock('../../lib/nodejs/errors/error-handler', () => ({
  handleError: jest.fn((error) => ({
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
    },
    body: JSON.stringify({ error: error.message })
  })),
  createResponse: jest.fn((statusCode, body) => ({
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  }))
}));

jest.mock('../../lib/nodejs/db/oauth-connections', () => ({
  createConnection: jest.fn(),
  getConnection: jest.fn(),
  deleteConnection: jest.fn(),
  updateTokenExpiration: jest.fn()
}));

jest.mock('../../lib/nodejs/db/brands', () => ({
  BrandsDataAccess: {
    getBrandById: jest.fn(),
    updateBrand: jest.fn()
  }
}));

const { SecretsManagerClient, CreateSecretCommand, GetSecretValueCommand, DeleteSecretCommand } = require('@aws-sdk/client-secrets-manager');
const oauthConnections = require('../../lib/nodejs/db/oauth-connections');
const { BrandsDataAccess } = require('../../lib/nodejs/db/brands');
const { createResponse } = require('../../lib/nodejs/errors/error-handler');

describe('OAuth Handler Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OAUTH_CONNECTIONS_TABLE_NAME = 'test-oauth-connections';
    process.env.BRANDS_TABLE_NAME = 'test-brands';
    process.env.FRONTEND_URL = 'https://test.example.com';
  });

  describe('GET /oauth/authorize/{platform}', () => {
    test('should initiate Instagram OAuth flow with valid brand_id', async () => {
      const brandId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Mock brand exists
      BrandsDataAccess.getBrandById.mockResolvedValue({
        brand_id: brandId,
        brand_name: 'Test Brand'
      });

      // Mock platform credentials
      SecretsManagerClient.prototype.send = jest.fn((command) => {
        if (command instanceof GetSecretValueCommand) {
          return Promise.resolve({
            SecretString: JSON.stringify({
              appId: '123456789',
              appSecret: 'secret123',
              redirectUri: 'https://test.example.com/callback'
            })
          });
        }
        return Promise.resolve({});
      });

      const event = {
        httpMethod: 'GET',
        path: '/oauth/authorize/instagram',
        queryStringParameters: {
          brand_id: brandId
        },
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.authorizationUrl).toContain('api.instagram.com/oauth/authorize');
      expect(body.authorizationUrl).toContain('client_id=123456789');
      expect(body.state).toBeDefined();
    });

    test('should initiate LinkedIn OAuth flow with valid brand_id', async () => {
      const brandId = '123e4567-e89b-12d3-a456-426614174000';
      
      BrandsDataAccess.getBrandById.mockResolvedValue({
        brand_id: brandId,
        brand_name: 'Test Brand'
      });

      SecretsManagerClient.prototype.send = jest.fn((command) => {
        if (command instanceof GetSecretValueCommand) {
          return Promise.resolve({
            SecretString: JSON.stringify({
              clientId: 'linkedin123',
              clientSecret: 'secret456',
              redirectUri: 'https://test.example.com/callback'
            })
          });
        }
        return Promise.resolve({});
      });

      const event = {
        httpMethod: 'GET',
        path: '/oauth/authorize/linkedin',
        queryStringParameters: {
          brand_id: brandId
        },
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.authorizationUrl).toContain('linkedin.com/oauth/v2/authorization');
      expect(body.authorizationUrl).toContain('client_id=linkedin123');
      expect(body.state).toBeDefined();
    });

    test('should return 400 if brand_id is missing', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/oauth/authorize/instagram',
        queryStringParameters: {},
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('brand_id');
    });

    test('should return 400 for invalid platform', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/oauth/authorize/twitter',
        queryStringParameters: {
          brand_id: '123e4567-e89b-12d3-a456-426614174000'
        },
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Invalid platform');
    });

    test('should return 404 if brand does not exist', async () => {
      BrandsDataAccess.getBrandById.mockResolvedValue(null);

      const event = {
        httpMethod: 'GET',
        path: '/oauth/authorize/instagram',
        queryStringParameters: {
          brand_id: '123e4567-e89b-12d3-a456-426614174000'
        },
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Brand not found');
    });
  });

  describe('DELETE /oauth/disconnect/{platform}', () => {
    test('should disconnect Instagram OAuth connection', async () => {
      const brandId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Mock connection exists
      oauthConnections.getConnection.mockResolvedValue({
        brand_id: brandId,
        platform: 'instagram',
        access_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-access',
        refresh_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-refresh'
      });

      // Mock Secrets Manager delete
      SecretsManagerClient.prototype.send = jest.fn((command) => {
        if (command instanceof DeleteSecretCommand) {
          return Promise.resolve({});
        }
        return Promise.resolve({});
      });

      oauthConnections.deleteConnection.mockResolvedValue();
      BrandsDataAccess.updateBrand.mockResolvedValue({});

      const event = {
        httpMethod: 'DELETE',
        path: '/oauth/disconnect/instagram',
        body: JSON.stringify({
          brand_id: brandId
        }),
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('disconnected successfully');
      
      // Verify tokens were deleted from Secrets Manager
      expect(SecretsManagerClient.prototype.send).toHaveBeenCalledWith(
        expect.any(DeleteSecretCommand)
      );
      
      // Verify connection was deleted from DynamoDB
      expect(oauthConnections.deleteConnection).toHaveBeenCalledWith(brandId, 'instagram');
      
      // Verify brand flag was updated
      expect(BrandsDataAccess.updateBrand).toHaveBeenCalledWith(brandId, {
        has_instagram_connection: false
      });
    });

    test('should disconnect LinkedIn OAuth connection', async () => {
      const brandId = '123e4567-e89b-12d3-a456-426614174000';
      
      oauthConnections.getConnection.mockResolvedValue({
        brand_id: brandId,
        platform: 'linkedin',
        access_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-access'
      });

      SecretsManagerClient.prototype.send = jest.fn((command) => {
        if (command instanceof DeleteSecretCommand) {
          return Promise.resolve({});
        }
        return Promise.resolve({});
      });

      oauthConnections.deleteConnection.mockResolvedValue();
      BrandsDataAccess.updateBrand.mockResolvedValue({});

      const event = {
        httpMethod: 'DELETE',
        path: '/oauth/disconnect/linkedin',
        body: JSON.stringify({
          brand_id: brandId
        }),
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(200);
      
      // Verify brand flag was updated for LinkedIn
      expect(BrandsDataAccess.updateBrand).toHaveBeenCalledWith(brandId, {
        has_linkedin_connection: false
      });
    });

    test('should return 400 if brand_id is missing in disconnect request', async () => {
      const event = {
        httpMethod: 'DELETE',
        path: '/oauth/disconnect/instagram',
        body: JSON.stringify({}),
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('brand_id');
    });

    test('should return 404 if connection does not exist', async () => {
      oauthConnections.getConnection.mockResolvedValue(null);

      const event = {
        httpMethod: 'DELETE',
        path: '/oauth/disconnect/instagram',
        body: JSON.stringify({
          brand_id: '123e4567-e89b-12d3-a456-426614174000'
        }),
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('not found');
    });
  });

  describe('POST /oauth/refresh/{platform}', () => {
    test('should refresh access token for Instagram', async () => {
      const brandId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Mock connection with refresh token
      oauthConnections.getConnection.mockResolvedValue({
        brand_id: brandId,
        platform: 'instagram',
        access_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-access',
        refresh_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-refresh'
      });

      // Mock Secrets Manager operations
      SecretsManagerClient.prototype.send = jest.fn((command) => {
        if (command instanceof GetSecretValueCommand) {
          const secretId = command.input?.SecretId || '';
          if (secretId.includes('refresh_token')) {
            return Promise.resolve({ SecretString: 'refresh_token_123' });
          }
          if (secretId.includes('platform')) {
            return Promise.resolve({
              SecretString: JSON.stringify({
                appId: '123456',
                appSecret: 'secret123',
                redirectUri: 'https://test.example.com/callback'
              })
            });
          }
          // Default return for access token ARN
          return Promise.resolve({ SecretString: 'some_token' });
        }
        return Promise.resolve({});
      });

      // Mock HTTPS request for token refresh
      const https = require('https');
      https.request = jest.fn((options, callback) => {
        const res = {
          statusCode: 200,
          on: jest.fn((event, handler) => {
            if (event === 'data') {
              handler(JSON.stringify({
                access_token: 'new_access_token_123',
                expires_in: 3600
              }));
            }
            if (event === 'end') {
              handler();
            }
          })
        };
        callback(res);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn()
        };
      });

      oauthConnections.updateTokenExpiration.mockResolvedValue({});

      const event = {
        httpMethod: 'POST',
        path: '/oauth/refresh/instagram',
        body: JSON.stringify({
          brand_id: brandId
        }),
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('refreshed successfully');
      expect(body.expires_at).toBeDefined();
    });

    test('should return 400 if no refresh token available', async () => {
      const brandId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Mock connection without refresh token
      oauthConnections.getConnection.mockResolvedValue({
        brand_id: brandId,
        platform: 'instagram',
        access_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-access',
        refresh_token_secret_arn: null
      });

      const event = {
        httpMethod: 'POST',
        path: '/oauth/refresh/instagram',
        body: JSON.stringify({
          brand_id: brandId
        }),
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('No refresh token');
    });
  });

  describe('CSRF Protection', () => {
    test('should reject callback with invalid state token', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/oauth/callback/instagram',
        queryStringParameters: {
          code: 'auth_code_123',
          state: 'invalid_state_token'
        },
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Invalid or expired state token');
    });

    test('should reject callback with missing state token', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/oauth/callback/instagram',
        queryStringParameters: {
          code: 'auth_code_123'
        },
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Missing required parameters');
    });

    test('should reject callback with missing authorization code', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/oauth/callback/instagram',
        queryStringParameters: {
          state: 'some_state_token'
        },
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Missing required parameters');
    });
  });

  describe('CORS Handling', () => {
    test('should handle OPTIONS preflight request', async () => {
      const event = {
        httpMethod: 'OPTIONS',
        path: '/oauth/authorize/instagram',
        requestContext: {
          requestId: 'test-request-id'
        }
      };

      const response = await handler(event, { requestId: 'test-request-id' });

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('DELETE');
    });
  });
});
