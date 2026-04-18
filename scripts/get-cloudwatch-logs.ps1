# CloudWatch Logs Retrieval Script
# Retrieves recent logs from the chat-handler Lambda function

Write-Host "=== CloudWatch Logs Retrieval ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get the Lambda function name
Write-Host "Step 1: Finding Lambda function..." -ForegroundColor Yellow
$functionName = aws lambda list-functions --query "Functions[?contains(FunctionName, 'chat-handler')].FunctionName" --output text

if ([string]::IsNullOrWhiteSpace($functionName)) {
    Write-Host "ERROR: Could not find chat-handler Lambda function" -ForegroundColor Red
    exit 1
}

Write-Host "Found function: $functionName" -ForegroundColor Green
Write-Host ""

# Step 2: Get the log group name
$logGroupName = "/aws/lambda/$functionName"
Write-Host "Step 2: Log group: $logGroupName" -ForegroundColor Yellow
Write-Host ""

# Step 3: Get recent log streams
Write-Host "Step 3: Finding recent log streams..." -ForegroundColor Yellow
$logStreams = aws logs describe-log-streams `
    --log-group-name $logGroupName `
    --order-by LastEventTime `
    --descending `
    --max-items 5 `
    --query 'logStreams[*].logStreamName' `
    --output json | ConvertFrom-Json

if ($null -eq $logStreams -or $logStreams.Count -eq 0) {
    Write-Host "ERROR: No log streams found" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($logStreams.Count) recent log streams" -ForegroundColor Green
Write-Host ""

# Step 4: Get logs from the most recent stream
Write-Host "Step 4: Retrieving logs from most recent stream..." -ForegroundColor Yellow
$mostRecentStream = $logStreams[0]
Write-Host "Stream: $mostRecentStream" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== LOGS START ===" -ForegroundColor Cyan
Write-Host ""

$logs = aws logs get-log-events `
    --log-group-name $logGroupName `
    --log-stream-name $mostRecentStream `
    --limit 100 `
    --query 'events[*].message' `
    --output text

Write-Host $logs
Write-Host ""
Write-Host "=== LOGS END ===" -ForegroundColor Cyan
Write-Host ""

# Step 5: Search for error patterns
Write-Host "Step 5: Searching for errors..." -ForegroundColor Yellow
Write-Host ""

$errorPatterns = @(
    "ERROR",
    "FAILED",
    "500",
    "BEDROCK",
    "TITAN",
    "S3",
    "Invalid",
    "Missing"
)

foreach ($pattern in $errorPatterns) {
    $matches = $logs | Select-String -Pattern $pattern -AllMatches
    if ($matches) {
        Write-Host "Found pattern '$pattern':" -ForegroundColor Red
        Write-Host $matches -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "=== ANALYSIS COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the logs above for error messages" -ForegroundColor White
Write-Host "2. Look for patterns like 'BEDROCK TITAN INVOCATION FAILED' or 'S3 UPLOAD FAILED'" -ForegroundColor White
Write-Host "3. Check for missing environment variables or IAM permission errors" -ForegroundColor White
Write-Host ""
Write-Host "To get more logs, run:" -ForegroundColor Yellow
Write-Host "  aws logs tail $logGroupName --since 1h --follow" -ForegroundColor Cyan
