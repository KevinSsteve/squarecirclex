# Deploy Latency Fix and Template Removal
# Fixes severe latency and removes all hardcoded templates

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LATENCY FIX DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Changes being deployed:" -ForegroundColor Yellow
Write-Host "  ✓ Removed 'Not specified' defaults" -ForegroundColor Green
Write-Host "  ✓ Deleted hardcoded template fallback" -ForegroundColor Green
Write-Host "  ✓ Implemented fast post generation (< 5s)" -ForegroundColor Green
Write-Host "  ✓ Simplified error handling" -ForegroundColor Green
Write-Host ""

# Step 1: Build
Write-Host "[1/2] Building Lambda functions..." -ForegroundColor Cyan
sam build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy
Write-Host "[2/2] Deploying to AWS..." -ForegroundColor Cyan
sam deploy --no-confirm-changeset
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Deployment successful" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing checklist:" -ForegroundColor Yellow
Write-Host "  1. Ask Onzo to 'gera um post sobre café'" -ForegroundColor White
Write-Host "  2. Verify response comes in < 5 seconds" -ForegroundColor White
Write-Host "  3. Check that content has NO 'Not specified' values" -ForegroundColor White
Write-Host "  4. Verify NO hardcoded templates appear" -ForegroundColor White
Write-Host "  5. Confirm caption is in Portuguese and relevant" -ForegroundColor White
Write-Host ""

Write-Host "Monitor logs:" -ForegroundColor Yellow
Write-Host "  aws logs tail /aws/lambda/experta-dev-ChatHandlerFunction --follow" -ForegroundColor Gray
Write-Host ""
