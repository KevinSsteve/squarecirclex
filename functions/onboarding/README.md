# Onboarding Handler Lambda Function

## Overview

The Onboarding Handler processes brand onboarding through a conversational AI interface powered by Claude 3.5 Sonnet. It supports both conversational onboarding (step-by-step) and direct brand creation (all data provided at once).

## Requirements

- **1.1**: Conversational onboarding flow using Claude 3.5 Sonnet
- **1.2**: Collect brand information (name, industry, target audience, tone, visual style)
- **1.3**: Collect content strategy (3+ content pillars, posting times)
- **1.4**: Collect social media credentials (Instagram, LinkedIn)
- **1.6**: Save brand data to DynamoDB
- **1.7**: Publish BrandOnboardingComplete event
- **2.3**: Encrypt social media credentials
- **10.1**: Event-driven architecture with EventBridge

## API Endpoint

**POST /brands**

### Authentication

Requires Cognito JWT token in Authorization header.

### Request Formats

#### 1. Conversational Onboarding

```json
{
  "message": "I want to onboard my brand",
  "conversation_history": [
    {
      "role": "user",
      "content": "I want to onboard my brand"
    },
    {
      "role": "assistant",
      "content": "Great! Let's get started. What's your brand name?"
    }
  ]
}
```

**Response:**
```json
{
  "response": "Great! Let's get started. What's your brand name?",
  "conversation_history": [...],
  "brand_data_complete": false,
  "extracted_data": null
}
```

#### 2. Direct Brand Creation

```json
{
  "brand_name": "TechCorp",
  "industry": "Technology",
  "target_audience": "Tech professionals aged 25-45",
  "tone_of_voice": "Professional yet approachable",
  "visual_style": "Modern, minimalist with blue accents",
  "content_pillars": [
    "Product Updates",
    "Industry Insights",
    "Customer Success Stories"
  ],
  "post_times": ["09:00", "14:00", "18:00"],
  "instagram_token": "IGQVJXa...",
  "linkedin_token": "AQV..."
}
```

**Response:**
```json
{
  "brand_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Brand created successfully",
  "calendar_generation_started": true
}
```

## Environment Variables

- `BRANDS_TABLE_NAME`: DynamoDB table for brands
- `EVENTBRIDGE_BUS_NAME`: EventBridge event bus name
- `ENCRYPTION_KEY_ID`: KMS key ID for credential encryption
- `BEDROCK_CLAUDE_MODEL_ID`: Bedrock Claude model ID
- `AWS_REGION`: AWS region

## Dependencies

- `@aws-sdk/client-bedrock-runtime`: Bedrock API client
- Shared libraries via Lambda Layer:
  - `EncryptionService`: KMS encryption/decryption
  - `BrandsDataAccess`: DynamoDB operations
  - `EventBridgeClient`: Event publishing
  - `ErrorHandler`: Error handling and logging

## Validation Rules

1. **Required Fields**: brand_name, industry, target_audience, tone_of_voice, visual_style, content_pillars, post_times
2. **Content Pillars**: Must be an array with at least 3 items
3. **Post Times**: Must be in HH:MM format (e.g., "09:00")
4. **Credentials**: At least one of instagram_token or linkedin_token should be provided

## Events Published

### BrandOnboardingComplete

```json
{
  "brand_id": "uuid",
  "brand_name": "string",
  "user_id": "string",
  "timestamp": "ISO8601"
}
```

This event triggers the Content Generator Lambda to create the initial 30-day content calendar.

## Error Handling

- **400 VALIDATION_ERROR**: Missing required fields or invalid format
- **401 UNAUTHORIZED**: Missing or invalid JWT token
- **500 INTERNAL_ERROR**: Database, encryption, or Bedrock API failures

All errors are logged to CloudWatch with structured logging including:
- Error message and stack trace
- Request context (requestId, path, method)
- Operation details

## Testing

To test locally, you can use the AWS SAM CLI:

```bash
sam local invoke OnboardingFunction -e test-event.json
```

Example test event:
```json
{
  "body": "{\"brand_name\":\"TestBrand\",\"industry\":\"Technology\",\"target_audience\":\"Developers\",\"tone_of_voice\":\"Technical\",\"visual_style\":\"Modern\",\"content_pillars\":[\"Tutorials\",\"News\",\"Tips\"],\"post_times\":[\"09:00\"],\"instagram_token\":\"test\"}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-user-id"
      }
    }
  }
}
```

## Security

- Social media credentials are encrypted using AWS KMS before storage
- User authentication via Cognito JWT tokens
- Brand data is associated with user_id to prevent unauthorized access
- Credentials are never logged or returned in API responses
