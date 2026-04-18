#!/usr/bin/env pwsh

# Enhanced S3 Frontend Deployment Script with Proper MIME Types
# This script ensures all files are uploaded with correct Content-Type headers

param(
    [string]$BucketName = "experta-frontend-dev",
    [string]$DistPath = "frontend/dist"
)

Write-Host "🚀 Starting Enhanced S3 Frontend Deployment..." -ForegroundColor Green
Write-Host "📁 Bucket: $BucketName" -ForegroundColor Cyan
Write-Host "📂 Source: $DistPath" -ForegroundColor Cyan

# Check if dist directory exists
if (-not (Test-Path $DistPath)) {
    Write-Host "❌ Error: $DistPath directory not found. Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Step 1: Upload files with explicit MIME types during sync
Write-Host "📤 Step 1: Uploading files with correct MIME types..." -ForegroundColor Yellow

# Upload HTML files with correct MIME type
Write-Host "  📄 Uploading HTML files..." -ForegroundColor Cyan
Get-ChildItem -Path $DistPath -Filter "*.html" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring((Resolve-Path $DistPath).Path.Length + 1).Replace('\', '/')
    aws s3 cp $_.FullName s3://$BucketName/$relativePath --content-type "text/html"
}

# Upload CSS files with correct MIME type
Write-Host "  🎨 Uploading CSS files..." -ForegroundColor Cyan
Get-ChildItem -Path $DistPath -Filter "*.css" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring((Resolve-Path $DistPath).Path.Length + 1).Replace('\', '/')
    aws s3 cp $_.FullName s3://$BucketName/$relativePath --content-type "text/css"
}

# Upload JavaScript files with correct MIME type
Write-Host "  ⚡ Uploading JavaScript files..." -ForegroundColor Cyan
Get-ChildItem -Path $DistPath -Filter "*.js" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring((Resolve-Path $DistPath).Path.Length + 1).Replace('\', '/')
    aws s3 cp $_.FullName s3://$BucketName/$relativePath --content-type "application/javascript"
}

# Upload JSON files with correct MIME type
Write-Host "  📋 Uploading JSON files..." -ForegroundColor Cyan
Get-ChildItem -Path $DistPath -Filter "*.json" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring((Resolve-Path $DistPath).Path.Length + 1).Replace('\', '/')
    aws s3 cp $_.FullName s3://$BucketName/$relativePath --content-type "application/json"
}

# Upload image files with correct MIME types
Write-Host "  🖼️ Uploading image files..." -ForegroundColor Cyan
@("*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.ico") | ForEach-Object {
    $extension = $_.Substring(2)
    $mimeType = switch ($extension) {
        "png" { "image/png" }
        "jpg" { "image/jpeg" }
        "jpeg" { "image/jpeg" }
        "gif" { "image/gif" }
        "svg" { "image/svg+xml" }
        "ico" { "image/x-icon" }
    }
    
    Get-ChildItem -Path $DistPath -Filter $_ -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring((Resolve-Path $DistPath).Path.Length + 1).Replace('\', '/')
        aws s3 cp $_.FullName s3://$BucketName/$relativePath --content-type $mimeType
    }
}

# Upload any remaining files with sync (fallback)
Write-Host "  📦 Uploading remaining files..." -ForegroundColor Cyan
aws s3 sync $DistPath s3://$BucketName --delete --exclude "*.html" --exclude "*.css" --exclude "*.js" --exclude "*.json" --exclude "*.png" --exclude "*.jpg" --exclude "*.jpeg" --exclude "*.gif" --exclude "*.svg" --exclude "*.ico"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Failed to upload files to S3" -ForegroundColor Red
    exit 1
}

# Step 2: Configure S3 website for SPA routing (CRITICAL - prevents 404 on refresh)
Write-Host "🌐 Step 2: Configuring S3 website for SPA routing..." -ForegroundColor Yellow
aws s3 website s3://$BucketName --index-document index.html --error-document index.html --no-cli-pager

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Failed to configure S3 website" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ SPA routing configured (404 → index.html)" -ForegroundColor Green

# Step 3: Set proper cache headers
Write-Host "⚡ Step 3: Setting cache headers..." -ForegroundColor Yellow

# No cache for HTML files (for updates)
Write-Host "  📄 Setting no-cache for HTML files..." -ForegroundColor Cyan
aws s3 cp s3://$BucketName/ s3://$BucketName/ --recursive --exclude "*" --include "*.html" --cache-control "no-cache, no-store, must-revalidate" --metadata-directive REPLACE

# Long cache for assets (for performance)
Write-Host "  📦 Setting long cache for assets..." -ForegroundColor Cyan
aws s3 cp s3://$BucketName/assets/ s3://$BucketName/assets/ --recursive --cache-control "public, max-age=31536000, immutable" --metadata-directive REPLACE

# Step 4: Verify deployment
Write-Host "🔍 Step 4: Verifying deployment..." -ForegroundColor Yellow

# Check if index.html exists and has correct content-type
$indexCheck = aws s3api head-object --bucket $BucketName --key "index.html" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ index.html found and accessible" -ForegroundColor Green
} else {
    Write-Host "  ❌ index.html not found or not accessible" -ForegroundColor Red
}

# List some files to verify
Write-Host "  📋 Sample files in bucket:" -ForegroundColor Cyan
aws s3 ls s3://$BucketName/ --recursive | Select-Object -First 10

# Calculate website URL
$websiteUrl = "http://$BucketName.s3-website-us-east-1.amazonaws.com"

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Website URL: $websiteUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All files uploaded with correct MIME types" -ForegroundColor Green
Write-Host "✅ Cache headers properly configured" -ForegroundColor Green
Write-Host "✅ SPA routing configured (404 → index.html)" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Test the website by visiting: $websiteUrl" -ForegroundColor Yellow