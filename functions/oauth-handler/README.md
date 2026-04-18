# OAuth Handler Lambda Function

## Overview

The OAuth Handler Lambda function manages OAuth 2.0 authorization flows for connecting brand social media accounts (Instagram and LinkedIn) to the Experta platform. It implements secure OAuth flows with CSRF protection and stores tokens in AWS Secrets Manager.

## Endpoints

### GET /oauth/authorize/{platform}

Initiates the OAuth authorization flow.

**Query Parameters:**
- `brand_id` (required): The brand ID requesting authorization

**Response:**
```json
{
  "authorizationUrl": "https://...",
  "state": "csrf-token"
}
```

### GET /oauth/callback/{platform}

Handles the OAuth callback after user authorization.

**Query Parameters:**
- `code` (required): Authorization code from OAuth provider
- `state` (required): CSRF state token

**Response:**
- Redirects to frontend with success/error status

### POST /oauth/refresh/{platform}

Refreshes an expired access token using the refresh token.

**Request Body:**
```json
{
  "brand_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "expires_at": "ISO8601"
}
```

### DELETE /oauth/disconnect/{platform}

Disconnects an OAuth connection and revokes tokens.

**Request Body:**
```json
{
  "brand_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Connection disconnected successfully",
  "platform": "instagram"
}
```

## Security Features

1. **CSRF Protection**: State tokens prevent cross-site request forgery attacks
2. **Token Storage**: Access and refresh tokens stored in AWS Secrets Manager (never in DynamoDB)
3. **Token Encryption**: All tokens encrypted at rest using KMS
4. **State Expiration**: State tokens expire after 5 minutes
5. **Single-Use States**: State tokens can only be used once

## Environment Variables

- `OAUTH_CONNECTIONS_TABLE_NAME`: DynamoDB table for connection metadata
- `BRANDS_TABLE_NAME`: DynamoDB table for brand data
- `FRONTEND_URL`: Frontend URL for OAuth redirects
- `AWS_REGION`: AWS region for Secrets Manager

## Requirements Validation

- **16.1**: Redirects users to Connect Accounts page after onboarding
- **16.2**: Displays connection cards for Instagram and LinkedIn
- **16.3**: Implements OAuth authorization flow with CSRF protection
- **16.4**: Stores access tokens in AWS Secrets Manager
- **16.5**: Stores LinkedIn tokens in AWS Secrets Manager
- **16.6**: Updates brand connection status flags in DynamoDB
- **16.7**: Displays connection status with platform username
- **16.8**: Revokes OAuth tokens and removes from Secrets Manager on disconnect

## Testing

Run unit tests:
```bash
npm test
```

Run property-based tests:
```bash
npm test -- handler.property.test.js
```

## OAuth Flow Diagram

```
User → Frontend → GET /oauth/authorize/{platform}
                    ↓
                  Generate state token
                    ↓
                  Return authorization URL
                    ↓
User → OAuth Provider (Instagram/LinkedIn)
                    ↓
                  User authorizes
                    ↓
OAuth Provider → GET /oauth/callback/{platform}
                    ↓
                  Verify state token
                    ↓
                  Exchange code for token
                    ↓
                  Store token in Secrets Manager
                    ↓
                  Save connection metadata in DynamoDB
                    ↓
                  Update brand connection flags
                    ↓
                  Redirect to frontend
```

## Error Handling

All errors are logged to CloudWatch and return appropriate HTTP status codes:
- 400: Bad request (missing parameters, invalid platform)
- 404: Resource not found (brand, connection)
- 500: Internal server error (Secrets Manager, DynamoDB failures)

## Dependencies

- `@aws-sdk/client-secrets-manager`: AWS Secrets Manager operations
- `@aws-sdk/client-dynamodb`: DynamoDB operations
- `@aws-sdk/lib-dynamodb`: DynamoDB Document Client
- Shared libraries from Lambda layer:
  - `/opt/nodejs/errors/error-handler`: Error handling utilities
  - `/opt/nodejs/db/oauth-connections`: OAuth connections data access
  - `/opt/nodejs/db/brands`: Brands data access
