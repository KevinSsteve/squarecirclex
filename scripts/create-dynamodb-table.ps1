# Create DynamoDB Table for Platform Credentials

Write-Host "Creating DynamoDB table..." -ForegroundColor Yellow

aws dynamodb create-table `
  --table-name Experta-PlatformCredentials-dev `
  --attribute-definitions AttributeName=platform,AttributeType=S `
  --key-schema AttributeName=platform,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region us-east-1 `
  --tags Key=Environment,Value=dev Key=ManagedBy,Value=Experta

if ($LASTEXITCODE -eq 0) {
    Write-Host "Table created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run: .\scripts\configure-instagram-credentials.ps1" -ForegroundColor Cyan
} else {
    Write-Host "Failed to create table" -ForegroundColor Red
}
