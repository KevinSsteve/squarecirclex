/**
 * Unit Tests for Auto Publisher Lambda
 * 
 * Tests:
 * - Successful Instagram publication
 * - Successful LinkedIn publication
 * - Retry logic on API failures
 * - SNS notification on final failure
 * - Token retrieval from Secrets Manager
 * - Token refresh flow
 * - Expired token handling
 * 
 * Requirements: 6.2, 6.3, 6.7, 6.8, 16.4
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Mock AWS SDK clients
const mockSNSSend = jest.fn();
const mockS3Send = jest.fn();
const mockSecretsManagerSend = jest.fn();

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: mockSNSSend
  })),
  PublishCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send
  })),
  GetObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: jest.fn().mockImplementation(() => ({
    send: mockSecretsManagerSend
  })),
  GetSecretValueCommand: jest.fn()
}));

// Mock shared libraries
const mockDecrypt = jest.fn();
const mockGetPostById = jest.fn();
const mockUpdatePostStatus = jest.fn();
const mockIncrementRetryCount = jest.fn();
const mockGetBrandById = jest.fn();
const mockLogSuccess = jest.fn();
const mockLogFailure = jest.fn();
const mockPublishEvent = jest.fn();
const mockGetConnection = jest.fn();

jest.mock('../../lib/nodejs/security/encryption', () => {
  return jest.fn().mockImplementation(() => ({
    decrypt: mockDecrypt
  }));
});

jest.mock('../../lib/nodejs/db/posts', () => ({
  PostsDataAccess: {
    getPostById: mockGetPostById,
    updatePostStatus: mockUpdatePostStatus,
    incrementRetryCount: mockIncrementRetryCount
  }
}));

jest.mock('../../lib/nodejs/db/brands', () => ({
  BrandsDataAccess: {
    getBrandById: mockGetBrandById
  }
}));

jest.mock('../../lib/nodejs/db/logs', () => ({
  AutomationLogsDataAccess: {
    logSuccess: mockLogSuccess,
    logFailure: mockLogFailure
  }
}));

jest.mock('../../lib/nodejs/events/eventbridge-client', () => ({
  publishEvent: mockPublishEvent
}));

jest.mock('../../lib/nodejs/db/oauth-connections', () => ({
  getConnection: mockGetConnection
}));

jest.mock('../../lib/nodejs/errors/error-handler', () => {
  const actualModule = jest.requireActual('../../lib/nodejs/errors/error-handler');
  return actualModule;
});

// Mock the /opt/nodejs paths to point to relative paths
jest.mock('/opt/nodejs/security/encryption', () => {
  return jest.requireMock('../../lib/nodejs/security/encryption');
}, { virtual: true });

jest.mock('/opt/nodejs/db/posts', () => {
  return jest.requireMock('../../lib/nodejs/db/posts');
}, { virtual: true });

jest.mock('/opt/nodejs/db/brands', () => {
  return jest.requireMock('../../lib/nodejs/db/brands');
}, { virtual: true });

jest.mock('/opt/nodejs/db/logs', () => {
  return jest.requireMock('../../lib/nodejs/db/logs');
}, { virtual: true });

jest.mock('/opt/nodejs/events/eventbridge-client', () => {
  return jest.requireMock('../../lib/nodejs/events/eventbridge-client');
}, { virtual: true });

jest.mock('/opt/nodejs/errors/error-handler', () => {
  return jest.requireMock('../../lib/nodejs/errors/error-handler');
}, { virtual: true });

jest.mock('/opt/nodejs/db/oauth-connections', () => {
  return jest.requireMock('../../lib/nodejs/db/oauth-connections');
}, { virtual: true });

// Mock https module for API calls
const mockHttpsRequest = jest.fn();
jest.mock('https', () => ({
  request: mockHttpsRequest
}));

const { handler } = require('./handler');

describe('Auto Publisher - Unit Tests', () => {
  const mockContext = {
    requestId: 'test-request-id',
    functionName: 'auto-publisher',
    awsRequestId: 'aws-request-id'
  };

  const samplePost = {
    post_id: 'post-123',
    brand_id: 'brand-456',
    caption: 'Test post caption',
    image_url: 's3://test-bucket/images/test.png',
    platform: 'instagram',
    scheduled_time: '2024-12-01T10:00:00Z',
    status: 'Scheduled',
    content_pillar: 'Product Updates',
    created_at: '2024-11-01T10:00:00Z',
    published_at: null,
    error_message: null,
    retry_count: 0
  };

  const sampleBrand = {
    brand_id: 'brand-456',
    brand_name: 'Test Brand',
    has_instagram_connection: true,
    has_linkedin_connection: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSNSSend.mockReset();
    mockS3Send.mockReset();
    mockSecretsManagerSend.mockReset();
    mockDecrypt.mockReset();
    mockGetPostById.mockReset();
    mockUpdatePostStatus.mockReset();
    mockIncrementRetryCount.mockReset();
    mockGetBrandById.mockReset();
    mockLogSuccess.mockReset();
    mockLogFailure.mockReset();
    mockPublishEvent.mockReset();
    mockGetConnection.mockReset();
    mockHttpsRequest.mockReset();

    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';
    process.env.EVENTBRIDGE_BUS_NAME = 'default';
    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Helper to create mock HTTPS response
  const createMockHttpsResponse = (statusCode, data) => {
    const mockResponse = {
      statusCode,
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify(data));
        } else if (event === 'end') {
          callback();
        }
      })
    };
    return mockResponse;
  };

  describe('Successful Instagram publication', () => {
    test('should successfully publish post to Instagram', async () => {
      const instagramPost = { ...samplePost, platform: 'instagram' };
      const instagramConnection = {
        brand_id: 'brand-456',
        platform: 'instagram',
        access_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:token',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        connection_status: 'active'
      };
      
      mockGetPostById.mockResolvedValue(instagramPost);
      mockGetBrandById.mockResolvedValue(sampleBrand);
      mockGetConnection.mockResolvedValue(instagramConnection);
      mockSecretsManagerSend.mockResolvedValue({
        SecretString: 'valid-instagram-token'
      });
      mockDecrypt.mockResolvedValue('decrypted-instagram-token');
      mockUpdatePostStatus.mockResolvedValue({
        ...instagramPost,
        status: 'Published',
        published_at: new Date().toISOString()
      });
      mockLogSuccess.mockResolvedValue({});
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      const containerResponse = createMockHttpsResponse(200, { id: 'container-123' });
      const publishResponse = createMockHttpsResponse(200, { id: 'post-456' });
      
      let callCount = 0;
      mockHttpsRequest.mockImplementation((options, callback) => {
        callCount++;
        const mockReq = {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
        
        setImmediate(() => {
          callback(callCount === 1 ? containerResponse : publishResponse);
        });
        
        return mockReq;
      });

      const event = { post_id: 'post-123' };
      const handlerPromise = handler(event, mockContext);
      await jest.runAllTimersAsync();
      const result = await handlerPromise;

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Post published successfully');
      expect(mockUpdatePostStatus).toHaveBeenCalledWith(
        'post-123',
        'Published',
        expect.objectContaining({
          published_at: expect.any(String),
          error_message: null
        })
      );
    });
  });

  describe('Successful LinkedIn publication', () => {
    test('should successfully publish post to LinkedIn', async () => {
      const linkedinPost = { ...samplePost, platform: 'linkedin' };
      const linkedinConnection = {
        brand_id: 'brand-456',
        platform: 'linkedin',
        access_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:token',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        connection_status: 'active'
      };
      
      mockGetPostById.mockResolvedValue(linkedinPost);
      mockGetBrandById.mockResolvedValue(sampleBrand);
      mockGetConnection.mockResolvedValue(linkedinConnection);
      mockSecretsManagerSend.mockResolvedValue({
        SecretString: 'valid-linkedin-token'
      });
      mockDecrypt.mockResolvedValue('decrypted-linkedin-token');
      mockUpdatePostStatus.mockResolvedValue({
        ...linkedinPost,
        status: 'Published',
        published_at: new Date().toISOString()
      });
      mockLogSuccess.mockResolvedValue({});
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('fake-image-data');
        }
      };
      mockS3Send.mockResolvedValue({ Body: mockStream });

      const registerResponse = createMockHttpsResponse(200, {
        value: {
          uploadMechanism: {
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
              uploadUrl: 'https://api.linkedin.com/upload'
            }
          },
          asset: 'urn:li:asset:123'
        }
      });
      const uploadResponse = createMockHttpsResponse(201, {});
      const postResponse = createMockHttpsResponse(201, { id: 'post-789' });
      
      let callCount = 0;
      mockHttpsRequest.mockImplementation((options, callback) => {
        callCount++;
        const mockReq = {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
        
        setImmediate(() => {
          if (callCount === 1) callback(registerResponse);
          else if (callCount === 2) callback(uploadResponse);
          else callback(postResponse);
        });
        
        return mockReq;
      });

      const event = { post_id: 'post-123' };
      const handlerPromise = handler(event, mockContext);
      await jest.runAllTimersAsync();
      const result = await handlerPromise;

      expect(result.statusCode).toBe(200);
      expect(result.platform).toBe('linkedin');
      expect(mockS3Send).toHaveBeenCalled();
    });
  });

  describe('Retry logic on API failures', () => {
    test('should retry up to 2 times on API failure', async () => {
      const instagramPost = { ...samplePost, platform: 'instagram' };
      const instagramConnection = {
        brand_id: 'brand-456',
        platform: 'instagram',
        access_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:token',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        connection_status: 'active'
      };
      
      mockGetPostById.mockResolvedValue(instagramPost);
      mockGetBrandById.mockResolvedValue(sampleBrand);
      mockGetConnection.mockResolvedValue(instagramConnection);
      mockSecretsManagerSend.mockResolvedValue({
        SecretString: 'valid-instagram-token'
      });
      mockDecrypt.mockResolvedValue('instagram-token');
      mockIncrementRetryCount.mockResolvedValue({ ...instagramPost, retry_count: 1 });
      mockUpdatePostStatus.mockResolvedValue({
        ...instagramPost,
        status: 'Failed',
        error_message: 'API Error'
      });
      mockLogFailure.mockResolvedValue({});
      mockSNSSend.mockResolvedValue({});

      const errorResponse = createMockHttpsResponse(500, { error: 'API Error' });
      mockHttpsRequest.mockImplementation((options, callback) => {
        const mockReq = {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
        
        setImmediate(() => callback(errorResponse));
        return mockReq;
      });

      const event = { post_id: 'post-123' };
      const handlerPromise = handler(event, mockContext);
      await jest.runAllTimersAsync();
      const result = await handlerPromise;

      expect(result.statusCode).toBe(500);
      expect(mockIncrementRetryCount).toHaveBeenCalledTimes(2);
      expect(mockHttpsRequest).toHaveBeenCalledTimes(3);
    });
  });

  describe('SNS notification on final failure', () => {
    test('should mark post as Failed and log failure when all retries fail', async () => {
      const instagramPost = { ...samplePost, platform: 'instagram' };
      const instagramConnection = {
        brand_id: 'brand-456',
        platform: 'instagram',
        access_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:token',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        connection_status: 'active'
      };
      
      mockGetPostById.mockResolvedValue(instagramPost);
      mockGetBrandById.mockResolvedValue(sampleBrand);
      mockGetConnection.mockResolvedValue(instagramConnection);
      mockSecretsManagerSend.mockResolvedValue({
        SecretString: 'valid-instagram-token'
      });
      mockDecrypt.mockResolvedValue('instagram-token');
      mockIncrementRetryCount.mockResolvedValue({ ...instagramPost, retry_count: 1 });
      mockUpdatePostStatus.mockResolvedValue({
        ...instagramPost,
        status: 'Failed',
        error_message: 'Instagram publishing failed'
      });
      mockLogFailure.mockResolvedValue({});
      mockSNSSend.mockResolvedValue({});

      const errorResponse = createMockHttpsResponse(500, { error: 'API Error' });
      mockHttpsRequest.mockImplementation((options, callback) => {
        const mockReq = {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
        
        setImmediate(() => callback(errorResponse));
        return mockReq;
      });

      const event = { post_id: 'post-123' };
      const handlerPromise = handler(event, mockContext);
      await jest.runAllTimersAsync();
      const result = await handlerPromise;

      // Verify the post publication failed after all retries
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Post publication failed after all retries');
      
      // Verify post status was updated to Failed with error message
      expect(mockUpdatePostStatus).toHaveBeenCalledWith(
        'post-123',
        'Failed',
        expect.objectContaining({
          error_message: expect.any(String)
        })
      );
      
      // Verify failure was logged to automation logs
      expect(mockLogFailure).toHaveBeenCalledWith(
        'brand-456',
        'post_publish',
        expect.any(String),
        expect.any(Number),
        'post-123'
      );
      
      // Verify retry logic was executed (2 retries after initial attempt)
      expect(mockIncrementRetryCount).toHaveBeenCalledTimes(2);
      expect(mockHttpsRequest).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  describe('Secrets Manager Integration', () => {
    const sampleConnection = {
      brand_id: 'brand-456',
      platform: 'instagram',
      platform_user_id: 'ig-user-123',
      platform_username: '@testbrand',
      access_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:experta/oauth/brand-456/instagram/access_token',
      refresh_token_secret_arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:experta/oauth/brand-456/instagram/refresh_token',
      token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      scopes_granted: ['instagram_basic', 'instagram_content_publish'],
      connection_status: 'active',
      connected_at: '2024-01-01T00:00:00Z',
      last_refreshed_at: '2024-01-01T00:00:00Z',
      profile_data: {}
    };

    const updatedBrand = {
      brand_id: 'brand-456',
      brand_name: 'Test Brand',
      has_instagram_connection: true,
      has_linkedin_connection: false
    };

    test('should retrieve token from Secrets Manager', async () => {
      const instagramPost = { ...samplePost, platform: 'instagram' };
      
      mockGetPostById.mockResolvedValue(instagramPost);
      mockGetBrandById.mockResolvedValue(updatedBrand);
      mockGetConnection.mockResolvedValue(sampleConnection);
      mockSecretsManagerSend.mockResolvedValue({
        SecretString: 'valid-access-token'
      });
      mockUpdatePostStatus.mockResolvedValue({
        ...instagramPost,
        status: 'Published',
        published_at: new Date().toISOString()
      });
      mockLogSuccess.mockResolvedValue({});
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      const containerResponse = createMockHttpsResponse(200, { id: 'container-123' });
      const publishResponse = createMockHttpsResponse(200, { id: 'post-456' });
      
      let callCount = 0;
      mockHttpsRequest.mockImplementation((options, callback) => {
        callCount++;
        const mockReq = {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
        
        setImmediate(() => {
          callback(callCount === 1 ? containerResponse : publishResponse);
        });
        
        return mockReq;
      });

      const event = { post_id: 'post-123' };
      const handlerPromise = handler(event, mockContext);
      await jest.runAllTimersAsync();
      const result = await handlerPromise;

      expect(result.statusCode).toBe(200);
      expect(mockGetConnection).toHaveBeenCalledWith('brand-456', 'instagram');
      expect(mockSecretsManagerSend).toHaveBeenCalled();
      expect(mockUpdatePostStatus).toHaveBeenCalledWith(
        'post-123',
        'Published',
        expect.objectContaining({
          published_at: expect.any(String),
          error_message: null
        })
      );
    });

    test('should refresh token if expired', async () => {
      const instagramPost = { ...samplePost, platform: 'instagram' };
      const expiredConnection = {
        ...sampleConnection,
        token_expires_at: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
      };
      const refreshedConnection = {
        ...sampleConnection,
        token_expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      };
      
      mockGetPostById.mockResolvedValue(instagramPost);
      mockGetBrandById.mockResolvedValue(updatedBrand);
      mockGetConnection
        .mockResolvedValueOnce(expiredConnection) // First call returns expired
        .mockResolvedValueOnce(refreshedConnection); // Second call after refresh
      mockSecretsManagerSend.mockResolvedValue({
        SecretString: 'refreshed-access-token'
      });
      mockUpdatePostStatus.mockResolvedValue({
        ...instagramPost,
        status: 'Published',
        published_at: new Date().toISOString()
      });
      mockLogSuccess.mockResolvedValue({});
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      const refreshResponse = createMockHttpsResponse(200, {
        message: 'Token refreshed successfully',
        expires_at: refreshedConnection.token_expires_at
      });
      const containerResponse = createMockHttpsResponse(200, { id: 'container-123' });
      const publishResponse = createMockHttpsResponse(200, { id: 'post-456' });
      
      let callCount = 0;
      mockHttpsRequest.mockImplementation((options, callback) => {
        callCount++;
        const mockReq = {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
        
        setImmediate(() => {
          if (callCount === 1) callback(refreshResponse); // Refresh call
          else if (callCount === 2) callback(containerResponse); // Instagram container
          else callback(publishResponse); // Instagram publish
        });
        
        return mockReq;
      });

      process.env.OAUTH_HANDLER_URL = 'https://api.example.com';

      const event = { post_id: 'post-123' };
      const handlerPromise = handler(event, mockContext);
      await jest.runAllTimersAsync();
      const result = await handlerPromise;

      expect(result.statusCode).toBe(200);
      expect(mockGetConnection).toHaveBeenCalledTimes(2); // Once to check expiry, once after refresh
      expect(mockHttpsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'api.example.com',
          path: '/oauth/refresh/instagram',
          method: 'POST'
        }),
        expect.any(Function)
      );
    });

    test('should handle expired token handling', async () => {
      const instagramPost = { ...samplePost, platform: 'instagram' };
      const expiredConnection = {
        ...sampleConnection,
        token_expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
        refresh_token_secret_arn: null // No refresh token
      };
      
      mockGetPostById.mockResolvedValue(instagramPost);
      mockGetBrandById.mockResolvedValue(updatedBrand);
      mockGetConnection.mockResolvedValue(expiredConnection);
      mockIncrementRetryCount.mockResolvedValue({ ...instagramPost, retry_count: 1 });
      mockUpdatePostStatus.mockResolvedValue({
        ...instagramPost,
        status: 'Failed',
        error_message: 'Token refresh failed'
      });
      mockLogFailure.mockResolvedValue({});
      mockSNSSend.mockResolvedValue({});

      const errorResponse = createMockHttpsResponse(400, { error: 'No refresh token available' });
      mockHttpsRequest.mockImplementation((options, callback) => {
        const mockReq = {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        };
        
        setImmediate(() => callback(errorResponse));
        return mockReq;
      });

      process.env.OAUTH_HANDLER_URL = 'https://api.example.com';

      const event = { post_id: 'post-123' };
      const handlerPromise = handler(event, mockContext);
      await jest.runAllTimersAsync();
      const result = await handlerPromise;

      // Should fail because token refresh failed
      expect(result.statusCode).toBe(500);
      expect(mockGetConnection).toHaveBeenCalledWith('brand-456', 'instagram');
      
      // Verify that the failure was logged
      expect(mockLogFailure).toHaveBeenCalled();
      
      // Verify post was marked as failed
      expect(mockUpdatePostStatus).toHaveBeenCalledWith(
        'post-123',
        'Failed',
        expect.objectContaining({
          error_message: expect.any(String)
        })
      );
    });
  });
});
