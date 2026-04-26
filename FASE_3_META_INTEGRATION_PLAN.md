# Fase 3: Integração Meta API - Plano Detalhado

**Data**: 2026-04-23  
**Orçamento**: ~400 créditos  
**Duração**: 4-5 dias  
**Status**: Pronto para Implementação

---

## 🎯 Objetivo

Integrar a plataforma Experta com a Meta Graph API para permitir publicação automática de posts no Facebook e Instagram.

---

## 📋 Tarefas Detalhadas

### Dia 1: Meta Graph API Client (~80 créditos)

**Tarefa 1.1: Criar Meta Graph API Client Library**
- Criar `lib/nodejs/integrations/meta-graph-client.js`
- Implementar autenticação com access tokens
- Implementar métodos:
  - `publishToFacebook(pageId, content, imageUrl)`
  - `publishToInstagram(accountId, content, imageUrl)`
  - `uploadMedia(file, platform)`
  - `getPageInfo(pageId)`
  - `getInstagramAccountInfo(accountId)`
- Implementar retry logic com exponential backoff
- Implementar rate limiting
- Error handling robusto
- _Requirements: 3.1, 3.2, 3.3_

**Tarefa 1.2: Criar testes para Meta Graph Client**
- Unit tests para cada método
- Mock das chamadas HTTP
- Testes de error handling
- Testes de retry logic
- _Requirements: 3.1, 3.2, 3.3_

**Tarefa 1.3: Adicionar Meta credentials ao DynamoDB**
- Atualizar schema da tabela Platform_Credentials
- Adicionar campos:
  - `facebook_page_id`
  - `facebook_page_access_token`
  - `instagram_account_id`
  - `instagram_access_token`
- Criar migration script se necessário
- _Requirements: 2.3, 3.1_

---

### Dia 2: Integração com Backend (~80 créditos)

**Tarefa 2.1: Atualizar Chat Handler para publicar na Meta**
- Modificar `functions/chat-handler/handler.js`
- Adicionar lógica de publicação após geração de conteúdo
- Integrar com Meta Graph Client
- Atualizar status do post no DynamoDB
- Adicionar logs de publicação
- _Requirements: 3.2, 3.3, 4.1_

**Tarefa 2.2: Criar função de publicação assíncrona**
- Criar `functions/meta-publisher/handler.js`
- Processar eventos de publicação via EventBridge
- Publicar no Facebook e/ou Instagram
- Atualizar status no DynamoDB
- Enviar notificações de sucesso/erro
- _Requirements: 3.2, 3.3, 4.1_

**Tarefa 2.3: Atualizar Posts API para incluir status Meta**
- Adicionar campos de status de publicação:
  - `facebook_post_id`
  - `facebook_published_at`
  - `instagram_post_id`
  - `instagram_published_at`
  - `publication_errors`
- Retornar status na API
- _Requirements: 3.3, 4.1_

**Tarefa 2.4: Atualizar template.yaml**
- Adicionar função meta-publisher
- Configurar EventBridge rule
- Adicionar permissões IAM necessárias
- Configurar variáveis de ambiente
- _Requirements: 3.1, 3.2_

---

### Dia 3: Testes de Integração (~80 créditos)

**Tarefa 3.1: Criar ambiente de teste Meta**
- Configurar Meta App de teste
- Criar página de teste no Facebook
- Criar conta de teste no Instagram
- Documentar credenciais de teste
- _Requirements: 3.1, 3.2_

**Tarefa 3.2: Testes end-to-end de publicação**
- Testar fluxo completo: chat → geração → publicação
- Testar publicação no Facebook
- Testar publicação no Instagram
- Testar publicação com imagem
- Testar publicação sem imagem
- Testar error handling
- _Requirements: 3.2, 3.3, 4.1_

**Tarefa 3.3: Testes de edge cases**
- Testar com token expirado
- Testar com credenciais inválidas
- Testar com rate limiting
- Testar com conteúdo muito longo
- Testar com imagem muito grande
- _Requirements: 3.2, 3.3_

**Tarefa 3.4: Validar logs e monitoramento**
- Verificar logs no CloudWatch
- Validar métricas de publicação
- Testar alertas de erro
- Documentar troubleshooting
- _Requirements: 12.1, 12.2_

---

### Dia 4: Deploy e Validação (~80 créditos)

**Tarefa 4.1: Deploy em ambiente de staging**
- Build do SAM project
- Deploy via `sam deploy`
- Validar todas as funções
- Testar endpoints
- _Requirements: 13.1, 13.2_

**Tarefa 4.2: Testes em staging**
- Executar suite completa de testes
- Validar integração com Meta
- Testar com dados reais (não-produção)
- Verificar performance
- _Requirements: 3.2, 3.3, 4.1_

**Tarefa 4.3: Deploy em produção**
- Backup de configurações
- Deploy em produção
- Smoke tests
- Monitorar logs
- _Requirements: 13.1, 13.2_

**Tarefa 4.4: Documentação**
- Atualizar README com instruções Meta
- Documentar processo de configuração
- Criar guia de troubleshooting
- Documentar limitações conhecidas
- _Requirements: 3.1, 3.2_

---

### Dia 5: Buffer e Ajustes (~80 créditos)

**Tarefa 5.1: Correções de bugs**
- Corrigir issues encontrados em testes
- Ajustar error handling
- Otimizar performance
- _Requirements: Todos_

**Tarefa 5.2: Melhorias de UX**
- Adicionar feedback visual de publicação
- Melhorar mensagens de erro
- Adicionar loading states
- _Requirements: 4.1, 4.2_

**Tarefa 5.3: Testes finais**
- Validação completa end-to-end
- Testes de regressão
- Validação de segurança
- _Requirements: Todos_

---

## 🔧 Componentes Técnicos

### 1. Meta Graph API Client

```javascript
// lib/nodejs/integrations/meta-graph-client.js
class MetaGraphClient {
  constructor(config) {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    this.config = config;
  }

  async publishToFacebook(pageId, content, imageUrl) {
    // Implementação
  }

  async publishToInstagram(accountId, content, imageUrl) {
    // Implementação
  }

  async uploadMedia(file, platform) {
    // Implementação
  }

  async refreshAccessToken(refreshToken) {
    // Implementação
  }
}
```

### 2. Meta Publisher Function

```javascript
// functions/meta-publisher/handler.js
exports.handler = async (event) => {
  // 1. Extrair dados do evento
  // 2. Buscar credenciais do DynamoDB
  // 3. Publicar via Meta Graph Client
  // 4. Atualizar status no DynamoDB
  // 5. Enviar notificação
};
```

### 3. DynamoDB Schema Updates

```javascript
// Platform_Credentials table
{
  brand_id: 'string',
  platform: 'meta',
  credentials: {
    facebook_page_id: 'string',
    facebook_page_access_token: 'encrypted',
    instagram_account_id: 'string',
    instagram_access_token: 'encrypted',
    token_expires_at: 'timestamp'
  }
}

// Posts table
{
  post_id: 'string',
  // ... campos existentes
  facebook_post_id: 'string',
  facebook_published_at: 'timestamp',
  instagram_post_id: 'string',
  instagram_published_at: 'timestamp',
  publication_errors: 'array'
}
```

---

## 📊 Estimativa de Créditos

| Dia | Tarefas | Créditos Estimados |
|-----|---------|-------------------|
| 1 | Meta Graph API Client | ~80 |
| 2 | Integração Backend | ~80 |
| 3 | Testes de Integração | ~80 |
| 4 | Deploy e Validação | ~80 |
| 5 | Buffer e Ajustes | ~80 |
| **Total** | | **~400** |

**Margem de Segurança**: 100 créditos restantes para emergências

---

## 🎯 Critérios de Sucesso

### Funcionalidade
- ✅ Publicação no Facebook funciona
- ✅ Publicação no Instagram funciona
- ✅ Upload de imagens funciona
- ✅ Error handling robusto
- ✅ Retry logic funciona

### Qualidade
- ✅ Todos os testes passam
- ✅ Cobertura de testes > 80%
- ✅ Sem erros críticos
- ✅ Performance adequada

### Documentação
- ✅ README atualizado
- ✅ Guia de configuração completo
- ✅ Troubleshooting documentado
- ✅ API documentada

---

## 🔐 Segurança

### Credenciais
- ✅ Tokens criptografados com KMS
- ✅ Nunca logar tokens
- ✅ Rotação de tokens implementada
- ✅ Validação de permissões

### API
- ✅ Rate limiting implementado
- ✅ Retry com backoff
- ✅ Timeout configurado
- ✅ Error handling seguro

---

## 📝 Dependências

### Externas
- Meta Graph API v18.0
- Facebook Page Access Token
- Instagram Business Account
- Meta App configurado

### Internas
- OAuth handler (já implementado)
- Platform credentials DB (já implementado)
- Encryption service (já implementado)
- Posts API (já implementado)

---

## 🚀 Próximos Passos

1. ✅ Plano criado
2. ⏭️ Criar página de admin para configurar Meta
3. ⏭️ Implementar Meta Graph API Client
4. ⏭️ Integrar com backend
5. ⏭️ Testes e validação
6. ⏭️ Deploy em produção

---

## 📞 Suporte

### Meta Developer Docs
- Graph API: https://developers.facebook.com/docs/graph-api
- Facebook Pages: https://developers.facebook.com/docs/pages
- Instagram API: https://developers.facebook.com/docs/instagram-api

### Troubleshooting
- Verificar logs no CloudWatch
- Validar tokens no Meta Graph API Explorer
- Verificar permissões da Meta App
- Consultar documentação de error codes

---

**Status**: ✅ Plano Completo  
**Próximo**: Implementar página de admin para configuração Meta  
**Orçamento**: 400 créditos (dentro do limite de 500)
