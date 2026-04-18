/**
 * Unit Tests for Posts API Handler Lambda
 * 
 * Tests:
 * - Post filtering by date range
 * - Post filtering by status
 * - Authorization enforcement
 * 
 * Requirements: 7.1, 7.6
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Mock shared libraries
const mockGetPostsByBrandId = jest.fn();
const mockGetPostsByBrandIdAndStatus = jest.fn();
const mockGetPostById = jest.fn();
const mockUpdatePost = jest.fn();
const mockDeletePost = jest.fn();

jest.mock('../../lib/nodejs/db/posts', () => ({
  PostsDataAccess: {
    getPostsByBrandId: mockGetPostsByBrandId,
    getPostsByBrandIdAndStatus: mockGetPostsByBrandIdAndStatus,
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

describe('Posts API - Unit Tests', () => {
  const mockContext = {
    requestId: 'test-request-id',
    functionName: 'posts-api',
    awsRequestId: 'aws-request-id'
  };

  const samplePosts = [
    {
      post_id: 'post-1',
      brand_id: 'brand-123',
      caption: 'First post',
      image_url: 's3://bucket/image1.png',
      platform: 'instagram',
      scheduled_time: '2024-12-01T10:00:00.000Z',
      status: 'Scheduled',
      content_pillar: 'Product Updates',
      created_at: '2024-11-01T10:00:00.000Z',
      published_at: null,
      error_message: null,
      retry_count: 0
    },
    {
      post_id: 'post-2',
      brand_id: 'brand-123',
      caption: 'Second post',
      image_url: 's3://bucket/image2.png',
      platform: 'linkedin',
      scheduled_time: '2024-12-05T15:00:00.000Z',
      status: 'Published',
      content_pillar: 'Industry News',
      created_at: '2024-11-01T10:00:00.000Z',
      published_at: '2024-12-05T15:00:00.000Z',
      error_message: null,
      retry_count: 0
    },
    {
      post_id: 'post-3',
      brand_id: 'brand-123',
      caption: 'Third post',
      image_url: 's3://bucket/image3.png',
      platform: 'instagram',
      scheduled_time: '2024-12-10T09:00:00.000Z',
      status: 'Scheduled',
      content_pillar: 'Customer Stories',
      created_at: '2024-11-01T10:00:00.000Z',
      published_at: null,
      error_message: null,
      retry_count: 0
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPostsByBrandId.mockReset();
    mockGetPostsByBrandIdAndStatus.mockReset();
    mockGetPostById.mockReset();
    mockUpdatePost.mockReset();
    mockDeletePost.mockReset();
  });

  describe('Post filtering by date range', () => {
    test('should filter posts by start_date only', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          start_date: '2024-12-03T00:00:00.000Z'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      const filteredPosts = [samplePosts[1], samplePosts[2]]; // Posts after Dec 3
      mockGetPostsByBrandId.mockResolvedValue(filteredPosts);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.posts).toHaveLength(2);
      expect(body.count).toBe(2);
      
      // Verify the correct query was made with start_date
      expect(mockGetPostsByBrandId).toHaveBeenCalledWith(
        'brand-123',
        expect.objectContaining({
          startTime: '2024-12-03T00:00:00.000Z'
        })
      );
    });

    test('should filter posts by end_date only', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          end_date: '2024-12-06T00:00:00.000Z'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      const filteredPosts = [samplePosts[0], samplePosts[1]]; // Posts before Dec 6
      mockGetPostsByBrandId.mockResolvedValue(filteredPosts);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.posts).toHaveLength(2);
      
      // Verify the correct query was made with end_date
      expect(mockGetPostsByBrandId).toHaveBeenCalledWith(
        'brand-123',
        expect.objectContaining({
          endTime: '2024-12-06T00:00:00.000Z'
        })
      );
    });

    test('should filter posts by both start_date and end_date', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          start_date: '2024-12-02T00:00:00.000Z',
          end_date: '2024-12-08T00:00:00.000Z'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      const filteredPosts = [samplePosts[1]]; // Only post-2 is in range
      mockGetPostsByBrandId.mockResolvedValue(filteredPosts);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.posts).toHaveLength(1);
      expect(body.posts[0].post_id).toBe('post-2');
      
      // Verify the correct query was made with both dates
      expect(mockGetPostsByBrandId).toHaveBeenCalledWith(
        'brand-123',
        expect.objectContaining({
          startTime: '2024-12-02T00:00:00.000Z',
          endTime: '2024-12-08T00:00:00.000Z'
        })
      );
    });

    test('should return 400 for invalid start_date format', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          start_date: 'invalid-date'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('Invalid start_date format');
      expect(mockGetPostsByBrandId).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid end_date format', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          end_date: '2024-12-32T00:00:00.000Z' // Invalid day
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('Invalid end_date format');
      expect(mockGetPostsByBrandId).not.toHaveBeenCalled();
    });

    test('should return all posts when no date filters are provided', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {},
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      mockGetPostsByBrandId.mockResolvedValue(samplePosts);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.posts).toHaveLength(3);
      expect(body.count).toBe(3);
      
      // Verify query was made without date filters
      expect(mockGetPostsByBrandId).toHaveBeenCalledWith(
        'brand-123',
        {}
      );
    });
  });

  describe('Post filtering by status', () => {
    test('should filter posts by status "Scheduled"', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          status: 'Scheduled'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      const scheduledPosts = [samplePosts[0], samplePosts[2]];
      mockGetPostsByBrandIdAndStatus.mockResolvedValue(scheduledPosts);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.posts).toHaveLength(2);
      expect(body.posts.every(p => p.status === 'Scheduled')).toBe(true);
      
      // Verify the correct GSI query was used
      expect(mockGetPostsByBrandIdAndStatus).toHaveBeenCalledWith(
        'brand-123',
        'Scheduled'
      );
      expect(mockGetPostsByBrandId).not.toHaveBeenCalled();
    });

    test('should filter posts by status "Published"', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          status: 'Published'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      const publishedPosts = [samplePosts[1]];
      mockGetPostsByBrandIdAndStatus.mockResolvedValue(publishedPosts);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.posts).toHaveLength(1);
      expect(body.posts[0].status).toBe('Published');
      
      expect(mockGetPostsByBrandIdAndStatus).toHaveBeenCalledWith(
        'brand-123',
        'Published'
      );
    });

    test('should filter posts by status "Failed"', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          status: 'Failed'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      mockGetPostsByBrandIdAndStatus.mockResolvedValue([]);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.posts).toHaveLength(0);
      expect(body.count).toBe(0);
    });

    test('should filter posts by status "Draft"', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          status: 'Draft'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      mockGetPostsByBrandIdAndStatus.mockResolvedValue([]);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.posts).toHaveLength(0);
    });

    test('should return 400 for invalid status value', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          status: 'InvalidStatus'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('Invalid status');
      expect(body.error.message).toContain('Draft, Scheduled, Published, Failed');
      expect(mockGetPostsByBrandIdAndStatus).not.toHaveBeenCalled();
    });

    test('should combine status filter with date range filter', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          status: 'Scheduled',
          start_date: '2024-12-02T00:00:00.000Z',
          end_date: '2024-12-15T00:00:00.000Z'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      // Return all scheduled posts, handler will filter by date in memory
      // post-1 is Dec 1 (before start_date), post-3 is Dec 10 (in range)
      const scheduledPosts = [samplePosts[0], samplePosts[2]];
      mockGetPostsByBrandIdAndStatus.mockResolvedValue(scheduledPosts);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      // Only post-3 should be in the date range (post-1 is Dec 1, before start_date)
      expect(body.posts).toHaveLength(1);
      expect(body.posts[0].post_id).toBe('post-3');
      expect(body.posts.every(p => p.status === 'Scheduled')).toBe(true);
      
      // Verify status GSI was used
      expect(mockGetPostsByBrandIdAndStatus).toHaveBeenCalledWith(
        'brand-123',
        'Scheduled'
      );
    });
  });

  describe('Authorization enforcement', () => {
    test('should deny access when user requests different brand data', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          brand_id: 'brand-999' // Different brand
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123' // User's actual brand
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('Access denied to requested brand data');
      
      // Verify no database query was made
      expect(mockGetPostsByBrandId).not.toHaveBeenCalled();
      expect(mockGetPostsByBrandIdAndStatus).not.toHaveBeenCalled();
    });

    test('should allow access when user requests their own brand data', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {
          brand_id: 'brand-123' // Same as user's brand
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      mockGetPostsByBrandId.mockResolvedValue(samplePosts);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.posts).toHaveLength(3);
      
      // Verify database query was made
      expect(mockGetPostsByBrandId).toHaveBeenCalledWith('brand-123', {});
    });

    test('should use user brand_id when no brand_id is specified in query', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {},
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      mockGetPostsByBrandId.mockResolvedValue(samplePosts);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      
      // Verify query used user's brand_id
      expect(mockGetPostsByBrandId).toHaveBeenCalledWith('brand-123', {});
    });

    test('should deny access to individual post from different brand', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts/post-1',
        pathParameters: {
          post_id: 'post-1'
        },
        requestContext: {
          authorizer: {
            userId: 'user-456',
            brandId: 'brand-999' // Different brand
          }
        }
      };

      const post = { ...samplePosts[0], brand_id: 'brand-123' };
      mockGetPostById.mockResolvedValue(post);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('Access denied to requested post');
      
      // Verify post was fetched but access was denied
      expect(mockGetPostById).toHaveBeenCalledWith('post-1');
    });

    test('should allow access to individual post from same brand', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts/post-1',
        pathParameters: {
          post_id: 'post-1'
        },
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      mockGetPostById.mockResolvedValue(samplePosts[0]);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.post_id).toBe('post-1');
      expect(body.brand_id).toBe('brand-123');
    });

    test('should deny update to post from different brand', async () => {
      // Arrange
      const event = {
        httpMethod: 'PUT',
        path: '/posts/post-1',
        pathParameters: {
          post_id: 'post-1'
        },
        body: JSON.stringify({
          caption: 'Updated caption'
        }),
        requestContext: {
          authorizer: {
            userId: 'user-456',
            brandId: 'brand-999' // Different brand
          }
        }
      };

      const post = { ...samplePosts[0], brand_id: 'brand-123' };
      mockGetPostById.mockResolvedValue(post);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('Access denied to update this post');
      
      // Verify update was not performed
      expect(mockUpdatePost).not.toHaveBeenCalled();
    });

    test('should deny delete to post from different brand', async () => {
      // Arrange
      const event = {
        httpMethod: 'DELETE',
        path: '/posts/post-1',
        pathParameters: {
          post_id: 'post-1'
        },
        requestContext: {
          authorizer: {
            userId: 'user-456',
            brandId: 'brand-999' // Different brand
          }
        }
      };

      const post = { ...samplePosts[0], brand_id: 'brand-123' };
      mockGetPostById.mockResolvedValue(post);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('Access denied to delete this post');
      
      // Verify delete was not performed
      expect(mockDeletePost).not.toHaveBeenCalled();
    });

    test('should return 500 when authorization context is missing', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {},
        requestContext: {} // No authorizer
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      // Error is caught and wrapped by error handler
      expect(body.error.message).toBeDefined();
    });

    test('should return 500 when user_id is missing from authorization', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {},
        requestContext: {
          authorizer: {
            brandId: 'brand-123'
            // Missing userId
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      // Error is caught and wrapped by error handler
      expect(body.error.message).toBeDefined();
    });

    test('should return 500 when brand_id is missing from authorization', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {},
        requestContext: {
          authorizer: {
            userId: 'user-123'
            // Missing brandId
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      // Error is caught and wrapped by error handler
      expect(body.error.message).toBeDefined();
    });
  });

  describe('Post sorting', () => {
    test('should sort posts by scheduled_time in ascending order', async () => {
      // Arrange
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        queryStringParameters: {},
        requestContext: {
          authorizer: {
            userId: 'user-123',
            brandId: 'brand-123'
          }
        }
      };

      // Return posts in random order
      const unsortedPosts = [samplePosts[2], samplePosts[0], samplePosts[1]];
      mockGetPostsByBrandId.mockResolvedValue(unsortedPosts);

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      // Verify posts are sorted by scheduled_time
      expect(body.posts[0].post_id).toBe('post-1'); // Dec 1
      expect(body.posts[1].post_id).toBe('post-2'); // Dec 5
      expect(body.posts[2].post_id).toBe('post-3'); // Dec 10
      
      // Verify chronological order
      const times = body.posts.map(p => new Date(p.scheduled_time).getTime());
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
      }
    });
  });
});
