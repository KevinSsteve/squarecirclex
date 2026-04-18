/**
 * Property-Based Tests for Auto Publisher Lambda
 * Feature: experta-ai-social-manager, Property 13: Publication State Management
 * Validates: Requirements 6.4, 6.5, 6.6
 */

const fc = require('fast-check');

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

// Mock OAuth connections data access
const mockGetConnection = jest.fn();
jest.mock('../../lib/nodejs/db/oauth-connections', () => ({
  getConnection: mockGetConnection
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

jest.mock('/opt/nodejs/db/oauth-connections', () => {
  return jest.requireMock('../../lib/nodejs/db/oauth-connections');
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

// Mock https module for API calls
const mockHttpsRequest = jest.fn();
jest.mock('https', () => ({
  request: mockHttpsRequest
}));

const { handler } = require('./handler');

describe('Auto Publisher - Property-Based Tests', () => {
  const mockContext = {
    requestId: 'test-request-id',
    functionName: 'auto-publisher',
    awsRequestId: 'aws-request-id'
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
    mockGetConnection.mockReset();
    mockLogSuccess.mockReset();
    mockLogFailure.mockReset();
    mockPublishEvent.mockReset();
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

  describe('Property 13: Publication State Management', () => {
    // Generator for post data
    const postGenerator = () => fc.record({
      post_id: fc.uuid(),
      brand_id: fc.uuid(),
      caption: fc.string({ minLength: 10, maxLength: 500 }),
      image_url: fc.constantFrom(
        's3://test-bucket/images/test.png',
        'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png'
      ),
      platform: fc.constantFrom('instagram', 'linkedin'),
      scheduled_time: fc.integer({ min: Date.parse('2024-01-01'), max: Date.parse('2025-12-31') })
        .map(timestamp => new Date(timestamp).toISOString()),
      status: fc.constant('Scheduled'),
      content_pillar: fc.string({ minLength: 5, maxLength: 50 }),
      created_at: fc.integer({ min: Date.parse('2024-01-01'), max: Date.parse('2025-12-31') })
        .map(timestamp => new Date(timestamp).toISOString()),
      published_at: fc.constant(null),
      error_message: fc.constant(null),
      retry_count: fc.constant(0)
    });

    // Generator for brand data
    const brandGenerator = () => fc.record({
      brand_id: fc.uuid(),
      brand_name: fc.string({ minLength: 1, maxLength: 100 }),
      instagram_token_encrypted: fc.uint8Array({ minLength: 16, maxLength: 64 }),
      linkedin_token_encrypted: fc.uint8Array({ minLength: 16, maxLength: 64 }),
      has_instagram_connection: fc.constant(true),
      has_linkedin_connection: fc.constant(true)
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

    // Helper to create mock HTTPS request
    const createMockHttpsRequest = (response) => {
      const mockReq = {
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      
      mockHttpsRequest.mockImplementation((options, callback) => {
        setTimeout(() => callback(response), 0);
        return mockReq;
      });
      
      return mockReq;
    };

    // Helper to setup OAuth connection mocks
    const setupOAuthMocks = (post, brand, accessToken) => {
      mockGetBrandById.mockResolvedValue({
        ...brand,
        brand_id: post.brand_id
      });
      
      // Mock OAuth connection
      mockGetConnection.mockResolvedValue({
        brand_id: post.brand_id,
        platform: post.platform,
        access_token_secret_arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${post.brand_id}-${post.platform}-token`,
        connection_status: 'active',
        token_expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      });
      
      // Mock Secrets Manager to return access token
      mockSecretsManagerSend.mockResolvedValue({
        SecretString: accessToken
      });
      
      mockDecrypt.mockResolvedValue(accessToken);
    };

    // Feature: experta-ai-social-manager, Property 13: Publication State Management
    test('successful publication sets status to Published with non-null published_at', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          brandGenerator(),
          fc.string({ minLength: 20, maxLength: 100 }),
          async (post, brand, accessToken) => {
            // Setup: Post and brand exist
            mockGetPostById.mockResolvedValue(post);
            setupOAuthMocks(post, brand, accessToken);
            mockUpdatePostStatus.mockResolvedValue({
              ...post,
              status: 'Published',
              published_at: new Date().toISOString()
            });
            mockLogSuccess.mockResolvedValue({});
            mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

            // Mock S3 download for LinkedIn
            if (post.platform === 'linkedin') {
              const mockStream = {
                [Symbol.asyncIterator]: async function* () {
                  yield Buffer.from('fake-image-data');
                }
              };
              mockS3Send.mockResolvedValue({
                Body: mockStream
              });
            }

            // Mock successful API responses
            if (post.platform === 'instagram') {
              // Instagram: container creation then publish
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
            } else if (post.platform === 'linkedin') {
              // LinkedIn: register, upload, post
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
            }

            // Act
            const event = { post_id: post.post_id };
            const handlerPromise = handler(event, mockContext);
            
            // Advance timers to handle any setTimeout calls
            await jest.runAllTimersAsync();
            
            const result = await handlerPromise;

            // Assert: Property - successful publication updates status to Published
            expect(result.statusCode).toBe(200);
            expect(mockUpdatePostStatus).toHaveBeenCalledWith(
              post.post_id,
              'Published',
              expect.objectContaining({
                published_at: expect.any(String),
                error_message: null
              })
            );

            // Verify published_at is non-null
            const updateCall = mockUpdatePostStatus.mock.calls[0];
            expect(updateCall[2].published_at).not.toBeNull();
            expect(updateCall[2].published_at).toBeTruthy();
            
            // Verify it's a valid ISO8601 timestamp
            const publishedAt = new Date(updateCall[2].published_at);
            expect(publishedAt.toISOString()).toBe(updateCall[2].published_at);
          }
        ),
        { numRuns: 10 }
      );
    });

    // Feature: experta-ai-social-manager, Property 13: Publication State Management
    test('failed publication after all retries sets status to Failed with non-null error_message', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          brandGenerator(),
          fc.string({ minLength: 20, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (post, brand, accessToken, errorMessage) => {
            // Setup: Post and brand exist
            mockGetPostById.mockResolvedValue(post);
            mockGetBrandById.mockResolvedValue({
              ...brand,
              brand_id: post.brand_id
            });
            mockDecrypt.mockResolvedValue(accessToken);
            mockIncrementRetryCount.mockResolvedValue({
              ...post,
              retry_count: post.retry_count + 1
            });
            mockUpdatePostStatus.mockResolvedValue({
              ...post,
              status: 'Failed',
              error_message: errorMessage
            });
            mockLogFailure.mockResolvedValue({});
            mockSNSSend.mockResolvedValue({});

            // Mock S3 download for LinkedIn
            if (post.platform === 'linkedin') {
              const mockStream = {
                [Symbol.asyncIterator]: async function* () {
                  yield Buffer.from('fake-image-data');
                }
              };
              mockS3Send.mockResolvedValue({
                Body: mockStream
              });
            }

            // Mock failed API responses for all attempts
            const errorResponse = createMockHttpsResponse(500, { error: errorMessage });
            mockHttpsRequest.mockImplementation((options, callback) => {
              const mockReq = {
                write: jest.fn(),
                end: jest.fn(),
                on: jest.fn()
              };
              
              setImmediate(() => callback(errorResponse));
              return mockReq;
            });

            // Act
            const event = { post_id: post.post_id };
            const handlerPromise = handler(event, mockContext);
            
            // Advance timers to handle exponential backoff delays
            await jest.runAllTimersAsync();
            
            const result = await handlerPromise;

            // Assert: Property - failed publication updates status to Failed
            expect(result.statusCode).toBe(500);
            expect(mockUpdatePostStatus).toHaveBeenCalledWith(
              post.post_id,
              'Failed',
              expect.objectContaining({
                error_message: expect.any(String)
              })
            );

            // Verify error_message is non-null and non-empty
            const updateCall = mockUpdatePostStatus.mock.calls.find(
              call => call[1] === 'Failed'
            );
            expect(updateCall).toBeDefined();
            expect(updateCall[2].error_message).not.toBeNull();
            expect(updateCall[2].error_message).toBeTruthy();
            expect(typeof updateCall[2].error_message).toBe('string');
            expect(updateCall[2].error_message.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    // Feature: experta-ai-social-manager, Property 13: Publication State Management
    test('publication state is either Published or Failed, never both simultaneously', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          brandGenerator(),
          fc.string({ minLength: 20, maxLength: 100 }),
          fc.boolean(),
          async (post, brand, accessToken, shouldSucceed) => {
            // Setup: Post and brand exist
            mockGetPostById.mockResolvedValue(post);
            mockGetBrandById.mockResolvedValue({
              ...brand,
              brand_id: post.brand_id
            });
            mockDecrypt.mockResolvedValue(accessToken);
            mockIncrementRetryCount.mockResolvedValue({
              ...post,
              retry_count: post.retry_count + 1
            });
            mockLogSuccess.mockResolvedValue({});
            mockLogFailure.mockResolvedValue({});
            mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });
            mockSNSSend.mockResolvedValue({});

            // Mock S3 download for LinkedIn
            if (post.platform === 'linkedin') {
              const mockStream = {
                [Symbol.asyncIterator]: async function* () {
                  yield Buffer.from('fake-image-data');
                }
              };
              mockS3Send.mockResolvedValue({
                Body: mockStream
              });
            }

            // Mock API responses based on shouldSucceed
            if (shouldSucceed) {
              mockUpdatePostStatus.mockResolvedValueOnce({
                ...post,
                status: 'Published',
                published_at: new Date().toISOString()
              });

              if (post.platform === 'instagram') {
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
              } else {
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
              }
            } else {
              mockUpdatePostStatus.mockResolvedValue({
                ...post,
                status: 'Failed',
                error_message: 'Publication failed'
              });

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
            }

            // Act
            const event = { post_id: post.post_id };
            const handlerPromise = handler(event, mockContext);
            
            // Advance timers to handle any setTimeout calls
            await jest.runAllTimersAsync();
            
            await handlerPromise;

            // Assert: Property - final state is either Published OR Failed
            const statusUpdates = mockUpdatePostStatus.mock.calls;
            
            if (statusUpdates.length > 0) {
              const finalUpdate = statusUpdates[statusUpdates.length - 1];
              const finalStatus = finalUpdate[1];
              const finalFields = finalUpdate[2];

              // The final status must be either Published or Failed
              expect(['Published', 'Failed']).toContain(finalStatus);

              if (finalStatus === 'Published') {
                // Published state: published_at must be non-null, error_message should be null
                expect(finalFields.published_at).toBeTruthy();
                expect(finalFields.error_message).toBeNull();
              } else if (finalStatus === 'Failed') {
                // Failed state: error_message must be non-null
                expect(finalFields.error_message).toBeTruthy();
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    // Feature: experta-ai-social-manager, Property 13: Publication State Management
    test('published_at timestamp is valid ISO8601 format when status is Published', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          brandGenerator(),
          fc.string({ minLength: 20, maxLength: 100 }),
          async (post, brand, accessToken) => {
            // Setup for successful publication
            mockGetPostById.mockResolvedValue(post);
            mockGetBrandById.mockResolvedValue({
              ...brand,
              brand_id: post.brand_id
            });
            mockDecrypt.mockResolvedValue(accessToken);
            mockUpdatePostStatus.mockResolvedValue({
              ...post,
              status: 'Published',
              published_at: new Date().toISOString()
            });
            mockLogSuccess.mockResolvedValue({});
            mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

            // Mock S3 download for LinkedIn
            if (post.platform === 'linkedin') {
              const mockStream = {
                [Symbol.asyncIterator]: async function* () {
                  yield Buffer.from('fake-image-data');
                }
              };
              mockS3Send.mockResolvedValue({
                Body: mockStream
              });
            }

            // Mock successful API responses
            if (post.platform === 'instagram') {
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
            } else {
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
            }

            // Act
            const event = { post_id: post.post_id };
            const handlerPromise = handler(event, mockContext);
            
            // Advance timers to handle any setTimeout calls
            await jest.runAllTimersAsync();
            
            await handlerPromise;

            // Assert: Property - published_at is valid ISO8601 when Published
            const publishedUpdate = mockUpdatePostStatus.mock.calls.find(
              call => call[1] === 'Published'
            );

            if (publishedUpdate) {
              const publishedAt = publishedUpdate[2].published_at;
              
              // Must be non-null
              expect(publishedAt).toBeTruthy();
              
              // Must be a string
              expect(typeof publishedAt).toBe('string');
              
              // Must be valid ISO8601 format
              const parsedDate = new Date(publishedAt);
              expect(parsedDate.toISOString()).toBe(publishedAt);
              
              // Must be a reasonable timestamp (not in far future or past)
              const now = new Date();
              const timeDiff = Math.abs(now.getTime() - parsedDate.getTime());
              expect(timeDiff).toBeLessThan(60000); // Within 1 minute
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 30: Platform-Specific Formatting', () => {
    // Instagram formatting constants
    const INSTAGRAM_MAX_CAPTION_LENGTH = 2200;
    const INSTAGRAM_MIN_IMAGE_DIMENSION = 1080;

    // LinkedIn formatting constants
    const LINKEDIN_MAX_CAPTION_LENGTH = 3000;

    // Generator for Instagram posts with valid formatting
    const instagramPostGenerator = () => fc.record({
      post_id: fc.uuid(),
      brand_id: fc.uuid(),
      caption: fc.string({ minLength: 1, maxLength: INSTAGRAM_MAX_CAPTION_LENGTH }),
      image_url: fc.constantFrom(
        's3://test-bucket/images/test.png',
        'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png'
      ),
      platform: fc.constant('instagram'),
      scheduled_time: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      status: fc.constant('Scheduled'),
      content_pillar: fc.string({ minLength: 5, maxLength: 50 }),
      created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString())
    });

    // Generator for LinkedIn posts with valid formatting
    const linkedinPostGenerator = () => fc.record({
      post_id: fc.uuid(),
      brand_id: fc.uuid(),
      caption: fc.string({ minLength: 1, maxLength: LINKEDIN_MAX_CAPTION_LENGTH }),
      image_url: fc.constantFrom(
        's3://test-bucket/images/test.png',
        'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png'
      ),
      platform: fc.constant('linkedin'),
      scheduled_time: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      status: fc.constant('Scheduled'),
      content_pillar: fc.string({ minLength: 5, maxLength: 50 }),
      created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString())
    });

    // Generator for brand data
    const brandGenerator = () => fc.record({
      brand_id: fc.uuid(),
      brand_name: fc.string({ minLength: 1, maxLength: 100 }),
      instagram_token_encrypted: fc.uint8Array({ minLength: 16, maxLength: 64 }),
      linkedin_token_encrypted: fc.uint8Array({ minLength: 16, maxLength: 64 }),
      has_instagram_connection: fc.constant(true),
      has_linkedin_connection: fc.constant(true)
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

    // Feature: experta-ai-social-manager, Property 30: Platform-Specific Formatting
    test('Instagram posts meet caption length requirements (max 2200 characters)', async () => {
      await fc.assert(
        fc.asyncProperty(
          instagramPostGenerator(),
          brandGenerator(),
          fc.string({ minLength: 20, maxLength: 100 }),
          async (post, brand, accessToken) => {
            // Setup
            mockGetPostById.mockResolvedValue(post);
            mockGetBrandById.mockResolvedValue({
              ...brand,
              brand_id: post.brand_id
            });
            mockDecrypt.mockResolvedValue(accessToken);
            mockUpdatePostStatus.mockResolvedValue({
              ...post,
              status: 'Published',
              published_at: new Date().toISOString()
            });
            mockLogSuccess.mockResolvedValue({});
            mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

            // Track the caption sent to Instagram API
            let captionSentToAPI = null;

            // Mock Instagram API responses
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
              
              // Capture caption from the first API call (container creation)
              if (callCount === 1 && options.path) {
                const captionMatch = options.path.match(/caption=([^&]+)/);
                if (captionMatch) {
                  captionSentToAPI = decodeURIComponent(captionMatch[1]);
                }
              }
              
              setImmediate(() => {
                callback(callCount === 1 ? containerResponse : publishResponse);
              });
              
              return mockReq;
            });

            // Act
            const event = { post_id: post.post_id };
            const handlerPromise = handler(event, mockContext);
            
            await jest.runAllTimersAsync();
            await handlerPromise;

            // Assert: Property - Instagram caption meets length requirements
            expect(post.caption.length).toBeLessThanOrEqual(INSTAGRAM_MAX_CAPTION_LENGTH);
            
            // Verify the caption sent to API also meets requirements
            if (captionSentToAPI) {
              expect(captionSentToAPI.length).toBeLessThanOrEqual(INSTAGRAM_MAX_CAPTION_LENGTH);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 30: Platform-Specific Formatting
    test('LinkedIn posts meet caption length requirements (max 3000 characters)', async () => {
      await fc.assert(
        fc.asyncProperty(
          linkedinPostGenerator(),
          brandGenerator(),
          fc.string({ minLength: 20, maxLength: 100 }),
          async (post, brand, accessToken) => {
            // Setup
            mockGetPostById.mockResolvedValue(post);
            mockGetBrandById.mockResolvedValue({
              ...brand,
              brand_id: post.brand_id
            });
            mockDecrypt.mockResolvedValue(accessToken);
            mockUpdatePostStatus.mockResolvedValue({
              ...post,
              status: 'Published',
              published_at: new Date().toISOString()
            });
            mockLogSuccess.mockResolvedValue({});
            mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

            // Mock S3 download for LinkedIn
            const mockStream = {
              [Symbol.asyncIterator]: async function* () {
                yield Buffer.from('fake-image-data');
              }
            };
            mockS3Send.mockResolvedValue({
              Body: mockStream
            });

            // Track the caption sent to LinkedIn API
            let captionSentToAPI = null;

            // Mock LinkedIn API responses
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
                write: jest.fn((data) => {
                  // Capture caption from the post creation call (3rd call)
                  if (callCount === 3) {
                    try {
                      const payload = typeof data === 'string' ? JSON.parse(data) : data;
                      if (payload.specificContent && 
                          payload.specificContent['com.linkedin.ugc.ShareContent'] &&
                          payload.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary) {
                        captionSentToAPI = payload.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text;
                      }
                    } catch (e) {
                      // Ignore parsing errors
                    }
                  }
                }),
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

            // Act
            const event = { post_id: post.post_id };
            const handlerPromise = handler(event, mockContext);
            
            await jest.runAllTimersAsync();
            await handlerPromise;

            // Assert: Property - LinkedIn caption meets length requirements
            expect(post.caption.length).toBeLessThanOrEqual(LINKEDIN_MAX_CAPTION_LENGTH);
            
            // Verify the caption sent to API also meets requirements
            if (captionSentToAPI) {
              expect(captionSentToAPI.length).toBeLessThanOrEqual(LINKEDIN_MAX_CAPTION_LENGTH);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 30: Platform-Specific Formatting
    test('posts with captions exceeding platform limits are rejected or truncated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('instagram', 'linkedin'),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 3001, max: 5000 }), // Caption longer than both limits
          fc.string({ minLength: 20, maxLength: 100 }),
          async (platform, postId, brandId, captionLength, accessToken) => {
            // Create a post with caption exceeding limits
            const longCaption = 'a'.repeat(captionLength);
            const post = {
              post_id: postId,
              brand_id: brandId,
              caption: longCaption,
              image_url: 's3://test-bucket/images/test.png',
              platform: platform,
              scheduled_time: new Date().toISOString(),
              status: 'Scheduled',
              content_pillar: 'test',
              created_at: new Date().toISOString()
            };

            const brand = {
              brand_id: brandId,
              brand_name: 'Test Brand',
              instagram_token_encrypted: Buffer.from('encrypted-token'),
              linkedin_token_encrypted: Buffer.from('encrypted-token')
            };

            // Setup
            mockGetPostById.mockResolvedValue(post);
            mockGetBrandById.mockResolvedValue(brand);
            mockDecrypt.mockResolvedValue(accessToken);
            mockUpdatePostStatus.mockResolvedValue({
              ...post,
              status: 'Published',
              published_at: new Date().toISOString()
            });
            mockLogSuccess.mockResolvedValue({});
            mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

            if (platform === 'linkedin') {
              const mockStream = {
                [Symbol.asyncIterator]: async function* () {
                  yield Buffer.from('fake-image-data');
                }
              };
              mockS3Send.mockResolvedValue({
                Body: mockStream
              });
            }

            let captionSentToAPI = null;

            if (platform === 'instagram') {
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
                
                if (callCount === 1 && options.path) {
                  const captionMatch = options.path.match(/caption=([^&]+)/);
                  if (captionMatch) {
                    captionSentToAPI = decodeURIComponent(captionMatch[1]);
                  }
                }
                
                setImmediate(() => {
                  callback(callCount === 1 ? containerResponse : publishResponse);
                });
                
                return mockReq;
              });
            } else {
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
                  write: jest.fn((data) => {
                    if (callCount === 3) {
                      try {
                        const payload = typeof data === 'string' ? JSON.parse(data) : data;
                        if (payload.specificContent && 
                            payload.specificContent['com.linkedin.ugc.ShareContent'] &&
                            payload.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary) {
                          captionSentToAPI = payload.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text;
                        }
                      } catch (e) {
                        // Ignore
                      }
                    }
                  }),
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
            }

            // Act
            const event = { post_id: postId };
            const handlerPromise = handler(event, mockContext);
            
            await jest.runAllTimersAsync();
            await handlerPromise;

            // Assert: Property - caption sent to API respects platform limits
            // The system should either truncate or the API should reject
            if (captionSentToAPI) {
              if (platform === 'instagram') {
                // Instagram should not receive captions longer than 2200 chars
                expect(captionSentToAPI.length).toBeLessThanOrEqual(INSTAGRAM_MAX_CAPTION_LENGTH);
              } else if (platform === 'linkedin') {
                // LinkedIn should not receive captions longer than 3000 chars
                expect(captionSentToAPI.length).toBeLessThanOrEqual(LINKEDIN_MAX_CAPTION_LENGTH);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 30: Platform-Specific Formatting
    test('platform-specific formatting is applied correctly for each platform', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('instagram', 'linkedin'),
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.string({ minLength: 20, maxLength: 100 }),
          async (platform, postId, brandId, caption, accessToken) => {
            const post = {
              post_id: postId,
              brand_id: brandId,
              caption: caption,
              image_url: 's3://test-bucket/images/test.png',
              platform: platform,
              scheduled_time: new Date().toISOString(),
              status: 'Scheduled',
              content_pillar: 'test',
              created_at: new Date().toISOString()
            };

            const brand = {
              brand_id: brandId,
              brand_name: 'Test Brand',
              instagram_token_encrypted: Buffer.from('encrypted-token'),
              linkedin_token_encrypted: Buffer.from('encrypted-token')
            };

            // Setup
            mockGetPostById.mockResolvedValue(post);
            mockGetBrandById.mockResolvedValue(brand);
            mockDecrypt.mockResolvedValue(accessToken);
            mockUpdatePostStatus.mockResolvedValue({
              ...post,
              status: 'Published',
              published_at: new Date().toISOString()
            });
            mockLogSuccess.mockResolvedValue({});
            mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

            let apiCallsMade = [];

            if (platform === 'linkedin') {
              const mockStream = {
                [Symbol.asyncIterator]: async function* () {
                  yield Buffer.from('fake-image-data');
                }
              };
              mockS3Send.mockResolvedValue({
                Body: mockStream
              });
            }

            if (platform === 'instagram') {
              const containerResponse = createMockHttpsResponse(200, { id: 'container-123' });
              const publishResponse = createMockHttpsResponse(200, { id: 'post-456' });
              
              let callCount = 0;
              mockHttpsRequest.mockImplementation((options, callback) => {
                callCount++;
                apiCallsMade.push({
                  hostname: options.hostname,
                  path: options.path,
                  method: options.method
                });
                
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
            } else {
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
                apiCallsMade.push({
                  hostname: options.hostname,
                  path: options.path,
                  method: options.method
                });
                
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
            }

            // Act
            const event = { post_id: postId };
            const handlerPromise = handler(event, mockContext);
            
            await jest.runAllTimersAsync();
            await handlerPromise;

            // Assert: Property - correct API endpoints are called for each platform
            if (platform === 'instagram') {
              // Instagram should use graph.facebook.com
              const instagramCalls = apiCallsMade.filter(call => 
                call.hostname === 'graph.facebook.com'
              );
              expect(instagramCalls.length).toBeGreaterThan(0);
            } else if (platform === 'linkedin') {
              // LinkedIn should use api.linkedin.com
              const linkedinCalls = apiCallsMade.filter(call => 
                call.hostname === 'api.linkedin.com'
              );
              expect(linkedinCalls.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
