# CORS Preflight Fix - Requirements

## Problem Statement
The `/chat/generate-image` endpoint is returning "Internal server error" for OPTIONS preflight requests, preventing CORS-enabled frontend applications from making POST requests to this endpoint.

## Current Status
- **API Gateway**: Has both global CORS configuration and explicit OPTIONS routes
- **Lambda Function**: Has proper OPTIONS handling that returns correct CORS headers
- **Frontend**: Cannot make requests due to failed preflight checks

## Root Cause Analysis
The issue appears to be a conflict between:
1. Global API Gateway CORS configuration in `template.yaml`
2. Explicit OPTIONS route definitions
3. Lambda function OPTIONS handling

## Requirements

### 1. Fix CORS Preflight for Generate Image Endpoint
**User Story**: As a frontend developer, I need the OPTIONS preflight request to `/chat/generate-image` to return proper CORS headers so that my POST requests can succeed.

**Acceptance Criteria**:
- OPTIONS request to `/chat/generate-image` returns 200 OK
- Response includes proper CORS headers:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: OPTIONS,POST`
  - `Access-Control-Allow-Headers: Content-Type,Authorization`
- POST request with Authorization header succeeds after preflight

### 2. Ensure All Chat Endpoints Have Working CORS
**User Story**: As a frontend developer, I need all chat endpoints to support CORS so that my SPA can communicate with the API.

**Acceptance Criteria**:
- `/chat` OPTIONS returns 200 OK with CORS headers
- `/chat/history` OPTIONS returns 200 OK with CORS headers  
- `/chat/generate-image` OPTIONS returns 200 OK with CORS headers
- All POST/GET requests work after successful preflight

### 3. Maintain Existing Functionality
**User Story**: As a user, I need all existing chat functionality to continue working after the CORS fix.

**Acceptance Criteria**:
- Chat conversations still work
- Image generation still works
- Chat history retrieval still works
- No breaking changes to API responses

## Technical Approach

### Option 1: Fix API Gateway Configuration
- Remove conflicting global CORS settings
- Ensure explicit OPTIONS routes work properly
- Verify Lambda OPTIONS handling

### Option 2: Simplify CORS Implementation
- Use API Gateway's built-in CORS handling
- Remove explicit OPTIONS routes
- Let API Gateway handle preflight automatically

### Option 3: Debug Current Implementation
- Check CloudWatch logs for OPTIONS requests
- Identify where the "Internal server error" is coming from
- Fix the specific issue without major changes

## Success Metrics
- OPTIONS requests return 200 OK status
- CORS headers are present and correct
- Frontend can successfully make API calls
- No regression in existing functionality

## Testing Plan
1. Test OPTIONS preflight requests manually
2. Test actual POST requests from browser
3. Verify all chat endpoints work
4. Test with different origins
5. Verify error handling still works

## Dependencies
- AWS API Gateway configuration
- Lambda function CORS handling
- Frontend application CORS requirements

## Risks
- Breaking existing API functionality
- CORS configuration conflicts
- Authentication issues with OPTIONS requests