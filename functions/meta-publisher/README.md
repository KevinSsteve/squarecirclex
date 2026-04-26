# Meta Publisher Lambda Function

Publishes social media posts to Facebook and Instagram using Meta Graph API.

## Overview

This Lambda function is triggered by EventBridge events when posts are created or ready for publication. It handles:

- Publishing to Facebook Pages
- Publishing to Instagram Business Accounts
- Multi-platform publishing (Facebook + Instagram simultaneously)
- Partial failure handling (one platform succeeds, another fails)
- Status updates in DynamoDB
- Error logging and monitoring

## Requirements

- **Requirements**: 3.2, 3.3, 4.1

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTS_TABLE` | DynamoDB Posts table name | - | Yes |
| `BRANDS_TABLE` | DynamoDB Brands table name | - | Yes |
| `META_MOCK_MODE` | Enable mock mode for development | `false` | No |
| `AWS_REGION` | AWS region | `us-east-1` | No |

## Event Format

### Direct Invocation
```json
{
  "post_id": "post-123"
}
```

### EventBridge Event
```json
{
  "source": "experta.posts",
  "detail-type": "PostCreated",
  "detail": {
    "post_id": "post-123",
    "brand_id": "brand-456",
    "platforms": ["facebook", "instagram"]
  }
}
```

## Response Format

### Success (200)
```json
{
  "statusCode": 200,
  "body": {
    "message": "Post published successfully",
    "postId": "post-123",
    "results": [
      {
        "postId": "fb_123456",
        "publishedAt": "2026-04-23T10:00:00.000Z",
        "platform": "facebook"
      }
    ]
  }
}
```

### Partial Success (200 with errors)
```json
{
  "statusCode": 200,
  "body": {
    "message": "Post published successfully",
    "postId": "post-123",
    "results": [
      {
        "postId": "fb_123456",
        "publishedAt": "2026-04-23T10:00:00.000Z",
        "platform": "facebook"
      }
    ],
    "errors": [
      {
        "platform": "instagram",
        "error": "Instagram API error",
        "timestamp": "2026-04-23T10:00:00.000Z"
      }
    ]
  }
}
```

### Error (500)
```json
{
  "statusCode": 500,
  "body": {
    "error": "Failed to publish to all platforms: [...]"
  }
}
```

## Mock Mode

For development and testing without real Meta credentials:

```bash
# Set environment variable
export META_MOCK_MODE=true

# Or in template.yaml
Environment:
  Variables:
    META_MOCK_MODE: 'true'
```

In mock mode:
- No real API calls are made
- Mock credentials are used
- Mock post IDs are returned (e.g., `fb_mock_123456`)
- All operations succeed by default

## Credentials

Credentials are stored in AWS Secrets Manager with the following structure:

### Secret Name Format
- Facebook: `experta/brand/{brand_id}/facebook`
- Instagram: `experta/brand/{brand_id}/instagram`

### Secret Structure
```json
{
  "pageId": "facebook_page_id",
  "accountId": "instagram_account_id",
  "accessToken": "encrypted_access_token"
}
```

## DynamoDB Updates

The function updates the Posts table with publication status:

### Facebook Publication
```javascript
{
  facebook_post_id: "fb_123456",
  facebook_published_at: "2026-04-23T10:00:00.000Z",
  post_status: "Published"
}
```

### Instagram Publication
```javascript
{
  instagram_post_id: "ig_123456",
  instagram_published_at: "2026-04-23T10:00:00.000Z",
  post_status: "Published"
}
```

### Publication Errors
```javascript
{
  publication_errors: [
    {
      platform: "instagram",
      error: "Instagram API error",
      timestamp: "2026-04-23T10:00:00.000Z"
    }
  ],
  post_status: "Failed" // Only if ALL platforms fail
}
```

## Error Handling

### Validation Errors
- Missing `post_id`
- Post not found in DynamoDB
- Brand not found in DynamoDB
- Missing credentials

### API Errors
- Meta Graph API errors
- Network errors
- Rate limiting
- Content policy violations

### Partial Failures
If one platform fails but another succeeds:
- Status code: 200
- `results` array contains successful publications
- `errors` array contains failed publications
- Post status remains "Published"
- Errors are logged in `publication_errors` field

### Complete Failures
If all platforms fail:
- Status code: 500
- Post status set to "Failed"
- All errors logged in `publication_errors` field

## Testing

### Run Unit Tests
```bash
cd functions/meta-publisher
npm install
npm test
```

### Run with Coverage
```bash
npm run test:coverage
```

### Test Locally with SAM
```bash
# Create test event
cat > events/post-created.json << EOF
{
  "post_id": "post-123"
}
EOF

# Invoke locally
sam local invoke MetaPublisherFunction \
  --event events/post-created.json \
  --env-vars env.json
```

## Monitoring

### CloudWatch Logs
- Log Group: `/aws/lambda/Experta-meta-publisher-dev`
- Retention: 30 days

### CloudWatch Alarms
- **MetaPublisherErrorAlarm**: Triggers when errors exceed 3 in 5 minutes
- Notification: SNS topic `Experta-failures-dev`

### Metrics
- Invocations
- Errors
- Duration
- Throttles

## Integration

### Trigger from Chat Handler

```javascript
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

// After creating post in chat handler
const eventBridge = new EventBridgeClient({});

await eventBridge.send(new PutEventsCommand({
  Entries: [{
    Source: 'experta.posts',
    DetailType: 'PostCreated',
    Detail: JSON.stringify({
      post_id: postId,
      brand_id: brandId,
      platforms: ['facebook', 'instagram']
    }),
    EventBusName: process.env.EVENTBRIDGE_BUS_NAME
  }]
}));
```

### Trigger from Posts API

```javascript
// After user approves post for publication
await eventBridge.send(new PutEventsCommand({
  Entries: [{
    Source: 'experta.posts',
    DetailType: 'PostReadyForPublication',
    Detail: JSON.stringify({
      post_id: postId
    }),
    EventBusName: process.env.EVENTBRIDGE_BUS_NAME
  }]
}));
```

## Troubleshooting

### Function Not Triggered
1. Check EventBridge rule is enabled
2. Verify event pattern matches
3. Check CloudWatch Logs for errors

### Publication Fails
1. Verify credentials in Secrets Manager
2. Check Meta Graph API status
3. Verify access token permissions
4. Check CloudWatch Logs for detailed errors

### Mock Mode Not Working
1. Verify `META_MOCK_MODE=true` is set
2. Check function logs for mock mode confirmation
3. Redeploy function if environment variable was changed

## Dependencies

- `@aws-sdk/client-dynamodb` - DynamoDB client
- `@aws-sdk/lib-dynamodb` - DynamoDB document client
- `@aws-sdk/client-secrets-manager` - Secrets Manager client
- `/opt/nodejs/integrations/meta-graph-client` - Meta Graph API client (Lambda Layer)

## Architecture

```
EventBridge Event
    ↓
MetaPublisherFunction
    ↓
┌───────────────────────────────┐
│ 1. Get Post from DynamoDB     │
│ 2. Get Brand from DynamoDB    │
│ 3. Get Credentials from       │
│    Secrets Manager            │
│ 4. Publish to Meta Platforms  │
│ 5. Update Post Status         │
└───────────────────────────────┘
    ↓
DynamoDB (Updated Post)
```

## License

MIT
