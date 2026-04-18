/**
 * ErrorRecoverySystem Class - Handles error recovery and graceful degradation
 * 
 * Implements:
 * - Automatic retry with exponential backoff
 * - Graceful degradation for connection loss
 * - User notification for errors
 * - Manual retry buttons
 * - Error classification (retryable vs non-retryable)
 * - Recovery state tracking
 * 
 * Requirements: 4.4, 8.6
 * Phase 10, Task 60
 */

/**
 * Error types that can be automatically retried
 */
const RETRYABLE_ERRORS = [
  'network_error',
  'timeout',
  'rate_limit',
  'server_error_5xx',
  'connection_lost'
];

/**
 * Error types that should not be retried
 */
const NON_RETRYABLE_ERRORS = [
  'authentication_error',
  'authorization_error',
  'validation_error',
  'not_found',
  'client_error_4xx'
];

/**
 * ErrorRecoverySystem - Manages error recovery and graceful degradation
 */
class ErrorRecoverySystem {
  constructor(config = {}) {
    // Configuration with defaults
    this.config = {
      autoRetry: {
        enabled: config.autoRetryEnabled !== false, // Default true
        maxAttempts: config.maxRetryAttempts || 3,
        backoff: config.backoffStrategy || 'exponential',
        baseDelayMs: config.baseDelayMs || 1000,
        maxDelayMs: config.maxDelayMs || 30000
      },
      degradation: {
        connectionLost: config.connectionLostStrategy || 'pause_animations_show_last_known_state',
        syncFailed: config.syncFailedStrategy || 'continue_with_cached_state',
        renderError: config.renderErrorStrategy || 'fallback_to_traditional_ui'
      },
      userNotification: {
        showErrorToast: config.showErrorToast !== false, // Default true
        provideDetails: config.provideDetails !== false, // Default true
        offerActions: config.offerActions || ['retry', 'view_logs', 'contact_support']
      }
    };
    
    // Recovery state tracking
    this.recoveryState = {
      activeRetries: new Map(), // operationId -> retry state
      failedOperations: new Map(), // operationId -> error details
      degradationMode: null, // null | 'connection_lost' | 'sync_failed' | 'render_error'
      lastRecoveryAttempt: null
    };
    
    // Event listeners
    this.listeners = {
      error: [],
      recovery: [],
      degradation: []
    };
    
    // Statistics
    this.stats = {
      totalErrors: 0,
      retriedErrors: 0,
      recoveredErrors: 0,
      failedRecoveries: 0,
      degradationActivations: 0
    };
  }

  /**
   * Handle an error with automatic recovery
   * @param {Error} error - The error that occurred
   * @param {Object} context - Context about where the error occurred
   * @returns {Promise<boolean>} - True if recovered, false otherwise
   */
  async handleError(error, context = {}) {
    this.stats.totalErrors++;
    
    // Classify error
    const errorType = this.classifyError(error);
    const isRetryable = RETRYABLE_ERRORS.includes(errorType);
    
    // Log error
    console.error(`[ErrorRecovery] Error occurred:`, {
      type: errorType,
      message: error.message,
      context,
      retryable: isRetryable
    });
    
    // Emit error event
    this.emitError({
      error,
      errorType,
      context,
      retryable: isRetryable,
      timestamp: Date.now()
    });
    
    // Attempt recovery if retryable
    if (isRetryable && this.config.autoRetry.enabled) {
      return await this.attemptRecovery(error, errorType, context);
    }
    
    // Non-retryable error - apply degradation
    this.applyDegradation(errorType, context);
    
    // Notify user
    this.notifyUser(error, errorType, context, false);
    
    return false;
  }

  /**
   * Classify error type
   * @param {Error} error - The error to classify
   * @returns {string} - Error type
   */
  classifyError(error) {
    const message = error.message?.toLowerCase() || '';
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || error.name === 'NetworkError') {
      return 'network_error';
    }
    
    // Timeout errors
    if (message.includes('timeout') || error.name === 'TimeoutError') {
      return 'timeout';
    }
    
    // Rate limit errors
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'rate_limit';
    }
    
    // Server errors (5xx)
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return 'server_error_5xx';
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'authentication_error';
    }
    
    // Authorization errors
    if (message.includes('forbidden') || message.includes('403')) {
      return 'authorization_error';
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('400')) {
      return 'validation_error';
    }
    
    // Not found errors
    if (message.includes('not found') || message.includes('404')) {
      return 'not_found';
    }
    
    // Connection lost
    if (message.includes('connection') && message.includes('lost')) {
      return 'connection_lost';
    }
    
    // Default to generic error
    return 'unknown_error';
  }

  /**
   * Attempt automatic recovery with exponential backoff
   * @param {Error} error - The error to recover from
   * @param {string} errorType - Classified error type
   * @param {Object} context - Error context
   * @returns {Promise<boolean>} - True if recovered, false otherwise
   */
  async attemptRecovery(error, errorType, context) {
    const operationId = context.operationId || `op-${Date.now()}`;
    
    // Check if already retrying this operation
    if (this.recoveryState.activeRetries.has(operationId)) {
      const retryState = this.recoveryState.activeRetries.get(operationId);
      
      // Check if max attempts reached
      if (retryState.attempts >= this.config.autoRetry.maxAttempts) {
        console.warn(`[ErrorRecovery] Max retry attempts (${this.config.autoRetry.maxAttempts}) reached for operation ${operationId}`);
        this.recoveryState.activeRetries.delete(operationId);
        this.recoveryState.failedOperations.set(operationId, {
          error,
          errorType,
          context,
          attempts: retryState.attempts,
          timestamp: Date.now()
        });
        this.stats.failedRecoveries++;
        
        // Apply degradation
        this.applyDegradation(errorType, context);
        
        // Notify user
        this.notifyUser(error, errorType, context, false);
        
        return false;
      }
      
      // Increment attempt count
      retryState.attempts++;
    } else {
      // Initialize retry state
      this.recoveryState.activeRetries.set(operationId, {
        attempts: 1,
        startTime: Date.now(),
        error,
        errorType,
        context
      });
    }
    
    const retryState = this.recoveryState.activeRetries.get(operationId);
    this.stats.retriedErrors++;
    
    // Calculate backoff delay
    const delay = this.calculateBackoffDelay(retryState.attempts);
    
    console.log(`[ErrorRecovery] Retrying operation ${operationId} (attempt ${retryState.attempts}/${this.config.autoRetry.maxAttempts}) after ${delay}ms`);
    
    // Wait for backoff delay
    await this.sleep(delay);
    
    try {
      // Attempt to retry the operation
      if (context.retryFunction && typeof context.retryFunction === 'function') {
        await context.retryFunction();
        
        // Success - recovery complete
        console.log(`[ErrorRecovery] Successfully recovered operation ${operationId}`);
        this.recoveryState.activeRetries.delete(operationId);
        this.stats.recoveredErrors++;
        
        // Emit recovery event
        this.emitRecovery({
          operationId,
          attempts: retryState.attempts,
          duration: Date.now() - retryState.startTime,
          timestamp: Date.now()
        });
        
        // Notify user of recovery
        this.notifyUser(error, errorType, context, true);
        
        return true;
      } else {
        console.warn(`[ErrorRecovery] No retry function provided for operation ${operationId}`);
        this.recoveryState.activeRetries.delete(operationId);
        return false;
      }
    } catch (retryError) {
      // Retry failed - will attempt again if under max attempts
      console.error(`[ErrorRecovery] Retry attempt ${retryState.attempts} failed for operation ${operationId}:`, retryError);
      
      // Recursively attempt recovery
      return await this.attemptRecovery(retryError, errorType, context);
    }
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} attempt - Current attempt number (1-indexed)
   * @returns {number} - Delay in milliseconds
   */
  calculateBackoffDelay(attempt) {
    if (this.config.autoRetry.backoff === 'exponential') {
      // Exponential backoff: baseDelay * 2^(attempt-1)
      const delay = this.config.autoRetry.baseDelayMs * Math.pow(2, attempt - 1);
      
      // Cap at max delay
      return Math.min(delay, this.config.autoRetry.maxDelayMs);
    } else if (this.config.autoRetry.backoff === 'linear') {
      // Linear backoff: baseDelay * attempt
      const delay = this.config.autoRetry.baseDelayMs * attempt;
      return Math.min(delay, this.config.autoRetry.maxDelayMs);
    } else {
      // Fixed backoff
      return this.config.autoRetry.baseDelayMs;
    }
  }

  /**
   * Apply graceful degradation strategy
   * @param {string} errorType - Type of error
   * @param {Object} context - Error context
   */
  applyDegradation(errorType, context) {
    let degradationMode = null;
    
    // Determine degradation mode based on error type
    if (errorType === 'connection_lost' || errorType === 'network_error') {
      degradationMode = 'connection_lost';
    } else if (errorType === 'timeout' || errorType === 'server_error_5xx') {
      degradationMode = 'sync_failed';
    } else if (errorType === 'render_error') {
      degradationMode = 'render_error';
    }
    
    if (!degradationMode) {
      return; // No degradation needed
    }
    
    // Check if already in this degradation mode
    if (this.recoveryState.degradationMode === degradationMode) {
      return;
    }
    
    console.warn(`[ErrorRecovery] Applying degradation mode: ${degradationMode}`);
    this.recoveryState.degradationMode = degradationMode;
    this.stats.degradationActivations++;
    
    // Emit degradation event
    this.emitDegradation({
      mode: degradationMode,
      strategy: this.config.degradation[degradationMode],
      context,
      timestamp: Date.now()
    });
    
    // Apply strategy based on degradation mode
    switch (degradationMode) {
      case 'connection_lost':
        // Pause animations, show last known state
        console.log('[ErrorRecovery] Strategy: pause_animations_show_last_known_state');
        // Emit event for game systems to handle
        window.dispatchEvent(new CustomEvent('game:degradation', {
          detail: { mode: 'connection_lost', action: 'pause_animations' }
        }));
        break;
        
      case 'sync_failed':
        // Continue with cached state
        console.log('[ErrorRecovery] Strategy: continue_with_cached_state');
        window.dispatchEvent(new CustomEvent('game:degradation', {
          detail: { mode: 'sync_failed', action: 'use_cached_state' }
        }));
        break;
        
      case 'render_error':
        // Fallback to traditional UI
        console.log('[ErrorRecovery] Strategy: fallback_to_traditional_ui');
        window.dispatchEvent(new CustomEvent('game:degradation', {
          detail: { mode: 'render_error', action: 'fallback_to_traditional' }
        }));
        break;
    }
  }

  /**
   * Clear degradation mode (recovery successful)
   */
  clearDegradation() {
    if (this.recoveryState.degradationMode) {
      console.log(`[ErrorRecovery] Clearing degradation mode: ${this.recoveryState.degradationMode}`);
      
      // Emit event to resume normal operation
      window.dispatchEvent(new CustomEvent('game:degradation', {
        detail: { mode: null, action: 'resume_normal' }
      }));
      
      this.recoveryState.degradationMode = null;
    }
  }

  /**
   * Notify user about error and recovery status
   * @param {Error} error - The error
   * @param {string} errorType - Error type
   * @param {Object} context - Error context
   * @param {boolean} recovered - Whether error was recovered
   */
  notifyUser(error, errorType, context, recovered) {
    if (!this.config.userNotification.showErrorToast) {
      return;
    }
    
    // Emit notification event for UI to handle
    const notification = {
      type: recovered ? 'success' : 'error',
      title: recovered ? 'Connection Restored' : 'Connection Error',
      message: recovered 
        ? 'Successfully reconnected to the server.'
        : this.getUserFriendlyMessage(errorType),
      details: this.config.userNotification.provideDetails ? error.message : null,
      actions: recovered ? [] : this.config.userNotification.offerActions,
      context,
      timestamp: Date.now()
    };
    
    window.dispatchEvent(new CustomEvent('game:errorNotification', {
      detail: notification
    }));
  }

  /**
   * Get user-friendly error message
   * @param {string} errorType - Error type
   * @returns {string} - User-friendly message
   */
  getUserFriendlyMessage(errorType) {
    const messages = {
      network_error: 'Unable to connect to the server. Retrying...',
      timeout: 'Request timed out. Retrying...',
      rate_limit: 'Too many requests. Please wait a moment.',
      server_error_5xx: 'Server error occurred. Retrying...',
      connection_lost: 'Connection lost. Attempting to reconnect...',
      authentication_error: 'Authentication failed. Please log in again.',
      authorization_error: 'You do not have permission to perform this action.',
      validation_error: 'Invalid data provided.',
      not_found: 'Requested resource not found.',
      unknown_error: 'An unexpected error occurred.'
    };
    
    return messages[errorType] || messages.unknown_error;
  }

  /**
   * Manual retry for failed operation
   * @param {string} operationId - Operation ID to retry
   * @returns {Promise<boolean>} - True if retry initiated, false otherwise
   */
  async manualRetry(operationId) {
    const failedOp = this.recoveryState.failedOperations.get(operationId);
    
    if (!failedOp) {
      console.warn(`[ErrorRecovery] No failed operation found with ID: ${operationId}`);
      return false;
    }
    
    console.log(`[ErrorRecovery] Manual retry initiated for operation ${operationId}`);
    
    // Remove from failed operations
    this.recoveryState.failedOperations.delete(operationId);
    
    // Reset retry state
    this.recoveryState.activeRetries.delete(operationId);
    
    // Attempt recovery
    return await this.attemptRecovery(
      failedOp.error,
      failedOp.errorType,
      failedOp.context
    );
  }

  /**
   * Get current recovery state
   * @returns {Object} - Recovery state
   */
  getRecoveryState() {
    return {
      activeRetries: Array.from(this.recoveryState.activeRetries.entries()).map(([id, state]) => ({
        operationId: id,
        attempts: state.attempts,
        errorType: state.errorType,
        duration: Date.now() - state.startTime
      })),
      failedOperations: Array.from(this.recoveryState.failedOperations.entries()).map(([id, state]) => ({
        operationId: id,
        errorType: state.errorType,
        attempts: state.attempts,
        timestamp: state.timestamp
      })),
      degradationMode: this.recoveryState.degradationMode,
      stats: { ...this.stats }
    };
  }

  /**
   * Subscribe to error events
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onError(callback) {
    this.listeners.error.push(callback);
    return () => {
      this.listeners.error = this.listeners.error.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to recovery events
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onRecovery(callback) {
    this.listeners.recovery.push(callback);
    return () => {
      this.listeners.recovery = this.listeners.recovery.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to degradation events
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  onDegradation(callback) {
    this.listeners.degradation.push(callback);
    return () => {
      this.listeners.degradation = this.listeners.degradation.filter(cb => cb !== callback);
    };
  }

  /**
   * Emit error event
   * @param {Object} data - Event data
   */
  emitError(data) {
    this.listeners.error.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[ErrorRecovery] Error in error event listener:', error);
      }
    });
  }

  /**
   * Emit recovery event
   * @param {Object} data - Event data
   */
  emitRecovery(data) {
    this.listeners.recovery.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[ErrorRecovery] Error in recovery event listener:', error);
      }
    });
  }

  /**
   * Emit degradation event
   * @param {Object} data - Event data
   */
  emitDegradation(data) {
    this.listeners.degradation.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[ErrorRecovery] Error in degradation event listener:', error);
      }
    });
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset recovery system
   */
  reset() {
    this.recoveryState.activeRetries.clear();
    this.recoveryState.failedOperations.clear();
    this.recoveryState.degradationMode = null;
    this.recoveryState.lastRecoveryAttempt = null;
    
    this.stats = {
      totalErrors: 0,
      retriedErrors: 0,
      recoveredErrors: 0,
      failedRecoveries: 0,
      degradationActivations: 0
    };
  }

  /**
   * Destroy recovery system
   */
  destroy() {
    this.reset();
    this.listeners.error = [];
    this.listeners.recovery = [];
    this.listeners.degradation = [];
  }
}

export default ErrorRecoverySystem;
