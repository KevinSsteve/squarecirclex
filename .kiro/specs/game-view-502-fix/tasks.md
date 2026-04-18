# Game View 502 Error Loop and PixiJS Crash Fix - Tasks

## Task 1: Add getVisibleCount() Method to CullingSystem ✅ PRIORITY

**Status**: Ready to implement  
**Estimated Time**: 5 minutes  
**Dependencies**: None

### Description
Add the missing `getVisibleCount()` method to CullingSystem to fix the PixiJS crash.

### Implementation Steps
1. Open `frontend/src/components/game/systems/CullingSystem.js`
2. Add method after `getStats()`:
```javascript
/**
 * Get count of visible entities
 * @returns {number} Number of visible entities
 */
getVisibleCount() {
  return this.stats.visibleEntities;
}
```

### Acceptance Criteria
- [ ] Method added to CullingSystem
- [ ] Method returns correct count
- [ ] LODSystem can call method without errors
- [ ] Game initializes without PixiJS crash

---

## Task 2: Implement Backend Polling Circuit Breaker ✅ PRIORITY

**Status**: Ready to implement  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 1

### Description
Replace the infinite polling loop with a circuit breaker that implements exponential backoff and stops after max errors.

### Implementation Steps

1. **Update GameView.jsx polling useEffect** (lines 160-240)
   - Remove `errorCount` from dependencies
   - Add local state for consecutive errors
   - Implement exponential backoff calculation
   - Add max error check to stop polling
   - Replace `setInterval` with `setTimeout` for dynamic delays

2. **Add manual retry mechanism**
   - Add `retryTrigger` state variable
   - Create `handleManualRetry` function
   - Pass function to UIOverlay

3. **Integrate with ErrorRecoverySystem**
   - Keep existing ErrorRecoverySystem integration
   - Ensure error context includes retry function

### Code Changes

#### GameView.jsx - Update polling useEffect
```javascript
// Add state for retry trigger
const [retryTrigger, setRetryTrigger] = useState(0);

// Update useEffect
useEffect(() => {
  let timeoutId = null;
  let consecutiveErrors = 0;
  let currentDelay = 3000;
  const MAX_ERRORS = 5;
  const BASE_DELAY = 3000;
  const MAX_DELAY = 30000;
  
  const fetchPosts = async () => {
    try {
      const response = await api.getPosts();
      
      if (!response || !response.data) {
        throw new Error('Invalid response structure');
      }
      
      const posts = Array.isArray(response.data?.posts) ? response.data.posts : [];

      // Success - reset error tracking
      consecutiveErrors = 0;
      currentDelay = BASE_DELAY;
      setConnectionStatus('connected');
      setErrorCount(0);
      
      // Clear degradation mode if active
      if (sceneRef.current) {
        const errorRecoverySystem = sceneRef.current.getErrorRecoverySystem();
        if (errorRecoverySystem) {
          errorRecoverySystem.clearDegradation();
        }
      }

      // ... existing post processing logic ...

      // Schedule next poll if not at max errors
      if (consecutiveErrors < MAX_ERRORS) {
        timeoutId = setTimeout(fetchPosts, currentDelay);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      consecutiveErrors++;
      
      // Use ErrorRecoverySystem
      if (sceneRef.current) {
        const errorRecoverySystem = sceneRef.current.getErrorRecoverySystem();
        if (errorRecoverySystem) {
          errorRecoverySystem.handleError(error, {
            operationId: 'backend-polling',
            operation: 'fetchPosts',
            retryFunction: fetchPosts
          });
        }
      }
      
      // Update UI state
      setErrorCount(consecutiveErrors);
      
      if (consecutiveErrors >= MAX_ERRORS) {
        // Stop polling after max errors
        setConnectionStatus('error');
        console.warn(`[GameView] Backend polling stopped after ${MAX_ERRORS} consecutive errors`);
        // Don't schedule next poll
      } else {
        // Exponential backoff
        currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
        setConnectionStatus('disconnected');
        
        console.log(`[GameView] Retrying in ${currentDelay}ms (attempt ${consecutiveErrors}/${MAX_ERRORS})`);
        
        // Schedule next poll with backoff delay
        timeoutId = setTimeout(fetchPosts, currentDelay);
      }
    }
  };

  // Initial fetch
  fetchPosts();

  // Cleanup
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}, [agentState, retryTrigger]); // Add retryTrigger to dependencies
```

#### GameView.jsx - Add manual retry handler
```javascript
/**
 * Handle manual retry of backend connection
 */
const handleManualRetry = () => {
  console.log('[GameView] Manual retry requested by user');
  setErrorCount(0);
  setConnectionStatus('connected');
  setRetryTrigger(prev => prev + 1);
};
```

#### GameView.jsx - Pass retry handler to UIOverlay
```javascript
<UIOverlay
  scene={sceneRef.current}
  fps={fps}
  connectionStatus={connectionStatus}
  agentCount={agentCount}
  taskCount={taskCount}
  onViewToggle={handleViewToggle}
  onManualRetry={handleManualRetry}
>
```

### Acceptance Criteria
- [ ] Polling implements exponential backoff (3s, 6s, 12s, 24s, 30s)
- [ ] Polling stops after 5 consecutive errors
- [ ] Error count resets on successful response
- [ ] Connection status updates correctly (connected/disconnected/error)
- [ ] Manual retry function works
- [ ] No infinite loops in production

---

## Task 3: Add Manual Retry Button to UIOverlay

**Status**: Ready to implement  
**Estimated Time**: 15 minutes  
**Dependencies**: Task 2

### Description
Add a manual retry button to the UIOverlay that appears when connection status is 'error'.

### Implementation Steps

1. **Update UIOverlay.jsx**
   - Add `onManualRetry` prop
   - Add retry button when `connectionStatus === 'error'`
   - Style button appropriately

### Code Changes

#### UIOverlay.jsx - Add prop and button
```javascript
const UIOverlay = ({ 
  scene, 
  fps, 
  connectionStatus, 
  agentCount, 
  taskCount, 
  onViewToggle,
  onManualRetry  // Add new prop
}) => {
  // ... existing code ...
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
          {/* ... existing top bar content ... */}
          
          {/* Connection Status with Retry Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'disconnected' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'disconnected' ? 'Reconnecting...' :
                 'Connection Error'}
              </span>
            </div>
            
            {/* Manual Retry Button */}
            {connectionStatus === 'error' && onManualRetry && (
              <button
                onClick={onManualRetry}
                className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
                title="Retry connection to backend"
              >
                Retry
              </button>
            )}
          </div>
          
          {/* ... rest of top bar ... */}
        </div>
      </div>
      
      {/* ... rest of overlay ... */}
    </div>
  );
};
```

### Acceptance Criteria
- [ ] Retry button appears when connectionStatus is 'error'
- [ ] Button is styled consistently with UI
- [ ] Button calls onManualRetry when clicked
- [ ] Button has hover state
- [ ] Button has descriptive title attribute

---

## Task 4: Test and Verify Fixes

**Status**: Ready to implement  
**Estimated Time**: 20 minutes  
**Dependencies**: Tasks 1, 2, 3

### Description
Test all fixes to ensure they work correctly in both development and production.

### Testing Steps

1. **Test CullingSystem Fix**
   - [ ] Start game view
   - [ ] Verify no PixiJS errors in console
   - [ ] Verify game renders correctly
   - [ ] Check LODSystem can call getVisibleCount()

2. **Test Circuit Breaker**
   - [ ] Simulate backend 502 errors (disconnect backend)
   - [ ] Verify exponential backoff in console logs
   - [ ] Verify polling stops after 5 errors
   - [ ] Verify connection status updates correctly
   - [ ] Verify manual retry button appears
   - [ ] Click retry button and verify polling resumes

3. **Test Normal Operation**
   - [ ] Start with working backend
   - [ ] Verify normal 3-second polling
   - [ ] Verify agent state updates correctly
   - [ ] Verify no performance degradation

4. **Test Error Recovery**
   - [ ] Simulate 2-3 errors then success
   - [ ] Verify error count resets
   - [ ] Verify delay returns to 3 seconds
   - [ ] Verify connection status returns to 'connected'

### Acceptance Criteria
- [ ] All tests pass
- [ ] No console errors
- [ ] No infinite loops
- [ ] Game loads successfully
- [ ] Backend polling works correctly
- [ ] Error recovery works as expected

---

## Task 5: Deploy and Monitor

**Status**: Ready to implement  
**Estimated Time**: 15 minutes  
**Dependencies**: Task 4

### Description
Deploy fixes to production and monitor for issues.

### Deployment Steps

1. **Build and Deploy Frontend**
   ```powershell
   cd frontend
   npm run build
   aws s3 sync build/ s3://YOUR-BUCKET-NAME --delete
   aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
   ```

2. **Monitor Logs**
   - Check browser console for errors
   - Monitor CloudWatch logs for backend errors
   - Check user reports

3. **Verify in Production**
   - [ ] Game loads without errors
   - [ ] No infinite 502 loops
   - [ ] Circuit breaker works correctly
   - [ ] Manual retry works

### Acceptance Criteria
- [ ] Deployment successful
- [ ] No new errors in production
- [ ] User-reported issues resolved
- [ ] Monitoring shows healthy metrics

---

## Summary

**Total Estimated Time**: ~1.5 hours

**Priority Order**:
1. Task 1 (5 min) - Fix PixiJS crash
2. Task 2 (30 min) - Implement circuit breaker
3. Task 3 (15 min) - Add retry button
4. Task 4 (20 min) - Test everything
5. Task 5 (15 min) - Deploy and monitor

**Critical Path**: Tasks 1 → 2 → 3 → 4 → 5

**Risk Assessment**: Low
- Changes are isolated to GameView component
- CullingSystem change is additive (no breaking changes)
- Circuit breaker improves reliability
- Easy to rollback if needed
