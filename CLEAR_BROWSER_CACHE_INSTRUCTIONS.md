# Clear Browser Cache - Fix Black Screen Issue

## Problem
Your browser is serving old JavaScript code that doesn't have the `pauseAll()` method fix. This is causing the game initialization to fail, resulting in a black screen.

## Solution: Hard Refresh to Clear Cache

### Windows/Linux:
Press **`Ctrl + Shift + R`** or **`Ctrl + F5`**

### Mac:
Press **`Cmd + Shift + R`**

### Alternative Method (if hard refresh doesn't work):

1. Open Developer Tools (F12)
2. Right-click the refresh button in your browser
3. Select "Empty Cache and Hard Reload"

### If Still Not Working:

1. Close ALL browser tabs/windows
2. Clear browser cache manually:
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content
   - Edge: Settings → Privacy → Clear browsing data → Cached images and files
3. Restart your browser
4. Navigate to `http://localhost:5173/app`

## What This Will Fix

After clearing the cache, your browser will load the updated JavaScript code that includes:
- ✅ Fixed `AnimationSystem.pauseAll()` method
- ✅ Fixed `AnimationSystem.resumeAll()` method
- ✅ Proper performance monitoring without crashes

## Expected Result

After the hard refresh, you should see:
- ✅ Isometric office layout with 5 departments (colored rectangles)
- ✅ Grid lines and reference lines
- ✅ One agent entity (circle with label "Marketing Agent")
- ✅ Department labels
- ✅ No JavaScript errors in console

## Verification

Open the browser console (F12) and check for:
- ❌ NO "pauseAll is not a function" errors
- ✅ "Generated 58 placeholder agent textures"
- ✅ "Registered 10 agent animations"
- ✅ "LOD changed: high → low" (or similar)
- ✅ No errors after LOD change

---

**IMPORTANT**: The code has been fixed. You just need to force your browser to load the new code instead of using the cached old version.
