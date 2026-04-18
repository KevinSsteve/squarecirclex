# Rotas da Aplicação ONZO

## 🌐 URL Base
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com
```

---

## 📍 Rotas Públicas (Sem Autenticação)

### Landing Page
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/
```
- Página inicial do site
- Apresentação da plataforma

### Login
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/login
```
- Página de login
- Autenticação com Cognito

### Cadastro
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/signup
```
- Página de registro de novos usuários
- Criação de conta

---

## 🔒 Rotas Protegidas (Requer Autenticação)

### Game View - Visualização de Escritórios
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/app
```
- **ESTA É A ROTA PRINCIPAL COM A VISUALIZAÇÃO DE ESCRITÓRIOS!**
- Visualização 2D isométrica do escritório
- Agentes trabalhando em tempo real
- Departamentos e tarefas
- Sistema de partículas e animações

### Chat / Assistente AI
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/chat
```
- Interface de chat com assistente AI
- Criação de posts e conteúdo
- Planejamento de conteúdo
- Histórico de conversas

### Onboarding
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/onboarding
```
- Processo de configuração inicial
- Configuração da marca
- Integração com redes sociais

### Dashboard
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/dashboard
```
- Visão geral de posts
- Calendário de publicações
- Gerenciamento de conteúdo

### Perfil do Usuário
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/profile
```
- Configurações do perfil
- Informações pessoais
- Preferências

### Conexões de Contas
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/connections
```
- Gerenciar conexões OAuth
- Conectar redes sociais
- Desconectar contas

### Deletar Conta
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/delete-account
```
- Exclusão permanente da conta
- Remoção de todos os dados

---

## 👨‍💼 Rotas Administrativas (Requer Permissão Admin)

### Painel Admin
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin
```
- Monitoramento do sistema
- Configurações da plataforma
- Gerenciamento de usuários

---

## 🎮 Funcionalidades da Game View (/app)

A rota `/app` é onde você verá a visualização de escritórios com:

### Visualização
- **Escritório 2D Isométrico** com PixiJS
- **Agentes animados** trabalhando
- **Departamentos** (Marketing, Design, Analytics, etc.)
- **Tarefas em execução** em tempo real

### Interações
- **Clique em agentes** para ver detalhes
- **Menu de contexto** (botão direito)
- **Zoom e pan** para navegar
- **Painel de tarefas** lateral

### Sistemas
- **Animações** de agentes trabalhando
- **Partículas** para efeitos visuais
- **Som** (opcional, pode ser desativado)
- **Temas** (claro/escuro)
- **Performance otimizada** com culling e LOD

### Controles
- **Botão de alternância de visualização** (canto superior direito)
- **Painel de acessibilidade**
- **Controles de som**
- **Debug overlay** (modo desenvolvedor)

---

## 🔄 Fluxo de Navegação Recomendado

1. **Acesse a Landing Page** → `/`
2. **Faça Login ou Cadastro** → `/login` ou `/signup`
3. **Complete o Onboarding** → `/onboarding` (primeira vez)
4. **Veja o Escritório** → `/app` ⭐ **PRINCIPAL**
5. **Use o Chat para criar conteúdo** → `/chat`
6. **Gerencie posts no Dashboard** → `/dashboard`

---

## 🚀 Como Acessar

### Opção 1: Acesso Direto à Game View
```
http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/app
```
*Nota: Você será redirecionado para login se não estiver autenticado*

### Opção 2: Fluxo Completo
1. Acesse: `http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/`
2. Clique em "Login" ou "Cadastrar"
3. Após autenticação, navegue para `/app`

---

## 🔧 Troubleshooting

### Se você ainda vê o site antigo:

1. **Limpe o cache do navegador:**
   - Chrome: Ctrl+Shift+Delete → Limpar cache
   - Firefox: Ctrl+Shift+Delete → Limpar cache
   - Edge: Ctrl+Shift+Delete → Limpar cache

2. **Acesso anônimo:**
   - Abra uma janela anônima/privada
   - Acesse a URL novamente

3. **Force refresh:**
   - Pressione Ctrl+F5 (Windows)
   - Pressione Cmd+Shift+R (Mac)

4. **Verifique a URL:**
   - Certifique-se de estar usando: `http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com`
   - Não use: `https://` (S3 website usa HTTP)

---

## 📊 Estrutura de Componentes

```
/app (Game View)
├── Scene (PixiJS Canvas)
├── UIOverlay
│   ├── ViewToggleButton
│   ├── TaskQueuePanel
│   ├── AgentListPanel
│   ├── EntityDetailPanel
│   ├── ContextMenu
│   ├── NotificationToast
│   ├── AccessibilityPanel
│   ├── SoundControlPanel
│   └── ErrorNotificationPanel
└── Systems
    ├── AnimationSystem
    ├── MovementSystem
    ├── InteractionSystem
    ├── TaskExecutionSystem
    ├── StateSyncSystem
    ├── ParticleSystem
    ├── ThemeSystem
    ├── SoundSystem
    ├── AccessibilitySystem
    ├── ErrorRecoverySystem
    ├── PerformanceMonitor
    ├── LODSystem
    └── CullingSystem
```

---

## 🎯 Próximos Passos

1. **Acesse a aplicação** usando as URLs acima
2. **Crie uma conta** ou faça login
3. **Explore a Game View** em `/app`
4. **Teste o chat** em `/chat`
5. **Gerencie conteúdo** em `/dashboard`

---

**Última atualização:** 16 de Abril de 2026  
**Ambiente:** Development  
**Status:** ✅ Deployed e Funcionando
