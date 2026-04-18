# Experta Deployment Guide

## Prerequisites

Before deploying Experta, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **AWS SAM CLI** installed (version 1.100.0 or later)
4. **Node.js 18.x** installed
5. **Python 3.11** installed
6. **Docker** installed (for local testing)

## Initial Setup

### 1. Configure AWS Credentials

```bash
aws configure
```

Provide:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

### 2. Verify SAM Installation

```bash
sam --version
```

Expected output: `SAM CLI, version 1.100.0 or later`

### 3. Install Dependencies

```bash
# Node.js shared libraries
cd lib/nodejs
npm install
cd ../..

# Python shared libraries
cd lib/python
pip install -r requirements.txt
cd ../..
```

## Deployment Steps

### Step 1: Validate Template

```bash
sam validate
```

This checks the SAM template for syntax errors.

### Step 2: Build the Project

```bash
sam build
```

This command:
- Packages Lambda functions
- Resolves dependencies
- Prepares deployment artifacts

### Step 3: Deploy (First Time)

For the first deployment, use guided mode:

```bash
sam deploy --guided
```

You'll be prompted for:

1. **Stack Name**: `experta-ai-social-manager` (recommended)
2. **AWS Region**: `us-east-1` (or your preferred region)
3. **Parameter Environment**: `dev`, `staging`, or `prod`
4. **Confirm changes before deploy**: `Y`
5. **Allow SAM CLI IAM role creation**: `Y`
6. **Disable rollback**: `N` (recommended)
7. **Save arguments to configuration file**: `Y`
8. **SAM configuration file**: `samconfig.toml` (default)
9. **SAM configuration environment**: `default` (default)

### Step 4: Verify Deployment

After deployment completes, verify the stack:

```bash
aws cloudformation describe-stacks \
  --stack-name experta-ai-social-manager \
  --query 'Stacks[0].Outputs' \
  --output table
```

You should see outputs for:
- API Gateway URL
- Cognito User Pool ID
- Cognito User Pool Client ID
- DynamoDB table names
- S3 bucket name
- EventBridge bus name
- KMS key ID

## Subsequent Deployments

After the initial deployment, you can deploy updates with:

```bash
sam build && sam deploy
```

Or for a specific environment:

```bash
sam build && sam deploy --parameter-overrides Environment=staging
```

## Environment-Specific Deployments

### Development
```bash
sam deploy --parameter-overrides Environment=dev
```

### Staging
```bash
sam deploy --parameter-overrides Environment=staging
```

### Production
```bash
sam deploy --parameter-overrides Environment=prod
```

## Post-Deployment Configuration

### 1. Deploy Frontend to AWS Amplify

After the backend is deployed, deploy the React frontend to AWS Amplify:

#### Option A: Deploy via AWS Console (Recommended)

1. **Navigate to AWS Amplify Console**
   - Go to AWS Console → AWS Amplify
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Select your Git provider (GitHub, GitLab, Bitbucket, etc.)
   - Authorize AWS Amplify to access your repository
   - Select the repository and branch (e.g., `main`)

3. **Configure Build Settings**
   - Amplify will auto-detect the `amplify.yml` file
   - Review the build settings:
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - cd frontend
             - npm ci
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: frontend/dist
         files:
           - '**/*'
     ```

4. **Configure Environment Variables**
   
   Add the following environment variables in Amplify Console:
   
   - `VITE_API_URL`: Your API Gateway URL (from SAM outputs)
   - `VITE_USER_POOL_ID`: Your Cognito User Pool ID (from SAM outputs)
   - `VITE_USER_POOL_CLIENT_ID`: Your Cognito User Pool Client ID (from SAM outputs)
   - `VITE_AWS_REGION`: Your AWS region (e.g., `us-east-1`)
   
   To get these values:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name experta-ai-social-manager \
     --query 'Stacks[0].Outputs' \
     --output table
   ```

5. **Review and Deploy**
   - Review all settings
   - Click "Save and deploy"
   - Wait for the build to complete (5-10 minutes)

6. **Access Your Application**
   - Once deployed, Amplify provides a URL: `https://main.xxxxxx.amplifyapp.com`
   - Test the application by signing up and logging in

#### Option B: Deploy via AWS CLI

```bash
# Get the API Gateway URL and Cognito details
API_URL=$(aws cloudformation describe-stacks \
  --stack-name experta-ai-social-manager \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name experta-ai-social-manager \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name experta-ai-social-manager \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text)

# Create Amplify app
aws amplify create-app \
  --name experta-frontend \
  --repository https://github.com/your-org/your-repo \
  --oauth-token YOUR_GITHUB_TOKEN \
  --environment-variables \
    VITE_API_URL=$API_URL \
    VITE_USER_POOL_ID=$USER_POOL_ID \
    VITE_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID \
    VITE_AWS_REGION=us-east-1

# Create branch
aws amplify create-branch \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --enable-auto-build

# Start deployment
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE
```

#### Configure Custom Domain (Optional)

1. **In Amplify Console**:
   - Go to your app → Domain management
   - Click "Add domain"
   - Enter your domain name (e.g., `experta.yourdomain.com`)
   - Follow DNS configuration instructions
   - Wait for SSL certificate provisioning (5-10 minutes)

2. **Update CORS in API Gateway**:
   - Update the SAM template to allow your custom domain
   - Redeploy the backend: `sam build && sam deploy`

#### Configure Continuous Deployment

Amplify automatically deploys on every push to the connected branch:

1. **Enable Auto-Deploy**:
   - In Amplify Console → App settings → Build settings
   - Ensure "Automatically build and deploy all branches" is enabled

2. **Configure Branch Protection**:
   - Set up branch protection rules in your Git provider
   - Require pull request reviews before merging to main
   - Enable status checks (build must pass)

3. **Set Up Preview Deployments**:
   - In Amplify Console → Previews
   - Enable pull request previews
   - Each PR will get a unique preview URL

### 2. Configure Cognito User Pool

After deployment, you may want to customize:
- Email templates
- SMS messages
- MFA settings
- Password policies

Access via AWS Console: Cognito → User Pools → experta-users-{env}

### 2. Configure SNS Notifications

Subscribe to the failure notification topic:

```bash
aws sns subscribe \
  --topic-arn $(aws cloudformation describe-stacks \
    --stack-name experta-ai-social-manager \
    --query 'Stacks[0].Outputs[?OutputKey==`FailureTopicArn`].OutputValue' \
    --output text) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

Confirm the subscription via email.

### 3. Store Social Media API Credentials

Store Instagram and LinkedIn API credentials in AWS Secrets Manager:

```bash
# Instagram credentials
aws secretsmanager create-secret \
  --name experta/instagram/app-credentials \
  --secret-string '{"app_id":"YOUR_APP_ID","app_secret":"YOUR_APP_SECRET"}'

# LinkedIn credentials (if needed)
aws secretsmanager create-secret \
  --name experta/linkedin/app-credentials \
  --secret-string '{"client_id":"YOUR_CLIENT_ID","client_secret":"YOUR_CLIENT_SECRET"}'
```

### 4. Enable Bedrock Model Access

Ensure your AWS account has access to:
- Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20241022-v2:0)
- Titan Image Generator (amazon.titan-image-generator-v1)

Request access via AWS Console: Bedrock → Model access

## Local Testing

### Start API Gateway Locally

```bash
sam local start-api
```

API will be available at: http://localhost:3000

### Invoke Function Locally

```bash
sam local invoke OnboardingHandler --event events/test-event.json
```

### Test with Docker

```bash
sam build --use-container
```

## Monitoring

### View CloudWatch Logs

```bash
# Tail logs for a specific function
sam logs -n OnboardingHandler --stack-name experta-ai-social-manager --tail

# View logs for a specific time range
sam logs -n OnboardingHandler --stack-name experta-ai-social-manager \
  --start-time '10min ago' --end-time 'now'
```

### View Metrics

Access CloudWatch Metrics via AWS Console:
- Lambda function invocations
- API Gateway requests
- DynamoDB read/write capacity
- S3 storage metrics

### Set Up Alarms

Create CloudWatch alarms for:
- Lambda function errors
- API Gateway 5xx errors
- DynamoDB throttling
- S3 bucket size

## Rollback

If deployment fails or causes issues:

```bash
aws cloudformation rollback-stack --stack-name experta-ai-social-manager
```

Or delete and redeploy:

```bash
sam delete
sam deploy --guided
```

## Troubleshooting

### Issue: SAM build fails

**Solution**: Ensure Docker is running and you have internet connectivity.

```bash
docker ps
sam build --use-container
```

### Issue: Deployment fails due to IAM permissions

**Solution**: Ensure your AWS user/role has permissions for:
- CloudFormation
- Lambda
- DynamoDB
- S3
- API Gateway
- Cognito
- EventBridge
- KMS
- IAM (for role creation)

### Issue: Bedrock model not accessible

**Solution**: Request model access in AWS Console:
1. Go to Bedrock service
2. Click "Model access"
3. Request access to Claude 3.5 Sonnet and Titan Image Generator
4. Wait for approval (usually instant for most models)

### Issue: Stack already exists

**Solution**: Update the existing stack:

```bash
sam deploy
```

Or delete and recreate:

```bash
sam delete
sam deploy --guided
```

## Cleanup

To remove all resources:

```bash
sam delete
```

**Warning**: This will delete:
- All Lambda functions
- DynamoDB tables (and all data)
- S3 bucket (and all images)
- Cognito User Pool (and all users)
- EventBridge rules
- KMS keys
- API Gateway

Ensure you have backups before deleting!

## Cost Estimation

Estimated monthly costs for development environment:
- Lambda: $5-20 (depending on usage)
- DynamoDB: $5-15 (on-demand pricing)
- S3: $1-5 (depending on storage)
- API Gateway: $3-10 (per million requests)
- Cognito: Free tier (up to 50,000 MAUs)
- Bedrock: Pay per use (varies by model)
- EventBridge: $1-5
- KMS: $1/month per key

**Total estimated**: $15-60/month for development

Production costs will scale with usage.

## Security Best Practices

1. **Enable MFA** for AWS root account
2. **Use IAM roles** instead of access keys where possible
3. **Enable CloudTrail** for audit logging
4. **Rotate credentials** regularly
5. **Use Secrets Manager** for sensitive data
6. **Enable S3 bucket versioning** for data protection
7. **Configure VPC** for Lambda functions (optional, for enhanced security)
8. **Enable DynamoDB point-in-time recovery** (already configured)
9. **Review IAM policies** regularly
10. **Monitor CloudWatch logs** for suspicious activity

## Support

For deployment issues:
1. Check CloudFormation events in AWS Console
2. Review CloudWatch logs
3. Verify IAM permissions
4. Consult AWS SAM documentation: https://docs.aws.amazon.com/serverless-application-model/

For application issues:
1. Review design document: `.kiro/specs/experta-ai-social-manager/design.md`
2. Review requirements: `.kiro/specs/experta-ai-social-manager/requirements.md`
3. Check implementation tasks: `.kiro/specs/experta-ai-social-manager/tasks.md`
