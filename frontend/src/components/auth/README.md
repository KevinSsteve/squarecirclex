# Authentication Components

This directory contains all authentication-related components for the Experta application.

## Components

### Login.jsx
Login component with AWS Cognito integration.

**Features:**
- Email/password authentication
- Error handling for various auth scenarios
- Loading states
- Redirect to signup page
- Automatic redirect to dashboard on successful login

**Usage:**
```jsx
import { Login } from './components/auth';

<Route path="/login" element={<Login />} />
```

### Signup.jsx
Signup component with email verification flow.

**Features:**
- User registration with email/password
- Password strength validation (8+ chars, uppercase, lowercase, number, special char)
- Two-step process: signup → email verification
- Email verification code input
- Auto sign-in after verification
- Redirect to onboarding after successful signup

**Usage:**
```jsx
import { Signup } from './components/auth';

<Route path="/signup" element={<Signup />} />
```

### ProtectedRoute.jsx
Higher-order component for protecting routes that require authentication.

**Features:**
- Checks authentication status on mount
- Shows loading spinner while checking auth
- Redirects to login if not authenticated
- Renders children if authenticated

**Usage:**
```jsx
import { ProtectedRoute } from './components/auth';

<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

## Context

### AuthContext.jsx
Global authentication state management using React Context.

**Provides:**
- `user` - Current user object
- `loading` - Loading state
- `isAuthenticated` - Boolean authentication status
- `getToken()` - Get current JWT token
- `signOut()` - Sign out user
- `checkUser()` - Refresh user state

**Usage:**
```jsx
import { useAuthContext } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuthContext();
  
  return (
    <div>
      {isAuthenticated && <p>Welcome, {user.username}</p>}
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Hooks

### useAuth.js
Custom hook for authentication operations.

**Returns:**
- `user` - Current user object
- `loading` - Loading state
- `error` - Error object if any
- `isAuthenticated` - Boolean authentication status
- `getToken()` - Get current JWT token
- `refreshToken()` - Force refresh JWT token
- `signOut()` - Sign out user
- `checkUser()` - Refresh user state

**Usage:**
```jsx
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, loading, isAuthenticated, getToken } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {isAuthenticated && <p>Welcome, {user.username}</p>}
    </div>
  );
}
```

## Utilities

### tokenManager.js
Utility class for JWT token management.

**Methods:**
- `getToken()` - Get current JWT token
- `refreshToken()` - Force refresh token
- `getTokenExpiration()` - Get token expiration timestamp
- `isTokenExpired(bufferMinutes)` - Check if token is expired
- `startTokenRefresh()` - Start automatic token refresh
- `stopTokenRefresh()` - Stop automatic token refresh
- `getUserAttributes()` - Get user attributes from token
- `getBrandId()` - Get brand ID from custom attributes

**Usage:**
```jsx
import { tokenManager } from './utils/tokenManager';

// Get token
const token = await tokenManager.getToken();

// Check if expired
const isExpired = await tokenManager.isTokenExpired();

// Get brand ID
const brandId = await tokenManager.getBrandId();

// Start automatic refresh
tokenManager.startTokenRefresh();
```

## Authentication Flow

### Login Flow
1. User enters email and password
2. Component calls `signIn()` from AWS Amplify
3. On success, user is redirected to dashboard
4. On failure, appropriate error message is displayed

### Signup Flow
1. User enters name, email, and password
2. Password is validated against requirements
3. Component calls `signUp()` from AWS Amplify
4. User receives verification code via email
5. User enters verification code
6. Component calls `confirmSignUp()` from AWS Amplify
7. User is auto-signed in and redirected to onboarding

### Protected Route Flow
1. Component mounts and checks authentication status
2. If loading, shows loading spinner
3. If not authenticated, redirects to login
4. If authenticated, renders children

### Token Management
1. API client automatically adds JWT token to requests
2. Token is checked for expiration before each request
3. If expired, token is automatically refreshed
4. Automatic refresh can be enabled for long-running sessions

## Error Handling

### Common Errors

**UserNotFoundException / NotAuthorizedException**
- Invalid email or password
- User should try again or reset password

**UserNotConfirmedException**
- Email not verified
- User should check email for verification code

**CodeMismatchException**
- Invalid verification code
- User should try again

**ExpiredCodeException**
- Verification code expired
- User should request new code

**UsernameExistsException**
- Email already registered
- User should try logging in or use different email

## Security Features

1. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. **JWT Token Security**
   - Tokens automatically included in API requests
   - Tokens stored securely by AWS Amplify
   - Automatic token refresh before expiration
   - Tokens validated on backend

3. **Session Management**
   - Automatic redirect on session expiration
   - Secure sign out clears all session data
   - Protected routes enforce authentication

## Configuration

Authentication is configured in `src/config/amplify.js`:

```javascript
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX',
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      // ... other config
    },
  },
};
```

Update these values with your AWS Cognito User Pool details.
