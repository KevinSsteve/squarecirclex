/**
 * Feature Flags Configuration
 * Controls optional features and development modes
 * 
 * This module provides centralized feature flag management for the application.
 * Feature flags can be controlled via environment variables and are automatically
 * disabled in production builds for security.
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Parse environment variable (default to false for safety)
// Note: Using import.meta.env for Vite compatibility
const devModeEnv = import.meta.env.VITE_DEV_MODE === 'true';

/**
 * Feature flags object
 * @type {Object}
 */
export const featureFlags = {
  /**
   * Skip brand association check in GameView
   * Allows access to game view without completing onboarding
   * 
   * When enabled:
   * - Users can access /app without completing onboarding
   * - Brand association check is bypassed
   * - Backend errors related to missing brand are handled gracefully
   * - Development mode banner is displayed
   * 
   * Security: Always disabled in production builds
   * 
   * @type {boolean}
   * @default false in production, configurable in development via VITE_DEV_MODE
   */
  skipBrandAssociation: isProduction ? false : devModeEnv,
  
  /**
   * Show development mode banner
   * Displays warning banner when development features are enabled
   * 
   * The banner warns developers that development mode is active and should
   * not be used in production. It can be dismissed but will reappear on
   * page reload unless localStorage is cleared.
   * 
   * @type {boolean}
   * @default false in production, true in development when dev mode is enabled
   */
  showDevModeBanner: !isProduction && devModeEnv,
  
  /**
   * Enable verbose logging
   * Logs additional debug information to console
   * 
   * When enabled, the application will log:
   * - Feature flag initialization
   * - Authentication flow details
   * - Backend polling status
   * - State changes and transitions
   * 
   * @type {boolean}
   * @default true in development, false in production
   */
  verboseLogging: isDevelopment,
};

// Log feature flags on initialization (only in development)
if (featureFlags.verboseLogging) {
  console.log('[FeatureFlags] Configuration initialized:', {
    environment: process.env.NODE_ENV,
    skipBrandAssociation: featureFlags.skipBrandAssociation,
    showDevModeBanner: featureFlags.showDevModeBanner,
    verboseLogging: featureFlags.verboseLogging,
  });
  
  // Warn if development mode is enabled
  if (featureFlags.skipBrandAssociation) {
    console.warn(
      '[FeatureFlags] ⚠️  Development mode is ENABLED - Brand association checks are disabled. ' +
      'This should NOT be used in production!'
    );
  }
}

// Production safety check - log error if dev mode somehow gets enabled in production
if (isProduction && devModeEnv) {
  console.error(
    '[FeatureFlags] ❌ SECURITY WARNING: VITE_DEV_MODE is set to true in production build! ' +
    'Development mode has been force-disabled for security. Check your build configuration.'
  );
}

export default featureFlags;
