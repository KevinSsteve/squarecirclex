# Development Mode Troubleshooting - Redirect Issue

## Problem

You're being redirected to `/dashboard` when trying to access `/app` even with `VITE_DEV_MODE=true`.

## Root Cause

There are TWO separate systems that can cause redirects:

1. **ViewToggle System**: Checks localStorage for view preference
2. **Authentication System**: Checks for brand association (bypassed in dev mode)

## Console Logs Analysis

```
[ViewToggle] Game view enabled for all devices (mobile detection disabled)
[GameView] User prefers traditional view - redirecting to dashboard  ← THIS IS THE PROBLEM
[GameView] Skipping backend polling - not authenticated
[GameView] User has no brand association
```

The log shows ViewToggle is redirecting you because it thinks you prefer traditional view.

## Solution

### Option 1: Clear localStorage (Recommended)

Open browser console (F12) and run:

```javascript
// Clear ViewToggle preference
localStorage.removeItem('viewToggle');

// Clear dev mode banner dismissed state (optional)
localStorage.removeItem('devModeBannerDismissed');

// Reload page
location.reload();
```

### Option 2: Force Game View via URL Parameter

Access the game view with URL parameter override:

```
http://localhost:5173/app?view=game
```

This will force game view regardless of localStorage preference.

### Option 3: Manually Set Game View Preference

Open browser console (F12) and run:

```javascript
// Set game view preference
const viewToggleData = {
  currentView: 'game',
  performanceLevel: 'high',
  timestamp: Date.now()
};
localStorage.setItem('viewToggle', JSON.stringify(viewToggleData));

// Reload page
location.reload();
```

## Verification Steps

After clearing localStorage:

1. **Check Console Logs**: Should see:
   ```
   [FeatureFlags] ⚠️  Development mode is ENABLED
   [GameView] ⚠️  Development mode - skipping brand association check
   ```

2. **Check Yellow Banner**: Should see development mode banner at top

3. **Check Game Loads**: PixiJS canvas should render

4. **Check No Redirect**: Should stay on `/app` route

## Why This Happens

The ViewToggle system was designed to remember user preferences. If you previously:
- Clicked "Switch to Traditional View" button
- Had a load failure that triggered automatic fallback
- Manually set traditional view preference

Then localStorage will have `currentView: 'traditional'` saved, causing automatic redirects.

## Development Mode vs View Toggle

These are **separate systems**:

- **Development Mode** (`VITE_DEV_MODE`): Bypasses brand association check
- **View Toggle**: Manages game vs traditional UI preference

Both must be configured correctly:
- Development mode: `VITE_DEV_MODE=true` in `.env`
- View preference: `currentView: 'game'` in localStorage

## Quick Fix Command

Run this in browser console:

```javascript
// Clear all game-related localStorage
['viewToggle', 'devModeBannerDismissed', 'gamePreferences', 'cameraPreferences'].forEach(key => localStorage.removeItem(key));
location.reload();
```

## Testing Development Mode

After fixing localStorage:

1. Access `/app` - should see yellow dev mode banner
2. Check console - should see dev mode warnings
3. Game should load without brand association
4. Backend polling should continue (with graceful error handling)

## Related Files

- `frontend/src/components/game/utils/ViewToggle.js` - View preference system
- `frontend/src/config/featureFlags.js` - Development mode flags
- `frontend/src/components/game/GameView.jsx` - Authentication logic
- `DEVELOPMENT_MODE.md` - Full development mode guide

## Still Having Issues?

If you're still being redirected after clearing localStorage:

1. **Check `.env` file**: Ensure `VITE_DEV_MODE=true`
2. **Restart dev server**: `npm run dev` (Vite hot-reloads env vars)
3. **Check browser console**: Look for feature flag initialization logs
4. **Try incognito mode**: Rules out browser extension interference
5. **Check authentication**: Ensure you're logged in (valid JWT token)

## Production Note

In production builds:
- Development mode is ALWAYS disabled (hardcoded)
- View toggle still works normally
- Brand association is ALWAYS enforced
- No localStorage clearing needed
