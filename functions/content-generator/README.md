# Content Generator Lambda Function

## Overview

The Content Generator Lambda function is responsible for creating a 30-day content calendar with AI-generated captions and images. It is triggered by an EventBridge event when a brand completes onboarding.

## Requirements

Validates requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 10.2, 10.4

## Functionality

1. **Fetch Brand Data**: Retrieves brand information from DynamoDB including content pillars, tone of voice, visual style, and posting times
2. **Generate 30 Posts**: Creates posts with round-robin content pillar distribution
3. **AI Caption Generation**: Uses Claude 3.5 Sonnet via Bedrock to generate engaging captions
4. **AI Image Generation**: Uses Titan Image Generator via Bedrock to create brand-consistent images
5. **S3 Upload**: Stores generated images in S3 with unique keys
6. **Schedule Posts**: Calculates scheduled times based on brand preferences
7. **DynamoDB Storage**: Saves all posts with "Scheduled" status
8. **EventBridge Rules**: Creates scheduled rules for automated publishing
9. **Event Publishing**: Publishes ContentCalendarGenerated event

## Event Trigger

The function is triggered by an EventBridge event with the following structure:

```json
{
  "source": "experta.onboarding",
  "detail-type": "BrandOnboardingComplete",
  "detail": {
    "brand_id": "uuid-string"
  }
}
```

## Environment Variables

- `BRANDS_TABLE_NAME`: DynamoDB table for brand data
- `POSTS_TABLE_NAME`: DynamoDB table for posts
- `S3_BUCKET_NAME`: S3 bucket for image storage
- `BEDROCK_CLAUDE_MODEL_ID`: Claude model ID for caption generation
- `BEDROCK_IMAGE_MODEL_ID`: Image model ID for generation (Stable Image Ultra v1.1)
- `EVENTBRIDGE_BUS_NAME`: EventBridge bus for events
- `AWS_REGION`: AWS region

## IAM Permissions Required

- DynamoDB: GetItem, PutItem, BatchWriteItem
- Bedrock: InvokeModel
- S3: PutObject
- EventBridge: PutRule, PutTargets, PutEvents
- STS: GetCallerIdentity

## Output

Creates 30 post records in DynamoDB with the following structure:

```json
{
  "post_id": "uuid",
  "brand_id": "uuid",
  "caption": "AI-generated caption text",
  "image_url": "https://bucket.s3.region.amazonaws.com/images/brand_id/post_id.png",
  "platform": "instagram",
  "scheduled_time": "2024-01-15T09:00:00Z",
  "status": "Scheduled",
  "content_pillar": "product features",
  "created_at": "2024-01-14T10:30:00Z",
  "published_at": null,
  "error_message": null,
  "retry_count": 0
}
```

## Error Handling

- Logs all errors to CloudWatch with structured logging
- Returns fallback captions if Claude generation fails
- Returns placeholder image URLs if Titan generation fails
- Continues processing remaining posts if individual post creation fails
- Does not fail entire operation if EventBridge rule creation fails

## Testing

Run tests with:

```bash
pytest handler.test.py -v
pytest handler.property.test.py -v
```

## Local Development

To test locally, set environment variables and use AWS SAM:

```bash
sam local invoke ContentGeneratorFunction --event events/brand-onboarding-complete.json
```
