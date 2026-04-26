# Fase 3 - Dia 4: Deploy e Validação - INICIANDO 🚀

**Data**: 2026-04-23  
**Status**: 🔄 EM PROGRESSO  
**Progresso Fase 3**: 65% → 85% (target)  
**Créditos Estimados**: ~80 de 500

---

## 🎯 Objetivos do Dia 4

1. ✅ Build do projeto SAM
2. ⏳ Deploy em ambiente dev
3. ⏳ Validar todas as funções Lambda
4. ⏳ Testar fluxo end-to-end
5. ⏳ Verificar logs e métricas
6. ⏳ Documentar processo

---

## 📋 Checklist de Tarefas

### Tarefa 4.1: Build do Projeto ⏳

```bash
sam build
```

**O que será buildado**:
- ✅ MetaPublisherFunction (Node.js 20.x)
- ✅ ChatHandlerFunction (Node.js 20.x)
- ✅ PostsApiFunction (Node.js 20.x)
- ✅ Shared Layer (lib/nodejs)
- ✅ Todas as outras funções

**Verificações**:
- [ ] Build completo sem erros
- [ ] Todas as dependências instaladas
- [ ] Layer compartilhado criado

---

### Tarefa 4.2: Deploy em Dev ⏳

```bash
sam deploy --config-env default
```

**Recursos que serão deployados**:
- MetaPublisherFunction
- EventBridge Rule (PostCreatedRule)
- CloudWatch Logs
- CloudWatch Alarms
- IAM Roles e Policies

**Verificações**:
- [ ] Stack criado/atualizado com sucesso
- [ ] Outputs disponíveis
- [ ] Função Meta Publisher ativa
- [ ] EventBridge rule configurada

---

### Tarefa 4.3: Validação de Funções ⏳

**Verificar MetaPublisherFunction**:
```bash
aws lambda get-function --function-name onzo-meta-publisher-dev
```

**Verificar variáveis de ambiente**:
- [ ] META_MOCK_MODE=true
- [ ] POSTS_TABLE_NAME
- [ ] SECRETS_TABLE_NAME

**Verificar EventBridge Rule**:
```bash
aws events describe-rule --name onzo-PostCreatedRule
```

---

### Tarefa 4.4: Teste End-to-End ⏳

**Fluxo de Teste**:

1. **Criar post via Chat Handler** (simulado)
   - Gerar conteúdo
   - Criar imagem
   - Salvar no DynamoDB
   - Emitir evento EventBridge

2. **Verificar Meta Publisher**
   - Recebe evento
   - Processa em modo mock
   - Atualiza DynamoDB
   - Registra logs

3. **Verificar Posts API**
   - GET /posts/{post_id}
   - Campos Meta presentes
   - Status correto

**Comandos de Teste**:
```bash
# 1. Invocar Meta Publisher diretamente
aws lambda invoke \
  --function-name onzo-meta-publisher-dev \
  --payload file://test-event.json \
  response.json

# 2. Verificar logs
aws logs tail /aws/lambda/onzo-meta-publisher-dev --follow

# 3. Verificar post no DynamoDB
aws dynamodb get-item \
  --table-name Posts \
  --key '{"post_id": {"S": "test-post-123"}}'
```

---

### Tarefa 4.5: Verificar Logs e Métricas ⏳

**CloudWatch Logs**:
- [ ] Logs de invocação
- [ ] Logs de erro (se houver)
- [ ] Logs de mock mode

**CloudWatch Metrics**:
- [ ] Invocations
- [ ] Errors
- [ ] Duration
- [ ] Throttles

**CloudWatch Alarms**:
- [ ] MetaPublisherErrors alarm configurado
- [ ] Threshold correto (> 5 errors em 5 minutos)

---

## 🔧 Configuração Atual

### Stack Name
```
onzo
```

### Environment
```
dev
```

### Region
```
us-east-1
```

### Mock Mode
```
META_MOCK_MODE=true (padrão)
```

---

## 📝 Evento de Teste

Criar arquivo `test-event.json`:

```json
{
  "version": "0",
  "id": "test-event-123",
  "detail-type": "PostCreated",
  "source": "experta.posts",
  "account": "123456789012",
  "time": "2026-04-23T10:00:00Z",
  "region": "us-east-1",
  "resources": [],
  "detail": {
    "post_id": "test-post-123",
    "brand_id": "test-brand-456",
    "platforms": ["facebook", "instagram"],
    "image_url": "https://example.com/test.jpg",
    "caption": "Test post for Meta integration"
  }
}
```

---

## 🎯 Critérios de Sucesso

### Build
- ✅ Build completo sem erros
- ✅ Todas as dependências resolvidas
- ✅ Layer compartilhado criado

### Deploy
- ✅ Stack deployado com sucesso
- ✅ Todas as funções ativas
- ✅ EventBridge rule configurada
- ✅ CloudWatch logs e alarms criados

### Validação
- ✅ Meta Publisher responde a eventos
- ✅ Modo mock funciona corretamente
- ✅ DynamoDB é atualizado
- ✅ Logs são registrados

### End-to-End
- ✅ Evento EventBridge dispara função
- ✅ Função processa evento corretamente
- ✅ Post é atualizado com IDs mock
- ✅ Sem erros nos logs

---

## 🚨 Troubleshooting

### Build Errors
- Verificar Node.js version (20.x)
- Verificar package.json em cada função
- Limpar cache: `sam build --use-container`

### Deploy Errors
- Verificar IAM permissions
- Verificar stack name único
- Verificar region correta

### Runtime Errors
- Verificar variáveis de ambiente
- Verificar Layer compartilhado
- Verificar logs no CloudWatch

---

## 📊 Progresso Esperado

```
Fase 3: Meta Integration
├── ✅ Dia 1: Meta Graph API Client (30 créditos)
├── ✅ Dia 2: Integração Backend (20 créditos)
├── ✅ Dia 3: Integração Chat/Posts API (80 créditos)
├── ✅ Verificação Best Practices API (10 créditos)
├── 🔄 Dia 4: Deploy e Validação (80 créditos) ◄── EM PROGRESSO
└── ⏳ Dia 5: Buffer e Ajustes (80 créditos)

Total: 300 créditos estimados
Usado: 140 créditos (47%)
Target: 220 créditos (73%)
```

---

## 🎯 Próximos Passos

1. ✅ Documento criado
2. ⏳ Executar `sam build`
3. ⏳ Executar `sam deploy`
4. ⏳ Validar funções
5. ⏳ Testar end-to-end
6. ⏳ Verificar logs
7. ⏳ Documentar resultados

---

**Status**: 🔄 INICIANDO DIA 4  
**Próximo**: Executar sam build

