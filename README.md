# Experta AI Social Media Manager

An autonomous AI-powered social media management system built on AWS serverless infrastructure.

## Architecture Overview

Experta uses a hybrid serverless architecture:
- **Node.js 18.x** for API handlers, business logic, and social media integrations
- **Python 3.11** for AI/ML operations (content generation, trend analysis)
- **AWS SAM** for infrastructure as code and deployment
- **Amazon Bedrock** for AI capabilities (Claude 3.5 Sonnet, Titan Image Generator)
- **DynamoDB** for data persistence
- **EventBridge** for event-driven automation
- **S3** for image storage
- **Cognito** for authentication

## Project Structure

```
.
├── template.yaml              # SAM infrastructure template
├── samconfig.toml            # SAM deployment configuration
├── config/
│   └── environment.json      # Environment-specific configuration
├── functions/                # Lambda function code
│   ├── onboarding/          # Node.js - Brand onboarding handler
│   ├── content-generator/   # Python - Content generation
│   ├── auto-publisher/      # Node.js - Post publishing
│   ├── chat-handler/        # Python - Chat interface
│   ├── trend-scraper/       # Python - Trend analysis
│   └── posts-api/           # Node.js - Posts API
├── lib/                     # Shared libraries
│   ├── nodejs/             # Node.js shared code
│   │   ├── security/       # Encryption utilities
│   │   ├── auth/           # Authentication middleware
│   │   ├── db/             # DynamoDB data access
│   │   ├── events/         # EventBridge utilities
│   │   ├── errors/         # Error handling
│   │   └── validation/     # Request validation
│   └── python/             # Python shared code
│       └── errors/         # Error handling
└── frontend/               # React application (AWS Amplify)
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS SAM CLI installed
- Node.js 18.x
- Python 3.11
- Docker (for local testing)

## Installation

1. Install dependencies:
```bash
# Install SAM CLI
pip install aws-sam-cli

# Verify installation
sam --version
```

2. Build the project:
```bash
sam build
```

3. Deploy to AWS:
```bash
sam deploy --guided
```

Follow the prompts to configure:
- Stack name: `experta-ai-social-manager`
- AWS Region: `us-east-1` (or your preferred region)
- Environment: `dev`, `staging`, or `prod`
- Confirm changes before deploy: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Save arguments to configuration file: `Y`

## Local Development

### Start API Gateway locally:
```bash
sam local start-api
```

### Invoke a specific function:
```bash
sam local invoke OnboardingHandler --event events/onboarding-event.json
```

### Run tests:
```bash
# Node.js tests
cd functions/onboarding
npm test

# Python tests
cd functions/content-generator
pytest
```

## Environment Variables

The following environment variables are automatically configured by SAM:

- `BRANDS_TABLE_NAME` - DynamoDB Brands table
- `POSTS_TABLE_NAME` - DynamoDB Posts table
- `AUTOMATION_LOGS_TABLE_NAME` - DynamoDB Automation Logs table
- `TRENDS_TABLE_NAME` - DynamoDB Trends table
- `S3_BUCKET_NAME` - S3 bucket for content storage
- `EVENTBRIDGE_BUS_NAME` - EventBridge event bus
- `ENCRYPTION_KEY_ID` - KMS key for credential encryption
- `BEDROCK_CLAUDE_MODEL_ID` - Claude model identifier
- `BEDROCK_TITAN_MODEL_ID` - Titan image model identifier

## Infrastructure Components

### DynamoDB Tables
- **Brands**: Store brand information and credentials
- **Posts**: Store social media posts and scheduling data
- **Automation_Logs**: Track automation execution logs
- **Trends**: Store trending content data (7-day TTL)

### S3 Bucket
- **images/**: Permanent image storage
- **temp/**: Temporary uploads (1-day lifecycle)

### EventBridge
- Custom event bus for system events
- Scheduled rules for post publishing
- Daily trend scraping schedule

### Cognito
- User Pool with email verification
- Custom attribute: `brand_id`
- JWT token-based authentication

### API Gateway
- REST API with Cognito authorizer
- CORS enabled for frontend
- Routes for brands, posts, chat, and onboarding

## Deployment

### Deploy to specific environment:
```bash
# Development
sam deploy --parameter-overrides Environment=dev

# Staging
sam deploy --parameter-overrides Environment=staging

# Production
sam deploy --parameter-overrides Environment=prod
```

### View stack outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name experta-ai-social-manager \
  --query 'Stacks[0].Outputs'
```

## Monitoring

### View CloudWatch Logs:
```bash
sam logs -n OnboardingHandler --stack-name experta-ai-social-manager --tail
```

### View DynamoDB tables:
```bash
aws dynamodb list-tables --query 'TableNames[?contains(@, `Experta`)]'
```

## Testing

### Unit Tests
```bash
# Node.js functions
npm test

# Python functions
pytest
```

### Property-Based Tests
```bash
# Node.js (fast-check)
npm run test:properties

# Python (hypothesis)
pytest tests/properties/
```

### Integration Tests
End-to-end integration tests validate complete workflows across all AWS services.

```bash
# Navigate to integration tests
cd tests/integration

# Setup environment
./setup-test-env.sh  # Linux/Mac
# or
.\setup-test-env.ps1  # Windows

# Install dependencies
npm install

# Run all integration tests
npm test
```

**Test Flows:**
1. Complete onboarding → content generation → post publishing
2. Chat request → post creation → dashboard update
3. Post regeneration → EventBridge rule update
4. Multi-platform post → simultaneous publishing

**Note:** Integration tests require deployed AWS infrastructure and take 10-20 minutes to complete. See [tests/integration/QUICKSTART.md](tests/integration/QUICKSTART.md) for detailed setup instructions.

**Cost:** ~$1.00 per test run (primarily Bedrock API calls)

## Security

- All credentials encrypted with KMS
- S3 bucket with encryption at rest
- API Gateway with JWT authorization
- DynamoDB point-in-time recovery enabled
- CloudWatch logging for audit trail

## Cleanup

To delete all resources:
```bash
sam delete
```

## Support

For issues and questions, refer to the design and requirements documents in `.kiro/specs/experta-ai-social-manager/`.

## License

Proprietary - All rights reserved
