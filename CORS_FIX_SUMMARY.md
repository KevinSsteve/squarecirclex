# CORS Configuration Fix Summary

**Date**: February 15, 2026  
**Status**: ✅ **FIXED - Ready for Deployment**

## Issue Reported

CloudFormation validation error during `sam deploy`:
```
Unable to add Cors configuration because 'AllowCredentials' cannot be true when 'AllowOrigin' is "'*'"
```

## Root Cause

AWS API Gateway does not allow `AllowCredentials: true` when `AllowOrigin` is set to wildcard (`'*'`). This is a security restriction enforced by modern browsers and AWS.

## Solution Applied

Changed `AllowOrigin` from `'*'` to `'http://localhost:5173'` in three locations:

### 1. API Gateway CORS Configuration (template.yaml)

**Changed:**
```yaml
Cors:
  AllowOrigin: "'http://localhost:5173'"  # Was: "'*'"
  AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
  AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
  AllowCredentials: true
  MaxAge: "'600'"
```

### 2. API Gateway Error Responses (template.yaml)

**Changed all GatewayResponses:**
```yaml
GatewayResponses:
  UNAUTHORIZED:
    ResponseParameters:
      Headers:
        Access-Control-Allow-Origin: "'http://localhost:5173'"  # Was: "'*'"
  ACCESS_DENIED:
    ResponseParameters:
      Headers:
        Access-Control-Allow-Origin: "'http://localhost:5173'"  # Was: "'*'"
  DEFAULT_4XX:
    ResponseParameters:
      Headers:
        Access-Control-Allow-Origin: "'http://localhost:5173'"  # Was: "'*'"
  DEFAULT_5XX:
    ResponseParameters:
      Headers:
        Access-Control-Allow-Origin: "'http://localhost:5173'"  # Was: "'*'"
```

### 3. Lambda Function Headers (lib/nodejs/errors/error-handler.js)

**Changed in both success and error responses:**
```javascript
headers: {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'http://localhost:5173',  // Was: '*'
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
}
```

## Files Modified

1. ✅ `template.yaml` - API Gateway CORS configuration
2. ✅ `template.yaml` - Gateway error responses
3. ✅ `lib/nodejs/errors/error-handler.js` - Lambda response headers

## Deployment Instructions

Now you can deploy successfully:

```bash
# Build the project
sam build

# Deploy to development
sam deploy --config-env dev
```

## Important Notes

### For Production Deployment

When deploying to production, you'll need to update the origin to your production domain:

1. **Update template.yaml** - Change `'http://localhost:5173'` to your production URL (e.g., `'https://app.experta.com'`)
2. **Update error-handler.js** - Change `http://localhost:5173` to your production URL
3. **Rebuild and redeploy**

### For Multiple Origins

If you need to support multiple origins (localhost + production), you have two options:

**Option 1: Environment-based configuration**
```yaml
# In template.yaml Parameters section
FrontendOrigin:
  Type: String
  Default: http://localhost:5173
  Description: Frontend origin for CORS

# Then use in Cors section
Cors:
  AllowOrigin: !Sub "'${FrontendOrigin}'"
```

**Option 2: Dynamic origin in Lambda**
```javascript
// In error-handler.js
const allowedOrigins = [
  'http://localhost:5173',
  'https://app.experta.com'
];

const origin = event.headers?.origin || event.headers?.Origin;
const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

headers: {
  'Access-Control-Allow-Origin': allowOrigin,
  // ... other headers
}
```

## Verification Checklist

- [x] Changed AllowOrigin in template.yaml Cors section
- [x] Changed AllowOrigin in template.yaml GatewayResponses
- [x] Changed Access-Control-Allow-Origin in error-handler.js formatErrorResponse
- [x] Changed Access-Control-Allow-Origin in error-handler.js formatSuccessResponse
- [x] Kept AllowCredentials: true
- [x] Kept all other CORS headers intact
- [ ] Run `sam build`
- [ ] Run `sam deploy --config-env dev`
- [ ] Test from React frontend at http://localhost:5173
- [ ] Verify CORS headers in browser Network tab

## Testing

After deployment, test the CORS configuration:

```bash
# Test OPTIONS preflight
curl -X OPTIONS https://your-api-url/brands \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

# Should return:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

## Browser Testing

In your React app at http://localhost:5173:

1. Open DevTools Network tab
2. Make a POST request to /brands
3. Check the response headers:
   - ✅ `Access-Control-Allow-Origin: http://localhost:5173`
   - ✅ `Access-Control-Allow-Credentials: true`
4. Verify no CORS errors in console

---

**Prepared by**: Kiro AI Assistant  
**Date**: February 15, 2026  
**Project**: Experta AI Social Media Manager  
**Issue Type**: CORS Configuration Fix  
**Status**: Fixed - Ready for Deployment
