# Test Meta Publisher Function
# Fase 3 Dia 4 - Verification

Write-Host "Testing Meta Publisher Function" -ForegroundColor Cyan
Write-Host ""

# Invoke Lambda with file
Write-Host "Invoking Lambda function..." -ForegroundColor Yellow

$result = aws lambda invoke --function-name onzo-meta-publisher-dev --cli-binary-format raw-in-base64-out --payload file://test-event-meta-publisher.json response.json 2>&1

Write-Host $result
Write-Host ""

if (Test-Path response.json) {
    Write-Host "Response:" -ForegroundColor Yellow
    Get-Content response.json
    Write-Host ""
}

# Check logs
Write-Host "Recent logs:" -ForegroundColor Yellow
aws logs tail /aws/lambda/onzo-meta-publisher-dev --since 5m
