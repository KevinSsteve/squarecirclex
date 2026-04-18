# Browser Cache Clear Instructions

## Current Situation

✅ **Fix is deployed and live** - The DebugOverlay initialization order has been fixed in the code
❌ **Your browser is loading old cached files** - You're still seeing the old bundle with the bug

## Evidence

Your console shows:
```
index-7Roos5Ie.js:509  ← OLD BUNDLE (has the bug)
```

The new bundle should be:
```
index-CgnatrMe.js  ← NEW BUNDLE (has the fix)
```

## Why This Happens

Browsers aggressively cache JavaScript files for performance. Even though we deployed new code, your browser is still using the old cached version.

## Solution: Clear Browser Cache

### Method 1: Hard Refresh (Quickest)

**Windows:**
```
Ctrl + Shift + R
or
Ctrl + F5
```

**Mac:**
```
Cmd + Shift + R
```

This forces the browser to bypass cache and download fresh files.

### Method 2: Clear Cache Completely (Most Reliable)

1. **Open Developer Tools**
   - Press `F12` or `Ctrl+Shift+I` (Windows)
   - Or `Cmd+Option+I` (Mac)

2. **Open Network Tab**
   - Click on "Network" tab in DevTools

3. **Disable Cache**
   - Check the box "Disable cache" at the top of Network tab
   - Keep DevTools open while testing

4. **Clear Browser Cache**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Select "All time" or "Everything"
   - Check "Cached images and files"
   - Click "Clear data"

5. **Reload Page**
   - Press `F5` or click reload button
   - Keep DevTools open with "Disable cache" checked

### Method 3: Incognito/Private Window (Alternative)

1. Open a new incognito/private window:
   - `Ctrl+Shift+N` (Chrome/Edge)
   - `Ctrl+Shift+P` (Firefox)
   - `Cmd+Shift+N` (Mac)

2. Navigate to:
   ```
   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com
   ```

3. Clear localStorage:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

## Verification Steps

After clearing cache, verify the new code is loaded:

### 1. Check Bundle Name in Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page (F5)
4. Look for JavaScript files
5. You should see: `index-CgnatrMe.js` (NEW)
6. You should NOT see: `index-7Roos5Ie.js` (OLD)

### 2. Check Console Logs

After clearing cache and reloading, you should see:

✅ **Expected (Success):**
```
[ViewToggle] Mid-range device detected - MEDIUM performance mode
[ViewToggle] Starting load timeout (attempt 1/3)
[GameView] Performance settings: {...}
Critical assets loaded - starting game
[ViewToggle] Game loaded successfully
```

❌ **Not Expected (Still Cached):**
```
[GameView] Failed to initialize game: TypeError: Cannot read properties of undefined (reading 'ui_world')
[ViewToggle] Game load failed (reason: initialization, attempt: 0)
[GameView] Falling back to traditional UI
```

### 3. Check for Errors

After clearing cache, the game should load WITHOUT these errors:
- ❌ "Cannot read properties of undefined (reading 'ui_world')"
- ❌ "Game load failed (reason: initialization)"
- ❌ "Falling back to traditional UI"

## Step-by-Step Testing Procedure

1. **Close all browser tabs** with the game open

2. **Clear browser cache completely**
   - `Ctrl+Shift+Delete` → Select "All time" → Clear cache

3. **Clear localStorage**
   - Open a new tab to the site
   - Open console (F12)
   - Run: `localStorage.clear()`

4. **Open DevTools and disable cache**
   - Press F12
   - Go to Network tab
   - Check "Disable cache"
   - Keep DevTools open

5. **Navigate to the site**
   ```
   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com
   ```

6. **Verify new bundle is loaded**
   - Check Network tab for `index-CgnatrMe.js`
   - Should NOT see `index-7Roos5Ie.js`

7. **Check console for success logs**
   - Should see "Game loaded successfully"
   - Should NOT see "Failed to initialize game"

8. **Verify game view loads**
   - Office layout should be visible
   - Agent should be visible
   - No redirect to dashboard
   - No errors in console

## Troubleshooting

### Still seeing old bundle after clearing cache?

Try these additional steps:

1. **Close ALL browser windows** (not just tabs)
2. **Restart your browser completely**
3. **Try a different browser** (Chrome, Firefox, Edge)
4. **Use incognito/private mode**
5. **Check if you have browser extensions** that might cache files

### Still getting the error?

If you've cleared cache completely and still see the error:

1. **Verify the bundle name in Network tab**
   - If you see `index-7Roos5Ie.js`, cache is not cleared
   - If you see `index-CgnatrMe.js`, the fix should work

2. **Check if there's a service worker**
   - Open DevTools → Application tab → Service Workers
   - If any are registered, click "Unregister"
   - Reload page

3. **Try accessing with cache-busting parameter**
   ```
   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/?nocache=1
   ```

## What the Fix Does

The fix changes the initialization order in `Scene.js`:

**Before (Bug):**
```javascript
this.debugOverlay = new DebugOverlay(this, this.app); // ❌ Too early!
this.layers = this.createLayers(); // Layers created AFTER
```

**After (Fixed):**
```javascript
this.layers = this.createLayers(); // ✅ Layers created FIRST
this.debugOverlay = new DebugOverlay(this, this.app); // ✅ After layers exist
```

The DebugOverlay needs layers to exist before it can add graphics to them. The fix ensures layers are created first.

## Summary

1. ✅ Fix is deployed and live
2. ❌ Your browser has cached the old code
3. 🔧 Clear browser cache completely
4. ✅ Verify new bundle loads (`index-CgnatrMe.js`)
5. ✅ Game should load without errors

## Quick Commands

**Clear localStorage:**
```javascript
localStorage.clear();
location.reload();
```

**Check bundle version:**
```javascript
// Look in Network tab for:
// ✅ index-CgnatrMe.js (NEW - has fix)
// ❌ index-7Roos5Ie.js (OLD - has bug)
```

**Force reload:**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

## Need Help?

If you've followed all these steps and still see the error:

1. Take a screenshot of the Network tab showing the bundle name
2. Take a screenshot of the console errors
3. Let me know which browser and version you're using
4. Confirm you've cleared cache and localStorage

The fix is definitely deployed - we just need to make sure your browser loads the new code!
