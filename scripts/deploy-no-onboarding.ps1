# Deploy Frontend Without Onboarding
# Builds and deploys frontend with onboarding removed

Write-Host "Deploying Frontend Without Onboarding..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "frontend")) {
    Write-Host "Error: frontend directory not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root" -ForegroundColor Yellow
    exit 1
}

# Step 1: Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
cd frontend

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    cd ..
    exit 1
}

Write-Host "Build complete!" -ForegroundColor Green
Write-Host ""

cd ..

# Step 2: Deploy to S3
Write-Host "Deploying to S3..." -ForegroundColor Yellow

$bucketName = "experta-frontend-dev"

# Sync dist folder to S3 (Vite outputs to dist, not build)
aws s3 sync frontend/dist s3://$bucketName --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "S3 sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host "S3 sync complete!" -ForegroundColor Green
Write-Host ""

# Step 3: Invalidate CloudFront cache (if exists)
Write-Host "Checking for CloudFront distribution..." -ForegroundColor Yellow

# Try to get CloudFront distribution ID
$distributionId = aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='$bucketName.s3.amazonaws.com']].Id" --output text 2>$null

if ($distributionId) {
    Write-Host "Found CloudFront distribution: $distributionId" -ForegroundColor Cyan
    Write-Host "Creating invalidation..." -ForegroundColor Yellow
    
    aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "CloudFront invalidation created!" -ForegroundColor Green
    } else {
        Write-Host "CloudFront invalidation failed (non-critical)" -ForegroundColor Yellow
    }
} else {
    Write-Host "No CloudFront distribution found (using S3 static hosting)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your site is available at:" -ForegroundColor Cyan
Write-Host "   http://$bucketName.s3-website-us-east-1.amazonaws.com" -ForegroundColor White
Write-Host ""
Write-Host "Changes applied:" -ForegroundColor Yellow
Write-Host "   - Onboarding flow removed" -ForegroundColor White
Write-Host "   - Users go directly to /chat after login" -ForegroundColor White
Write-Host ""
Write-Host "Note: Clear browser cache if you see old version" -ForegroundColor Yellow
Write-Host "   Press Ctrl+F5 to force refresh" -ForegroundColor White
Write-Host ""
