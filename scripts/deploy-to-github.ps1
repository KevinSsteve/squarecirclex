# Script de Deploy para GitHub
# Automatiza o processo de push para GitHub

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Deploy Landing Page - GitHub   " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Git está instalado
Write-Host "1. Verificando Git..." -ForegroundColor Yellow
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if ($gitCheck) {
    $gitVersion = git --version
    Write-Host "   ✓ Git encontrado: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Git não encontrado! Instale o Git primeiro." -ForegroundColor Red
    Write-Host "   Download: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar se é um repositório Git
Write-Host "2. Verificando repositório Git..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "   ! Repositório Git não inicializado" -ForegroundColor Yellow
    $init = Read-Host "   Deseja inicializar? (s/n)"
    if ($init -eq "s") {
        git init
        Write-Host "   ✓ Repositório Git inicializado" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Operação cancelada" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✓ Repositório Git encontrado" -ForegroundColor Green
}

Write-Host ""

# Verificar status
Write-Host "3. Verificando alterações..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "   Arquivos modificados:" -ForegroundColor Cyan
    git status --short
} else {
    Write-Host "   ✓ Nenhuma alteração para commit" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tudo está atualizado! Nada para fazer." -ForegroundColor Green
    exit 0
}

Write-Host ""

# Adicionar arquivos
Write-Host "4. Adicionando arquivos..." -ForegroundColor Yellow
$add = Read-Host "   Adicionar todos os arquivos? (s/n)"
if ($add -eq "s") {
    git add .
    Write-Host "   ✓ Arquivos adicionados" -ForegroundColor Green
} else {
    Write-Host "   ! Use 'git add <arquivo>' manualmente" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Commit
Write-Host "5. Criando commit..." -ForegroundColor Yellow
$defaultMessage = "feat: update landing page"
$message = Read-Host "   Mensagem do commit (Enter para usar: '$defaultMessage')"
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = $defaultMessage
}

git commit -m "$message"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Commit criado" -ForegroundColor Green
} else {
    Write-Host "   ✗ Erro ao criar commit" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar remote
Write-Host "6. Verificando remote..." -ForegroundColor Yellow
$remotes = git remote -v
if (-not $remotes) {
    Write-Host "   ! Nenhum remote configurado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Configure o remote manualmente:" -ForegroundColor Cyan
    Write-Host "   git remote add origin https://github.com/SEU_USERNAME/SEU_REPO.git" -ForegroundColor White
    Write-Host ""
    $remoteUrl = Read-Host "   Cole a URL do seu repositório GitHub (ou Enter para pular)"
    
    if (-not [string]::IsNullOrWhiteSpace($remoteUrl)) {
        git remote add origin $remoteUrl
        Write-Host "   ✓ Remote adicionado" -ForegroundColor Green
    } else {
        Write-Host "   ! Remote não configurado. Configure manualmente depois." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "   ✓ Remote configurado:" -ForegroundColor Green
    Write-Host "   $remotes" -ForegroundColor Cyan
}

Write-Host ""

# Push
Write-Host "7. Fazendo push..." -ForegroundColor Yellow
$push = Read-Host "   Fazer push para GitHub? (s/n)"
if ($push -eq "s") {
    # Verificar se branch main existe
    $currentBranch = git branch --show-current
    if ($currentBranch -ne "main") {
        Write-Host "   ! Branch atual: $currentBranch" -ForegroundColor Yellow
        $rename = Read-Host "   Renomear para 'main'? (s/n)"
        if ($rename -eq "s") {
            git branch -M main
            Write-Host "   ✓ Branch renomeado para 'main'" -ForegroundColor Green
        }
    }
    
    # Fazer push
    Write-Host "   Enviando para GitHub..." -ForegroundColor Cyan
    git push -u origin main 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Push concluído com sucesso!" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "==================================" -ForegroundColor Green
        Write-Host "  Deploy Concluído com Sucesso!  " -ForegroundColor Green
        Write-Host "==================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Cyan
        Write-Host "1. Acesse seu repositório no GitHub" -ForegroundColor White
        Write-Host "2. Vá em Settings > Pages" -ForegroundColor White
        Write-Host "3. Configure o GitHub Pages" -ForegroundColor White
        Write-Host "4. Aguarde alguns minutos" -ForegroundColor White
        Write-Host "5. Acesse: https://SEU_USERNAME.github.io/SEU_REPO/" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "   ✗ Erro ao fazer push" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possíveis soluções:" -ForegroundColor Yellow
        Write-Host "1. Verifique suas credenciais do GitHub" -ForegroundColor White
        Write-Host "2. Configure um Personal Access Token" -ForegroundColor White
        Write-Host "3. Use SSH ao invés de HTTPS" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "   ! Push cancelado" -ForegroundColor Yellow
    Write-Host "   Use 'git push origin main' quando estiver pronto" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Script concluído!" -ForegroundColor Green
