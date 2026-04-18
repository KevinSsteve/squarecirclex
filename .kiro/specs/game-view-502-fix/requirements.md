# Game View 502 Error Loop and PixiJS Crash Fix

## Problem Statement

The game view is experiencing two critical issues in production:

1. **Infinite 502 Error Loop**: The app makes infinite requests to `/dev/posts` endpoint that all fail with 502 Bad Gateway errors
2. **PixiJS Crash**: Error `e.getVisibleCount is not a function` in LODSystem at line 351 prevents the game from rendering

## Root Causes

### Issue 1: Infinite 502 Loop
- **Location**: `frontend/src/components/game/GameView.jsx` lines 160-240
- **Cause**: The `useEffect` hook polls `/dev/posts` every 3 seconds without any circuit breaker or exponential backoff
- **Impact**: When the backend returns 502 errors, the frontend continues polling indefinitely, creating excessive load

### Issue 2: Missing Method in CullingSystem
- **Location**: `frontend/src/components/game/systems/LODSystem.js` line 351
- **Cause**: LODSystem calls `cullingSystem.getVisibleCount()` but CullingSystem doesn't have this method
- **Impact**: PixiJS initialization crashes, preventing the game from loading

## User Stories

### US-1: Graceful Backend Error Handling
**As a** user  
**I want** the game view to handle backend errors gracefully  
**So that** I don't experience infinite loading or excessive network requests

**Acceptance Criteria**:
- Backend polling implements exponential backoff (1s, 2s, 4s, 8s, max 30s)
- After 5 consecutive failures, polling stops and shows error message
- User can manually retry after polling stops
- Error state is clearly communicated in the UI

### US-2: Complete CullingSystem API
**As a** developer  
**I want** CullingSystem to have a complete public API  
**So that** other systems can query culling statistics

**Acceptance Criteria**:
- CullingSystem has `getVisibleCount()` method that returns number of visible entities
- Method is consistent with existing `getStats()` API
- LODSystem can successfully call the method without errors

### US-3: Robust Game Initialization
**As a** user  
**I want** the game to initialize without crashing  
**So that** I can view my AI company in the game view

**Acceptance Criteria**:
- Game initializes successfully without PixiJS errors
- All systems (LOD, Culling, Performance) work together correctly
- Error boundaries catch and handle any initialization failures

## Technical Requirements

### TR-1: Backend Polling Circuit Breaker
- Implement exponential backoff with configurable parameters
- Track consecutive error count
- Stop polling after max failures (default: 5)
- Provide manual retry mechanism
- Clear error count on successful response

### TR-2: CullingSystem API Extension
- Add `getVisibleCount()` method to CullingSystem
- Return `this.stats.visibleEntities` value
- Ensure method is available before LODSystem initialization

### TR-3: Error Recovery Integration
- Use existing ErrorRecoverySystem for backend polling errors
- Integrate with degradation modes (pause animations, use cached state)
- Provide user-friendly error notifications

## Non-Functional Requirements

### NFR-1: Performance
- Exponential backoff should not block UI rendering
- Error handling should add minimal overhead (<5ms per check)

### NFR-2: User Experience
- Error messages should be clear and actionable
- Manual retry should be easily accessible
- Game should fallback to traditional view if critical errors persist

### NFR-3: Observability
- Log all backend polling errors with context
- Track error recovery metrics
- Monitor circuit breaker state changes

## Out of Scope

- Fixing the root cause of 502 errors in the backend (separate issue)
- Implementing offline mode or service worker caching
- Adding WebSocket for real-time updates (future enhancement)

## Dependencies

- Existing ErrorRecoverySystem (Phase 10, Task 60)
- Existing ViewToggle system (Phase 10, Task 64)
- CullingSystem (Phase 9, Task 53)
- LODSystem (Phase 9, Task 55)

## Success Metrics

- Zero infinite polling loops in production
- Game initialization success rate > 99%
- Backend error recovery time < 30 seconds
- User-reported "game not loading" issues reduced to zero
