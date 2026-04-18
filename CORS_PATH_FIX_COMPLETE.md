# CORS Preflight Fix - COMPLETE ✅

## Issue Summary
The `/chat/generate-image` endpoint was failing with CORS errors due to two issues:
1. **API Gateway Authorization on OPTIONS requests** (FIXED in previous deployment)
2. **Frontend path mismatch** (FIXED in this commit)

## Root Causes Identified

### 1. API Gateway CORS Configuration (ALREADY FIXED)
**Problem**: API Gateway was applying the Cognito authorizer to OPTIONS preflight requests. Browsers NEVER send Authorization headers in CORS preflight requests, causing 401 Unauthorized responses.

**Solution Applied**: Added `AddDefaultAuthorizerToCorsPreflight: false` to the `ExpertaApi > Auth` section in `template.yaml` (line 565).

```yaml
ExpertaApi:
  Type: AWS::Serverless::Api
  Properties:
    Auth:
      DefaultAuthorizer: CognitoAuthorizer
      AddDefaultAuthorizerToCorsPreflight: false  # ✅ CRITICAL FIX
```

This configuration ensures that:
- OPTIONS requests bypass authentication
- CORS headers are returned with 200 OK status
- Actual POST requests still require authentication

### 2. Frontend Path Mismatch (FIXED NOW)
**Problem**: `ChatPage.jsx` was calling `/generate-image` instead of `/chat/generate-image`

**Files Affected**:
- ❌ `frontend/src/pages/ChatPage.jsx` - Was calling `/generate-image` (WRONG)
- ✅ `frontend/src/components/chat/ContentPlanCard.jsx` - Was calling `/chat/generate-image` (CORRECT)

**Lambda Mapping** (from template.yaml):
```yaml
ChatHandlerFunction:
  Events:
    ChatGenerateImage:
      Type: Api
      Properties:
        RestApiId: !Ref ExpertaApi
        Path: /chat/generate-image  # ✅ CORRECT PATH
        Method: POST
```

**Fix Applied**: Updated `ChatPage.jsx` line 405 to use the correct path:
```javascript
// BEFORE (WRONG)
const response = await fetch(`${API_URL}/generate-image`, {

// AFTER (CORRECT)
const response = await fetch(`${API_URL}/chat/generate-image`, {
```

## Current CORS Configuration

### Global CORS Settings (template.yaml)
```yaml
Globals:
  Api:
    Cors:
      AllowOrigin: "'*'"
      AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      AllowMethods: "'OPTIONS,GET,POST,PUT,DELETE'"
      AllowCredentials: false
```

### API Gateway CORS Settings
```yaml
ExpertaApi:
  Properties:
    Cors:
      AllowOrigin: "'*'"
      AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
      AllowCredentials: false
      MaxAge: "'600'"
```

### Gateway Responses (Error Handling)
All error responses (401, 403, 4XX, 5XX) include CORS headers:
```yaml
GatewayResponses:
  UNAUTHORIZED:
    StatusCode: 401
    ResponseParameters:
      Headers:
        Access-Control-Allow-Origin: "'*'"
        Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        Access-Control-Allow-Methods: "'GET,POST,PUT,DELETE,OPTIONS'"
```

## Verification Steps

### 1. Test OPTIONS Preflight Request
```bash
curl -X OPTIONS https://your-api-url/chat/generate-image \
  -H "Origin: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

**Expected Response**:
- Status: 200 OK
- Headers:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`

### 2. Test Actual POST Request
```bash
curl -X POST https://your-api-url/chat/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"description":"A modern professional image"}' \
  -v
```

**Expected Response**:
- Status: 200 OK (with valid token)
- Body: `{"image_url": "...", "message": "..."}`
- CORS headers present

### 3. Test from Browser Console
```javascript
// Test from frontend application
const API_URL = 'https://your-api-url';
const token = 'YOUR_TOKEN';

fetch(`${API_URL}/chat/generate-image`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    description: 'A modern professional image'
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

## Files Modified

### Backend (Already Deployed)
- ✅ `template.yaml` - Added `AddDefaultAuthorizerToCorsPreflight: false`

### Frontend (This Commit)
- ✅ `frontend/src/pages/ChatPage.jsx` - Fixed path from `/generate-image` to `/chat/generate-image`

## Deployment Instructions

### Backend (Already Deployed)
The backend CORS fix was already deployed in the previous deployment.

### Frontend (Deploy Now)
```bash
# Deploy frontend with path fix
cd frontend
npm run build
aws s3 sync dist/ s3://experta-frontend-dev --delete
```

Or use the deployment script:
```bash
.\scripts\deploy-frontend-s3-fixed.ps1
```

## Technical Details

### Why AddDefaultAuthorizerToCorsPreflight: false?
AWS API Gateway applies the default authorizer to ALL requests by default, including OPTIONS preflight requests. However:

1. **Browser Behavior**: Browsers send OPTIONS requests WITHOUT any Authorization headers
2. **CORS Requirement**: OPTIONS must return 200 OK with CORS headers for the actual request to proceed
3. **Security**: The actual POST request still requires authentication - only the preflight is unauthenticated

This is the AWS-recommended approach for CORS with Cognito authorizers.

### Why the Path Mismatch Occurred?
The path mismatch likely occurred during development when:
1. The endpoint was initially created at `/generate-image`
2. Later moved to `/chat/generate-image` for better organization
3. `ContentPlanCard.jsx` was updated but `ChatPage.jsx` was missed

## Status: COMPLETE ✅

### Backend CORS Fix
- ✅ API Gateway configured to allow unauthenticated OPTIONS requests
- ✅ Global CORS headers configured
- ✅ Gateway error responses include CORS headers
- ✅ Lambda function returns proper CORS headers
- ✅ Deployed successfully

### Frontend Path Fix
- ✅ ChatPage.jsx updated to use correct path `/chat/generate-image`
- ⏳ Ready for deployment

## Next Steps
1. Deploy frontend changes to S3
2. Test image generation from ChatPage
3. Verify CORS headers in browser DevTools Network tab
4. Confirm no more CORS errors in console

## References
- AWS SAM CORS Documentation: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-api-corsconfiguration.html
- AWS API Gateway CORS: https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
- MDN CORS Guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
