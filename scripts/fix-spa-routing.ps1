# Fix SPA Routing for React Router on S3 Static Website

Write-Host "Fixing SPA Routing for React Router on S3..." -ForegroundColor Cyan

# S3 bucket name
$bucketName = "experta-frontend-dev"

# Copy index.html to chat route
Write-Host "Creating route: /chat" -ForegroundColor Yellow
aws s3 cp s3://$bucketName/index.html s3://$bucketName/chat/index.html --content-type "text/html"

Write-Host "Creating route: /signup" -ForegroundColor Yellow  
aws s3 cp s3://$bucketName/index.html s3://$bucketName/signup/index.html --content-type "text/html"

Write-Host "Creating route: /dashboard" -ForegroundColor Yellow
aws s3 cp s3://$bucketName/index.html s3://$bucketName/dashboard/index.html --content-type "text/html"

Write-Host "Creating route: /onboarding" -ForegroundColor Yellow
aws s3 cp s3://$bucketName/index.html s3://$bucketName/onboarding/index.html --content-type "text/html"

Write-Host ""
Write-Host "Testing /chat route..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://$bucketName.s3-website-us-east-1.amazonaws.com/chat" -Method GET -TimeoutSec 10
    Write-Host "SUCCESS: /chat route works! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: /chat route failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "SPA Routing Fix Complete!" -ForegroundColor Green