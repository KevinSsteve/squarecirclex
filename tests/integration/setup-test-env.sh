#!/bin/bash

# Setup script for Experta Integration Tests
# This script helps configure the test environment by extracting resource names from AWS SAM

set -e

echo "Setting up integration test environment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "Warning: SAM CLI is not installed. You'll need to manually configure resource names."
fi

# Get AWS region
AWS_REGION=${AWS_REGION:-us-east-1}
echo "Using AWS region: $AWS_REGION"

# Get stack name from samconfig.toml or use default
STACK_NAME=${STACK_NAME:-experta-stack}
echo "Using stack name: $STACK_NAME"

# Create .env file
ENV_FILE=".env"
echo "Creating $ENV_FILE..."

cat > $ENV_FILE << EOF
# AWS Configuration
AWS_REGION=$AWS_REGION

# DynamoDB Tables
BRANDS_TABLE_NAME=Experta-Brands
POSTS_TABLE_NAME=Experta-Posts
AUTOMATION_LOGS_TABLE_NAME=Experta-Automation-Logs
TRENDS_TABLE_NAME=Experta-Trends

# S3 Bucket
S3_BUCKET_NAME=experta-content-bucket

# Lambda Functions
ONBOARDING_FUNCTION_NAME=experta-onboarding
CONTENT_GEN_FUNCTION_NAME=experta-content-generator
CHAT_FUNCTION_NAME=experta-chat-handler
POSTS_API_FUNCTION_NAME=experta-posts-api
PUBLISHER_FUNCTION_NAME=experta-auto-publisher
TREND_SCRAPER_FUNCTION_NAME=experta-trend-scraper

# EventBridge
EVENTBRIDGE_BUS_NAME=experta-event-bus
EOF

echo "✓ Created $ENV_FILE"

# Try to get actual resource names from CloudFormation stack
echo ""
echo "Attempting to retrieve actual resource names from CloudFormation stack..."

if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION &> /dev/null; then
    echo "✓ Found stack: $STACK_NAME"
    
    # Get stack outputs
    OUTPUTS=$(aws cloudformation describe-stack-resources --stack-name $STACK_NAME --region $AWS_REGION --output json)
    
    # Extract Lambda function names
    ONBOARDING_FN=$(echo $OUTPUTS | jq -r '.StackResources[] | select(.LogicalResourceId=="OnboardingFunction") | .PhysicalResourceId' 2>/dev/null || echo "")
    CONTENT_GEN_FN=$(echo $OUTPUTS | jq -r '.StackResources[] | select(.LogicalResourceId=="ContentGeneratorFunction") | .PhysicalResourceId' 2>/dev/null || echo "")
    CHAT_FN=$(echo $OUTPUTS | jq -r '.StackResources[] | select(.LogicalResourceId=="ChatHandlerFunction") | .PhysicalResourceId' 2>/dev/null || echo "")
    POSTS_API_FN=$(echo $OUTPUTS | jq -r '.StackResources[] | select(.LogicalResourceId=="PostsApiFunction") | .PhysicalResourceId' 2>/dev/null || echo "")
    PUBLISHER_FN=$(echo $OUTPUTS | jq -r '.StackResources[] | select(.LogicalResourceId=="AutoPublisherFunction") | .PhysicalResourceId' 2>/dev/null || echo "")
    
    # Extract DynamoDB table names
    BRANDS_TABLE=$(echo $OUTPUTS | jq -r '.StackResources[] | select(.LogicalResourceId=="BrandsTable") | .PhysicalResourceId' 2>/dev/null || echo "")
    POSTS_TABLE=$(echo $OUTPUTS | jq -r '.StackResources[] | select(.LogicalResourceId=="PostsTable") | .PhysicalResourceId' 2>/dev/null || echo "")
    
    # Extract S3 bucket name
    S3_BUCKET=$(echo $OUTPUTS | jq -r '.StackResources[] | select(.LogicalResourceId=="ContentBucket") | .PhysicalResourceId' 2>/dev/null || echo "")
    
    # Update .env file with actual names if found
    if [ ! -z "$ONBOARDING_FN" ]; then
        sed -i.bak "s/ONBOARDING_FUNCTION_NAME=.*/ONBOARDING_FUNCTION_NAME=$ONBOARDING_FN/" $ENV_FILE
        echo "  ✓ Updated ONBOARDING_FUNCTION_NAME"
    fi
    
    if [ ! -z "$CONTENT_GEN_FN" ]; then
        sed -i.bak "s/CONTENT_GEN_FUNCTION_NAME=.*/CONTENT_GEN_FUNCTION_NAME=$CONTENT_GEN_FN/" $ENV_FILE
        echo "  ✓ Updated CONTENT_GEN_FUNCTION_NAME"
    fi
    
    if [ ! -z "$CHAT_FN" ]; then
        sed -i.bak "s/CHAT_FUNCTION_NAME=.*/CHAT_FUNCTION_NAME=$CHAT_FN/" $ENV_FILE
        echo "  ✓ Updated CHAT_FUNCTION_NAME"
    fi
    
    if [ ! -z "$POSTS_API_FN" ]; then
        sed -i.bak "s/POSTS_API_FUNCTION_NAME=.*/POSTS_API_FUNCTION_NAME=$POSTS_API_FN/" $ENV_FILE
        echo "  ✓ Updated POSTS_API_FUNCTION_NAME"
    fi
    
    if [ ! -z "$PUBLISHER_FN" ]; then
        sed -i.bak "s/PUBLISHER_FUNCTION_NAME=.*/PUBLISHER_FUNCTION_NAME=$PUBLISHER_FN/" $ENV_FILE
        echo "  ✓ Updated PUBLISHER_FUNCTION_NAME"
    fi
    
    if [ ! -z "$BRANDS_TABLE" ]; then
        sed -i.bak "s/BRANDS_TABLE_NAME=.*/BRANDS_TABLE_NAME=$BRANDS_TABLE/" $ENV_FILE
        echo "  ✓ Updated BRANDS_TABLE_NAME"
    fi
    
    if [ ! -z "$POSTS_TABLE" ]; then
        sed -i.bak "s/POSTS_TABLE_NAME=.*/POSTS_TABLE_NAME=$POSTS_TABLE/" $ENV_FILE
        echo "  ✓ Updated POSTS_TABLE_NAME"
    fi
    
    if [ ! -z "$S3_BUCKET" ]; then
        sed -i.bak "s/S3_BUCKET_NAME=.*/S3_BUCKET_NAME=$S3_BUCKET/" $ENV_FILE
        echo "  ✓ Updated S3_BUCKET_NAME"
    fi
    
    # Clean up backup file
    rm -f $ENV_FILE.bak
    
else
    echo "⚠ Stack not found. Using default resource names."
    echo "  You may need to manually update $ENV_FILE with actual resource names."
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update $ENV_FILE if needed"
echo "2. Install dependencies: npm install"
echo "3. Run tests: npm test"
echo ""
echo "Note: Make sure your AWS credentials are configured with appropriate permissions."
