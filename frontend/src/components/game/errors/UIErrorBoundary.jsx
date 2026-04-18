import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * UIErrorBoundary Component
 * 
 * Error boundary for the UI overlay layer (React components above canvas).
 * Catches errors in UI components and provides fallback UI.
 * 
 * Features:
 * - Catches React errors in UI overlay components
 * - Logs errors to console
 * - Provides minimal fallback UI
 * - Offers retry option
 * - Allows game to continue running even if UI fails
 * 
 * Phase 10, Task 59
 * Requirements: 12.2
 */
class UIErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console
    console.error('UI Overlay Error:', error);
    console.error('Error Info:', errorInfo);
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset error state and attempt to re-render
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleDismiss = () => {
    // Hide error UI but keep error state (game continues without UI)
    this.setState({
      hasError: false
    });
  };

  render() {
    if (this.state.hasError) {
      // Render minimal fallback UI that doesn't block the game
      return (
        <div className="fixed top-4 right-4 bg-white rounded-lg shadow-xl max-w-md w-full p-4 z-[200] pointer-events-auto">
          {/* Error Icon */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              {/* Error Title */}
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                UI Overlay Error
              </h3>

              {/* Error Message */}
              <p className="text-sm text-gray-600 mb-3">
                The UI overlay encountered an error. The game is still running.
              </p>

              {/* Error Details (Collapsible) */}
              {this.state.error && (
                <details className="mb-3 text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Show details
                  </summary>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-red-600 font-mono overflow-auto max-h-24">
                    {this.state.error.toString()}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  Retry UI
                </button>
                <button
                  onClick={this.handleDismiss}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  Dismiss
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-500 mt-2">
                You can continue using the game without the UI overlay.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={this.handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

UIErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func
};

export default UIErrorBoundary;
