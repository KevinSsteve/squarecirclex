# Deploy Instagram Integration - Backend + Frontend
# This script deploys the complete Instagram integration setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instagram Integration Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build and deploy backend (SAM)
Write-Host "[1/3] Building and deploying backend..." -ForegroundColor Yellow
sam build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed!" -ForegroundColor Red
    exit 1
}

sam deploy --no-confirm-changeset
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Backend deployed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Build frontend
Write-Host "[2/3] Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "Frontend built successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy frontend to S3
Write-Host "[3/3] Deploying frontend to S3..." -ForegroundColor Yellow
aws s3 sync frontend/dist s3://experta-frontend-dev --delete --region us-east-1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Frontend deployed successfully!" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add your email as Admin in Cognito (see ADD_ADMIN_USER_MANUAL.md)" -ForegroundColor White
Write-Host "2. Login and access: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin" -ForegroundColor White
Write-Host "3. Go to Platform Configuration tab" -ForegroundColor White
Write-Host "4. Enter your Instagram/Meta credentials:" -ForegroundColor White
Write-Host "   - App ID: 1680096733338103" -ForegroundColor Cyan
Write-Host "   - App Secret: 1ea026c9f6dc8d1ae77c3474a1220bcf" -ForegroundColor Cyan
Write-Host "   - Redirect URI: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback" -ForegroundColor Cyan
Write-Host "5. Click 'Save Meta Configuration'" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: INSTAGRAM_SETUP_INSTRUCTIONS.md" -ForegroundColor Yellow
Write-Host ""
