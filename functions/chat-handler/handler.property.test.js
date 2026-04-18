/**
 * Property-Based Tests for Chat Handler Lambda
 * Feature: experta-ai-social-manager, Property 17: Chat Action Persistence
 * Validates: Requirements 8.3, 8.4, 8.5
 */

const fc = require('fast-check');

// Mock AWS SDK clients
const mockBedrockSend = jest.fn();
const mockS3Send = jest.fn();

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: mockBedrockSend
  })),
  InvokeModelCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send
  })),
  PutObjectCommand: jest.fn()
}));

// Mock shared libraries
const mockGetBrandById = jest.fn();
const mockCreatePost = jest.fn();
const mockGetPostById = jest.fn();
const mockUpdatePost = jest.fn();
const mockDeletePost = jest.fn();

jest.mock('../../lib/nodejs/db/brands', () => ({
  BrandsDataAccess: {
    getBrandById: mockGetBrandById
  }
}));

jest.mock('../../lib/nodejs/db/posts', () => ({
  PostsDataAccess: {
    createPost: mockCreatePost,
    getPostById: mockGetPostById,
    updatePost: mockUpdatePost,
    deletePost: mockDeletePost
  }
}));

jest.mock('../../lib/nodejs/errors/error-handler', () => {
  const actualModule = jest.requireActual('../../lib/nodejs/errors/error-handler');
  return actualModule;
});

// Mock the /opt/nodejs paths to point to relative paths
jest.mock('/opt/nodejs/db/brands', () => {
  return jest.requireMock('../../lib/nodejs/db/brands');
}, { virtual: true });

jest.mock('/opt/nodejs/db/posts', () => {
  return jest.requireMock('../../lib/nodejs/db/posts');
}, { virtual: true });

jest.mock('/opt/nodejs/errors/error-handler', () => {
  return jest.requireMock('../../lib/nodejs/errors/error-handler');
}, { virtual: true });

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-12345')
}));

const { handler } = require('./handler');

describe('Chat Handler - Property-Based Tests', () => {
  const mockContext = {
    requestId: 'test-request-id',
    functionName: 'chat-handler',
    awsRequestId: 'aws-request-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBedrockSend.mockReset();
    mockS3Send.mockReset();
    mockGetBrandById.mockReset();
    mockCreatePost.mockReset();
    mockGetPostById.mockReset();
    mockUpdatePost.mockReset();
    mockDeletePost.mockReset();

    process.env.BEDROCK_CLAUDE_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    process.env.BEDROCK_TITAN_MODEL_ID = 'amazon.titan-image-generator-v1';
    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';
  });

  describe('Property 17: Chat Action Persistence', () => {
    // Generator for brand data
    const brandGenerator = () => fc.record({
      brand_id: fc.uuid(),
      user_id: fc.uuid(),
      brand_name: fc.string({ minLength: 1, maxLength: 100 }),
      industry: fc.string({ minLength: 1, maxLength: 100 }),
      target_audience: fc.string({ minLength: 1, maxLength: 200 }),
      tone_of_voice: fc.string({ minLength: 1, maxLength: 100 }),
      visual_style: fc.string({ minLength: 1, maxLength: 200 }),
      content_pillars: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 3, maxLength: 5 }),
      post_times: fc.array(
        fc.constantFrom('09:00', '12:00', '15:00', '18:00', '21:00'),
        { minLength: 1, maxLength: 3 }
      )
    });

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
      scheduled_time: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString()),
      status: fc.constantFrom('Draft', 'Scheduled', 'Published'),
      content_pillar: fc.string({ minLength: 5, maxLength: 50 }),
      created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        .filter(d => !isNaN(d.getTime()))
        .map(d => d.toISOString())
    });

    // Helper to create mock Claude response for create_post intent
    const createClaudeCreatePostResponse = (theme, pillar) => {
      return {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              intent: 'create_post',
              parameters: {
                caption_theme: theme,
                content_pillar: pillar,
                platform: 'instagram'
              },
              response_text: `I'll create a post about ${theme} for you.`
            })
          }]
        }))
      };
    };

    // Helper to create mock Claude response for modify_post intent
    const createClaudeModifyPostResponse = (postId, newCaption) => {
      return {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              intent: 'modify_post',
              parameters: {
                post_id: postId,
                updates: {
                  caption: newCaption
                }
              },
              response_text: `I'll update the post caption for you.`
            })
          }]
        }))
      };
    };

    // Helper to create mock Claude response for delete_post intent
    const createClaudeDeletePostResponse = (postId) => {
      return {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              intent: 'delete_post',
              parameters: {
                post_id: postId
              },
              response_text: `I'll delete that post for you.`
            })
          }]
        }))
      };
    };

    // Feature: experta-ai-social-manager, Property 17: Chat Action Persistence
    test('create_post intent creates a new post record in DynamoDB', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandGenerator(),
          fc.string({ minLength: 10, maxLength: 100 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          async (brand, captionTheme, contentPillar) => {
            // Reset mocks for each iteration
            mockGetBrandById.mockReset();
            mockCreatePost.mockReset();
            mockBedrockSend.mockReset();
            mockS3Send.mockReset();

            // Setup: Brand exists
            mockGetBrandById.mockResolvedValue(brand);

            // Mock Claude responses for caption generation and intent extraction
            const intentResponse = createClaudeCreatePostResponse(captionTheme, contentPillar);
            const captionResponse = {
              body: new TextEncoder().encode(JSON.stringify({
                content: [{
                  text: `Generated caption about ${captionTheme}`
                }]
              }))
            };

            // Mock Titan image generation
            const imageResponse = {
              body: new TextEncoder().encode(JSON.stringify({
                images: [Buffer.from('fake-image-data').toString('base64')]
              }))
            };

            mockBedrockSend
              .mockResolvedValueOnce(intentResponse)  // Intent extraction
              .mockResolvedValueOnce(captionResponse) // Caption generation
              .mockResolvedValueOnce(imageResponse);  // Image generation

            // Mock S3 upload
            mockS3Send.mockResolvedValue({});

            // Mock post creation
            const createdPost = {
              post_id: 'test-uuid-12345',
              brand_id: brand.brand_id,
              caption: `Generated caption about ${captionTheme}`,
              image_url: `https://test-bucket.s3.us-east-1.amazonaws.com/images/${brand.brand_id}/test-uuid-12345.png`,
              platform: 'instagram',
              scheduled_time: new Date().toISOString(),
              status: 'Scheduled',
              content_pillar: contentPillar
            };
            mockCreatePost.mockResolvedValue(createdPost);

            // Create event
            const event = {
              httpMethod: 'POST',
              path: '/chat',
              body: JSON.stringify({
                message: `Create a post about ${captionTheme}`
              }),
              requestContext: {
                authorizer: {
                  userId: brand.user_id,
                  brandId: brand.brand_id
                }
              }
            };

            // Act
            const response = await handler(event, mockContext);

            // Assert: Property - create_post creates a new post record
            expect(response.statusCode).toBe(200);
            expect(mockCreatePost).toHaveBeenCalledTimes(1);
            
            // Verify the post was created with correct data
            const createCall = mockCreatePost.mock.calls[0][0];
            expect(createCall).toMatchObject({
              brand_id: brand.brand_id,
              caption: expect.any(String),
              image_url: expect.stringContaining('s3'),
              platform: expect.any(String),
              scheduled_time: expect.any(String),
              status: 'Scheduled',
              content_pillar: expect.any(String)
            });

            // Verify response includes the created post
            const responseBody = JSON.parse(response.body);
            expect(responseBody.action_taken).toBe('create_post');
            expect(responseBody.affected_post_id).toBe(createdPost.post_id);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 17: Chat Action Persistence
    test('modify_post intent updates the target post in DynamoDB', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandGenerator(),
          postGenerator(),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (brand, existingPost, newCaption) => {
            // Reset mocks for each iteration
            mockGetBrandById.mockReset();
            mockGetPostById.mockReset();
            mockUpdatePost.mockReset();
            mockBedrockSend.mockReset();

            // Setup: Brand and post exist, post belongs to brand
            const postWithBrandId = { ...existingPost, brand_id: brand.brand_id };
            mockGetBrandById.mockResolvedValue(brand);
            mockGetPostById.mockResolvedValue(postWithBrandId);

            // Mock Claude response for modify intent
            const intentResponse = createClaudeModifyPostResponse(postWithBrandId.post_id, newCaption);
            mockBedrockSend.mockResolvedValueOnce(intentResponse);

            // Mock post update
            const updatedPost = {
              ...postWithBrandId,
              caption: newCaption
            };
            mockUpdatePost.mockResolvedValue(updatedPost);

            // Create event
            const event = {
              httpMethod: 'POST',
              path: '/chat',
              body: JSON.stringify({
                message: `Update the caption to: ${newCaption}`
              }),
              requestContext: {
                authorizer: {
                  userId: brand.user_id,
                  brandId: brand.brand_id
                }
              }
            };

            // Act
            const response = await handler(event, mockContext);

            // Assert: Property - modify_post updates the post
            expect(response.statusCode).toBe(200);
            expect(mockUpdatePost).toHaveBeenCalledTimes(1);
            
            // Verify the post was updated with correct data
            const updateCall = mockUpdatePost.mock.calls[0];
            expect(updateCall[0]).toBe(postWithBrandId.post_id);
            expect(updateCall[1]).toMatchObject({
              caption: newCaption
            });

            // Verify response includes the updated post
            const responseBody = JSON.parse(response.body);
            expect(responseBody.action_taken).toBe('modify_post');
            expect(responseBody.affected_post_id).toBe(postWithBrandId.post_id);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 17: Chat Action Persistence
    test('delete_post intent removes the target post from DynamoDB', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandGenerator(),
          postGenerator(),
          async (brand, existingPost) => {
            // Reset mocks for each iteration
            mockGetBrandById.mockReset();
            mockGetPostById.mockReset();
            mockDeletePost.mockReset();
            mockBedrockSend.mockReset();

            // Setup: Brand and post exist, post belongs to brand
            const postWithBrandId = { ...existingPost, brand_id: brand.brand_id };
            mockGetBrandById.mockResolvedValue(brand);
            mockGetPostById.mockResolvedValue(postWithBrandId);

            // Mock Claude response for delete intent
            const intentResponse = createClaudeDeletePostResponse(postWithBrandId.post_id);
            mockBedrockSend.mockResolvedValueOnce(intentResponse);

            // Mock post deletion
            mockDeletePost.mockResolvedValue({});

            // Create event
            const event = {
              httpMethod: 'POST',
              path: '/chat',
              body: JSON.stringify({
                message: `Delete the post`
              }),
              requestContext: {
                authorizer: {
                  userId: brand.user_id,
                  brandId: brand.brand_id
                }
              }
            };

            // Act
            const response = await handler(event, mockContext);

            // Assert: Property - delete_post removes the post
            expect(response.statusCode).toBe(200);
            expect(mockDeletePost).toHaveBeenCalledTimes(1);
            
            // Verify the correct post was deleted
            const deleteCall = mockDeletePost.mock.calls[0];
            expect(deleteCall[0]).toBe(postWithBrandId.post_id);

            // Verify response confirms deletion
            const responseBody = JSON.parse(response.body);
            expect(responseBody.action_taken).toBe('delete_post');
            expect(responseBody.affected_post_id).toBe(postWithBrandId.post_id);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 17: Chat Action Persistence
    test('all chat actions result in exactly one database operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandGenerator(),
          postGenerator(),
          fc.constantFrom('create_post', 'modify_post', 'delete_post'),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (brand, existingPost, intentType, messageContent) => {
            // Reset mocks for each iteration
            mockGetBrandById.mockReset();
            mockGetPostById.mockReset();
            mockCreatePost.mockReset();
            mockUpdatePost.mockReset();
            mockDeletePost.mockReset();
            mockBedrockSend.mockReset();
            mockS3Send.mockReset();

            // Setup: Brand exists
            const postWithBrandId = { ...existingPost, brand_id: brand.brand_id };
            mockGetBrandById.mockResolvedValue(brand);

            // Setup based on intent type
            let intentResponse;
            if (intentType === 'create_post') {
              intentResponse = createClaudeCreatePostResponse(messageContent, brand.content_pillars[0]);
              
              // Mock caption and image generation
              mockBedrockSend
                .mockResolvedValueOnce(intentResponse)
                .mockResolvedValueOnce({
                  body: new TextEncoder().encode(JSON.stringify({
                    content: [{ text: 'Generated caption' }]
                  }))
                })
                .mockResolvedValueOnce({
                  body: new TextEncoder().encode(JSON.stringify({
                    images: [Buffer.from('fake-image-data').toString('base64')]
                  }))
                });

              mockS3Send.mockResolvedValue({});
              mockCreatePost.mockResolvedValue({
                post_id: 'new-post-id',
                brand_id: brand.brand_id,
                caption: 'Generated caption',
                image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png',
                platform: 'instagram',
                scheduled_time: new Date().toISOString(),
                status: 'Scheduled',
                content_pillar: brand.content_pillars[0]
              });
            } else if (intentType === 'modify_post') {
              mockGetPostById.mockResolvedValue(postWithBrandId);
              intentResponse = createClaudeModifyPostResponse(postWithBrandId.post_id, messageContent);
              mockBedrockSend.mockResolvedValueOnce(intentResponse);
              mockUpdatePost.mockResolvedValue({
                ...postWithBrandId,
                caption: messageContent
              });
            } else { // delete_post
              mockGetPostById.mockResolvedValue(postWithBrandId);
              intentResponse = createClaudeDeletePostResponse(postWithBrandId.post_id);
              mockBedrockSend.mockResolvedValueOnce(intentResponse);
              mockDeletePost.mockResolvedValue({});
            }

            // Create event
            const event = {
              httpMethod: 'POST',
              path: '/chat',
              body: JSON.stringify({
                message: messageContent
              }),
              requestContext: {
                authorizer: {
                  userId: brand.user_id,
                  brandId: brand.brand_id
                }
              }
            };

            // Act
            const response = await handler(event, mockContext);

            // Assert: Property - exactly one database operation per action
            expect(response.statusCode).toBe(200);

            if (intentType === 'create_post') {
              expect(mockCreatePost).toHaveBeenCalledTimes(1);
              expect(mockUpdatePost).not.toHaveBeenCalled();
              expect(mockDeletePost).not.toHaveBeenCalled();
            } else if (intentType === 'modify_post') {
              expect(mockCreatePost).not.toHaveBeenCalled();
              expect(mockUpdatePost).toHaveBeenCalledTimes(1);
              expect(mockDeletePost).not.toHaveBeenCalled();
            } else { // delete_post
              expect(mockCreatePost).not.toHaveBeenCalled();
              expect(mockUpdatePost).not.toHaveBeenCalled();
              expect(mockDeletePost).toHaveBeenCalledTimes(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: experta-ai-social-manager, Property 17: Chat Action Persistence
    test('chat actions preserve data integrity - created/updated posts have all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          brandGenerator(),
          postGenerator(),
          fc.constantFrom('create_post', 'modify_post'),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (brand, existingPost, intentType, messageContent) => {
            // Reset mocks for each iteration
            mockGetBrandById.mockReset();
            mockGetPostById.mockReset();
            mockCreatePost.mockReset();
            mockUpdatePost.mockReset();
            mockBedrockSend.mockReset();
            mockS3Send.mockReset();

            // Setup: Brand exists
            const postWithBrandId = { ...existingPost, brand_id: brand.brand_id };
            mockGetBrandById.mockResolvedValue(brand);

            // Setup based on intent type
            if (intentType === 'create_post') {
              const intentResponse = createClaudeCreatePostResponse(messageContent, brand.content_pillars[0]);
              
              mockBedrockSend
                .mockResolvedValueOnce(intentResponse)
                .mockResolvedValueOnce({
                  body: new TextEncoder().encode(JSON.stringify({
                    content: [{ text: 'Generated caption' }]
                  }))
                })
                .mockResolvedValueOnce({
                  body: new TextEncoder().encode(JSON.stringify({
                    images: [Buffer.from('fake-image-data').toString('base64')]
                  }))
                });

              mockS3Send.mockResolvedValue({});
              mockCreatePost.mockResolvedValue({
                post_id: 'new-post-id',
                brand_id: brand.brand_id,
                caption: 'Generated caption',
                image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png',
                platform: 'instagram',
                scheduled_time: new Date().toISOString(),
                status: 'Scheduled',
                content_pillar: brand.content_pillars[0]
              });
            } else { // modify_post
              mockGetPostById.mockResolvedValue(postWithBrandId);
              const intentResponse = createClaudeModifyPostResponse(postWithBrandId.post_id, messageContent);
              mockBedrockSend.mockResolvedValueOnce(intentResponse);
              mockUpdatePost.mockResolvedValue({
                ...postWithBrandId,
                caption: messageContent
              });
            }

            // Create event
            const event = {
              httpMethod: 'POST',
              path: '/chat',
              body: JSON.stringify({
                message: messageContent
              }),
              requestContext: {
                authorizer: {
                  userId: brand.user_id,
                  brandId: brand.brand_id
                }
              }
            };

            // Act
            const response = await handler(event, mockContext);

            // Assert: Property - posts have all required fields
            expect(response.statusCode).toBe(200);

            if (intentType === 'create_post') {
              const createCall = mockCreatePost.mock.calls[0][0];
              
              // Verify all required fields are present
              expect(createCall).toHaveProperty('brand_id');
              expect(createCall).toHaveProperty('caption');
              expect(createCall).toHaveProperty('image_url');
              expect(createCall).toHaveProperty('platform');
              expect(createCall).toHaveProperty('scheduled_time');
              expect(createCall).toHaveProperty('status');
              expect(createCall).toHaveProperty('content_pillar');

              // Verify field types
              expect(typeof createCall.brand_id).toBe('string');
              expect(typeof createCall.caption).toBe('string');
              expect(typeof createCall.image_url).toBe('string');
              expect(typeof createCall.platform).toBe('string');
              expect(typeof createCall.scheduled_time).toBe('string');
              expect(typeof createCall.status).toBe('string');
              expect(typeof createCall.content_pillar).toBe('string');

              // Verify non-empty values
              expect(createCall.brand_id.length).toBeGreaterThan(0);
              expect(createCall.caption.length).toBeGreaterThan(0);
              expect(createCall.image_url.length).toBeGreaterThan(0);
            } else { // modify_post
              const updateCall = mockUpdatePost.mock.calls[0];
              
              // Verify update was called with post_id and updates
              expect(updateCall[0]).toBe(postWithBrandId.post_id);
              expect(updateCall[1]).toBeDefined();
              expect(typeof updateCall[1]).toBe('object');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
