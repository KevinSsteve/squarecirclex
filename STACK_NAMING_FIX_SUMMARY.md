# Stack Naming Conflict Resolution

**Date**: February 16, 2026  
**Status**: Template Updated - Deployment Blocked by Existing Resources

## Problem

Both the "onzo" and "experta-dev" stacks use `Environment=dev`, creating identical resource names:
- Tables: `Experta-Brands-dev`, `Experta-Posts-dev`, etc.
- IAM Roles: `experta-lambda-execution-dev`
- S3 Buckets, EventBridge buses, etc.

CloudFormation blocks deployment with `ResourceExistenceCheck` error because resources already exist.

## Solution Implemented

Updated `template.yaml` to use stack-specific naming with `${AWS::StackName}`:

### Before
```yaml
TableName: !Sub 'Experta-Brands-${Environment}'
RoleName: !Sub 'experta-lambda-execution-${Environment}'
FunctionName: !Sub 'experta-onboarding-${Environment}'
```

### After
```yaml
TableName: !Sub '${AWS::StackName}-Brands-${Environment}'
RoleName: !Sub '${AWS::StackName}-lambda-execution-${Environment}'
FunctionName: !Sub '${AWS::StackName}-onboarding-${Environment}'
```

### Resources Updated
- ✅ All DynamoDB Tables (7 tables)
- ✅ IAM Role (LambdaExecutionRole)
- ✅ S3 Bucket (ContentBucket)
- ✅ EventBridge Bus
- ✅ Cognito User Pool & Client
- ✅ API Gateway
- ✅ SNS Topic
- ✅ KMS Key Alias
- ✅ Lambda Functions (9 functions)
- ✅ Lambda Layers (2 layers)
- ✅ CloudWatch Log Groups (10 log groups)
- ✅ CloudWatch Alarms (12 alarms)

## Current Situation

The template is now correctly configured for stack-specific naming. However, deployment still fails because:

1. **The "onzo" stack already owns the resources** with the old naming pattern
2. **We need to decide**: Keep "onzo" or migrate to "experta-dev"

## Decision Required

### Option 1: Keep "onzo" Stack (Recommended)
Since "onzo" is already deployed and working:
1. Delete the "experta-dev" stack attempt
2. Update the "onzo" stack with the new chat handler code
3. Use "onzo" as the primary stack going forward

**Command**:
```bash
# Update onzo stack with new code
sam deploy --stack-name onzo --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --resolve-s3 --parameter-overrides "Environment=dev BedrockClaudeModelId=anthropic.claude-3-5-sonnet-20241022-v2:0 BedrockTitanModelId=amazon.titan-image-generator-v1"
```

### Option 2: Migrate to "experta-dev" Stack
If you want to use "experta-dev" instead:
1. Delete the "onzo" stack completely
2. Wait for all resources to be removed
3. Deploy "experta-dev" stack fresh

**Commands**:
```bash
# Delete onzo stack
aws cloudformation delete-stack --stack-name onzo

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name onzo

# Deploy experta-dev
sam deploy --stack-name experta-dev --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --resolve-s3 --parameter-overrides "Environment=dev BedrockClaudeModelId=anthropic.claude-3-5-sonnet-20241022-v2:0 BedrockTitanModelId=amazon.titan-image-generator-v1"
```

### Option 3: Run Both Stacks Side-by-Side
Keep both stacks with different environments:
- onzo: `Environment=prod`
- experta-dev: `Environment=dev`

This requires updating one stack to use a different environment parameter.

## What Was Accomplished

1. ✅ Updated chat handler with AI-first onboarding (dual persona system)
2. ✅ Fixed all resource naming conflicts in template.yaml
3. ✅ Ensured stack-specific naming for all AWS resources
4. ✅ Updated CORS headers for localhost:5173
5. ✅ Maintained Node.js 20.x runtime

## Next Steps

**Immediate Action Required**:
1. Choose Option 1, 2, or 3 above
2. Execute the corresponding commands
3. Update frontend `.env` with new API URL and Cognito details (if they change)

## Frontend Changes Still Needed

After successful deployment, implement frontend changes:
1. Update routing (/ becomes chat)
2. Handle onboarding mode responses from API
3. Display upload button for asset-heavy businesses
4. Remove old onboarding components
5. Update auth redirects

## Files Modified

- `template.yaml` - All resource names updated with `${AWS::StackName}`
- `functions/chat-handler/handler.js` - Dual persona system implemented
- `AI_FIRST_ONBOARDING_IMPLEMENTATION.md` - Implementation documentation

## Testing Checklist

After deployment:
- [ ] Verify API Gateway URL
- [ ] Test new user signup → chat onboarding
- [ ] Test existing user login → dashboard
- [ ] Verify brand creation in DynamoDB
- [ ] Test entity extraction accuracy
- [ ] Verify business classification (Type A/B)
- [ ] Test CORS with localhost:5173

---

**Recommendation**: Use Option 1 (keep "onzo" stack) since it's already deployed and working. Simply update it with the new code.
