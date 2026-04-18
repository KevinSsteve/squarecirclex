# Implementation Plan: Backend 500 & PixiJS v8 Fix

## Overview

This implementation plan addresses two critical issues: fixing the backend 500 error caused by missing authentication context in GameView, and updating deprecated PixiJS v7 APIs to v8 standards. The tasks are organized to fix the critical backend error first, then address the technical debt in the rendering layer.

## Tasks

- [ ] 1. Fix Backend 500 Error - Authentication & Error Handling
  - Add authentication guard to GameView component
  - Improve error handling for brand association errors
  - Update Posts API error responses
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.1 Add authentication check to GameView
  - Add state for authentication status (isAuthenticated, authChecking)
  - Add useEffect to check authentication on mount using tokenManager
  - Add conditional rendering for unauthenticated state
  - Add loading state while checking authentication
  - _Requirements: 1.1, 1.2_

- [ ]* 1.2 Write unit tests for authentication guard
  - Test GameView with authenticated user
  - Test GameView with unauthenticated user
  - Test GameView with expired token
  - Test loading state during auth check
  - _Requirements: 1.1, 1.2_

- [x] 1.3 Enhance error handling in GameView fetchPosts
  - Add specific handling for 401/403 errors (skip retry)
  - Add specific handling for "no brand association" error
  - Add user-friendly error messages for each error type
  - Update connectionStatus states to include 'auth_required'
  - _Requirements: 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

- [ ]* 1.4 Write unit tests for enhanced error handling
  - Test 401 response handling
  - Test 403 response handling
  - Test 500 with "no brand association" message
  - Test 500 with generic error
  - Test circuit breaker behavior with auth errors
  - _Requirements: 1.3, 1.4, 3.1, 3.2, 3.3_

- [x] 1.5 Update Posts API error response for missing brand
  - Change error handling in extractUserContext function
  - Return 403 status code instead of throwing error
  - Return structured error with code 'NO_BRAND_ASSOCIATION'
  - Include requiresOnboarding flag in error details
  - Add CORS headers to error response
  - _Requirements: 1.3, 3.1_

- [ ]* 1.6 Write unit tests for Posts API error responses
  - Test missing brandId returns 403
  - Test error response structure
  - Test error message content
  - Test CORS headers in error response
  - _Requirements: 1.3, 3.1_

- [x] 1.7 Add UI components for unauthenticated state
  - Create message component for "Please log in" state
  - Create message component for "Complete onboarding" state
  - Add styling consistent with game theme
  - Add action buttons (Login, Start Onboarding)
  - _Requirements: 3.1, 3.4_

- [-] 2. Checkpoint - Test Backend Error Fixes
  - Ensure all tests pass
  - Manually test GameView without authentication
  - Manually test GameView with authentication but no brand
  - Manually test GameView with full authentication
  - Verify no 500 errors in CloudWatch logs
  - Ask the user if questions arise

- [x] 3. Update PixiJS Graphics API - TaskWorkflowVisuals
  - Update all beginFill/endFill calls to use fill()
  - Update all drawCircle calls to use circle()
  - Update all drawRect calls to use rect()
  - Update all drawRoundedRect calls to use roundRect()
  - Update all container.name assignments to use container.label
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

- [ ]* 3.1 Write visual regression tests for TaskWorkflowVisuals
  - Test screen glow rendering
  - Test progress bar rendering
  - Test success/error icons rendering
  - Test desk highlight rendering
  - Compare visual output before and after API updates
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Update PixiJS Graphics API - TaskScreenVisuals
  - Update all beginFill/endFill calls to use fill()
  - Update all drawCircle calls to use circle()
  - Update all drawRect calls to use rect()
  - Update all drawRoundedRect calls to use roundRect()
  - Update all container.name assignments to use container.label
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

- [ ]* 4.1 Write visual regression tests for TaskScreenVisuals
  - Test text editor screen rendering
  - Test dashboard screen rendering
  - Test all icon and line rendering
  - Compare visual output before and after API updates
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Update PixiJS Graphics API - ParticleSystem
  - Update all beginFill/endFill calls to use fill()
  - Update all drawCircle calls to use circle()
  - Update all drawRect calls to use rect()
  - Update texture creation to use new API
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 5.1 Write unit tests for ParticleSystem
  - Test particle texture creation
  - Test particle rendering
  - Verify no deprecation warnings
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6. Update PixiJS Text Constructor Calls
  - Find all `new PIXI.Text(text, style)` calls
  - Update to `new PIXI.Text({ text, style })` format
  - Verify text rendering and positioning unchanged
  - _Requirements: 2.5, 4.2_

- [ ]* 6.1 Write unit tests for Text constructor updates
  - Test text creation with various styles
  - Test text positioning
  - Test text content rendering
  - _Requirements: 2.5, 4.2_

- [x] 7. Update Application.view to Application.canvas
  - Find all references to `app.view` or `Application.view`
  - Update to use `app.canvas` or `Application.canvas`
  - Verify event listeners still work correctly
  - _Requirements: 2.7, 4.4_

- [ ]* 7.1 Write unit tests for Application canvas access
  - Test canvas element access
  - Test event listener attachment
  - Test canvas manipulation
  - _Requirements: 2.7, 4.4_

- [x] 8. Update DRAW_MODES Constants
  - Find all references to `DRAW_MODES.LINEAR` or similar
  - Update to use string literals ('linear', etc.)
  - Verify rendering behavior unchanged
  - _Requirements: 2.8_

- [x] 9. Checkpoint - Verify PixiJS Updates
  - Ensure all tests pass
  - Manually test all game visuals
  - Verify no deprecation warnings in browser console
  - Verify all animations and effects work correctly
  - Compare screenshots before/after for visual regression
  - Ask the user if questions arise

- [ ] 10. Integration Testing
  - Test full authentication flow from GameView mount
  - Test error recovery when authentication is restored
  - Test all game features with updated PixiJS APIs
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on different screen sizes
  - _Requirements: 1.5, 3.5, 4.5_

- [ ]* 10.1 Write integration tests
  - Test GameView mount → auth check → posts fetch flow
  - Test error handling → recovery flow
  - Test visual rendering with all PixiJS updates
  - _Requirements: 1.5, 3.5, 4.5_

- [x] 11. Documentation and Cleanup
  - Update GameView component documentation
  - Update PixiJS migration notes
  - Add comments explaining authentication checks
  - Add comments explaining error handling logic
  - Remove any commented-out old code
  - _Requirements: All_

- [x] 12. Final Checkpoint
  - Ensure all tests pass
  - Verify no 500 errors in production
  - Verify no PixiJS deprecation warnings
  - Verify all game features work correctly
  - Get user approval for deployment
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Backend error fixes are prioritized over PixiJS updates
- PixiJS updates maintain visual consistency (no breaking changes)
- All authentication checks happen before API calls to prevent 500 errors
