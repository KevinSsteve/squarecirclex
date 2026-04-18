# Experta Deployment Checklist

## Pre-Deployment

- [ ] AWS CLI installed and configured
- [ ] AWS SAM CLI installed (v1.100.0+)
- [ ] Node.js 18.x installed
- [ ] Python 3.11 installed
- [ ] Docker installed and running

## Deployment

- [ ] Run `sam validate` - template is valid
- [ ] Run `sam build` - build succeeds
- [ ] Run `sam deploy --guided` - deployment succeeds
- [ ] Run `bash scripts/validate-infrastructure.sh` - all checks pass

## Post-Deployment

- [ ] Enable Bedrock model access (Claude 3.5 Sonnet, Titan)
- [ ] Subscribe to SNS failure notifications
- [ ] Store social media credentials in Secrets Manager (optional)
- [ ] Test API Gateway endpoint
- [ ] Verify Cognito User Pool
- [ ] Check CloudWatch logs

## Next Steps

- [ ] Proceed to Task 2: Core Shared Libraries (Node.js)
- [ ] Implement encryption service
- [ ] Implement authentication middleware
- [ ] Create error handling utilities
