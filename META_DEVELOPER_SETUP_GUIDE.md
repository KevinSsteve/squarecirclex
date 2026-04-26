# Guia Completo: Configuração Meta Developer para Instagram

**Data**: 2026-04-24  
**Objetivo**: Configurar integração com Facebook e Instagram para publicação de posts  

---

## 📋 Dados Necessários do Meta Developer

Para ativar a integração, você precisa fornecer os seguintes dados do seu Meta App:

### 1. App ID (Obrigatório)
- **O que é**: Identificador único do seu aplicativo Meta
- **Onde encontrar**: Meta Developer Console → Seu App → Settings → Basic
- **Formato**: Número (ex: 123456789012345)

### 2. App Secret (Obrigatório)
- **O que é**: Chave secreta para autenticação
- **Onde encontrar**: Meta Developer Console → Seu App → Settings → Basic → App Secret (clique em "Show")
- **Formato**: String alfanumérica (ex: abc123def456...)
- **⚠️ IMPORTANTE**: Nunca compartilhe publicamente

### 3. Access Token (Será gerado depois)
- **O que é**: Token de acesso para fazer chamadas à API
- **Como obter**: Através do OAuth flow ou Graph API Explorer
- **Tipos**:
  - User Access Token (expira em 60 dias)
  - Page Access Token (não expira se o app estiver em produção)

---

## 🚀 Passo a Passo: Criar e Configurar Meta App

### Passo 1: Criar Meta App

1. Acesse: https://developers.facebook.com
2. Clique em "My Apps" → "Create App"
3. Escolha o tipo: **"Business"**
4. Preencha:
   - **App Name**: "Experta Social Manager" (ou nome da sua escolha)
   - **App Contact Email**: seu email
   - **Business Account**: Selecione ou crie uma conta business

### Passo 2: Adicionar Produtos Necessários

No dashboard do seu app, adicione os seguintes produtos:

#### A) Facebook Login
1. Clique em "Add Product"
2. Encontre "Facebook Login" → Clique em "Set Up"
3. Escolha "Web" como plataforma
4. Configure:
   - **Site URL**: `http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com`
   - **Valid OAuth Redirect URIs**: 
     ```
     http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback
     ```

#### B) Instagram Graph API
1. Clique em "Add Product"
2. Encontre "Instagram" → Clique em "Set Up"
3. Aceite os termos de uso

---

## 🔑 Permissões Necessárias

Você precisa solicitar as seguintes permissões (algumas requerem revisão da Meta):

### Permissões Básicas (Aprovação Automática)
- ✅ `public_profile` - Informações básicas do perfil
- ✅ `email` - Email do usuário

### Permissões para Facebook (Requerem Revisão)
- 📝 `pages_show_list` - Listar páginas do usuário
- 📝 `pages_read_engagement` - Ler engajamento das páginas
- 📝 `pages_manage_posts` - Publicar em páginas Facebook

### Permissões para Instagram (Requerem Revisão)
- 📝 `instagram_basic` - Acesso básico ao Instagram
- 📝 `instagram_content_publish` - Publicar conteúdo no Instagram
- 📝 `pages_read_engagement` - Ler engajamento (necessário para Instagram)

---

## 📱 Requisitos para Instagram

Para publicar no Instagram, você precisa:

### 1. Conta Instagram Business ou Creator
- Não funciona com contas pessoais
- Converta sua conta em: Instagram App → Settings → Account → Switch to Professional Account

### 2. Conectar Instagram à Página Facebook
- A conta Instagram deve estar conectada a uma Página do Facebook
- Conecte em: Facebook Page → Settings → Instagram → Connect Account

### 3. Mesmas Credenciais
- Use o mesmo App ID e App Secret para Facebook e Instagram
- O sistema detecta automaticamente as contas conectadas

---

## 🔧 Configuração no Sistema Experta

### Onde Configurar

1. Faça login como Admin
2. Acesse: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin
3. Clique na aba "Platform Configuration"
4. Role até "Meta Graph API (Facebook & Instagram)"

### Dados para Inserir

```
┌─────────────────────────────────────────────────────┐
│ Meta Graph API Configuration                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ App ID:                                             │
│ [Cole aqui o App ID do Meta Developer]             │
│                                                      │
│ App Secret:                                         │
│ [Cole aqui o App Secret do Meta Developer]         │
│                                                      │
│ Redirect URI: (pré-preenchido)                     │
│ http://experta-frontend-dev.s3-website...          │
│                                                      │
│ [Save Meta Configuration]                           │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Modo de Teste vs Produção

### Modo Development (Teste)
- **Quando usar**: Durante desenvolvimento e testes
- **Limitações**: 
  - Apenas você e testadores adicionados podem usar
  - Posts podem não aparecer publicamente
- **Como ativar**: App está em Development por padrão

### Modo Production (Produção)
- **Quando usar**: Para uso real com clientes
- **Requisitos**:
  - App Review da Meta (pode levar dias/semanas)
  - Política de Privacidade publicada
  - Termos de Serviço publicados
- **Como ativar**: 
  1. Complete App Review
  2. Settings → Basic → App Mode → Switch to Live

---

## 📝 Checklist de Configuração

### No Meta Developer

- [ ] Criar Meta App (tipo Business)
- [ ] Adicionar produto "Facebook Login"
- [ ] Adicionar produto "Instagram Graph API"
- [ ] Configurar Valid OAuth Redirect URIs
- [ ] Copiar App ID
- [ ] Copiar App Secret
- [ ] Adicionar testadores (se em Development mode)
- [ ] Conectar Instagram Business Account à Página Facebook

### No Sistema Experta

- [ ] Fazer login como Admin
- [ ] Acessar /admin → Platform Configuration
- [ ] Colar App ID
- [ ] Colar App Secret
- [ ] Salvar configuração
- [ ] Testar conexão

### Permissões (Opcional - para produção)

- [ ] Solicitar revisão de `pages_manage_posts`
- [ ] Solicitar revisão de `instagram_content_publish`
- [ ] Aguardar aprovação da Meta (3-7 dias úteis)

---

## 🎯 Fluxo de Publicação

Após configurar tudo:

```
1. Usuário cria post no chat
   ↓
2. Sistema gera conteúdo + imagem
   ↓
3. Usuário escolhe plataformas (Facebook/Instagram)
   ↓
4. Sistema publica automaticamente
   ↓
5. Post aparece no Facebook/Instagram
```

---

## 🔍 Como Obter os Dados Agora

### Passo a Passo Rápido:

1. **Acesse**: https://developers.facebook.com
2. **Login**: Com sua conta Facebook
3. **Vá para**: "My Apps"
4. **Se não tem app**: Clique "Create App" e siga Passo 1 acima
5. **Se já tem app**: Clique no nome do app
6. **Copie App ID**: 
   - Sidebar → Settings → Basic
   - Primeiro campo: "App ID"
7. **Copie App Secret**:
   - Mesma página
   - Campo "App Secret" → Clique "Show"
   - Confirme sua senha do Facebook
   - Copie o valor

---

## 📊 Resumo dos Dados Necessários

Para configurar AGORA no sistema, você precisa apenas:

| Campo | Onde Encontrar | Exemplo |
|-------|----------------|---------|
| **App ID** | Settings → Basic | 123456789012345 |
| **App Secret** | Settings → Basic → Show | abc123def456ghi789... |

Esses 2 dados são suficientes para começar!

---

## ⚠️ Notas Importantes

### Sobre Tokens de Acesso
- O sistema gerencia tokens automaticamente
- Tokens são armazenados de forma segura no AWS Secrets Manager
- Você não precisa gerar tokens manualmente

### Sobre Permissões
- Permissões básicas são aprovadas automaticamente
- Permissões avançadas requerem App Review
- Durante desenvolvimento, você pode testar sem App Review

### Sobre Instagram
- Funciona APENAS com contas Business/Creator
- Conta deve estar conectada a uma Página Facebook
- Mesmas credenciais servem para Facebook e Instagram

---

## 🆘 Troubleshooting

### "App ID inválido"
- Verifique se copiou corretamente (apenas números)
- Certifique-se de estar usando o App ID correto

### "App Secret inválido"
- Clique em "Show" para ver o secret completo
- Copie todo o texto (pode ser longo)
- Não inclua espaços no início/fim

### "Não consigo publicar no Instagram"
- Verifique se a conta é Business/Creator
- Confirme que está conectada a uma Página Facebook
- Verifique se as permissões foram aprovadas

---

## 📞 Links Úteis

- **Meta Developer Console**: https://developers.facebook.com
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
- **Documentação Instagram API**: https://developers.facebook.com/docs/instagram-api
- **App Review**: https://developers.facebook.com/docs/app-review

---

## ✅ Próximos Passos

1. **Agora**: Acesse Meta Developer e copie App ID + App Secret
2. **Depois**: Cole no Admin Panel do Experta
3. **Teste**: Crie um post e publique
4. **Produção**: Solicite App Review quando estiver pronto

---

**Dúvidas?** Me envie os dados e eu ajudo a configurar!
