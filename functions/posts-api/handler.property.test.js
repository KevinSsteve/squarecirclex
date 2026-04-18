/**
 * Property-Based Tests for Posts API Handler Lambda
 * Feature: experta-ai-social-manager, Property 15: Post Display Completeness
 * Validates: Requirements 7.3
 */

const fc = require('fast-check');

// Mock AWS SDK and shared libraries
const mockGetPostById = jest.fn();
const mockGetPostsByBrandId = jest.fn();
const mockGetPostsByBrandIdAndStatus = jest.fn();
const mockUpdatePost = jest.fn();
const mockDeletePost = jest.fn();
const mockGetBrandById = jest.fn();

jest.mock('../../lib/nodejs/db/posts', () => ({
  PostsDataAccess: {
    getPostById: mockGetPostById,
    getPostsByBrandId: mockGetPostsByBrandId,
    getPostsByBrandIdAndStatus: mockGetPostsByBrandIdAndStatus,
    updatePost: mockUpdatePost,
    deletePost: mockDeletePost,
  }
}));

jest.mock('../../lib/nodejs/db/brands', () => ({
  BrandsDataAccess: {
    getBrandById: mockGetBrandById,
  }
}));

jest.mock('../../lib/nodejs/auth/brand-authorizer', () => ({
  verifyBrandAccess: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../lib/nodejs/errors/error-handler', () => {
  const actualModule = jest.requireActual('../../lib/nodejs/errors/error-handler');
  return actualModule;
});

jest.mock('../../lib/nodejs/validation/request-validator', () => {
  const actualModule = jest.requireActual('../../lib/nodejs/validation/request-validator');
  return actualModule;
});

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  const mockSend = jest.fn();
  return {
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    InvokeModelCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    PutObjectCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/client-eventbridge', () => {
  const mockSend = jest.fn();
  return {
    EventBridgeClient: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    DescribeRuleCommand: jest.fn()
  };
});

// Mock the /opt/nodejs paths to point to relative paths
jest.mock('/opt/nodejs/db/posts', () => {
  return jest.requireMock('../../lib/nodejs/db/posts');
}, { virtual: true });

jest.mock('/opt/nodejs/auth/brand-authorizer', () => {
  return jest.requireMock('../../lib/nodejs/auth/brand-authorizer');
}, { virtual: true });

jest.mock('/opt/nodejs/errors/error-handler', () => {
  return jest.requireMock('../../lib/nodejs/errors/error-handler');
}, { virtual: true });

jest.mock('/opt/nodejs/validation/request-validator', () => {
  return jest.requireMock('../../lib/nodejs/validation/request-validator');
}, { virtual: true });

const { handler } = require('./handler');

describe('Posts API - Property-Based Tests', () => {
  const mockContext = {
    requestId: 'test-request-id',
    functionName: 'posts-api',
    awsRequestId: 'aws-request-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 15: Post Display Completeness', () => {
    // Generator for valid post data
    const postGenerator = () => fc.record({
      post_id: fc.uuid(),
      brand_id: fc.uuid(),
      caption: fc.string({ minLength: 10, maxLength: 500 }),
      image_url: fc.webUrl(),
      platform: fc.constantFrom('instagram', 'linkedin'),
      scheduled_time: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      status: fc.constantFrom('Draft', 'Scheduled', 'Published', 'Failed'),
      content_pillar: fc.string({ minLength: 5, maxLength: 50 }),
      created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      published_at: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()), { nil: null }),
      error_message: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null }),
      retry_count: fc.nat({ max: 3 })
    });

    // Generator for user context
    const userContextGenerator = (brandId) => fc.record({
      userId: fc.uuid(),
      brandId: fc.constant(brandId),
      username: fc.emailAddress()
    });

    // Feature: experta-ai-social-manager, Property 15: Post Display Completeness
    test('single post returned by GET /posts/{post_id} contains all required display fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (post) => {
            // Setup: Mock database to return the post
            mockGetPostById.mockResolvedValue(post);

            // Create event for GET /posts/{post_id}
            const event = {
              httpMethod: 'GET',
              path: `/posts/${post.post_id}`,
              pathParameters: {
                post_id: post.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: post.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: Post must contain all required display fields
            expect(responseBody).toHaveProperty('image_url');
            expect(responseBody).toHaveProperty('caption');
            expect(responseBody).toHaveProperty('platform');
            expect(responseBody).toHaveProperty('scheduled_time');

            // Verify field values are non-null and valid
            expect(responseBody.image_url).toBeTruthy();
            expect(typeof responseBody.image_url).toBe('string');
            
            expect(responseBody.caption).toBeTruthy();
            expect(typeof responseBody.caption).toBe('string');
            
            expect(responseBody.platform).toBeTruthy();
            expect(['instagram', 'linkedin']).toContain(responseBody.platform);
            
            expect(responseBody.scheduled_time).toBeTruthy();
            expect(typeof responseBody.scheduled_time).toBe('string');
            
            // Verify scheduled_time is valid ISO8601
            const scheduledDate = new Date(responseBody.scheduled_time);
            expect(scheduledDate.toString()).not.toBe('Invalid Date');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 15: Post Display Completeness
    test('all posts returned by GET /posts contain required display fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(postGenerator(), { minLength: 1, maxLength: 20 }),
          fc.uuid(),
          async (posts, brandId) => {
            // Ensure all posts have the same brand_id
            const postsWithSameBrand = posts.map(post => ({
              ...post,
              brand_id: brandId
            }));

            // Setup: Mock database to return the posts
            mockGetPostsByBrandId.mockResolvedValue(postsWithSameBrand);

            // Create event for GET /posts
            const event = {
              httpMethod: 'GET',
              path: '/posts',
              pathParameters: null,
              queryStringParameters: {
                brand_id: brandId
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: brandId,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);
            expect(responseBody).toHaveProperty('posts');
            expect(Array.isArray(responseBody.posts)).toBe(true);

            // Property: Every post in the list must contain all required display fields
            responseBody.posts.forEach(post => {
              expect(post).toHaveProperty('image_url');
              expect(post).toHaveProperty('caption');
              expect(post).toHaveProperty('platform');
              expect(post).toHaveProperty('scheduled_time');

              // Verify field values are non-null and valid
              expect(post.image_url).toBeTruthy();
              expect(typeof post.image_url).toBe('string');
              
              expect(post.caption).toBeTruthy();
              expect(typeof post.caption).toBe('string');
              
              expect(post.platform).toBeTruthy();
              expect(['instagram', 'linkedin']).toContain(post.platform);
              
              expect(post.scheduled_time).toBeTruthy();
              expect(typeof post.scheduled_time).toBe('string');
              
              // Verify scheduled_time is valid ISO8601
              const scheduledDate = new Date(post.scheduled_time);
              expect(scheduledDate.toString()).not.toBe('Invalid Date');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 15: Post Display Completeness
    test('posts filtered by status contain all required display fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(postGenerator(), { minLength: 1, maxLength: 20 }),
          fc.uuid(),
          fc.constantFrom('Draft', 'Scheduled', 'Published', 'Failed'),
          async (posts, brandId, status) => {
            // Ensure all posts have the same brand_id and status
            const postsWithSameBrandAndStatus = posts.map(post => ({
              ...post,
              brand_id: brandId,
              status: status
            }));

            // Setup: Mock database to return the posts
            mockGetPostsByBrandIdAndStatus.mockResolvedValue(postsWithSameBrandAndStatus);

            // Create event for GET /posts with status filter
            const event = {
              httpMethod: 'GET',
              path: '/posts',
              pathParameters: null,
              queryStringParameters: {
                brand_id: brandId,
                status: status
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: brandId,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);
            expect(responseBody).toHaveProperty('posts');
            expect(Array.isArray(responseBody.posts)).toBe(true);

            // Property: Every post in the filtered list must contain all required display fields
            responseBody.posts.forEach(post => {
              expect(post).toHaveProperty('image_url');
              expect(post).toHaveProperty('caption');
              expect(post).toHaveProperty('platform');
              expect(post).toHaveProperty('scheduled_time');

              // Verify field values are non-null and valid
              expect(post.image_url).toBeTruthy();
              expect(typeof post.image_url).toBe('string');
              
              expect(post.caption).toBeTruthy();
              expect(typeof post.caption).toBe('string');
              
              expect(post.platform).toBeTruthy();
              expect(['instagram', 'linkedin']).toContain(post.platform);
              
              expect(post.scheduled_time).toBeTruthy();
              expect(typeof post.scheduled_time).toBe('string');
              
              // Verify scheduled_time is valid ISO8601
              const scheduledDate = new Date(post.scheduled_time);
              expect(scheduledDate.toString()).not.toBe('Invalid Date');

              // Verify status matches filter
              expect(post.status).toBe(status);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 15: Post Display Completeness
    test('posts filtered by date range contain all required display fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(postGenerator(), { minLength: 1, maxLength: 20 }),
          fc.uuid(),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }).filter(d => !isNaN(d.getTime())),
          fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }).filter(d => !isNaN(d.getTime())),
          async (posts, brandId, startDate, endDate) => {
            // Ensure dates are valid
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              return true; // Skip invalid dates
            }

            // Ensure all posts have the same brand_id and are within date range
            const postsWithinRange = posts.map(post => ({
              ...post,
              brand_id: brandId,
              scheduled_time: new Date(
                startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
              ).toISOString()
            }));

            // Setup: Mock database to return the posts
            mockGetPostsByBrandId.mockResolvedValue(postsWithinRange);

            // Create event for GET /posts with date range filter
            const event = {
              httpMethod: 'GET',
              path: '/posts',
              pathParameters: null,
              queryStringParameters: {
                brand_id: brandId,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: brandId,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);
            expect(responseBody).toHaveProperty('posts');
            expect(Array.isArray(responseBody.posts)).toBe(true);

            // Property: Every post in the date-filtered list must contain all required display fields
            responseBody.posts.forEach(post => {
              expect(post).toHaveProperty('image_url');
              expect(post).toHaveProperty('caption');
              expect(post).toHaveProperty('platform');
              expect(post).toHaveProperty('scheduled_time');

              // Verify field values are non-null and valid
              expect(post.image_url).toBeTruthy();
              expect(typeof post.image_url).toBe('string');
              
              expect(post.caption).toBeTruthy();
              expect(typeof post.caption).toBe('string');
              
              expect(post.platform).toBeTruthy();
              expect(['instagram', 'linkedin']).toContain(post.platform);
              
              expect(post.scheduled_time).toBeTruthy();
              expect(typeof post.scheduled_time).toBe('string');
              
              // Verify scheduled_time is valid ISO8601
              const scheduledDate = new Date(post.scheduled_time);
              expect(scheduledDate.toString()).not.toBe('Invalid Date');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 15: Post Display Completeness
    test('image_url field is a valid URL format', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (post) => {
            // Setup: Mock database to return the post
            mockGetPostById.mockResolvedValue(post);

            // Create event for GET /posts/{post_id}
            const event = {
              httpMethod: 'GET',
              path: `/posts/${post.post_id}`,
              pathParameters: {
                post_id: post.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: post.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: image_url must be a valid URL
            expect(responseBody.image_url).toBeTruthy();
            
            // Should be parseable as a URL
            expect(() => new URL(responseBody.image_url)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 15: Post Display Completeness
    test('caption field is non-empty string', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (post) => {
            // Setup: Mock database to return the post
            mockGetPostById.mockResolvedValue(post);

            // Create event for GET /posts/{post_id}
            const event = {
              httpMethod: 'GET',
              path: `/posts/${post.post_id}`,
              pathParameters: {
                post_id: post.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: post.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: caption must be a non-empty string
            expect(responseBody.caption).toBeTruthy();
            expect(typeof responseBody.caption).toBe('string');
            expect(responseBody.caption.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 15: Post Display Completeness
    test('platform field is one of valid platform values', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (post) => {
            // Setup: Mock database to return the post
            mockGetPostById.mockResolvedValue(post);

            // Create event for GET /posts/{post_id}
            const event = {
              httpMethod: 'GET',
              path: `/posts/${post.post_id}`,
              pathParameters: {
                post_id: post.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: post.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: platform must be one of the valid values
            expect(responseBody.platform).toBeTruthy();
            expect(['instagram', 'linkedin']).toContain(responseBody.platform);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 15: Post Display Completeness
    test('scheduled_time is a valid ISO8601 timestamp in the future or past', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (post) => {
            // Setup: Mock database to return the post
            mockGetPostById.mockResolvedValue(post);

            // Create event for GET /posts/{post_id}
            const event = {
              httpMethod: 'GET',
              path: `/posts/${post.post_id}`,
              pathParameters: {
                post_id: post.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: post.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: scheduled_time must be a valid ISO8601 timestamp
            expect(responseBody.scheduled_time).toBeTruthy();
            expect(typeof responseBody.scheduled_time).toBe('string');
            
            // Must be parseable as a date
            const scheduledDate = new Date(responseBody.scheduled_time);
            expect(scheduledDate.toString()).not.toBe('Invalid Date');
            
            // Should be in ISO8601 format
            expect(responseBody.scheduled_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 16: Calendar Sorting', () => {
    // Generator for valid post data
    const postGenerator = () => fc.record({
      post_id: fc.uuid(),
      brand_id: fc.uuid(),
      caption: fc.string({ minLength: 10, maxLength: 500 }),
      image_url: fc.webUrl(),
      platform: fc.constantFrom('instagram', 'linkedin'),
      scheduled_time: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      status: fc.constantFrom('Draft', 'Scheduled', 'Published', 'Failed'),
      content_pillar: fc.string({ minLength: 5, maxLength: 50 }),
      created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      published_at: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()), { nil: null }),
      error_message: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null }),
      retry_count: fc.nat({ max: 3 })
    });

    // Feature: experta-ai-social-manager, Property 16: Calendar Sorting
    test('posts returned by GET /posts are sorted by scheduled_time in ascending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(postGenerator(), { minLength: 2, maxLength: 30 }),
          fc.uuid(),
          async (posts, brandId) => {
            // Ensure all posts have the same brand_id
            const postsWithSameBrand = posts.map(post => ({
              ...post,
              brand_id: brandId
            }));

            // Setup: Mock database to return the posts (unsorted)
            mockGetPostsByBrandId.mockResolvedValue(postsWithSameBrand);

            // Create event for GET /posts
            const event = {
              httpMethod: 'GET',
              path: '/posts',
              pathParameters: null,
              queryStringParameters: {
                brand_id: brandId
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: brandId,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);
            expect(responseBody).toHaveProperty('posts');
            expect(Array.isArray(responseBody.posts)).toBe(true);

            // Property: Posts must be sorted by scheduled_time in ascending order
            const returnedPosts = responseBody.posts;
            
            if (returnedPosts.length > 1) {
              for (let i = 0; i < returnedPosts.length - 1; i++) {
                const currentTime = new Date(returnedPosts[i].scheduled_time).getTime();
                const nextTime = new Date(returnedPosts[i + 1].scheduled_time).getTime();
                
                // Current post's scheduled_time should be <= next post's scheduled_time
                expect(currentTime).toBeLessThanOrEqual(nextTime);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 16: Calendar Sorting
    test('posts filtered by status are sorted by scheduled_time in ascending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(postGenerator(), { minLength: 2, maxLength: 30 }),
          fc.uuid(),
          fc.constantFrom('Draft', 'Scheduled', 'Published', 'Failed'),
          async (posts, brandId, status) => {
            // Ensure all posts have the same brand_id and status
            const postsWithSameBrandAndStatus = posts.map(post => ({
              ...post,
              brand_id: brandId,
              status: status
            }));

            // Setup: Mock database to return the posts (unsorted)
            mockGetPostsByBrandIdAndStatus.mockResolvedValue(postsWithSameBrandAndStatus);

            // Create event for GET /posts with status filter
            const event = {
              httpMethod: 'GET',
              path: '/posts',
              pathParameters: null,
              queryStringParameters: {
                brand_id: brandId,
                status: status
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: brandId,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);
            expect(responseBody).toHaveProperty('posts');
            expect(Array.isArray(responseBody.posts)).toBe(true);

            // Property: Posts must be sorted by scheduled_time in ascending order
            const returnedPosts = responseBody.posts;
            
            if (returnedPosts.length > 1) {
              for (let i = 0; i < returnedPosts.length - 1; i++) {
                const currentTime = new Date(returnedPosts[i].scheduled_time).getTime();
                const nextTime = new Date(returnedPosts[i + 1].scheduled_time).getTime();
                
                // Current post's scheduled_time should be <= next post's scheduled_time
                expect(currentTime).toBeLessThanOrEqual(nextTime);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 16: Calendar Sorting
    test('posts filtered by date range are sorted by scheduled_time in ascending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(postGenerator(), { minLength: 2, maxLength: 30 }),
          fc.uuid(),
          fc.integer({ min: 0, max: 364 }), // Days offset from start
          fc.integer({ min: 1, max: 365 }), // Days offset from start (must be > first offset)
          async (posts, brandId, offset1, offset2) => {
            // Create valid date range
            const baseDate = new Date('2024-01-01T00:00:00.000Z');
            const startOffset = Math.min(offset1, offset2);
            const endOffset = Math.max(offset1, offset2);
            
            const startDate = new Date(baseDate.getTime() + startOffset * 24 * 60 * 60 * 1000);
            const endDate = new Date(baseDate.getTime() + endOffset * 24 * 60 * 60 * 1000);
            
            // Ensure all posts have the same brand_id and are within date range
            const postsWithinRange = posts.map(post => ({
              ...post,
              brand_id: brandId,
              scheduled_time: new Date(
                startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
              ).toISOString()
            }));

            // Setup: Mock database to return the posts (unsorted)
            mockGetPostsByBrandId.mockResolvedValue(postsWithinRange);

            // Create event for GET /posts with date range filter
            const event = {
              httpMethod: 'GET',
              path: '/posts',
              pathParameters: null,
              queryStringParameters: {
                brand_id: brandId,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: brandId,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);
            expect(responseBody).toHaveProperty('posts');
            expect(Array.isArray(responseBody.posts)).toBe(true);

            // Property: Posts must be sorted by scheduled_time in ascending order
            const returnedPosts = responseBody.posts;
            
            if (returnedPosts.length > 1) {
              for (let i = 0; i < returnedPosts.length - 1; i++) {
                const currentTime = new Date(returnedPosts[i].scheduled_time).getTime();
                const nextTime = new Date(returnedPosts[i + 1].scheduled_time).getTime();
                
                // Current post's scheduled_time should be <= next post's scheduled_time
                expect(currentTime).toBeLessThanOrEqual(nextTime);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 16: Calendar Sorting
    test('sorting is stable across multiple API calls with same data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(postGenerator(), { minLength: 2, maxLength: 20 }),
          fc.uuid(),
          async (posts, brandId) => {
            // Ensure all posts have the same brand_id
            const postsWithSameBrand = posts.map(post => ({
              ...post,
              brand_id: brandId
            }));

            // Setup: Mock database to return the posts
            mockGetPostsByBrandId.mockResolvedValue(postsWithSameBrand);

            // Create event for GET /posts
            const event = {
              httpMethod: 'GET',
              path: '/posts',
              pathParameters: null,
              queryStringParameters: {
                brand_id: brandId
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: brandId,
                  username: 'test@example.com'
                }
              }
            };

            // Act: Call handler twice
            const result1 = await handler(event, mockContext);
            const result2 = await handler(event, mockContext);

            // Assert: Both responses should be successful
            expect(result1.statusCode).toBe(200);
            expect(result2.statusCode).toBe(200);

            // Parse response bodies
            const responseBody1 = JSON.parse(result1.body);
            const responseBody2 = JSON.parse(result2.body);

            // Property: Sorting should be consistent across calls
            const posts1 = responseBody1.posts;
            const posts2 = responseBody2.posts;

            expect(posts1.length).toBe(posts2.length);

            // Verify both results have the same order
            for (let i = 0; i < posts1.length; i++) {
              expect(posts1[i].post_id).toBe(posts2[i].post_id);
              expect(posts1[i].scheduled_time).toBe(posts2[i].scheduled_time);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 16: Calendar Sorting
    test('posts with identical scheduled_time maintain stable order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(postGenerator(), { minLength: 3, maxLength: 10 }),
          fc.uuid(),
          fc.integer({ min: 0, max: 730 }), // Days offset from base date
          async (posts, brandId, daysOffset) => {
            // Create a valid date
            const baseDate = new Date('2024-01-01T00:00:00.000Z');
            const sharedTime = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
            
            // Create posts with identical scheduled_time
            const postsWithSameTime = posts.map(post => ({
              ...post,
              brand_id: brandId,
              scheduled_time: sharedTime.toISOString()
            }));

            // Setup: Mock database to return the posts
            mockGetPostsByBrandId.mockResolvedValue(postsWithSameTime);

            // Create event for GET /posts
            const event = {
              httpMethod: 'GET',
              path: '/posts',
              pathParameters: null,
              queryStringParameters: {
                brand_id: brandId
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: brandId,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);
            expect(responseBody).toHaveProperty('posts');
            expect(Array.isArray(responseBody.posts)).toBe(true);

            // Property: All posts should have the same scheduled_time
            const returnedPosts = responseBody.posts;
            
            returnedPosts.forEach(post => {
              expect(post.scheduled_time).toBe(sharedTime.toISOString());
            });

            // Property: Sorting should still be valid (all times equal)
            if (returnedPosts.length > 1) {
              for (let i = 0; i < returnedPosts.length - 1; i++) {
                const currentTime = new Date(returnedPosts[i].scheduled_time).getTime();
                const nextTime = new Date(returnedPosts[i + 1].scheduled_time).getTime();
                
                expect(currentTime).toBeLessThanOrEqual(nextTime);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 26: Post Edit Status Preservation', () => {
    // Generator for valid post data
    const postGenerator = () => fc.record({
      post_id: fc.uuid(),
      brand_id: fc.uuid(),
      caption: fc.string({ minLength: 10, maxLength: 500 }),
      image_url: fc.webUrl(),
      platform: fc.constantFrom('instagram', 'linkedin'),
      scheduled_time: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      status: fc.constantFrom('Draft', 'Scheduled', 'Published', 'Failed'),
      content_pillar: fc.string({ minLength: 5, maxLength: 50 }),
      created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      published_at: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()), { nil: null }),
      error_message: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null }),
      retry_count: fc.nat({ max: 3 })
    });

    // Generator for post updates that don't include status
    const postUpdatesWithoutStatusGenerator = () => fc.record({
      caption: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: undefined }),
      image_url: fc.option(fc.webUrl(), { nil: undefined }),
      content_pillar: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
      scheduled_time: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()), { nil: undefined })
    }).map(updates => {
      // Remove undefined values
      const cleanedUpdates = {};
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          cleanedUpdates[key] = updates[key];
        }
      });
      return cleanedUpdates;
    }).filter(updates => Object.keys(updates).length > 0); // Ensure at least one field is being updated

    // Feature: experta-ai-social-manager, Property 26: Post Edit Status Preservation
    test('editing post without status field preserves original status', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          postUpdatesWithoutStatusGenerator(),
          async (originalPost, updates) => {
            // Ensure updates don't include status
            const updatesWithoutStatus = { ...updates };
            delete updatesWithoutStatus.status;

            // Skip if no updates remain
            if (Object.keys(updatesWithoutStatus).length === 0) {
              return true;
            }

            // Setup: Mock database to return the original post, then the updated post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock updatePost to return post with updates applied but status preserved
            const updatedPost = {
              ...originalPost,
              ...updatesWithoutStatus,
              // Status should remain unchanged
              status: originalPost.status
            };
            mockUpdatePost.mockResolvedValue(updatedPost);

            // Create event for PUT /posts/{post_id}
            const event = {
              httpMethod: 'PUT',
              path: `/posts/${originalPost.post_id}`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              body: JSON.stringify(updatesWithoutStatus),
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: Status should remain unchanged from original
            expect(responseBody.status).toBe(originalPost.status);

            // Verify updatePost was called with updates that don't include status
            expect(mockUpdatePost).toHaveBeenCalledWith(
              originalPost.post_id,
              expect.not.objectContaining({ status: expect.anything() })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 26: Post Edit Status Preservation
    test('editing caption only preserves status', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (originalPost, newCaption) => {
            // Setup: Mock database to return the original post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock updatePost to return post with caption updated but status preserved
            const updatedPost = {
              ...originalPost,
              caption: newCaption,
              status: originalPost.status
            };
            mockUpdatePost.mockResolvedValue(updatedPost);

            // Create event for PUT /posts/{post_id} with only caption update
            const event = {
              httpMethod: 'PUT',
              path: `/posts/${originalPost.post_id}`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              body: JSON.stringify({ caption: newCaption }),
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: Status should remain unchanged
            expect(responseBody.status).toBe(originalPost.status);
            
            // Caption should be updated
            expect(responseBody.caption).toBe(newCaption);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 26: Post Edit Status Preservation
    test('editing image_url only preserves status', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          fc.webUrl(),
          async (originalPost, newImageUrl) => {
            // Setup: Mock database to return the original post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock updatePost to return post with image_url updated but status preserved
            const updatedPost = {
              ...originalPost,
              image_url: newImageUrl,
              status: originalPost.status
            };
            mockUpdatePost.mockResolvedValue(updatedPost);

            // Create event for PUT /posts/{post_id} with only image_url update
            const event = {
              httpMethod: 'PUT',
              path: `/posts/${originalPost.post_id}`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              body: JSON.stringify({ image_url: newImageUrl }),
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: Status should remain unchanged
            expect(responseBody.status).toBe(originalPost.status);
            
            // Image URL should be updated
            expect(responseBody.image_url).toBe(newImageUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 26: Post Edit Status Preservation
    test('editing multiple fields without status preserves status', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.webUrl(),
          fc.string({ minLength: 5, maxLength: 50 }),
          async (originalPost, newCaption, newImageUrl, newContentPillar) => {
            // Setup: Mock database to return the original post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock updatePost to return post with multiple fields updated but status preserved
            const updatedPost = {
              ...originalPost,
              caption: newCaption,
              image_url: newImageUrl,
              content_pillar: newContentPillar,
              status: originalPost.status
            };
            mockUpdatePost.mockResolvedValue(updatedPost);

            // Create event for PUT /posts/{post_id} with multiple updates
            const event = {
              httpMethod: 'PUT',
              path: `/posts/${originalPost.post_id}`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              body: JSON.stringify({
                caption: newCaption,
                image_url: newImageUrl,
                content_pillar: newContentPillar
              }),
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: Status should remain unchanged
            expect(responseBody.status).toBe(originalPost.status);
            
            // Other fields should be updated
            expect(responseBody.caption).toBe(newCaption);
            expect(responseBody.image_url).toBe(newImageUrl);
            expect(responseBody.content_pillar).toBe(newContentPillar);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 26: Post Edit Status Preservation
    test('status preservation works for all status values', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (originalPost, newCaption) => {
            // Setup: Mock database to return the original post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock updatePost to return post with caption updated but status preserved
            const updatedPost = {
              ...originalPost,
              caption: newCaption,
              status: originalPost.status
            };
            mockUpdatePost.mockResolvedValue(updatedPost);

            // Create event for PUT /posts/{post_id} with only caption update
            const event = {
              httpMethod: 'PUT',
              path: `/posts/${originalPost.post_id}`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              body: JSON.stringify({ caption: newCaption }),
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: Status should remain unchanged regardless of original status value
            expect(responseBody.status).toBe(originalPost.status);
            expect(['Draft', 'Scheduled', 'Published', 'Failed']).toContain(responseBody.status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 25: Post Regeneration Invariants', () => {
    // Generator for valid post data
    const postGenerator = () => fc.record({
      post_id: fc.uuid(),
      brand_id: fc.uuid(),
      caption: fc.string({ minLength: 10, maxLength: 500 }),
      image_url: fc.webUrl(),
      platform: fc.constantFrom('instagram', 'linkedin'),
      scheduled_time: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      status: fc.constantFrom('Draft', 'Scheduled', 'Published', 'Failed'),
      content_pillar: fc.string({ minLength: 5, maxLength: 50 }),
      created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      published_at: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()), { nil: null }),
      error_message: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null }),
      retry_count: fc.nat({ max: 3 })
    });

    // Feature: experta-ai-social-manager, Property 25: Post Regeneration Invariants
    test('regenerating post preserves scheduled_time', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (originalPost) => {
            // Setup: Mock database to return the original post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock brand data
            const brandData = {
              brand_id: originalPost.brand_id,
              brand_name: 'Test Brand',
              industry: 'Technology',
              target_audience: 'Developers',
              tone_of_voice: 'Professional',
              visual_style: 'Modern and clean',
              content_pillars: ['Product Updates', 'Industry News'],
              post_times: ['09:00', '15:00']
            };
            mockGetBrandById.mockResolvedValue(brandData);
            
            // Mock Bedrock response
            const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
            const bedrockInstance = new BedrockRuntimeClient();
            bedrockInstance.send.mockResolvedValue({
              body: new TextEncoder().encode(JSON.stringify({
                content: [{ text: 'New generated caption #test' }]
              }))
            });

            // Mock S3 response
            const { S3Client } = require('@aws-sdk/client-s3');
            const s3Instance = new S3Client();
            s3Instance.send.mockResolvedValue({});

            // Mock EventBridge response
            const { EventBridgeClient } = require('@aws-sdk/client-eventbridge');
            const eventBridgeInstance = new EventBridgeClient();
            eventBridgeInstance.send.mockResolvedValue({
              Name: `experta-publish-post-${originalPost.post_id}`,
              State: 'ENABLED'
            });
            
            // Mock updatePost to return post with new content but preserved scheduled_time
            const regeneratedPost = {
              ...originalPost,
              caption: 'New generated caption #test',
              image_url: 'https://s3.amazonaws.com/bucket/new-image.png',
              scheduled_time: originalPost.scheduled_time, // MUST be preserved
              updated_at: new Date().toISOString()
            };
            mockUpdatePost.mockResolvedValue(regeneratedPost);

            // Create event for POST /posts/{post_id}/regenerate
            const event = {
              httpMethod: 'POST',
              path: `/posts/${originalPost.post_id}/regenerate`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: scheduled_time MUST remain unchanged after regeneration
            expect(responseBody.scheduled_time).toBe(originalPost.scheduled_time);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 25: Post Regeneration Invariants
    test('regenerating post preserves content_pillar', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (originalPost) => {
            // Setup: Mock database to return the original post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock brand data
            const brandData = {
              brand_id: originalPost.brand_id,
              brand_name: 'Test Brand',
              industry: 'Technology',
              target_audience: 'Developers',
              tone_of_voice: 'Professional',
              visual_style: 'Modern and clean',
              content_pillars: ['Product Updates', 'Industry News'],
              post_times: ['09:00', '15:00']
            };
            mockGetBrandById.mockResolvedValue(brandData);
            
            // Mock AWS SDK clients
            const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
            const bedrockInstance = new BedrockRuntimeClient();
            bedrockInstance.send.mockResolvedValue({
              body: new TextEncoder().encode(JSON.stringify({
                content: [{ text: 'New generated caption #test' }]
              }))
            });

            const { S3Client } = require('@aws-sdk/client-s3');
            const s3Instance = new S3Client();
            s3Instance.send.mockResolvedValue({});

            const { EventBridgeClient } = require('@aws-sdk/client-eventbridge');
            const eventBridgeInstance = new EventBridgeClient();
            eventBridgeInstance.send.mockResolvedValue({
              Name: `experta-publish-post-${originalPost.post_id}`,
              State: 'ENABLED'
            });
            
            // Mock updatePost to return post with new content but preserved content_pillar
            const regeneratedPost = {
              ...originalPost,
              caption: 'New generated caption #test',
              image_url: 'https://s3.amazonaws.com/bucket/new-image.png',
              content_pillar: originalPost.content_pillar, // MUST be preserved
              updated_at: new Date().toISOString()
            };
            mockUpdatePost.mockResolvedValue(regeneratedPost);

            // Create event for POST /posts/{post_id}/regenerate
            const event = {
              httpMethod: 'POST',
              path: `/posts/${originalPost.post_id}/regenerate`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: content_pillar MUST remain unchanged after regeneration
            expect(responseBody.content_pillar).toBe(originalPost.content_pillar);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 25: Post Regeneration Invariants
    test('regenerating post preserves both scheduled_time and content_pillar', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (originalPost) => {
            // Setup: Mock database to return the original post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock brand data
            const brandData = {
              brand_id: originalPost.brand_id,
              brand_name: 'Test Brand',
              industry: 'Technology',
              target_audience: 'Developers',
              tone_of_voice: 'Professional',
              visual_style: 'Modern and clean',
              content_pillars: ['Product Updates', 'Industry News'],
              post_times: ['09:00', '15:00']
            };
            mockGetBrandById.mockResolvedValue(brandData);
            
            // Mock AWS SDK clients
            const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
            const bedrockInstance = new BedrockRuntimeClient();
            bedrockInstance.send.mockResolvedValue({
              body: new TextEncoder().encode(JSON.stringify({
                content: [{ text: 'New generated caption #test' }]
              }))
            });

            const { S3Client } = require('@aws-sdk/client-s3');
            const s3Instance = new S3Client();
            s3Instance.send.mockResolvedValue({});

            const { EventBridgeClient } = require('@aws-sdk/client-eventbridge');
            const eventBridgeInstance = new EventBridgeClient();
            eventBridgeInstance.send.mockResolvedValue({
              Name: `experta-publish-post-${originalPost.post_id}`,
              State: 'ENABLED'
            });
            
            // Mock updatePost to return post with new content but preserved invariants
            const regeneratedPost = {
              ...originalPost,
              caption: 'New generated caption #test',
              image_url: 'https://s3.amazonaws.com/bucket/new-image.png',
              scheduled_time: originalPost.scheduled_time, // MUST be preserved
              content_pillar: originalPost.content_pillar, // MUST be preserved
              updated_at: new Date().toISOString()
            };
            mockUpdatePost.mockResolvedValue(regeneratedPost);

            // Create event for POST /posts/{post_id}/regenerate
            const event = {
              httpMethod: 'POST',
              path: `/posts/${originalPost.post_id}/regenerate`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: Both scheduled_time and content_pillar MUST remain unchanged
            expect(responseBody.scheduled_time).toBe(originalPost.scheduled_time);
            expect(responseBody.content_pillar).toBe(originalPost.content_pillar);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 25: Post Regeneration Invariants
    test('regeneration updates caption and image_url but nothing else', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (originalPost) => {
            // Setup: Mock database to return the original post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock brand data
            const brandData = {
              brand_id: originalPost.brand_id,
              brand_name: 'Test Brand',
              industry: 'Technology',
              target_audience: 'Developers',
              tone_of_voice: 'Professional',
              visual_style: 'Modern and clean',
              content_pillars: ['Product Updates', 'Industry News'],
              post_times: ['09:00', '15:00']
            };
            mockGetBrandById.mockResolvedValue(brandData);
            
            // Mock AWS SDK clients
            const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
            const bedrockInstance = new BedrockRuntimeClient();
            bedrockInstance.send.mockResolvedValue({
              body: new TextEncoder().encode(JSON.stringify({
                content: [{ text: 'New generated caption #test' }]
              }))
            });

            const { S3Client } = require('@aws-sdk/client-s3');
            const s3Instance = new S3Client();
            s3Instance.send.mockResolvedValue({});

            const { EventBridgeClient } = require('@aws-sdk/client-eventbridge');
            const eventBridgeInstance = new EventBridgeClient();
            eventBridgeInstance.send.mockResolvedValue({
              Name: `experta-publish-post-${originalPost.post_id}`,
              State: 'ENABLED'
            });
            
            // Mock updatePost to capture what fields are being updated
            let capturedUpdates = null;
            mockUpdatePost.mockImplementation((postId, updates) => {
              capturedUpdates = updates;
              return Promise.resolve({
                ...originalPost,
                ...updates
              });
            });

            // Create event for POST /posts/{post_id}/regenerate
            const event = {
              httpMethod: 'POST',
              path: `/posts/${originalPost.post_id}/regenerate`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Property: Only caption, image_url, and updated_at should be in updates
            expect(capturedUpdates).toBeDefined();
            expect(capturedUpdates).toHaveProperty('caption');
            expect(capturedUpdates).toHaveProperty('image_url');
            expect(capturedUpdates).toHaveProperty('updated_at');
            
            // These fields should NOT be in updates (they are preserved)
            expect(capturedUpdates).not.toHaveProperty('scheduled_time');
            expect(capturedUpdates).not.toHaveProperty('content_pillar');
            expect(capturedUpdates).not.toHaveProperty('status');
            expect(capturedUpdates).not.toHaveProperty('platform');
            expect(capturedUpdates).not.toHaveProperty('brand_id');
            expect(capturedUpdates).not.toHaveProperty('post_id');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 27: EventBridge Rule Preservation', () => {
    // Generator for valid post data
    const postGenerator = () => fc.record({
      post_id: fc.uuid(),
      brand_id: fc.uuid(),
      caption: fc.string({ minLength: 10, maxLength: 500 }),
      image_url: fc.webUrl(),
      platform: fc.constantFrom('instagram', 'linkedin'),
      scheduled_time: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      status: fc.constantFrom('Draft', 'Scheduled', 'Published', 'Failed'),
      content_pillar: fc.string({ minLength: 5, maxLength: 50 }),
      created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      published_at: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()), { nil: null }),
      error_message: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null }),
      retry_count: fc.nat({ max: 3 })
    });

    // Feature: experta-ai-social-manager, Property 27: EventBridge Rule Preservation
    test('regeneration verifies EventBridge rule exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (originalPost) => {
            // Setup: Mock database to return the original post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock brand data
            const brandData = {
              brand_id: originalPost.brand_id,
              brand_name: 'Test Brand',
              industry: 'Technology',
              target_audience: 'Developers',
              tone_of_voice: 'Professional',
              visual_style: 'Modern and clean',
              content_pillars: ['Product Updates', 'Industry News'],
              post_times: ['09:00', '15:00']
            };
            mockGetBrandById.mockResolvedValue(brandData);
            
            // Mock Bedrock response
            const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
            const bedrockInstance = new BedrockRuntimeClient();
            bedrockInstance.send.mockResolvedValue({
              body: new TextEncoder().encode(JSON.stringify({
                content: [{ text: 'Generated caption' }]
              }))
            });

            // Mock S3 response
            const { S3Client } = require('@aws-sdk/client-s3');
            const s3Instance = new S3Client();
            s3Instance.send.mockResolvedValue({});

            // Mock EventBridge to return rule exists
            const { EventBridgeClient } = require('@aws-sdk/client-eventbridge');
            const eventBridgeInstance = new EventBridgeClient();
            eventBridgeInstance.send.mockResolvedValue({
              Name: `experta-publish-post-${originalPost.post_id}`,
              State: 'ENABLED',
              ScheduleExpression: 'cron(0 10 15 3 ? 2024)'
            });
            
            // Mock updatePost
            const regeneratedPost = {
              ...originalPost,
              caption: 'New caption',
              image_url: 'https://s3.amazonaws.com/bucket/new.png',
              updated_at: new Date().toISOString()
            };
            mockUpdatePost.mockResolvedValue(regeneratedPost);

            // Create event for POST /posts/{post_id}/regenerate
            const event = {
              httpMethod: 'POST',
              path: `/posts/${originalPost.post_id}/regenerate`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should be successful
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: EventBridge rule verification should be performed
            expect(eventBridgeInstance.send).toHaveBeenCalled();
            
            // Response should indicate rule exists
            expect(responseBody).toHaveProperty('eventbridge_rule_exists');
            expect(responseBody.eventbridge_rule_exists).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 27: EventBridge Rule Preservation
    test('regeneration handles missing EventBridge rule gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          postGenerator(),
          async (originalPost) => {
            // Setup: Mock database to return the original post
            mockGetPostById.mockResolvedValue(originalPost);
            
            // Mock brand data
            const brandData = {
              brand_id: originalPost.brand_id,
              brand_name: 'Test Brand',
              industry: 'Technology',
              target_audience: 'Developers',
              tone_of_voice: 'Professional',
              visual_style: 'Modern and clean',
              content_pillars: ['Product Updates', 'Industry News'],
              post_times: ['09:00', '15:00']
            };
            mockGetBrandById.mockResolvedValue(brandData);
            
            // Mock Bedrock response
            const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
            const bedrockInstance = new BedrockRuntimeClient();
            bedrockInstance.send.mockResolvedValue({
              body: new TextEncoder().encode(JSON.stringify({
                content: [{ text: 'Generated caption' }]
              }))
            });

            // Mock S3 response
            const { S3Client } = require('@aws-sdk/client-s3');
            const s3Instance = new S3Client();
            s3Instance.send.mockResolvedValue({});

            // Mock EventBridge to return rule not found
            const { EventBridgeClient } = require('@aws-sdk/client-eventbridge');
            const eventBridgeInstance = new EventBridgeClient();
            const notFoundError = new Error('ResourceNotFoundException');
            notFoundError.name = 'ResourceNotFoundException';
            eventBridgeInstance.send.mockRejectedValue(notFoundError);
            
            // Mock updatePost
            const regeneratedPost = {
              ...originalPost,
              caption: 'New caption',
              image_url: 'https://s3.amazonaws.com/bucket/new.png',
              updated_at: new Date().toISOString()
            };
            mockUpdatePost.mockResolvedValue(regeneratedPost);

            // Create event for POST /posts/{post_id}/regenerate
            const event = {
              httpMethod: 'POST',
              path: `/posts/${originalPost.post_id}/regenerate`,
              pathParameters: {
                post_id: originalPost.post_id
              },
              requestContext: {
                authorizer: {
                  userId: 'test-user-id',
                  brandId: originalPost.brand_id,
                  username: 'test@example.com'
                }
              }
            };

            // Act
            const result = await handler(event, mockContext);

            // Assert: Response should still be successful (rule check doesn't block regeneration)
            expect(result.statusCode).toBe(200);

            // Parse response body
            const responseBody = JSON.parse(result.body);

            // Property: Missing rule should be reported but not cause failure
            expect(responseBody).toHaveProperty('eventbridge_rule_exists');
            expect(responseBody.eventbridge_rule_exists).toBe(false);
            
            // Post should still be regenerated
            expect(responseBody.caption).toBeDefined();
            expect(responseBody.image_url).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
