# Implementation Plan: App Route Access Fix

## Overview

Implementação de solução para permitir acesso à rota `/app` através de modo de visualização ou criação de conta de teste.

## Tasks

- [ ] 1. Diagnóstico do problema atual
  - Verificar estado de autenticação no navegador
  - Verificar localStorage para tokens do Cognito
  - Verificar configuração do Amplify
  - Documentar causa raiz do problema
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Implementar modo de visualização (Solução Rápida)
  - [ ] 2.1 Modificar ProtectedRoute para aceitar prop allowViewMode
    - Adicionar prop opcional `allowViewMode`
    - Permitir renderização de children quando allowViewMode=true
    - Passar flag isViewMode para children via context
    - _Requirements: 2.1_
  
  - [ ] 2.2 Criar componente ViewModeBanner
    - Banner fixo no topo da tela
    - Mensagem "Modo de Visualização - Faça login para funcionalidade completa"
    - Botão "Fazer Login" que redireciona para /login
    - Estilo consistente com design system
    - _Requirements: 2.2, 2.3_
  
  - [ ] 2.3 Atualizar GameView para modo de visualização
    - Detectar se está em modo de visualização
    - Renderizar ViewModeBanner quando não autenticado
    - Desabilitar chamadas de API que requerem autenticação
    - Usar dados mock para demonstração
    - _Requirements: 2.1, 2.2_
  
  - [ ] 2.4 Atualizar App.jsx para usar allowViewMode
    - Adicionar prop allowViewMode={true} na rota /app
    - Testar acesso sem autenticação
    - _Requirements: 2.1_

- [ ] 3. Criar script de usuário de teste (Solução Completa)
  - [ ] 3.1 Criar script PowerShell create-test-user.ps1
    - Verificar se usuário já existe
    - Criar usuário no Cognito com AWS CLI
    - Confirmar email automaticamente
    - Gerar senha segura
    - _Requirements: 3.1, 3.2_
  
  - [ ] 3.2 Adicionar criação de brand no DynamoDB
    - Criar brand de teste
    - Associar brand ao usuário
    - Inserir dados iniciais necessários
    - _Requirements: 3.3_
  
  - [ ] 3.3 Adicionar output de credenciais
    - Exibir email e senha do usuário criado
    - Salvar credenciais em arquivo seguro
    - Adicionar instruções de uso
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. Criar documentação de acesso
  - Criar arquivo ACCESS_INSTRUCTIONS.md
  - Incluir instruções de login
  - Incluir credenciais de teste
  - Incluir troubleshooting
  - Incluir comandos para limpar cache
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Testar e validar soluções
  - Testar modo de visualização sem autenticação
  - Testar criação de usuário de teste
  - Testar login com credenciais de teste
  - Testar acesso completo após login
  - Validar que todas as funcionalidades funcionam
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Deploy das alterações
  - Build do frontend com alterações
  - Deploy para S3
  - Verificar que alterações estão ativas
  - Testar em produção
  - _Requirements: 2.1, 2.2, 2.3_

## Notes

- Task 2 (Modo de Visualização) é a solução mais rápida
- Task 3 (Usuário de Teste) é a solução mais completa
- Ambas as soluções podem ser implementadas em paralelo
- Priorizar Task 2 para acesso imediato
