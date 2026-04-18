# Como Limpar o localStorage - Instruções Passo a Passo

## O Problema

O console mostra:
```
[GameView] User prefers traditional view - redirecting to dashboard
```

Isso significa que seu navegador tem uma preferência salva no localStorage que está forçando o redirect para o dashboard.

## Solução: Limpar o localStorage

### Passo 1: Abrir o Console do Navegador

1. Pressione **F12** (ou Ctrl+Shift+I no Windows, Cmd+Option+I no Mac)
2. Clique na aba **Console**

### Passo 2: Executar o Comando

Cole este comando no console e pressione Enter:

```javascript
localStorage.clear();
location.reload();
```

### Passo 3: Verificar

Após o reload, você deve ver no console:

✅ **Logs esperados:**
```
[ViewToggle] Mid-range device detected - MEDIUM performance mode
[ViewToggle] Starting load timeout (attempt 1/3)
[GameView] Performance settings: {...}
[ViewToggle] Game loaded successfully
```

❌ **NÃO deve aparecer:**
```
[GameView] User prefers traditional view - redirecting to dashboard
[GameView] Container ref is null, cannot add canvas
```

## Alternativa: Limpar Apenas a Preferência Específica

Se quiser limpar apenas a preferência do ViewToggle (sem limpar todo o localStorage):

```javascript
localStorage.removeItem('viewToggle');
localStorage.removeItem('experta-game-layer-preferences');
location.reload();
```

## Alternativa 2: Usar o Parâmetro na URL

Se limpar o localStorage não funcionar, use o parâmetro na URL:

```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/?view=game
```

Isso força o game view independente do localStorage.

## Verificar o Que Está Salvo

Para ver o que está salvo no localStorage:

```javascript
console.log('viewToggle:', localStorage.getItem('viewToggle'));
console.log('preferences:', localStorage.getItem('experta-game-layer-preferences'));
```

## Forçar Game View Permanentemente

Para salvar a preferência como "game" permanentemente:

```javascript
localStorage.setItem('viewToggle', JSON.stringify({
  currentView: 'game',
  performanceLevel: 'medium',
  timestamp: Date.now()
}));
location.reload();
```

## Erros Esperados vs Não Esperados

### ✅ Erros ESPERADOS (pode ignorar):

```
GET .../dev/posts 502 (Bad Gateway)
Error fetching posts: {status: 502, ...}
```

Estes erros 502 são normais porque você não está autenticado. O game deve funcionar mesmo com esses erros.

### ❌ Erros NÃO ESPERADOS (indicam problema):

```
[GameView] User prefers traditional view - redirecting to dashboard
[GameView] Container ref is null, cannot add canvas
[GameView] Failed to initialize game: TypeError...
```

Estes erros indicam que o localStorage precisa ser limpo.

## Resumo Rápido

**Comando mais simples:**
```javascript
localStorage.clear(); location.reload();
```

**URL alternativa:**
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/?view=game
```

## Troubleshooting

### Se ainda redirecionar após limpar localStorage:

1. **Limpe o cache do navegador:**
   - Pressione Ctrl+Shift+Delete
   - Selecione "Todo o período"
   - Marque "Imagens e arquivos em cache"
   - Clique em "Limpar dados"

2. **Hard refresh:**
   - Pressione Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)

3. **Modo anônimo:**
   - Abra uma janela anônima (Ctrl+Shift+N)
   - Acesse a URL
   - Isso garante que não há cache ou localStorage

4. **Verifique a URL:**
   - Certifique-se de estar acessando a URL raiz:
   ```
   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/
   ```
   - NÃO acesse `/app` ou outras rotas

## Status Atual

O código está correto e deployado. O problema é apenas o localStorage do seu navegador que tem uma preferência antiga salva.

Após limpar o localStorage, o game view deve carregar normalmente!
