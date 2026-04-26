# Clear Development Mode localStorage
# 
# This script opens your default browser with a JavaScript snippet
# that clears all game-related localStorage items and reloads the page.
#
# Usage: .\scripts\clear-dev-mode-localstorage-v2.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clear Development Mode localStorage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Detect if dev server is running
$devServerUrl = "http://localhost:5173"
$testConnection = $null

try {
    $testConnection = Invoke-WebRequest -Uri $devServerUrl -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
} catch {
    # Connection failed
}

if ($null -eq $testConnection) {
    Write-Host "⚠️  Dev server not detected at $devServerUrl" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please start the dev server first:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Do you want to start the dev server now? (y/n)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host ""
        Write-Host "Starting dev server..." -ForegroundColor Green
        Write-Host "Opening new terminal window..." -ForegroundColor Green
        
        # Start dev server in new terminal
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
        
        Write-Host ""
        Write-Host "Waiting for dev server to start (10 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        Write-Host ""
        Write-Host "Exiting. Please start the dev server and run this script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Dev server is running" -ForegroundColor Green
Write-Host ""

Write-Host "Opening browser with localStorage clear script..." -ForegroundColor Green
Write-Host ""

# Try to open in default browser
try {
    # Create temporary HTML file with auto-executing script
    $tempFile = [System.IO.Path]::GetTempFileName() + ".html"
    
    # Write HTML content directly to file
    @'
<!DOCTYPE html>
<html>
<head>
    <title>Clear Development Mode localStorage</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f3f4f6;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1f2937;
            margin-top: 0;
        }
        .status {
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 500;
        }
        .success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #10b981;
        }
        .info {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #3b82f6;
        }
        button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin-right: 10px;
        }
        button:hover {
            background: #2563eb;
        }
        button.secondary {
            background: #6b7280;
        }
        button.secondary:hover {
            background: #4b5563;
        }
        .console-output {
            margin-top: 20px;
            padding: 15px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧹 Clear Development Mode localStorage</h1>
        
        <div id="status" class="status info">
            ⏳ Preparing to clear localStorage...
        </div>
        
        <div class="console-output" id="console">
            <div>Console output will appear here...</div>
        </div>
        
        <div style="margin-top: 20px;">
            <button onclick="clearStorage()">Clear localStorage Now</button>
            <button class="secondary" onclick="window.location.href='http://localhost:5173/app'">Go to /app</button>
            <button class="secondary" onclick="window.location.href='http://localhost:5173/app?view=game'">Go to /app?view=game</button>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <h3>What This Does:</h3>
            <ul>
                <li>Clears <code>viewToggle</code> preference (fixes redirect issue)</li>
                <li>Clears <code>devModeBannerDismissed</code> state</li>
                <li>Clears all game-related preferences</li>
                <li>Reloads the page automatically</li>
            </ul>
            
            <h3>After Clearing:</h3>
            <ul>
                <li>✓ Yellow dev mode banner should appear</li>
                <li>✓ Game view should load without redirect</li>
                <li>✓ Console should show dev mode warnings</li>
            </ul>
        </div>
    </div>
    
    <script>
        const consoleDiv = document.getElementById('console');
        const statusDiv = document.getElementById('status');
        
        function log(message, color) {
            const div = document.createElement('div');
            div.style.color = color || '#1f2937';
            div.style.marginBottom = '5px';
            div.textContent = message;
            consoleDiv.appendChild(div);
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
        
        function clearStorage() {
            consoleDiv.innerHTML = '';
            statusDiv.className = 'status info';
            statusDiv.textContent = '⏳ Clearing localStorage...';
            
            log('🧹 Starting localStorage clear...', '#f59e0b');
            log('');
            
            const itemsToClear = [
                'viewToggle',
                'devModeBannerDismissed',
                'gamePreferences',
                'cameraPreferences',
                'userPreferences',
                'soundSettings',
                'accessibilitySettings'
            ];
            
            let clearedCount = 0;
            itemsToClear.forEach(key => {
                if (localStorage.getItem(key) !== null) {
                    log('✓ Cleared: ' + key, '#10b981');
                    localStorage.removeItem(key);
                    clearedCount++;
                } else {
                    log('- Not found: ' + key, '#6b7280');
                }
            });
            
            log('');
            log('✓ Cleared ' + clearedCount + ' items', '#10b981');
            log('');
            
            statusDiv.className = 'status success';
            statusDiv.textContent = '✓ localStorage cleared! Reloading in 2 seconds...';
            
            log('🔄 Reloading page...', '#3b82f6');
            
            setTimeout(() => {
                window.location.href = 'http://localhost:5173/app';
            }, 2000);
        }
        
        // Auto-execute after 1 second
        setTimeout(() => {
            log('Auto-executing in 3 seconds...', '#f59e0b');
            log('Click "Clear localStorage Now" to execute immediately', '#6b7280');
            
            setTimeout(clearStorage, 3000);
        }, 1000);
    </script>
</body>
</html>
'@ | Out-File -FilePath $tempFile -Encoding UTF8
    
    Start-Process $tempFile
    
    Write-Host "✓ Browser opened with clear script" -ForegroundColor Green
    Write-Host ""
    Write-Host "The script will:" -ForegroundColor Cyan
    Write-Host "  1. Clear all game-related localStorage items" -ForegroundColor White
    Write-Host "  2. Show you what was cleared" -ForegroundColor White
    Write-Host "  3. Automatically redirect to /app" -ForegroundColor White
    Write-Host ""
    Write-Host "After clearing, you should see:" -ForegroundColor Cyan
    Write-Host "  ✓ Yellow development mode banner" -ForegroundColor Green
    Write-Host "  ✓ Game view loads without redirect" -ForegroundColor Green
    Write-Host "  ✓ Console shows dev mode warnings" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to open browser: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual Instructions:" -ForegroundColor Yellow
    Write-Host "1. Open your browser" -ForegroundColor White
    Write-Host "2. Navigate to: http://localhost:5173/app" -ForegroundColor White
    Write-Host "3. Open browser console (F12)" -ForegroundColor White
    Write-Host "4. Paste and run this code:" -ForegroundColor White
    Write-Host ""
    Write-Host "localStorage.removeItem('viewToggle');" -ForegroundColor Gray
    Write-Host "localStorage.removeItem('devModeBannerDismissed');" -ForegroundColor Gray
    Write-Host "localStorage.removeItem('gamePreferences');" -ForegroundColor Gray
    Write-Host "location.reload();" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Script Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
