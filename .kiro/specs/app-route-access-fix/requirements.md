# Requirements Document - App Route Access Fix

## Introduction

O usuário não consegue acessar a rota `/app` (GameView) porque está sendo redirecionado automaticamente para `/login`. Este documento define os requisitos para permitir acesso à visualização do escritório.

## Glossary

- **GameView**: Componente React que renderiza a visualização 2D isométrica do escritório
- **ProtectedRoute**: Componente que verifica autenticação antes de permitir acesso
- **AuthContext**: Contexto React que gerencia estado de autenticação
- **Cognito**: Serviço AWS de autenticação de usuários

## Requirements

### Requirement 1: Diagnóstico do Problema de Acesso

**User Story:** Como desenvolvedor, eu quero diagnosticar por que o usuário não consegue acessar `/app`, para que eu possa identificar a causa raiz.

#### Acceptance Criteria

1. WHEN verificamos o estado de autenticação THEN o sistema SHALL identificar se o usuário está autenticado ou não
2. WHEN verificamos o localStorage THEN o sistema SHALL identificar se existem tokens do Cognito armazenados
3. WHEN verificamos os logs do navegador THEN o sistema SHALL mostrar erros de autenticação se existirem
4. WHEN verificamos a configuração do Amplify THEN o sistema SHALL confirmar se está corretamente configurado

### Requirement 2: Solução de Acesso Imediato

**User Story:** Como usuário, eu quero acessar a visualização do escritório em `/app`, para que eu possa ver o sistema funcionando.

#### Acceptance Criteria

1. WHEN o usuário acessa `/app` sem autenticação THEN o sistema SHALL permitir acesso em modo de visualização
2. WHEN o usuário está em modo de visualização THEN o sistema SHALL mostrar um banner indicando "Modo de Visualização - Faça login para funcionalidade completa"
3. WHEN o usuário clica no banner THEN o sistema SHALL redirecionar para `/login`
4. WHEN o usuário faz login THEN o sistema SHALL redirecionar de volta para `/app` com funcionalidade completa

### Requirement 3: Criação de Conta de Teste

**User Story:** Como desenvolvedor, eu quero criar uma conta de teste rapidamente, para que o usuário possa testar o sistema com autenticação completa.

#### Acceptance Criteria

1. WHEN executamos o script de criação de usuário THEN o sistema SHALL criar um usuário no Cognito
2. WHEN o usuário é criado THEN o sistema SHALL confirmar o email automaticamente
3. WHEN o usuário é criado THEN o sistema SHALL associar uma brand ao usuário
4. WHEN o usuário faz login com as credenciais de teste THEN o sistema SHALL permitir acesso completo

### Requirement 4: Documentação de Acesso

**User Story:** Como usuário, eu quero instruções claras de como acessar o sistema, para que eu não fique bloqueado novamente.

#### Acceptance Criteria

1. WHEN criamos a documentação THEN o sistema SHALL incluir instruções de login
2. WHEN criamos a documentação THEN o sistema SHALL incluir credenciais de teste
3. WHEN criamos a documentação THEN o sistema SHALL incluir troubleshooting de problemas comuns
4. WHEN criamos a documentação THEN o sistema SHALL incluir comandos para limpar cache/localStorage
