# Instagram/Meta Credentials - Configuração Simples e Rápida
# Este script configura as credenciais diretamente no AWS

Write-Host "Configurando credenciais Instagram/Meta..." -ForegroundColor Cyan

# Credenciais
$APP_ID = "1680096733338103"
$APP_SECRET = "1ea026c9f6dc8d1ae77c3474a1220bcf"
$REDIRECT_URI = "http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback"

# Passo 1: Atualizar Secret (já existe)
Write-Host "[1/2] Atualizando AWS Secrets Manager..." -ForegroundColor Yellow
aws secretsmanager update-secret --secret-id experta/platform/meta --secret-string "{\"appId\":\"$APP_ID\",\"appSecret\":\"$APP_SECRET\",\"redirectUri\":\"$REDIRECT_URI\"}" --region us-east-1
Write-Host "Secret atualizado!" -ForegroundColor Green

# Passo 2: Obter ARN do Secret
$secretArn = aws secretsmanager describe-secret --secret-id experta/platform/meta --region us-east-1 --query 'ARN' --output text
Write-Host "Secret ARN: $secretArn" -ForegroundColor Gray

# Passo 3: Escrever metadata no DynamoDB (usando AWS CLI direto)
Write-Host "[2/2] Salvando metadata no DynamoDB..." -ForegroundColor Yellow
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

# Criar comando AWS CLI direto (sem arquivo temporário)
$cmd = "aws dynamodb put-item --table-name Experta-PlatformCredentials-dev --region us-east-1 --item '{\"platform\":{\"S\":\"meta\"},\"app_name\":{\"S\":\"Experta Meta App\"},\"client_id_secret_arn\":{\"S\":\"$secretArn\"},\"client_secret_arn\":{\"S\":\"$secretArn\"},\"redirect_uri\":{\"S\":\"$REDIRECT_URI\"},\"scopes\":{\"L\":[{\"S\":\"pages_manage_posts\"},{\"S\":\"instagram_basic\"},{\"S\":\"instagram_content_publish\"},{\"S\":\"pages_read_engagement\"}]},\"is_active\":{\"BOOL\":true},\"created_by\":{\"S\":\"admin-script\"},\"created_at\":{\"S\":\"$timestamp\"},\"updated_at\":{\"S\":\"$timestamp\"}}'"

Invoke-Expression $cmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Metadata salva com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Aviso: Metadata pode ter falhado, mas credenciais estão no Secrets Manager" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuração Completa!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Deploy: sam build && sam deploy --no-confirm-changeset" -ForegroundColor White
Write-Host "2. Configure no Meta Developer Console:" -ForegroundColor White
Write-Host "   https://developers.facebook.com/apps/$APP_ID" -ForegroundColor Cyan
Write-Host ""
