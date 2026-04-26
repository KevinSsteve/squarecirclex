/**
 * LightingSystem Class - Manages ambient lighting and time-of-day effects
 * 
 * Implements:
 * - Ambient color overlay for atmosphere
 * - Time-of-day presets (morning, afternoon, evening, night)
 * - Smooth transitions between lighting states
 * - Performance-optimized rendering
 * 
 * Requirements: 4.1, 4.2
 * Phase 4, Task 4.1
 * 
 * Features:
 * - Pre-baked lighting in sprites (no dynamic lighting)
 * - Color overlay for time-of-day effects
 * - Smooth interpolation between states
 * - Minimal performance impact
 */

import * as PIXI from 'pixi.js';

/**
 * Time-of-day presets
 */
export const TimeOfDay = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night'
};

/**
 * Lighting presets with color and alpha values
 */
const LIGHTING_PRESETS = {
  [TimeOfDay.MORNING]: {
    color: 0xFFE4B5,  // Moccasin - warm morning light
    alpha: 0.15,
    name: 'Morning'
  },
  [TimeOfDay.AFTERNOON]: {
    color: 0xFFFFFF,  // White - neutral daylight
    alpha: 0.0,       // No overlay for normal lighting
    name: 'Afternoon'
  },
  [TimeOfDay.EVENING]: {
    color: 0xFFB347,  // Pastel orange - warm evening light
    alpha: 0.25,
    name: 'Evening'
  },
  [TimeOfDay.NIGHT]: {
    color: 0x191970,  // Midnight blue - cool night light
    alpha: 0.4,
    name: 'Night'
  }
};

/**
 * LightingSystem - Manages ambient lighting effects
 */
class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    
    // Current lighting state
    this.currentTimeOfDay = TimeOfDay.AFTERNOON;
    this.targetTimeOfDay = TimeOfDay.AFTERNOON;
    
    // Transition state
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.transitionDuration = 2000; // 2 seconds default
    this.transitionStartTime = 0;
    
    // Lighting overlay sprite
    this.lightingOverlay = null;
    
    // Current lighting values (for interpolation)
    this.currentColor = LIGHTING_PRESETS[TimeOfDay.AFTERNOON].color;
    this.currentAlpha = LIGHTING_PRESETS[TimeOfDay.AFTERNOON].alpha;
    
    // Enabled state
    this.enabled = true;
    
    // Initialize lighting overlay
    this.initializeLightingOverlay();
  }
  
  /**
   * Initialize the lighting overlay sprite
   * @private
   */
  initializeLightingOverlay() {
    // Create a full-screen rectangle for the lighting overlay
    const graphics = new PIXI.Graphics();
    graphics.rect(0, 0, this.scene.app.screen.width, this.scene.app.screen.height);
    graphics.fill(0xFFFFFF);
    
    // Convert to texture
    const texture = this.scene.app.renderer.generateTexture(graphics);
    
    // Create sprite from texture
    this.lightingOverlay = new PIXI.Sprite(texture);
    this.lightingOverlay.alpha = 0;
    this.lightingOverlay.tint = 0xFFFFFF;
    
    // Set blend mode for overlay effect
    this.lightingOverlay.blendMode = 'multiply';
    
    // Add to scene (should be on top of everything except UI)
    if (this.scene.layers && this.scene.layers.effects) {
      this.scene.layers.effects.addChild(this.lightingOverlay);
    } else {
      this.scene.container.addChild(this.lightingOverlay);
    }
    
    // Update size on resize
    this.scene.app.renderer.on('resize', () => {
      this.updateOverlaySize();
    });
  }
  
  /**
   * Update overlay size to match screen
   * @private
   */
  updateOverlaySize() {
    if (!this.lightingOverlay) {
      return;
    }
    
    this.lightingOverlay.width = this.scene.app.screen.width;
    this.lightingOverlay.height = this.scene.app.screen.height;
  }
  
  /**
   * Set time of day with optional transition
   * @param {string} timeOfDay - Time of day (from TimeOfDay enum)
   * @param {number} transitionDuration - Transition duration in milliseconds (0 for instant)
   * @returns {boolean} True if successful
   */
  setTimeOfDay(timeOfDay, transitionDuration = 2000) {
    // Validate time of day
    if (!Object.values(TimeOfDay).includes(timeOfDay)) {
      console.warn(`Invalid time of day: ${timeOfDay}`);
      return false;
    }
    
    // If already at target, do nothing
    if (timeOfDay === this.currentTimeOfDay && !this.isTransitioning) {
      return true;
    }
    
    // Set target
    this.targetTimeOfDay = timeOfDay;
    
    // Instant transition
    if (transitionDuration === 0) {
      this.applyLightingPreset(timeOfDay);
      this.currentTimeOfDay = timeOfDay;
      this.isTransitioning = false;
      return true;
    }
    
    // Start transition
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.transitionDuration = transitionDuration;
    this.transitionStartTime = Date.now();
    
    return true;
  }
  
  /**
   * Apply lighting preset immediately
   * @param {string} timeOfDay - Time of day
   * @private
   */
  applyLightingPreset(timeOfDay) {
    const preset = LIGHTING_PRESETS[timeOfDay];
    
    if (!preset) {
      return;
    }
    
    this.currentColor = preset.color;
    this.currentAlpha = preset.alpha;
    
    if (this.lightingOverlay) {
      this.lightingOverlay.tint = preset.color;
      this.lightingOverlay.alpha = preset.alpha;
    }
  }
  
  /**
   * Get current time of day
   * @returns {string} Current time of day
   */
  getTimeOfDay() {
    return this.currentTimeOfDay;
  }
  
  /**
   * Get target time of day (during transition)
   * @returns {string} Target time of day
   */
  getTargetTimeOfDay() {
    return this.targetTimeOfDay;
  }
  
  /**
   * Check if currently transitioning
   * @returns {boolean} True if transitioning
   */
  isTransitioningLighting() {
    return this.isTransitioning;
  }
  
  /**
   * Get transition progress (0-1)
   * @returns {number} Progress from 0 to 1
   */
  getTransitionProgress() {
    return this.transitionProgress;
  }
  
  /**
   * Get lighting preset by name
   * @param {string} timeOfDay - Time of day
   * @returns {object|null} Lighting preset or null
   */
  getLightingPreset(timeOfDay) {
    return LIGHTING_PRESETS[timeOfDay] || null;
  }
  
  /**
   * Get all available time-of-day options
   * @returns {string[]} Array of time-of-day strings
   */
  getAvailableTimesOfDay() {
    return Object.values(TimeOfDay);
  }
  
  /**
   * Set transition duration
   * @param {number} duration - Duration in milliseconds
   */
  setTransitionDuration(duration) {
    this.transitionDuration = Math.max(0, duration);
  }
  
  /**
   * Get transition duration
   * @returns {number} Duration in milliseconds
   */
  getTransitionDuration() {
    return this.transitionDuration;
  }
  
  /**
   * Enable or disable lighting system
   * @param {boolean} enabled - Whether to enable lighting
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (this.lightingOverlay) {
      this.lightingOverlay.visible = enabled;
    }
  }
  
  /**
   * Check if lighting system is enabled
   * @returns {boolean} True if enabled
   */
  isEnabled() {
    return this.enabled;
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
    // Extract RGB components
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;
    
    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;
    
    // Interpolate each component
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    // Combine back to hex
    return (r << 16) | (g << 8) | b;
  }
  
  /**
   * Easing function for smooth transitions
   * @param {number} t - Progress (0-1)
   * @returns {number} Eased progress (0-1)
   * @private
   */
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Update lighting system
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    if (!this.enabled || !this.lightingOverlay) {
      return;
    }
    
    // Update transition
    if (this.isTransitioning) {
      const elapsed = Date.now() - this.transitionStartTime;
      this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1.0);
      
      // Apply easing
      const easedProgress = this.easeInOutCubic(this.transitionProgress);
      
      // Get source and target presets
      const sourcePreset = LIGHTING_PRESETS[this.currentTimeOfDay];
      const targetPreset = LIGHTING_PRESETS[this.targetTimeOfDay];
      
      // Interpolate color
      this.currentColor = this.interpolateColor(
        sourcePreset.color,
        targetPreset.color,
        easedProgress
      );
      
      // Interpolate alpha
      this.currentAlpha = sourcePreset.alpha + 
        (targetPreset.alpha - sourcePreset.alpha) * easedProgress;
      
      // Apply to overlay
      this.lightingOverlay.tint = this.currentColor;
      this.lightingOverlay.alpha = this.currentAlpha;
      
      // Check if transition complete
      if (this.transitionProgress >= 1.0) {
        this.isTransitioning = false;
        this.currentTimeOfDay = this.targetTimeOfDay;
      }
    }
  }
  
  /**
   * Reset lighting to default (afternoon)
   */
  reset() {
    this.setTimeOfDay(TimeOfDay.AFTERNOON, 0);
  }
  
  /**
   * Get current lighting state
   * @returns {object} Current lighting state
   */
  getState() {
    return {
      currentTimeOfDay: this.currentTimeOfDay,
      targetTimeOfDay: this.targetTimeOfDay,
      isTransitioning: this.isTransitioning,
      transitionProgress: this.transitionProgress,
      currentColor: this.currentColor,
      currentAlpha: this.currentAlpha,
      enabled: this.enabled
    };
  }
  
  /**
   * Cleanup lighting system
   */
  destroy() {
    if (this.lightingOverlay) {
      this.lightingOverlay.destroy();
      this.lightingOverlay = null;
    }
  }
}

export default LightingSystem;
