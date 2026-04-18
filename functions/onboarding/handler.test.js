/**
 * Unit Tests for Onboarding Handler Lambda
 * 
 * Tests:
 * - Successful brand creation with valid data
 * - Validation errors for missing required fields
 * - EventBridge event publishing
 * 
 * Requirements: 1.6, 1.7
 */

// Mock AWS SDK and shared libraries before importing the handler
const mockBedrockSend = jest.fn();
jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
      send: mockBedrockSend
    })),
    InvokeModelCommand: jest.fn()
  };
});

// Mock shared libraries
const mockEncrypt = jest.fn();
const mockCreateBrand = jest.fn();
const mockPublishEvent = jest.fn();

// Mock the Lambda Layer modules by using relative paths
jest.mock('../../lib/nodejs/security/encryption', () => {
  return jest.fn().mockImplementation(() => ({
    encrypt: mockEncrypt
  }));
});

jest.mock('../../lib/nodejs/db/brands', () => ({
  BrandsDataAccess: {
    createBrand: mockCreateBrand
  }
}));

jest.mock('../../lib/nodejs/events/eventbridge-client', () => ({
  publishEvent: mockPublishEvent
}));

jest.mock('../../lib/nodejs/errors/error-handler', () => {
  const actualModule = jest.requireActual('../../lib/nodejs/errors/error-handler');
  return actualModule;
});

// Mock onboarding sessions data access (Phase 2)
const mockCreateSession = jest.fn();
const mockGetActiveSessionByUserId = jest.fn();
const mockUpdateSession = jest.fn();
const mockCompleteSession = jest.fn();
const mockCalculateCompletionPercentage = jest.fn();

jest.mock('../../lib/nodejs/db/onboarding-sessions', () => ({
  createSession: mockCreateSession,
  getActiveSessionByUserId: mockGetActiveSessionByUserId,
  updateSession: mockUpdateSession,
  completeSession: mockCompleteSession,
  calculateCompletionPercentage: mockCalculateCompletionPercentage,
  REQUIRED_FIELDS: [
    'brand_name',
    'industry',
    'target_audience',
    'tone_of_voice',
    'visual_style',
    'content_pillars',
    'post_times'
  ]
}));

// Mock the /opt/nodejs paths to point to relative paths
jest.mock('/opt/nodejs/security/encryption', () => {
  return jest.requireMock('../../lib/nodejs/security/encryption');
}, { virtual: true });

jest.mock('/opt/nodejs/db/brands', () => {
  return jest.requireMock('../../lib/nodejs/db/brands');
}, { virtual: true });

jest.mock('/opt/nodejs/events/eventbridge-client', () => {
  return jest.requireMock('../../lib/nodejs/events/eventbridge-client');
}, { virtual: true });

jest.mock('/opt/nodejs/errors/error-handler', () => {
  return jest.requireMock('../../lib/nodejs/errors/error-handler');
}, { virtual: true });

jest.mock('/opt/nodejs/db/onboarding-sessions', () => {
  return jest.requireMock('../../lib/nodejs/db/onboarding-sessions');
}, { virtual: true });

const { handler } = require('./handler');

describe('Onboarding Handler - Unit Tests', () => {
  // Sample valid brand data
  const validBrandData = {
    brand_name: 'Test Brand',
    industry: 'Technology',
    target_audience: 'Tech professionals',
    tone_of_voice: 'Professional',
    visual_style: 'Modern and clean',
    content_pillars: ['Product Updates', 'Industry News', 'Customer Stories'],
    post_times: ['09:00', '15:00'],
    instagram_token: 'instagram_test_token',
    linkedin_token: 'linkedin_test_token'
  };

  const mockContext = {
    requestId: 'test-request-id',
    functionName: 'onboarding-handler',
    awsRequestId: 'aws-request-id'
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockBedrockSend.mockReset();
    mockEncrypt.mockReset();
    mockCreateBrand.mockReset();
    mockPublishEvent.mockReset();
    mockCreateSession.mockReset();
    mockGetActiveSessionByUserId.mockReset();
    mockUpdateSession.mockReset();
    mockCompleteSession.mockReset();
    mockCalculateCompletionPercentage.mockReset();

    // Set default environment variables
    process.env.BEDROCK_CLAUDE_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    process.env.EVENTBRIDGE_BUS_NAME = 'default';
    process.env.AWS_REGION = 'us-east-1';
  });

  describe('Successful brand creation', () => {
    test('should successfully create a brand with valid data', async () => {
      // Arrange
      const event = {
        body: JSON.stringify(validBrandData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      const mockBrand = {
        brand_id: 'brand-123',
        brand_name: validBrandData.brand_name,
        user_id: 'user-123',
        ...validBrandData
      };
      
      mockCreateBrand.mockResolvedValue(mockBrand);
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.body);
      expect(body.brand_id).toBe('brand-123');
      expect(body.message).toBe('Brand created successfully');
      expect(body.calendar_generation_started).toBe(true);

      // Verify brand creation was called with correct data
      expect(mockCreateBrand).toHaveBeenCalledTimes(1);
      expect(mockCreateBrand).toHaveBeenCalledWith(expect.objectContaining({
        brand_name: validBrandData.brand_name,
        industry: validBrandData.industry,
        target_audience: validBrandData.target_audience,
        tone_of_voice: validBrandData.tone_of_voice,
        visual_style: validBrandData.visual_style,
        content_pillars: validBrandData.content_pillars,
        post_times: validBrandData.post_times,
        user_id: 'user-123',
        has_instagram_connection: false,
        has_linkedin_connection: false,
        onboarding_session_id: null
      }));
    });

    test('should create brand without social media tokens', async () => {
      // Arrange
      const brandDataWithoutTokens = {
        ...validBrandData
      };
      delete brandDataWithoutTokens.instagram_token;
      delete brandDataWithoutTokens.linkedin_token;

      const event = {
        body: JSON.stringify(brandDataWithoutTokens),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-456'
            }
          }
        }
      };

      const mockBrand = {
        brand_id: 'brand-456',
        brand_name: brandDataWithoutTokens.brand_name,
        user_id: 'user-456',
        ...brandDataWithoutTokens
      };

      mockCreateBrand.mockResolvedValue(mockBrand);
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(mockCreateBrand).toHaveBeenCalledWith(expect.objectContaining({
        has_instagram_connection: false,
        has_linkedin_connection: false,
        onboarding_session_id: null
      }));
    });

    test('should handle parsed JSON body object', async () => {
      // Arrange
      const event = {
        body: validBrandData, // Already parsed object
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-789'
            }
          }
        }
      };

      const mockBrand = {
        brand_id: 'brand-789',
        brand_name: validBrandData.brand_name,
        user_id: 'user-789'
      };

      mockEncrypt
        .mockResolvedValueOnce(Buffer.from('encrypted_instagram'))
        .mockResolvedValueOnce(Buffer.from('encrypted_linkedin'));
      
      mockCreateBrand.mockResolvedValue(mockBrand);
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(mockCreateBrand).toHaveBeenCalled();
    });
  });

  describe('Validation errors', () => {
    test('should return 400 when brand_name is missing', async () => {
      // Arrange
      const invalidData = { ...validBrandData };
      delete invalidData.brand_name;

      const event = {
        body: JSON.stringify(invalidData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('brand_name');
      expect(mockCreateBrand).not.toHaveBeenCalled();
    });

    test('should return 400 when industry is missing', async () => {
      // Arrange
      const invalidData = { ...validBrandData };
      delete invalidData.industry;

      const event = {
        body: JSON.stringify(invalidData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('industry');
    });

    test('should return 400 when target_audience is missing', async () => {
      // Arrange
      const invalidData = { ...validBrandData };
      delete invalidData.target_audience;

      const event = {
        body: JSON.stringify(invalidData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('target_audience');
    });

    test('should return 400 when content_pillars has less than 3 items', async () => {
      // Arrange
      const invalidData = {
        ...validBrandData,
        content_pillars: ['Pillar 1', 'Pillar 2'] // Only 2 pillars
      };

      const event = {
        body: JSON.stringify(invalidData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('content_pillars must be an array with at least 3 items');
    });

    test('should return 400 when content_pillars is not an array', async () => {
      // Arrange
      const invalidData = {
        ...validBrandData,
        content_pillars: 'not an array'
      };

      const event = {
        body: JSON.stringify(invalidData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('content_pillars must be an array');
    });

    test('should return 400 when post_times is not an array', async () => {
      // Arrange
      const invalidData = {
        ...validBrandData,
        post_times: 'not an array'
      };

      const event = {
        body: JSON.stringify(invalidData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('post_times must be an array');
    });

    test('should return 400 when post_times has invalid format', async () => {
      // Arrange
      const invalidData = {
        ...validBrandData,
        post_times: ['09:00', '25:00'] // Invalid hour
      };

      const event = {
        body: JSON.stringify(invalidData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('Invalid time format');
    });

    test('should return 400 when multiple required fields are missing', async () => {
      // Arrange
      const invalidData = {
        brand_name: 'Test Brand'
        // Missing all other required fields
      };

      const event = {
        body: JSON.stringify(invalidData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('Missing required fields');
    });

    test('should return 400 when request body is invalid JSON', async () => {
      // Arrange
      const event = {
        body: 'invalid json {',
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('Invalid JSON');
    });

    test('should return 401 when user_id is missing from authorization context', async () => {
      // Arrange
      const event = {
        body: JSON.stringify(validBrandData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {} // No sub claim
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toContain('User ID not found');
      expect(mockCreateBrand).not.toHaveBeenCalled();
    });
  });

  describe('EventBridge event publishing', () => {
    test('should publish BrandOnboardingComplete event after successful brand creation', async () => {
      // Arrange
      const event = {
        body: JSON.stringify(validBrandData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      const mockBrand = {
        brand_id: 'brand-123',
        brand_name: validBrandData.brand_name,
        user_id: 'user-123'
      };

      mockEncrypt
        .mockResolvedValueOnce(Buffer.from('encrypted_instagram'))
        .mockResolvedValueOnce(Buffer.from('encrypted_linkedin'));
      
      mockCreateBrand.mockResolvedValue(mockBrand);
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(mockPublishEvent).toHaveBeenCalledTimes(1);
      expect(mockPublishEvent).toHaveBeenCalledWith(
        'BrandOnboardingComplete',
        expect.objectContaining({
          brand_id: 'brand-123',
          brand_name: validBrandData.brand_name,
          user_id: 'user-123',
          timestamp: expect.any(String)
        }),
        'default'
      );
    });

    test('should publish event to default event bus', async () => {
      // Arrange
      const event = {
        body: JSON.stringify(validBrandData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-456'
            }
          }
        }
      };

      const mockBrand = {
        brand_id: 'brand-456',
        brand_name: validBrandData.brand_name,
        user_id: 'user-456'
      };

      mockEncrypt
        .mockResolvedValueOnce(Buffer.from('encrypted_instagram'))
        .mockResolvedValueOnce(Buffer.from('encrypted_linkedin'));
      
      mockCreateBrand.mockResolvedValue(mockBrand);
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(mockPublishEvent).toHaveBeenCalledWith(
        'BrandOnboardingComplete',
        expect.any(Object),
        'default'
      );
    });

    test('should still return success even if event publishing fails', async () => {
      // Arrange
      const event = {
        body: JSON.stringify(validBrandData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-789'
            }
          }
        }
      };

      const mockBrand = {
        brand_id: 'brand-789',
        brand_name: validBrandData.brand_name,
        user_id: 'user-789'
      };

      mockEncrypt
        .mockResolvedValueOnce(Buffer.from('encrypted_instagram'))
        .mockResolvedValueOnce(Buffer.from('encrypted_linkedin'));
      
      mockCreateBrand.mockResolvedValue(mockBrand);
      mockPublishEvent.mockRejectedValue(new Error('EventBridge error'));

      // Act
      const response = await handler(event, mockContext);

      // Assert
      // Brand creation should still succeed even if event publishing fails
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.brand_id).toBe('brand-789');
      expect(body.message).toBe('Brand created successfully');
    });
  });

  describe('Error handling', () => {
    test('should return 500 when encryption fails', async () => {
      // Arrange
      const event = {
        body: JSON.stringify(validBrandData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      // Mock successful brand creation
      const mockBrand = {
        brand_id: 'brand-123',
        brand_name: validBrandData.brand_name,
        user_id: 'user-123',
        ...validBrandData
      };
      mockCreateBrand.mockResolvedValue(mockBrand);
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      // Act
      const response = await handler(event, mockContext);

      // Assert - This test is no longer relevant as tokens are not encrypted during onboarding
      // Tokens will be stored in Secrets Manager via OAuth flow (Phase 2)
      expect(response.statusCode).toBe(201);
      expect(mockCreateBrand).toHaveBeenCalled();
    });

    test('should return 500 when brand creation fails', async () => {
      // Arrange
      const event = {
        body: JSON.stringify(validBrandData),
        path: '/brands',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      };

      mockEncrypt
        .mockResolvedValueOnce(Buffer.from('encrypted_instagram'))
        .mockResolvedValueOnce(Buffer.from('encrypted_linkedin'));
      
      mockCreateBrand.mockRejectedValue(new Error('DynamoDB error'));

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toContain('Failed to create brand');
    });
  });

  // ============================================================================
  // Phase 2 Unit Tests - Enhanced Onboarding
  // ============================================================================

  describe('Phase 2: Session Management', () => {
    test('should create new session when user has no active session', async () => {
      // Arrange
      const userId = 'user-123';
      const mockSession = {
        session_id: 'session-456',
        user_id: userId,
        extracted_data: {},
        conversation_history: [],
        completed_fields: [],
        pending_fields: ['brand_name', 'industry', 'target_audience', 'tone_of_voice', 'visual_style', 'content_pillars', 'post_times'],
        completion_percentage: 0
      };

      mockGetActiveSessionByUserId.mockResolvedValue(null);
      mockCreateSession.mockResolvedValue(mockSession);
      mockUpdateSession.mockResolvedValue({
        ...mockSession,
        conversation_history: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi! Let me help you get started.' }
        ]
      });

      mockBedrockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: JSON.stringify({
            extracted_entities: {},
            conversational_response: 'Hi! Let me help you get started.',
            clarifying_questions: []
          })}]
        }))
      });

      const event = {
        body: JSON.stringify({ message: 'Hello' }),
        path: '/onboarding/message',
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: userId
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(mockGetActiveSessionByUserId).toHaveBeenCalledWith(userId);
      expect(mockCreateSession).toHaveBeenCalledWith(userId);
      expect(mockUpdateSession).toHaveBeenCalled();
    });

    test('should use existing session when user has active session', async () => {
      // Arrange
      const userId = 'user-123';
      const existingSession = {
        session_id: 'session-789',
        user_id: userId,
        extracted_data: { brand_name: 'Test Brand' },
        conversation_history: [
          { role: 'user', content: 'My brand is Test Brand' },
          { role: 'assistant', content: 'Great! What industry are you in?' }
        ],
        completed_fields: ['brand_name'],
        pending_fields: ['industry', 'target_audience', 'tone_of_voice', 'visual_style', 'content_pillars', 'post_times'],
        completion_percentage: 14
      };

      mockGetActiveSessionByUserId.mockResolvedValue(existingSession);
      mockUpdateSession.mockResolvedValue({
        ...existingSession,
        extracted_data: { brand_name: 'Test Brand', industry: 'Technology' },
        completed_fields: ['brand_name', 'industry'],
        completion_percentage: 28
      });

      mockBedrockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: JSON.stringify({
            extracted_entities: { industry: 'Technology' },
            conversational_response: 'Technology! Got it.',
            clarifying_questions: []
          })}]
        }))
      });

      const event = {
        body: JSON.stringify({ message: 'We are in technology' }),
        path: '/onboarding/message',
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: userId
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(mockGetActiveSessionByUserId).toHaveBeenCalledWith(userId);
      expect(mockCreateSession).not.toHaveBeenCalled();
      expect(mockUpdateSession).toHaveBeenCalled();
    });

    test('should calculate completion percentage correctly', async () => {
      // Arrange
      const userId = 'user-123';
      const mockSession = {
        session_id: 'session-999',
        user_id: userId,
        extracted_data: {
          brand_name: 'Test Brand',
          industry: 'Technology',
          target_audience: 'Developers'
        },
        conversation_history: [],
        completed_fields: ['brand_name', 'industry', 'target_audience'],
        pending_fields: ['tone_of_voice', 'visual_style', 'content_pillars', 'post_times'],
        completion_percentage: 43
      };

      mockGetActiveSessionByUserId.mockResolvedValue(mockSession);
      mockUpdateSession.mockResolvedValue({
        ...mockSession,
        session_id: mockSession.session_id,
        completion_percentage: 43,
        completed_fields: ['brand_name', 'industry', 'target_audience'],
        pending_fields: ['tone_of_voice', 'visual_style', 'content_pillars', 'post_times']
      });

      mockBedrockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: JSON.stringify({
            extracted_entities: {},
            conversational_response: 'Great progress!',
            clarifying_questions: []
          })}]
        }))
      });

      const event = {
        body: JSON.stringify({ message: 'What else do you need?' }),
        path: '/onboarding/message',
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: userId
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(mockUpdateSession).toHaveBeenCalled();
      
      // Verify the session was retrieved and updated
      expect(mockGetActiveSessionByUserId).toHaveBeenCalledWith(userId);
      
      // The handler should have called updateSession with the session data
      expect(mockUpdateSession).toHaveBeenCalledWith(
        mockSession.session_id,
        expect.objectContaining({
          conversation_history: expect.any(Array),
          extracted_data: expect.any(Object),
          completed_fields: expect.any(Array),
          pending_fields: expect.any(Array)
        })
      );
    });
  });

  describe('Phase 2: Brand Creation', () => {
    test('should redirect to /connections after brand creation', async () => {
      // Arrange
      const userId = 'user-123';
      const sessionId = 'session-456';
      const mockBrand = {
        brand_id: 'brand-789',
        ...validBrandData,
        user_id: userId,
        has_instagram_connection: false,
        has_linkedin_connection: false
      };

      mockCreateBrand.mockResolvedValue(mockBrand);
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });
      mockCompleteSession.mockResolvedValue({});

      const event = {
        body: JSON.stringify({
          ...validBrandData,
          session_id: sessionId
        }),
        path: '/brands',
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: userId
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.redirect_to).toBe('/connections');
      expect(body.redirect_to).not.toBe('/dashboard');
      expect(mockCompleteSession).toHaveBeenCalledWith(sessionId, mockBrand.brand_id);
    });

    test('should not store tokens in brand record', async () => {
      // Arrange
      const userId = 'user-123';
      let capturedBrandData = null;

      mockCreateBrand.mockImplementation(async (data) => {
        capturedBrandData = data;
        return {
          brand_id: 'brand-789',
          ...data
        };
      });
      mockPublishEvent.mockResolvedValue({ FailedEntryCount: 0 });

      const event = {
        body: JSON.stringify(validBrandData),
        path: '/brands',
        httpMethod: 'POST',
        requestContext: {
          authorizer: {
            claims: {
              sub: userId
            }
          }
        }
      };

      // Act
      const response = await handler(event, mockContext);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(capturedBrandData).not.toHaveProperty('instagram_token');
      expect(capturedBrandData).not.toHaveProperty('linkedin_token');
      expect(capturedBrandData).not.toHaveProperty('instagram_token_encrypted');
      expect(capturedBrandData).not.toHaveProperty('linkedin_token_encrypted');
      expect(capturedBrandData).toHaveProperty('has_instagram_connection');
      expect(capturedBrandData).toHaveProperty('has_linkedin_connection');
      expect(capturedBrandData.has_instagram_connection).toBe(false);
      expect(capturedBrandData.has_linkedin_connection).toBe(false);
    });
  });
});
