# Pre-Deployment Checklist for Experta Backend

This checklist ensures you have everything configured before deploying the Experta AI Social Media Manager backend to AWS.

## ✅ Prerequisites

### 1. AWS Account Setup
- [ ] AWS Account created and active
- [ ] Billing alerts configured (recommended)
- [ ] AWS CLI installed and configured
  ```bash
  aws --version
  aws configure
  ```
- [ ] AWS SAM CLI installed
  ```bash
  sam --version
  ```

### 2. AWS Credentials
- [ ] AWS Access Key ID configured
- [ ] AWS Secret Access Key configured
- [ ] Default region set (us-east-1 or eu-central-1 recommended)
- [ ] Verify credentials work:
  ```bash
  aws sts get-caller-identity
  ```

### 3. Required AWS Service Limits
- [ ] Lambda concurrent executions: At least 100
- [ ] DynamoDB tables: At least 4
- [ ] S3 buckets: At least 1
- [ ] API Gateway APIs: At least 1
- [ ] Cognito User Pools: At least 1

## 🔐 AWS Secrets Manager Configuration

### Required Secrets: NONE
The system works without any secrets configured. All secrets are optional.

### Optional Secrets (for Instagram Trend Scraping)

If you want to enable Instagram trend scraping, create these secrets:

#### Secret 1: Instagram App ID
- **Secret Name**: `experta/instagram/app-id`
- **Secret Type**: Plaintext
- **Value**: Your Instagram App ID from Meta Developer Portal
- **How to create**:
  ```bash
  aws secretsmanager create-secret \
    --name experta/instagram/app-id \
    --description "Instagram App ID for Experta trend scraping" \
    --secret-string "YOUR_INSTAGRAM_APP_ID" \
    --region us-east-1
  ```

#### Secret 2: Instagram App Secret
- **Secret Name**: `experta/instagram/app-secret`
- **Secret Type**: Plaintext
- **Value**: Your Instagram App Secret from Meta Developer Portal
- **How to create**:
  ```bash
  aws secretsmanager create-secret \
    --name experta/instagram/app-secret \
    --description "Instagram App Secret for Experta trend scraping" \
    --secret-string "YOUR_INSTAGRAM_APP_SECRET" \
    --region us-east-1
  ```

#### How to Get Instagram Credentials (Optional)
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add Instagram Graph API product
4. Copy App ID and App Secret
5. Store in AWS Secrets Manager as shown above

**Note**: If these secrets are not configured, the Trend Scraper will use mock data instead. The system will function normally without Instagram credentials.

## 🤖 Amazon Bedrock Model Access

### Required Models
You MUST enable access to these models in Amazon Bedrock:

#### 1. Claude 3.5 Sonnet
- **Model ID**: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Used for**: Conversational AI, content generation, chat handling
- **Required**: YES

#### 2. Titan Image Generator
- **Model ID**: `amazon.titan-image-generator-v1`
- **Used for**: AI image generation for social media posts
- **Required**: YES

### How to Enable Bedrock Models

1. **Via AWS Console**:
   - Go to AWS Console
   - Navigate to Amazon Bedrock
   - Click "Model access" in the left sidebar
   - Click "Manage model access"
   - Select:
     - ✅ Claude 3.5 Sonnet
     - ✅ Titan Image Generator v1
   - Click "Request model access"
   - Wait for approval (usually instant)

2. **Via AWS CLI**:
   ```bash
   # Check current model access
   aws bedrock list-foundation-models --region us-east-1
   
   # Note: Model access requests must be done via console
   ```

3. **Verify Access**:
   ```bash
   # Test Claude access
   aws bedrock invoke-model \
     --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
     --body '{"anthropic_version":"bedrock-2023-05-31","messages":[{"role":"user","content":"Hello"}],"max_tokens":100}' \
     --region us-east-1 \
     output.json
   
   # Test Titan access
   aws bedrock invoke-model \
     --model-id amazon.titan-image-generator-v1 \
     --body '{"taskType":"TEXT_IMAGE","textToImageParams":{"text":"test"},"imageGenerationConfig":{"numberOfImages":1,"height":512,"width":512}}' \
     --region us-east-1 \
     output.json
   ```

### Important Notes
- Model access is **region-specific**
- If deploying to `us-east-1`, enable models in `us-east-1`
- If deploying to `eu-central-1`, enable models in `eu-central-1`
- Model access is usually approved instantly
- There is no cost for requesting access, only for usage

## 📋 IAM Permissions

### Required IAM Permissions for Deployment User

Your AWS user/role needs these permissions to deploy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "s3:*",
        "iam:*",
        "cognito-idp:*",
        "events:*",
        "kms:*",
        "sns:*",
        "logs:*",
        "secretsmanager:GetSecretValue",
        "bedrock:InvokeModel"
      ],
      "Resource": "*"
    }
  ]
}
```

Or use AWS managed policies:
- `AdministratorAccess` (full access - easiest for first deployment)
- `PowerUserAccess` (recommended for production)

## 🌍 Region Selection

### Recommended Regions

#### Option 1: us-east-1 (US East - N. Virginia) ⭐ RECOMMENDED
- ✅ Full Bedrock model availability
- ✅ Claude 3.5 Sonnet available
- ✅ Titan Image Generator available
- ✅ Lowest latency for US users
- ✅ Most AWS services available
- ✅ Generally lowest costs

#### Option 2: eu-central-1 (Europe - Frankfurt)
- ✅ Bedrock available
- ✅ Claude 3.5 Sonnet available
- ✅ Titan Image Generator available
- ✅ GDPR compliant
- ✅ Lower latency for EU users

### Check Bedrock Availability
```bash
# List available models in a region
aws bedrock list-foundation-models --region us-east-1 | grep -E "claude-3-5|titan-image"
```

## 💰 Cost Estimation

### Expected Monthly Costs (Development Environment)

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| Lambda | 100K invocations, 512MB, 30s avg | $5-10 |
| DynamoDB | 1M reads, 100K writes | $2-5 |
| S3 | 10GB storage, 1K requests | $0.50 |
| API Gateway | 100K requests | $0.35 |
| Bedrock Claude | 1M input tokens, 100K output | $15-30 |
| Bedrock Titan | 100 images | $5-10 |
| EventBridge | 10K events | $0.10 |
| CloudWatch | Logs and metrics | $2-5 |
| **Total** | | **$30-65/month** |

### Production Costs
- Scale with usage
- Enable cost alerts in AWS Billing
- Use AWS Cost Explorer to monitor

## 🔍 Pre-Deployment Verification

### Run These Commands Before Deploying

```bash
# 1. Verify AWS credentials
aws sts get-caller-identity

# 2. Check SAM CLI
sam --version

# 3. Verify region has Bedrock
aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `claude-3-5`) || contains(modelId, `titan-image`)].modelId'

# 4. Check if stack already exists (optional)
aws cloudformation describe-stacks --stack-name experta-dev --region us-east-1

# 5. Validate SAM template
sam validate --region us-east-1
```

## 📝 Deployment Checklist

### Before Running Deploy Script

- [ ] AWS CLI configured with valid credentials
- [ ] SAM CLI installed
- [ ] Bedrock models enabled (Claude 3.5 Sonnet + Titan Image Generator)
- [ ] Region selected (us-east-1 or eu-central-1)
- [ ] Environment selected (dev, staging, or prod)
- [ ] (Optional) Instagram secrets created in Secrets Manager
- [ ] Cost alerts configured
- [ ] Deployment user has required IAM permissions

### During Deployment

- [ ] Run deployment script: `./scripts/deploy.sh` or `./scripts/deploy.ps1`
- [ ] Review SAM guided deployment prompts
- [ ] Confirm stack creation/update
- [ ] Wait for deployment to complete (5-10 minutes)

### After Deployment

- [ ] Save deployment outputs (API URL, User Pool ID, etc.)
- [ ] Configure SNS email subscription for failure notifications
- [ ] Update frontend `.env` file with backend values
- [ ] Test API endpoints
- [ ] Check CloudWatch Dashboard
- [ ] Verify Lambda functions are deployed
- [ ] Test Cognito user registration

## 🚨 Common Issues and Solutions

### Issue 1: "Bedrock model not found"
**Solution**: Enable model access in Amazon Bedrock console for your deployment region

### Issue 2: "Insufficient permissions"
**Solution**: Ensure your AWS user has required IAM permissions (see above)

### Issue 3: "Stack already exists"
**Solution**: Use `sam deploy` without `--guided` flag to update existing stack

### Issue 4: "Lambda timeout"
**Solution**: Increase timeout in template.yaml (already set to 300s for content generator)

### Issue 5: "S3 bucket name already taken"
**Solution**: Bucket names include AWS Account ID, should be unique. Check template.yaml

### Issue 6: "DynamoDB throttling"
**Solution**: Tables use PAY_PER_REQUEST billing mode, no throttling expected

## 📞 Support Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **SAM Documentation**: https://docs.aws.amazon.com/serverless-application-model/
- **Bedrock Documentation**: https://docs.aws.amazon.com/bedrock/
- **AWS Support**: https://console.aws.amazon.com/support/

## ✅ Final Checklist

Before running deployment:

- [ ] All prerequisites installed
- [ ] AWS credentials configured
- [ ] Bedrock models enabled
- [ ] Region selected
- [ ] (Optional) Instagram secrets created
- [ ] Cost alerts configured
- [ ] Ready to deploy!

---

## 🚀 Ready to Deploy?

Run the deployment script:

**Linux/Mac**:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows (PowerShell)**:
```powershell
.\scripts\deploy.ps1
```

The script will guide you through the deployment process step by step.
