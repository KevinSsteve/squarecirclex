# Design Document

## Overview

This design addresses two independent but related issues:

1. **Backend 500 Error**: The GameView component attempts to fetch posts without proper authentication, causing the Posts_API Lambda to throw "User has no brand association" errors
2. **PixiJS v8 Deprecations**: The game rendering code uses deprecated PixiJS v7 APIs that need updating to v8 standards

The solution involves adding authentication checks to the GameView, improving error handling, and systematically updating all deprecated PixiJS API calls.

## Architecture

### Authentication Flow

```
GameView Mount
    ↓
Check Auth Status (tokenManager)
    ↓
    ├─→ [Authenticated] → Fetch Posts → Render Game
    ↓
    └─→ [Not Authenticated] → Show Auth Required Message
```

### Error Handling Flow

```
API Request
    ↓
    ├─→ [401/403] → Redirect to Login
    ├─→ [500 with "no brand"] → Show Onboarding Prompt
    ├─→ [500 other] → Log Error + Show Generic Message
    └─→ [Network Error] → Circuit Breaker Logic
```

## Components and Interfaces

### 1. GameView Authentication Guard

**Location**: `frontend/src/components/game/GameView.jsx`

**Changes**:
- Add authentication check before mounting game
- Add state for authentication status
- Add UI for unauthenticated state

```javascript
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [authChecking, setAuthChecking] = useState(true);

useEffect(() => {
  const checkAuth = async () => {
    try {
      const token = await tokenManager.getToken();
      const isExpired = await tokenManager.isTokenExpired();
      setIsAuthenticated(!!token && !isExpired);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  };
  
  checkAuth();
}, []);
```

### 2. Enhanced Error Handling

**Location**: `frontend/src/components/game/GameView.jsx`

**Changes**:
- Differentiate between auth errors and server errors
- Add specific handling for "no brand association" error
- Improve user feedback messages

```javascript
const fetchPosts = async () => {
  try {
    const response = await api.getPosts();
    // ... existing logic
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      // Auth error - redirect handled by interceptor
      return;
    }
    
    if (error.status === 500 && error.message?.includes('brand association')) {
      setErrorMessage('Please complete onboarding to view your dashboard');
      setConnectionStatus('auth_required');
      return;
    }
    
    // Existing circuit breaker logic for other errors
    consecutiveErrors++;
    // ...
  }
};
```

### 3. PixiJS Graphics API Updates

**Affected Files**:
- `frontend/src/components/game/visuals/TaskWorkflowVisuals.js`
- `frontend/src/components/game/visuals/TaskScreenVisuals.js`
- `frontend/src/components/game/systems/ParticleSystem.js`
- `frontend/src/components/game/ui/*` (any files using Graphics)

**Migration Pattern**:

```javascript
// OLD (v7)
graphics.beginFill(0xFF0000, 0.5);
graphics.drawCircle(0, 0, 10);
graphics.endFill();

// NEW (v8)
graphics.fill({ color: 0xFF0000, alpha: 0.5 });
graphics.circle(0, 0, 10);
graphics.fill();
```

```javascript
// OLD (v7)
graphics.drawRect(x, y, width, height);
graphics.drawRoundedRect(x, y, width, height, radius);

// NEW (v8)
graphics.rect(x, y, width, height);
graphics.roundRect(x, y, width, height, radius);
```

```javascript
// OLD (v7)
const text = new PIXI.Text('Hello', { fontSize: 12 });
container.name = 'myContainer';
const canvas = app.view;

// NEW (v8)
const text = new PIXI.Text({ text: 'Hello', style: { fontSize: 12 } });
container.label = 'myContainer';
const canvas = app.canvas;
```

### 4. Posts API Error Response

**Location**: `functions/posts-api/handler.js`

**Changes**:
- Return structured error for missing brand association
- Include helpful message for frontend

```javascript
if (!brandId) {
  return {
    statusCode: 403, // Changed from throwing error
    headers: corsHeaders,
    body: JSON.stringify({
      error: {
        code: 'NO_BRAND_ASSOCIATION',
        message: 'User has no brand association. Please complete onboarding.',
        details: {
          requiresOnboarding: true
        }
      }
    })
  };
}
```

## Data Models

### Authentication State

```typescript
interface AuthState {
  isAuthenticated: boolean;
  authChecking: boolean;
  user: {
    userId: string;
    brandId: string | null;
  } | null;
}
```

### Error Response

```typescript
interface APIError {
  status: number;
  code: string;
  message: string;
  details?: {
    requiresOnboarding?: boolean;
    [key: string]: any;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication Check Before API Calls

*For any* GameView mount, if the user is not authenticated, then no API calls to /posts should be made.

**Validates: Requirements 1.1, 1.2**

### Property 2: Graphics API Consistency

*For any* shape drawn with the new PixiJS v8 API, the visual output should be identical to the output produced by the deprecated v7 API.

**Validates: Requirements 4.1, 4.2**

### Property 3: Error Message Clarity

*For any* backend error response, if the error code is 'NO_BRAND_ASSOCIATION', then the frontend should display a message mentioning onboarding.

**Validates: Requirements 3.1, 3.4**

### Property 4: Container Label Preservation

*For any* container that previously used `.name` property, after updating to `.label`, all lookups and references should continue to work correctly.

**Validates: Requirements 4.3**

### Property 5: Text Constructor Equivalence

*For any* text object created with the new constructor syntax, the text content and styling should match the old constructor syntax exactly.

**Validates: Requirements 4.2**

## Error Handling

### Authentication Errors (401/403)
- Handled by axios interceptor
- Redirects to /login
- No retry attempts

### Brand Association Error (500 with specific message)
- Display onboarding prompt
- Stop circuit breaker retries
- Provide link to onboarding flow

### Generic Server Errors (500)
- Log full error details to console
- Display generic error message to user
- Continue circuit breaker retry logic

### Network Errors
- Existing circuit breaker handles retries
- Exponential backoff preserved
- Max 5 attempts before stopping

## Testing Strategy

### Unit Tests

1. **Authentication Guard Tests**
   - Test GameView with authenticated user
   - Test GameView with unauthenticated user
   - Test GameView with expired token

2. **Error Handling Tests**
   - Test 401 response handling
   - Test 403 response handling
   - Test 500 with brand association error
   - Test 500 with generic error
   - Test network error handling

3. **PixiJS API Tests**
   - Test each Graphics method produces correct output
   - Test Text constructor with various styles
   - Test Container label lookups
   - Test Application canvas access

### Property-Based Tests

1. **Property Test: Authentication Before Fetch**
   - Generate random auth states
   - Verify API calls only made when authenticated
   - **Feature: backend-500-pixijs-v8-fix, Property 1**

2. **Property Test: Graphics Visual Equivalence**
   - Generate random shape parameters
   - Compare v7 and v8 output
   - **Feature: backend-500-pixijs-v8-fix, Property 2**

3. **Property Test: Error Message Mapping**
   - Generate various error responses
   - Verify correct user messages displayed
   - **Feature: backend-500-pixijs-v8-fix, Property 3**

### Integration Tests

1. Test full authentication flow from GameView mount to posts fetch
2. Test error recovery when authentication is restored
3. Test visual rendering with updated PixiJS APIs
4. Test backward compatibility with existing game features

### Manual Testing

1. Load GameView without authentication → Should show auth required message
2. Load GameView with authentication but no brand → Should show onboarding prompt
3. Load GameView with full authentication → Should load normally
4. Verify no PixiJS deprecation warnings in console
5. Verify all visual elements render correctly
