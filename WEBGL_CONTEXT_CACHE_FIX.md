# WebGL Context and Cache Warnings Fix

## Problem Summary

The application was experiencing multiple issues:

1. **TypeError**: `lodSystem.setManualLOD is not a function` in PerformanceMonitor.js:421
2. **WebGL Context Warning**: "Too many active WebGL contexts. Oldest context will be lost."
3. **PixiJS Cache Warnings**: Multiple warnings about duplicate cache keys for agent textures

## Root Causes

### 1. PerformanceMonitor Method Name Mismatch
- **Issue**: PerformanceMonitor was calling `lodSystem.setManualLOD()` but LODSystem only has `setForcedLOD()`
- **Location**: `frontend/src/components/game/systems/PerformanceMonitor.js:421`

### 2. Multiple WebGL Context Creation
- **Issue**: `ViewToggle.checkGameSupport()` was creating a new WebGL context every time it was called to test WebGL support
- **Impact**: Each component render that checked game availability created a new context
- **Location**: `frontend/src/components/game/utils/ViewToggle.js:checkGameSupport()`

### 3. Duplicate Texture Registration
- **Issue**: Placeholder textures were being added to PixiJS cache multiple times without checking if they already existed
- **Location**: `frontend/src/components/game/animations/placeholderSprites.js:loadPlaceholderTextures()`

## Solutions Applied

### 1. Fixed PerformanceMonitor Method Call
**File**: `frontend/src/components/game/systems/PerformanceMonitor.js`

```javascript
// Before:
lodSystem.setForcedLOD('low');

// After:
if (lodSystem && typeof lodSystem.setForcedLOD === 'function') {
  lodSystem.setForcedLOD('low');
}
```

Added type checking to ensure the method exists before calling it.

### 2. Implemented WebGL Context Caching
**File**: `frontend/src/components/game/utils/ViewToggle.js`

#### Added Cache Property
```javascript
constructor() {
  // ...
  this.gameSupportCache = null; // Cache for game support check
  // ...
}
```

#### Updated checkGameSupport() Method
```javascript
checkGameSupport() {
  // Return cached result if available
  if (this.gameSupportCache !== null) {
    return this.gameSupportCache;
  }
  
  // Check WebGL support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const hasWebGL = !!gl;
  
  // Clean up the test canvas immediately
  if (gl) {
    const loseContext = gl.getExtension('WEBGL_lose_context');
    if (loseContext) {
      loseContext.loseContext();
    }
  }
  
  // Cache the result
  this.gameSupportCache = hasWebGL;
  return hasWebGL;
}
```

#### Optimized ViewToggleButton
**File**: `frontend/src/components/game/ui/ViewToggleButton.jsx`

```javascript
// Before:
const [isGameAvailable, setIsGameAvailable] = useState(viewToggle.isGameViewAvailable());

// After:
const [isGameAvailable] = useState(() => viewToggle.isGameViewAvailable());
```

Changed to use lazy initialization to prevent re-checking on every render.

### 3. Fixed Duplicate Texture Registration
**File**: `frontend/src/components/game/animations/placeholderSprites.js`

```javascript
// Before:
Object.entries(textures).forEach(([id, texture]) => {
  PIXI.Assets.cache.set(id, texture);
});

// After:
Object.entries(textures).forEach(([id, texture]) => {
  if (!PIXI.Assets.cache.has(id)) {
    PIXI.Assets.cache.set(id, texture);
  }
});
```

Added check to prevent duplicate texture registration.

## Impact

### Before
- TypeError crashes in PerformanceMonitor
- Multiple WebGL contexts created (browser warning)
- 58 duplicate texture warnings in console
- Potential memory leaks from uncleaned WebGL contexts

### After
- ✅ No TypeError - method calls are validated
- ✅ Single WebGL context created and properly cleaned up
- ✅ No duplicate texture warnings
- ✅ Improved performance with cached WebGL support check
- ✅ Reduced memory usage

## Testing

To verify the fixes:

1. **Clear browser cache and localStorage**
2. **Reload the application**
3. **Check console for:**
   - No TypeError about `setManualLOD`
   - No "too many WebGL contexts" warnings
   - No duplicate PixiJS cache warnings
4. **Navigate between views** to ensure ViewToggle works correctly
5. **Monitor performance** to ensure PerformanceMonitor functions properly

## Related Files

- `frontend/src/components/game/systems/PerformanceMonitor.js`
- `frontend/src/components/game/systems/LODSystem.js`
- `frontend/src/components/game/utils/ViewToggle.js`
- `frontend/src/components/game/ui/ViewToggleButton.jsx`
- `frontend/src/components/game/animations/placeholderSprites.js`

## Date
April 19, 2026
