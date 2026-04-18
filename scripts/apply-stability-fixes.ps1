# Bedrock Stability Fixes Deployment Script
# Applies critical fixes and deploys to AWS

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Bedrock Stability Fixes Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display fixes being applied
Write-Host "Fixes Applied:" -ForegroundColor Green
Write-Host "  ✓ Fix #1: Cross-Region Inference (CRI) - Already configured" -ForegroundColor Green
Write-Host "  ✓ Fix #2: API Gateway Timeout - Reduced from 302s to 29s" -ForegroundColor Green
Write-Host "  ✓ Fix #3: Persona Name - Already 'Onzo'" -ForegroundColor Green
Write-Host ""

# Verify template.yaml changes
Write-Host "Verifying template.yaml changes..." -ForegroundColor Yellow
$templateContent = Get-Content template.yaml -Raw
if ($templateContent -match "Timeout: 29") {
    Write-Host "  ✓ Timeout correctly set to 29 seconds" -ForegroundColor Green
} else {
    Write-Host "  ✗ Timeout not set correctly!" -ForegroundColor Red
    exit 1
}

if ($templateContent -match "us\.anthropic\.claude-3-5-sonnet-20240620-v1:0") {
    Write-Host "  ✓ CRI Model ID correctly configured" -ForegroundColor Green
} else {
    Write-Host "  ✗ CRI Model ID not set correctly!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting SAM build..." -ForegroundColor Yellow
sam build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build successful! Starting deployment..." -ForegroundColor Green
Write-Host ""

sam deploy --no-confirm-changeset

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stability improvements applied:" -ForegroundColor Green
Write-Host "  • Cross-Region Inference enabled for better throughput" -ForegroundColor White
Write-Host "  • API Gateway timeout issues resolved" -ForegroundColor White
Write-Host "  • Consistent 'Onzo' persona branding" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test chat functionality" -ForegroundColor White
Write-Host "  2. Monitor CloudWatch for throttling errors" -ForegroundColor White
Write-Host "  3. Verify response times < 29 seconds" -ForegroundColor White
Write-Host ""
