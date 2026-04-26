# Development Mode - Skip Onboarding for Game Development

## Overview

Development mode is a feature flag system that allows developers to access the GameView (`/app`) without completing the onboarding process. This is useful during game appearance development when you want to iterate on the visual design without needing to create a full brand profile.

## What Development Mode Does

When development mode is enabled:

1. **Skips Brand Association Check**: Users can access `/app` without completing onboarding
2. **Graceful Error Handling**: Backend errors related to missing brand are handled gracefully
3. **Continues Backend Polling**: The system continues polling with cached/mock data instead of stopping
4. **Shows Warning Banner**: A prominent yellow banner warns that development mode is active
5. **Enhanced Logging**: Additional console logs help debug authentication and state issues

## How to Enable Development Mode

### For Local Development

1. Open `frontend/.env` file
2. Set `VITE_DEV_MODE=true`
3. Rebuild the frontend: `npm run build` or restart dev server
4. Access `/app` - you should see the development mode banner

```bash
# frontend/.env
VITE_DEV_MODE=true
```

### For Production

Development mode is **automatically disabled** in production builds regardless of the environment variable setting. This is a security feature to ensure brand association checks are always enforced in production.

## How to Disable Development Mode

1. Open `frontend/.env` file
2. Set `VITE_DEV_MODE=false` or remove the line
3. Rebuild the frontend
4. Access `/app` - you will be redirected to onboarding if no brand exists

```bash
# frontend/.env
VITE_DEV_MODE=false
```

## Environment Variables

### VITE_DEV_MODE

- **Type**: String (`'true'` or `'false'`)
- **Default**: `false` (safe default)
- **Production**: Always `false` (hardcoded)
- **Description**: Controls whether development mode features are enabled

## Visual Indicators

### Development Mode Banner

When development mode is active, you'll see a yellow warning banner at the top of the screen:

```
⚠️ Development Mode Active
Brand association checks are disabled. This mode should not be used in production.
[X]
```

The banner can be dismissed by clicking the X button, but it will reappear on page reload. To permanently remove it, disable development mode.

## Implications and Limitations

### What Still Works

- ✅ Authentication (JWT token validation)
- ✅ Token expiration checks
- ✅ Game view rendering
- ✅ Backend polling (with graceful error handling)
- ✅ All game features and interactions

### What's Bypassed

- ❌ Brand association requirement
- ❌ Onboarding completion check
- ❌ Brand-specific data validation

### Security Considerations

- Development mode only affects brand association checks
- Authentication is still required (valid JWT token)
- Token expiration is still enforced
- All other security checks remain active
- **Production builds always enforce all checks**

## Troubleshooting

### Banner Doesn't Appear

**Problem**: Development mode is enabled but banner doesn't show

**Solutions**:
1. Check that `VITE_DEV_MODE=true` in `.env`
2. Rebuild the frontend (`npm run build`)
3. Clear browser cache and localStorage
4. Check browser console for feature flag logs

### Still Redirected to Onboarding

**Problem**: Set `VITE_DEV_MODE=true` but still redirected

**Solutions**:
1. Ensure you rebuilt after changing `.env`
2. Check browser console for authentication errors
3. Verify you're logged in (valid JWT token)
4. Check that token hasn't expired
5. Look for feature flag initialization logs in console

### Backend Errors Continue

**Problem**: Backend still returns 500 errors about brand association

**Solutions**:
1. This is expected - development mode handles these gracefully
2. Check that polling continues (look for retry logs)
3. Verify connection status shows "connected" not "error"
4. Game should continue working with cached state

### Banner Won't Dismiss

**Problem**: Banner reappears after dismissing

**Solutions**:
1. This is expected behavior - banner persists across reloads
2. To permanently remove: disable development mode
3. Or clear localStorage: `localStorage.removeItem('devModeBannerDismissed')`

## Code Structure

### Feature Flags Module

Location: `frontend/src/config/featureFlags.js`

```javascript
export const featureFlags = {
  skipBrandAssociation: isProduction ? false : devModeEnv,
  showDevModeBanner: !isProduction && devModeEnv,
  verboseLogging: isDevelopment,
};
```

### Development Mode Banner

Location: `frontend/src/components/game/ui/DevModeBanner.jsx`

The banner component automatically shows/hides based on the `showDevModeBanner` flag.

### Authentication Logic

Location: `frontend/src/components/game/GameView.jsx`

```javascript
// Check brand association (can be disabled in development mode)
if (!featureFlags.skipBrandAssociation) {
  // Production mode: enforce brand association
  const brandId = await tokenManager.getBrandId();
  if (!brandId) {
    // Redirect to onboarding
  }
} else {
  // Development mode: skip brand association check
  console.warn('Development mode - skipping brand association check');
}
```

## Re-enabling Brand Association Checks

When you're ready to test with full authentication:

1. Set `VITE_DEV_MODE=false` in `.env`
2. Rebuild the frontend
3. Complete the onboarding process
4. Access `/app` with full brand association

## Best Practices

### During Development

- ✅ Use development mode for visual/UI work
- ✅ Keep development mode enabled in local `.env`
- ✅ Test with real brand data periodically
- ✅ Document any brand-specific features that need testing

### Before Deployment

- ✅ Set `VITE_DEV_MODE=false` in production `.env`
- ✅ Test full authentication flow
- ✅ Verify onboarding works correctly
- ✅ Confirm brand association is enforced
- ✅ Check that banner doesn't appear in production

### Code Reviews

- ✅ Ensure no hardcoded development mode bypasses
- ✅ Verify feature flags are used correctly
- ✅ Check that production safety is maintained
- ✅ Confirm logging is appropriate

## Related Files

- `frontend/src/config/featureFlags.js` - Feature flag configuration
- `frontend/src/components/game/ui/DevModeBanner.jsx` - Warning banner component
- `frontend/src/components/game/GameView.jsx` - Authentication logic
- `frontend/.env` - Environment configuration
- `frontend/.env.production` - Production configuration
- `frontend/.env.example` - Example configuration with documentation

## Support

If you encounter issues with development mode:

1. Check this documentation
2. Review browser console logs (look for `[FeatureFlags]` and `[GameView]` prefixes)
3. Verify environment variable configuration
4. Ensure frontend was rebuilt after changes
5. Check the spec: `.kiro/specs/skip-onboarding-game-dev/`

## Changelog

### 2026-04-18 - Initial Implementation

- Created feature flag system with `VITE_DEV_MODE`
- Implemented development mode banner
- Updated authentication logic to use feature flags
- Enhanced backend polling error handling
- Added comprehensive documentation
- Removed commented-out code in favor of feature flags

