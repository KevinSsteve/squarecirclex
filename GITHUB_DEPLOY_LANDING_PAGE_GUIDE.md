# Guia de Deploy da Landing Page no GitHub

**Data:** 2026-04-26
**Objetivo:** Fazer deploy do frontend (landing page) no GitHub e configurar GitHub Pages

## Pré-requisitos

- Git instalado no seu sistema
- Conta no GitHub
- Acesso ao terminal/PowerShell

## Passo 1: Verificar Status do Git

Primeiro, vamos verificar se o repositório Git já está inicializado:

```powershell
# Verificar se já existe repositório Git
git status
```

Se aparecer "fatal: not a git repository", precisamos inicializar:

```powershell
# Inicializar repositório Git
git init
```

## Passo 2: Criar .gitignore (se não existir)

Certifique-se de que tem um `.gitignore` adequado para não enviar arquivos desnecessários:

```
# Dependências
node_modules/
frontend/node_modules/

# Build
frontend/build/
frontend/dist/
.aws-sam/

# Ambiente
.env
.env.local
frontend/.env.local

# Logs
*.log
npm-debug.log*

# Sistema
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# AWS
deployment-outputs-*.txt
samconfig.toml

# Testes
coverage/
.pytest_cache/
__pycache__/
```

## Passo 3: Adicionar Arquivos ao Git

```powershell
# Adicionar todos os arquivos (exceto os do .gitignore)
git add .

# Verificar o que será commitado
git status
```

## Passo 4: Fazer o Primeiro Commit

```powershell
# Criar commit com mensagem descritiva
git commit -m "feat: landing page redesign with modern UI

- Implemented design system with colors, typography, spacing
- Created Hero section with CTAs
- Added Services section with 6 service cards
- Implemented Process section with 4 steps
- Added Case Studies section with 3 success stories
- Responsive design for mobile, tablet, and desktop"
```

## Passo 5: Criar Repositório no GitHub

1. Acesse https://github.com
2. Clique no botão "+" no canto superior direito
3. Selecione "New repository"
4. Preencha:
   - **Repository name:** `experta-landing-page` (ou o nome que preferir)
   - **Description:** "Landing page moderna para Experta - Gestão de Redes Sociais com IA"
   - **Visibility:** Public ou Private (sua escolha)
   - **NÃO** marque "Initialize this repository with a README"
5. Clique em "Create repository"

## Passo 6: Conectar Repositório Local ao GitHub

Após criar o repositório, o GitHub mostrará comandos. Use estes:

```powershell
# Adicionar remote (substitua SEU_USERNAME e SEU_REPO pelo seu)
git remote add origin https://github.com/SEU_USERNAME/SEU_REPO.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push inicial
git push -u origin main
```

**Exemplo real:**
```powershell
git remote add origin https://github.com/joaosilva/experta-landing-page.git
git branch -M main
git push -u origin main
```

## Passo 7: Configurar GitHub Pages (Opção 1 - Simples)

### Opção A: Deploy Direto do Branch Main

1. No GitHub, vá para o seu repositório
2. Clique em "Settings" (Configurações)
3. No menu lateral, clique em "Pages"
4. Em "Source", selecione:
   - **Branch:** `main`
   - **Folder:** `/frontend` (se quiser servir só o frontend)
   - OU **Folder:** `/ (root)` (se quiser servir tudo)
5. Clique em "Save"
6. Aguarde alguns minutos
7. O GitHub mostrará a URL: `https://SEU_USERNAME.github.io/SEU_REPO/`

### Opção B: Deploy com GitHub Actions (Recomendado)

Vou criar um workflow automático para você:

## Passo 8: Criar GitHub Actions Workflow

Crie o arquivo `.github/workflows/deploy-landing-page.yml`:

```yaml
name: Deploy Landing Page

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      working-directory: ./frontend
      run: npm ci
    
    - name: Build frontend
      working-directory: ./frontend
      run: npm run build
      env:
        CI: false
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./frontend/build
        cname: experta.com.br  # Opcional: se tiver domínio customizado
```

## Passo 9: Verificar package.json do Frontend

Certifique-se de que o `frontend/package.json` tem o script de build:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

Se estiver usando Vite, o script seria:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Passo 10: Configurar Base URL (Importante!)

Se estiver usando React Router, adicione `basename` no `frontend/src/App.jsx`:

```jsx
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL || '/'}>
      {/* Seu código */}
    </BrowserRouter>
  );
}
```

E no `frontend/package.json`, adicione:

```json
{
  "homepage": "https://SEU_USERNAME.github.io/SEU_REPO"
}
```

## Passo 11: Fazer Push das Alterações

```powershell
# Adicionar novos arquivos
git add .

# Commit
git commit -m "chore: configure GitHub Pages deployment"

# Push
git push origin main
```

## Passo 12: Verificar Deploy

1. Vá para o repositório no GitHub
2. Clique na aba "Actions"
3. Veja o workflow rodando
4. Quando terminar (✓ verde), acesse a URL do GitHub Pages

## Comandos Úteis para Futuros Deploys

```powershell
# Ver status
git status

# Adicionar alterações
git add .

# Commit
git commit -m "feat: adicionar nova seção"

# Push (deploy automático)
git push origin main

# Ver histórico
git log --oneline

# Ver branches
git branch -a

# Ver remotes
git remote -v
```

## Troubleshooting

### Problema: "Permission denied (publickey)"

**Solução:** Configure SSH ou use HTTPS com token:

```powershell
# Usar HTTPS com token
git remote set-url origin https://SEU_TOKEN@github.com/SEU_USERNAME/SEU_REPO.git
```

### Problema: "Build failed"

**Solução:** Teste o build localmente primeiro:

```powershell
cd frontend
npm install
npm run build
```

### Problema: "404 Page Not Found"

**Solução:** Verifique:
1. GitHub Pages está ativado nas Settings
2. O branch correto está selecionado
3. A pasta correta está selecionada
4. Aguarde 5-10 minutos após o primeiro deploy

### Problema: "Rotas não funcionam (404)"

**Solução:** Adicione arquivo `frontend/public/404.html` que redireciona para index.html:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Experta</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/'">
  </head>
</html>
```

## Próximos Passos

Após o deploy bem-sucedido:

1. ✅ Testar a landing page no GitHub Pages
2. ✅ Verificar responsividade em diferentes dispositivos
3. ✅ Testar todos os links e CTAs
4. ✅ Configurar domínio customizado (opcional)
5. ✅ Adicionar Google Analytics (opcional)
6. ✅ Continuar com Tasks 6-16 da landing page

## Domínio Customizado (Opcional)

Se quiser usar um domínio próprio (ex: www.experta.com.br):

1. No GitHub Pages Settings, adicione o domínio em "Custom domain"
2. No seu provedor de DNS, adicione:
   - **CNAME record:** `www` → `SEU_USERNAME.github.io`
   - **A records:** `@` → IPs do GitHub Pages:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153

---

## Resumo dos Comandos

```powershell
# Setup inicial
git init
git add .
git commit -m "feat: landing page redesign"
git remote add origin https://github.com/SEU_USERNAME/SEU_REPO.git
git branch -M main
git push -u origin main

# Deploys futuros
git add .
git commit -m "feat: sua mensagem"
git push origin main
```

**Pronto!** Seu site estará disponível em:
`https://SEU_USERNAME.github.io/SEU_REPO/`

---

**Precisa de ajuda?** Me avise em qual passo está e posso ajudar com comandos específicos!
