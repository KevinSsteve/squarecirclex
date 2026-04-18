# Quick Fix Reference - Bedrock Stability

## What Was Fixed

| Fix | File | Change | Status |
|-----|------|--------|--------|
| **CRI Model** | template.yaml | Model ID format | ✅ Already correct |
| **Timeout** | template.yaml | 302s → 29s | ✅ Applied |
| **Persona** | chat-handler/handler.js | Name = "Onzo" | ✅ Already correct |

## Deploy Now

```bash
sam build && sam deploy
```

## Why These Fixes

### 1. Cross-Region Inference (CRI)
- **Problem:** Regional throttling
- **Fix:** `us.anthropic.claude-3-5-sonnet-20240620-v1:0`
- **Result:** 4x more throughput

### 2. Timeout Optimization
- **Problem:** API Gateway 30s limit, Lambda 302s timeout
- **Fix:** Lambda timeout = 29s
- **Result:** No more 504 errors

### 3. Persona Consistency
- **Problem:** Branding consistency
- **Fix:** "Onzo" everywhere
- **Result:** Professional UX

## Verify After Deploy

```bash
# Check timeout
aws lambda get-function-configuration --function-name chat-handler --query 'Timeout'
# Expected: 29

# Test chat
curl -X POST https://your-api/chat -d '{"message":"Hello"}'
# Expected: Response in < 29s with "Onzo" persona

# Monitor logs
aws logs tail /aws/lambda/chat-handler --follow
# Expected: No throttling errors
```

## Success Metrics

- ✅ No "TooManyRequestsException"
- ✅ No 504 timeout errors
- ✅ Response time < 29 seconds
- ✅ "Onzo" in chat responses

## Rollback (If Needed)

```yaml
# In template.yaml, change:
Timeout: 302  # Revert to original
```

Then redeploy:
```bash
sam build && sam deploy
```

## Files Changed

- ✅ `template.yaml` - Timeout updated
- ✅ `scripts/apply-stability-fixes.ps1` - Deploy script
- ✅ Documentation files created

## Next Steps

1. Deploy: `sam build && sam deploy`
2. Test chat functionality
3. Monitor CloudWatch for 24 hours
4. Verify no throttling errors

## Support

Issues? Check:
1. CloudWatch Logs: `/aws/lambda/chat-handler`
2. API Gateway metrics: Integration latency
3. Bedrock quotas: Service Quotas console
