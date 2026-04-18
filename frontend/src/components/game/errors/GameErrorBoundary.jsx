import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * GameErrorBoundary Component
 * 
 * Error boundary for the game layer (PixiJS canvas and game logic).
 * Catches errors in the game rendering and provides fallback UI.
 * 
 * Features:
 * - Catches React errors in game components
 * - Logs errors to console
 * - Provides fallback UI with error details
 * - Offers retry and fallback to traditional UI options
 * 
 * Phase 10, Task 59
 * Requirements: 12.2
 */
class GameErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console
    console.error('Game Layer Error:', error);
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

  handleFallbackToTraditional = () => {
    // Call fallback callback to switch to traditional UI
    if (this.props.onFallbackToTraditional) {
      this.props.onFallbackToTraditional();
    }
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
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

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Game Layer Error
            </h2>

            {/* Error Message */}
            <p className="text-gray-600 text-center mb-6">
              The game visualization encountered an error and couldn't continue.
            </p>

            {/* Error Details (Collapsible) */}
            {this.state.error && (
              <details className="mb-6 bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Error:</p>
                    <p className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded">
                      {this.state.error.toString()}
                    </p>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Stack Trace:</p>
                      <pre className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Error Count:</p>
                    <p className="text-sm text-gray-600">
                      {this.state.errorCount} error(s) occurred
                    </p>
                  </div>
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Retry Button */}
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                <span className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry Game View
                </span>
              </button>

              {/* Fallback to Traditional UI Button */}
              <button
                onClick={this.handleFallbackToTraditional}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                <span className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Use Traditional View
                </span>
              </button>
            </div>

            {/* Help Text */}
            <p className="text-sm text-gray-500 text-center mt-4">
              If the problem persists, try using the traditional view or refresh the page.
            </p>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

GameErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func,
  onFallbackToTraditional: PropTypes.func
};

export default GameErrorBoundary;
