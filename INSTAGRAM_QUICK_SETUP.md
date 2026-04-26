# Instagram - Setup Rápido

## 🚀 Deploy (1 comando)

```powershell
.\scripts\deploy-instagram-integration.ps1
```

---

## 👤 Adicionar Admin (AWS Console)

1. https://console.aws.amazon.com/cognito/
2. Região: **us-east-1**
3. User Pool: **us-east-1_J12Z1OVxM**
4. Groups → Admins → Add user
5. Email: **kevinalexandreestevesdossantos@gmail.com**

---

## 🔑 Credenciais Instagram/Meta

Acesse: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin

**Platform Configuration → Meta Graph API:**

```
App ID:       1680096733338103
App Secret:   1ea026c9f6dc8d1ae77c3474a1220bcf
Redirect URI: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback
```

---

## 📱 Meta Developer Console

https://developers.facebook.com/apps/1680096733338103

**Facebook Login → Settings → Valid OAuth Redirect URIs:**

```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback
```

---

## ✅ Checklist

- [ ] Deploy: `.\scripts\deploy-instagram-integration.ps1`
- [ ] Adicionar email como Admin no Cognito
- [ ] Logout e login novamente
- [ ] Acessar /admin → Platform Configuration
- [ ] Inserir credenciais Meta
- [ ] Salvar configuração
- [ ] Adicionar Redirect URI no Meta Developer
- [ ] Converter Instagram para Business
- [ ] Conectar Instagram à Página Facebook
- [ ] Testar: Connect Accounts → Publicar post

---

**Documentação completa:** `INSTAGRAM_INTEGRATION_READY.md`
