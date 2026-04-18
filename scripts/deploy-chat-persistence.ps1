# Deploy Chat Persistence Feature
# Implements conversation history across page reloads

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Chat Persistence Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Features Implemented:" -ForegroundColor Green
Write-Host "  ✓ OnzoChatHistory DynamoDB table" -ForegroundColor Green
Write-Host "  ✓ Chat history data access layer" -ForegroundColor Green
Write-Host "  ✓ Automatic message saving (user + assistant)" -ForegroundColor Green
Write-Host "  ✓ GET /chat/history API endpoint" -ForegroundColor Green
Write-Host "  ✓ Frontend history loading on mount" -ForegroundColor Green
Write-Host "  ✓ 90-day TTL for automatic cleanup" -ForegroundColor Green
Write-Host ""

Write-Host "Building SAM application..." -ForegroundColor Yellow
sam build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build successful! Deploying..." -ForegroundColor Green
Write-Host ""

sam deploy --no-confirm-changeset

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Chat Persistence Active:" -ForegroundColor Green
Write-Host "  • Conversations saved automatically" -ForegroundColor White
Write-Host "  • History restored on page reload" -ForegroundColor White
Write-Host "  • Last 20 messages displayed" -ForegroundColor White
Write-Host "  • 90-day automatic cleanup" -ForegroundColor White
Write-Host ""
Write-Host "Test the feature:" -ForegroundColor Yellow
Write-Host "  1. Send messages in chat" -ForegroundColor White
Write-Host "  2. Reload the page" -ForegroundColor White
Write-Host "  3. Verify conversation history appears" -ForegroundColor White
Write-Host ""
Write-Host "Monitor:" -ForegroundColor Yellow
Write-Host "  CloudWatch: /aws/lambda/chat-handler" -ForegroundColor White
Write-Host "  DynamoDB: OnzoChatHistory table" -ForegroundColor White
Write-Host ""
