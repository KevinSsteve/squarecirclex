# Quick Start - Deploy no GitHub

## Opção 1: Script Automático (Recomendado)

Execute o script PowerShell que automatiza todo o processo:

```powershell
.\scripts\deploy-to-github.ps1
```

O script vai:
- ✓ Verificar se Git está instalado
- ✓ Inicializar repositório (se necessário)
- ✓ Adicionar arquivos
- ✓ Criar commit
- ✓ Configurar remote
- ✓ Fazer push para GitHub

---

## Opção 2: Comandos Manuais

### Passo 1: Inicializar Git (se necessário)

```powershell
git init
```

### Passo 2: Adicionar arquivos

```powershell
git add .
```

### Passo 3: Criar commit

```powershell
git commit -m "feat: landing page redesign with modern UI"
```

### Passo 4: Criar repositório no GitHub

1. Acesse https://github.com/new
2. Nome: `experta-landing-page`
3. Clique em "Create repository"

### Passo 5: Conectar e fazer push

```powershell
# Substitua SEU_USERNAME e SEU_REPO
git remote add origin https://github.com/SEU_USERNAME/SEU_REPO.git
git branch -M main
git push -u origin main
```

---

## Configurar GitHub Pages

### Método 1: Via Interface (Simples)

1. Vá para o repositório no GitHub
2. Settings > Pages
3. Source: Deploy from a branch
4. Branch: `main` / Folder: `/ (root)`
5. Save

### Método 2: Via GitHub Actions (Automático)

O workflow já está configurado em `.github/workflows/deploy-landing-page.yml`

1. Vá para o repositório no GitHub
2. Settings > Pages
3. Source: GitHub Actions
4. O deploy acontecerá automaticamente a cada push

---

## Verificar Deploy

1. Vá para Actions no GitHub
2. Veja o workflow rodando
3. Quando terminar (✓), acesse:
   - `https://SEU_USERNAME.github.io/SEU_REPO/`

---

## Troubleshooting Rápido

### Erro: "Permission denied"
```powershell
# Use HTTPS com token
git remote set-url origin https://TOKEN@github.com/USER/REPO.git
```

### Erro: "Build failed"
```powershell
# Teste localmente
cd frontend
npm install
npm run build
```

### Página 404
- Aguarde 5-10 minutos após primeiro deploy
- Verifique Settings > Pages está ativado
- Verifique branch correto está selecionado

---

## Próximos Deploys

Depois do setup inicial, é só:

```powershell
git add .
git commit -m "feat: sua alteração"
git push origin main
```

O GitHub Actions fará o deploy automaticamente! 🚀

---

## Precisa de Ajuda?

Consulte o guia completo: `GITHUB_DEPLOY_LANDING_PAGE_GUIDE.md`
