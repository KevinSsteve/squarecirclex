# Restart Vite Dev Server with Environment Variables
# This script stops any running Vite processes and starts a new one
# ensuring that .env variables are properly loaded

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ONZO - Restart Dev Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running Vite processes
Write-Host "[1/3] Stopping existing Vite processes..." -ForegroundColor Yellow

# Find and kill Vite processes
$viteProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*vite*" -or $_.MainWindowTitle -like "*vite*"
}

if ($viteProcesses) {
    Write-Host "Found $($viteProcesses.Count) Vite process(es). Stopping..." -ForegroundColor Yellow
    $viteProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✓ Vite processes stopped" -ForegroundColor Green
} else {
    Write-Host "✓ No running Vite processes found" -ForegroundColor Green
}

Write-Host ""

# Step 2: Verify .env file
Write-Host "[2/3] Verifying .env configuration..." -ForegroundColor Yellow

$envPath = "frontend\.env"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    if ($envContent -match "VITE_DEV_MODE\s*=\s*true") {
        Write-Host "✓ VITE_DEV_MODE=true found in .env" -ForegroundColor Green
    } else {
        Write-Host "⚠ WARNING: VITE_DEV_MODE is not set to 'true' in .env" -ForegroundColor Red
        Write-Host "  The /app route may still redirect to onboarding" -ForegroundColor Red
    }
} else {
    Write-Host "✗ ERROR: .env file not found at $envPath" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Start new Vite server
Write-Host "[3/3] Starting Vite dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "The server will start in a new window." -ForegroundColor Cyan
Write-Host "Look for this message in the console:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [FeatureFlags] ⚠️  Development mode is ENABLED" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you see that message, dev mode is active!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to start the server..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Start Vite in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Server Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Wait for the server to start (check the new window)" -ForegroundColor White
Write-Host "2. Look for the 'Development mode is ENABLED' message" -ForegroundColor White
Write-Host "3. Access: http://localhost:5173/app" -ForegroundColor White
Write-Host "4. You should see a yellow 'Development Mode' banner" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
