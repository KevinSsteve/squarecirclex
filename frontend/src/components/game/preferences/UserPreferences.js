/**
 * UserPreferences System
 * 
 * Manages user preferences and persists them to localStorage.
 * 
 * Features:
 * - Camera position and zoom persistence
 * - Panel layout preferences
 * - Performance mode toggle
 * - Theme preference
 * - Auto-save on change
 * - Default values for first-time users
 * 
 * Phase 10, Task 63
 * Requirements: 12.3, 12.4
 */

class UserPreferences {
  constructor() {
    // Storage key
    this.storageKey = 'experta-game-layer-preferences';
    
    // Default preferences
    this.defaults = {
      camera: {
        x: null, // null means use default from Scene
        y: null,
        zoom: 1.0
      },
      panels: {
        leftSidebar: {
          visible: true,
          width: 280
        },
        rightSidebar: {
          visible: true,
          width: 320
        },
        agentList: {
          expanded: true
        },
        taskQueue: {
          expanded: true
        }
      },
      performance: {
        mode: 'auto', // 'auto', 'high', 'medium', 'low', 'performance'
        autoQualityEnabled: true
      },
      theme: {
        mode: 'system', // 'light', 'dark', 'system'
        current: 'light' // Resolved theme
      },
      accessibility: {
        reducedMotion: false,
        simplifiedView: false,
        keyboardNavigation: true
      },
      debug: {
        overlayEnabled: false,
        boundingBoxesEnabled: false
      }
    };
    
    // Current preferences (loaded from storage or defaults)
    this.preferences = this.load();
    
    // Change listeners
    this.listeners = new Map();
    this.listenerIdCounter = 0;
  }
  
  /**
   * Load preferences from localStorage
   * @returns {object} Loaded preferences
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all keys exist
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    
    // Return defaults if loading failed
    return JSON.parse(JSON.stringify(this.defaults));
  }
  
  /**
   * Save preferences to localStorage
   */
  save() {
    try {
      const serialized = JSON.stringify(this.preferences);
      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return false;
    }
  }

  /**
   * Merge stored preferences with defaults
   * Ensures all keys exist even if storage is outdated
   * @param {object} stored - Stored preferences
   * @returns {object} Merged preferences
   */
  mergeWithDefaults(stored) {
    const merged = JSON.parse(JSON.stringify(this.defaults));
    
    // Deep merge stored values
    this.deepMerge(merged, stored);
    
    return merged;
  }
  
  /**
   * Deep merge two objects
   * @param {object} target - Target object
   * @param {object} source - Source object
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) {
            target[key] = {};
          }
          this.deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }
  
  /**
   * Get all preferences
   * @returns {object} Current preferences
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.preferences));
  }
  
  /**
   * Get a specific preference value
   * @param {string} path - Dot-notation path (e.g., 'camera.zoom')
   * @returns {*} Preference value
   */
  get(path) {
    const keys = path.split('.');
    let value = this.preferences;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  /**
   * Set a specific preference value
   * @param {string} path - Dot-notation path (e.g., 'camera.zoom')
   * @param {*} value - New value
   * @param {boolean} autoSave - Whether to auto-save (default: true)
   */
  set(path, value, autoSave = true) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.preferences;
    
    // Navigate to the parent object
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    // Set the value
    const oldValue = target[lastKey];
    target[lastKey] = value;
    
    // Save if auto-save is enabled
    if (autoSave) {
      this.save();
    }
    
    // Notify listeners
    this.notifyListeners(path, value, oldValue);
  }
  
  /**
   * Update multiple preferences at once
   * @param {object} updates - Object with preference paths and values
   */
  update(updates) {
    for (const [path, value] of Object.entries(updates)) {
      this.set(path, value, false); // Don't save each individually
    }
    
    // Save once after all updates
    this.save();
  }

  /**
   * Camera preferences
   */
  
  /**
   * Save camera position
   * @param {number} x - Camera X position
   * @param {number} y - Camera Y position
   */
  saveCameraPosition(x, y) {
    this.update({
      'camera.x': x,
      'camera.y': y
    });
  }
  
  /**
   * Save camera zoom
   * @param {number} zoom - Camera zoom level
   */
  saveCameraZoom(zoom) {
    this.set('camera.zoom', zoom);
  }
  
  /**
   * Get camera preferences
   * @returns {object} Camera preferences
   */
  getCameraPreferences() {
    return this.get('camera');
  }
  
  /**
   * Reset camera to defaults
   */
  resetCamera() {
    this.update({
      'camera.x': null,
      'camera.y': null,
      'camera.zoom': 1.0
    });
  }
  
  /**
   * Panel preferences
   */
  
  /**
   * Save panel visibility
   * @param {string} panelId - Panel identifier
   * @param {boolean} visible - Visibility state
   */
  savePanelVisibility(panelId, visible) {
    this.set(`panels.${panelId}.visible`, visible);
  }
  
  /**
   * Save panel expanded state
   * @param {string} panelId - Panel identifier
   * @param {boolean} expanded - Expanded state
   */
  savePanelExpanded(panelId, expanded) {
    this.set(`panels.${panelId}.expanded`, expanded);
  }
  
  /**
   * Save panel width
   * @param {string} panelId - Panel identifier
   * @param {number} width - Panel width in pixels
   */
  savePanelWidth(panelId, width) {
    this.set(`panels.${panelId}.width`, width);
  }
  
  /**
   * Get panel preferences
   * @returns {object} Panel preferences
   */
  getPanelPreferences() {
    return this.get('panels');
  }
  
  /**
   * Reset panels to defaults
   */
  resetPanels() {
    this.set('panels', JSON.parse(JSON.stringify(this.defaults.panels)));
  }
  
  /**
   * Performance preferences
   */
  
  /**
   * Set performance mode
   * @param {string} mode - Performance mode ('auto', 'high', 'medium', 'low', 'performance')
   */
  setPerformanceMode(mode) {
    this.set('performance.mode', mode);
  }
  
  /**
   * Toggle auto-quality adjustment
   * @param {boolean} enabled - Whether auto-quality is enabled
   */
  setAutoQuality(enabled) {
    this.set('performance.autoQualityEnabled', enabled);
  }
  
  /**
   * Get performance preferences
   * @returns {object} Performance preferences
   */
  getPerformancePreferences() {
    return this.get('performance');
  }
  
  /**
   * Reset performance to defaults
   */
  resetPerformance() {
    this.set('performance', JSON.parse(JSON.stringify(this.defaults.performance)));
  }

  /**
   * Theme preferences
   */
  
  /**
   * Set theme mode
   * @param {string} mode - Theme mode ('light', 'dark', 'system')
   */
  setThemeMode(mode) {
    this.set('theme.mode', mode);
    
    // Resolve system theme if needed
    if (mode === 'system') {
      const systemTheme = this.getSystemTheme();
      this.set('theme.current', systemTheme, false);
    } else {
      this.set('theme.current', mode, false);
    }
    
    this.save();
  }
  
  /**
   * Get system theme preference
   * @returns {string} 'light' or 'dark'
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  
  /**
   * Get theme preferences
   * @returns {object} Theme preferences
   */
  getThemePreferences() {
    return this.get('theme');
  }
  
  /**
   * Get current resolved theme
   * @returns {string} 'light' or 'dark'
   */
  getCurrentTheme() {
    const mode = this.get('theme.mode');
    
    if (mode === 'system') {
      return this.getSystemTheme();
    }
    
    return mode;
  }
  
  /**
   * Reset theme to defaults
   */
  resetTheme() {
    this.set('theme', JSON.parse(JSON.stringify(this.defaults.theme)));
  }
  
  /**
   * Accessibility preferences
   */
  
  /**
   * Set reduced motion preference
   * @param {boolean} enabled - Whether reduced motion is enabled
   */
  setReducedMotion(enabled) {
    this.set('accessibility.reducedMotion', enabled);
  }
  
  /**
   * Set simplified view preference
   * @param {boolean} enabled - Whether simplified view is enabled
   */
  setSimplifiedView(enabled) {
    this.set('accessibility.simplifiedView', enabled);
  }
  
  /**
   * Set keyboard navigation preference
   * @param {boolean} enabled - Whether keyboard navigation is enabled
   */
  setKeyboardNavigation(enabled) {
    this.set('accessibility.keyboardNavigation', enabled);
  }
  
  /**
   * Get accessibility preferences
   * @returns {object} Accessibility preferences
   */
  getAccessibilityPreferences() {
    return this.get('accessibility');
  }
  
  /**
   * Reset accessibility to defaults
   */
  resetAccessibility() {
    this.set('accessibility', JSON.parse(JSON.stringify(this.defaults.accessibility)));
  }
  
  /**
   * Debug preferences
   */
  
  /**
   * Set debug overlay enabled state
   * @param {boolean} enabled - Whether debug overlay is enabled
   */
  setDebugOverlay(enabled) {
    this.set('debug.overlayEnabled', enabled);
  }
  
  /**
   * Set bounding boxes enabled state
   * @param {boolean} enabled - Whether bounding boxes are enabled
   */
  setBoundingBoxes(enabled) {
    this.set('debug.boundingBoxesEnabled', enabled);
  }
  
  /**
   * Get debug preferences
   * @returns {object} Debug preferences
   */
  getDebugPreferences() {
    return this.get('debug');
  }

  /**
   * Change listeners
   */
  
  /**
   * Add a change listener
   * @param {string} path - Preference path to listen to (or '*' for all)
   * @param {function} callback - Callback function (newValue, oldValue, path)
   * @returns {number} Listener ID (for removal)
   */
  addListener(path, callback) {
    const id = this.listenerIdCounter++;
    
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Map());
    }
    
    this.listeners.get(path).set(id, callback);
    
    return id;
  }
  
  /**
   * Remove a change listener
   * @param {number} listenerId - Listener ID returned from addListener
   */
  removeListener(listenerId) {
    for (const [path, callbacks] of this.listeners.entries()) {
      if (callbacks.has(listenerId)) {
        callbacks.delete(listenerId);
        
        // Clean up empty maps
        if (callbacks.size === 0) {
          this.listeners.delete(path);
        }
        
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Notify listeners of a change
   * @param {string} path - Changed preference path
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
  notifyListeners(path, newValue, oldValue) {
    // Notify specific path listeners
    if (this.listeners.has(path)) {
      for (const callback of this.listeners.get(path).values()) {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          console.error('Error in preference listener:', error);
        }
      }
    }
    
    // Notify wildcard listeners
    if (this.listeners.has('*')) {
      for (const callback of this.listeners.get('*').values()) {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          console.error('Error in preference listener:', error);
        }
      }
    }
  }
  
  /**
   * Utility methods
   */
  
  /**
   * Reset all preferences to defaults
   */
  resetAll() {
    this.preferences = JSON.parse(JSON.stringify(this.defaults));
    this.save();
    
    // Notify all listeners
    this.notifyListeners('*', this.preferences, null);
  }
  
  /**
   * Export preferences as JSON
   * @returns {string} JSON string of preferences
   */
  export() {
    return JSON.stringify(this.preferences, null, 2);
  }
  
  /**
   * Import preferences from JSON
   * @param {string} json - JSON string of preferences
   * @returns {boolean} Success status
   */
  import(json) {
    try {
      const imported = JSON.parse(json);
      this.preferences = this.mergeWithDefaults(imported);
      this.save();
      
      // Notify all listeners
      this.notifyListeners('*', this.preferences, null);
      
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }
  
  /**
   * Clear all stored preferences
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      this.preferences = JSON.parse(JSON.stringify(this.defaults));
      
      // Notify all listeners
      this.notifyListeners('*', this.preferences, null);
      
      return true;
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      return false;
    }
  }
  
  /**
   * Check if preferences are at defaults
   * @returns {boolean} True if all preferences are at default values
   */
  isDefault() {
    return JSON.stringify(this.preferences) === JSON.stringify(this.defaults);
  }
}

// Create singleton instance
const userPreferences = new UserPreferences();

export default userPreferences;
