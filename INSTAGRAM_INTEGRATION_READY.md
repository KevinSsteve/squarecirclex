# Instagram Integration - Pronto para Configuração

**Data**: 2026-04-25  
**Status**: ✅ Código Implementado - Aguardando Configuração do Usuário

---

## 🎉 O Que Foi Feito

### 1. Backend Completo
- ✅ Handler Lambda para salvar credenciais (`functions/admin-settings/handler.js`)
- ✅ Integração com AWS Secrets Manager (armazenamento seguro)
- ✅ Validação de credenciais antes de salvar
- ✅ Endpoints API configurados no SAM template
- ✅ Suporte para HTTP e HTTPS (desenvolvimento e produção)

### 2. Frontend Completo
- ✅ Interface admin atualizada (`frontend/src/components/admin/PlatformConfig.jsx`)
- ✅ Integração real com API (removidos TODOs e simulações)
- ✅ Carregamento automático de configurações existentes
- ✅ Feedback visual de sucesso/erro
- ✅ Loading states e validação de formulários

### 3. Documentação
- ✅ Guia completo de setup (`INSTAGRAM_SETUP_INSTRUCTIONS.md`)
- ✅ Manual para adicionar admin (`ADD_ADMIN_USER_MANUAL.md`)
- ✅ Guia Meta Developer (`META_DEVELOPER_SETUP_GUIDE.md`)
- ✅ Script de deployment (`scripts/deploy-instagram-integration.ps1`)

---

## 🚀 Como Usar (Passo a Passo)

### Passo 1: Deploy do Sistema

Execute o script de deployment:

```powershell
.\scripts\deploy-instagram-integration.ps1
```

Este script irá:
1. Fazer build e deploy do backend (Lambda + API Gateway)
2. Fazer build do frontend (React + Vite)
3. Fazer deploy do frontend para S3

### Passo 2: Adicionar Seu Email como Admin

Você precisa ter acesso admin para configurar as credenciais.

**Opção Mais Fácil - Via AWS Console:**

1. Acesse: https://console.aws.amazon.com/cognito/
2. Região: **us-east-1** (N. Virginia)
3. Clique em "User pools"
4. Selecione: **us-east-1_J12Z1OVxM**
5. Menu lateral → "Groups"
6. Se o grupo "Admins" não existir, crie-o
7. Clique no grupo "Admins"
8. Clique em "Add user to group"
9. Selecione: **kevinalexandreestevesdossantos@gmail.com**
10. Clique em "Add"

**Detalhes completos em:** `ADD_ADMIN_USER_MANUAL.md`

### Passo 3: Acessar o Admin Panel

1. Faça logout (se estiver logado)
2. Faça login novamente
3. Acesse: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin
4. Você deve ver o painel de administração

### Passo 4: Configurar Credenciais Instagram/Meta

No painel admin:

1. Clique na aba **"Platform Configuration"**
2. Role até **"Meta Graph API (Facebook & Instagram)"**
3. Preencha os campos:

```
App ID: 1680096733338103
App Secret: 1ea026c9f6dc8d1ae77c3474a1220bcf
Redirect URI: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback
```

4. Clique em **"Save Meta Configuration"**
5. Aguarde a mensagem de sucesso

### Passo 5: Configurar Meta Developer Console

No Meta Developer Console (https://developers.facebook.com):

1. Acesse seu app (ID: 1680096733338103)
2. Sidebar → Products → Facebook Login → Settings
3. Em "Valid OAuth Redirect URIs", adicione:
   ```
   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback
   ```
4. Salve as alterações

### Passo 6: Preparar Conta Instagram

Sua conta Instagram deve ser Business ou Creator:

1. Abra o app do Instagram
2. Settings → Account → Switch to Professional Account
3. Escolha "Business" ou "Creator"
4. Conecte a uma Página do Facebook

### Passo 7: Testar a Integração

1. No sistema Experta, vá em **"Connect Accounts"**
2. Clique em **"Connect Facebook"** ou **"Connect Instagram"**
3. Autorize o acesso
4. Crie um post de teste no Chat
5. Publique no Instagram
6. Verifique se apareceu na sua conta

---

## 📋 Checklist Completo

### Deploy
- [ ] Executar `.\scripts\deploy-instagram-integration.ps1`
- [ ] Verificar que backend foi deployado com sucesso
- [ ] Verificar que frontend foi deployado com sucesso

### Configuração Admin
- [ ] Adicionar email como Admin no Cognito
- [ ] Fazer logout e login novamente
- [ ] Acessar /admin com sucesso

### Configuração Instagram/Meta
- [ ] Inserir App ID no admin panel
- [ ] Inserir App Secret no admin panel
- [ ] Inserir Redirect URI no admin panel
- [ ] Salvar configuração com sucesso
- [ ] Adicionar Redirect URI no Meta Developer Console

### Preparação Instagram
- [ ] Converter conta para Business/Creator
- [ ] Conectar Instagram à Página Facebook
- [ ] Verificar que produtos Facebook Login e Instagram estão ativos no Meta App

### Teste
- [ ] Conectar conta no sistema
- [ ] Criar post de teste
- [ ] Publicar no Instagram
- [ ] Verificar publicação no Instagram

---

## 🔧 Mudanças Técnicas Implementadas

### Backend (`functions/admin-settings/handler.js`)

**Antes:**
- Código básico sem validação completa

**Depois:**
- ✅ Validação de formato de credenciais
- ✅ Suporte para HTTP e HTTPS (dev e prod)
- ✅ Teste de conexão OAuth antes de salvar
- ✅ Armazenamento seguro no Secrets Manager
- ✅ Metadata no DynamoDB para auditoria
- ✅ Logs detalhados no CloudWatch

### Frontend (`frontend/src/components/admin/PlatformConfig.jsx`)

**Antes:**
- TODOs com chamadas simuladas
- Sem carregamento de configurações existentes
- Sem integração real com API

**Depois:**
- ✅ Integração real com API via `api.saveAdminSettings()`
- ✅ Carregamento automático de configurações existentes
- ✅ Loading state durante carregamento inicial
- ✅ Feedback de erro detalhado
- ✅ Máscaras de segurança para secrets

---

## 🎯 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin acessa /admin → Platform Configuration            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend carrega configurações existentes (GET)         │
│    GET /admin/settings?platform=meta                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Admin preenche/atualiza credenciais                     │
│    - App ID: 1680096733338103                              │
│    - App Secret: 1ea026c9f6dc8d1ae77c3474a1220bcf         │
│    - Redirect URI: http://...                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Admin clica "Save Meta Configuration"                   │
│    POST /admin/settings                                     │
│    { platform: "meta", credentials: {...} }                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Lambda valida credenciais                               │
│    - Formato do App ID (numérico)                          │
│    - Tamanho do App Secret (>20 chars)                     │
│    - Formato do Redirect URI (http/https)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Lambda salva no Secrets Manager                         │
│    Secret: experta/platform/meta                           │
│    Encrypted with KMS                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Lambda salva metadata no DynamoDB                       │
│    Table: Experta-PlatformCredentials-dev                  │
│    - platform, app_name, scopes, is_active, etc.           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Frontend recebe confirmação de sucesso                  │
│    "Meta credentials saved successfully"                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Usuário pode conectar contas Instagram                  │
│    /oauth/authorize/meta → usa credenciais salvas          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança

### Armazenamento de Credenciais
- ✅ Secrets Manager com criptografia KMS
- ✅ Nunca armazenadas em DynamoDB
- ✅ Acesso restrito apenas a Lambdas autorizadas
- ✅ Máscaras de segurança no frontend (mostra apenas 4 primeiros e 4 últimos caracteres)

### Validação
- ✅ Formato de App ID (deve ser numérico)
- ✅ Tamanho mínimo de App Secret (>20 caracteres)
- ✅ Formato de Redirect URI (http/https)
- ✅ Teste de conexão antes de salvar

### Auditoria
- ✅ Logs no CloudWatch com userId e timestamp
- ✅ Metadata no DynamoDB para rastreabilidade
- ✅ Histórico de quem criou/atualizou credenciais

---

## 📊 Estrutura de Dados

### Secrets Manager
```json
{
  "secretName": "experta/platform/meta",
  "secretValue": {
    "appId": "1680096733338103",
    "appSecret": "1ea026c9f6dc8d1ae77c3474a1220bcf",
    "redirectUri": "http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback"
  }
}
```

### DynamoDB (Experta-PlatformCredentials-dev)
```json
{
  "platform": "meta",
  "app_name": "Experta Meta App",
  "client_id_secret_arn": "arn:aws:secretsmanager:...",
  "client_secret_arn": "arn:aws:secretsmanager:...",
  "redirect_uri": "http://...",
  "scopes": [
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "pages_read_engagement"
  ],
  "is_active": true,
  "created_by": "user-sub-id",
  "created_at": "2026-04-25T...",
  "updated_at": "2026-04-25T..."
}
```

---

## 🐛 Troubleshooting

### "Access Denied" no Admin Panel
**Solução:** Certifique-se de estar no grupo "Admins" no Cognito e faça logout/login

### "Failed to save configuration"
**Possíveis causas:**
1. App ID não é numérico
2. App Secret muito curto (<20 caracteres)
3. Redirect URI inválido
4. Problemas de permissão IAM

**Solução:** Verifique os logs no CloudWatch:
```powershell
aws logs tail /aws/lambda/experta-admin-settings-dev --follow --region us-east-1
```

### "OAuth connection test failed"
**Solução:** Verifique se as credenciais estão corretas no Meta Developer Console

### Frontend não carrega configurações
**Solução:** Limpe o cache do navegador (Ctrl+F5) e verifique o console do navegador

---

## 📚 Documentação Relacionada

- `INSTAGRAM_SETUP_INSTRUCTIONS.md` - Guia completo de setup
- `ADD_ADMIN_USER_MANUAL.md` - Como adicionar admin no Cognito
- `META_DEVELOPER_SETUP_GUIDE.md` - Configuração no Meta Developer
- `PROXIMOS_PASSOS_META_INTEGRATION.md` - Próximos passos após configuração

---

## ✅ Status Atual

| Componente | Status | Observações |
|------------|--------|-------------|
| Backend Lambda | ✅ Implementado | Pronto para deploy |
| API Endpoints | ✅ Configurado | /admin/settings GET/POST |
| Frontend UI | ✅ Implementado | Integração real com API |
| Secrets Manager | ✅ Configurado | Armazenamento seguro |
| DynamoDB Table | ✅ Configurado | Metadata e auditoria |
| Documentação | ✅ Completa | Guias detalhados |
| Script Deploy | ✅ Criado | deploy-instagram-integration.ps1 |

---

## 🎯 Próximos Passos

1. **Agora**: Execute `.\scripts\deploy-instagram-integration.ps1`
2. **Depois**: Adicione seu email como Admin (veja `ADD_ADMIN_USER_MANUAL.md`)
3. **Em seguida**: Configure as credenciais no Admin Panel
4. **Teste**: Conecte sua conta e publique um post
5. **Produção**: Quando estiver pronto, solicite App Review da Meta

---

**Tudo pronto para deployment! Execute o script e siga os passos acima.** 🚀
