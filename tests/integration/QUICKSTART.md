# Integration Tests Quick Start Guide

This guide will help you quickly set up and run the Experta integration tests.

## Prerequisites Checklist

- [ ] AWS infrastructure deployed (Lambda functions, DynamoDB tables, S3 bucket)
- [ ] AWS CLI installed and configured
- [ ] Node.js 18+ installed
- [ ] AWS credentials with appropriate permissions

## Quick Setup (5 minutes)

### Step 1: Navigate to integration tests directory
```bash
cd tests/integration
```

### Step 2: Run setup script

**On Linux/Mac:**
```bash
chmod +x setup-test-env.sh
./setup-test-env.sh
```

**On Windows:**
```powershell
.\setup-test-env.ps1
```

This creates a `.env` file with default resource names.

### Step 3: Update resource names (if needed)

Edit `.env` and update the resource names to match your deployed AWS resources:

```bash
# Example: Update Lambda function names
ONBOARDING_FUNCTION_NAME=your-actual-function-name
CONTENT_GEN_FUNCTION_NAME=your-actual-function-name
# ... etc
```

**Tip:** You can find your resource names in the AWS Console or by running:
```bash
aws cloudformation describe-stack-resources --stack-name your-stack-name
```

### Step 4: Install dependencies
```bash
npm install
```

### Step 5: Run tests
```bash
npm test
```

## What to Expect

### Test Duration
- **Flow 1** (Onboarding → Content Generation → Publishing): ~5-10 minutes
- **Flow 2** (Chat → Post Creation → Dashboard): ~2-3 minutes
- **Flow 3** (Post Regeneration): ~2-3 minutes
- **Flow 4** (Multi-Platform Publishing): ~2-3 minutes

**Total runtime:** ~10-20 minutes

### Expected Results

✅ **Passing tests:**
- Brand creation and data persistence
- Content generation (30 posts)
- Image upload to S3
- EventBridge rule creation
- Chat-based post management
- Post regeneration
- Multi-platform post creation

⚠️ **Expected failures:**
- Post publishing tests will show "Failed" status if you're using test credentials
- This is normal - the system correctly handles API failures

### Test Output Example

```
PASS tests/integration/e2e.test.js
  End-to-End Integration Tests
    Flow 1: Complete Onboarding → Content Generation → Post Publishing
      ✓ should complete full onboarding flow (5234ms)
      ✓ should trigger content generation after onboarding (287543ms)
      ✓ should create EventBridge rules for scheduled posts (1823ms)
      ✓ should publish post when scheduled time arrives (12456ms)
    Flow 2: Chat Request → Post Creation → Dashboard Update
      ✓ should create post via chat request (45678ms)
      ✓ should retrieve created post via dashboard API (1234ms)
      ✓ should modify post via chat request (34567ms)
      ✓ should delete post via chat request (2345ms)
    Flow 3: Post Regeneration → EventBridge Rule Update
      ✓ should regenerate post with new content (89012ms)
      ✓ should preserve EventBridge rule after regeneration (1567ms)
    Flow 4: Multi-Platform Post → Simultaneous Publishing
      ✓ should create posts for multiple platforms (45678ms)
      ✓ should publish to both platforms simultaneously (23456ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Time:        543.789s
```

## Troubleshooting

### "Cannot find module" errors
```bash
# Make sure you're in the right directory
cd tests/integration

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Access Denied" errors
Your AWS credentials need these permissions:
- `lambda:InvokeFunction`
- `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:Query`, `dynamodb:DeleteItem`
- `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`
- `events:ListRules`, `events:PutRule`, `events:DeleteRule`, `events:PutTargets`, `events:RemoveTargets`

### "Function not found" errors
Update the function names in `.env` to match your deployed Lambda functions:
```bash
# List your Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `experta`)].FunctionName'
```

### Tests timeout
Increase the timeout in `package.json`:
```json
{
  "jest": {
    "testTimeout": 600000  // 10 minutes
  }
}
```

### Content generation takes too long
This is normal - generating 30 posts with AI models takes 5-10 minutes. The test has a 5-minute timeout by default.

## Running Specific Tests

### Run only Flow 1
```bash
npx jest --testNamePattern="Flow 1"
```

### Run only Flow 2
```bash
npx jest --testNamePattern="Flow 2"
```

### Run with verbose output
```bash
npm run test:verbose
```

## Cleanup

Tests automatically clean up resources, but if tests fail unexpectedly, you may need to manually clean up:

### Delete test brands
```bash
aws dynamodb scan \
  --table-name Experta-Brands \
  --filter-expression "contains(brand_name, :test)" \
  --expression-attribute-values '{":test":{"S":"Test Brand"}}'
```

### Delete test posts
```bash
aws dynamodb scan \
  --table-name Experta-Posts \
  --filter-expression "contains(brand_id, :test)" \
  --expression-attribute-values '{":test":{"S":"test"}}'
```

### Delete test S3 objects
```bash
aws s3 rm s3://experta-content-bucket/images/ --recursive --exclude "*" --include "*test*"
```

## Cost Considerations

Running the full test suite costs approximately:
- **Amazon Bedrock (Claude):** ~$0.30 (30 caption generations)
- **Amazon Bedrock (Titan):** ~$0.60 (30 image generations)
- **DynamoDB:** ~$0.01 (read/write operations)
- **S3:** ~$0.01 (storage and requests)
- **Lambda:** ~$0.01 (invocations)

**Total:** ~$1.00 per test run

💡 **Tip:** Run tests sparingly in production accounts. Consider using a dedicated test environment.

## Next Steps

Once tests pass:
1. Review test output and logs
2. Check CloudWatch Logs for detailed Lambda execution logs
3. Verify resources in AWS Console (DynamoDB, S3, EventBridge)
4. Run tests regularly as part of CI/CD pipeline
5. Add custom tests for your specific use cases

## Getting Help

- Check the main [README.md](README.md) for detailed documentation
- Review CloudWatch Logs for Lambda function errors
- Check AWS service quotas and limits
- Verify all prerequisites are met

## Advanced Usage

### Running tests in CI/CD
See the [README.md](README.md) for GitHub Actions workflow example.

### Using test social media accounts
To test actual publishing:
1. Create test Instagram and LinkedIn accounts
2. Generate API tokens
3. Add to `.env`:
   ```
   TEST_INSTAGRAM_TOKEN=your_real_token
   TEST_LINKEDIN_TOKEN=your_real_token
   ```
4. Update test code to use these tokens

### Debugging tests
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Then attach your debugger (VS Code, Chrome DevTools, etc.)
```

### Generating coverage reports
```bash
npx jest --coverage
```

## Summary

You're now ready to run integration tests! The tests validate the complete Experta system end-to-end, ensuring all components work together correctly.

**Remember:**
- Tests take 10-20 minutes to complete
- Publishing tests may show "Failed" status with test credentials (this is expected)
- Tests automatically clean up resources
- Run tests in a test environment to avoid costs

Happy testing! 🚀
