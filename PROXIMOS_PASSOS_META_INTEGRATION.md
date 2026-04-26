# Próximos Passos - Integração Meta Completa 🚀

**Data**: 2026-04-23  
**Status**: Deploy Concluído - Pronto para Configuração  

---

## 🎯 Situação Atual

✅ **Deploy Completo**: MetaPublisherFunction está ativa na AWS  
✅ **EventBridge Configurado**: Eventos PostCreated disparam automaticamente  
✅ **CloudWatch Alarms**: Monitoramento ativo  
⏳ **Aguardando**: Configuração das credenciais Meta no Admin  

---

## 📍 Rota de Admin para Configuração Meta

### Como Acessar

1. **Faça login como Admin** no sistema
2. **Navegue para**: `/admin`
3. **Clique na aba**: "Platform Configuration" (⚙️)
4. **Role até a seção**: "Meta Graph API (Facebook & Instagram)"

### URL Completa

```
https://seu-dominio.com/admin
```

Ou localmente:
```
http://localhost:3000/admin
```

---

## 🔐 Configuração das Credenciais Meta

### Passo 1: Criar Meta App

1. Acesse: https://developers.facebook.com
2. Clique em "My Apps" → "Create App"
3. Escolha tipo: "Business"
4. Preencha:
   - **App Name**: "Experta Social Manager" (ou seu nome)
   - **App Contact Email**: seu email
   - **Business Account**: selecione ou crie uma

### Passo 2: Adicionar Produtos

No dashboard do seu Meta App, adicione:

1. **Facebook Login**
   - Settings → Valid OAuth Redirect URIs
   - Adicione: `https://seu-dominio.com/oauth/meta/callback`

2. **Instagram Graph API**
   - Ative o produto
   - Configure permissões

### Passo 3: Obter Credenciais

No dashboard do Meta App:

1. **App ID**: 
   - Settings → Basic
   - Copie o "App ID"

2. **App Secret**:
   - Settings → Basic
   - Clique em "Show" ao lado de "App Secret"
   - Copie o valor

### Passo 4: Configurar no Sistema

No painel Admin → Platform Configuration:

1. **App ID**: Cole o App ID copiado
2. **App Secret**: Cole o App Secret copiado
3. **Redirect URI**: `https://seu-dominio.com/oauth/meta/callback`
4. Clique em **"Save Meta Configuration"**

---

## 🎯 Próximos Passos Técnicos

### Opção 1: Testar com Post Real (Recomendado)

Agora que o deploy está completo, você pode testar o fluxo completo:

1. **Configurar credenciais Meta** (passos acima)
2. **Criar um post** através da API ou Chat
3. **Verificar logs** para confirmar publicação

```bash
# Criar post via API
curl -X POST https://h5r67v3nx1.execute-api.us-east-1.amazonaws.com/dev/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Teste de publicação Meta",
    "platforms": ["facebook", "instagram"],
    "image_url": "https://example.com/image.jpg"
  }'

# Verificar logs
aws logs tail /aws/lambda/onzo-meta-publisher-dev --follow
```

### Opção 2: Executar Testes de Integração

```bash
# Executar testes
npm test tests/integration/meta-publisher.test.js

# Ou todos os testes
npm test
```

### Opção 3: Validar EventBridge

```bash
# Verificar regra EventBridge
aws events describe-rule --name MetaPublisherFunctionPostCreated

# Listar targets da regra
aws events list-targets-by-rule --rule MetaPublisherFunctionPostCreated
```

---

## 📊 Monitoramento e Validação

### CloudWatch Logs

```bash
# Ver logs em tempo real
aws logs tail /aws/lambda/onzo-meta-publisher-dev --follow

# Ver logs das últimas 2 horas
aws logs tail /aws/lambda/onzo-meta-publisher-dev --since 2h

# Filtrar por erro
aws logs filter-log-events \
  --log-group-name /aws/lambda/onzo-meta-publisher-dev \
  --filter-pattern "ERROR"
```

### CloudWatch Alarms

O sistema tem um alarm configurado:
- **Nome**: `MetaPublisherErrorAlarm`
- **Métrica**: Erros da função Lambda
- **Threshold**: > 0 erros em 5 minutos
- **Ação**: Notificação SNS (se configurado)

```bash
# Verificar status do alarm
aws cloudwatch describe-alarms --alarm-names MetaPublisherErrorAlarm
```

### Métricas da Função

```bash
# Ver invocações
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=onzo-meta-publisher-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Ver erros
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=onzo-meta-publisher-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## 🔧 Configurações Avançadas

### Mock Mode vs Production Mode

A função está configurada com `MOCK_MODE=true` por padrão. Para publicação real:

1. **Desabilitar Mock Mode**:
   ```bash
   aws lambda update-function-configuration \
     --function-name onzo-meta-publisher-dev \
     --environment Variables={MOCK_MODE=false}
   ```

2. **Configurar credenciais Meta** no Admin (passos acima)

3. **Testar publicação real**

### Permissões Meta Necessárias

Solicite estas permissões no Meta App:

- ✅ `pages_manage_posts` - Publicar em páginas Facebook
- ✅ `instagram_basic` - Acesso básico Instagram
- ✅ `instagram_content_publish` - Publicar no Instagram
- ✅ `pages_read_engagement` - Ler engajamento

**Nota**: Algumas permissões requerem revisão da Meta (pode levar dias).

### Instagram Business Account

Para publicar no Instagram, você precisa:

1. ✅ Conta Instagram Business ou Creator
2. ✅ Conta conectada a uma Página do Facebook
3. ✅ Mesmas credenciais Meta para ambas plataformas

---

## 🎯 Fluxo Completo de Publicação

```
1. Usuário cria post (via Chat ou API)
   ↓
2. Post salvo no DynamoDB
   ↓
3. EventBridge dispara evento "PostCreated"
   ↓
4. MetaPublisherFunction é invocada
   ↓
5. Função busca post no DynamoDB
   ↓
6. Função busca credenciais Meta (Secrets Manager)
   ↓
7. Função publica no Facebook/Instagram
   ↓
8. Status atualizado no DynamoDB
   ↓
9. Logs salvos no CloudWatch
```

---

## 📝 Checklist de Validação

### Antes de Publicar

- [ ] Credenciais Meta configuradas no Admin
- [ ] Meta App em modo Development ou Production
- [ ] Permissões Meta aprovadas (se necessário)
- [ ] Instagram Business Account conectado
- [ ] Mock Mode desabilitado (para publicação real)

### Após Publicar

- [ ] Post criado com sucesso no sistema
- [ ] EventBridge disparou evento
- [ ] Lambda foi invocada (verificar logs)
- [ ] Post publicado no Facebook/Instagram
- [ ] Status atualizado no DynamoDB
- [ ] Sem erros nos logs

---

## 🐛 Troubleshooting

### Erro: "Post not found"

**Causa**: Post não existe no DynamoDB  
**Solução**: Criar post através da API ou Chat primeiro

### Erro: "Meta credentials not found"

**Causa**: Credenciais não configuradas  
**Solução**: Configurar no Admin → Platform Configuration

### Erro: "Invalid OAuth access token"

**Causa**: Token Meta expirado ou inválido  
**Solução**: Reconectar conta Meta no Admin

### Erro: "Instagram account not found"

**Causa**: Conta Instagram não conectada à Página Facebook  
**Solução**: Conectar Instagram Business Account à Página

---

## 📞 Recursos Úteis

### Documentação

- [Meta for Developers](https://developers.facebook.com)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Meta App Review](https://developers.facebook.com/docs/app-review)

### Ferramentas

- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
- [Sharing Debugger](https://developers.facebook.com/tools/debug/)

### Suporte

- [Meta Developer Community](https://developers.facebook.com/community/)
- [Stack Overflow - Facebook API](https://stackoverflow.com/questions/tagged/facebook-graph-api)

---

## 🚀 Resumo dos Próximos Passos

1. ✅ **Deploy Completo** - Função Lambda ativa
2. ⏳ **Configurar Credenciais** - Admin → Platform Configuration
3. ⏳ **Criar Meta App** - developers.facebook.com
4. ⏳ **Testar Publicação** - Criar post e verificar logs
5. ⏳ **Validar Fluxo** - Confirmar publicação no Facebook/Instagram

---

## 💡 Dica Final

Para testar rapidamente sem configurar credenciais reais:

1. Mantenha `MOCK_MODE=true`
2. Crie um post através da API
3. Verifique os logs - você verá a simulação da publicação
4. Quando estiver pronto, configure credenciais reais e desabilite mock mode

---

**Status**: ✅ Sistema pronto para configuração e testes!  
**Próximo**: Configurar credenciais Meta no Admin e testar publicação.

