#!/bin/bash

# Experta Infrastructure Validation Script
# This script validates that all infrastructure components are properly configured

set -e

STACK_NAME="experta-ai-social-manager"
ENVIRONMENT="${1:-dev}"

echo "=========================================="
echo "Experta Infrastructure Validation"
echo "Stack: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    exit 1
fi
echo "✅ AWS CLI is installed"

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "❌ SAM CLI is not installed"
    exit 1
fi
echo "✅ SAM CLI is installed"

# Check if stack exists
echo ""
echo "Checking CloudFormation stack..."
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" &> /dev/null; then
    echo "✅ Stack exists: $STACK_NAME"
    
    # Get stack status
    STACK_STATUS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].StackStatus' \
        --output text)
    
    if [ "$STACK_STATUS" == "CREATE_COMPLETE" ] || [ "$STACK_STATUS" == "UPDATE_COMPLETE" ]; then
        echo "✅ Stack status: $STACK_STATUS"
    else
        echo "⚠️  Stack status: $STACK_STATUS"
    fi
else
    echo "❌ Stack does not exist: $STACK_NAME"
    echo "   Run: sam deploy --guided"
    exit 1
fi

# Validate DynamoDB tables
echo ""
echo "Validating DynamoDB tables..."

BRANDS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`BrandsTableName`].OutputValue' \
    --output text)

POSTS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`PostsTableName`].OutputValue' \
    --output text)

LOGS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`AutomationLogsTableName`].OutputValue' \
    --output text)

TRENDS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`TrendsTableName`].OutputValue' \
    --output text)

if aws dynamodb describe-table --table-name "$BRANDS_TABLE" &> /dev/null; then
    echo "✅ Brands table exists: $BRANDS_TABLE"
else
    echo "❌ Brands table not found"
fi

if aws dynamodb describe-table --table-name "$POSTS_TABLE" &> /dev/null; then
    echo "✅ Posts table exists: $POSTS_TABLE"
else
    echo "❌ Posts table not found"
fi

if aws dynamodb describe-table --table-name "$LOGS_TABLE" &> /dev/null; then
    echo "✅ Automation Logs table exists: $LOGS_TABLE"
else
    echo "❌ Automation Logs table not found"
fi

if aws dynamodb describe-table --table-name "$TRENDS_TABLE" &> /dev/null; then
    echo "✅ Trends table exists: $TRENDS_TABLE"
else
    echo "❌ Trends table not found"
fi

# Validate S3 bucket
echo ""
echo "Validating S3 bucket..."

BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ContentBucketName`].OutputValue' \
    --output text)

if aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    echo "✅ S3 bucket exists: $BUCKET_NAME"
else
    echo "❌ S3 bucket not found"
fi

# Validate Cognito User Pool
echo ""
echo "Validating Cognito User Pool..."

USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

if aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" &> /dev/null; then
    echo "✅ Cognito User Pool exists: $USER_POOL_ID"
else
    echo "❌ Cognito User Pool not found"
fi

# Validate API Gateway
echo ""
echo "Validating API Gateway..."

API_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiId`].OutputValue' \
    --output text)

API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

if aws apigateway get-rest-api --rest-api-id "$API_ID" &> /dev/null; then
    echo "✅ API Gateway exists: $API_ID"
    echo "   URL: $API_URL"
else
    echo "❌ API Gateway not found"
fi

# Validate EventBridge
echo ""
echo "Validating EventBridge..."

EVENT_BUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`EventBusName`].OutputValue' \
    --output text)

if aws events describe-event-bus --name "$EVENT_BUS" &> /dev/null; then
    echo "✅ EventBridge bus exists: $EVENT_BUS"
else
    echo "❌ EventBridge bus not found"
fi

# Validate KMS Key
echo ""
echo "Validating KMS Key..."

KMS_KEY_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`EncryptionKeyId`].OutputValue' \
    --output text)

if aws kms describe-key --key-id "$KMS_KEY_ID" &> /dev/null; then
    echo "✅ KMS key exists: $KMS_KEY_ID"
else
    echo "❌ KMS key not found"
fi

# Summary
echo ""
echo "=========================================="
echo "Validation Complete"
echo "=========================================="
echo ""
echo "Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "Next Steps:"
echo "1. Configure SNS notifications: aws sns subscribe --topic-arn <FailureTopicArn> --protocol email --notification-endpoint your-email@example.com"
echo "2. Store social media credentials in Secrets Manager"
echo "3. Enable Bedrock model access for Claude 3.5 Sonnet and Titan Image Generator"
echo "4. Deploy Lambda functions (upcoming tasks)"
echo ""
