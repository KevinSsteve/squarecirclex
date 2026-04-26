import { useState, useEffect } from 'react';
import featureFlags from '../../../config/featureFlags';

/**
 * Development Mode Banner
 * 
 * Displays a prominent warning banner when development mode is active.
 * The banner warns developers that brand association checks are disabled
 * and should not be used in production.
 * 
 * Features:
 * - Dismissible with localStorage persistence
 * - Only shows when showDevModeBanner flag is true
 * - Uses warning colors (yellow/orange) for visibility
 * - Fixed positioning at top of screen
 * - High z-index to appear above all other UI
 * 
 * @component
 * @example
 * ```jsx
 * <DevModeBanner />
 * ```
 */
const DevModeBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  
  // Check localStorage for dismissed state on mount
  useEffect(() => {
    const isDismissed = localStorage.getItem('devModeBannerDismissed') === 'true';
    setDismissed(isDismissed);
  }, []);
  
  // Don't show if not in dev mode or if dismissed
  if (!featureFlags.showDevModeBanner || dismissed) {
    return null;
  }
  
  /**
   * Handle banner dismissal
   * Saves dismissed state to localStorage so it persists across page reloads
   */
  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('devModeBannerDismissed', 'true');
  };
  
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-3 shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Warning Icon */}
          <svg 
            className="w-6 h-6 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          
          {/* Banner Content */}
          <div>
            <p className="font-bold text-sm sm:text-base">
              ⚠️ Development Mode Active
            </p>
            <p className="text-xs sm:text-sm">
              Brand association checks are disabled. This mode should not be used in production.
            </p>
          </div>
        </div>
        
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="ml-4 text-yellow-900 hover:text-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-700 rounded p-1"
          aria-label="Dismiss development mode banner"
          title="Dismiss banner (will reappear on page reload)"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DevModeBanner;
