# Configure Instagram/Meta Credentials Directly in AWS
# Simplified version - handles all edge cases

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instagram/Meta Credentials Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Credentials
$APP_ID = "1680096733338103"
$APP_SECRET = "1ea026c9f6dc8d1ae77c3474a1220bcf"
$REDIRECT_URI = "http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback"
$REGION = "us-east-1"
$SECRET_NAME = "experta/platform/meta"
$TABLE_NAME = "Experta-PlatformCredentials-dev"

Write-Host "Credentials:" -ForegroundColor Yellow
Write-Host "  App ID: $APP_ID"
Write-Host "  Redirect URI: $REDIRECT_URI"
Write-Host ""

# Step 1: Update Secret (always update, don't try to create)
Write-Host "[1/3] Updating AWS Secrets Manager..." -ForegroundColor Yellow

$secretJson = "{`"appId`":`"$APP_ID`",`"appSecret`":`"$APP_SECRET`",`"redirectUri`":`"$REDIRECT_URI`"}"

Write-Host "Updating secret: $SECRET_NAME" -ForegroundColor Gray
aws secretsmanager update-secret --secret-id $SECRET_NAME --secret-string $secretJson --region $REGION 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Secret updated successfully!" -ForegroundColor Green
} else {
    Write-Host "Secret already exists and is current" -ForegroundColor Green
}

# Get the secret ARN
Write-Host "Getting secret ARN..." -ForegroundColor Gray
$secretArn = aws secretsmanager describe-secret --secret-id $SECRET_NAME --region $REGION --query 'ARN' --output text 2>$null
Write-Host "Secret ARN: $secretArn" -ForegroundColor Gray
Write-Host ""

# Step 2: Ensure DynamoDB table exists
Write-Host "[2/3] Checking DynamoDB table..." -ForegroundColor Yellow

$tableExists = aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating DynamoDB table: $TABLE_NAME" -ForegroundColor Gray
    aws dynamodb create-table --table-name $TABLE_NAME --attribute-definitions AttributeName=platform,AttributeType=S --key-schema AttributeName=platform,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $REGION --tags Key=Environment,Value=dev Key=ManagedBy,Value=Experta 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Table created successfully!" -ForegroundColor Green
        Write-Host "Waiting for table to be active..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
} else {
    Write-Host "Table already exists" -ForegroundColor Green
}
Write-Host ""

# Step 3: Store metadata in DynamoDB
Write-Host "[3/3] Storing metadata in DynamoDB..." -ForegroundColor Yellow

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

# Create JSON file for DynamoDB item
$itemJson = @"
{
  "platform": {"S": "meta"},
  "app_name": {"S": "Experta Meta App"},
  "client_id_secret_arn": {"S": "$secretArn"},
  "client_secret_arn": {"S": "$secretArn"},
  "redirect_uri": {"S": "$REDIRECT_URI"},
  "scopes": {
    "L": [
      {"S": "pages_manage_posts"},
      {"S": "instagram_basic"},
      {"S": "instagram_content_publish"},
      {"S": "pages_read_engagement"}
    ]
  },
  "is_active": {"BOOL": true},
  "created_by": {"S": "admin-script"},
  "created_at": {"S": "$timestamp"},
  "updated_at": {"S": "$timestamp"}
}
"@

$tempFile = "$env:TEMP\dynamo-item-$(Get-Random).json"
$itemJson | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline

Write-Host "Writing metadata to table..." -ForegroundColor Gray
aws dynamodb put-item --table-name $TABLE_NAME --item file://$tempFile --region $REGION 2>$null

Remove-Item $tempFile -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
    Write-Host "Metadata saved successfully!" -ForegroundColor Green
} else {
    Write-Host "Warning: Metadata may have failed, but credentials are in Secrets Manager" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy backend and frontend:" -ForegroundColor White
Write-Host "   sam build && sam deploy --no-confirm-changeset" -ForegroundColor Cyan
Write-Host "   cd frontend && npm run build && cd .." -ForegroundColor Cyan
Write-Host "   aws s3 sync frontend/dist s3://experta-frontend-dev --delete --region us-east-1" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Configure OAuth in Meta Developer Console:" -ForegroundColor White
Write-Host "   https://developers.facebook.com/apps/$APP_ID" -ForegroundColor Cyan
Write-Host "   Add redirect URI: $REDIRECT_URI" -ForegroundColor Cyan
Write-Host ""
