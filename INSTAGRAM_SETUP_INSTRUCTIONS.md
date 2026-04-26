# Instruções: Configurar Instagram no Sistema Experta

**Data**: 2026-04-25  
**Status**: Pronto para Configuração  

---

## ✅ Credenciais Recebidas

- **App ID**: `1680096733338103`
- **App Secret**: `1ea026c9f6dc8d1ae77c3474a1220bcf`

---

## 🚀 Como Configurar no Sistema

### Passo 1: Obter Acesso Admin

Primeiro, você precisa ter acesso ao painel de administração:

1. Siga as instruções em `ADD_ADMIN_USER_MANUAL.md`
2. Adicione seu email (kevinalexandreestevesdossantos@gmail.com) ao grupo "Admins" no Cognito
3. Faça logout e login novamente

### Passo 2: Acessar o Painel Admin

1. Acesse: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin
2. Você deve ver o painel de administração

### Passo 3: Configurar Meta API

1. No painel admin, clique na aba **"Platform Configuration"**
2. Role até a seção **"Meta Graph API (Facebook & Instagram)"**
3. Preencha os campos:

```
┌─────────────────────────────────────────────────────┐
│ Meta Graph API Configuration                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ App ID:                                             │
│ 1680096733338103                                    │
│                                                      │
│ App Secret:                                         │
│ 1ea026c9f6dc8d1ae77c3474a1220bcf                    │
│                                                      │
│ Redirect URI: (pré-preenchido)                     │
│ http://experta-frontend-dev.s3-website...          │
│                                                      │
│ [Save Meta Configuration]                           │
└─────────────────────────────────────────────────────┘
```

4. Clique em **"Save Meta Configuration"**

---

## 📱 Requisitos Adicionais para Instagram

Para que a publicação no Instagram funcione, você precisa:

### 1. Conta Instagram Business ou Creator

Sua conta Instagram deve ser do tipo Business ou Creator (não funciona com conta pessoal).

**Como converter:**
1. Abra o app do Instagram
2. Vá em Settings → Account
3. Clique em "Switch to Professional Account"
4. Escolha "Business" ou "Creator"

### 2. Conectar Instagram à Página Facebook

Sua conta Instagram Business deve estar conectada a uma Página do Facebook.

**Como conectar:**
1. Acesse sua Página do Facebook
2. Vá em Settings → Instagram
3. Clique em "Connect Account"
4. Faça login com sua conta Instagram Business

### 3. Configurar OAuth Redirect URI no Meta Developer

No seu Meta App, você precisa configurar a URL de redirecionamento:

1. Acesse: https://developers.facebook.com
2. Vá no seu app (ID: 1680096733338103)
3. Sidebar → Products → Facebook Login → Settings
4. Em "Valid OAuth Redirect URIs", adicione:
   ```
   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback
   ```
5. Salve as alterações

---

## 🧪 Testando a Integração

Após configurar tudo:

### 1. Conectar Conta

1. No sistema Experta, vá em **"Connect Accounts"**
2. Clique em **"Connect Facebook"** ou **"Connect Instagram"**
3. Autorize o acesso
4. O sistema detectará automaticamente suas páginas Facebook e contas Instagram conectadas

### 2. Criar um Post de Teste

1. Vá para o **Chat**
2. Peça para criar um post (ex: "crie um post sobre marketing digital")
3. O sistema gerará conteúdo + imagem
4. Escolha as plataformas (Facebook e/ou Instagram)
5. Clique em **"Publish"**

### 3. Verificar Publicação

1. Acesse sua Página do Facebook
2. Acesse sua conta Instagram Business
3. Verifique se o post foi publicado

---

## ⚠️ Modo Development vs Production

### Modo Development (Atual)

Seu app está em modo Development, o que significa:

- ✅ Você pode testar a publicação
- ✅ Funciona para você e testadores adicionados
- ⚠️ Posts podem não aparecer publicamente para todos
- ⚠️ Limitado a contas de teste

### Modo Production (Para Uso Real)

Para uso em produção com clientes reais, você precisará:

1. **Solicitar App Review da Meta**
   - Permissões necessárias:
     - `pages_manage_posts` (Facebook)
     - `instagram_content_publish` (Instagram)
     - `pages_read_engagement` (ambos)

2. **Publicar Política de Privacidade**
   - URL pública com sua política de privacidade
   - Adicionar no Meta App Settings

3. **Publicar Termos de Serviço**
   - URL pública com seus termos de serviço
   - Adicionar no Meta App Settings

4. **Aguardar Aprovação**
   - Processo leva 3-7 dias úteis
   - Meta revisará seu app e uso das permissões

---

## 🔍 Troubleshooting

### "App ID inválido"
- Verifique se copiou corretamente: `1680096733338103`
- Certifique-se de não incluir espaços

### "App Secret inválido"
- Verifique se copiou corretamente: `1ea026c9f6dc8d1ae77c3474a1220bcf`
- Certifique-se de não incluir espaços

### "Não consigo publicar no Instagram"
- Verifique se a conta é Business/Creator
- Confirme que está conectada a uma Página Facebook
- Verifique se configurou o OAuth Redirect URI

### "Access Denied no Admin Panel"
- Certifique-se de estar no grupo "Admins" no Cognito
- Faça logout e login novamente
- Limpe o cache do navegador (Ctrl+F5)

---

## 📊 Resumo das Credenciais

| Campo | Valor |
|-------|-------|
| **App ID** | 1680096733338103 |
| **App Secret** | 1ea026c9f6dc8d1ae77c3474a1220bcf |
| **Redirect URI** | http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback |

---

## ✅ Checklist de Configuração

### No Sistema Experta
- [ ] Adicionar email como Admin no Cognito
- [ ] Fazer login como Admin
- [ ] Acessar /admin → Platform Configuration
- [ ] Inserir App ID: `1680096733338103`
- [ ] Inserir App Secret: `1ea026c9f6dc8d1ae77c3474a1220bcf`
- [ ] Salvar configuração

### No Instagram
- [ ] Converter conta para Business/Creator
- [ ] Conectar Instagram à Página Facebook

### No Meta Developer
- [ ] Adicionar OAuth Redirect URI
- [ ] Verificar que produtos Facebook Login e Instagram estão ativos

### Teste
- [ ] Conectar conta no sistema
- [ ] Criar post de teste
- [ ] Publicar no Instagram
- [ ] Verificar se apareceu no Instagram

---

## 🎯 Próximos Passos

1. **Agora**: Adicione seu email como Admin (veja `ADD_ADMIN_USER_MANUAL.md`)
2. **Depois**: Configure as credenciais no Admin Panel
3. **Teste**: Crie e publique um post de teste
4. **Produção**: Quando estiver pronto, solicite App Review da Meta

---

**Dúvidas?** Consulte o `META_DEVELOPER_SETUP_GUIDE.md` para mais detalhes!

