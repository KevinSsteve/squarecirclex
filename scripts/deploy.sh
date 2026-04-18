#!/bin/bash

# Experta AI Social Media Manager - Deployment Script
# This script deploys the backend infrastructure to AWS using SAM

set -e  # Exit on error

echo "=========================================="
echo "Experta Backend Deployment Script"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}ERROR: AWS CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo -e "${RED}ERROR: AWS SAM CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}ERROR: AWS credentials are not configured or invalid.${NC}"
    echo "Please run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS credentials valid (Account: ${ACCOUNT_ID})${NC}"
echo ""

# Prompt for region selection
echo "Select AWS Region:"
echo "1) us-east-1 (US East - N. Virginia) - Recommended for Bedrock"
echo "2) eu-central-1 (Europe - Frankfurt)"
echo "3) Custom region"
read -p "Enter choice [1-3]: " region_choice

case $region_choice in
    1)
        AWS_REGION="us-east-1"
        ;;
    2)
        AWS_REGION="eu-central-1"
        ;;
    3)
        read -p "Enter custom AWS region: " AWS_REGION
        ;;
    *)
        echo -e "${RED}Invalid choice. Defaulting to us-east-1${NC}"
        AWS_REGION="us-east-1"
        ;;
esac

echo -e "${GREEN}Selected region: ${AWS_REGION}${NC}"
echo ""

# Prompt for environment
echo "Select deployment environment:"
echo "1) dev (Development)"
echo "2) staging (Staging)"
echo "3) prod (Production)"
read -p "Enter choice [1-3]: " env_choice

case $env_choice in
    1)
        ENVIRONMENT="dev"
        ;;
    2)
        ENVIRONMENT="staging"
        ;;
    3)
        ENVIRONMENT="prod"
        ;;
    *)
        echo -e "${RED}Invalid choice. Defaulting to dev${NC}"
        ENVIRONMENT="dev"
        ;;
esac

echo -e "${GREEN}Selected environment: ${ENVIRONMENT}${NC}"
echo ""

# Check Bedrock model access
echo "Checking Amazon Bedrock model access..."
echo -e "${YELLOW}NOTE: Ensure you have enabled model access in Amazon Bedrock console${NC}"
echo "Required models:"
echo "  - Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20241022-v2:0)"
echo "  - Titan Image Generator (amazon.titan-image-generator-v1)"
echo ""
read -p "Have you enabled these models in Bedrock? (y/n): " bedrock_confirm

if [[ ! $bedrock_confirm =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please enable Bedrock models before continuing:${NC}"
    echo "1. Go to AWS Console > Amazon Bedrock > Model access"
    echo "2. Request access to Claude 3.5 Sonnet and Titan Image Generator"
    echo "3. Wait for approval (usually instant)"
    echo ""
    read -p "Press Enter when ready to continue..."
fi

# Check for required secrets
echo ""
echo "=========================================="
echo "Pre-Deployment Checklist"
echo "=========================================="
echo ""
echo -e "${YELLOW}Before deploying, ensure you have configured the following in AWS Secrets Manager:${NC}"
echo ""
echo "Optional (for Instagram trend scraping):"
echo "  - experta/instagram/app-id"
echo "  - experta/instagram/app-secret"
echo ""
echo "Note: Instagram credentials are optional. The system will use mock data if not provided."
echo ""
read -p "Press Enter to continue with deployment..."

# Build the SAM application
echo ""
echo "=========================================="
echo "Building SAM Application"
echo "=========================================="
echo ""

sam build --use-container

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: SAM build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Deploy the SAM application
echo "=========================================="
echo "Deploying to AWS"
echo "=========================================="
echo ""
echo "Stack name will be: experta-${ENVIRONMENT}"
echo "Region: ${AWS_REGION}"
echo ""

# Check if this is first deployment
STACK_NAME="experta-${ENVIRONMENT}"
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION &> /dev/null; then
    echo -e "${YELLOW}Stack already exists. This will update the existing stack.${NC}"
    read -p "Continue with update? (y/n): " update_confirm
    if [[ ! $update_confirm =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    # Update existing stack
    sam deploy \
        --stack-name $STACK_NAME \
        --region $AWS_REGION \
        --parameter-overrides Environment=$ENVIRONMENT \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --no-fail-on-empty-changeset \
        --no-confirm-changeset
else
    # First deployment - use guided mode
    echo -e "${GREEN}First deployment detected. Using guided mode...${NC}"
    sam deploy \
        --guided \
        --stack-name $STACK_NAME \
        --region $AWS_REGION \
        --parameter-overrides Environment=$ENVIRONMENT \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Deployment failed${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "Deployment Successful!"
echo "=========================================="
echo ""

# Get stack outputs
echo "Retrieving stack outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text)

DASHBOARD_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' \
    --output text)

echo ""
echo -e "${GREEN}Stack Outputs:${NC}"
echo "----------------------------------------"
echo "API URL: $API_URL"
echo "User Pool ID: $USER_POOL_ID"
echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "CloudWatch Dashboard: $DASHBOARD_URL"
echo "----------------------------------------"
echo ""

# Save outputs to file
OUTPUT_FILE="deployment-outputs-${ENVIRONMENT}.txt"
cat > $OUTPUT_FILE << EOF
Experta Deployment Outputs
Environment: ${ENVIRONMENT}
Region: ${AWS_REGION}
Deployed: $(date)

API Gateway:
  API URL: ${API_URL}

Cognito:
  User Pool ID: ${USER_POOL_ID}
  User Pool Client ID: ${USER_POOL_CLIENT_ID}

Monitoring:
  CloudWatch Dashboard: ${DASHBOARD_URL}

Frontend Configuration:
  Add these to your frontend .env file:
  VITE_API_URL=${API_URL}
  VITE_AWS_REGION=${AWS_REGION}
  VITE_USER_POOL_ID=${USER_POOL_ID}
  VITE_USER_POOL_CLIENT_ID=${USER_POOL_CLIENT_ID}
EOF

echo -e "${GREEN}✓ Deployment outputs saved to: ${OUTPUT_FILE}${NC}"
echo ""

# Post-deployment instructions
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Configure SNS Email Subscription:"
echo "   - Go to AWS Console > SNS > Topics"
echo "   - Find: experta-failures-${ENVIRONMENT}"
echo "   - Create subscription with your email"
echo "   - Confirm the subscription email"
echo ""
echo "2. Update Frontend Configuration:"
echo "   - Copy values from ${OUTPUT_FILE}"
echo "   - Update frontend/.env file"
echo ""
echo "3. Test the API:"
echo "   - API Endpoint: ${API_URL}"
echo "   - Use Postman or curl to test endpoints"
echo ""
echo "4. Monitor the System:"
echo "   - CloudWatch Dashboard: ${DASHBOARD_URL}"
echo "   - Check Lambda logs in CloudWatch"
echo ""
echo "5. Optional - Configure Instagram Credentials:"
echo "   - Create secrets in AWS Secrets Manager"
echo "   - Secret names: experta/instagram/app-id and experta/instagram/app-secret"
echo ""
echo -e "${GREEN}Deployment complete! 🚀${NC}"
echo ""
