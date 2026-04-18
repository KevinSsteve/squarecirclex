/**
 * Unit Tests for Chat Handler Lambda
 * Tests: create post intent, modify post intent, delete post intent, query intent
 * Requirements: 8.3, 8.4, 8.5
 */

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
const mockGetPostsByBrandId = jest.fn();
const mockGetPostsByBrandIdAndStatus = jest.fn();

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
    deletePost: mockDeletePost,
    getPostsByBrandId: mockGetPostsByBrandId,
    getPostsByBrandIdAndStatus: mockGetPostsByBrandIdAndStatus
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
  v4: jest.fn(() => 'test-post-uuid-123')
}));

const { handler } = require('./handler');

describe('Chat Handler - Unit Tests', () => {
  const mockContext = {
    requestId: 'test-request-id',
    functionName: 'chat-handler',
    awsRequestId: 'aws-request-id'
  };

  const mockBrand = {
    brand_id: 'brand-123',
    user_id: 'user-456',
    brand_name: 'Test Brand',
    industry: 'Technology',
    target_audience: 'Tech enthusiasts',
    tone_of_voice: 'Professional and friendly',
    visual_style: 'Modern and minimalist',
    content_pillars: ['Product Features', 'Customer Stories', 'Industry Insights'],
    post_times: ['09:00', '15:00', '21:00']
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
    mockGetPostsByBrandId.mockReset();
    mockGetPostsByBrandIdAndStatus.mockReset();

    process.env.BEDROCK_CLAUDE_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    process.env.BEDROCK_TITAN_MODEL_ID = 'amazon.titan-image-generator-v1';
    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';
  });

  // Helper to create mock Claude response
  const createClaudeResponse = (intent, parameters, responseText) => {
    return {
      body: new TextEncoder().encode(JSON.stringify({
        content: [{
          text: JSON.stringify({
            intent,
            parameters,
            response_text: responseText
          })
        }]
      }))
    };
  };

  // Helper to create mock caption response
  const createCaptionResponse = (caption) => {
    return {
      body: new TextEncoder().encode(JSON.stringify({
        content: [{
          text: caption
        }]
      }))
    };
  };

  // Helper to create mock image response
  const createImageResponse = () => {
    return {
      body: new TextEncoder().encode(JSON.stringify({
        images: [Buffer.from('fake-image-data').toString('base64')]
      }))
    };
  };

  describe('Create Post Intent Handling', () => {
    // Requirement 8.3: Test create post intent handling
    test('should create a new post when user requests post creation', async () => {
      // Setup
      mockGetBrandById.mockResolvedValue(mockBrand);

      const intentResponse = createClaudeResponse(
        'create_post',
        {
          caption_theme: 'New product launch',
          content_pillar: 'Product Features',
          platform: 'instagram'
        },
        "I'll create a post about the new product launch for you."
      );

      const captionResponse = createCaptionResponse(
        'Exciting news! Our new product is here. #TechInnovation #NewLaunch'
      );

      const imageResponse = createImageResponse();

      mockBedrockSend
        .mockResolvedValueOnce(intentResponse)
        .mockResolvedValueOnce(captionResponse)
        .mockResolvedValueOnce(imageResponse);

      mockS3Send.mockResolvedValue({});

      const createdPost = {
        post_id: 'test-post-uuid-123',
        brand_id: mockBrand.brand_id,
        caption: 'Exciting news! Our new product is here. #TechInnovation #NewLaunch',
        image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/brand-123/test-post-uuid-123.png',
        platform: 'instagram',
        scheduled_time: new Date().toISOString(),
        status: 'Scheduled',
        content_pillar: 'Product Features'
      };

      mockCreatePost.mockResolvedValue(createdPost);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Create a post about our new product launch'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      
      const responseBody = JSON.parse(response.body);
      expect(responseBody.action_taken).toBe('create_post');
      expect(responseBody.affected_post_id).toBe('test-post-uuid-123');
      expect(responseBody.response).toContain('create a post');

      // Verify post was created with correct data
      expect(mockCreatePost).toHaveBeenCalledTimes(1);
      const createCall = mockCreatePost.mock.calls[0][0];
      expect(createCall).toMatchObject({
        brand_id: mockBrand.brand_id,
        caption: expect.any(String),
        image_url: expect.stringContaining('s3'),
        platform: 'instagram',
        status: 'Scheduled',
        content_pillar: 'Product Features'
      });
    });

    test('should generate caption and image for new post', async () => {
      // Setup
      mockGetBrandById.mockResolvedValue(mockBrand);

      const intentResponse = createClaudeResponse(
        'create_post',
        {
          caption_theme: 'Customer success story',
          content_pillar: 'Customer Stories',
          platform: 'linkedin'
        },
        "I'll create a customer success story post."
      );

      const captionResponse = createCaptionResponse(
        'Meet Sarah, who transformed her business with our solution!'
      );

      const imageResponse = createImageResponse();

      mockBedrockSend
        .mockResolvedValueOnce(intentResponse)
        .mockResolvedValueOnce(captionResponse)
        .mockResolvedValueOnce(imageResponse);

      mockS3Send.mockResolvedValue({});

      mockCreatePost.mockResolvedValue({
        post_id: 'test-post-uuid-123',
        brand_id: mockBrand.brand_id,
        caption: 'Meet Sarah, who transformed her business with our solution!',
        image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/brand-123/test-post-uuid-123.png',
        platform: 'linkedin',
        scheduled_time: new Date().toISOString(),
        status: 'Scheduled',
        content_pillar: 'Customer Stories'
      });

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Create a customer success story post'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      // Verify Claude was called for caption generation
      expect(mockBedrockSend).toHaveBeenCalledTimes(3); // intent + caption + image

      // Verify image was uploaded to S3
      expect(mockS3Send).toHaveBeenCalledTimes(1);

      // Verify post was created
      expect(mockCreatePost).toHaveBeenCalledTimes(1);
    });

    test('should use default scheduled time when not specified', async () => {
      // Setup
      mockGetBrandById.mockResolvedValue(mockBrand);

      const intentResponse = createClaudeResponse(
        'create_post',
        {
          caption_theme: 'Industry insights',
          content_pillar: 'Industry Insights',
          platform: 'instagram'
          // No scheduled_time specified
        },
        "I'll create an industry insights post."
      );

      const captionResponse = createCaptionResponse('Latest trends in tech industry');
      const imageResponse = createImageResponse();

      mockBedrockSend
        .mockResolvedValueOnce(intentResponse)
        .mockResolvedValueOnce(captionResponse)
        .mockResolvedValueOnce(imageResponse);

      mockS3Send.mockResolvedValue({});

      mockCreatePost.mockResolvedValue({
        post_id: 'test-post-uuid-123',
        brand_id: mockBrand.brand_id,
        caption: 'Latest trends in tech industry',
        image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/brand-123/test-post-uuid-123.png',
        platform: 'instagram',
        scheduled_time: new Date().toISOString(),
        status: 'Scheduled',
        content_pillar: 'Industry Insights'
      });

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Create an industry insights post'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      // Verify post was created with a scheduled time
      const createCall = mockCreatePost.mock.calls[0][0];
      expect(createCall.scheduled_time).toBeDefined();
      expect(typeof createCall.scheduled_time).toBe('string');
      
      // Verify it's a valid ISO8601 timestamp
      const scheduledDate = new Date(createCall.scheduled_time);
      expect(scheduledDate.toString()).not.toBe('Invalid Date');
    });
  });

  describe('Modify Post Intent Handling', () => {
    // Requirement 8.4: Test modify post intent handling
    test('should update post caption when user requests modification', async () => {
      // Setup
      const existingPost = {
        post_id: 'existing-post-123',
        brand_id: mockBrand.brand_id,
        caption: 'Old caption',
        image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png',
        platform: 'instagram',
        scheduled_time: '2024-12-01T09:00:00Z',
        status: 'Scheduled',
        content_pillar: 'Product Features'
      };

      mockGetBrandById.mockResolvedValue(mockBrand);
      mockGetPostById.mockResolvedValue(existingPost);

      const intentResponse = createClaudeResponse(
        'modify_post',
        {
          post_id: 'existing-post-123',
          updates: {
            caption: 'Updated caption with new information'
          }
        },
        "I'll update the post caption for you."
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);

      const updatedPost = {
        ...existingPost,
        caption: 'Updated caption with new information'
      };

      mockUpdatePost.mockResolvedValue(updatedPost);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Update the caption to: Updated caption with new information'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.action_taken).toBe('modify_post');
      expect(responseBody.affected_post_id).toBe('existing-post-123');

      // Verify post was updated
      expect(mockUpdatePost).toHaveBeenCalledTimes(1);
      expect(mockUpdatePost).toHaveBeenCalledWith(
        'existing-post-123',
        { caption: 'Updated caption with new information' }
      );
    });

    test('should update post scheduled time when user requests time change', async () => {
      // Setup
      const existingPost = {
        post_id: 'existing-post-456',
        brand_id: mockBrand.brand_id,
        caption: 'Test caption',
        image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png',
        platform: 'linkedin',
        scheduled_time: '2024-12-01T09:00:00Z',
        status: 'Scheduled',
        content_pillar: 'Customer Stories'
      };

      mockGetBrandById.mockResolvedValue(mockBrand);
      mockGetPostById.mockResolvedValue(existingPost);

      const newScheduledTime = '2024-12-05T15:00:00Z';

      const intentResponse = createClaudeResponse(
        'modify_post',
        {
          post_id: 'existing-post-456',
          updates: {
            scheduled_time: newScheduledTime
          }
        },
        "I'll reschedule the post for you."
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);

      const updatedPost = {
        ...existingPost,
        scheduled_time: newScheduledTime
      };

      mockUpdatePost.mockResolvedValue(updatedPost);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Reschedule this post to December 5th at 3pm'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.action_taken).toBe('modify_post');

      // Verify scheduled time was updated
      expect(mockUpdatePost).toHaveBeenCalledWith(
        'existing-post-456',
        { scheduled_time: newScheduledTime }
      );
    });

    test('should reject modification if post does not belong to user brand', async () => {
      // Setup
      const existingPost = {
        post_id: 'other-brand-post',
        brand_id: 'different-brand-id', // Different brand
        caption: 'Test caption',
        image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png',
        platform: 'instagram',
        scheduled_time: '2024-12-01T09:00:00Z',
        status: 'Scheduled',
        content_pillar: 'Product Features'
      };

      mockGetBrandById.mockResolvedValue(mockBrand);
      mockGetPostById.mockResolvedValue(existingPost);

      const intentResponse = createClaudeResponse(
        'modify_post',
        {
          post_id: 'other-brand-post',
          updates: {
            caption: 'Trying to update'
          }
        },
        "I'll update the post."
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Update this post'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.response).toContain('error');
      expect(responseBody.error).toContain('different brand');

      // Verify post was NOT updated
      expect(mockUpdatePost).not.toHaveBeenCalled();
    });

    test('should handle non-existent post gracefully', async () => {
      // Setup
      mockGetBrandById.mockResolvedValue(mockBrand);
      mockGetPostById.mockResolvedValue(null); // Post not found

      const intentResponse = createClaudeResponse(
        'modify_post',
        {
          post_id: 'non-existent-post',
          updates: {
            caption: 'New caption'
          }
        },
        "I'll update the post."
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Update the post caption'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.response).toContain('error');
      expect(responseBody.error).toContain('not found');

      // Verify post was NOT updated
      expect(mockUpdatePost).not.toHaveBeenCalled();
    });
  });

  describe('Delete Post Intent Handling', () => {
    // Requirement 8.5: Test delete post intent handling
    test('should delete post when user requests deletion', async () => {
      // Setup
      const existingPost = {
        post_id: 'post-to-delete',
        brand_id: mockBrand.brand_id,
        caption: 'Test caption',
        image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png',
        platform: 'instagram',
        scheduled_time: '2024-12-01T09:00:00Z',
        status: 'Scheduled',
        content_pillar: 'Product Features'
      };

      mockGetBrandById.mockResolvedValue(mockBrand);
      mockGetPostById.mockResolvedValue(existingPost);

      const intentResponse = createClaudeResponse(
        'delete_post',
        {
          post_id: 'post-to-delete'
        },
        "I'll delete that post for you."
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);
      mockDeletePost.mockResolvedValue({});

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Delete this post'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.action_taken).toBe('delete_post');
      expect(responseBody.affected_post_id).toBe('post-to-delete');

      // Verify post was deleted
      expect(mockDeletePost).toHaveBeenCalledTimes(1);
      expect(mockDeletePost).toHaveBeenCalledWith('post-to-delete');
    });

    test('should reject deletion if post does not belong to user brand', async () => {
      // Setup
      const existingPost = {
        post_id: 'other-brand-post',
        brand_id: 'different-brand-id', // Different brand
        caption: 'Test caption',
        image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png',
        platform: 'instagram',
        scheduled_time: '2024-12-01T09:00:00Z',
        status: 'Scheduled',
        content_pillar: 'Product Features'
      };

      mockGetBrandById.mockResolvedValue(mockBrand);
      mockGetPostById.mockResolvedValue(existingPost);

      const intentResponse = createClaudeResponse(
        'delete_post',
        {
          post_id: 'other-brand-post'
        },
        "I'll delete the post."
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Delete this post'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.response).toContain('error');
      expect(responseBody.error).toContain('different brand');

      // Verify post was NOT deleted
      expect(mockDeletePost).not.toHaveBeenCalled();
    });

    test('should handle deletion of non-existent post gracefully', async () => {
      // Setup
      mockGetBrandById.mockResolvedValue(mockBrand);
      mockGetPostById.mockResolvedValue(null); // Post not found

      const intentResponse = createClaudeResponse(
        'delete_post',
        {
          post_id: 'non-existent-post'
        },
        "I'll delete the post."
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Delete the post'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.response).toContain('error');
      expect(responseBody.error).toContain('not found');

      // Verify delete was NOT called
      expect(mockDeletePost).not.toHaveBeenCalled();
    });
  });

  describe('Query Intent Handling', () => {
    // Requirement 8.2: Test query intent handling
    test('should list posts when user queries for posts', async () => {
      // Setup
      const mockPosts = [
        {
          post_id: 'post-1',
          brand_id: mockBrand.brand_id,
          caption: 'Post 1',
          status: 'Scheduled'
        },
        {
          post_id: 'post-2',
          brand_id: mockBrand.brand_id,
          caption: 'Post 2',
          status: 'Published'
        }
      ];

      mockGetBrandById.mockResolvedValue(mockBrand);
      mockGetPostsByBrandId.mockResolvedValue(mockPosts);

      const intentResponse = createClaudeResponse(
        'query',
        {
          query_type: 'list_posts',
          filters: {}
        },
        "Here are your posts."
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Show me all my posts'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.action_taken).toBe('query');
      expect(responseBody.action_result.posts).toHaveLength(2);
      expect(responseBody.action_result.count).toBe(2);

      // Verify posts were fetched
      expect(mockGetPostsByBrandId).toHaveBeenCalledTimes(1);
      expect(mockGetPostsByBrandId).toHaveBeenCalledWith(mockBrand.brand_id, {});
    });

    test('should filter posts by status when user queries with status filter', async () => {
      // Setup
      const scheduledPosts = [
        {
          post_id: 'post-1',
          brand_id: mockBrand.brand_id,
          caption: 'Scheduled post',
          status: 'Scheduled'
        }
      ];

      mockGetBrandById.mockResolvedValue(mockBrand);
      mockGetPostsByBrandIdAndStatus.mockResolvedValue(scheduledPosts);

      const intentResponse = createClaudeResponse(
        'query',
        {
          query_type: 'list_posts',
          filters: {
            status: 'Scheduled'
          }
        },
        "Here are your scheduled posts."
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Show me my scheduled posts'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.action_result.posts).toHaveLength(1);
      expect(responseBody.action_result.posts[0].status).toBe('Scheduled');

      // Verify posts were filtered by status
      expect(mockGetPostsByBrandIdAndStatus).toHaveBeenCalledTimes(1);
      expect(mockGetPostsByBrandIdAndStatus).toHaveBeenCalledWith(
        mockBrand.brand_id,
        'Scheduled'
      );
    });

    test('should get specific post when user queries for post details', async () => {
      // Setup
      const specificPost = {
        post_id: 'specific-post-123',
        brand_id: mockBrand.brand_id,
        caption: 'Specific post caption',
        image_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/images/test.png',
        platform: 'instagram',
        scheduled_time: '2024-12-01T09:00:00Z',
        status: 'Scheduled',
        content_pillar: 'Product Features'
      };

      mockGetBrandById.mockResolvedValue(mockBrand);
      mockGetPostById.mockResolvedValue(specificPost);

      const intentResponse = createClaudeResponse(
        'query',
        {
          query_type: 'get_post',
          post_id: 'specific-post-123'
        },
        "Here are the details for that post."
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Show me details for post specific-post-123'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.action_result.post).toEqual(specificPost);

      // Verify specific post was fetched
      expect(mockGetPostById).toHaveBeenCalledTimes(1);
      expect(mockGetPostById).toHaveBeenCalledWith('specific-post-123');
    });

    test('should handle general query without specific action', async () => {
      // Setup
      mockGetBrandById.mockResolvedValue(mockBrand);

      const intentResponse = createClaudeResponse(
        'query',
        {
          query_type: 'general_info'
        },
        "I can help you manage your social media posts. What would you like to do?"
      );

      mockBedrockSend.mockResolvedValueOnce(intentResponse);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'What can you help me with?'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.action_taken).toBe('query');
      expect(responseBody.response).toContain('help');
    });
  });

  describe('Error Handling', () => {
    test('should return 400 for missing message', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({}), // No message
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.error.message).toContain('Message is required');
    });

    test('should return 400 for invalid JSON', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: 'invalid json{',
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.error.message).toContain('Invalid JSON');
    });

    test('should return 404 when brand not found', async () => {
      mockGetBrandById.mockResolvedValue(null);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Test message'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(404);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.error.message).toContain('Brand not found');
    });

    test('should return 403 when user does not own brand', async () => {
      const differentUserBrand = {
        ...mockBrand,
        user_id: 'different-user-id'
      };

      mockGetBrandById.mockResolvedValue(differentUserBrand);

      const event = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Test message'
        }),
        requestContext: {
          authorizer: {
            userId: mockBrand.user_id,
            brandId: mockBrand.brand_id
          }
        }
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(403);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.error.message).toContain('Access denied');
    });
  });

  describe('CORS Handling', () => {
    test('should handle OPTIONS request for CORS preflight', async () => {
      const event = {
        httpMethod: 'OPTIONS',
        path: '/chat'
      };

      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Headers');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Methods');
    });
  });
});
