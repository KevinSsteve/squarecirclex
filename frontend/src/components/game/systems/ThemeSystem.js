/**
 * ThemeSystem - Manages visual themes for the game layer
 * 
 * Provides light, dark, and high-contrast themes with smooth transitions.
 * Persists theme preference to localStorage and syncs with system preference.
 * 
 * Requirements: 10.2, 14.3
 * Phase 8, Task 50
 */

/**
 * Available theme types
 */
export const ThemeType = {
  LIGHT: 'light',
  DARK: 'dark',
  HIGH_CONTRAST: 'high-contrast',
  SYSTEM: 'system' // Follow system preference
};

/**
 * Theme definitions
 */
const THEMES = {
  light: {
    name: 'Light',
    colors: {
      // Background colors
      background: 0xF3F4F6,      // Light gray
      backgroundAlt: 0xE5E7EB,   // Slightly darker gray
      
      // Department colors (lighter versions)
      contentCreation: 0x818CF8,  // Light indigo
      publishing: 0x34D399,       // Light green
      trendAnalysis: 0xFBBF24,    // Light amber
      customerSupport: 0xA78BFA,  // Light purple
      administration: 0x9CA3AF,   // Light gray
      
      // UI colors
      text: 0x1F2937,            // Dark gray text
      textSecondary: 0x6B7280,   // Medium gray text
      border: 0xD1D5DB,          // Light border
      shadow: 0x000000,          // Black shadow (with alpha)
      
      // Status colors
      success: 0x10B981,         // Green
      error: 0xEF4444,           // Red
      warning: 0xF59E0B,         // Amber
      info: 0x3B82F6,            // Blue
      
      // Interactive elements
      hover: 0xDDD6FE,           // Light purple hover
      selected: 0xC7D2FE,        // Light indigo selected
      disabled: 0xE5E7EB         // Light gray disabled
    },
    opacity: {
      shadow: 0.1,
      overlay: 0.3,
      disabled: 0.5
    }
  },
  
  dark: {
    name: 'Dark',
    colors: {
      // Background colors
      background: 0x111827,      // Very dark gray
      backgroundAlt: 0x1F2937,   // Dark gray
      
      // Department colors (darker versions)
      contentCreation: 0x4F46E5,  // Indigo
      publishing: 0x10B981,       // Green
      trendAnalysis: 0xF59E0B,    // Amber
      customerSupport: 0x8B5CF6,  // Purple
      administration: 0x6B7280,   // Gray
      
      // UI colors
      text: 0xF9FAFB,            // Very light gray text
      textSecondary: 0x9CA3AF,   // Medium gray text
      border: 0x374151,          // Dark border
      shadow: 0x000000,          // Black shadow (with alpha)
      
      // Status colors
      success: 0x10B981,         // Green
      error: 0xEF4444,           // Red
      warning: 0xF59E0B,         // Amber
      info: 0x3B82F6,            // Blue
      
      // Interactive elements
      hover: 0x4C1D95,           // Dark purple hover
      selected: 0x3730A3,        // Dark indigo selected
      disabled: 0x374151         // Dark gray disabled
    },
    opacity: {
      shadow: 0.3,
      overlay: 0.5,
      disabled: 0.4
    }
  },
  
  'high-contrast': {
    name: 'High Contrast',
    colors: {
      // Background colors
      background: 0x000000,      // Pure black
      backgroundAlt: 0x1F1F1F,   // Very dark gray
      
      // Department colors (high contrast)
      contentCreation: 0x6366F1,  // Bright indigo
      publishing: 0x22C55E,       // Bright green
      trendAnalysis: 0xFBBF24,    // Bright amber
      customerSupport: 0xA855F7,  // Bright purple
      administration: 0x9CA3AF,   // Bright gray
      
      // UI colors
      text: 0xFFFFFF,            // Pure white text
      textSecondary: 0xD1D5DB,   // Light gray text
      border: 0xFFFFFF,          // White border
      shadow: 0xFFFFFF,          // White shadow (with alpha)
      
      // Status colors (brighter)
      success: 0x22C55E,         // Bright green
      error: 0xF87171,           // Bright red
      warning: 0xFBBF24,         // Bright amber
      info: 0x60A5FA,            // Bright blue
      
      // Interactive elements
      hover: 0x7C3AED,           // Bright purple hover
      selected: 0x6366F1,        // Bright indigo selected
      disabled: 0x4B5563         // Medium gray disabled
    },
    opacity: {
      shadow: 0.5,
      overlay: 0.7,
      disabled: 0.3
    }
  }
};

/**
 * ThemeSystem class
 * Manages theme switching and persistence
 */
class ThemeSystem {
  /**
   * Create a new theme system
   * @param {Scene} scene - Game scene
   */
  constructor(scene) {
    this.scene = scene;
    
    // Current theme
    this.currentTheme = null;
    this.currentThemeType = ThemeType.SYSTEM;
    
    // Theme transition state
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.transitionDuration = 500; // ms
    this.transitionStartTime = 0;
    this.fromTheme = null;
    this.toTheme = null;
    
    // System theme preference listener
    this.systemThemeMediaQuery = null;
    this.systemThemeListener = null;
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize theme system
   * @private
   */
  initialize() {
    // Load saved theme preference
    const savedTheme = this.loadThemePreference();
    
    // Set up system theme detection
    this.setupSystemThemeDetection();
    
    // Apply initial theme
    this.setTheme(savedTheme, false); // No animation on initial load
  }
  
  /**
   * Set up system theme preference detection
   * @private
   */
  setupSystemThemeDetection() {
    // Check if browser supports prefers-color-scheme
    if (window.matchMedia) {
      this.systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Listen for system theme changes
      this.systemThemeListener = (e) => {
        if (this.currentThemeType === ThemeType.SYSTEM) {
          // Re-apply system theme
          this.applySystemTheme(true);
        }
      };
      
      // Modern browsers
      if (this.systemThemeMediaQuery.addEventListener) {
        this.systemThemeMediaQuery.addEventListener('change', this.systemThemeListener);
      }
      // Legacy browsers
      else if (this.systemThemeMediaQuery.addListener) {
        this.systemThemeMediaQuery.addListener(this.systemThemeListener);
      }
    }
  }
  
  /**
   * Get system theme preference
   * @returns {string} 'light' or 'dark'
   * @private
   */
  getSystemTheme() {
    if (this.systemThemeMediaQuery && this.systemThemeMediaQuery.matches) {
      return ThemeType.DARK;
    }
    return ThemeType.LIGHT;
  }
  
  /**
   * Apply system theme
   * @param {boolean} animate - Whether to animate transition
   * @private
   */
  applySystemTheme(animate = true) {
    const systemTheme = this.getSystemTheme();
    this.applyTheme(systemTheme, animate);
  }
  
  /**
   * Set theme
   * @param {string} themeType - Theme type (light, dark, high-contrast, system)
   * @param {boolean} animate - Whether to animate transition (default: true)
   */
  setTheme(themeType, animate = true) {
    // Validate theme type
    if (!Object.values(ThemeType).includes(themeType)) {
      console.warn(`Invalid theme type: ${themeType}, defaulting to system`);
      themeType = ThemeType.SYSTEM;
    }
    
    // Store theme preference
    this.currentThemeType = themeType;
    this.saveThemePreference(themeType);
    
    // Apply theme
    if (themeType === ThemeType.SYSTEM) {
      this.applySystemTheme(animate);
    } else {
      this.applyTheme(themeType, animate);
    }
    
    // Emit theme change event
    window.dispatchEvent(new CustomEvent('game:themeChanged', {
      detail: { themeType, theme: this.currentTheme }
    }));
  }
  
  /**
   * Apply theme
   * @param {string} themeType - Theme type (light, dark, high-contrast)
   * @param {boolean} animate - Whether to animate transition
   * @private
   */
  applyTheme(themeType, animate) {
    const theme = THEMES[themeType];
    
    if (!theme) {
      console.error(`Theme not found: ${themeType}`);
      return;
    }
    
    if (animate && this.currentTheme) {
      // Start transition animation
      this.startThemeTransition(this.currentTheme, theme);
    } else {
      // Apply immediately
      this.currentTheme = theme;
      this.applyThemeToScene(theme);
    }
  }
  
  /**
   * Start theme transition animation
   * @param {object} fromTheme - Starting theme
   * @param {object} toTheme - Target theme
   * @private
   */
  startThemeTransition(fromTheme, toTheme) {
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.transitionStartTime = Date.now();
    this.fromTheme = fromTheme;
    this.toTheme = toTheme;
  }
  
  /**
   * Apply theme to scene
   * @param {object} theme - Theme to apply
   * @private
   */
  applyThemeToScene(theme) {
    // Update scene background color
    if (this.scene.app && this.scene.app.renderer) {
      this.scene.app.renderer.background.color = theme.colors.background;
    }
    
    // Update department colors
    this.updateDepartmentColors(theme);
    
    // Update UI colors (emit event for React components)
    this.updateUIColors(theme);
  }
  
  /**
   * Update department colors
   * @param {object} theme - Theme to apply
   * @private
   */
  updateDepartmentColors(theme) {
    const entityRegistry = this.scene.getEntityRegistry();
    if (!entityRegistry) return;
    
    // Get all department entities
    const departments = entityRegistry.getEntitiesByType?.('department') || [];
    
    for (const department of departments) {
      // Update department background color based on type
      const departmentType = department.departmentType;
      let color;
      
      switch (departmentType) {
        case 'content_creation':
          color = theme.colors.contentCreation;
          break;
        case 'publishing':
          color = theme.colors.publishing;
          break;
        case 'trend_analysis':
          color = theme.colors.trendAnalysis;
          break;
        case 'customer_support':
          color = theme.colors.customerSupport;
          break;
        case 'administration':
          color = theme.colors.administration;
          break;
        default:
          color = theme.colors.backgroundAlt;
      }
      
      // Update sprite tint if department has a sprite
      const sprite = department.getComponent('sprite');
      if (sprite && sprite.sprite) {
        sprite.sprite.tint = color;
      }
    }
  }
  
  /**
   * Update UI colors
   * @param {object} theme - Theme to apply
   * @private
   */
  updateUIColors(theme) {
    // Emit event for React UI components to update
    window.dispatchEvent(new CustomEvent('game:themeColorsUpdated', {
      detail: { colors: theme.colors, opacity: theme.opacity }
    }));
  }
  
  /**
   * Interpolate between two colors
   * @param {number} color1 - Start color (hex)
   * @param {number} color2 - End color (hex)
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated color (hex)
   * @private
   */
  interpolateColor(color1, color2, t) {
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;
    
    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return (r << 16) | (g << 8) | b;
  }
  
  /**
   * Interpolate theme during transition
   * @param {object} fromTheme - Starting theme
   * @param {object} toTheme - Target theme
   * @param {number} progress - Transition progress (0-1)
   * @returns {object} Interpolated theme
   * @private
   */
  interpolateTheme(fromTheme, toTheme, progress) {
    const interpolated = {
      colors: {},
      opacity: {}
    };
    
    // Interpolate colors
    for (const key in fromTheme.colors) {
      interpolated.colors[key] = this.interpolateColor(
        fromTheme.colors[key],
        toTheme.colors[key],
        progress
      );
    }
    
    // Interpolate opacity values
    for (const key in fromTheme.opacity) {
      interpolated.opacity[key] = fromTheme.opacity[key] + 
        (toTheme.opacity[key] - fromTheme.opacity[key]) * progress;
    }
    
    return interpolated;
  }
  
  /**
   * Get current theme
   * @returns {object} Current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  /**
   * Get current theme type
   * @returns {string} Current theme type
   */
  getCurrentThemeType() {
    return this.currentThemeType;
  }
  
  /**
   * Get available themes
   * @returns {string[]} Array of theme types
   */
  getAvailableThemes() {
    return Object.values(ThemeType);
  }
  
  /**
   * Save theme preference to localStorage
   * @param {string} themeType - Theme type to save
   * @private
   */
  saveThemePreference(themeType) {
    try {
      localStorage.setItem('game-layer-theme', themeType);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }
  
  /**
   * Load theme preference from localStorage
   * @returns {string} Saved theme type or default (system)
   * @private
   */
  loadThemePreference() {
    try {
      const saved = localStorage.getItem('game-layer-theme');
      if (saved && Object.values(ThemeType).includes(saved)) {
        return saved;
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
    
    return ThemeType.SYSTEM; // Default to system preference
  }
  
  /**
   * Update theme system
   * Called every frame by Scene
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    // Update theme transition
    if (this.isTransitioning) {
      const elapsed = Date.now() - this.transitionStartTime;
      this.transitionProgress = Math.min(1, elapsed / this.transitionDuration);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - this.transitionProgress, 3);
      
      // Interpolate theme
      const interpolatedTheme = this.interpolateTheme(
        this.fromTheme,
        this.toTheme,
        eased
      );
      
      // Apply interpolated theme
      this.applyThemeToScene(interpolatedTheme);
      
      // Check if transition complete
      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        this.currentTheme = this.toTheme;
        this.fromTheme = null;
        this.toTheme = null;
      }
    }
  }
  
  /**
   * Clean up theme system
   */
  destroy() {
    // Remove system theme listener
    if (this.systemThemeMediaQuery && this.systemThemeListener) {
      if (this.systemThemeMediaQuery.removeEventListener) {
        this.systemThemeMediaQuery.removeEventListener('change', this.systemThemeListener);
      } else if (this.systemThemeMediaQuery.removeListener) {
        this.systemThemeMediaQuery.removeListener(this.systemThemeListener);
      }
    }
    
    this.systemThemeMediaQuery = null;
    this.systemThemeListener = null;
  }
}

export default ThemeSystem;
