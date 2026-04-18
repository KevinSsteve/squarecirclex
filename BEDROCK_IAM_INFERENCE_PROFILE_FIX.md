# Bedrock IAM Inference Profile Fix

## Issue Identified

CloudWatch logs revealed the root cause of the 500 error:

```
AccessDeniedException: User: arn:aws:sts::116708768297:assumed-role/onzo-lambda-execution-dev/onzo-chat-handler-dev 
is not authorized to perform: bedrock:InvokeModel on resource: 
arn:aws:bedrock:us-east-1:116708768297:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0 
because no identity-based policy allows the bedrock:InvokeModel action
```

## Root Cause

The Lambda execution role's Bedrock IAM policy had `Resource: '*'` which should theoretically work, but AWS Bedrock is more restrictive with **inference profiles**. The policy needs to explicitly allow access to:

1. Foundation models
2. Inference profiles (Cross-Region Inference)
3. Provisioned models

## Solution Applied

Updated `template.yaml` (lines 636-643) to explicitly grant access to all Bedrock resource types:

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
          - 'arn:aws:bedrock:*::foundation-model/*'
          - 'arn:aws:bedrock:*:*:inference-profile/*'
          - 'arn:aws:bedrock:*:*:provisioned-model/*'
```

This explicitly allows:
- `arn:aws:bedrock:*::foundation-model/*` - Direct foundation model access
- `arn:aws:bedrock:*:*:inference-profile/*` - Cross-Region Inference (CRI) profiles
- `arn:aws:bedrock:*:*:provisioned-model/*` - Provisioned throughput models

## Files Modified

- `template.yaml` - Updated BedrockAccess IAM policy

## Deployment Required

```powershell
sam build
sam deploy
```

## Expected Outcome

After deployment:
- Lambda will have proper permissions to invoke Bedrock models via inference profiles
- Both Claude (text generation) and Titan (image generation) will work
- The 500 error on `/chat/generate-image` endpoint will be resolved

## Additional Context

The model ID being used is:
- Claude: `us.anthropic.claude-3-5-sonnet-20241022-v2:0` (inference profile)
- Titan: `amazon.titan-image-generator-v2:0` (foundation model)

The inference profile format (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`) requires the `inference-profile/*` resource permission.

---

**Created**: 2026-03-09
**Status**: Fix applied, deployment pending
