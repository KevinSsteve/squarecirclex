# Debug /app Route Script
# Opens a comprehensive diagnostic tool

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Debug /app Route Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Opening diagnostic tool..." -ForegroundColor Yellow
Write-Host ""

# Get the full path to the HTML file
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlPath = Join-Path $scriptPath "debug-app-route.html"

# Open in default browser
Start-Process $htmlPath

Write-Host "✅ Diagnostic tool opened!" -ForegroundColor Green
Write-Host ""
Write-Host "This tool will help identify why /app is redirecting:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Check localStorage state" -ForegroundColor White
Write-Host "2. Check authentication tokens" -ForegroundColor White
Write-Host "3. Check ViewToggle configuration" -ForegroundColor White
Write-Host "4. Clear all game data if needed" -ForegroundColor White
Write-Host "5. Force game view mode" -ForegroundColor White
Write-Host "6. Test /app route directly" -ForegroundColor White
Write-Host ""
Write-Host "Follow the instructions in the browser window." -ForegroundColor Yellow
Write-Host ""
