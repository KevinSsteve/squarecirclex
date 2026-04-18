# Backend 500 & PixiJS v8 Investigation Report

**Date**: 2026-04-18  
**Status**: Investigation Complete - Spec Created  
**Spec Location**: `.kiro/specs/backend-500-pixijs-v8-fix/`

## Executive Summary

Investigation of browser console errors revealed two distinct issues:
1. **Critical**: Backend 500 errors preventing GameView from loading posts data
2. **Technical Debt**: PixiJS v8 deprecation warnings indicating outdated API usage

## Issue 1: Backend 500 Error - "User has no brand association"

### Root Cause

The GameView component attempts to fetch posts data via `GET /posts` without proper authentication context. The Posts API Lambda (`onzo-posts-api-dev`) expects both a `userId` and `brandId` from the authorization context, but receives neither when accessed from the game view.

### CloudWatch Logs Evidence

```
ERROR: User has no brand association
at extractUserContext (/var/task/handler.js:127:11)
at exports.handler (/var/task/handler.js:63:25)
```

### Impact

- GameView fails to load any posts data
- Circuit breaker activates after 5 failed attempts
- User sees empty game state
- Backend logs fill with 500 errors

### Solution Approach

1. Add authentication check before GameView mounts
2. Handle "no brand association" error gracefully
3. Update Posts API to return 403 (Forbidden) instead of 500
4. Display appropriate user messages (login prompt or onboarding prompt)

## Issue 2: PixiJS v8 Deprecation Warnings

### Deprecated APIs Found

| Old API (v7) | New API (v8) | Occurrences |
|--------------|--------------|-------------|
| `Graphics#beginFill/endFill` | `Graphics#fill` | ~30 |
| `Graphics#drawCircle` | `Graphics#circle` | ~15 |
| `Graphics#drawRect` | `Graphics#rect` | ~20 |
| `Graphics#drawRoundedRect` | `Graphics#roundRect` | ~10 |
| `new Text(text, style)` | `new Text({ text, style })` | ~5 |
| `Container.name` | `Container.label` | ~8 |
| `Application.view` | `Application.canvas` | ~2 |
| `DRAW_MODES.LINEAR` | `'linear'` | ~1 |

### Affected Files

- `frontend/src/components/game/visuals/TaskWorkflowVisuals.js` (most occurrences)
- `frontend/src/components/game/visuals/TaskScreenVisuals.js`
- `frontend/src/components/game/systems/ParticleSystem.js`
- `frontend/src/components/game/ui/*` (various UI components)

### Impact

- Browser console filled with deprecation warnings
- No functional impact (APIs still work in v8)
- Technical debt that will break in future PixiJS versions
- Reduced code maintainability

### Solution Approach

Systematic migration of all deprecated API calls to v8 equivalents while maintaining visual consistency.

## Investigation Process

### Step 1: CloudWatch Logs Analysis

```powershell
# Retrieved logs from Posts API Lambda
aws logs tail /aws/lambda/onzo-posts-api-dev --since 30m
```

**Finding**: All requests failing with "User has no brand association" error at line 127 of handler.js

### Step 2: Code Analysis

**Posts API Handler** (`functions/posts-api/handler.js:127`):
```javascript
if (!brandId) {
  throw new Error('User has no brand association');
}
```

**GameView API Call** (`frontend/src/components/game/GameView.jsx:163`):
```javascript
const response = await api.getPosts();
```

**Finding**: No authentication check before API call, no special handling for brand association errors

### Step 3: PixiJS Deprecation Analysis

Used grep search to find all deprecated API usage:
```bash
grep -r "beginFill\|endFill\|drawCircle\|drawRect" frontend/src/components/game/
```

**Finding**: Widespread use of v7 APIs across all visual components

## Recommendations

### Priority 1: Fix Backend 500 Error (Critical)

1. Implement authentication guard in GameView
2. Add error handling for missing brand association
3. Update Posts API error responses
4. Add user-friendly error messages

**Estimated Effort**: 4-6 hours  
**Risk**: Low - well-defined problem with clear solution

### Priority 2: Update PixiJS APIs (Technical Debt)

1. Migrate Graphics API calls systematically
2. Update Text constructors
3. Update Container properties
4. Verify visual consistency

**Estimated Effort**: 6-8 hours  
**Risk**: Medium - requires careful testing to ensure visual consistency

## Spec Created

A complete specification has been created at `.kiro/specs/backend-500-pixijs-v8-fix/` with:

- **requirements.md**: 4 requirements with 20 acceptance criteria
- **design.md**: Complete architecture, components, and correctness properties
- **tasks.md**: 12 main tasks with 22 sub-tasks

## Next Steps

1. Review and approve the specification
2. Begin implementation with Task 1 (Backend error fixes)
3. Deploy and verify backend fixes
4. Proceed with PixiJS updates
5. Conduct full integration testing

## Additional Notes

### 404 Error

The browser also shows:
```
app:1 Failed to load resource: 404 (Not Found)
```

This appears to be a separate issue related to a missing asset or route. Should be investigated separately if it persists after the main fixes.

### Circuit Breaker Behavior

The existing circuit breaker implementation is working correctly:
- Retries with exponential backoff (6s, 12s, 24s, 30s)
- Stops after 5 consecutive errors
- Prevents infinite retry loops

This behavior should be preserved while adding authentication checks.

## References

- CloudWatch Log Group: `/aws/lambda/onzo-posts-api-dev`
- Posts API Handler: `functions/posts-api/handler.js`
- GameView Component: `frontend/src/components/game/GameView.jsx`
- PixiJS v8 Migration Guide: https://pixijs.com/8.x/guides/migrations/v8
