# Design Document - App Route Access Fix

## Overview

Este documento descreve a solução para permitir que o usuário acesse a rota `/app` (GameView). A solução oferece duas abordagens: modo de visualização sem autenticação e criação de conta de teste.

## Architecture

### Approach 1: View-Only Mode (Rápido)
- Modificar `ProtectedRoute` para permitir acesso em modo de visualização
- Adicionar banner de "Modo de Visualização"
- Desabilitar funcionalidades que requerem autenticação

### Approach 2: Test Account (Completo)
- Criar script para criar usuário de teste no Cognito
- Confirmar email automaticamente
- Associar brand ao usuário
- Fornecer credenciais de teste

## Components and Interfaces

### Modified Components

#### ProtectedRoute.jsx
```javascript
// Adicionar prop opcional para permitir modo de visualização
<ProtectedRoute allowViewMode={true}>
  <GameView />
</ProtectedRoute>
```

#### GameView.jsx
```javascript
// Detectar modo de visualização e mostrar banner
const { isAuthenticated } = useAuth();
if (!isAuthenticated) {
  // Mostrar banner de modo de visualização
  // Desabilitar funcionalidades que requerem API
}
```

### New Components

#### ViewModeBanner.jsx
```javascript
// Banner informativo no topo da tela
// Botão "Fazer Login" para redirecionar
```

### Scripts

#### create-test-user.ps1
```powershell
# Script PowerShell para criar usuário de teste
# Usa AWS CLI para criar usuário no Cognito
# Confirma email automaticamente
# Cria brand associada
```

## Data Models

### Test User Credentials
```javascript
{
  email: "test@experta.ai",
  password: "Test@123456",
  brandName: "Test Brand",
  brandId: "test-brand-uuid"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: View Mode Access
*For any* unauthenticated user accessing `/app` with `allowViewMode=true`, the GameView should render without redirecting to login
**Validates: Requirements 2.1**

### Property 2: Banner Visibility
*For any* unauthenticated user in view mode, the view mode banner should be visible at the top of the screen
**Validates: Requirements 2.2**

### Property 3: Login Redirect
*For any* user clicking the login button in the banner, the system should redirect to `/login` with a return URL parameter
**Validates: Requirements 2.3**

### Property 4: Test User Creation
*For any* execution of the test user creation script, a valid Cognito user should be created with confirmed email status
**Validates: Requirements 3.1, 3.2**

### Property 5: Brand Association
*For any* test user created, a brand should be associated with the user in DynamoDB
**Validates: Requirements 3.3**

## Error Handling

### View Mode Errors
- API calls fail gracefully with mock data
- User sees informative messages
- No console errors

### Test User Creation Errors
- User already exists → Skip creation, return credentials
- Cognito errors → Retry with exponential backoff
- DynamoDB errors → Rollback Cognito user creation

## Testing Strategy

### Manual Testing
1. Access `/app` without login → Should see view mode
2. Click login button → Should redirect to `/login`
3. Run test user script → Should create user
4. Login with test credentials → Should access full functionality

### Unit Tests (Optional)
- Test ProtectedRoute with allowViewMode prop
- Test ViewModeBanner rendering
- Test GameView in view mode

### Integration Tests (Optional)
- Test full flow: view mode → login → authenticated access
- Test test user creation and login flow
