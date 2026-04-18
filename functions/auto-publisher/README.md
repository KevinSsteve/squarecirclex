# Auto Publisher Lambda Function

## Overview

The Auto Publisher Lambda function is responsible for publishing scheduled posts to social media platforms (Instagram and LinkedIn). It is triggered by EventBridge scheduled rules at the exact time each post should be published.

## Features

- **Instagram Publishing**: Uses Instagram Graph API to create and publish posts
- **LinkedIn Publishing**: Uses LinkedIn API to upload images and create posts
- **Retry Logic**: Implements exponential backoff with up to 2 retries
- **Error Handling**: Updates post status to "Failed" and sends SNS notifications on final failure
- **Automation Logging**: Creates detailed logs in DynamoDB for all publication attempts
- **Event Publishing**: Publishes PostPublished events to EventBridge on success

## Requirements

Validates the following requirements:
- 6.1: Triggered by EventBridge at scheduled_time
- 6.2: Instagram Graph API integration
- 6.3: LinkedIn API integration
- 6.4: Updates status to "Published" on success
- 6.5: Records actual publication timestamp
- 6.6: Updates status to "Failed" with error message on failure
- 6.7: Retry logic with exponential backoff (max 2 retries)
- 6.8: SNS notification on final failure
- 10.3: EventBridge scheduled rule trigger
- 10.5: Publishes PostPublished event
- 11.3: Creates automation log entries

## Environment Variables

- `POSTS_TABLE_NAME`: DynamoDB table name for posts
- `BRANDS_TABLE_NAME`: DynamoDB table name for brands
- `AUTOMATION_LOGS_TABLE_NAME`: DynamoDB table name for automation logs
- `ENCRYPTION_KEY_ID`: KMS key ID for decrypting credentials
- `SNS_TOPIC_ARN`: SNS topic ARN for failure notifications
- `EVENTBRIDGE_BUS_NAME`: EventBridge event bus name (default: 'default')
- `S3_BUCKET_NAME`: S3 bucket name for images
- `AWS_REGION`: AWS region (default: 'us-east-1')

## Event Format

The function expects an event from EventBridge with the following structure:

```json
{
  "post_id": "uuid-of-post",
  "scheduled_time": "2024-03-15T10:00:00Z"
}
```

## Publishing Flow

### Instagram

1. Create media container with image URL and caption
2. Wait for container to be ready (2 seconds)
3. Publish the container
4. Return Instagram post ID

### LinkedIn

1. Register upload with LinkedIn API
2. Upload image data to provided upload URL
3. Create post with uploaded image and caption
4. Return LinkedIn post ID

## Retry Logic

- **Max Retries**: 2 (total 3 attempts)
- **Backoff**: Exponential (5s, 10s)
- **Retry Count**: Tracked in DynamoDB post record
- **Final Failure**: Updates status to "Failed" and sends SNS notification

## Error Handling

- Validates post exists and is not already published
- Validates brand credentials are available
- Decrypts credentials using KMS
- Handles platform-specific API errors
- Creates automation logs for all outcomes
- Sends SNS notifications on final failure

## Response Format

### Success

```json
{
  "statusCode": 200,
  "message": "Post published successfully",
  "post_id": "uuid",
  "platform": "instagram",
  "platform_post_id": "instagram-post-id"
}
```

### Failure

```json
{
  "statusCode": 500,
  "message": "Post publication failed after all retries",
  "post_id": "uuid",
  "error": "Error message"
}
```

## Dependencies

- `@aws-sdk/client-sns`: SNS notifications
- `@aws-sdk/client-s3`: Image download from S3
- Shared libraries (via Lambda Layer):
  - `security/encryption`: KMS encryption/decryption
  - `db/posts`: Posts table access
  - `db/brands`: Brands table access
  - `db/logs`: Automation logs access
  - `events/eventbridge-client`: Event publishing
  - `errors/error-handler`: Error handling and logging

## IAM Permissions Required

- `dynamodb:GetItem` - Read posts and brands
- `dynamodb:UpdateItem` - Update post status and retry count
- `dynamodb:PutItem` - Create automation logs
- `kms:Decrypt` - Decrypt social media credentials
- `s3:GetObject` - Download images from S3
- `sns:Publish` - Send failure notifications
- `events:PutEvents` - Publish PostPublished events
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` - CloudWatch logging

## Testing

Run tests with:

```bash
npm test
```

Run property-based tests:

```bash
npm run test:properties
```

## Platform-Specific Notes

### Instagram

- Requires public image URL (S3 URL must be publicly accessible)
- Uses Instagram Graph API v18.0
- Requires valid Instagram Business Account access token
- Caption length limit: 2,200 characters

### LinkedIn

- Requires image upload (downloads from S3 first)
- Uses LinkedIn API v2
- Requires valid LinkedIn access token
- Caption length limit: 3,000 characters
- Image size limit: 10MB

## Monitoring

- All executions are logged to CloudWatch Logs
- Automation logs are stored in DynamoDB with 90-day TTL
- Failed publications trigger SNS notifications
- PostPublished events are published to EventBridge on success
