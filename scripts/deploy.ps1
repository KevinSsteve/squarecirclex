# Experta AI Social Media Manager - Deployment Script (PowerShell)
# This script deploys the backend infrastructure to AWS using SAM

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Experta Backend Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
try {
    $null = aws --version
    Write-Host "✓ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "ERROR: AWS CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
}

# Check if SAM CLI is installed
try {
    $null = sam --version
    Write-Host "✓ SAM CLI found" -ForegroundColor Green
} catch {
    Write-Host "ERROR: AWS SAM CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
}

# Check AWS credentials
Write-Host ""
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
try {
    $accountId = aws sts get-caller-identity --query Account --output text
    Write-Host "✓ AWS credentials valid (Account: $accountId)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: AWS credentials are not configured or invalid." -ForegroundColor Red
    Write-Host "Please run: aws configure"
    exit 1
}

Write-Host ""

# Prompt for region selection
Write-Host "Select AWS Region:" -ForegroundColor Cyan
Write-Host "1) us-east-1 (US East - N. Virginia) - Recommended for Bedrock"
Write-Host "2) eu-central-1 (Europe - Frankfurt)"
Write-Host "3) Custom region"
$regionChoice = Read-Host "Enter choice [1-3]"

switch ($regionChoice) {
    "1" { $awsRegion = "us-east-1" }
    "2" { $awsRegion = "eu-central-1" }
    "3" { $awsRegion = Read-Host "Enter custom AWS region" }
    default {
        Write-Host "Invalid choice. Defaulting to us-east-1" -ForegroundColor Yellow
        $awsRegion = "us-east-1"
    }
}

Write-Host "Selected region: $awsRegion" -ForegroundColor Green
Write-Host ""

# Prompt for environment
Write-Host "Select deployment environment:" -ForegroundColor Cyan
Write-Host "1) dev (Development)"
Write-Host "2) staging (Staging)"
Write-Host "3) prod (Production)"
$envChoice = Read-Host "Enter choice [1-3]"

switch ($envChoice) {
    "1" { $environment = "dev" }
    "2" { $environment = "staging" }
    "3" { $environment = "prod" }
    default {
        Write-Host "Invalid choice. Defaulting to dev" -ForegroundColor Yellow
        $environment = "dev"
    }
}

Write-Host "Selected environment: $environment" -ForegroundColor Green
Write-Host ""

# Check Bedrock model access
Write-Host "Checking Amazon Bedrock model access..." -ForegroundColor Yellow
Write-Host "NOTE: Ensure you have enabled model access in Amazon Bedrock console" -ForegroundColor Yellow
Write-Host "Required models:"
Write-Host "  - Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20241022-v2:0)"
Write-Host "  - Titan Image Generator (amazon.titan-image-generator-v1)"
Write-Host ""
$bedrockConfirm = Read-Host "Have you enabled these models in Bedrock? (y/n)"

if ($bedrockConfirm -notmatch "^[Yy]$") {
    Write-Host "Please enable Bedrock models before continuing:" -ForegroundColor Yellow
    Write-Host "1. Go to AWS Console > Amazon Bedrock > Model access"
    Write-Host "2. Request access to Claude 3.5 Sonnet and Titan Image Generator"
    Write-Host "3. Wait for approval (usually instant)"
    Write-Host ""
    Read-Host "Press Enter when ready to continue"
}

# Pre-deployment checklist
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Pre-Deployment Checklist" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Before deploying, ensure you have configured the following in AWS Secrets Manager:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Optional (for Instagram trend scraping):"
Write-Host "  - experta/instagram/app-id"
Write-Host "  - experta/instagram/app-secret"
Write-Host ""
Write-Host "Note: Instagram credentials are optional. The system will use mock data if not provided."
Write-Host ""
Read-Host "Press Enter to continue with deployment"

# Build the SAM application
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Building SAM Application" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

sam build --use-container

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: SAM build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build successful" -ForegroundColor Green
Write-Host ""

# Deploy the SAM application
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deploying to AWS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stack name will be: experta-$environment"
Write-Host "Region: $awsRegion"
Write-Host ""

# Check if this is first deployment
$stackName = "experta-$environment"
try {
    $null = aws cloudformation describe-stacks --stack-name $stackName --region $awsRegion 2>$null
    Write-Host "Stack already exists. This will update the existing stack." -ForegroundColor Yellow
    $updateConfirm = Read-Host "Continue with update? (y/n)"
    if ($updateConfirm -notmatch "^[Yy]$") {
        Write-Host "Deployment cancelled."
        exit 0
    }
    
    # Update existing stack
    sam deploy `
        --stack-name $stackName `
        --region $awsRegion `
        --parameter-overrides Environment=$environment `
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
        --no-fail-on-empty-changeset `
        --no-confirm-changeset
} catch {
    # First deployment - use guided mode
    Write-Host "First deployment detected. Using guided mode..." -ForegroundColor Green
    sam deploy `
        --guided `
        --stack-name $stackName `
        --region $awsRegion `
        --parameter-overrides Environment=$environment `
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deployment Successful!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get stack outputs
Write-Host "Retrieving stack outputs..." -ForegroundColor Yellow
$apiUrl = aws cloudformation describe-stacks `
    --stack-name $stackName `
    --region $awsRegion `
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' `
    --output text

$userPoolId = aws cloudformation describe-stacks `
    --stack-name $stackName `
    --region $awsRegion `
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' `
    --output text

$userPoolClientId = aws cloudformation describe-stacks `
    --stack-name $stackName `
    --region $awsRegion `
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' `
    --output text

$dashboardUrl = aws cloudformation describe-stacks `
    --stack-name $stackName `
    --region $awsRegion `
    --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' `
    --output text

Write-Host ""
Write-Host "Stack Outputs:" -ForegroundColor Green
Write-Host "----------------------------------------"
Write-Host "API URL: $apiUrl"
Write-Host "User Pool ID: $userPoolId"
Write-Host "User Pool Client ID: $userPoolClientId"
Write-Host "CloudWatch Dashboard: $dashboardUrl"
Write-Host "----------------------------------------"
Write-Host ""

# Save outputs to file
$outputFile = "deployment-outputs-$environment.txt"
$outputContent = @"
Experta Deployment Outputs
Environment: $environment
Region: $awsRegion
Deployed: $(Get-Date)

API Gateway:
  API URL: $apiUrl

Cognito:
  User Pool ID: $userPoolId
  User Pool Client ID: $userPoolClientId

Monitoring:
  CloudWatch Dashboard: $dashboardUrl

Frontend Configuration:
  Add these to your frontend .env file:
  VITE_API_URL=$apiUrl
  VITE_AWS_REGION=$awsRegion
  VITE_USER_POOL_ID=$userPoolId
  VITE_USER_POOL_CLIENT_ID=$userPoolClientId
"@

$outputContent | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "✓ Deployment outputs saved to: $outputFile" -ForegroundColor Green
Write-Host ""

# Post-deployment instructions
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure SNS Email Subscription:"
Write-Host "   - Go to AWS Console > SNS > Topics"
Write-Host "   - Find: experta-failures-$environment"
Write-Host "   - Create subscription with your email"
Write-Host "   - Confirm the subscription email"
Write-Host ""
Write-Host "2. Update Frontend Configuration:"
Write-Host "   - Copy values from $outputFile"
Write-Host "   - Update frontend/.env file"
Write-Host ""
Write-Host "3. Test the API:"
Write-Host "   - API Endpoint: $apiUrl"
Write-Host "   - Use Postman or curl to test endpoints"
Write-Host ""
Write-Host "4. Monitor the System:"
Write-Host "   - CloudWatch Dashboard: $dashboardUrl"
Write-Host "   - Check Lambda logs in CloudWatch"
Write-Host ""
Write-Host "5. Optional - Configure Instagram Credentials:"
Write-Host "   - Create secrets in AWS Secrets Manager"
Write-Host "   - Secret names: experta/instagram/app-id and experta/instagram/app-secret"
Write-Host ""
Write-Host "Deployment complete! 🚀" -ForegroundColor Green
Write-Host ""
