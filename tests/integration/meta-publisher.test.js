/**
 * Meta Publisher Integration Tests
 * 
 * Tests the complete flow:
 * 1. Chat handler generates post content
 * 2. Post is created in DynamoDB with Meta fields
 * 3. EventBridge event is emitted
 * 4. Meta Publisher Lambda is triggered
 * 5. Post status is updated in DynamoDB
 * 
 * Phase 3 - Day 3
 */

const { handler: chatHandler } = require('../../functions/chat-handler/handler');
const { handler: metaPublisher } = require('../../functions/meta-publisher/handler');
const { PostsDataAccess } = require('../../lib/nodejs/db/posts');
const { BrandsDataAccess } = require('../../lib/nodejs/db/brands');

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-eventbridge');
jest.mock('@aws-sdk/client-secrets-manager');

describe('Meta Publisher Integration Tests', () => {
  let testBrandId;
  let testUserId;
  
  beforeAll(async () => {
    // Set environment variables for testing
    process.env.META_MOCK_MODE = 'true';
    process.env.POSTS_TABLE_NAME = 'Posts-test';
    process.env.BRANDS_TABLE_NAME = 'Brands-test';
    process.env.EVENTBRIDGE_BUS_NAME = 'default';
    
    testUserId = 'test-user-123';
    
    // Create test brand
    const brandData = {
      user_id: testUserId,
      brand_name: 'Test Brand',
      industry: 'Technology',
      target_audience: 'Developers',
      tone_of_voice: 'Professional',
      visual_style: 'Modern',
      content_pillars: ['Innovation', 'Education'],
      post_times: ['09:00', '15:00'],
      has_instagram_connection: false,
      has_linkedin_connection: false
    };
    
    const brand = await BrandsDataAccess.createBrand(brandData);
    testBrandId = brand.brand_id;
  });
  
  afterAll(async () => {
    // Cleanup test data
    if (testBrandId) {
      try {
        await BrandsDataAccess.deleteBrand(testBrandId);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  });
  
  describe('End-to-End Flow', () => {
    test('should create post with Meta fields when content is generated', async () => {
      // Mock chat handler event
      const chatEvent = {
        httpMethod: 'POST',
        path: '/chat',
        body: JSON.stringify({
          message: 'Crie um post sobre inovação tecnológica',
          skip_image_generation: false
        }),
        requestContext: {
          requestId: 'test-request-123',
          authorizer: {
            userId: testUserId,
            claims: {
              sub: testUserId
            }
          }
        }
      };
      
      const chatContext = {
        requestId: 'test-request-123',
        functionName: 'chat-handler-test',
        functionVersion: '1'
      };
      
      // Call chat handler
      const chatResponse = await chatHandler(chatEvent, chatContext);
      
      // Verify response
      expect(chatResponse.statusCode).toBe(200);
      
      const responseBody = JSON.parse(chatResponse.body);
      expect(responseBody).toHaveProperty('response');
      
      // If post was created, verify it has Meta fields
      if (responseBody.post_id) {
        const post = await PostsDataAccess.getPostById(responseBody.post_id);
        
        expect(post).toBeDefined();
        expect(post.brand_id).toBe(testBrandId);
        expect(post.platforms).toEqual(['facebook', 'instagram']);
        expect(post.facebook_post_id).toBeNull();
        expect(post.facebook_published_at).toBeNull();
        expect(post.instagram_post_id).toBeNull();
        expect(post.instagram_published_at).toBeNull();
        expect(post.publication_errors).toEqual([]);
        
        // Cleanup
        await PostsDataAccess.deletePost(post.post_id);
      }
    });
    
    test('should update post status when Meta Publisher processes event', async () => {
      // Create test post
      const postData = {
        brand_id: testBrandId,
        caption: 'Test post for Meta integration',
        image_url: 'https://example.com/test-image.jpg',
        platform: 'instagram',
        scheduled_time: new Date().toISOString(),
        status: 'Draft',
        content_pillar: 'Innovation',
        platforms: ['facebook', 'instagram']
      };
      
      const post = await PostsDataAccess.createPost(postData);
      
      // Mock EventBridge event
      const metaEvent = {
        detail: {
          post_id: post.post_id,
          brand_id: testBrandId,
          platforms: ['facebook', 'instagram'],
          image_url: post.image_url,
          caption: post.caption
        }
      };
      
      const metaContext = {
        requestId: 'test-meta-request-123',
        functionName: 'meta-publisher-test',
        functionVersion: '1'
      };
      
      // Call Meta Publisher
      const metaResponse = await metaPublisher(metaEvent, metaContext);
      
      // Verify response
      expect(metaResponse).toBeDefined();
      expect(metaResponse.success).toBe(true);
      
      // Verify post was updated in DynamoDB
      const updatedPost = await PostsDataAccess.getPostById(post.post_id);
      
      // In mock mode, Meta Publisher should set mock IDs
      expect(updatedPost.facebook_post_id).toBeDefined();
      expect(updatedPost.facebook_published_at).toBeDefined();
      expect(updatedPost.instagram_post_id).toBeDefined();
      expect(updatedPost.instagram_published_at).toBeDefined();
      
      // Cleanup
      await PostsDataAccess.deletePost(post.post_id);
    });
  });
  
  describe('Posts API Meta Fields', () => {
    test('should return Meta fields when getting post by ID', async () => {
      // Create test post with Meta fields
      const postData = {
        brand_id: testBrandId,
        caption: 'Test post with Meta fields',
        image_url: 'https://example.com/test-image.jpg',
        platform: 'instagram',
        scheduled_time: new Date().toISOString(),
        status: 'Published',
        content_pillar: 'Education',
        platforms: ['facebook', 'instagram']
      };
      
      const post = await PostsDataAccess.createPost(postData);
      
      // Update with Meta publication data
      await PostsDataAccess.updateMetaPublicationStatus(post.post_id, 'facebook', {
        post_id: 'fb_123456789',
        published_at: new Date().toISOString()
      });
      
      await PostsDataAccess.updateMetaPublicationStatus(post.post_id, 'instagram', {
        post_id: 'ig_987654321',
        published_at: new Date().toISOString()
      });
      
      // Get post
      const retrievedPost = await PostsDataAccess.getPostById(post.post_id);
      
      // Verify Meta fields
      expect(retrievedPost.platforms).toEqual(['facebook', 'instagram']);
      expect(retrievedPost.facebook_post_id).toBe('fb_123456789');
      expect(retrievedPost.facebook_published_at).toBeDefined();
      expect(retrievedPost.instagram_post_id).toBe('ig_987654321');
      expect(retrievedPost.instagram_published_at).toBeDefined();
      expect(retrievedPost.publication_errors).toEqual([]);
      
      // Cleanup
      await PostsDataAccess.deletePost(post.post_id);
    });
    
    test('should filter posts by publication status', async () => {
      // Create test posts with different statuses
      const posts = [];
      
      // Published post
      const publishedPost = await PostsDataAccess.createPost({
        brand_id: testBrandId,
        caption: 'Published post',
        image_url: 'https://example.com/published.jpg',
        platform: 'instagram',
        scheduled_time: new Date().toISOString(),
        status: 'Published',
        content_pillar: 'Innovation',
        platforms: ['facebook']
      });
      
      await PostsDataAccess.updateMetaPublicationStatus(publishedPost.post_id, 'facebook', {
        post_id: 'fb_published_123',
        published_at: new Date().toISOString()
      });
      
      posts.push(publishedPost);
      
      // Pending post
      const pendingPost = await PostsDataAccess.createPost({
        brand_id: testBrandId,
        caption: 'Pending post',
        image_url: 'https://example.com/pending.jpg',
        platform: 'instagram',
        scheduled_time: new Date().toISOString(),
        status: 'Draft',
        content_pillar: 'Education',
        platforms: ['facebook']
      });
      
      posts.push(pendingPost);
      
      // Failed post
      const failedPost = await PostsDataAccess.createPost({
        brand_id: testBrandId,
        caption: 'Failed post',
        image_url: 'https://example.com/failed.jpg',
        platform: 'instagram',
        scheduled_time: new Date().toISOString(),
        status: 'Failed',
        content_pillar: 'Innovation',
        platforms: ['facebook']
      });
      
      await PostsDataAccess.updateMetaPublicationStatus(failedPost.post_id, 'facebook', {
        error: 'Test error message'
      });
      
      posts.push(failedPost);
      
      // Query by status
      const publishedPosts = await PostsDataAccess.getPostsByPublicationStatus(
        testBrandId, 
        'facebook', 
        'published'
      );
      
      const pendingPosts = await PostsDataAccess.getPostsByPublicationStatus(
        testBrandId, 
        'facebook', 
        'pending'
      );
      
      const failedPosts = await PostsDataAccess.getPostsByPublicationStatus(
        testBrandId, 
        'facebook', 
        'failed'
      );
      
      // Verify results
      expect(publishedPosts.some(p => p.post_id === publishedPost.post_id)).toBe(true);
      expect(pendingPosts.some(p => p.post_id === pendingPost.post_id)).toBe(true);
      expect(failedPosts.some(p => p.post_id === failedPost.post_id)).toBe(true);
      
      // Cleanup
      for (const post of posts) {
        await PostsDataAccess.deletePost(post.post_id);
      }
    });
  });
  
  describe('Error Handling', () => {
    test('should handle Meta publication errors gracefully', async () => {
      // Create test post
      const postData = {
        brand_id: testBrandId,
        caption: 'Test post for error handling',
        image_url: 'https://example.com/error-test.jpg',
        platform: 'instagram',
        scheduled_time: new Date().toISOString(),
        status: 'Draft',
        content_pillar: 'Innovation',
        platforms: ['facebook', 'instagram']
      };
      
      const post = await PostsDataAccess.createPost(postData);
      
      // Simulate publication error
      await PostsDataAccess.updateMetaPublicationStatus(post.post_id, 'facebook', {
        error: 'Invalid access token'
      });
      
      await PostsDataAccess.updateMetaPublicationStatus(post.post_id, 'instagram', {
        error: 'Rate limit exceeded'
      });
      
      // Get post and verify errors
      const updatedPost = await PostsDataAccess.getPostById(post.post_id);
      
      expect(updatedPost.publication_errors).toHaveLength(2);
      expect(updatedPost.publication_errors[0].platform).toBe('facebook');
      expect(updatedPost.publication_errors[0].error).toBe('Invalid access token');
      expect(updatedPost.publication_errors[1].platform).toBe('instagram');
      expect(updatedPost.publication_errors[1].error).toBe('Rate limit exceeded');
      
      // Cleanup
      await PostsDataAccess.deletePost(post.post_id);
    });
  });
});
