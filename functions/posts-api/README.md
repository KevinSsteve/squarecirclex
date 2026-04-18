# Posts API Handler

Lambda function that handles CRUD operations for posts with brand authorization.

## Endpoints

### GET /posts
List posts with optional filters.

**Query Parameters:**
- `brand_id` (optional): Filter by brand ID (must match authenticated user's brand)
- `start_date` (optional): Filter posts scheduled after this date (ISO 8601 format)
- `end_date` (optional): Filter posts scheduled before this date (ISO 8601 format)
- `status` (optional): Filter by status (Draft, Scheduled, Published, Failed)

**Response:**
```json
{
  "posts": [
    {
      "post_id": "uuid",
      "brand_id": "uuid",
      "caption": "string",
      "image_url": "string",
      "platform": "instagram" | "linkedin",
      "scheduled_time": "ISO8601",
      "status": "Draft" | "Scheduled" | "Published" | "Failed",
      "content_pillar": "string",
      "created_at": "ISO8601",
      "published_at": "ISO8601 | null"
    }
  ],
  "count": number
}
```

### GET /posts/{post_id}
Get a single post by ID.

**Response:**
```json
{
  "post_id": "uuid",
  "brand_id": "uuid",
  "caption": "string",
  "image_url": "string",
  "platform": "instagram" | "linkedin",
  "scheduled_time": "ISO8601",
  "status": "Draft" | "Scheduled" | "Published" | "Failed",
  "content_pillar": "string",
  "created_at": "ISO8601",
  "published_at": "ISO8601 | null",
  "error_message": "string | null",
  "retry_count": number
}
```

### PUT /posts/{post_id}
Update a post.

**Request Body:**
```json
{
  "caption": "string (optional)",
  "status": "Draft" | "Scheduled" | "Published" | "Failed (optional)",
  "scheduled_time": "ISO8601 (optional)"
}
```

**Response:**
Updated post object (same as GET /posts/{post_id})

### DELETE /posts/{post_id}
Delete a post.

**Response:**
```json
{
  "message": "Post deleted successfully",
  "post_id": "uuid"
}
```

## Authorization

All endpoints require JWT authentication via API Gateway authorizer. Users can only access posts belonging to their associated brand.

## Environment Variables

- `POSTS_TABLE_NAME`: DynamoDB table name for posts
- `NODE_ENV`: Environment (test, development, production)

## Requirements Validated

- **7.1**: Dashboard displays posts with filtering
- **7.3**: Post display includes all required fields
- **7.4**: Post deletion functionality
- **7.5**: Posts sorted by scheduled_time
- **7.6**: Brand authorization checks
- **14.3**: Post editing capability
- **14.4**: Status preservation during edits

## Testing

Run unit tests:
```bash
npm test
```

Run property-based tests:
```bash
npm test -- handler.property.test.js
```
