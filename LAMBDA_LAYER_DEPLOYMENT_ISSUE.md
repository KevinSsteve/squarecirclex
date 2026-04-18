# Lambda Layer Deployment Issue - Critical

**Date**: 2026-03-09  
**Status**: ❌ BLOCKING - All API endpoints returning 500

## Root Cause

The Lambda Layer (SharedNodejsLayer) is not being deployed correctly. The chat-handler Lambda function cannot find the shared modules at `/opt/nodejs/db/brands`, causing initialization failures.

## Error Evidence

### CloudWatch Logs
```
Error: Cannot find module '/opt/nodejs/db/brands'
Require stack:
- /var/task/handler.js
- /var/runtime/index.mjs
```

### Impact
- ALL API endpoints return 500 Internal Server Error
- OPTIONS requests fail (causing CORS errors in browser)
- GET /chat/history fails
- POST /chat fails
- Frontend completely broken

## Deployment Issue

`sam build` is hanging indefinitely during the `npm pack` step for the nodejs layer:
```
npm pack file:C:\Users\User\Desktop\experta\lib\nodejs
[hangs forever]
```

## Attempted Fixes

1. ✅ Cleared build cache: `Remove-Item .aws-sam -Recurse -Force`
2. ❌ `sam build` - hangs on npm pack
3. ❌ `sam build --use-container` - hangs
4. ❌ `sam deploy --no-confirm-changeset` - build succeeds but deployment times out

## Current State

- Build directory exists: `.aws-sam/build/`
- Build succeeded message appeared but deployment timed out
- Stack status unknown (command failed to return)
- Lambda functions still using old broken layer

## Recommended Next Steps

### Option 1: Manual Deployment Check
```powershell
# Check if deployment completed in background
aws cloudformation describe-stacks --stack-name onzo --query 'Stacks[0].StackStatus'

# If UPDATE_COMPLETE, test the endpoint
curl -X OPTIONS https://h5r67v3nx1.execute-api.us-east-1.amazonaws.com/dev/chat/history -v

# Check latest logs
aws logs tail /aws/lambda/onzo-chat-handler-dev --since 5m
```

### Option 2: Force Clean Rebuild
```powershell
# Kill any hanging processes
Get-Process | Where-Object {$_.ProcessName -like "*sam*" -or $_.ProcessName -like "*npm*"} | Stop-Process -Force

# Clean everything
Remove-Item .aws-sam -Recurse -Force
Remove-Item lib/nodejs/node_modules -Recurse -Force -ErrorAction SilentlyContinue

# Rebuild from scratch
cd lib/nodejs
npm install
cd ../..
sam build
sam deploy
```

### Option 3: Investigate npm pack Issue
```powershell
# Test npm pack manually
cd lib/nodejs
npm pack
cd ../..
```

## Files Affected

- `lib/nodejs/package.json` - Layer dependencies
- `lib/nodejs/db/brands.js` - Missing module
- `lib/nodejs/db/chat-history.js` - Missing module
- `lib/nodejs/errors/error-handler.js` - Missing module
- `functions/chat-handler/handler.js` - Requires layer modules
- `template.yaml` - Layer configuration

## Technical Details

### Layer Configuration (template.yaml)
```yaml
SharedNodejsLayer:
  Type: AWS::Serverless::LayerVersion
  Properties:
    LayerName: !Sub '${AWS::StackName}-shared-nodejs-${Environment}'
    Description: Shared Node.js utilities for Experta Lambda functions
    ContentUri: lib/nodejs/
    CompatibleRuntimes:
      - nodejs20.x
    RetentionPolicy: Retain
  Metadata:
    BuildMethod: nodejs20.x
```

### Lambda Function Layer Reference
```yaml
ChatHandlerFunction:
  Type: AWS::Serverless::Function
  Properties:
    Layers:
      - !Ref SharedNodejsLayer
```

## Priority

**CRITICAL** - This blocks all functionality. The application is completely non-functional until the Lambda Layer is deployed correctly.

## Next Action

User should manually check if the background deployment completed, or force a clean rebuild following Option 2 above.
