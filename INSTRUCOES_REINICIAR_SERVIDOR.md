# 🔄 Como Reiniciar o Servidor de Desenvolvimento

## 🎯 Por Que Preciso Reiniciar?

O Vite só carrega as variáveis de ambiente (como `VITE_DEV_MODE=true`) quando o servidor **inicia**. Mudanças no arquivo `.env` não são aplicadas durante hot reload.

## ✅ Solução Rápida - Use o Script Automático

### Opção 1: Script PowerShell (Recomendado)

Execute este comando no terminal:

```powershell
.\scripts\restart-dev-server.ps1
```

O script vai:
1. ✅ Parar qualquer processo Vite rodando
2. ✅ Verificar se `VITE_DEV_MODE=true` está no `.env`
3. ✅ Iniciar o servidor em uma nova janela
4. ✅ Mostrar instruções de verificação

### Opção 2: Manualmente

Se preferir fazer manualmente:

#### Passo 1: Parar o Servidor Atual

No terminal onde o Vite está rodando, pressione:
```
Ctrl + C
```

#### Passo 2: Reiniciar o Servidor

```powershell
cd frontend
npm run dev
```

## 🔍 Como Verificar se Funcionou

Quando o servidor iniciar, procure esta mensagem no console:

```
[FeatureFlags] ⚠️  Development mode is ENABLED - Brand association checks are disabled.
```

Se você ver essa mensagem, o dev mode está ativo! ✅

## 🎮 Testando o Acesso à Rota /app

1. Acesse: `http://localhost:5173/app`
2. Você deve ver:
   - ✅ Banner amarelo "Development Mode" no topo
   - ✅ Visualização do jogo carregando
   - ✅ **Nenhum redirecionamento**

## 🚨 Solução de Problemas

### Problema: Ainda sou redirecionado

**Solução 1**: Limpe o cache do navegador
- Chrome/Edge: `Ctrl + Shift + Delete`
- Selecione "Cached images and files"
- Clique em "Clear data"

**Solução 2**: Limpe o localStorage
Abra o console do navegador (F12) e execute:
```javascript
localStorage.clear();
location.reload();
```

**Solução 3**: Verifique se o servidor realmente reiniciou
- Olhe os logs de inicialização no terminal
- Procure pela mensagem "Development mode is ENABLED"
- Se não aparecer, o `.env` não foi carregado

### Problema: Não vejo a mensagem de dev mode

Verifique o arquivo `frontend/.env`:
```properties
VITE_DEV_MODE=true
```

Certifique-se de que:
- ✅ A linha existe
- ✅ O valor é `true` (sem aspas)
- ✅ Não há espaços extras
- ✅ O arquivo está salvo

### Problema: O script PowerShell não executa

Se você receber erro de execução de scripts:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Depois execute o script novamente.

## 📝 Verificação Rápida no Console do Navegador

Execute no console (F12):

```javascript
// Verificar se dev mode está ativo
console.log('VITE_DEV_MODE:', import.meta.env.VITE_DEV_MODE);
// Deve retornar: "true"

// Verificar feature flags
import('../../config/featureFlags.js').then(m => {
  console.log('Feature Flags:', m.default);
});
```

## ✅ Checklist de Sucesso

Após reiniciar o servidor, você deve ter:

- [ ] Servidor Vite rodando sem erros
- [ ] Mensagem "Development mode is ENABLED" no console do servidor
- [ ] Acesso a `http://localhost:5173/app` sem redirecionamento
- [ ] Banner amarelo "Development Mode" visível na página
- [ ] Visualização do jogo (PixiJS canvas) carregando

## 🎯 Resultado Final

Com o servidor reiniciado corretamente, você pode:
- ✅ Acessar `/app` sem completar onboarding
- ✅ Desenvolver e testar o game view livremente
- ✅ Ver logs detalhados no console
- ✅ Trabalhar sem interrupções de autenticação

---

**Dica**: Sempre que mudar variáveis de ambiente no `.env`, lembre-se de reiniciar o servidor!

**Status**: Pronto para uso
**Data**: 2026-04-18
