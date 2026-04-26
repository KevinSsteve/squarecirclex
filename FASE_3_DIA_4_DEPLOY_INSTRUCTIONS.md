# Fase 3 - Dia 4: Instruções de Deploy 🚀

**Data**: 2026-04-23  
**Status**: PRONTO PARA EXECUTAR  

---

## 🎯 Deploy Simplificado

O processo de build e deploy do SAM pode demorar alguns minutos. Aqui estão as instruções para você executar:

---

## Opção 1: Script Automatizado (Recomendado) ⚡

Execute o script PowerShell que preparei:

```powershell
.\scripts\deploy-meta-integration.ps1
```

Este script fará:
1. Build do projeto SAM
2. Validação do template
3. Deploy para AWS
4. Exibição dos outputs

---

## Opção 2: Comandos Manuais 🔧

Se preferir executar passo a passo:

### 1. Build
```bash
sam build --cached --parallel
```

### 2. Deploy
```bash
sam deploy --config-env default --no-confirm-changeset
```

### 3. Verificar Outputs
```bash
aws cloudformation describe-stacks --stack-name onzo --query 'Stacks[0].Outputs' --output table
```

---

## ✅ O Que Esperar

### Durante o Build (2-5 minutos)
- Instalação de dependências Node.js
- Criação do Lambda Layer compartilhado
- Build de todas as funções Lambda
- Empacotamento para deploy

### Durante o Deploy (3-7 minutos)
- Upload de artefatos para S3
- Criação/atualização do CloudFormation stack
- Deploy de funções Lambda
- Configuração de EventBridge
- Criação de CloudWatch Logs e Alarms

### Após Deploy
- Stack "onzo" atualizado
- MetaPublisherFunction ativa
- EventBridge rule configurada
- Pronto para testes!

---

## 🧪 Testar Após Deploy

### 1. Invocar Função Diretamente
```bash
aws lambda invoke \
  --function-name onzo-meta-publisher-dev \
  --payload file://test-event-meta-publisher.json \
  response.json

# Ver resposta
type response.json
```

### 2. Verificar Logs
```bash
aws logs tail /aws/lambda/onzo-meta-publisher-dev --follow
```

### 3. Verificar Função
```bash
aws lambda get-function --function-name onzo-meta-publisher-dev
```

---

## 📊 Outputs Esperados

Após o deploy, você verá outputs como:

```
MetaPublisherFunctionArn: arn:aws:lambda:us-east-1:...
MetaPublisherFunctionName: onzo-meta-publisher-dev
ApiEndpoint: https://...execute-api.us-east-1.amazonaws.com/Prod
```

---

## 🐛 Troubleshooting

### Erro: "Build failed"
```bash
# Limpar e rebuildar
sam build --use-container
```

### Erro: "No changes to deploy"
```bash
# Forçar deploy
sam deploy --config-env default --no-confirm-changeset --force-upload
```

### Erro: "Insufficient permissions"
```bash
# Verificar credenciais AWS
aws sts get-caller-identity
```

---

## 💡 Próximos Passos Após Deploy

1. ✅ Deploy completo
2. ✅ Testar função Lambda
3. ✅ Verificar logs
4. ✅ Validar EventBridge
5. ✅ Documentar resultados

---

**Quando terminar o deploy, me avise para continuarmos com a validação e testes!** 🎉

