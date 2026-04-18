/**
 * LODSystem Class - Level of Detail system based on camera zoom
 * 
 * Implements:
 * - Zoom-based detail level detection
 * - Animation quality adjustment based on LOD
 * - Performance optimization through reduced detail at distance
 * - Smooth transitions between LOD levels
 * 
 * LOD Levels:
 * - High (zoom > 1.5): Full animations, all effects
 * - Medium (zoom 1.0-1.5): Simplified animations, reduced effects
 * - Low (zoom < 1.0): Static sprites, minimal effects
 * 
 * Requirements: 9.6
 * Phase 9, Task 55
 */

/**
 * LODSystem - Manages level of detail based on camera zoom
 */
class LODSystem {
  constructor(scene, entityRegistry) {
    this.scene = scene;
    this.entityRegistry = entityRegistry;
    
    // LOD levels configuration
    this.lodLevels = {
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    };
    
    // Zoom thresholds for LOD levels
    this.zoomThresholds = {
      high: 1.5,    // zoom > 1.5 = high detail
      medium: 1.0   // zoom 1.0-1.5 = medium detail, < 1.0 = low detail
    };
    
    // Current LOD level
    this.currentLOD = this.lodLevels.HIGH;
    
    // Forced LOD level (for accessibility)
    this.forcedLOD = null;
    
    // LOD settings per level
    this.lodSettings = {
      [this.lodLevels.HIGH]: {
        animationQuality: 1.0,      // Full animation speed
        particleCount: 1.0,          // Full particle count
        updateFrequency: 1,          // Update every frame
        enableShadows: true,
        enableGlow: true,
        enableParticles: true
      },
      [this.lodLevels.MEDIUM]: {
        animationQuality: 0.7,       // 70% animation speed (simplified)
        particleCount: 0.5,          // 50% particle count
        updateFrequency: 2,          // Update every 2 frames
        enableShadows: false,
        enableGlow: true,
        enableParticles: true
      },
      [this.lodLevels.LOW]: {
        animationQuality: 0.0,       // No animations (static sprites)
        particleCount: 0.2,          // 20% particle count
        updateFrequency: 3,          // Update every 3 frames
        enableShadows: false,
        enableGlow: false,
        enableParticles: false
      }
    };
    
    // Frame counter for update frequency
    this.frameCounter = 0;
    
    // Transition smoothing
    this.transitionDuration = 300; // ms
    this.isTransitioning = false;
    this.transitionStartTime = 0;
  }
  
  /**
   * Determine LOD level based on camera zoom
   * @param {number} zoom - Current camera zoom level
   * @returns {string} LOD level (high, medium, low)
   */
  determineLODLevel(zoom) {
    if (zoom > this.zoomThresholds.high) {
      return this.lodLevels.HIGH;
    } else if (zoom >= this.zoomThresholds.medium) {
      return this.lodLevels.MEDIUM;
    } else {
      return this.lodLevels.LOW;
    }
  }
  
  /**
   * Get current LOD level
   * @returns {string} Current LOD level
   */
  getCurrentLOD() {
    return this.currentLOD;
  }
  
  /**
   * Get LOD settings for current level
   * @returns {object} LOD settings
   */
  getCurrentSettings() {
    return this.lodSettings[this.currentLOD];
  }
  
  /**
   * Get LOD settings for specific level
   * @param {string} level - LOD level
   * @returns {object} LOD settings
   */
  getSettingsForLevel(level) {
    return this.lodSettings[level] || this.lodSettings[this.lodLevels.HIGH];
  }
  
  /**
   * Apply LOD settings to animation system
   * @param {object} settings - LOD settings
   */
  applyAnimationSettings(settings) {
    const animationSystem = this.scene.getAnimationSystem();
    
    if (!animationSystem) {
      return;
    }
    
    // Get all entities with animations
    const entities = this.entityRegistry.getAllEntities();
    
    entities.forEach(entity => {
      const animComponent = entity.getComponent('animation');
      
      if (!animComponent || !animComponent.currentAnimation) {
        return;
      }
      
      // Adjust animation speed based on LOD
      if (settings.animationQuality === 0.0) {
        // Low LOD: pause animations (static sprites)
        animationSystem.pauseAnimation(entity.id);
      } else {
        // High/Medium LOD: adjust animation speed
        const playingAnim = animationSystem.playingAnimations.get(entity.id);
        
        if (playingAnim) {
          if (playingAnim.paused && settings.animationQuality > 0.0) {
            // Resume if was paused
            animationSystem.resumeAnimation(entity.id);
          }
          
          // Adjust speed
          playingAnim.speed = settings.animationQuality;
        }
      }
    });
  }
  
  /**
   * Apply LOD settings to particle system
   * @param {object} settings - LOD settings
   */
  applyParticleSettings(settings) {
    const particleSystem = this.scene.getParticleSystem();
    
    if (!particleSystem) {
      return;
    }
    
    // Adjust particle count multiplier
    particleSystem.lodMultiplier = settings.particleCount;
    
    // Enable/disable particles
    particleSystem.enabled = settings.enableParticles;
  }
  
  /**
   * Apply LOD settings to visual effects
   * @param {object} settings - LOD settings
   */
  applyVisualEffects(settings) {
    const taskWorkflowVisuals = this.scene.taskWorkflowVisuals;
    
    if (!taskWorkflowVisuals) {
      return;
    }
    
    // Adjust visual effects based on LOD
    taskWorkflowVisuals.lodSettings = {
      enableGlow: settings.enableGlow,
      enableShadows: settings.enableShadows
    };
  }
  
  /**
   * Transition to new LOD level
   * @param {string} newLOD - New LOD level
   */
  transitionToLOD(newLOD) {
    if (newLOD === this.currentLOD) {
      return;
    }
    
    const oldLOD = this.currentLOD;
    this.currentLOD = newLOD;
    
    // Start transition
    this.isTransitioning = true;
    this.transitionStartTime = Date.now();
    
    // Get new settings
    const newSettings = this.lodSettings[newLOD];
    
    // Apply settings immediately
    this.applyAnimationSettings(newSettings);
    this.applyParticleSettings(newSettings);
    this.applyVisualEffects(newSettings);
    
    // Emit LOD change event
    window.dispatchEvent(new CustomEvent('game:lodChanged', {
      detail: {
        oldLOD,
        newLOD,
        settings: newSettings
      }
    }));
    
    // Log LOD change
    console.log(`LOD changed: ${oldLOD} → ${newLOD}`);
  }
  
  /**
   * Check if should update based on LOD frequency
   * @returns {boolean} True if should update this frame
   */
  shouldUpdateThisFrame() {
    const settings = this.getCurrentSettings();
    return this.frameCounter % settings.updateFrequency === 0;
  }
  
  /**
   * Update LOD system
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    // Increment frame counter
    this.frameCounter++;
    
    // If forced LOD is set, skip automatic LOD determination
    if (this.forcedLOD !== null) {
      // Ensure we're at the forced LOD level
      if (this.currentLOD !== this.forcedLOD) {
        this.transitionToLOD(this.forcedLOD);
      }
      return;
    }
    
    // Get current camera zoom
    const cameraState = this.scene.getCameraState();
    const currentZoom = cameraState.zoom;
    
    // Determine appropriate LOD level
    const targetLOD = this.determineLODLevel(currentZoom);
    
    // Transition if LOD changed
    if (targetLOD !== this.currentLOD) {
      this.transitionToLOD(targetLOD);
    }
    
    // Update transition state
    if (this.isTransitioning) {
      const elapsed = Date.now() - this.transitionStartTime;
      
      if (elapsed >= this.transitionDuration) {
        this.isTransitioning = false;
      }
    }
  }
  
  /**
   * Force specific LOD level (for testing or user preference)
   * @param {string} level - LOD level to force
   */
  forceLOD(level) {
    if (!this.lodSettings[level]) {
      console.warn(`Invalid LOD level: ${level}`);
      return;
    }
    
    this.transitionToLOD(level);
  }
  
  /**
   * Reset LOD system to automatic mode
   */
  resetToAutomatic() {
    // LOD will be determined by camera zoom on next update
    console.log('LOD system reset to automatic mode');
  }
  
  /**
   * Get LOD statistics
   * @returns {object} LOD statistics
   */
  getStatistics() {
    const cameraState = this.scene.getCameraState();
    const settings = this.getCurrentSettings();
    
    return {
      currentLOD: this.currentLOD,
      currentZoom: cameraState.zoom,
      animationQuality: settings.animationQuality,
      particleCount: settings.particleCount,
      updateFrequency: settings.updateFrequency,
      isTransitioning: this.isTransitioning
    };
  }
  
  /**
   * Destroy LOD system
   */
  destroy() {
    // Reset to high LOD before destroying
    this.transitionToLOD(this.lodLevels.HIGH);
    
    // Clear references
    this.scene = null;
    this.entityRegistry = null;
  }
  
  /**
   * Force a specific LOD level (for accessibility)
   * @param {string|null} lodLevel - LOD level to force, or null to disable forcing
   */
  setForcedLOD(lodLevel) {
    if (lodLevel !== null && !Object.values(this.lodLevels).includes(lodLevel)) {
      console.warn(`Invalid LOD level: ${lodLevel}`);
      return;
    }
    
    this.forcedLOD = lodLevel;
    
    // Apply forced LOD immediately
    if (lodLevel !== null) {
      this.transitionToLOD(lodLevel);
    }
  }
  
  /**
   * Get forced LOD level
   * @returns {string|null} Forced LOD level or null
   */
  getForcedLOD() {
    return this.forcedLOD;
  }
}

export default LODSystem;
