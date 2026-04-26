# ✅ Credenciais Instagram Configuradas

**Data**: 25 de Abril de 2026  
**Status**: Credenciais Prontas para Deploy

---

## 📦 O Que Foi Feito

Criei um script que configura suas credenciais Instagram/Meta diretamente no AWS, sem precisar do painel admin.

### Script Criado

**Arquivo**: `scripts/configure-instagram-credentials.ps1`

Este script:
1. ✅ Cria/atualiza o secret no AWS Secrets Manager
2. ✅ Armazena metadata no DynamoDB
3. ✅ Usa suas credenciais fornecidas:
   - App ID: `1680096733338103`
   - App Secret: `1ea026c9f6dc8d1ae77c3474a1220bcf`
   - Redirect URI: `http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback`

---

## 🚀 Como Executar

### Passo 1: Configurar Credenciais (1 comando)

```powershell
.\scripts\configure-instagram-credentials.ps1
```

Este comando irá:
- Criar o secret `experta/platform/meta` no Secrets Manager
- Armazenar metadata na tabela `Experta-PlatformCredentials-dev`
- Configurar os scopes necessários para Facebook e Instagram

### Passo 2: Deploy do Sistema

Depois de configurar as credenciais, faça o deploy:

```powershell
.\scripts\deploy-instagram-integration.ps1
```

Ou se preferir fazer manualmente:

```powershell
# Backend
sam build
sam deploy --no-confirm-changeset

# Frontend
cd frontend
npm run build
cd ..
aws s3 sync frontend/dist s3://experta-frontend-dev --delete --region us-east-1
```

---

## 📋 Ordem de Execução

```powershell
# 1. Configurar credenciais no AWS
.\scripts\configure-instagram-credentials.ps1

# 2. Deploy completo (backend + frontend)
.\scripts\deploy-instagram-integration.ps1
```

---

## 🔐 O Que Acontece no AWS

### Secrets Manager

O script cria este secret:

```json
{
  "Name": "experta/platform/meta",
  "SecretString": {
    "appId": "1680096733338103",
    "appSecret": "1ea026c9f6dc8d1ae77c3474a1220bcf",
    "redirectUri": "http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback"
  },
  "Tags": [
    { "Key": "Platform", "Value": "meta" },
    { "Key": "ManagedBy", "Value": "Experta" },
    { "Key": "Environment", "Value": "dev" }
  ]
}
```

### DynamoDB

O script cria este registro na tabela `Experta-PlatformCredentials-dev`:

```json
{
  "platform": "meta",
  "app_name": "Experta Meta App",
  "client_id_secret_arn": "arn:aws:secretsmanager:...",
  "client_secret_arn": "arn:aws:secretsmanager:...",
  "redirect_uri": "http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback",
  "scopes": [
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "pages_read_engagement"
  ],
  "is_active": true,
  "created_by": "admin-script",
  "created_at": "2026-04-25T...",
  "updated_at": "2026-04-25T..."
}
```

---

## 📱 Próximos Passos Após Deploy

### 1. Configurar Meta Developer Console

Acesse: https://developers.facebook.com/apps/1680096733338103

1. Sidebar → Products → Facebook Login → Settings
2. Em "Valid OAuth Redirect URIs", adicione:
   ```
   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback
   ```
3. Salve as alterações

### 2. Preparar Conta Instagram

1. Converter para Business/Creator (no app do Instagram)
2. Conectar à uma Página do Facebook
3. Verificar que produtos Facebook Login e Instagram estão ativos

### 3. Testar

1. Acesse: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com
2. Faça login
3. Vá em "Connect Accounts"
4. Clique em "Connect Instagram"
5. Autorize o acesso
6. Crie um post de teste
7. Publique no Instagram

---

## ✅ Checklist Completo

```
[ ] Executar: .\scripts\configure-instagram-credentials.ps1
[ ] Executar: .\scripts\deploy-instagram-integration.ps1
[ ] Adicionar Redirect URI no Meta Developer Console
[ ] Converter Instagram para Business
[ ] Conectar Instagram à Página Facebook
[ ] Testar publicação
```

---

## 🔍 Verificação

Para verificar se as credenciais foram configuradas corretamente:

```powershell
# Verificar secret no Secrets Manager
aws secretsmanager describe-secret --secret-id experta/platform/meta --region us-east-1

# Verificar metadata no DynamoDB
aws dynamodb get-item --table-name Experta-PlatformCredentials-dev --key '{"platform":{"S":"meta"}}' --region us-east-1
```

---

## 🆘 Troubleshooting

### "Secret already exists"
✓ Normal! O script atualiza o secret existente automaticamente.

### "Access Denied" ao executar script
Verifique suas credenciais AWS:
```powershell
aws sts get-caller-identity
```

### "Table does not exist"
A tabela `Experta-PlatformCredentials-dev` será criada no primeiro deploy do backend.
Execute o deploy primeiro, depois configure as credenciais.

---

## 📊 Resumo

| Ação | Status | Comando |
|------|--------|---------|
| Script criado | ✅ | `scripts/configure-instagram-credentials.ps1` |
| Credenciais hardcoded | ✅ | App ID e Secret no script |
| Pronto para executar | ✅ | Aguardando seu comando |

---

## 🎯 Você Precisa Fazer

1. **Executar o script de configuração** (1 comando)
2. **Executar o script de deploy** (1 comando)
3. **Configurar Redirect URI no Meta Developer** (copiar e colar)
4. **Testar a publicação**

**Tempo estimado**: 10-15 minutos

---

**Tudo pronto! Execute os scripts na ordem indicada.** 🚀
