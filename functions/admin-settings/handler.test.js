/**
 * Unit tests for Admin Settings Lambda
 */

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-secrets-manager');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

const { SecretsManagerClient, CreateSecretCommand, UpdateSecretCommand, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

describe('Admin Settings Handler', () => {
  let mockSecretsManagerSend;
  let mockDynamoDBSend;
  let handler;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Mock Secrets Manager
    mockSecretsManagerSend = jest.fn();
    SecretsManagerClient.prototype.send = mockSecretsManagerSend;

    // Mock DynamoDB
    mockDynamoDBSend = jest.fn().mockResolvedValue({});
    DynamoDBDocumentClient.from = jest.fn(() => ({
      send: mockDynamoDBSend
    }));

    // Set environment variables
    process.env.AWS_REGION = 'us-east-1';
    process.env.PLATFORM_CREDENTIALS_TABLE = 'test-platform-credentials';
    process.env.ENVIRONMENT = 'test';

    // Require handler after mocks are set up
    handler = require('./handler').handler;
  });

  describe('POST /admin/settings', () => {
    test('should save Instagram credentials successfully', async () => {
      // Mock successful secret creation
      mockSecretsManagerSend.mockResolvedValueOnce({
        ARN: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:experta/platform/instagram-abc123'
      });

      // Mock successful DynamoDB put
      mockDynamoDBSend.mockResolvedValueOnce({});

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            appId: '1234567890',
            appSecret: 'abcdefghijklmnopqrstuvwxyz1234567890',
            redirectUri: 'https://example.com/callback'
          }
        }),
        requestContext: {
          requestId: 'test-request-id',
          authorizer: {
            claims: {
              sub: 'test-user-id'
            }
          }
        }
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Instagram credentials saved successfully');
      expect(body.platform).toBe('instagram');
      expect(mockSecretsManagerSend).toHaveBeenCalled();
      expect(mockDynamoDBSend).toHaveBeenCalled();
    });

    test('should save LinkedIn credentials successfully', async () => {
      // Mock successful secret creation
      mockSecretsManagerSend.mockResolvedValueOnce({
        ARN: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:experta/platform/linkedin-abc123'
      });

      // Mock successful DynamoDB put
      mockDynamoDBSend.mockResolvedValueOnce({});

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          platform: 'linkedin',
          credentials: {
            clientId: 'abcdefghij',
            clientSecret: 'klmnopqrstuvwxyz',
            redirectUri: 'https://example.com/callback'
          }
        }),
        requestContext: {
          requestId: 'test-request-id',
          authorizer: {
            claims: {
              sub: 'test-user-id'
            }
          }
        }
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('LinkedIn credentials saved successfully');
      expect(body.platform).toBe('linkedin');
    });

    test('should reject invalid platform', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          platform: 'facebook',
          credentials: {
            appId: '123',
            appSecret: 'secret'
          }
        })
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Invalid platform');
    });

    test('should reject missing credentials', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          platform: 'instagram'
        })
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Missing required fields');
    });

    test('should reject Instagram credentials with invalid format', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            appId: 'invalid-id',
            appSecret: 'abcdefghijklmnopqrstuvwxyz1234567890',
            redirectUri: 'https://example.com/callback'
          }
        })
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('OAuth connection test failed');
    });

    test('should reject non-HTTPS redirect URI', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            appId: '1234567890',
            appSecret: 'abcdefghijklmnopqrstuvwxyz1234567890',
            redirectUri: 'http://example.com/callback'
          }
        })
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('OAuth connection test failed');
      expect(body.details).toContain('HTTPS');
    });

    test('should update existing secret', async () => {
      // Mock secret already exists error
      const existsError = new Error('Secret already exists');
      existsError.name = 'ResourceExistsException';
      mockSecretsManagerSend.mockRejectedValueOnce(existsError);

      // Mock successful update
      mockSecretsManagerSend.mockResolvedValueOnce({
        ARN: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:experta/platform/instagram-abc123'
      });

      // Mock successful DynamoDB put
      mockDynamoDBSend.mockResolvedValueOnce({});

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            appId: '1234567890',
            appSecret: 'abcdefghijklmnopqrstuvwxyz1234567890',
            redirectUri: 'https://example.com/callback'
          }
        }),
        requestContext: {
          requestId: 'test-request-id',
          authorizer: {
            claims: {
              sub: 'test-user-id'
            }
          }
        }
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(200);
      expect(mockSecretsManagerSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET /admin/settings', () => {
    test('should retrieve Instagram credentials with masking', async () => {
      // Mock successful secret retrieval
      mockSecretsManagerSend.mockResolvedValueOnce({
        SecretString: JSON.stringify({
          appId: '1234567890',
          appSecret: 'abcdefghijklmnopqrstuvwxyz1234567890',
          redirectUri: 'https://example.com/callback'
        })
      });

      const event = {
        httpMethod: 'GET',
        queryStringParameters: {
          platform: 'instagram'
        }
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.platform).toBe('instagram');
      expect(body.configured).toBe(true);
      expect(body.credentials.appId).toBe('1234567890');
      expect(body.credentials.appSecret).toContain('...');
      expect(body.credentials.appSecret).not.toBe('abcdefghijklmnopqrstuvwxyz1234567890');
    });

    test('should return not configured for missing secret', async () => {
      // Mock secret not found error
      const notFoundError = new Error('Secret not found');
      notFoundError.name = 'ResourceNotFoundException';
      mockSecretsManagerSend.mockRejectedValueOnce(notFoundError);

      const event = {
        httpMethod: 'GET',
        queryStringParameters: {
          platform: 'linkedin'
        }
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.platform).toBe('linkedin');
      expect(body.configured).toBe(false);
      expect(body.credentials).toBeNull();
    });

    test('should reject missing platform parameter', async () => {
      const event = {
        httpMethod: 'GET',
        queryStringParameters: {}
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Missing required query parameter');
    });
  });

  describe('OPTIONS /admin/settings', () => {
    test('should handle CORS preflight', async () => {
      const event = {
        httpMethod: 'OPTIONS'
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Unsupported methods', () => {
    test('should reject unsupported HTTP methods', async () => {
      const event = {
        httpMethod: 'DELETE'
      };

      const response = await handler(event, { requestId: 'test-context-id' });

      expect(response.statusCode).toBe(405);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Method not allowed');
    });
  });
});
