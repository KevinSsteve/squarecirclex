# AWS Amplify Deployment Guide

This guide covers deploying the Experta frontend to AWS Amplify.

## Prerequisites

1. Backend deployed via AWS SAM (see main DEPLOYMENT.md)
2. AWS account with Amplify access
3. Git repository (GitHub, GitLab, or Bitbucket)

## Quick Start

### 1. Get Backend Configuration Values

After deploying the backend, retrieve the required configuration:

```bash
aws cloudformation describe-stacks \
  --stack-name experta-ai-social-manager \
  --query 'Stacks[0].Outputs' \
  --output table
```

Note the following values:
- `ApiUrl` - Your API Gateway endpoint
- `UserPoolId` - Cognito User Pool ID
- `UserPoolClientId` - Cognito User Pool Client ID

### 2. Deploy via AWS Console

1. **Navigate to AWS Amplify**
   - Go to AWS Console → AWS Amplify
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Select your Git provider
   - Authorize AWS Amplify
   - Select repository and branch

3. **Configure Build Settings**
   - Amplify auto-detects `amplify.yml`
   - Verify build configuration is correct

4. **Set Environment Variables**
   
   Add these in Amplify Console → Environment variables:
   
   ```
   VITE_API_URL=<Your API Gateway URL>
   VITE_USER_POOL_ID=<Your User Pool ID>
   VITE_USER_POOL_CLIENT_ID=<Your User Pool Client ID>
   VITE_AWS_REGION=<Your AWS Region>
   ```

5. **Deploy**
   - Click "Save and deploy"
   - Wait for build to complete (5-10 minutes)

6. **Access Application**
   - Use the provided Amplify URL: `https://main.xxxxxx.amplifyapp.com`

## Environment Variables

Required environment variables for the frontend:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API Gateway endpoint | `https://abc123.execute-api.us-east-1.amazonaws.com/dev` |
| `VITE_USER_POOL_ID` | Cognito User Pool ID | `us-east-1_ABC123XYZ` |
| `VITE_USER_POOL_CLIENT_ID` | Cognito User Pool Client ID | `1a2b3c4d5e6f7g8h9i0j` |
| `VITE_AWS_REGION` | AWS Region | `us-east-1` |

## Build Configuration

The `amplify.yml` file defines the build process:

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
  cache:
    paths:
      - frontend/node_modules/**/*
```

## Custom Domain Setup

### 1. Add Domain in Amplify Console

1. Go to your app → Domain management
2. Click "Add domain"
3. Enter your domain (e.g., `experta.yourdomain.com`)
4. Follow DNS configuration instructions

### 2. Update DNS Records

Add the CNAME records provided by Amplify to your DNS provider:

```
Type: CNAME
Name: experta
Value: <provided by Amplify>
```

### 3. Wait for SSL Certificate

- Amplify automatically provisions an SSL certificate
- This takes 5-10 minutes
- Your app will be accessible via HTTPS

### 4. Update CORS Configuration

Update the backend API Gateway to allow your custom domain:

1. Edit `template.yaml`
2. Update CORS AllowOrigin to include your domain
3. Redeploy: `sam build && sam deploy`

## Continuous Deployment

Amplify automatically deploys on every push to the connected branch.

### Enable Auto-Deploy

1. In Amplify Console → App settings → Build settings
2. Ensure "Automatically build and deploy all branches" is enabled

### Pull Request Previews

1. In Amplify Console → Previews
2. Enable pull request previews
3. Each PR gets a unique preview URL

### Branch-Based Deployments

Deploy different branches to different environments:

- `main` → Production
- `staging` → Staging environment
- `develop` → Development environment

Configure different environment variables per branch.

## Monitoring

### Build Logs

View build logs in Amplify Console:
1. Go to your app
2. Click on a deployment
3. View build logs for debugging

### Access Logs

Enable access logs:
1. Amplify Console → Monitoring
2. Enable access logs
3. Logs are stored in CloudWatch

### Performance Monitoring

Amplify provides built-in monitoring:
- Page load times
- Error rates
- Traffic patterns

Access via Amplify Console → Monitoring

## Troubleshooting

### Build Fails

**Issue**: Build fails with dependency errors

**Solution**:
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working

**Issue**: App can't connect to backend

**Solution**:
1. Verify environment variables are set in Amplify Console
2. Ensure variable names match exactly (case-sensitive)
3. Redeploy the app after updating variables

### CORS Errors

**Issue**: Browser shows CORS errors

**Solution**:
1. Verify API Gateway CORS configuration in `template.yaml`
2. Ensure AllowOrigin includes your Amplify domain
3. Redeploy backend: `sam build && sam deploy`

### 404 Errors on Refresh

**Issue**: Page refresh returns 404

**Solution**:
1. In Amplify Console → Rewrites and redirects
2. Add rule:
   ```
   Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf)$)([^.]+$)/>
   Target: /index.html
   Type: 200 (Rewrite)
   ```

## Security Best Practices

1. **HTTPS Only**: Amplify enforces HTTPS by default
2. **Security Headers**: Configured in `amplify.yml`
3. **Environment Variables**: Never commit `.env` files
4. **Access Control**: Use Cognito for authentication
5. **API Security**: API Gateway validates JWT tokens

## Cost Estimation

AWS Amplify pricing:
- **Build minutes**: $0.01 per build minute
- **Hosting**: $0.15 per GB served
- **Storage**: $0.023 per GB stored

Estimated monthly cost:
- Development: $5-15
- Production: $20-50 (depending on traffic)

## Rollback

To rollback to a previous deployment:

1. In Amplify Console → Deployments
2. Find the previous successful deployment
3. Click "Redeploy this version"

## Cleanup

To delete the Amplify app:

```bash
aws amplify delete-app --app-id <your-app-id>
```

Or via Console:
1. Amplify Console → Your app
2. Actions → Delete app

## Support

For Amplify-specific issues:
- AWS Amplify Documentation: https://docs.aws.amazon.com/amplify/
- AWS Support: https://console.aws.amazon.com/support/

For application issues:
- See main DEPLOYMENT.md
- Review design document: `.kiro/specs/experta-ai-social-manager/design.md`
