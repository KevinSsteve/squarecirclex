# 🚀 Deploy: Generative AI Application Builder on AWS

## Guia Completo para Deploy com Modelos Premium usando AWS Activate Credits

Este guia configura o **Generative AI Application Builder on AWS (GAAB)** v4.1.23 com os melhores modelos disponíveis, todos pagos pelos seus **créditos AWS Activate**.

---

## 📋 Pré-requisitos

### Na sua máquina local:
- **AWS CLI** configurado com suas credenciais
- **Node.js 20.x**
- **Python 3.13.x**
- **Docker** instalado e rodando
- **AWS CDK v2** (`npm install -g aws-cdk`)

### Na sua conta AWS:
- **AWS Activate credits** ativos
- **Acesso aos modelos no Bedrock** habilitado (ver Passo 1)

---

## Passo 1: Habilitar Acesso aos Modelos no Bedrock

Antes de tudo, acesse o **Amazon Bedrock console** e habilite os seguintes modelos:

### Modelos de Texto (LLM) — Para chat e geração de texto nível ChatGPT:

| Modelo | Model ID | Uso | Custo |
|---|---|---|---|
| **Claude Opus 5** | `global.anthropic.claude-opus-5` | Raciocínio complexo, agentes | $5/$25 per MTok |
| **Claude Sonnet 5** | `global.anthropic.claude-sonnet-5` | Uso geral, velocidade + qualidade | $2/$10 per MTok |
| **Claude Haiku 4.5** | `anthropic.claude-haiku-4-5-20250101-v1:0` | Tarefas simples e rápidas | $1/$5 per MTok |

### Modelos de Imagem — Para geração de imagens nível DALL-E/Midjourney:

| Modelo | Model ID | Uso | Custo |
|---|---|---|---|
| **Stable Image Ultra v1.1** | `stability.stable-image-ultra-v1:0` | Fotorealismo premium | $0.14/imagem |
| **Amazon Nova Canvas** | `amazon.nova-canvas-v1:0` | Imagens criativas, mais barato | $0.04-$0.08/imagem |

### Como habilitar:
1. Vá em: **AWS Console → Amazon Bedrock → Model access**
2. Clique em **"Manage model access"**
3. Marque todos os modelos acima
4. Clique **"Save changes"**
5. Aguarde a aprovação (geralmente instantâneo para Anthropic e Stability AI)

---

## Passo 2: Bootstrap do CDK (apenas na primeira vez)

```bash
# Apenas se nunca rodou cdk bootstrap nesta conta/região
cdk bootstrap aws://<SUA_ACCOUNT_ID>/us-east-1
```

---

## Passo 3: Clonar e Preparar o Projeto

```bash
# Clonar o repositório oficial
git clone https://github.com/aws-solutions/generative-ai-application-builder-on-aws.git gaab
cd gaab/source/infrastructure

# Instalar dependências
npm install

# Build
npm run build

# Sintetizar os stacks
cdk synth
```

---

## Passo 4: Deploy do Deployment Dashboard

```bash
# Deploy do dashboard principal
cdk deploy DeploymentPlatformStack \
  --parameters AdminUserEmail=SEU_EMAIL@exemplo.com \
  --require-approval never

# Aguarde ~10 minutos para o deploy completar
```

Após o deploy, você receberá:
- **URL do Dashboard** (CloudFront)
- **Email de login** com senha temporária (Amazon Cognito)

---

## Passo 5: Stage Assets (necessário para deploy de use cases)

```bash
# Volte para a pasta source
cd ../

# Stage dos assets para S3
./stage-assets.sh

# Quando perguntado a região, responda: us-east-1
# Confirme com: y
```

---

## Passo 6: Configurar Use Case de Chat Premium no Dashboard

Após fazer login no Dashboard:

### 6.1 Criar Use Case de Texto/Chat:

1. Clique **"Deploy new use case"**
2. Selecione **"Text"** como tipo de use case
3. Configure o LLM:
   - **Model Provider**: `Bedrock`
   - **Inference Type**: `Inference Profiles` (para cross-region)
   - **Inference Profile ID**: `global.anthropic.claude-opus-5`
   - **Temperature**: `0.7`
   - **Streaming**: `Enabled`

4. Configure o Prompt:
   ```
   You are a world-class AI assistant. You provide thoughtful, detailed, 
   and accurate responses. You can help with creative writing, analysis, 
   coding, research, and any other task. You respond in the user's 
   language and adapt your tone to their needs.
   ```

5. (Opcional) Configure **RAG** com Knowledge Base:
   - Ative **RAG Enabled**
   - Selecione **Bedrock Knowledge Base**
   - Conecte seus documentos/dados

6. (Opcional) Configure **Guardrails**:
   - Ative para filtrar conteúdo impróprio
   - Reduz alucinações automaticamente

7. Clique **"Deploy"**

### 6.2 Criar Use Case com Bedrock Agent (para workflows):

1. Clique **"Deploy new use case"**
2. Selecione **"Agent"** como tipo
3. Configure:
   - **Model**: `Claude Opus 5` (via inference profile)
   - **Tools**: Adicione as ferramentas desejadas
   - **AgentCore**: Habilite para execução em produção

---

## Passo 7: Acessar a Interface de Chat

Após o deploy do use case, você terá:
- **URL do Chat** (interface web estilo ChatGPT)
- **API WebSocket** (para integração custom)
- **API REST** (para automação)

---

## 🎨 Geração de Imagens

O GAAB v4.1.23 é focado em **texto/chat**. Para geração de imagens com seus créditos, há duas abordagens:

### Opção A: Integrar no Experta (já feito no PR #1)
O PR anterior já configurou:
- **Stable Image Ultra v1.1** para geração de imagens
- **Claude Opus 5** para geração de prompts de imagem
- API endpoint `/chat/generate-image`

### Opção B: Criar endpoint de imagem via Agent Tool
No GAAB, configure um **Bedrock Agent** com uma tool que chama Stable Image Ultra:
1. Crie uma Lambda function que invoca `stability.stable-image-ultra-v1:0`
2. Configure como tool no Agent
3. O usuário pede "gere uma imagem de X" e o Agent executa

---

## 💰 Custos Estimados (cobertos pelo Activate)

### Infraestrutura base (Dashboard + Chat):
| Serviço | Custo Estimado |
|---|---|
| CloudFront + S3 (UI) | ~$1/mês |
| API Gateway | ~$3.50/100k requests |
| Lambda (backend) | ~$0.50/mês |
| DynamoDB | ~$2/mês |
| Cognito | Gratuito até 50k MAU |
| CloudWatch | ~$5/mês |
| **Subtotal infra** | **~$12/mês** |

### Modelos AI (uso ativo):
| Modelo | Cenário | Custo |
|---|---|---|
| Claude Opus 5 | 100 queries/dia, ~2k tokens cada | ~$45/mês |
| Claude Sonnet 5 | 500 queries/dia, ~1k tokens cada | ~$15/mês |
| Stable Image Ultra | 50 imagens/dia | ~$210/mês |
| **Subtotal AI** | **Uso moderado** | **~$270/mês** |

### **Total estimado: ~$280/mês** (100% coberto por Activate credits)

---

## 🔧 Configuração Avançada

### Usar VPC (recomendado para produção):
```bash
cdk deploy DeploymentPlatformStack \
  --parameters AdminUserEmail=SEU_EMAIL@exemplo.com \
  --parameters VpcEnabled=Yes \
  --parameters CreateNewVpc=Yes
```

### Deploy standalone (sem dashboard):
Se quiser apenas o chat sem UI de admin:
```bash
cdk deploy BedrockChat \
  --parameters AdminUserEmail=SEU_EMAIL@exemplo.com
```

---

## 🔄 Integração com o Experta/Onzo

Após ter ambos rodando, você pode:

1. **Usar o GAAB como backend de IA** e o Experta como frontend de social media
2. **Alimentar Knowledge Bases** com dados de redes sociais, tendências, best practices
3. **Usar Agents** para automatizar workflows: pesquisar tendências → gerar conteúdo → publicar
4. **MCP Servers** para conectar com ferramentas externas (Meta API, LinkedIn, etc.)

---

## 📱 Quick Start (1-Click Deploy)

Se preferir não usar CDK, acesse:
- **[Launch in AWS Console](https://aws.amazon.com/solutions/implementations/generative-ai-application-builder-on-aws/)** → "Launch in the AWS Console"
- Preencha apenas seu email de admin
- O CloudFormation faz todo o resto em ~10 minutos

---

## ✅ Checklist Final

- [ ] Modelos habilitados no Bedrock (Claude Opus 5, Sonnet 5, Stable Image Ultra)
- [ ] CDK bootstrapped na conta
- [ ] Dashboard deployed
- [ ] Assets staged
- [ ] Use case de chat criado com Claude Opus 5
- [ ] Interface de chat acessível
- [ ] (Opcional) RAG configurado com seus documentos
- [ ] (Opcional) Guardrails ativados
- [ ] (Opcional) Agent com image generation tool

---

## 🆘 Troubleshooting

### "Access denied" ao invocar modelo:
→ Verifique se habilitou acesso ao modelo no Bedrock console

### "ThrottlingException":
→ Normal para modelos populares. O GAAB já tem retry logic embutido.

### CloudFormation timeout:
→ Verifique se o CDK bootstrap foi executado corretamente

### Costs not being covered by Activate:
→ Confirme que seus créditos Activate estão ativos em **Billing → Credits**
→ AWS Activate cobre todos os serviços usados (Bedrock, Lambda, S3, etc.)

---

## 📚 Referências

- [GAAB Implementation Guide](https://docs.aws.amazon.com/solutions/latest/generative-ai-application-builder-on-aws/solution-overview.html)
- [GAAB GitHub Repository](https://github.com/aws-solutions/generative-ai-application-builder-on-aws)
- [Amazon Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [AWS Activate Credits for Bedrock](https://aws.amazon.com/startups/learn/aws-activate-credits-now-accepted-for-third-party-models-on-amazon-bedrock)
- [Claude Opus 5 on Bedrock](https://aws.amazon.com/blogs/machine-learning/introducing-claude-opus-5-on-aws-anthropics-most-capable-opus-model/)
