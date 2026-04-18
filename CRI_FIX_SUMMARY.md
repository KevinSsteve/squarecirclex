# Cross-Region Inference (CRI) Fix - Quick Summary

## ✅ Changes Applied

### 1. Model ID Updated
- **File:** `template.yaml` (line ~38)
- **Change:** Using US System Profile ID with `us.` prefix
- **Value:** `us.anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Benefit:** Enables cross-region traffic routing and higher quotas

### 2. IAM Permissions Refined
- **File:** `template.yaml` (line ~600)
- **Change:** Replaced wildcard with explicit resource ARNs
- **Resources:**
  1. `arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`
  2. `arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`
  3. `arn:aws:bedrock:us-east-1:${AWS::AccountId}:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Benefit:** Better security and explicit failover regions

## 🚀 Quick Deployment

### Option 1: Using PowerShell Script (Recommended)
```powershell
.\scripts\deploy-cri-fix.ps1
```

### Option 2: Manual SAM Commands
```powershell
sam build
sam deploy --no-confirm-changeset --parameter-overrides Environment=dev
```

### Option 3: Skip Build (if already built)
```powershell
.\scripts\deploy-cri-fix.ps1 -SkipBuild
```

## ✓ Verification

### Automated Verification
```powershell
.\scripts\verify-cri-fix.ps1
```

### Manual Verification
```powershell
# Check Model ID parameter
aws cloudformation describe-stacks --stack-name experta-dev --query 'Stacks[0].Parameters[?ParameterKey==`BedrockClaudeModelId`].ParameterValue' --output text

# Check Lambda environment variable
aws lambda get-function-configuration --function-name experta-dev-chat-handler-dev --query 'Environment.Variables.BEDROCK_CLAUDE_MODEL_ID' --output text

# Check IAM permissions
aws iam get-role-policy --role-name experta-dev-lambda-execution-dev --policy-name BedrockAccess
```

## 📊 Expected Results

After deployment:
- ✅ No more `AccessDeniedException` from Bedrock
- ✅ Reduced throttling (higher quotas)
- ✅ Automatic failover between us-east-1 and us-west-2
- ✅ Improved chat response times
- ✅ Better error handling

## 🔍 What This Fixes

### Before (Problems)
- ❌ Single-region model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- ❌ Low quotas in new AWS accounts
- ❌ AccessDenied errors
- ❌ Throttling errors
- ❌ Wildcard IAM permissions (`Resource: '*'`)

### After (Solutions)
- ✅ US System Profile ID: `us.anthropic.claude-3-5-sonnet-20241022-v2:0`
- ✅ Higher quotas via inference profile
- ✅ Cross-region traffic routing
- ✅ Automatic failover
- ✅ Explicit IAM permissions (3 specific ARNs)

## 📁 Files Modified

1. **template.yaml**
   - Line ~38: `BedrockClaudeModelId` parameter
   - Line ~600: `LambdaExecutionRole` BedrockAccess policy

## 📁 Files Created

1. **BEDROCK_CRI_FIX.md** - Detailed documentation
2. **scripts/deploy-cri-fix.ps1** - Deployment script
3. **scripts/verify-cri-fix.ps1** - Verification script
4. **CRI_FIX_SUMMARY.md** - This file

## 🎯 Key Concepts

### What is Cross-Region Inference (CRI)?
CRI allows Bedrock to automatically route requests between multiple AWS regions (us-east-1 and us-west-2) based on:
- Available capacity
- Current quotas
- Regional throttling

### What is a US System Profile?
A US System Profile is an AWS-managed inference profile that:
- Has the `us.` prefix in the model ID
- Provides higher default quotas
- Enables automatic cross-region routing
- Costs the same as single-region endpoints

### Why Explicit IAM Permissions?
Instead of using `Resource: '*'`, we specify exactly which resources can be accessed:
1. **Better Security:** Principle of least privilege
2. **Audit Trail:** Clear visibility of what's allowed
3. **Compliance:** Meets security best practices
4. **Failover Control:** Explicit regions for failover

## 🔗 References

- [AWS Bedrock CRI Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)
- [Inference Profiles Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

## 💡 Pro Tips

1. **Monitor CloudWatch Logs:** Check which region handles each request
2. **Set Up Alarms:** Alert on throttling or errors
3. **Test Failover:** Temporarily disable one region to verify failover works
4. **Track Costs:** CRI has no additional cost, but monitor usage

## 🆘 Troubleshooting

### Deployment Fails
```powershell
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name experta-dev --max-items 20

# Verify AWS credentials
aws sts get-caller-identity
```

### Still Getting AccessDenied
```powershell
# Verify Model ID is correct
.\scripts\verify-cri-fix.ps1

# Check Lambda logs
aws logs tail /aws/lambda/experta-dev-chat-handler-dev --follow
```

### Build Takes Too Long
```powershell
# Use cached build
.\scripts\deploy-cri-fix.ps1 -SkipBuild

# Or use container build
sam build --use-container
```

---

**Status:** ✅ Ready to Deploy
**Estimated Time:** 5-10 minutes
**Risk Level:** Low (configuration change only, no code changes)
