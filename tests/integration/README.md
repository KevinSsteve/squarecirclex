# Experta Integration Tests

This directory contains end-to-end integration tests for the Experta AI Social Media Manager system.

## Overview

These tests validate complete workflows across multiple AWS services:
- Lambda functions (Onboarding, Content Generator, Chat Handler, Posts API, Auto Publisher)
- DynamoDB tables (Brands, Posts, Automation Logs)
- S3 bucket (image storage)
- EventBridge (scheduled rules and event-driven triggers)
- External APIs (Instagram Graph API, LinkedIn API)

## Test Flows

### Flow 1: Complete Onboarding → Content Generation → Post Publishing
Tests the full lifecycle from brand creation through automated content generation to scheduled publishing.

**Steps:**
1. Create brand via onboarding Lambda
2. Verify brand data saved to DynamoDB with encrypted credentials
3. Trigger content generation Lambda
4. Verify 30 posts created with proper distribution across content pillars
5. Verify images uploaded to S3
6. Verify EventBridge rules created for scheduled posts
7. Trigger publisher Lambda for one post
8. Verify post status updated (Published or Failed)

### Flow 2: Chat Request → Post Creation → Dashboard Update
Tests the conversational interface for manual post management.

**Steps:**
1. Create test brand
2. Send chat message requesting post creation
3. Verify post created in DynamoDB
4. Query dashboard API to verify post appears
5. Send chat message to modify post
6. Verify post updated in DynamoDB
7. Send chat message to delete post
8. Verify post removed from DynamoDB

### Flow 3: Post Regeneration → EventBridge Rule Update
Tests the post regeneration feature while preserving scheduling.

**Steps:**
1. Create test brand and generate posts
2. Call regenerate endpoint for one post
3. Verify new caption and image generated
4. Verify scheduled_time and content_pillar preserved
5. Verify EventBridge rule still exists and is enabled

### Flow 4: Multi-Platform Post → Simultaneous Publishing
Tests creating and publishing posts to multiple social media platforms.

**Steps:**
1. Create test brand
2. Request multi-platform post via chat
3. Verify separate post records created for Instagram and LinkedIn
4. Verify both posts have same scheduled_time
5. Trigger publishing for both posts simultaneously
6. Verify both posts updated with publication status

## Prerequisites

### AWS Infrastructure
The integration tests require a deployed AWS environment with:
- All Lambda functions deployed
- DynamoDB tables created
- S3 bucket configured
- EventBridge event bus configured
- Cognito User Pool (for authentication tests)
- API Gateway (for endpoint tests)

### Environment Variables
Set the following environment variables before running tests:

```bash
export AWS_REGION=us-east-1
export BRANDS_TABLE_NAME=Experta-Brands
export POSTS_TABLE_NAME=Experta-Posts
export AUTOMATION_LOGS_TABLE_NAME=Experta-Automation-Logs
export S3_BUCKET_NAME=experta-content-bucket
export ONBOARDING_FUNCTION_NAME=experta-onboarding
export CONTENT_GEN_FUNCTION_NAME=experta-content-generator
export CHAT_FUNCTION_NAME=experta-chat-handler
export POSTS_API_FUNCTION_NAME=experta-posts-api
export PUBLISHER_FUNCTION_NAME=experta-auto-publisher
```

### AWS Credentials
Ensure AWS credentials are configured with permissions to:
- Invoke Lambda functions
- Read/Write DynamoDB tables
- Read/Write S3 objects
- List/Create/Delete EventBridge rules
- Read CloudWatch Logs

You can configure credentials using:
- AWS CLI: `aws configure`
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- IAM role (if running on EC2/ECS)

## Installation

```bash
cd tests/integration
npm install
```

## Running Tests

### Run all integration tests
```bash
npm test
```

### Run with verbose output
```bash
npm run test:verbose
```

### Run specific test suite
```bash
npx jest e2e.test.js --testNamePattern="Flow 1"
```

### Run in watch mode (for development)
```bash
npm run test:watch
```

## Test Configuration

### Timeouts
- Default test timeout: 300 seconds (5 minutes)
- Content generation tests may take several minutes due to AI model invocations
- Adjust timeouts in individual tests if needed

### Cleanup
Tests automatically clean up resources after completion:
- DynamoDB records (brands, posts)
- S3 objects (images)
- EventBridge rules

If tests fail unexpectedly, some resources may remain. You can manually clean up using:
```bash
# List and delete test brands
aws dynamodb scan --table-name Experta-Brands --filter-expression "contains(brand_name, :test)" --expression-attribute-values '{":test":{"S":"Test Brand"}}'

# List and delete test S3 objects
aws s3 ls s3://experta-content-bucket/images/ --recursive | grep test

# List and delete test EventBridge rules
aws events list-rules --name-prefix experta-post-
```

## Important Notes

### External API Credentials
- Tests use placeholder tokens for Instagram and LinkedIn APIs
- Publishing tests will fail with "Failed" status unless valid API credentials are provided
- This is expected behavior - the tests verify the system handles failures correctly
- For full end-to-end validation, configure test social media accounts

### Cost Considerations
- Integration tests invoke real AWS services and may incur costs
- Amazon Bedrock API calls (Claude, Titan) are the primary cost driver
- Content generation for 30 posts costs approximately $0.50-$1.00
- Run tests sparingly in production accounts

### Test Isolation
- Tests run sequentially (`--runInBand`) to avoid resource conflicts
- Each test flow creates isolated test data with unique identifiers
- Cleanup ensures no test data persists between runs

### CI/CD Integration
To run these tests in a CI/CD pipeline:

1. Deploy infrastructure to a test environment
2. Set environment variables in CI/CD configuration
3. Configure AWS credentials using CI/CD secrets
4. Run tests as part of deployment validation
5. Consider running tests on a schedule (nightly) rather than on every commit

Example GitHub Actions workflow:
```yaml
name: Integration Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Run at 2 AM daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Install dependencies
        run: |
          cd tests/integration
          npm install
      - name: Run integration tests
        run: |
          cd tests/integration
          npm test
        env:
          BRANDS_TABLE_NAME: ${{ secrets.BRANDS_TABLE_NAME }}
          POSTS_TABLE_NAME: ${{ secrets.POSTS_TABLE_NAME }}
          # ... other environment variables
```

## Troubleshooting

### Tests timeout
- Increase timeout in jest.config or individual tests
- Check Lambda function logs in CloudWatch
- Verify Lambda functions have sufficient memory and timeout settings

### DynamoDB errors
- Verify table names match environment variables
- Check IAM permissions for DynamoDB access
- Ensure tables have required GSIs configured

### S3 errors
- Verify bucket name matches environment variable
- Check IAM permissions for S3 access
- Ensure bucket exists and is in the correct region

### Lambda invocation errors
- Verify function names match environment variables
- Check Lambda function logs for errors
- Ensure Lambda functions are deployed and active

### EventBridge errors
- Check IAM permissions for EventBridge access
- Verify event bus exists
- Check Lambda function has EventBridge trigger configured

## Contributing

When adding new integration tests:
1. Follow the existing test structure
2. Add cleanup for any resources created
3. Use descriptive test names
4. Add appropriate timeouts for long-running operations
5. Document any new environment variables required
6. Update this README with new test flows

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda function errors
2. Review AWS service quotas and limits
3. Verify all prerequisites are met
4. Check the main project README for system architecture details
