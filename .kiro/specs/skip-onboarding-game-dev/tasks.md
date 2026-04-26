# Implementation Plan: Skip Onboarding for Game Development

## Overview

Transform the temporary commented-out brand association check into a proper feature flag system with environment-based configuration, visual indicators, and graceful error handling.

## Tasks

- [ ] 1. Create Feature Flags Configuration
  - [x] 1.1 Create `frontend/src/config/featureFlags.js`
    - Define `skipBrandAssociation` flag
    - Define `showDevModeBanner` flag
    - Define `verboseLogging` flag
    - Read from `REACT_APP_DEV_MODE` environment variable
    - Force disable in production builds
    - Add initialization logging
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3_
  
  - [x] 1.2 Create environment configuration files
    - Create `.env.development` with `REACT_APP_DEV_MODE=true`
    - Create `.env.production` with `REACT_APP_DEV_MODE=false`
    - Update `.env.example` with documentation
    - _Requirements: 4.1, 4.2_

- [ ] 2. Create Development Mode Banner Component
  - [x] 2.1 Create `frontend/src/components/game/ui/DevModeBanner.jsx`
    - Display warning banner at top of screen
    - Use yellow/orange warning colors
    - Show clear message about development mode
    - Add dismiss button
    - Persist dismissed state in localStorage
    - Only show when `showDevModeBanner` flag is true
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 2.2 Add DevModeBanner to GameView
    - Import DevModeBanner component
    - Render at top of component tree
    - Ensure it appears above all other UI elements
    - _Requirements: 5.1_

- [ ] 3. Update GameView Authentication Logic
  - [x] 3.1 Import feature flags in GameView
    - Add import statement for featureFlags
    - _Requirements: 1.1, 6.1_
  
  - [x] 3.2 Replace commented code with feature flag check
    - Remove commented-out brand association check
    - Add conditional check using `featureFlags.skipBrandAssociation`
    - When flag is false: enforce brand association (original behavior)
    - When flag is true: skip brand association, log warning
    - Still check for brand ID and log if present
    - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3_
  
  - [x] 3.3 Add development mode logging
    - Log when development mode is active
    - Log when brand association check is skipped
    - Log when brand ID is present/absent
    - Use `console.warn` for bypassed checks
    - _Requirements: 1.3, 6.3_

- [ ] 4. Update Backend Polling Error Handling
  - [x] 4.1 Enhance "no brand association" error handling
    - Detect "no brand association" errors from backend
    - Check `featureFlags.skipBrandAssociation`
    - If true: continue with mock data, don't stop polling
    - If false: stop polling, show error (original behavior)
    - Log appropriate warnings
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 4.2 Add mock data fallback
    - When brand association error occurs in dev mode
    - Continue polling with reduced frequency
    - Use cached state if available
    - Reset error count to prevent circuit breaker
    - _Requirements: 2.1, 2.3_

- [ ] 5. Create Documentation
  - [x] 5.1 Create `DEVELOPMENT_MODE.md`
    - Explain what development mode does
    - Explain how to enable/disable it
    - Explain environment variable configuration
    - Explain implications and limitations
    - Explain how to re-enable checks for production
    - Add troubleshooting section
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 5.2 Update README.md
    - Add section about development mode
    - Link to DEVELOPMENT_MODE.md
    - Add to quick start guide
    - _Requirements: 3.1_
  
  - [ ] 5.3 Update GameView.jsx comments
    - Add JSDoc comments explaining feature flag
    - Document the authentication flow
    - Document the development mode behavior
    - _Requirements: 6.3, 6.4_

- [ ] 6. Testing and Validation
  - [ ] 6.1 Test with development mode enabled
    - Set `REACT_APP_DEV_MODE=true`
    - Rebuild frontend
    - Access `/app` without completing onboarding
    - Verify dev mode banner appears
    - Verify game view loads successfully
    - Verify backend polling continues
    - Verify no console errors
    - _Requirements: 1.1, 2.1, 5.1_
  
  - [ ] 6.2 Test with development mode disabled
    - Set `REACT_APP_DEV_MODE=false`
    - Rebuild frontend
    - Access `/app` without completing onboarding
    - Verify redirect to onboarding
    - Verify original behavior is preserved
    - _Requirements: 1.2_
  
  - [ ] 6.3 Test production build
    - Build with `NODE_ENV=production`
    - Verify development mode is disabled
    - Verify banner does not appear
    - Verify brand association is enforced
    - _Requirements: 4.3_
  
  - [ ] 6.4 Test banner dismissal
    - Dismiss dev mode banner
    - Verify it stays dismissed on page reload
    - Clear localStorage
    - Verify banner reappears
    - _Requirements: 5.4_
  
  - [ ] 6.5 Test backend error handling
    - Trigger "no brand association" error
    - Verify graceful handling in dev mode
    - Verify polling continues
    - Verify appropriate logging
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 7. Code Cleanup
  - [ ] 7.1 Remove all commented-out code
    - Remove TODO comments about re-enabling
    - Remove commented brand association check
    - Ensure no dead code remains
    - _Requirements: 6.2_
  
  - [ ] 7.2 Add TypeScript/JSDoc types
    - Add JSDoc types to featureFlags
    - Add JSDoc types to DevModeBanner props
    - Add JSDoc types to authentication functions
    - _Requirements: 6.4_
  
  - [ ] 7.3 Code review and refactoring
    - Ensure consistent naming conventions
    - Ensure proper error handling
    - Ensure proper logging levels
    - Ensure code is self-documenting
    - _Requirements: 6.3_

- [ ] 8. Deployment
  - [ ] 8.1 Build frontend with changes
    - Run `npm run build`
    - Verify build succeeds
    - Verify environment variables are embedded
    - _Requirements: 4.4_
  
  - [ ] 8.2 Deploy to development environment
    - Deploy to S3 with development configuration
    - Verify dev mode is enabled
    - Test all functionality
    - _Requirements: 1.1, 5.1_
  
  - [ ] 8.3 Verify production configuration
    - Ensure production build has `REACT_APP_DEV_MODE=false`
    - Ensure production deployment enforces checks
    - Document production deployment process
    - _Requirements: 4.3_

## Notes

### Implementation Priority
1. Tasks 1-3: Core feature flag system (highest priority)
2. Task 4: Backend error handling (high priority)
3. Task 5: Documentation (medium priority)
4. Tasks 6-7: Testing and cleanup (medium priority)
5. Task 8: Deployment (final step)

### Current State
- Brand association check is currently commented out in GameView.jsx (lines 186-194)
- Development mode is implicitly enabled by commented code
- No visual indicator of development mode
- No environment-based configuration
- Backend polling may fail on "no brand association" errors

### Target State
- Feature flag system with environment variables
- Clear visual indicator (dev mode banner)
- Graceful error handling for missing brand
- Proper documentation
- Clean, maintainable code
- Production-safe configuration

### Breaking Changes
None - this is a refactoring that maintains existing behavior while adding proper structure.

### Dependencies
- React environment variables (REACT_APP_*)
- localStorage API for banner dismissal
- Existing tokenManager utility
- Existing authentication flow

