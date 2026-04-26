# Clear Development Mode localStorage
# Opens an HTML page that clears localStorage
# Usage: .\scripts\run-localstorage-clear.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clear Development Mode localStorage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
$devServerUrl = "http://localhost:5173"
Write-Host "Checking dev server..." -ForegroundColor Yellow

try {
    $null = Invoke-WebRequest -Uri $devServerUrl -Method Head -TimeoutSec 2 -ErrorAction Stop
    Write-Host "OK Dev server is running" -ForegroundColor Green
} catch {
    Write-Host "WARNING Dev server not detected at $devServerUrl" -ForegroundColor Yellow
    Write-Host "Please start it with:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "Opening localStorage clear page..." -ForegroundColor Green

# Get the HTML file path
$htmlPath = Join-Path $PSScriptRoot "localstorage-clear.html"

if (Test-Path $htmlPath) {
    Start-Process $htmlPath
    
    Write-Host "OK Browser opened" -ForegroundColor Green
    Write-Host ""
    Write-Host "The page will automatically:" -ForegroundColor Cyan
    Write-Host "  1. Clear all game-related localStorage items" -ForegroundColor White
    Write-Host "  2. Show you what was cleared" -ForegroundColor White
    Write-Host "  3. Redirect to /app after 2 seconds" -ForegroundColor White
    Write-Host ""
    Write-Host "After clearing, you should see:" -ForegroundColor Cyan
    Write-Host "  - Yellow development mode banner" -ForegroundColor Green
    Write-Host "  - Game view loads without redirect" -ForegroundColor Green
    Write-Host "  - Console shows dev mode warnings" -ForegroundColor Green
} else {
    Write-Host "ERROR Could not find localstorage-clear.html" -ForegroundColor Red
    Write-Host "Expected at: $htmlPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Script Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
