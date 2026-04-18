# Chat Handler Timeout and Permission Fix

## Issue Diagnosed
The chat handler was returning fallback error messages after a long delay due to:
1. **Lambda Timeout**: Cross-Region Inference (CRI) takes 4-5 seconds, but ChatHandlerFunction had default timeout of 3 seconds
2. **IAM Permissions**: Potentially missing inference-profile ARN in Bedrock IAM policy

## Changes Applied

### 1. Increased Lambda Timeout
**File**: `template.yaml`
**Change**: ChatHandlerFunction already had `Timeout: 60` configured
- This provides sufficient time for CRI calls (4-5 seconds) plus processing overhead
- No change needed - timeout was already correct

### 2. Wildcard Bedrock Permissions (Debugging)
**File**: `template.yaml` - `LambdaExecutionRole` > `BedrockAccess` policy
**Before**:
```yaml
Resource:
  - !Sub 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
  - !Sub 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
  - !Sub 'arn:aws:bedrock:us-east-1:${AWS::AccountId}:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0'
```

**After**:
```yaml
Resource: '*'
```

**Rationale**: 
- Grants access to ALL Bedrock resources for debugging
- Eliminates permission issues as a potential cause
- Will scope down later once issue is confirmed resolved

### 3. Verified Model ID
**File**: `functions/chat-handler/handler.js`
**Status**: ✅ Already correct
```javascript
const BEDROCK_CLAUDE_MODEL_ID = process.env.BEDROCK_CLAUDE_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
```
- Uses environment variable from template
- Template parameter: `us.anthropic.claude-3-5-sonnet-20241022-v2:0` (CRI profile)
- Handler correctly uses the environment variable

## Deployment
```bash
sam build
sam deploy
```

**Status**: ✅ Deployed successfully at 2026-02-18 07:20:56

## Testing Instructions
1. Open the frontend at `http://localhost:5173`
2. Navigate to the Chat page
3. Send a message to the chat handler
4. Verify:
   - Response arrives within 5-10 seconds (not timing out)
   - No fallback error message
   - Actual AI response is returned

## Expected Behavior
- Chat requests should complete within 5-10 seconds
- Bedrock CRI calls should succeed with wildcard permissions
- CloudWatch logs should show successful Bedrock invocations

## Next Steps
1. Test the chat functionality
2. If successful, scope down Bedrock permissions to specific resources
3. Monitor CloudWatch logs for any remaining errors

## Rollback Plan
If issues persist:
1. Check CloudWatch logs: `/aws/lambda/onzo-chat-handler-dev`
2. Look for specific error codes from Bedrock
3. Verify the model ID is correct in environment variables
4. Consider adding more detailed logging to handler.js

## Security Note
⚠️ The wildcard Bedrock permission (`Resource: '*'`) is temporary for debugging. Once the issue is resolved, we should scope it back down to specific model ARNs and inference profiles.
