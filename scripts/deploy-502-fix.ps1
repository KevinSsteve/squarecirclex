# Deploy Game View 502 Fix
# Builds and deploys the frontend with circuit breaker and PixiJS crash fixes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Game View 502 Fix Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "frontend/package.json")) {
    Write-Host "Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Build Frontend
Write-Host "Step 1: Building frontend..." -ForegroundColor Yellow
Set-Location frontend

# Clean previous build
if (Test-Path "dist") {
    Write-Host "Cleaning previous build..." -ForegroundColor Gray
    Remove-Item -Recurse -Force dist
}

# Run build
Write-Host "Running npm build..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Frontend build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "- Frontend build successful" -ForegroundColor Green
Write-Host ""

# Step 2: Get S3 bucket name from deployment outputs
Set-Location ..
Write-Host "Step 2: Getting S3 bucket name..." -ForegroundColor Yellow

$bucketName = ""
if (Test-Path "deployment-outputs-dev.txt") {
    $content = Get-Content "deployment-outputs-dev.txt" -Raw
    if ($content -match "FrontendBucket\s*=\s*(\S+)") {
        $bucketName = $matches[1]
        Write-Host "Found bucket: $bucketName" -ForegroundColor Gray
    }
}

if (-not $bucketName) {
    Write-Host "Error: Could not find S3 bucket name in deployment-outputs-dev.txt" -ForegroundColor Red
    Write-Host "Please enter bucket name manually:" -ForegroundColor Yellow
    $bucketName = Read-Host "S3 Bucket Name"
    
    if (-not $bucketName) {
        Write-Host "Error: Bucket name required" -ForegroundColor Red
        exit 1
    }
}

Write-Host "- Using bucket: $bucketName" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy to S3
Write-Host "Step 3: Deploying to S3..." -ForegroundColor Yellow
Write-Host "Syncing files to s3://$bucketName..." -ForegroundColor Gray

aws s3 sync frontend/dist/ "s3://$bucketName" --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: S3 sync failed" -ForegroundColor Red
    exit 1
}

Write-Host "- Files synced to S3" -ForegroundColor Green
Write-Host ""

# Step 4: Get CloudFront distribution ID
Write-Host "Step 4: Getting CloudFront distribution..." -ForegroundColor Yellow

$distributionId = ""
if (Test-Path "deployment-outputs-dev.txt") {
    $content = Get-Content "deployment-outputs-dev.txt" -Raw
    if ($content -match "CloudFrontDistributionId\s*=\s*(\S+)") {
        $distributionId = $matches[1]
        Write-Host "Found distribution: $distributionId" -ForegroundColor Gray
    }
}

if (-not $distributionId) {
    Write-Host "Warning: Could not find CloudFront distribution ID" -ForegroundColor Yellow
    Write-Host "Please enter distribution ID manually (or press Enter to skip):" -ForegroundColor Yellow
    $distributionId = Read-Host "CloudFront Distribution ID"
}

if ($distributionId) {
    # Step 5: Invalidate CloudFront cache
    Write-Host ""
    Write-Host "Step 5: Invalidating CloudFront cache..." -ForegroundColor Yellow
    Write-Host "Creating invalidation for distribution $distributionId..." -ForegroundColor Gray
    
    aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: CloudFront invalidation failed" -ForegroundColor Yellow
        Write-Host "You may need to manually invalidate the cache" -ForegroundColor Yellow
    } else {
        Write-Host "- CloudFront cache invalidated" -ForegroundColor Green
    }
} else {
    Write-Host "Skipping CloudFront invalidation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes deployed:" -ForegroundColor White
Write-Host "  - Added getVisibleCount() to CullingSystem" -ForegroundColor Green
Write-Host "  - Implemented circuit breaker with exponential backoff" -ForegroundColor Green
Write-Host "  - Added manual retry button for connection errors" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor Gray
Write-Host "  2. Open game view in browser" -ForegroundColor Gray
Write-Host "  3. Check console for errors" -ForegroundColor Gray
Write-Host "  4. Verify game loads without PixiJS crash" -ForegroundColor Gray
Write-Host "  5. Test circuit breaker by simulating backend errors" -ForegroundColor Gray
Write-Host ""
Write-Host "Monitoring:" -ForegroundColor White
Write-Host "  - Watch for '[GameView] Retrying in Xms' logs (normal backoff)" -ForegroundColor Gray
Write-Host "  - Watch for 'Backend polling stopped after 5 errors' (circuit breaker)" -ForegroundColor Gray
Write-Host "  - No more infinite 502 loops should occur" -ForegroundColor Gray
Write-Host ""
