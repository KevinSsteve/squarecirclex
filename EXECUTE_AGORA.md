# 🚀 Execute Agora

## 1 Comando para Fazer Tudo

```powershell
.\scripts\setup-instagram-complete.ps1
```

---

## O Que Este Comando Faz

1. Configura suas credenciais Instagram no AWS
2. Faz deploy do backend
3. Faz deploy do frontend

**Tempo**: 5-10 minutos

---

## Suas Credenciais (Já Configuradas)

```
App ID:     1680096733338103
App Secret: 1ea026c9f6dc8d1ae77c3474a1220bcf
```

---

## Depois do Deploy

### 1. Meta Developer (2 minutos)

https://developers.facebook.com/apps/1680096733338103

Adicione este Redirect URI:
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/oauth/callback
```

### 2. Instagram (3 minutos)

- Converter para Business
- Conectar à Página Facebook

### 3. Testar (5 minutos)

- Acessar sistema
- Connect Accounts → Instagram
- Criar post
- Publicar

---

## Pronto!

Execute o comando acima e siga os 3 passos.

**Total**: 20 minutos
