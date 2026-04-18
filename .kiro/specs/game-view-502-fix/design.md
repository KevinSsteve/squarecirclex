# Game View 502 Error Loop and PixiJS Crash Fix - Design

## Architecture Overview

This fix addresses two critical issues in the game view:
1. Infinite 502 error loop in backend polling
2. Missing `getVisibleCount()` method in CullingSystem

## Component Design

### 1. Backend Polling Circuit Breaker

#### Current Implementation
```javascript
useEffect(() => {
  const fetchPosts = async () => {
    try {
      const response = await api.getPosts();
      // ... handle response
    } catch (error) {
      console.error('Error fetching posts:', error);
      setErrorCount(errorCount + 1);
      // Continues polling regardless of error
    }
  };
  
  fetchPosts();
  const intervalId = setInterval(fetchPosts, 3000);
  return () => clearInterval(intervalId);
}, [agentState, errorCount]);
```

#### Proposed Implementation
```javascript
useEffect(() => {
  let intervalId = null;
  let retryTimeoutId = null;
  let consecutiveErrors = 0;
  let currentDelay = 3000; // Start with 3 seconds
  const MAX_ERRORS = 5;
  const BASE_DELAY = 3000;
  const MAX_DELAY = 30000;
  
  const fetchPosts = async () => {
    try {
      const response = await api.getPosts();
      
      // Success - reset error tracking
      consecutiveErrors = 0;
      currentDelay = BASE_DELAY;
      setConnectionStatus('connected');
      setErrorCount(0);
      
      // ... handle response
      
      // Schedule next poll with normal delay
      if (consecutiveErrors < MAX_ERRORS) {
        intervalId = setTimeout(fetchPosts, currentDelay);
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
        console.warn('Backend polling stopped after max errors');
        // Don't schedule next poll
      } else {
        // Exponential backoff
        currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
        setConnectionStatus('disconnected');
        
        // Schedule next poll with backoff delay
        intervalId = setTimeout(fetchPosts, currentDelay);
      }
    }
  };
  
  // Initial fetch
  fetchPosts();
  
  // Cleanup
  return () => {
    if (intervalId) clearTimeout(intervalId);
    if (retryTimeoutId) clearTimeout(retryTimeoutId);
  };
}, [agentState]); // Remove errorCount from dependencies
```

#### Manual Retry Mechanism
```javascript
const handleManualRetry = () => {
  console.log('[GameView] Manual retry requested');
  setErrorCount(0);
  setConnectionStatus('connected');
  // Trigger re-render to restart polling
  setRetryTrigger(prev => prev + 1);
};
```

### 2. CullingSystem API Extension

#### Add Missing Method
```javascript
/**
 * Get count of visible entities
 * @returns {number} Number of visible entities
 */
getVisibleCount() {
  return this.stats.visibleEntities;
}
```

This method should be added to `CullingSystem.js` after the existing `getStats()` method.

### 3. Error UI Component

#### Connection Status Indicator
Location: `UIOverlay.jsx` (already exists)

Enhancement: Add manual retry button when connection status is 'error':

```javascript
{connectionStatus === 'error' && (
  <button
    onClick={handleManualRetry}
    className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
  >
    Retry Connection
  </button>
)}
```

## Data Flow

### Normal Operation Flow
```
1. GameView mounts
2. Start backend polling (3s interval)
3. Fetch posts successfully
4. Update agent state
5. Continue polling
```

### Error Recovery Flow
```
1. Backend request fails (502)
2. Increment error counter
3. Calculate backoff delay (exponential)
4. Update connection status UI
5. Wait backoff delay
6. Retry request
7. If success: reset counter, resume normal polling
8. If failure: repeat steps 2-6
9. If max errors reached: stop polling, show retry button
```

### Manual Retry Flow
```
1. User clicks "Retry Connection" button
2. Reset error counter to 0
3. Reset connection status to 'connected'
4. Trigger useEffect re-run
5. Resume normal polling
```

## Error Handling Strategy

### Error Categories

1. **Transient Errors** (502, 503, 504)
   - Use exponential backoff
   - Auto-retry up to MAX_ERRORS
   - Show "disconnected" status

2. **Client Errors** (400, 401, 403)
   - Stop polling immediately
   - Show "error" status
   - Require manual intervention

3. **Network Errors** (timeout, no connection)
   - Use exponential backoff
   - Auto-retry up to MAX_ERRORS
   - Show "disconnected" status

### Degradation Modes

Integrated with ErrorRecoverySystem:

1. **Level 1** (1-2 errors): Continue with backoff
2. **Level 2** (3-4 errors): Pause animations, use cached state
3. **Level 3** (5+ errors): Stop polling, show manual retry

## Configuration

### Polling Configuration
```javascript
const POLLING_CONFIG = {
  BASE_DELAY: 3000,        // 3 seconds
  MAX_DELAY: 30000,        // 30 seconds
  MAX_ERRORS: 5,           // Stop after 5 consecutive errors
  BACKOFF_MULTIPLIER: 2    // Double delay each time
};
```

### Error Recovery Configuration
Already configured in Scene.js:
```javascript
this.errorRecoverySystem = new ErrorRecoverySystem({
  autoRetryEnabled: true,
  maxRetryAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffStrategy: 'exponential'
});
```

## Testing Strategy

### Unit Tests
1. Test exponential backoff calculation
2. Test error counter increment/reset
3. Test polling stop after max errors
4. Test manual retry functionality

### Integration Tests
1. Test backend polling with mock 502 responses
2. Test ErrorRecoverySystem integration
3. Test UI state updates during errors
4. Test manual retry button functionality

### Manual Testing
1. Simulate backend 502 errors
2. Verify exponential backoff delays
3. Verify polling stops after 5 errors
4. Verify manual retry works
5. Verify game continues to function during errors

## Performance Considerations

### Memory
- No memory leaks from interval/timeout cleanup
- Error state stored in component state (minimal overhead)

### Network
- Exponential backoff reduces network load during outages
- Circuit breaker prevents excessive requests

### CPU
- Error handling adds <1ms per request
- No impact on game rendering performance

## Rollback Plan

If issues arise:
1. Revert to previous polling implementation
2. Keep CullingSystem.getVisibleCount() method (no harm)
3. Monitor error logs for new issues

## Future Enhancements

1. **WebSocket Integration**: Replace polling with real-time updates
2. **Offline Mode**: Cache last known state, work offline
3. **Service Worker**: Background sync for better reliability
4. **Metrics Dashboard**: Track error rates, recovery times
5. **Smart Retry**: Adjust retry strategy based on error type
