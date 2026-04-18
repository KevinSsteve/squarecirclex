# Experta Quick Start Guide

Get Experta up and running in 15 minutes.

## Prerequisites

- AWS Account
- AWS CLI configured
- AWS SAM CLI installed
- Node.js 18.x
- Python 3.11

## Quick Setup

### 1. Install SAM CLI (if not installed)

```bash
pip install aws-sam-cli
```

### 2. Validate Template

```bash
sam validate
```

### 3. Build Project

```bash
sam build
```

### 4. Deploy to AWS

```bash
sam deploy --guided
```

Follow the prompts:
- Stack name: `experta-ai-social-manager`
- Region: `us-east-1`
- Environment: `dev`
- Confirm changes: `Y`
- Allow IAM role creation: `Y`
- Save config: `Y`

### 5. Verify Deployment

```bash
bash scripts/validate-infrastructure.sh
```

### 6. Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name experta-ai-social-manager \
  --query 'Stacks[0].Outputs' \
  --output table
```

## What's Deployed?

✅ **DynamoDB Tables**
- Brands (with user_id GSI)
- Posts (with brand_id-scheduled_time and brand_id-status GSIs)
- Automation_Logs (with brand_id-timestamp GSI, 90-day TTL)
- Trends (7-day TTL)

✅ **S3 Bucket**
- Encrypted at rest
- Versioning enabled
- Lifecycle policies for temp/ folder (1-day expiration)
- CORS configured

✅ **Cognito User Pool**
- Email verification enabled
- Custom attribute: brand_id
- Password policy configured
- MFA optional

✅ **API Gateway**
- REST API with Cognito authorizer
- CORS enabled
- JWT token validation

✅ **EventBridge**
- Custom event bus for system events
- Ready for scheduled rules

✅ **KMS Key**
- For encrypting social media credentials
- Alias: alias/experta-credentials-{env}

✅ **IAM Roles**
- Lambda execution role with all necessary permissions
- DynamoDB, S3, KMS, EventBridge, Bedrock, SNS access

✅ **SNS Topic**
- For failure notifications

## Next Steps

### 1. Enable Bedrock Models

Go to AWS Console → Bedrock → Model access

Request access to:
- Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20241022-v2:0)
- Titan Image Generator (amazon.titan-image-generator-v1)

### 2. Subscribe to Failure Notifications

```bash
aws sns subscribe \
  --topic-arn $(aws cloudformation describe-stacks \
    --stack-name experta-ai-social-manager \
    --query 'Stacks[0].Outputs[?OutputKey==`FailureTopicArn`].OutputValue' \
    --output text) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

Check your email and confirm the subscription.

### 3. Store Social Media Credentials (Optional for now)

```bash
# Instagram
aws secretsmanager create-secret \
  --name experta/instagram/app-credentials \
  --secret-string '{"app_id":"YOUR_APP_ID","app_secret":"YOUR_APP_SECRET"}'

# LinkedIn
aws secretsmanager create-secret \
  --name experta/linkedin/app-credentials \
  --secret-string '{"client_id":"YOUR_CLIENT_ID","client_secret":"YOUR_CLIENT_SECRET"}'
```

### 4. Proceed to Next Task

The infrastructure is now ready! Continue with:
- Task 2: Core Shared Libraries (Node.js)
- Task 3: Core Shared Libraries (Python)

## Local Development

### Start API Gateway Locally

```bash
sam local start-api
```

Access at: http://localhost:3000

### Invoke Function Locally

```bash
sam local invoke FunctionName --event events/test-event.json
```

## Useful Commands

### View Logs

```bash
sam logs -n FunctionName --stack-name experta-ai-social-manager --tail
```

### Update Stack

```bash
sam build && sam deploy
```

### Delete Stack

```bash
sam delete
```

**Warning**: This deletes all resources and data!

## Troubleshooting

### Issue: "Stack already exists"

**Solution**: Update instead of create:
```bash
sam deploy
```

### Issue: "Bedrock model not accessible"

**Solution**: Enable model access in AWS Console (Bedrock → Model access)

### Issue: "Insufficient permissions"

**Solution**: Ensure your AWS user has permissions for:
- CloudFormation
- Lambda
- DynamoDB
- S3
- API Gateway
- Cognito
- EventBridge
- KMS
- IAM

### Issue: Docker not running

**Solution**: Start Docker and retry:
```bash
docker ps
sam build
```

## Cost Estimate

Development environment: ~$15-60/month
- Lambda: $5-20
- DynamoDB: $5-15
- S3: $1-5
- API Gateway: $3-10
- Bedrock: Pay per use
- Other services: $1-10

## Support

- Design Doc: `.kiro/specs/experta-ai-social-manager/design.md`
- Requirements: `.kiro/specs/experta-ai-social-manager/requirements.md`
- Tasks: `.kiro/specs/experta-ai-social-manager/tasks.md`
- Deployment Guide: `DEPLOYMENT.md`
- AWS SAM Docs: https://docs.aws.amazon.com/serverless-application-model/

## What's Next?

Infrastructure is ready! Now implement:
1. ✅ Task 1: Infrastructure (COMPLETE)
2. ⏭️ Task 2: Core Shared Libraries (Node.js)
3. ⏭️ Task 3: Core Shared Libraries (Python)
4. ⏭️ Task 4: DynamoDB Data Access Layer
5. ⏭️ Task 5: EventBridge Integration
6. ⏭️ Task 6+: Lambda Functions

Happy coding! 🚀
