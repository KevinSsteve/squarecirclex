# Como Adicionar Usuário Admin Manualmente

**Email**: kevinalexandreestevesdossantos@gmail.com  
**User Pool ID**: us-east-1_J12Z1OVxM  
**Região**: us-east-1  

---

## Opção 1: Via AWS Console (Mais Fácil)

### Passo 1: Acessar o Cognito

1. Acesse o AWS Console: https://console.aws.amazon.com/cognito/
2. Certifique-se de estar na região **us-east-1** (N. Virginia)
3. Clique em "User pools"
4. Encontre e clique no User Pool: **us-east-1_J12Z1OVxM**

### Passo 2: Verificar se o Usuário Existe

1. No menu lateral, clique em "Users"
2. Procure pelo email: **kevinalexandreestevesdossantos@gmail.com**

**Se o usuário NÃO existir:**
- Clique em "Create user"
- Email: kevinalexandreestevesdossantos@gmail.com
- Marque "Mark email as verified"
- Senha temporária: TempPass123!
- Desmarque "Send an email invitation"
- Clique em "Create user"

**Se o usuário JÁ existir:**
- Prossiga para o Passo 3

### Passo 3: Verificar se o Grupo "Admins" Existe

1. No menu lateral, clique em "Groups"
2. Procure pelo grupo "Admins"

**Se o grupo NÃO existir:**
- Clique em "Create group"
- Group name: Admins
- Description: System administrators with full access
- Clique em "Create group"

### Passo 4: Adicionar Usuário ao Grupo Admins

1. Clique no grupo "Admins"
2. Clique em "Add user to group"
3. Selecione o usuário: kevinalexandreestevesdossantos@gmail.com
4. Clique em "Add"

### Passo 5: Fazer Login

1. Acesse: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/login
2. Email: kevinalexandreestevesdossantos@gmail.com
3. Senha: TempPass123! (ou a senha que você definiu)
4. Você será redirecionado para /chat
5. Acesse o admin em: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin

---

## Opção 2: Via AWS CLI (Se o CLI estiver funcionando)

### Verificar se o usuário existe:
```bash
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username kevinalexandreestevesdossantos@gmail.com \
  --region us-east-1
```

### Se o usuário NÃO existir, criar:
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username kevinalexandreestevesdossantos@gmail.com \
  --user-attributes Name=email,Value=kevinalexandreestevesdossantos@gmail.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS \
  --region us-east-1
```

### Definir senha permanente:
```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username kevinalexandreestevesdossantos@gmail.com \
  --password TempPass123! \
  --permanent \
  --region us-east-1
```

### Verificar se o grupo Admins existe:
```bash
aws cognito-idp list-groups \
  --user-pool-id us-east-1_J12Z1OVxM \
  --region us-east-1
```

### Se o grupo NÃO existir, criar:
```bash
aws cognito-idp create-group \
  --user-pool-id us-east-1_J12Z1OVxM \
  --group-name Admins \
  --description "System administrators with full access" \
  --region us-east-1
```

### Adicionar usuário ao grupo Admins:
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_J12Z1OVxM \
  --username kevinalexandreestevesdossantos@gmail.com \
  --group-name Admins \
  --region us-east-1
```

---

## Opção 3: Fazer Signup Normal e Depois Adicionar ao Grupo

### Passo 1: Fazer Signup
1. Acesse: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/signup
2. Preencha o formulário com seu email
3. Confirme o email (se necessário)
4. Faça login

### Passo 2: Adicionar ao Grupo Admins (Via Console)
1. Siga os passos da **Opção 1 - Passo 3 e 4**

---

## Verificação

Após adicionar o usuário ao grupo Admins:

1. Faça logout (se estiver logado)
2. Faça login novamente
3. Tente acessar: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin
4. Você deve ver o painel de administração

---

## Troubleshooting

### "Access Denied" no Admin Panel
- Certifique-se de que o usuário está no grupo "Admins"
- Faça logout e login novamente
- Limpe o cache do navegador (Ctrl+F5)

### Não consigo fazer login
- Verifique se o email está correto
- Verifique se a senha está correta
- Se esqueceu a senha, use "Forgot Password" no login

### AWS CLI não funciona
- Use a **Opção 1** (AWS Console) que é mais fácil e visual

---

## Informações do Sistema

- **User Pool ID**: us-east-1_J12Z1OVxM
- **Região**: us-east-1
- **Frontend URL**: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com
- **Admin Panel**: http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin

---

**Recomendação**: Use a **Opção 1** (AWS Console) - é a forma mais fácil e visual de adicionar o usuário como admin.
