# Clear ViewToggle Preference Script
# Opens a browser page to clear the viewToggle localStorage item

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Clear ViewToggle Preference" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Opening browser to clear viewToggle..." -ForegroundColor Yellow
Write-Host ""

# Get the full path to the HTML file
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlPath = Join-Path $scriptPath "clear-viewtoggle.html"

# Open in default browser
Start-Process $htmlPath

Write-Host "✅ Browser opened!" -ForegroundColor Green
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Cyan
Write-Host "1. Click 'Check Status' to see current viewToggle state" -ForegroundColor White
Write-Host "2. Click 'Clear ViewToggle' to remove the preference" -ForegroundColor White
Write-Host "3. Click 'Go to /app' to test the game view" -ForegroundColor White
Write-Host ""
Write-Host "This will reset your view preference to 'game' mode." -ForegroundColor Yellow
Write-Host ""
