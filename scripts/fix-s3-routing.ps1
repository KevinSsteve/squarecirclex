# Fix S3 Static Website Routing for React Router
# This configures S3 to redirect all routes to index.html

Write-Host "Fixing S3 routing for React Router..." -ForegroundColor Cyan

# Get bucket name
$bucketName = "experta-frontend-dev"

# Create routing rules JSON
$routingRules = @"
{
    "IndexDocument": {
        "Suffix": "index.html"
    },
    "ErrorDocument": {
        "Key": "index.html"
    }
}
"@

# Save to temp file with ASCII encoding to avoid BOM issues
$tempFile = "s3-website-config.json"
$routingRules | Out-File -FilePath $tempFile -Encoding ASCII -NoNewline

Write-Host "Applying website configuration..." -ForegroundColor Yellow

# Apply configuration
aws s3api put-bucket-website `
    --bucket $bucketName `
    --website-configuration file://$tempFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ S3 routing fixed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now you can access:" -ForegroundColor Yellow
    Write-Host "  http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Note: You may need to clear browser cache" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to apply configuration" -ForegroundColor Red
}

# Clean up
Remove-Item $tempFile -ErrorAction SilentlyContinue
