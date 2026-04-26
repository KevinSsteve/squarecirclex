# Design Document - Skip Onboarding for Game Development

## Overview

This document describes the design for a development mode feature that allows developers to access GameView without completing onboarding. The solution uses environment-based feature flags, graceful error handling, and clear visual indicators.

## Architecture

### Feature Flag System

```
Environment Variable (REACT_APP_DEV_MODE)
    ↓
Config Module (config/featureFlags.js)
    ↓
GameView Component
    ↓
Authentication Check → Development Mode Check → Render
```

### Current State (Commented Code)

```javascript
// TEMPORARILY DISABLED: Brand association check
// Allow game view access without completing onboarding for development/testing
// TODO: Re-enable after game appearance is complete
/*
const brandId = await tokenManager.getBrandId();

if (!brandId) {
  console.log('[GameView] User has no brand association');
  setIsAuthenticated(false);
  setAuthError('no_brand_association');
  setConnectionStatus('auth_required');
  setAuthChecking(false);
  return;
}
*/
```

### Proposed State (Feature Flag)

```javascript
// Check brand association (can be disabled in development mode)
if (!featureFlags.skipBrandAssociation) {
  const brandId = await tokenManager.getBrandId();
  
  if (!brandId) {
    console.log('[GameView] User has no brand association');
    setIsAuthenticated(false);
    setAuthError('no_brand_association');
    setConnectionStatus('auth_required');
    setAuthChecking(false);
    return;
  }
} else {
  console.warn('[GameView] Development mode - skipping brand association check');
  const brandId = await tokenManager.getBrandId();
  if (!brandId) {
    console.log('[GameView] No brand association - continuing in development mode');
  }
}
```

## Components and Interfaces

### New Components

#### 1. Feature Flags Configuration (`frontend/src/config/featureFlags.js`)

```javascript
/**
 * Feature Flags Configuration
 * Controls optional features and development modes
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Parse environment variable (default to false)
const devModeEnv = process.env.REACT_APP_DEV_MODE === 'true';

export const featureFlags = {
  /**
   * Skip brand association check in GameView
   * Allows access to game view without completing onboarding
   * 
   * @type {boolean}
   * @default false in production, configurable in development
   */
  skipBrandAssociation: isProduction ? false : devModeEnv,
  
  /**
   * Show development mode banner
   * Displays warning banner when development features are enabled
   * 
   * @type {boolean}
   */
  showDevModeBanner: !isProduction && devModeEnv,
  
  /**
   * Enable verbose logging
   * Logs additional debug information
   * 
   * @type {boolean}
   */
  verboseLogging: isDevelopment,
};

// Log feature flags on initialization
if (featureFlags.verboseLogging) {
  console.log('[FeatureFlags] Configuration:', {
    environment: process.env.NODE_ENV,
    skipBrandAssociation: featureFlags.skipBrandAssociation,
    showDevModeBanner: featureFlags.showDevModeBanner,
  });
}

export default featureFlags;
```

#### 2. Development Mode Banner (`frontend/src/components/game/ui/DevModeBanner.jsx`)

```javascript
import { useState, useEffect } from 'react';
import featureFlags from '../../../config/featureFlags';

/**
 * Development Mode Banner
 * Displays a warning banner when development mode is active
 */
const DevModeBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  
  // Check localStorage for dismissed state
  useEffect(() => {
    const isDismissed = localStorage.getItem('devModeBannerDismissed') === 'true';
    setDismissed(isDismissed);
  }, []);
  
  // Don't show if not in dev mode or if dismissed
  if (!featureFlags.showDevModeBanner || dismissed) {
    return null;
  }
  
  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('devModeBannerDismissed', 'true');
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold">Development Mode Active</p>
            <p className="text-sm">Brand association checks are disabled. This mode should not be used in production.</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 text-yellow-900 hover:text-yellow-700 transition-colors"
          aria-label="Dismiss banner"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DevModeBanner;
```

### Modified Components

#### 1. GameView.jsx

Changes to authentication check:
```javascript
// Import feature flags
import featureFlags from '../../config/featureFlags';

// In authentication check effect:
useEffect(() => {
  const checkAuth = async () => {
    try {
      setAuthChecking(true);
      setAuthError(null);
      
      // Get token from tokenManager
      const token = await tokenManager.getToken();
      
      if (!token) {
        console.log('[GameView] No authentication token found');
        setIsAuthenticated(false);
        setAuthError('not_authenticated');
        setConnectionStatus('auth_required');
        setAuthChecking(false);
        return;
      }
      
      // Check if token is expired
      const isExpired = await tokenManager.isTokenExpired();
      
      if (isExpired) {
        console.log('[GameView] Authentication token expired');
        setIsAuthenticated(false);
        setAuthError('token_expired');
        setConnectionStatus('auth_required');
        setAuthChecking(false);
        return;
      }
      
      // Check brand association (can be disabled in development mode)
      if (!featureFlags.skipBrandAssociation) {
        const brandId = await tokenManager.getBrandId();
        
        if (!brandId) {
          console.log('[GameView] User has no brand association');
          setIsAuthenticated(false);
          setAuthError('no_brand_association');
          setConnectionStatus('auth_required');
          setAuthChecking(false);
          return;
        }
        
        console.log('[GameView] Authentication successful', { brandId });
      } else {
        console.warn('[GameView] Development mode - skipping brand association check');
        const brandId = await tokenManager.getBrandId();
        if (brandId) {
          console.log('[GameView] Brand association found:', { brandId });
        } else {
          console.log('[GameView] No brand association - continuing in development mode');
        }
      }
      
      // All checks passed
      setIsAuthenticated(true);
      setAuthError(null);
      setConnectionStatus('connected');
      setAuthChecking(false);
    } catch (error) {
      console.error('[GameView] Authentication check failed:', error);
      setIsAuthenticated(false);
      setAuthError('auth_check_failed');
      setConnectionStatus('auth_required');
      setAuthChecking(false);
    }
  };
  
  checkAuth();
}, []);
```

Add DevModeBanner to render:
```javascript
return (
  <GameErrorBoundary
    onError={handleGameError}
    onFallbackToTraditional={handleFallbackToTraditional}
  >
    {/* Development Mode Banner */}
    <DevModeBanner />
    
    {/* Loading Screen */}
    <LoadingScreen
      progress={loadingProgress}
      message={loadingMessage}
      visible={!assetsLoaded}
    />
    
    {/* ... rest of component ... */}
  </GameErrorBoundary>
);
```

#### 2. Backend Polling Error Handling

Update error handling to gracefully handle missing brand:
```javascript
} catch (error) {
  console.error('Error fetching posts:', error);
  
  // Enhanced error handling
  if (error.status === 401 || error.status === 403) {
    console.log('[GameView] Authentication error - stopping polling');
    setConnectionStatus('auth_required');
    setAuthError('auth_required');
    setIsAuthenticated(false);
    return;
  }
  
  // Check for "no brand association" error
  if (error.status === 500 && error.message?.toLowerCase().includes('brand association')) {
    // In development mode, continue with mock data
    if (featureFlags.skipBrandAssociation) {
      console.warn('[GameView] No brand association - continuing with mock data in development mode');
      // Don't stop polling, just use cached/mock state
      consecutiveErrors = 0; // Reset error count
      currentDelay = BASE_DELAY;
      setConnectionStatus('connected');
      // Continue polling
      timeoutId = setTimeout(fetchPosts, currentDelay);
      return;
    } else {
      console.log('[GameView] No brand association error - stopping polling');
      setConnectionStatus('auth_required');
      setAuthError('no_brand_association');
      return;
    }
  }
  
  // ... rest of error handling ...
}
```

### Environment Configuration

#### .env.development
```bash
# Development Mode - Skip brand association checks
REACT_APP_DEV_MODE=true
```

#### .env.production
```bash
# Production Mode - Enforce all checks
REACT_APP_DEV_MODE=false
```

## Data Flow

### Authentication Flow with Development Mode

```
User accesses /app
    ↓
Check JWT token
    ↓ (valid)
Check token expiration
    ↓ (not expired)
Check feature flag: skipBrandAssociation
    ↓
    ├─ false (production) → Check brand association
    │                           ↓
    │                       Has brand? → Allow access
    │                       No brand? → Redirect to onboarding
    │
    └─ true (development) → Skip brand check
                               ↓
                           Log warning
                               ↓
                           Allow access
```

### Backend Polling Flow with Development Mode

```
Poll backend API
    ↓
    ├─ Success → Update state
    │
    ├─ 401/403 → Stop polling, require re-auth
    │
    └─ 500 "no brand" → Check feature flag
                            ↓
                            ├─ false → Stop polling, redirect to onboarding
                            │
                            └─ true → Continue with mock data, keep polling
```

## Correctness Properties

### Property 1: Production Safety
*For any* production build, development mode SHALL be disabled regardless of environment variable
**Validates: Requirements 1.3, 4.3**

### Property 2: Development Mode Indicator
*For any* session with development mode enabled, the dev mode banner SHALL be visible until dismissed
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 3: Graceful Degradation
*For any* backend error related to missing brand in development mode, the system SHALL continue operating with cached/mock data
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Feature Flag Consistency
*For any* component checking brand association, the feature flag SHALL be evaluated consistently
**Validates: Requirements 1.1, 1.2, 6.1**

### Property 5: Environment Variable Control
*For any* change to REACT_APP_DEV_MODE, the system SHALL require rebuild to take effect
**Validates: Requirements 4.1, 4.2, 4.4**

## Error Handling

### Missing Environment Variable
- Default to `false` (safe default)
- Log warning in development console
- Continue with normal operation

### Invalid Environment Variable Value
- Treat as `false` (safe default)
- Log warning about invalid value
- Continue with normal operation

### Feature Flag Evaluation Error
- Default to `false` (safe default)
- Log error with stack trace
- Continue with normal operation

## Security Considerations

### Production Protection
- Feature flag is hardcoded to `false` in production builds
- Environment variable is ignored in production
- No way to enable development mode in production

### Audit Logging
- All bypassed checks are logged with `console.warn`
- Logs include timestamp and context
- Logs are visible in browser console for debugging

### Authentication Still Required
- Development mode only skips brand association
- JWT token validation is still enforced
- Token expiration is still checked

## Testing Strategy

### Manual Testing
1. Set `REACT_APP_DEV_MODE=true` in `.env.development`
2. Rebuild frontend
3. Access `/app` without completing onboarding
4. Verify dev mode banner is visible
5. Verify game view loads successfully
6. Verify backend polling continues with mock data

### Unit Tests
- Test feature flag evaluation with different environment values
- Test DevModeBanner rendering and dismissal
- Test authentication check with feature flag enabled/disabled

### Integration Tests
- Test full authentication flow with development mode
- Test backend polling error handling with development mode
- Test production build with development mode disabled

