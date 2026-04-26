# Clear Development Mode localStorage - Simple Version
# 
# This script creates an HTML file that clears localStorage
#
# Usage: .\scripts\clear-dev-mode-localstorage-simple.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clear Development Mode localStorage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
$devServerUrl = "http://localhost:5173"
try {
    $null = Invoke-WebRequest -Uri $devServerUrl -Method Head -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Dev server is running at $devServerUrl" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Dev server not detected at $devServerUrl" -ForegroundColor Yellow
    Write-Host "Please start it with: cd frontend && npm run dev" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "Creating localStorage clear page..." -ForegroundColor Green

# Create HTML file
$htmlPath = Join-Path $env:TEMP "clear-localstorage.html"

$htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Clear localStorage</title>
    <style>
        body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; }
        button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; margin: 10px 5px; }
        button:hover { background: #2563eb; }
        .output { margin-top: 20px; padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-family: monospace; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧹 Clear Development Mode localStorage</h1>
        <p>This will clear all game-related localStorage items.</p>
        <button onclick="clearAndReload()">Clear localStorage & Reload</button>
        <button onclick="window.location.href='http://localhost:5173/app'">Go to /app</button>
        <div class="output" id="output">Ready to clear...</div>
    </div>
    <script>
        function clearAndReload() {
            const output = document.getElementById('output');
            output.innerHTML = '';
            const items = ['viewToggle', 'devModeBannerDismissed', 'gamePreferences', 'cameraPreferences', 'userPreferences', 'soundSettings', 'accessibilitySettings'];
            let cleared = 0;
            items.forEach(key => {
                if (localStorage.getItem(key) !== null) {
                    localStorage.removeItem(key);
                    output.innerHTML += '✓ Cleared: ' + key + '<br>';
                    cleared++;
                } else {
                    output.innerHTML += '- Not found: ' + key + '<br>';
                }
            });
            output.innerHTML += '<br>✓ Cleared ' + cleared + ' items<br>🔄 Reloading in 2 seconds...';
            setTimeout(() => { window.location.href = 'http://localhost:5173/app'; }, 2000);
        }
        setTimeout(clearAndReload, 1000);
    </script>
</body>
</html>
"@

$htmlContent | Out-File -FilePath $htmlPath -Encoding UTF8

# Open in browser
Start-Process $htmlPath

Write-Host "✓ Browser opened with clear script" -ForegroundColor Green
Write-Host ""
Write-Host "The page will automatically:" -ForegroundColor Cyan
Write-Host "  1. Clear all game-related localStorage items" -ForegroundColor White
Write-Host "  2. Show you what was cleared" -ForegroundColor White
Write-Host "  3. Redirect to /app after 2 seconds" -ForegroundColor White
Write-Host ""
Write-Host "After clearing, you should see:" -ForegroundColor Cyan
Write-Host "  ✓ Yellow development mode banner" -ForegroundColor Green
Write-Host "  ✓ Game view loads without redirect" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
