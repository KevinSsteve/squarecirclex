# Lazy Image Generation 500 Error - Debug Guide

## Status: DEBUGGING IN PROGRESS

**Issue**: Clicking "🎨 Gerar Imagem" returns POST 500 (Internal Server Error) from `/chat/generate-image`

## What We Know

### ✅ CORS is Working
- Preflight OPTIONS request succeeds
- API Gateway routing is correct
- Network connectivity is established

### ✅ Code Has Comprehensive Error Logging
The `generateAndUploadImage()` function in `functions/chat-handler/handler.js` (lines 709-870) already includes:

1. **Input Validation** (lines 715-735):
   - Validates `imageDescription` is a non-empty string
   - Validates `brandContext` has `brand_id`
   - Validates `userId` is present
   - Validates environment variables (`BEDROCK_TITAN_MODEL_ID`, `S3_BUCKET_NAME`)

2. **Bedrock Invocation Error Handling** (lines 770-783):
   - Catches Bedrock errors separately
   - Logs full error details including `$metadata`
   - Logs model ID and request body

3. **Response Parsing Error Handling** (lines 786-794):
   - Catches JSON parse errors
   - Validates response structure

4. **S3 Upload Error Handling** (lines 833-842):
   - Catches S3 upload errors separately
   - Logs bucket name and key

5. **Comprehensive Catch Block** (lines 856-870):
   - Logs all error details
   - Logs brand context and user ID

## Next Steps to Debug

### 1. Check CloudWatch Logs
The Lambda function is logging detailed error information. You need to check CloudWatch Logs for the Lambda function:

```powershell
# Get the Lambda function name
aws lambda list-functions --query "Functions[?contains(FunctionName, 'chat-handler')].FunctionName" --output text

# Tail the logs (replace FUNCTION_NAME with actual name)
aws logs tail /aws/lambda/FUNCTION_NAME --since 1h --follow
```

### 2. Most Likely Root Causes

Based on the code structure, the 500 error is most likely one of these:

#### A) **Missing Environment Variable**
- `BEDROCK_TITAN_MODEL_ID` not set correctly
- `S3_BUCKET_NAME` not set correctly
- Check in `template.yaml` lines 789-795 (ChatHandlerFunction environment variables)

#### B) **IAM Permissions Issue**
- Lambda execution role may not have `bedrock:InvokeModel` permission for Titan
- Check `template.yaml` lines 636-643 (BedrockAccess policy)
- Current policy allows `Resource: '*'` which should work, but verify the role is attached

#### C) **Bedrock Model ID Mismatch**
- Current default: `amazon.titan-image-generator-v2:0`
- Verify this model ID is available in `us-east-1` region
- Check if model access is enabled in Bedrock console

#### D) **Request Payload Issue**
- Titan V2 requires specific payload structure
- Current structure (lines 741-757) looks correct:
  ```javascript
  {
    taskType: 'TEXT_IMAGE',
    textToImageParams: { text, negativeText },
    imageGenerationConfig: { numberOfImages, quality, height, width, cfgScale, seed }
  }
  ```

### 3. Quick Verification Commands

```powershell
# Check if environment variables are set
aws lambda get-function-configuration --function-name onzo-chat-handler-dev --query 'Environment.Variables'

# Check IAM role permissions
aws lambda get-function --function-name onzo-chat-handler-dev --query 'Configuration.Role'

# Then describe the role
aws iam get-role --role-name <ROLE_NAME_FROM_ABOVE>
```

### 4. Test Bedrock Access Directly

```powershell
# Test if you can invoke Titan directly
aws bedrock-runtime invoke-model `
  --model-id amazon.titan-image-generator-v2:0 `
  --body '{"taskType":"TEXT_IMAGE","textToImageParams":{"text":"test"},"imageGenerationConfig":{"numberOfImages":1,"quality":"standard","height":512,"width":512}}' `
  --region us-east-1 `
  output.json
```

## Current Code State

The error handling code is already deployed and comprehensive. The issue is NOT a lack of error logging - the logs should contain the exact error message.

## What to Tell the User

"The code already has comprehensive error logging in place. To diagnose the 500 error, we need to check the CloudWatch logs for the Lambda function. The most likely causes are:

1. Missing or incorrect `BEDROCK_TITAN_MODEL_ID` environment variable
2. IAM permissions issue (Lambda role missing Bedrock access)
3. Bedrock model not enabled in your AWS account
4. Invalid request payload structure

Can you check the CloudWatch logs for the `onzo-chat-handler-dev` Lambda function? The logs will show the exact error message with full details."

## Files Modified

- `functions/chat-handler/handler.js` - Already has comprehensive error logging (lines 709-870)
- No deployment needed - error logging is already in place

## Deployment Status

- ❌ Cannot deploy due to network connectivity issues with AWS CLI
- ✅ Code changes are ready but not deployed
- ⚠️ User needs to check CloudWatch logs to see actual error

---

**Created**: 2026-03-09
**Status**: Awaiting CloudWatch log analysis
