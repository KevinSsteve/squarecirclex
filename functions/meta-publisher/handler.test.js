/**
 * Meta Publisher Lambda Function - Unit Tests
 * 
 * Tests for Meta Graph API integration and post publishing
 */

const { handler } = require('./handler');

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-secrets-manager');
jest.mock('/opt/nodejs/integrations/meta-graph-client');

const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const MetaGraphClient = require('/opt/nodejs/integrations/meta-graph-client');

describe('Meta Publisher Handler', () => {
  let mockSend;
  let mockMetaClient;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock DynamoDB send
    mockSend = jest.fn();
    DynamoDBDocumentClient.from = jest.fn(() => ({
      send: mockSend
    }));

    // Mock Meta Graph Client
    mockMetaClient = {
      publishToFacebook: jest.fn(),
      publishToInstagram: jest.fn()
    };
    MetaGraphClient.mockImplementation(() => mockMetaClient);

    // Set environment variables
    process.env.POSTS_TABLE = 'test-posts-table';
    process.env.BRANDS_TABLE = 'test-brands-table';
    process.env.META_MOCK_MODE = 'true';
  });

  describe('Successful Publication', () => {
    test('should publish to Facebook successfully', async () => {
      // Mock post data
      const mockPost = {
        post_id: 'post-123',
        brand_id: 'brand-456',
        caption: 'Test post caption',
        image_url: 'https://example.com/image.jpg',
        platforms: ['facebook']
      };

      // Mock brand data
      const mockBrand = {
        brand_id: 'brand-456',
        brand_name: 'Test Brand'
      };

      // Mock DynamoDB responses
      mockSend
        .mockResolvedValueOnce({ Item: mockPost })  // getPost
        .mockResolvedValueOnce({ Item: mockBrand }) // getBrand
        .mockResolvedValueOnce({});                 // updatePostStatus

      // Mock Meta client response
      mockMetaClient.publishToFacebook.mockResolvedValue({
        postId: 'fb_123456',
        publishedAt: '2026-04-23T10:00:00.000Z',
        platform: 'facebook'
      });

      // Execute handler
      const event = {
        post_id: 'post-123'
      };

      const result = await handler(event);

      // Assertions
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Post published successfully');
      expect(body.results).toHaveLength(1);
      expect(body.results[0].postId).toBe('fb_123456');
      expect(mockMetaClient.publishToFacebook).toHaveBeenCalledWith(
        expect.any(String),
        'Test post caption',
        'https://example.com/image.jpg',
        expect.any(String)
      );
    });

    test('should publish to Instagram successfully', async () => {
      // Mock post data
      const mockPost = {
        post_id: 'post-123',
        brand_id: 'brand-456',
        caption: 'Test post caption',
        image_url: 'https://example.com/image.jpg',
        platforms: ['instagram']
      };

      // Mock brand data
      const mockBrand = {
        brand_id: 'brand-456',
        brand_name: 'Test Brand'
      };

      // Mock DynamoDB responses
      mockSend
        .mockResolvedValueOnce({ Item: mockPost })
        .mockResolvedValueOnce({ Item: mockBrand })
        .mockResolvedValueOnce({});

      // Mock Meta client response
      mockMetaClient.publishToInstagram.mockResolvedValue({
        postId: 'ig_123456',
        publishedAt: '2026-04-23T10:00:00.000Z',
        platform: 'instagram'
      });

      // Execute handler
      const event = {
        post_id: 'post-123'
      };

      const result = await handler(event);

      // Assertions
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.results).toHaveLength(1);
      expect(body.results[0].postId).toBe('ig_123456');
      expect(mockMetaClient.publishToInstagram).toHaveBeenCalled();
    });

    test('should publish to both Facebook and Instagram', async () => {
      // Mock post data
      const mockPost = {
        post_id: 'post-123',
        brand_id: 'brand-456',
        caption: 'Test post caption',
        image_url: 'https://example.com/image.jpg',
        platforms: ['facebook', 'instagram']
      };

      // Mock brand data
      const mockBrand = {
        brand_id: 'brand-456',
        brand_name: 'Test Brand'
      };

      // Mock DynamoDB responses
      mockSend
        .mockResolvedValueOnce({ Item: mockPost })
        .mockResolvedValueOnce({ Item: mockBrand })
        .mockResolvedValueOnce({})  // Facebook update
        .mockResolvedValueOnce({}); // Instagram update

      // Mock Meta client responses
      mockMetaClient.publishToFacebook.mockResolvedValue({
        postId: 'fb_123456',
        publishedAt: '2026-04-23T10:00:00.000Z',
        platform: 'facebook'
      });

      mockMetaClient.publishToInstagram.mockResolvedValue({
        postId: 'ig_123456',
        publishedAt: '2026-04-23T10:00:00.000Z',
        platform: 'instagram'
      });

      // Execute handler
      const event = {
        post_id: 'post-123'
      };

      const result = await handler(event);

      // Assertions
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.results).toHaveLength(2);
      expect(mockMetaClient.publishToFacebook).toHaveBeenCalled();
      expect(mockMetaClient.publishToInstagram).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should return error when post_id is missing', async () => {
      const event = {};

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Missing required parameter: post_id');
    });

    test('should return error when post not found', async () => {
      // Mock DynamoDB response with no item
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const event = {
        post_id: 'nonexistent-post'
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Post not found');
    });

    test('should return error when brand not found', async () => {
      // Mock post data
      const mockPost = {
        post_id: 'post-123',
        brand_id: 'brand-456',
        caption: 'Test post caption',
        platforms: ['facebook']
      };

      // Mock DynamoDB responses
      mockSend
        .mockResolvedValueOnce({ Item: mockPost })
        .mockResolvedValueOnce({ Item: undefined }); // No brand

      const event = {
        post_id: 'post-123'
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Brand not found');
    });

    test('should handle partial failure (one platform fails)', async () => {
      // Mock post data
      const mockPost = {
        post_id: 'post-123',
        brand_id: 'brand-456',
        caption: 'Test post caption',
        image_url: 'https://example.com/image.jpg',
        platforms: ['facebook', 'instagram']
      };

      // Mock brand data
      const mockBrand = {
        brand_id: 'brand-456',
        brand_name: 'Test Brand'
      };

      // Mock DynamoDB responses
      mockSend
        .mockResolvedValueOnce({ Item: mockPost })
        .mockResolvedValueOnce({ Item: mockBrand })
        .mockResolvedValueOnce({})  // Facebook update
        .mockResolvedValueOnce({}); // Error update

      // Mock Meta client responses - Facebook succeeds, Instagram fails
      mockMetaClient.publishToFacebook.mockResolvedValue({
        postId: 'fb_123456',
        publishedAt: '2026-04-23T10:00:00.000Z',
        platform: 'facebook'
      });

      mockMetaClient.publishToInstagram.mockRejectedValue(
        new Error('Instagram API error')
      );

      // Execute handler
      const event = {
        post_id: 'post-123'
      };

      const result = await handler(event);

      // Should still return 200 with partial success
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.results).toHaveLength(1); // Only Facebook succeeded
      expect(body.errors).toHaveLength(1);  // Instagram failed
      expect(body.errors[0].platform).toBe('instagram');
    });

    test('should handle complete failure (all platforms fail)', async () => {
      // Mock post data
      const mockPost = {
        post_id: 'post-123',
        brand_id: 'brand-456',
        caption: 'Test post caption',
        image_url: 'https://example.com/image.jpg',
        platforms: ['facebook']
      };

      // Mock brand data
      const mockBrand = {
        brand_id: 'brand-456',
        brand_name: 'Test Brand'
      };

      // Mock DynamoDB responses
      mockSend
        .mockResolvedValueOnce({ Item: mockPost })
        .mockResolvedValueOnce({ Item: mockBrand })
        .mockResolvedValueOnce({}); // markPostAsFailed

      // Mock Meta client to fail
      mockMetaClient.publishToFacebook.mockRejectedValue(
        new Error('Facebook API error')
      );

      // Execute handler
      const event = {
        post_id: 'post-123'
      };

      const result = await handler(event);

      // Should return 500 when all platforms fail
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Failed to publish to all platforms');
    });
  });

  describe('Mock Mode', () => {
    test('should use mock credentials in mock mode', async () => {
      // Mock post data
      const mockPost = {
        post_id: 'post-123',
        brand_id: 'brand-456',
        caption: 'Test post caption',
        image_url: 'https://example.com/image.jpg',
        platforms: ['facebook']
      };

      // Mock brand data
      const mockBrand = {
        brand_id: 'brand-456',
        brand_name: 'Test Brand'
      };

      // Mock DynamoDB responses
      mockSend
        .mockResolvedValueOnce({ Item: mockPost })
        .mockResolvedValueOnce({ Item: mockBrand })
        .mockResolvedValueOnce({});

      // Mock Meta client response
      mockMetaClient.publishToFacebook.mockResolvedValue({
        postId: 'fb_mock_123456',
        publishedAt: '2026-04-23T10:00:00.000Z',
        platform: 'facebook'
      });

      // Execute handler
      const event = {
        post_id: 'post-123'
      };

      const result = await handler(event);

      // Assertions
      expect(result.statusCode).toBe(200);
      expect(MetaGraphClient).toHaveBeenCalledWith({ mockMode: true });
    });
  });

  describe('EventBridge Integration', () => {
    test('should extract post_id from EventBridge event', async () => {
      // Mock post data
      const mockPost = {
        post_id: 'post-123',
        brand_id: 'brand-456',
        caption: 'Test post caption',
        image_url: 'https://example.com/image.jpg',
        platforms: ['facebook']
      };

      // Mock brand data
      const mockBrand = {
        brand_id: 'brand-456',
        brand_name: 'Test Brand'
      };

      // Mock DynamoDB responses
      mockSend
        .mockResolvedValueOnce({ Item: mockPost })
        .mockResolvedValueOnce({ Item: mockBrand })
        .mockResolvedValueOnce({});

      // Mock Meta client response
      mockMetaClient.publishToFacebook.mockResolvedValue({
        postId: 'fb_123456',
        publishedAt: '2026-04-23T10:00:00.000Z',
        platform: 'facebook'
      });

      // EventBridge event format
      const event = {
        detail: {
          post_id: 'post-123'
        }
      };

      const result = await handler(event);

      // Assertions
      expect(result.statusCode).toBe(200);
    });
  });
});
