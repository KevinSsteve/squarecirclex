# Complete Instagram Integration Setup
# This script runs everything in the correct order

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instagram Integration - Complete Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "1. Configure Instagram/Meta credentials in AWS" -ForegroundColor White
Write-Host "2. Build and deploy backend (SAM)" -ForegroundColor White
Write-Host "3. Build and deploy frontend (S3)" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Continue? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Aborted by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Configure Credentials" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

& .\scripts\configure-instagram-credentials.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Credential configuration failed!" -ForegroundColor Red
    Write-Host "Please check the error above and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Deploy Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Building backend..." -ForegroundColor Yellow
sam build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying backend..." -ForegroundColor Yellow
sam deploy --no-confirm-changeset
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Backend deployed successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Deploy Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "Deploying frontend to S3..." -ForegroundColor Yellow
aws s3 sync frontend/dist s3://experta-frontend-dev --delete --region us-east-1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Frontend deployed successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Credentials configured in AWS" -ForegroundColor Green
Write-Host "✓ Backend deployed" -ForegroundColor Green
Write-Host "✓ Frontend deployed" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps (Manual)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure OAuth Redirect URI in Meta Developer Console:" -ForegroundColor White
Write-Host "   https://developers.facebook.com/apps/1680096733338103" -ForegroundColor Cyan
Write-Host "   Add this URI in Facebook Login → Settings → Valid OAuth Redirect URIs:" -ForegroundColor White
Write-Host "   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Prepare your Instagram account:" -ForegroundColor White
Write-Host "   - Convert to Business/Creator account" -ForegroundColor Gray
Write-Host "   - Connect to a Facebook Page" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the integration:" -ForegroundColor White
Write-Host "   - Access: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com" -ForegroundColor Cyan
Write-Host "   - Go to Connect Accounts" -ForegroundColor Gray
Write-Host "   - Connect Instagram" -ForegroundColor Gray
Write-Host "   - Create and publish a test post" -ForegroundColor Gray
Write-Host ""
Write-Host "For detailed instructions, see: CREDENCIAIS_INSTAGRAM_CONFIGURADAS.md" -ForegroundColor Yellow
Write-Host ""
