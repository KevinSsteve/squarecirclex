# Setup script for Experta Integration Tests (PowerShell)
# This script helps configure the test environment by extracting resource names from AWS SAM

Write-Host "Setting up integration test environment..." -ForegroundColor Green

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
} catch {
    Write-Host "Error: AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Get AWS region
$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
Write-Host "Using AWS region: $AWS_REGION"

# Get stack name
$STACK_NAME = if ($env:STACK_NAME) { $env:STACK_NAME } else { "experta-stack" }
Write-Host "Using stack name: $STACK_NAME"

# Create .env file
$ENV_FILE = ".env"
Write-Host "Creating $ENV_FILE..."

$envContent = @"
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
"@

Set-Content -Path $ENV_FILE -Value $envContent
Write-Host "✓ Created $ENV_FILE" -ForegroundColor Green

Write-Host ""
Write-Host "✓ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Review and update $ENV_FILE if needed"
Write-Host "2. Install dependencies: npm install"
Write-Host "3. Run tests: npm test"
Write-Host ""
Write-Host "Note: Make sure your AWS credentials are configured with appropriate permissions."
