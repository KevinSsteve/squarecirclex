/**
 * ViewToggle - Progressive Enhancement Utility
 * 
 * Manages view mode switching between game layer and traditional UI.
 * Provides automatic fallback on load failure and performance mode detection.
 * 
 * Requirements:
 * - 12.1: View toggle between game and traditional dashboard
 * - 12.2: Automatic fallback on load failure
 * - 12.4: Performance mode for low-end devices
 * - 12.5: Desktop and tablet support
 * 
 * Phase 10, Task 64
 */

/**
 * View modes
 */
export const ViewMode = {
  GAME: 'game',
  TRADITIONAL: 'traditional'
};

/**
 * Performance levels
 */
export const PerformanceLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * ViewToggle class
 * Manages view mode state and transitions
 */
class ViewToggle {
  constructor() {
    this.currentView = ViewMode.GAME;
    this.performanceLevel = PerformanceLevel.HIGH;
    this.listeners = new Set();
    this.loadAttempts = 0;
    this.maxLoadAttempts = 3;
    this.loadTimeout = 10000; // 10 seconds
    this.loadTimer = null;
    
    // Load saved preferences
    this.loadPreferences();
    
    // Detect device capabilities
    this.detectPerformanceLevel();
    
    // Check if game view is supported
    this.checkGameSupport();
  }
  
  /**
   * Load saved view preferences from localStorage
   */
  loadPreferences() {
    try {
      const saved = localStorage.getItem('viewToggle');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentView = data.currentView || ViewMode.GAME;
        this.performanceLevel = data.performanceLevel || PerformanceLevel.HIGH;
      }
    } catch (error) {
      console.error('[ViewToggle] Failed to load preferences:', error);
    }
  }
  
  /**
   * Save view preferences to localStorage
   */
  savePreferences() {
    try {
      const data = {
        currentView: this.currentView,
        performanceLevel: this.performanceLevel,
        timestamp: Date.now()
      };
      localStorage.setItem('viewToggle', JSON.stringify(data));
    } catch (error) {
      console.error('[ViewToggle] Failed to save preferences:', error);
    }
  }
  
  /**
   * Detect device performance level
   * Uses hardware concurrency, memory, and device type
   */
  detectPerformanceLevel() {
    // Check if mobile/tablet
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
    
    // Check hardware capabilities
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 4; // GB
    
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const hasWebGL = !!gl;
    
    if (!hasWebGL) {
      this.performanceLevel = PerformanceLevel.LOW;
      console.log('[ViewToggle] WebGL not supported - LOW performance mode');
      return;
    }
    
    // Determine performance level
    if (isMobile && !isTablet) {
      // Mobile phones - always low performance
      this.performanceLevel = PerformanceLevel.LOW;
      console.log('[ViewToggle] Mobile device detected - LOW performance mode');
    } else if (isTablet) {
      // Tablets - medium performance
      this.performanceLevel = PerformanceLevel.MEDIUM;
      console.log('[ViewToggle] Tablet device detected - MEDIUM performance mode');
    } else if (cores >= 4 && memory >= 8) {
      // Desktop with good specs - high performance
      this.performanceLevel = PerformanceLevel.HIGH;
      console.log('[ViewToggle] High-end device detected - HIGH performance mode');
    } else if (cores >= 2 && memory >= 4) {
      // Desktop with medium specs - medium performance
      this.performanceLevel = PerformanceLevel.MEDIUM;
      console.log('[ViewToggle] Mid-range device detected - MEDIUM performance mode');
    } else {
      // Low-end device - low performance
      this.performanceLevel = PerformanceLevel.LOW;
      console.log('[ViewToggle] Low-end device detected - LOW performance mode');
    }
    
    this.savePreferences();
  }
  
  /**
   * Check if game view is supported on this device
   * @returns {boolean} True if game view is supported
   */
  checkGameSupport() {
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const hasWebGL = !!gl;
    
    if (!hasWebGL) {
      console.warn('[ViewToggle] WebGL not supported - game view disabled');
      this.currentView = ViewMode.TRADITIONAL;
      this.savePreferences();
      return false;
    }
    
    // Check if mobile phone (not tablet)
    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
    
    if (isMobile && !isTablet) {
      console.warn('[ViewToggle] Mobile phone detected - game view disabled');
      this.currentView = ViewMode.TRADITIONAL;
      this.savePreferences();
      return false;
    }
    
    return true;
  }
  
  /**
   * Get current view mode
   * @returns {string} Current view mode
   */
  getCurrentView() {
    return this.currentView;
  }
  
  /**
   * Get performance level
   * @returns {string} Performance level
   */
  getPerformanceLevel() {
    return this.performanceLevel;
  }
  
  /**
   * Set view mode
   * @param {string} mode - View mode (game or traditional)
   */
  setView(mode) {
    if (mode !== ViewMode.GAME && mode !== ViewMode.TRADITIONAL) {
      console.error('[ViewToggle] Invalid view mode:', mode);
      return;
    }
    
    // Check if game view is supported
    if (mode === ViewMode.GAME && !this.checkGameSupport()) {
      console.warn('[ViewToggle] Game view not supported - staying in traditional view');
      return;
    }
    
    const previousView = this.currentView;
    this.currentView = mode;
    this.savePreferences();
    
    console.log(`[ViewToggle] View changed: ${previousView} -> ${mode}`);
    
    // Notify listeners
    this.notifyListeners({
      type: 'viewChange',
      previousView,
      currentView: mode
    });
  }
  
  /**
   * Toggle between game and traditional view
   */
  toggleView() {
    const newView = this.currentView === ViewMode.GAME 
      ? ViewMode.TRADITIONAL 
      : ViewMode.GAME;
    this.setView(newView);
  }
  
  /**
   * Set performance level
   * @param {string} level - Performance level
   */
  setPerformanceLevel(level) {
    if (!Object.values(PerformanceLevel).includes(level)) {
      console.error('[ViewToggle] Invalid performance level:', level);
      return;
    }
    
    const previousLevel = this.performanceLevel;
    this.performanceLevel = level;
    this.savePreferences();
    
    console.log(`[ViewToggle] Performance level changed: ${previousLevel} -> ${level}`);
    
    // Notify listeners
    this.notifyListeners({
      type: 'performanceChange',
      previousLevel,
      currentLevel: level
    });
  }
  
  /**
   * Start load timeout
   * Automatically fallback to traditional view if game fails to load
   */
  startLoadTimeout() {
    this.loadAttempts++;
    
    console.log(`[ViewToggle] Starting load timeout (attempt ${this.loadAttempts}/${this.maxLoadAttempts})`);
    
    this.loadTimer = setTimeout(() => {
      console.error('[ViewToggle] Game load timeout - falling back to traditional view');
      this.handleLoadFailure('timeout');
    }, this.loadTimeout);
  }
  
  /**
   * Clear load timeout
   * Call this when game successfully loads
   */
  clearLoadTimeout() {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
      this.loadAttempts = 0;
      console.log('[ViewToggle] Game loaded successfully');
    }
  }
  
  /**
   * Handle load failure
   * Automatically fallback to traditional view
   * @param {string} reason - Failure reason
   */
  handleLoadFailure(reason = 'unknown') {
    console.error(`[ViewToggle] Game load failed (reason: ${reason}, attempt: ${this.loadAttempts})`);
    
    // Clear timeout
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }
    
    // Check if we should retry or fallback
    if (this.loadAttempts >= this.maxLoadAttempts) {
      console.error('[ViewToggle] Max load attempts reached - falling back to traditional view');
      this.setView(ViewMode.TRADITIONAL);
      
      // Notify listeners
      this.notifyListeners({
        type: 'loadFailure',
        reason,
        attempts: this.loadAttempts,
        fallback: true
      });
    } else {
      console.log('[ViewToggle] Retrying game load...');
      
      // Notify listeners
      this.notifyListeners({
        type: 'loadFailure',
        reason,
        attempts: this.loadAttempts,
        fallback: false
      });
    }
  }
  
  /**
   * Check if game view is available
   * @returns {boolean} True if game view is available
   */
  isGameViewAvailable() {
    return this.checkGameSupport();
  }
  
  /**
   * Check if currently in game view
   * @returns {boolean} True if in game view
   */
  isGameView() {
    return this.currentView === ViewMode.GAME;
  }
  
  /**
   * Check if currently in traditional view
   * @returns {boolean} True if in traditional view
   */
  isTraditionalView() {
    return this.currentView === ViewMode.TRADITIONAL;
  }
  
  /**
   * Get performance settings based on current level
   * @returns {Object} Performance settings
   */
  getPerformanceSettings() {
    switch (this.performanceLevel) {
      case PerformanceLevel.HIGH:
        return {
          maxParticles: 100,
          enableShadows: true,
          enableGlow: true,
          enableAnimations: true,
          targetFPS: 60,
          cullingMargin: 100,
          lodEnabled: false,
          batchSize: 1000
        };
        
      case PerformanceLevel.MEDIUM:
        return {
          maxParticles: 50,
          enableShadows: false,
          enableGlow: true,
          enableAnimations: true,
          targetFPS: 30,
          cullingMargin: 50,
          lodEnabled: true,
          batchSize: 500
        };
        
      case PerformanceLevel.LOW:
        return {
          maxParticles: 20,
          enableShadows: false,
          enableGlow: false,
          enableAnimations: false,
          targetFPS: 30,
          cullingMargin: 0,
          lodEnabled: true,
          batchSize: 250
        };
        
      default:
        return this.getPerformanceSettings.call({ performanceLevel: PerformanceLevel.MEDIUM });
    }
  }
  
  /**
   * Add change listener
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    this.listeners.add(callback);
  }
  
  /**
   * Remove change listener
   * @param {Function} callback - Callback function
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }
  
  /**
   * Notify all listeners
   * @param {Object} event - Event data
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[ViewToggle] Listener error:', error);
      }
    });
  }
  
  /**
   * Reset to defaults
   */
  reset() {
    this.currentView = ViewMode.GAME;
    this.loadAttempts = 0;
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }
    this.detectPerformanceLevel();
    this.savePreferences();
  }
  
  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }
    this.listeners.clear();
  }
}

// Create singleton instance
const viewToggle = new ViewToggle();

export default viewToggle;
