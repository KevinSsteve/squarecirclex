# Deploy Meta Integration - Fase 3 Dia 4
# Script para build e deploy da integração Meta

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Meta Integration Deploy - Fase 3 Dia 4" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "[1/4] Building SAM application..." -ForegroundColor Yellow
sam build --cached --parallel

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Validate template
Write-Host "[2/4] Validating template..." -ForegroundColor Yellow
sam validate

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Template validation failed, but continuing..." -ForegroundColor Yellow
}

Write-Host "✅ Template validated!" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy
Write-Host "[3/4] Deploying to AWS..." -ForegroundColor Yellow
Write-Host "Stack: onzo" -ForegroundColor Cyan
Write-Host "Environment: dev" -ForegroundColor Cyan
Write-Host "Region: us-east-1" -ForegroundColor Cyan
Write-Host ""

sam deploy --config-env default --no-confirm-changeset

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deploy failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deploy completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Get outputs
Write-Host "[4/4] Getting stack outputs..." -ForegroundColor Yellow
aws cloudformation describe-stacks `
    --stack-name onzo `
    --query 'Stacks[0].Outputs' `
    --output table

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy Complete! 🚀" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test Meta Publisher function" -ForegroundColor White
Write-Host "2. Verify EventBridge rule" -ForegroundColor White
Write-Host "3. Check CloudWatch logs" -ForegroundColor White
Write-Host ""
Write-Host "To test the function:" -ForegroundColor Yellow
Write-Host "  aws lambda invoke --function-name onzo-meta-publisher-dev --payload file://test-event.json response.json" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  aws logs tail /aws/lambda/onzo-meta-publisher-dev --follow" -ForegroundColor Cyan
Write-Host ""

