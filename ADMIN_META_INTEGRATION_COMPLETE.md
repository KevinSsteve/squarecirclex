# Admin Meta Integration - Implementação Completa

**Data**: 2026-04-23  
**Status**: ✅ Completo  
**Orçamento Usado**: ~20 créditos

---

## 🎯 Objetivo

Expandir a página de admin para permitir configuração das credenciais da Meta API (Facebook e Instagram), preparando o sistema para a Fase 3 da integração.

---

## ✅ O Que Foi Implementado

### 1. Frontend - PlatformConfig.jsx Expandido

**Arquivo**: `frontend/src/components/admin/PlatformConfig.jsx`

**Mudanças**:
- ✅ Adicionado estado `metaConfig` para armazenar credenciais Meta
- ✅ Adicionado handler `handleMetaChange` para atualizar campos
- ✅ Adicionado handler `handleSaveMeta` para salvar credenciais
- ✅ Criada seção completa de configuração Meta com:
  - Campo App ID
  - Campo App Secret (tipo password)
  - Campo Redirect URI
  - Botão "Save Meta Configuration"
- ✅ Adicionadas instruções detalhadas de setup para:
  - Meta (Facebook/Instagram)
  - Instagram Business Account
  - LinkedIn
- ✅ Links diretos para portais de desenvolvedores
- ✅ Lista de permissões necessárias para cada plataforma

**Campos Meta**:
```javascript
{
  appId: '',        // Meta App ID (numérico)
  appSecret: '',    // Meta App Secret
  redirectUri: ''   // OAuth redirect URI (HTTPS obrigatório)
}
```

**Permissões Meta**:
- `pages_manage_posts` - Publicar em páginas do Facebook
- `instagram_basic` - Acesso básico ao Instagram
- `instagram_content_publish` - Publicar conteúdo no Instagram
- `pages_read_engagement` - Ler engajamento das páginas

---

### 2. Backend - Admin Settings Handler Expandido

**Arquivo**: `functions/admin-settings/handler.js`

**Mudanças**:
- ✅ Adicionado suporte para plataforma "meta" em todas as validações
- ✅ Atualizado `handleSaveSettings` para aceitar "meta"
- ✅ Atualizado `handleGetSettings` para retornar configurações "meta"
- ✅ Adicionada validação de credenciais Meta em `testOAuthConnection`:
  - App ID deve ser numérico
  - App Secret deve ter pelo menos 20 caracteres
  - Redirect URI deve usar HTTPS
- ✅ Configuração automática de scopes Meta:
  - `pages_manage_posts`
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_read_engagement`

**Validação de Credenciais**:
```javascript
if (platform === 'meta') {
  if (!credentials.appId || !credentials.appSecret || !credentials.redirectUri) {
    return createResponse(400, { 
      error: 'Meta credentials must include appId, appSecret, and redirectUri' 
    });
  }
}
```

**Teste de Conexão**:
```javascript
else if (platform === 'meta') {
  // Validate Meta credentials format
  if (!credentials.appId.match(/^\d+$/)) {
    return { success: false, error: 'Invalid Meta App ID format (must be numeric)' };
  }
  if (credentials.appSecret.length < 20) {
    return { success: false, error: 'Meta App Secret appears too short' };
  }
  if (!credentials.redirectUri.startsWith('https://')) {
    return { success: false, error: 'Redirect URI must use HTTPS' };
  }
  
  return { 
    success: true, 
    message: 'Meta credentials validated successfully' 
  };
}
```

---

## 🔐 Segurança

### Armazenamento de Credenciais
- ✅ Credenciais armazenadas no AWS Secrets Manager (nunca no DynamoDB)
- ✅ Criptografia com KMS
- ✅ Apenas metadados no DynamoDB (ARNs, redirect URIs, scopes)
- ✅ Secrets mascarados ao retornar para frontend (apenas primeiros e últimos 4 caracteres)

### Validação
- ✅ Validação de formato antes de salvar
- ✅ Teste de conexão antes de persistir
- ✅ HTTPS obrigatório para redirect URIs
- ✅ Logs de auditoria no CloudWatch

---

## 📋 Como Usar

### 1. Criar Meta App

1. Acesse [Meta for Developers](https://developers.facebook.com)
2. Clique em "My Apps" → "Create App"
3. Escolha tipo "Business"
4. Preencha informações do app
5. Adicione produtos:
   - Facebook Login
   - Instagram Graph API

### 2. Configurar Permissões

1. Vá em "App Settings" → "Basic"
2. Adicione domínio do app
3. Vá em "Facebook Login" → "Settings"
4. Adicione OAuth Redirect URIs:
   ```
   https://your-domain.com/oauth/meta/callback
   ```
5. Solicite permissões avançadas:
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`

### 3. Conectar Instagram Business Account

1. Certifique-se de ter uma conta Instagram Business
2. Conecte a conta Instagram a uma Página do Facebook
3. Use o mesmo Meta App para ambas as plataformas

### 4. Configurar no Admin Panel

1. Faça login como admin
2. Vá para Admin → Platform Configuration
3. Role até "Meta Graph API (Facebook & Instagram)"
4. Preencha:
   - App ID (copie do Meta for Developers)
   - App Secret (copie do Meta for Developers)
   - Redirect URI (URL do seu sistema)
5. Clique em "Save Meta Configuration"
6. Verifique mensagem de sucesso

---

## 🔄 Fluxo de Dados

### Salvando Credenciais

```
Frontend (PlatformConfig.jsx)
  ↓ handleSaveMeta()
  ↓ POST /admin/settings
Backend (admin-settings/handler.js)
  ↓ handleSaveSettings()
  ↓ Validar credenciais
  ↓ testOAuthConnection()
  ↓ Salvar no Secrets Manager
  ↓ Salvar metadata no DynamoDB
  ↓ Log no CloudWatch
  ↓ Retornar sucesso
Frontend
  ↓ Mostrar mensagem de sucesso
```

### Recuperando Credenciais

```
Frontend (PlatformConfig.jsx)
  ↓ GET /admin/settings?platform=meta
Backend (admin-settings/handler.js)
  ↓ handleGetSettings()
  ↓ Buscar no Secrets Manager
  ↓ Mascarar secrets
  ↓ Retornar credenciais mascaradas
Frontend
  ↓ Exibir credenciais (secrets mascarados)
```

---

## 📊 Estrutura de Dados

### Secrets Manager
```json
{
  "secretName": "experta/platform/meta",
  "secretValue": {
    "appId": "1234567890",
    "appSecret": "abc123def456...",
    "redirectUri": "https://your-domain.com/oauth/meta/callback"
  }
}
```

### DynamoDB - Platform_Credentials
```json
{
  "platform": "meta",
  "app_name": "Experta Meta App",
  "client_id_secret_arn": "arn:aws:secretsmanager:...",
  "client_secret_arn": "arn:aws:secretsmanager:...",
  "redirect_uri": "https://your-domain.com/oauth/meta/callback",
  "scopes": [
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "pages_read_engagement"
  ],
  "is_active": true,
  "created_by": "admin-user-id",
  "created_at": "2026-04-23T10:00:00.000Z",
  "updated_at": "2026-04-23T10:00:00.000Z"
}
```

---

## 🎯 Próximos Passos (Fase 3)

### Dia 1: Meta Graph API Client (~80 créditos)
- [ ] Criar `lib/nodejs/integrations/meta-graph-client.js`
- [ ] Implementar métodos:
  - `publishToFacebook(pageId, content, imageUrl)`
  - `publishToInstagram(accountId, content, imageUrl)`
  - `uploadMedia(file, platform)`
  - `getPageInfo(pageId)`
  - `getInstagramAccountInfo(accountId)`
- [ ] Implementar retry logic e rate limiting
- [ ] Criar testes unitários

### Dia 2: Integração com Backend (~80 créditos)
- [ ] Atualizar chat handler para publicar na Meta
- [ ] Criar função `meta-publisher` Lambda
- [ ] Atualizar Posts API com status Meta
- [ ] Atualizar template.yaml

### Dia 3: Testes de Integração (~80 créditos)
- [ ] Configurar ambiente de teste Meta
- [ ] Testes end-to-end de publicação
- [ ] Testes de edge cases
- [ ] Validar logs e monitoramento

### Dia 4: Deploy e Validação (~80 créditos)
- [ ] Deploy em staging
- [ ] Testes em staging
- [ ] Deploy em produção
- [ ] Documentação

### Dia 5: Buffer e Ajustes (~80 créditos)
- [ ] Correções de bugs
- [ ] Melhorias de UX
- [ ] Testes finais

---

## ✅ Checklist de Implementação

### Frontend
- [x] Adicionar estado metaConfig
- [x] Adicionar handler handleMetaChange
- [x] Adicionar handler handleSaveMeta
- [x] Criar seção de configuração Meta
- [x] Adicionar instruções de setup
- [x] Adicionar links para portais de desenvolvedores

### Backend
- [x] Adicionar suporte para plataforma "meta"
- [x] Validar credenciais Meta
- [x] Implementar teste de conexão Meta
- [x] Configurar scopes Meta
- [x] Salvar no Secrets Manager
- [x] Salvar metadata no DynamoDB
- [x] Logs de auditoria

### Segurança
- [x] Criptografia KMS
- [x] Secrets Manager
- [x] Validação de formato
- [x] HTTPS obrigatório
- [x] Mascaramento de secrets
- [x] Logs de auditoria

---

## 📝 Notas Importantes

### Meta vs Instagram
- **Meta App** é usado para AMBOS Facebook e Instagram
- Instagram Business Account deve estar conectado a uma Página do Facebook
- Mesmas credenciais (App ID e App Secret) para ambas as plataformas
- Permissões diferentes para cada plataforma

### Permissões
- **Facebook**: `pages_manage_posts`, `pages_read_engagement`
- **Instagram**: `instagram_basic`, `instagram_content_publish`
- Todas as permissões devem ser aprovadas pela Meta (processo de revisão)

### Limitações
- Instagram só permite publicação em contas Business/Creator
- Facebook requer que o app esteja em modo "Live" para publicação real
- Rate limits da Meta API devem ser respeitados

---

## 🚀 Status

**Implementação**: ✅ Completa  
**Testes**: ⏳ Pendente (aguardando deploy)  
**Deploy**: ⏳ Pendente  
**Documentação**: ✅ Completa

**Próximo Passo**: Implementar Meta Graph API Client (Dia 1 da Fase 3)

---

## 📞 Recursos

### Documentação Meta
- [Meta for Developers](https://developers.facebook.com)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Facebook Pages API](https://developers.facebook.com/docs/pages)

### Guias de Setup
- [Create a Meta App](https://developers.facebook.com/docs/development/create-an-app)
- [Facebook Login Setup](https://developers.facebook.com/docs/facebook-login/web)
- [Instagram Business Account](https://help.instagram.com/502981923235522)

---

**Implementado por**: Kiro AI  
**Data**: 2026-04-23  
**Orçamento**: ~20 créditos (dentro do limite de 500)
