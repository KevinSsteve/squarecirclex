# Experta Backend Deployment - Quick Start Guide

This is a condensed guide for deploying the Experta backend to AWS. For detailed information, see `PRE_DEPLOYMENT_CHECKLIST.md`.

## 🎯 Quick Prerequisites

1. **Install Required Tools**:
   - AWS CLI: https://aws.amazon.com/cli/
   - SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

2. **Configure AWS Credentials**:
   ```bash
   aws configure
   # Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
   ```

3. **Enable Bedrock Models** (CRITICAL):
   - Go to AWS Console → Amazon Bedrock → Model access
   - Enable:
     - ✅ Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`)
     - ✅ Titan Image Generator (`amazon.titan-image-generator-v1`)
   - Click "Request model access" (approval is instant)

## 🚀 Deploy in 3 Steps

### Step 1: Run Deployment Script

**Linux/Mac**:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows (PowerShell)**:
```powershell
.\scripts\deploy.ps1
```

### Step 2: Follow Prompts

The script will ask you to:
1. Select AWS region (choose `us-east-1` for best Bedrock support)
2. Select environment (`dev`, `staging`, or `prod`)
3. Confirm Bedrock models are enabled
4. Review deployment settings

### Step 3: Wait for Deployment

- Build time: ~2-3 minutes
- Deploy time: ~5-10 minutes
- Total: ~10-15 minutes

## 📋 What Gets Deployed

The deployment creates:
- ✅ 6 Lambda functions (Onboarding, Content Generator, Auto Publisher, Chat Handler, Trend Scraper, Posts API)
- ✅ 4 DynamoDB tables (Brands, Posts, Automation Logs, Trends)
- ✅ 1 S3 bucket (for images)
- ✅ 1 API Gateway (REST API)
- ✅ 1 Cognito User Pool (authentication)
- ✅ 1 EventBridge Event Bus (automation)
- ✅ 1 KMS Key (credential encryption)
- ✅ 1 SNS Topic (failure notifications)
- ✅ CloudWatch Logs, Alarms, and Dashboard

## 📤 After Deployment

### 1. Save Outputs

The script creates `deployment-outputs-{environment}.txt` with:
- API URL
- Cognito User Pool ID
- Cognito User Pool Client ID
- CloudWatch Dashboard URL

### 2. Configure SNS Notifications

```bash
# Subscribe your email to failure notifications
aws sns subscribe \
  --topic-arn arn:aws:sns:REGION:ACCOUNT:experta-failures-ENV \
  --protocol email \
  --notification-endpoint your-email@example.com
```

Then confirm the subscription email.

### 3. Update Frontend Configuration

Copy these values to `frontend/.env`:
```env
VITE_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Test the Deployment

```bash
# Test API health
curl https://YOUR_API_URL/posts

# Should return 401 (unauthorized) - this is correct!
# It means the API is working and requires authentication
```

## 🔧 Optional Configuration

### Instagram Trend Scraping (Optional)

If you want real Instagram trends instead of mock data:

```bash
# Create Instagram App ID secret
aws secretsmanager create-secret \
  --name experta/instagram/app-id \
  --secret-string "YOUR_INSTAGRAM_APP_ID" \
  --region us-east-1

# Create Instagram App Secret
aws secretsmanager create-secret \
  --name experta/instagram/app-secret \
  --secret-string "YOUR_INSTAGRAM_APP_SECRET" \
  --region us-east-1
```

Get Instagram credentials from: https://developers.facebook.com/

## 📊 Monitor Your Deployment

### CloudWatch Dashboard
- URL provided in deployment outputs
- Shows Lambda invocations, errors, duration
- API Gateway metrics
- DynamoDB metrics

### CloudWatch Logs
```bash
# View Onboarding Lambda logs
aws logs tail /aws/lambda/experta-onboarding-dev --follow

# View Content Generator logs
aws logs tail /aws/lambda/experta-content-generator-dev --follow
```

### CloudWatch Alarms
Alarms are pre-configured for:
- Lambda errors (> 5 errors in 5 minutes)
- API Gateway 5xx errors
- DynamoDB throttling
- EventBridge failed invocations

## 🔄 Update Existing Deployment

To update an existing deployment:

```bash
# Just run the deploy script again
./scripts/deploy.sh

# Or use SAM directly
sam build --use-container
sam deploy --no-confirm-changeset
```

## 🗑️ Delete Deployment

To remove all resources:

```bash
# Delete the CloudFormation stack
aws cloudformation delete-stack --stack-name experta-dev --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name experta-dev --region us-east-1

# Manually delete S3 bucket (if not empty)
aws s3 rm s3://experta-content-ACCOUNT-dev --recursive
aws s3 rb s3://experta-content-ACCOUNT-dev
```

## 💰 Cost Estimate

**Development environment** (light usage):
- ~$30-65/month
- Mostly Bedrock API costs (Claude + Titan)
- Lambda, DynamoDB, S3 are minimal

**Production environment** (moderate usage):
- ~$100-300/month
- Scales with number of brands and posts

**Cost optimization tips**:
- Use AWS Cost Explorer to monitor
- Set up billing alerts
- Delete unused environments
- Use DynamoDB on-demand pricing (already configured)

## 🆘 Troubleshooting

### "Bedrock model not found"
→ Enable models in Bedrock console for your region

### "Insufficient permissions"
→ Ensure your AWS user has admin or PowerUser access

### "Stack already exists"
→ Run deploy script again, it will update the existing stack

### "Lambda timeout"
→ Content generation takes time (up to 15 minutes for 30 posts)

### "S3 bucket name taken"
→ Bucket names include your AWS Account ID, should be unique

## 📚 Additional Resources

- **Full Checklist**: `PRE_DEPLOYMENT_CHECKLIST.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Monitoring Guide**: `MONITORING.md`
- **Frontend Deployment**: `frontend/AMPLIFY_DEPLOYMENT.md`

## ✅ Deployment Complete!

Once deployed, you can:
1. Test the API endpoints
2. Deploy the frontend (see `frontend/AMPLIFY_DEPLOYMENT.md`)
3. Create your first brand via the onboarding flow
4. Watch content generation happen automatically
5. Monitor everything in CloudWatch

---

**Need help?** Check the full documentation or AWS support resources.
