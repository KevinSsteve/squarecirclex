# Chat Handler Lambda Function

## Overview

The Chat Handler Lambda function provides a conversational interface for managing social media posts. It processes natural language requests from users and executes actions like creating, modifying, or deleting posts.

## Requirements

Implements requirements: 8.2, 8.3, 8.4, 8.5

## Features

- **Intent Extraction**: Uses Claude 3.5 Sonnet to understand user intent from natural language
- **Post Creation**: Generates captions and images for new posts based on user requests
- **Post Modification**: Updates existing posts (caption, scheduled time, etc.)
- **Post Deletion**: Removes posts from the content calendar
- **Query Handling**: Answers questions about posts and the content calendar

## Supported Intents

### 1. Create Post
Creates a new social media post with AI-generated caption and image.

**Example requests:**
- "Create a post about our new product launch"
- "Make a post for tomorrow about customer success stories"
- "Generate content for the 'industry insights' pillar"

**Parameters:**
- `caption_theme`: Description of what the post should be about
- `content_pillar`: Which content pillar to use
- `scheduled_time`: When to publish (optional, defaults to next available time)
- `platform`: instagram, linkedin, or both

### 2. Modify Post
Updates an existing post's caption or scheduled time.

**Example requests:**
- "Change the caption of post abc-123 to..."
- "Reschedule post xyz-456 to next Monday"
- "Update the post scheduled for tomorrow"

**Parameters:**
- `post_id`: ID of the post to modify
- `updates`: Object containing fields to update (caption, scheduled_time, etc.)

### 3. Delete Post
Removes a post from the content calendar.

**Example requests:**
- "Delete the post scheduled for Friday"
- "Remove post abc-123"
- "Cancel tomorrow's post"

**Parameters:**
- `post_id`: ID of the post to delete

### 4. Query
Retrieves information about posts or the content calendar.

**Example requests:**
- "Show me all scheduled posts"
- "What posts are scheduled for next week?"
- "List all failed posts"

**Parameters:**
- `query_type`: list_posts, get_post, or general_info
- `filters`: Optional filters (status, start_date, end_date)

## API Endpoint

**POST /chat**

### Request Body
```json
{
  "message": "Create a post about our new product",
  "conversation_history": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ]
}
```

### Response
```json
{
  "response": "I'll create a post about your new product. Give me a moment...",
  "action_taken": "create_post",
  "affected_post_id": "abc-123-def-456",
  "conversation_history": [...],
  "action_result": {
    "success": true,
    "post_id": "abc-123-def-456",
    "post": { ... }
  }
}
```

## Environment Variables

- `BEDROCK_CLAUDE_MODEL_ID`: Claude model ID for text generation (default: global.anthropic.claude-opus-5)
- `BEDROCK_CLAUDE_FAST_MODEL_ID`: Claude fast model for prompt refinement (default: global.anthropic.claude-sonnet-5)
- `BEDROCK_IMAGE_MODEL_ID`: Image model ID for generation (default: stability.stable-image-ultra-v1:0)
- `S3_BUCKET_NAME`: S3 bucket for image storage
- `BRANDS_TABLE_NAME`: DynamoDB table name for brands
- `POSTS_TABLE_NAME`: DynamoDB table name for posts
- `AWS_REGION`: AWS region (default: us-east-1)

## IAM Permissions Required

- DynamoDB: GetItem, PutItem, UpdateItem, DeleteItem, Query
- Bedrock: InvokeModel
- S3: PutObject
- CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents

## Dependencies

- `@aws-sdk/client-bedrock-runtime`: For Claude and Titan AI models
- `@aws-sdk/client-s3`: For image storage
- `uuid`: For generating unique IDs

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Error Handling

The function handles various error scenarios:
- Invalid JSON in request body
- Missing authorization context
- Brand not found
- Post not found
- Access denied (user doesn't own the brand/post)
- AI generation failures
- S3 upload failures
- DynamoDB operation failures

All errors are logged to CloudWatch and returned in a user-friendly conversational format.

## Integration

This function integrates with:
- **Amazon Bedrock**: Claude 3.5 Sonnet for intent extraction and caption generation, Titan for image generation
- **DynamoDB**: Brands and Posts tables for data persistence
- **S3**: For storing generated images
- **API Gateway**: Exposed as POST /chat endpoint
- **Cognito**: For user authentication and brand association

## Workflow

1. User sends a natural language message
2. Function extracts user context from Cognito authorizer
3. Function retrieves brand context from DynamoDB
4. Claude processes the message and extracts intent + parameters
5. Function executes the appropriate action:
   - Create: Generate caption + image, upload to S3, save to DynamoDB
   - Modify: Update post in DynamoDB
   - Delete: Remove post from DynamoDB
   - Query: Fetch and return information
6. Function returns conversational response with action confirmation

## Notes

- All generated images are 1080x1080 pixels (Instagram square format)
- Default scheduled time is tomorrow at the brand's first post_time
- Conversation history is maintained for context-aware responses
- Brand authorization is enforced for all operations
- All actions are logged to CloudWatch for audit trail
