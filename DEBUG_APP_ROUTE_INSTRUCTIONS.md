# 🔍 Instruções de Debug para Rota /app

## Situação Atual

Você está sendo redirecionado ao tentar acessar `/app`, mesmo após limpar o viewToggle do localStorage.

## Passos de Diagnóstico

### Passo 1: Coletar Logs do Console

1. Abra o navegador em `http://localhost:5173`
2. Pressione **F12** para abrir o DevTools
3. Vá para a aba **Console**
4. Limpe o console (ícone 🚫 ou Ctrl+L)
5. Tente acessar `http://localhost:5173/app`
6. **COPIE TODOS OS LOGS** que aparecerem no console

### Passo 2: Verificar localStorage

No console do DevTools, execute:

```javascript
// Ver todos os itens do localStorage
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(key, '=', localStorage.getItem(key));
}
```

**Copie a saída completa.**

### Passo 3: Verificar Estado de Autenticação

No console, execute:

```javascript
// Verificar tokens Amplify
Object.keys(localStorage).filter(k => k.includes('Cognito') || k.includes('amplify'))
```

**Copie a saída.**

### Passo 4: Testar com Parâmetro URL

1. Acesse: `http://localhost:5173/app?view=game`
2. Observe se ainda redireciona
3. **Copie os logs do console**

### Passo 5: Verificar Network Tab

1. No DevTools, vá para a aba **Network**
2. Marque a opção **Preserve log**
3. Tente acessar `/app` novamente
4. Veja se há alguma requisição sendo feita antes do redirecionamento
5. **Tire um screenshot ou copie as requisições**

## Informações que Preciso

Por favor, me forneça:

1. **Logs do Console** ao tentar acessar `/app`
2. **Conteúdo do localStorage** (saída do Passo 2)
3. **Tokens de autenticação** (saída do Passo 3)
4. **Comportamento com ?view=game** (funciona ou não?)
5. **Requisições de rede** (se houver alguma antes do redirect)

## Possíveis Causas

Baseado no código que analisei, o redirecionamento pode estar acontecendo por:

### 1. ViewToggle (Mais Provável)
- **Arquivo**: `frontend/src/components/game/GameView.jsx` (linhas 120-150)
- **Condição**: `viewToggle.isTraditionalView()` retorna `true`
- **Log esperado**: `[GameView] User prefers traditional view - redirecting to dashboard`

### 2. Falta de Suporte WebGL
- **Arquivo**: `frontend/src/components/game/utils/ViewToggle.js` (linha 150)
- **Condição**: Navegador não suporta WebGL
- **Log esperado**: `[ViewToggle] WebGL not supported - game view disabled`

### 3. Problema de Autenticação
- **Arquivo**: `frontend/src/components/game/GameView.jsx` (linhas 180-250)
- **Condição**: Token inválido ou expirado
- **Log esperado**: `[GameView] No authentication token found` ou `[GameView] Authentication token expired`

### 4. Falta de Brand Association
- **Arquivo**: `frontend/src/components/game/GameView.jsx` (linhas 220-240)
- **Condição**: Usuário não completou onboarding
- **Log esperado**: `[GameView] User has no brand association`

### 5. ProtectedRoute
- **Arquivo**: `frontend/src/components/auth/ProtectedRoute.jsx`
- **Condição**: `getCurrentUser()` falha
- **Comportamento**: Redireciona para `/login`, não `/dashboard`

## Testes Adicionais

### Teste A: Desabilitar ViewToggle Temporariamente

No console, execute:

```javascript
// Forçar game view
localStorage.setItem('viewToggle', JSON.stringify({
    currentView: 'game',
    performanceLevel: 'high',
    timestamp: Date.now()
}));

// Recarregar
location.reload();
```

### Teste B: Verificar WebGL

No console, execute:

```javascript
// Testar suporte WebGL
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
console.log('WebGL supported:', !!gl);
```

### Teste C: Verificar Feature Flags

No console, execute:

```javascript
// Ver feature flags (se disponível)
fetch('http://localhost:5173/src/config/featureFlags.js')
    .then(r => r.text())
    .then(console.log);
```

## Próximos Passos

Depois de coletar essas informações, poderei:

1. Identificar a causa exata do redirecionamento
2. Criar uma correção específica
3. Testar a solução

## Ferramentas Criadas

Você tem acesso a estas ferramentas:

1. **`.\scripts\run-debug-app-route.ps1`** - Ferramenta de diagnóstico completa
2. **`.\scripts\run-clear-viewtoggle.ps1`** - Limpar viewToggle
3. **`scripts/test-direct-access.html`** - Testes diretos de acesso

---

**Aguardando suas informações para continuar o diagnóstico!** 🔍
