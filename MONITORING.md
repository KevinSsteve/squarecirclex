# Experta Monitoring and Observability Guide

This guide covers monitoring, logging, and alerting for the Experta AI Social Media Manager.

## Overview

Experta uses AWS CloudWatch for comprehensive monitoring:
- **CloudWatch Logs**: Centralized logging for all Lambda functions
- **CloudWatch Metrics**: Performance and health metrics
- **CloudWatch Alarms**: Automated alerting for issues
- **CloudWatch Dashboard**: Visual overview of system health

## CloudWatch Dashboard

### Accessing the Dashboard

After deployment, access the dashboard:

```bash
# Get dashboard URL
aws cloudformation describe-stacks \
  --stack-name experta-ai-social-manager \
  --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' \
  --output text
```

Or via AWS Console:
- CloudWatch → Dashboards → `Experta-{Environment}`

### Dashboard Widgets

The dashboard includes:

1. **Lambda Invocations**: Total invocations per function
2. **Lambda Errors**: Error count per function
3. **Lambda Duration**: Average execution time
4. **API Gateway Requests**: Total requests, 4xx, and 5xx errors
5. **DynamoDB Capacity**: Read/write capacity consumption
6. **EventBridge Invocations**: Event processing metrics

## CloudWatch Alarms

### Configured Alarms

#### Lambda Function Alarms

| Alarm | Threshold | Description |
|-------|-----------|-------------|
| `experta-onboarding-errors-{env}` | 5 errors in 5 min | Onboarding Lambda errors |
| `experta-content-generator-errors-{env}` | 3 errors in 5 min | Content generation errors |
| `experta-auto-publisher-errors-{env}` | 10 errors in 5 min | Post publishing errors |
| `experta-chat-handler-errors-{env}` | 5 errors in 5 min | Chat handler errors |
| `experta-posts-api-errors-{env}` | 10 errors in 5 min | Posts API errors |
| `experta-trend-scraper-errors-{env}` | 1 error in 5 min | Trend scraping errors |
| `experta-onboarding-throttles-{env}` | 5 throttles in 5 min | Lambda throttling |

#### API Gateway Alarms

| Alarm | Threshold | Description |
|-------|-----------|-------------|
| `experta-api-5xx-errors-{env}` | 10 errors in 5 min | Server errors |
| `experta-api-4xx-errors-{env}` | 50 errors in 10 min | Client errors (high rate) |
| `experta-api-high-latency-{env}` | 5000ms avg in 10 min | High response latency |

#### DynamoDB Alarms

| Alarm | Threshold | Description |
|-------|-----------|-------------|
| `experta-brands-table-throttles-{env}` | 10 errors in 5 min | Brands table throttling |
| `experta-posts-table-throttles-{env}` | 10 errors in 5 min | Posts table throttling |

#### EventBridge Alarms

| Alarm | Threshold | Description |
|-------|-----------|-------------|
| `experta-eventbridge-failed-invocations-{env}` | 5 failures in 5 min | Failed event processing |

### Subscribing to Alarms

All alarms send notifications to the SNS topic. Subscribe to receive alerts:

```bash
# Get SNS topic ARN
TOPIC_ARN=$(aws cloudformation describe-stacks \
  --stack-name experta-ai-social-manager \
  --query 'Stacks[0].Outputs[?OutputKey==`FailureTopicArn`].OutputValue' \
  --output text)

# Subscribe via email
aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol email \
  --notification-endpoint your-email@example.com

# Subscribe via SMS
aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol sms \
  --notification-endpoint +1234567890

# Subscribe via Slack (requires AWS Chatbot)
# Configure via AWS Console: AWS Chatbot → Configure new client
```

Confirm the subscription via email/SMS.

### Managing Alarms

#### View Alarm Status

```bash
# List all alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix experta \
  --query 'MetricAlarms[*].[AlarmName,StateValue]' \
  --output table

# Get specific alarm details
aws cloudwatch describe-alarms \
  --alarm-names experta-onboarding-errors-dev
```

#### Disable Alarms Temporarily

```bash
# Disable specific alarm
aws cloudwatch disable-alarm-actions \
  --alarm-names experta-onboarding-errors-dev

# Re-enable
aws cloudwatch enable-alarm-actions \
  --alarm-names experta-onboarding-errors-dev
```

#### Update Alarm Thresholds

Edit `template.yaml` and update the alarm threshold, then redeploy:

```yaml
OnboardingErrorAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    Threshold: 10  # Changed from 5
```

```bash
sam build && sam deploy
```

## CloudWatch Logs

### Log Groups

Each Lambda function has a dedicated log group:

- `/aws/lambda/experta-onboarding-{env}`
- `/aws/lambda/experta-content-generator-{env}`
- `/aws/lambda/experta-auto-publisher-{env}`
- `/aws/lambda/experta-chat-handler-{env}`
- `/aws/lambda/experta-posts-api-{env}`
- `/aws/lambda/experta-trend-scraper-{env}`
- `/aws/apigateway/experta-api-{env}`

### Viewing Logs

#### Via AWS CLI

```bash
# Tail logs in real-time
sam logs -n OnboardingFunction --stack-name experta-ai-social-manager --tail

# View logs for specific time range
sam logs -n OnboardingFunction --stack-name experta-ai-social-manager \
  --start-time '1 hour ago' --end-time 'now'

# Filter logs by pattern
aws logs filter-log-events \
  --log-group-name /aws/lambda/experta-onboarding-dev \
  --filter-pattern "ERROR"

# Get recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/experta-onboarding-dev \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

#### Via AWS Console

1. Go to CloudWatch → Log groups
2. Select log group (e.g., `/aws/lambda/experta-onboarding-dev`)
3. View log streams
4. Use filter patterns to search logs

### Log Insights Queries

CloudWatch Logs Insights provides powerful querying:

#### Find All Errors

```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

#### Lambda Performance Analysis

```
fields @timestamp, @duration, @billedDuration, @memorySize, @maxMemoryUsed
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)
```

#### API Gateway Access Logs

```
fields @timestamp, requestId, status, latency
| filter status >= 400
| sort @timestamp desc
| limit 50
```

#### Count Errors by Function

```
fields @logStream
| filter @message like /ERROR/
| stats count() by @logStream
```

### Log Retention

Logs are retained for 30 days by default. To change:

1. Edit `template.yaml`
2. Update `RetentionInDays` for log groups
3. Redeploy: `sam build && sam deploy`

## Metrics and Performance

### Key Metrics to Monitor

#### Lambda Functions

- **Invocations**: Number of function executions
- **Errors**: Failed executions
- **Duration**: Execution time
- **Throttles**: Rate-limited invocations
- **Concurrent Executions**: Simultaneous executions
- **Memory Usage**: RAM consumption

#### API Gateway

- **Count**: Total requests
- **4XXError**: Client errors
- **5XXError**: Server errors
- **Latency**: Response time
- **IntegrationLatency**: Backend processing time

#### DynamoDB

- **ConsumedReadCapacityUnits**: Read throughput
- **ConsumedWriteCapacityUnits**: Write throughput
- **UserErrors**: Throttling and validation errors
- **SystemErrors**: Service errors

#### EventBridge

- **Invocations**: Events processed
- **FailedInvocations**: Failed event deliveries
- **TriggeredRules**: Rules executed

### Custom Metrics

Add custom metrics in Lambda functions:

```javascript
// Node.js example
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

async function publishMetric(metricName, value) {
  await cloudwatch.putMetricData({
    Namespace: 'Experta/Custom',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }]
  }).promise();
}

// Usage
await publishMetric('PostsGenerated', 30);
```

```python
# Python example
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')

def publish_metric(metric_name, value):
    cloudwatch.put_metric_data(
        Namespace='Experta/Custom',
        MetricData=[{
            'MetricName': metric_name,
            'Value': value,
            'Unit': 'Count',
            'Timestamp': datetime.utcnow()
        }]
    )

# Usage
publish_metric('PostsGenerated', 30)
```

## Distributed Tracing with X-Ray

### Enable X-Ray (Optional)

Add to `template.yaml`:

```yaml
Globals:
  Function:
    Tracing: Active
```

Redeploy:

```bash
sam build && sam deploy
```

### View Traces

1. Go to AWS X-Ray Console
2. View service map
3. Analyze traces
4. Identify bottlenecks

## Troubleshooting Common Issues

### High Error Rate

1. **Check CloudWatch Logs** for error messages
2. **Review recent deployments** - rollback if needed
3. **Check external dependencies** (Bedrock, social media APIs)
4. **Verify IAM permissions**

### High Latency

1. **Check Lambda duration metrics**
2. **Review DynamoDB performance**
3. **Check Bedrock API response times**
4. **Optimize code** if needed

### Throttling

1. **Check Lambda concurrent executions**
2. **Review DynamoDB capacity**
3. **Check API Gateway throttling limits**
4. **Increase limits** if needed

### Failed EventBridge Invocations

1. **Check Lambda function errors**
2. **Verify EventBridge rules** are enabled
3. **Check IAM permissions**
4. **Review event patterns**

## Best Practices

### Logging

1. **Use structured logging** (JSON format)
2. **Include context** (request ID, user ID, brand ID)
3. **Log at appropriate levels** (ERROR, WARN, INFO, DEBUG)
4. **Avoid logging sensitive data** (credentials, PII)
5. **Use correlation IDs** for request tracing

### Monitoring

1. **Set up alarms** for critical metrics
2. **Review dashboard regularly**
3. **Establish baselines** for normal behavior
4. **Monitor costs** alongside performance
5. **Use anomaly detection** for unusual patterns

### Alerting

1. **Avoid alert fatigue** - set appropriate thresholds
2. **Use different channels** for different severities
3. **Document runbooks** for common issues
4. **Test alerts** regularly
5. **Review and adjust** thresholds based on experience

## Cost Optimization

### CloudWatch Costs

- **Logs ingestion**: $0.50 per GB
- **Logs storage**: $0.03 per GB/month
- **Metrics**: $0.30 per custom metric/month
- **Alarms**: $0.10 per alarm/month
- **Dashboard**: $3 per dashboard/month

### Reducing Costs

1. **Adjust log retention** (30 days → 7 days for dev)
2. **Filter logs** before ingestion
3. **Use log sampling** for high-volume functions
4. **Archive old logs** to S3
5. **Delete unused custom metrics**

## Compliance and Auditing

### CloudTrail Integration

Enable CloudTrail for audit logging:

```bash
aws cloudtrail create-trail \
  --name experta-audit-trail \
  --s3-bucket-name your-audit-bucket

aws cloudtrail start-logging \
  --name experta-audit-trail
```

### Log Exports

Export logs to S3 for long-term retention:

```bash
aws logs create-export-task \
  --log-group-name /aws/lambda/experta-onboarding-dev \
  --from $(date -u -d '7 days ago' +%s)000 \
  --to $(date -u +%s)000 \
  --destination your-logs-bucket \
  --destination-prefix experta/onboarding/
```

## Support and Resources

- **AWS CloudWatch Documentation**: https://docs.aws.amazon.com/cloudwatch/
- **CloudWatch Logs Insights**: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html
- **AWS X-Ray**: https://docs.aws.amazon.com/xray/
- **Best Practices**: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Best_Practice_Recommended_Alarms_AWS_Services.html
