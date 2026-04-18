# Verify Node.js Runtime Upgrade Script (PowerShell)
# This script verifies that all Node.js Lambda functions are using nodejs20.x

Write-Host "Verifying Node.js Runtime Upgrade..." -ForegroundColor Cyan
Write-Host ""

# Check template.yaml for nodejs18.x (should find none)
Write-Host "Checking for nodejs18.x in template.yaml..." -ForegroundColor Yellow
$nodejs18Count = (Select-String -Path "template.yaml" -Pattern "nodejs18" -AllMatches).Matches.Count
if ($nodejs18Count -gt 0) {
    Write-Host "ERROR: Found nodejs18.x in template.yaml" -ForegroundColor Red
    Select-String -Path "template.yaml" -Pattern "nodejs18"
    exit 1
} else {
    Write-Host "No nodejs18.x found in template.yaml" -ForegroundColor Green
}

Write-Host ""

# Check template.yaml for nodejs20.x (should find all)
Write-Host "Checking for nodejs20.x in template.yaml..." -ForegroundColor Yellow
$nodejs20Count = (Select-String -Path "template.yaml" -Pattern "nodejs20" -AllMatches).Matches.Count
if ($nodejs20Count -ge 8) {
    Write-Host "Found $nodejs20Count occurrences of nodejs20.x" -ForegroundColor Green
} else {
    Write-Host "ERROR: Expected at least 8 occurrences of nodejs20.x, found $nodejs20Count" -ForegroundColor Red
    exit 1
}

Write-Host ""

# List all Node.js functions with their runtime
Write-Host "Node.js Lambda Functions:" -ForegroundColor Cyan
Write-Host "------------------------"
$runtimeLines = Select-String -Path "template.yaml" -Pattern "Runtime: nodejs" -Context 2,0
foreach ($line in $runtimeLines) {
    $functionName = ($line.Context.PreContext | Select-String -Pattern "Handler:").Line
    $runtime = $line.Line
    if ($functionName) {
        Write-Host "$functionName -> $runtime"
    }
}

Write-Host ""

# Check Lambda layer
Write-Host "Lambda Layer Configuration:" -ForegroundColor Cyan
Write-Host "--------------------------"
$layerLines = Select-String -Path "template.yaml" -Pattern "SharedNodeJSLayer:" -Context 0,5
Write-Host $layerLines.Line
$layerLines.Context.PostContext | Select-String -Pattern "(CompatibleRuntimes|nodejs)" | ForEach-Object { Write-Host $_.Line }

Write-Host ""

# Verify no engine restrictions in package.json files
Write-Host "Checking package.json files for engine restrictions..." -ForegroundColor Yellow
$packageFiles = Get-ChildItem -Path . -Filter "package.json" -Recurse -File
$enginesFound = $false
foreach ($file in $packageFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "`"engines`"") {
        $enginesFound = $true
        Write-Host "Found engine restriction in: $($file.FullName)" -ForegroundColor Yellow
    }
}
if (-not $enginesFound) {
    Write-Host "No engine restrictions found in package.json files" -ForegroundColor Green
}

Write-Host ""
Write-Host "Runtime upgrade verification complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run sam build to build with new runtime"
Write-Host "2. Run tests to verify compatibility"
Write-Host "3. Deploy to development environment"
Write-Host "4. Verify functionality"
Write-Host "5. Deploy to production"
