# Deployment Complete - ONZO Platform

**Deployment Date:** April 16, 2026  
**Environment:** Development  
**Stack Name:** onzo  
**Region:** us-east-1  
**AWS Account:** 116708768297

---

## ✅ Deployment Status

### Backend (AWS SAM)
- **Status:** ✅ Deployed Successfully
- **Stack:** onzo
- **No changes detected** - Stack is up to date

### Frontend (S3 + CloudFront)
- **Status:** ✅ Deployed Successfully
- **Bucket:** experta-frontend-dev
- **Website URL:** http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com
- **SPA Routing:** ✅ Configured (404 → index.html)

---

## 🌐 Application URLs

### Frontend
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com
```

### API Gateway
```
https://h5r67v3nx1.execute-api.us-east-1.amazonaws.com/dev
```

### CloudWatch Dashboard
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Experta-dev
```

---

## 🔐 Authentication (Cognito)

```bash
User Pool ID: us-east-1_524y1vNhy
Client ID: 5c2tadmevtlduhsu3anbrgf8bu
Region: us-east-1
```

**Frontend Configuration (.env):**
```env
VITE_API_URL=https://h5r67v3nx1.execute-api.us-east-1.amazonaws.com/dev
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=us-east-1_524y1vNhy
VITE_USER_POOL_CLIENT_ID=5c2tadmevtlduhsu3anbrgf8bu
VITE_ENVIRONMENT=dev
```

---

## 📊 AWS Resources

### Lambda Functions
| Function | Name | ARN |
|----------|------|-----|
| Onboarding | onzo-onboarding-dev | arn:aws:lambda:us-east-1:116708768297:function:onzo-onboarding-dev |
| Content Generator | onzo-content-generator-dev | arn:aws:lambda:us-east-1:116708768297:function:onzo-content-generator-dev |
| Auto Publisher | onzo-auto-publisher-dev | arn:aws:lambda:us-east-1:116708768297:function:onzo-auto-publisher-dev |
| Chat Handler | onzo-chat-handler-dev | arn:aws:lambda:us-east-1:116708768297:function:onzo-chat-handler-dev |
| Trend Scraper | onzo-trend-scraper-dev | arn:aws:lambda:us-east-1:116708768297:function:onzo-trend-scraper-dev |
| Posts API | onzo-posts-api-dev | arn:aws:lambda:us-east-1:116708768297:function:onzo-posts-api-dev |
| OAuth Handler | onzo-oauth-handler-dev | arn:aws:lambda:us-east-1:116708768297:function:onzo-oauth-handler-dev |

### DynamoDB Tables
- **Brands:** onzo-Brands-dev
- **Posts:** onzo-Posts-dev
- **Automation Logs:** onzo-AutomationLogs-dev
- **Trends:** onzo-Trends-dev
- **Onboarding Sessions:** onzo-OnboardingSessions-dev
- **Platform Credentials:** onzo-PlatformCredentials-dev
- **OAuth Connections:** onzo-OAuthConnections-dev

### S3 Buckets
- **Content Storage:** onzo-content-116708768297-dev
- **Frontend Hosting:** experta-frontend-dev

### EventBridge
- **Event Bus:** onzo-events-dev

### SNS
- **Failure Notifications:** arn:aws:sns:us-east-1:116708768297:onzo-failures-dev

### Security
- **KMS Encryption Key:** ef12f1ef-7580-4c95-a9c9-e61627bb04f5
- **Lambda Execution Role:** arn:aws:iam::116708768297:role/onzo-lambda-execution-dev

---

## 🔌 API Endpoints

**Base URL:** `https://h5r67v3nx1.execute-api.us-east-1.amazonaws.com/dev`

### Authentication Required
```
POST   /brands                      - Create new brand (onboarding)
GET    /brands                      - List brands
GET    /posts                       - List posts with filters
GET    /posts/{post_id}             - Get post details
PUT    /posts/{post_id}             - Update post
DELETE /posts/{post_id}             - Delete post
POST   /posts/{post_id}/regenerate  - Regenerate post content
POST   /chat                        - Send chat message
GET    /chat/history                - Get chat history
POST   /oauth/connect               - Connect OAuth account
GET    /oauth/connections           - List OAuth connections
DELETE /oauth/connections/{id}      - Disconnect OAuth account
GET    /admin/settings              - Get admin settings
PUT    /admin/settings              - Update admin settings
DELETE /account                     - Delete user account
```

---

## 🧪 Testing Commands

### Test API Health
```bash
# Should return 401 (authentication required) - this is correct!
curl https://h5r67v3nx1.execute-api.us-east-1.amazonaws.com/dev/posts
```

### View Lambda Logs
```bash
# Onboarding function
aws logs tail /aws/lambda/onzo-onboarding-dev --follow --region us-east-1

# Chat handler
aws logs tail /aws/lambda/onzo-chat-handler-dev --follow --region us-east-1

# Content generator
aws logs tail /aws/lambda/onzo-content-generator-dev --follow --region us-east-1
```

### Check DynamoDB Tables
```bash
# List brands
aws dynamodb scan --table-name onzo-Brands-dev --region us-east-1

# List posts
aws dynamodb scan --table-name onzo-Posts-dev --region us-east-1
```

### S3 Content
```bash
# List content bucket
aws s3 ls s3://onzo-content-116708768297-dev/ --region us-east-1

# List frontend bucket
aws s3 ls s3://experta-frontend-dev/ --region us-east-1
```

---

## 📈 Monitoring

### CloudWatch Dashboard
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Experta-dev
```

### Key Metrics to Monitor
- Lambda invocations and errors
- API Gateway 4xx/5xx errors
- DynamoDB read/write capacity
- S3 bucket size and requests
- Bedrock API calls and costs

### Set Up SNS Email Notifications
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:116708768297:onzo-failures-dev \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1
```

---

## 💰 Cost Monitoring

**Expected Monthly Cost (Dev Environment):** $30-65

### Cost Breakdown
- Lambda: ~$10-20 (based on usage)
- DynamoDB: ~$5-10 (on-demand pricing)
- S3: ~$1-5 (storage + requests)
- API Gateway: ~$3-10 (per million requests)
- Bedrock: ~$10-20 (Claude + Titan usage)
- CloudWatch: ~$1-5 (logs + metrics)

**Monitor costs:**
```
https://console.aws.amazon.com/cost-management/home?region=us-east-1#/dashboard
```

---

## 🚀 Next Steps

### 1. Configure Email Notifications
Subscribe to the SNS failure topic to receive alerts when Lambda functions fail.

### 2. Enable Bedrock Models
Ensure you have access to:
- Claude 3.5 Sonnet (us.anthropic.claude-3-5-sonnet-20240620-v1:0)
- Titan Image Generator v2 (amazon.titan-image-generator-v2:0)

### 3. Test the Application
1. Visit the frontend URL
2. Sign up for a new account
3. Complete the onboarding flow
4. Test chat functionality
5. Create and manage posts

### 4. Set Up CI/CD (Optional)
Consider setting up automated deployments using:
- GitHub Actions
- AWS CodePipeline
- GitLab CI/CD

---

## 🔧 Maintenance Commands

### Rebuild and Redeploy Backend
```bash
sam build
sam deploy --no-confirm-changeset
```

### Rebuild and Redeploy Frontend
```bash
cd frontend
npm run build
aws s3 sync dist s3://experta-frontend-dev --delete
aws s3 website s3://experta-frontend-dev --index-document index.html --error-document index.html
```

### View Stack Status
```bash
aws cloudformation describe-stacks --stack-name onzo --region us-east-1
```

### Delete Stack (Cleanup)
```bash
sam delete --stack-name onzo --region us-east-1
```

---

## 📝 Notes

- Frontend is configured for SPA routing (all 404s redirect to index.html)
- CORS is properly configured for the frontend domain
- All Lambda functions use Node.js 20.x runtime
- DynamoDB tables use on-demand billing mode
- KMS encryption is enabled for sensitive data
- CloudWatch logs retention is set to 7 days

---

## ✅ Deployment Checklist

- [x] Backend stack deployed successfully
- [x] Frontend built and deployed to S3
- [x] S3 website hosting configured
- [x] SPA routing enabled
- [x] Environment variables configured
- [x] Cognito authentication set up
- [x] API Gateway endpoints accessible
- [x] Lambda functions deployed
- [x] DynamoDB tables created
- [x] S3 buckets created
- [x] CloudWatch dashboard created
- [x] SNS failure topic created
- [ ] Email notifications configured (manual step)
- [ ] Bedrock model access verified (manual step)
- [ ] Application tested end-to-end (manual step)

---

**Deployment completed successfully! 🎉**

The ONZO platform is now live and ready for testing.
