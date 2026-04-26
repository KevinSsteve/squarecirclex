# Force Browser Refresh Script
# Opens the cache clearing page in the default browser

Write-Host "🔄 Abrindo página de limpeza de cache..." -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlFile = Join-Path $scriptPath "force-browser-refresh.html"

if (Test-Path $htmlFile) {
    Write-Host "✅ Arquivo encontrado: $htmlFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Instruções:" -ForegroundColor Yellow
    Write-Host "1. A página será aberta no seu navegador" -ForegroundColor White
    Write-Host "2. Siga as instruções na página para limpar o cache" -ForegroundColor White
    Write-Host "3. Use Ctrl+Shift+R para forçar o reload" -ForegroundColor White
    Write-Host ""
    
    # Open in default browser
    Start-Process $htmlFile
    
    Write-Host "✅ Página aberta!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Dica: Depois de limpar o cache, volte para http://localhost:5173/app" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro: Arquivo não encontrado: $htmlFile" -ForegroundColor Red
    exit 1
}
