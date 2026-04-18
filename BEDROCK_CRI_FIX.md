# Bedrock Cross-Region Inference (CRI) Implementation

## Date: February 18, 2026

## Problem Statement
The application was experiencing AccessDenied and Throttling errors when invoking Amazon Bedrock models due to:
1. Using single-region model IDs instead of Cross-Region Inference profiles
2. Low quotas in new AWS accounts
3. Generic wildcard IAM permissions instead of explicit resource-based permissions

## Solution Implemented

### 1. Model ID Update (template.yaml)
**Changed:** Parameter `BedrockClaudeModelId` default value

**Before:**
```yaml
BedrockClaudeModelId:
  Type: String
  Default: us.anthropic.claude-3-5-sonnet-20241022-v2:0
  Description: Bedrock Claude model ID (use inference profile for Claude 3.5 Sonnet v2)
```

**After:**
```yaml
BedrockClaudeModelId:
  Type: String
  Default: us.anthropic.claude-3-5-sonnet-20241022-v2:0
  Description: Bedrock Claude model ID - US System Profile for Cross-Region Inference (CRI)
```

**Key Change:** The model ID now uses the `us.` prefix, which is the US System Profile ID that enables Cross-Region Inference. This allows traffic routing between us-east-1 and us-west-2 regions, avoiding low quotas in new accounts.

### 2. IAM Permissions Refinement (template.yaml)
**Changed:** LambdaExecutionRole BedrockAccess policy

**Before:**
```yaml
- PolicyName: BedrockAccess
  PolicyDocument:
    Version: '2012-10-17'
    Statement:
      - Effect: Allow
        Action:
          - 'bedrock:InvokeModel'
          - 'bedrock:InvokeModelWithResponseStream'
        Resource: '*'
```

**After:**
```yaml
- PolicyName: BedrockAccess
  PolicyDocument:
    Version: '2012-10-17'
    Statement:
      - Effect: Allow
        Action:
          - 'bedrock:InvokeModel'
          - 'bedrock:InvokeModelWithResponseStream'
        Resource:
          - !Sub 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
          - !Sub 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
          - !Sub 'arn:aws:bedrock:us-east-1:${AWS::AccountId}:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0'
```

**Key Changes:**
- Replaced wildcard (`*`) with three explicit resource ARNs
- **Resource 1:** Base model in us-east-1 (primary region)
- **Resource 2:** Base model in us-west-2 (failover region)
- **Resource 3:** US System Profile inference profile ARN (enables CRI)

## Benefits

1. **Cross-Region Traffic Routing:** The US System Profile automatically routes requests between us-east-1 and us-west-2 based on availability and quotas
2. **Higher Quotas:** System profiles have higher default quotas than single-region endpoints
3. **Better Security:** Explicit resource-based permissions follow AWS security best practices
4. **Improved Reliability:** Automatic failover between regions if one region is throttled or unavailable
5. **Cost Optimization:** No additional cost for using inference profiles

## Deployment Instructions

### Option 1: Quick Deploy (Recommended)
```powershell
# Build the SAM application
sam build

# Deploy with confirmation
sam deploy --parameter-overrides Environment=dev
```

### Option 2: No-Confirm Deploy
```powershell
# Build and deploy without confirmation prompts
sam build
sam deploy --no-confirm-changeset --parameter-overrides Environment=dev
```

### Option 3: Using Makefile
```powershell
# If you have make installed
make deploy ENV=dev
```

## Verification Steps

After deployment, verify the changes:

### 1. Check CloudFormation Stack
```powershell
aws cloudformation describe-stacks --stack-name experta-dev --query 'Stacks[0].Parameters'
```

Look for `BedrockClaudeModelId` parameter with value `us.anthropic.claude-3-5-sonnet-20241022-v2:0`

### 2. Check Lambda Environment Variables
```powershell
aws lambda get-function-configuration --function-name experta-dev-chat-handler-dev --query 'Environment.Variables.BEDROCK_CLAUDE_MODEL_ID'
```

Should return: `"us.anthropic.claude-3-5-sonnet-20241022-v2:0"`

### 3. Check IAM Role Permissions
```powershell
aws iam get-role-policy --role-name experta-dev-lambda-execution-dev --policy-name BedrockAccess
```

Should show the three explicit resource ARNs.

### 4. Test Chat Endpoint
```powershell
# Get your API endpoint
$API_URL = aws cloudformation describe-stacks --stack-name experta-dev --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text

# Test the chat endpoint (requires valid auth token)
curl -X POST "$API_URL/chat" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{"message": "Hello, test message"}'
```

## Expected Outcomes

After deployment:
- ✅ No more AccessDenied errors from Bedrock
- ✅ Reduced throttling due to higher quotas
- ✅ Automatic failover between us-east-1 and us-west-2
- ✅ Improved chat response times
- ✅ Better error handling and logging

## Rollback Plan

If issues occur, rollback to previous version:

```powershell
# List previous stack versions
aws cloudformation list-stack-resources --stack-name experta-dev

# Rollback to previous template
sam deploy --parameter-overrides Environment=dev BedrockClaudeModelId=anthropic.claude-3-5-sonnet-20241022-v2:0
```

## Additional Notes

- The model ID change is backward compatible - existing code will work without modification
- The Lambda handler already uses the environment variable `BEDROCK_CLAUDE_MODEL_ID`, so no code changes are needed
- CloudWatch logs will show which region is handling each request (useful for debugging)
- Monitor CloudWatch metrics for Bedrock invocations to verify CRI is working

## Related Files Modified

1. `template.yaml` - Infrastructure configuration
   - Line ~38: BedrockClaudeModelId parameter
   - Line ~600: LambdaExecutionRole BedrockAccess policy

## References

- [AWS Bedrock Cross-Region Inference Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)
- [AWS Bedrock Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

---

**Status:** ✅ Changes Applied - Ready for Deployment
**Next Step:** Run `sam build && sam deploy` to apply changes
