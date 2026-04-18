# Trend Scraper Lambda Function

## Overview

The Trend Scraper Lambda function scrapes trending posts from Instagram and stores trend data in DynamoDB. It runs on a daily schedule via EventBridge to maintain a rolling 7-day window of trend data.

## Requirements

Validates requirements: 4.1, 4.2, 4.3, 4.4

## Functionality

### Core Features

1. **Instagram Trend Scraping**
   - Fetches trending posts from Instagram Graph API
   - Searches multiple relevant hashtags (#trending, #viral, #socialmedia, etc.)
   - Extracts style descriptors and themes from trending content

2. **Data Storage**
   - Stores trend data in DynamoDB Trends table
   - Includes TTL for automatic 7-day cleanup
   - Batch writes for efficiency

3. **Style Extraction**
   - Extracts visual style descriptors (modern, bold, vibrant, etc.)
   - Identifies content themes (current events, entertainment, etc.)
   - Calculates engagement scores

4. **Error Handling**
   - Graceful fallback to mock data if Instagram API unavailable
   - Comprehensive error logging
   - Continues processing even if individual hashtags fail

## Environment Variables

Required:
- `TRENDS_TABLE_NAME` - DynamoDB table name for trends
- `INSTAGRAM_APP_ID` - Instagram App ID (optional)
- `INSTAGRAM_APP_SECRET` - Instagram App Secret (optional)
- `INSTAGRAM_ACCESS_TOKEN` - Instagram API access token (optional)

## Trigger

- **EventBridge Scheduled Rule**: Daily at 2 AM UTC
- **Event Pattern**: Scheduled cron expression

## Data Model

### Trend Record

```python
{
    'trend_id': 'uuid',
    'scraped_at': 'ISO8601 timestamp',
    'source': 'instagram',
    'style_descriptors': ['modern', 'bold', 'vibrant'],
    'themes': ['current events', 'popular culture'],
    'hashtags': ['trending', 'viral'],
    'engagement_score': 95,
    'ttl': 1234567890  # Unix timestamp (7 days from scraped_at)
}
```

## Instagram Graph API Integration

The function integrates with Instagram Graph API to fetch trending posts. In production:

1. Requires Instagram Business Account
2. Uses hashtag search endpoints
3. Implements rate limiting (1 second between requests)
4. Falls back to mock data if API unavailable

## Mock Data

For development and testing, the function generates mock trend data when Instagram credentials are unavailable. This ensures the function can be tested without API access.

## TTL-Based Cleanup

DynamoDB TTL automatically deletes trend records older than 7 days. The `ttl` field is set to 7 days from the `scraped_at` timestamp.

## Error Handling

- Logs all errors to CloudWatch with context
- Continues processing remaining hashtags if one fails
- Returns mock data as fallback if scraping fails
- Doesn't fail entire operation if cleanup fails

## Testing

Run tests with:
```bash
pytest test_handler_property.py -v
```

## Deployment

Deployed as part of the AWS SAM template. The function is triggered daily by an EventBridge scheduled rule.
