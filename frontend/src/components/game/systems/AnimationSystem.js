/**
 * AnimationSystem Class - Handles sprite-based animations for entities
 * 
 * Implements:
 * - Frame-by-frame animation player
 * - Animation state management (play, stop, loop)
 * - Animation registration and definitions
 * - Animation blending for smooth transitions
 * - Sprite sheet support
 * 
 * Requirements: 2.6, 3.4, 3.5
 * Phase 3, Task 14
 */

/**
 * AnimationSystem - Manages entity animations
 */
class AnimationSystem {
  constructor(entityRegistry) {
    this.entityRegistry = entityRegistry;
    
    // Registered animations (animationName -> AnimationDefinition)
    this.animations = new Map();
    
    // Playing animations (entityId -> PlayingAnimation)
    this.playingAnimations = new Map();
    
    // Animation callbacks (entityId -> callback)
    this.animationCallbacks = new Map();
    
    // Enabled state (for accessibility)
    this.enabled = true;
  }
  
  /**
   * Register an animation definition
   * @param {string} name - Animation name
   * @param {object} definition - Animation definition
   */
  registerAnimation(name, definition) {
    // Validate definition
    if (!definition.frames || !Array.isArray(definition.frames)) {
      console.error(`Animation ${name} must have frames array`);
      return;
    }
    
    if (!definition.duration && !definition.fps) {
      console.error(`Animation ${name} must have duration or fps`);
      return;
    }
    
    // Calculate frame duration
    let frameDuration;
    if (definition.fps) {
      frameDuration = 1000 / definition.fps; // Convert FPS to ms per frame
    } else {
      frameDuration = definition.duration / definition.frames.length;
    }
    
    // Store animation definition
    this.animations.set(name, {
      name,
      frames: definition.frames,
      frameDuration,
      totalDuration: frameDuration * definition.frames.length,
      loop: definition.loop !== undefined ? definition.loop : false,
      onComplete: definition.onComplete || null
    });
  }
  
  /**
   * Register multiple animations at once
   * @param {object} definitions - Object with animation name keys and definition values
   */
  registerAnimations(definitions) {
    Object.entries(definitions).forEach(([name, definition]) => {
      this.registerAnimation(name, definition);
    });
  }
  
  /**
   * Play animation on entity
   * @param {string} entityId - Entity ID
   * @param {string} animationName - Animation name
   * @param {object} options - Animation options
   * @returns {boolean} True if animation started
   */
  playAnimation(entityId, animationName, options = {}) {
    const entity = this.entityRegistry.getEntity(entityId);
    
    if (!entity) {
      console.warn(`Entity ${entityId} not found`);
      return false;
    }
    
    const animationDef = this.animations.get(animationName);
    
    if (!animationDef) {
      console.warn(`Animation ${animationName} not registered`);
      return false;
    }
    
    // Check if same animation is already playing
    const currentAnim = this.playingAnimations.get(entityId);
    if (currentAnim && currentAnim.name === animationName && !options.restart) {
      return true; // Already playing
    }
    
    // Get or create animation component
    let animComponent = entity.getComponent('animation');
    if (!animComponent) {
      animComponent = {
        currentAnimation: null,
        frameIndex: 0,
        animationSpeed: 1.0,
        loop: false
      };
    }
    
    // Update animation component
    animComponent.currentAnimation = animationName;
    animComponent.frameIndex = 0;
    animComponent.loop = options.loop !== undefined ? options.loop : animationDef.loop;
    animComponent.animationSpeed = options.speed !== undefined ? options.speed : 1.0;
    
    entity.addComponent('animation', animComponent);
    
    // Create playing animation state
    this.playingAnimations.set(entityId, {
      name: animationName,
      definition: animationDef,
      frameIndex: 0,
      elapsedTime: 0,
      loop: animComponent.loop,
      speed: animComponent.animationSpeed,
      paused: false
    });
    
    // Store callback if provided
    if (options.onComplete) {
      this.animationCallbacks.set(entityId, options.onComplete);
    }
    
    // Update sprite to first frame
    this.updateEntitySprite(entity, animationDef.frames[0]);
    
    return true;
  }
  
  /**
   * Stop animation on entity
   * @param {string} entityId - Entity ID
   */
  stopAnimation(entityId) {
    const playingAnim = this.playingAnimations.get(entityId);
    
    if (!playingAnim) {
      return;
    }
    
    // Remove playing animation
    this.playingAnimations.delete(entityId);
    this.animationCallbacks.delete(entityId);
    
    // Clear animation component
    const entity = this.entityRegistry.getEntity(entityId);
    if (entity) {
      const animComponent = entity.getComponent('animation');
      if (animComponent) {
        animComponent.currentAnimation = null;
        animComponent.frameIndex = 0;
        entity.addComponent('animation', animComponent);
      }
    }
  }
  
  /**
   * Pause animation on entity
   * @param {string} entityId - Entity ID
   */
  pauseAnimation(entityId) {
    const playingAnim = this.playingAnimations.get(entityId);
    
    if (playingAnim) {
      playingAnim.paused = true;
    }
  }
  
  /**
   * Resume animation on entity
   * @param {string} entityId - Entity ID
   */
  resumeAnimation(entityId) {
    const playingAnim = this.playingAnimations.get(entityId);
    
    if (playingAnim) {
      playingAnim.paused = false;
    }
  }
  
  /**
   * Check if entity has animation playing
   * @param {string} entityId - Entity ID
   * @returns {boolean} True if animation is playing
   */
  isPlaying(entityId) {
    return this.playingAnimations.has(entityId);
  }
  
  /**
   * Get current animation name for entity
   * @param {string} entityId - Entity ID
   * @returns {string|null} Animation name or null
   */
  getCurrentAnimation(entityId) {
    const playingAnim = this.playingAnimations.get(entityId);
    return playingAnim ? playingAnim.name : null;
  }
  
  /**
   * Get animation progress (0-1)
   * @param {string} entityId - Entity ID
   * @returns {number} Progress from 0 to 1
   */
  getAnimationProgress(entityId) {
    const playingAnim = this.playingAnimations.get(entityId);
    
    if (!playingAnim) {
      return 0;
    }
    
    return playingAnim.elapsedTime / playingAnim.definition.totalDuration;
  }
  
  /**
   * Update entity sprite based on frame data
   * @param {Entity} entity - Entity to update
   * @param {object} frameData - Frame data
   */
  updateEntitySprite(entity, frameData) {
    let spriteComponent = entity.getComponent('sprite');
    
    if (!spriteComponent) {
      spriteComponent = {
        textureId: null,
        scale: 1.0,
        rotation: 0,
        tint: 0xFFFFFF
      };
    }
    
    // Update sprite properties from frame data
    if (frameData.textureId) {
      spriteComponent.textureId = frameData.textureId;
    }
    
    if (frameData.scale !== undefined) {
      spriteComponent.scale = frameData.scale;
    }
    
    if (frameData.rotation !== undefined) {
      spriteComponent.rotation = frameData.rotation;
    }
    
    if (frameData.tint !== undefined) {
      spriteComponent.tint = frameData.tint;
    }
    
    // Apply offset if provided
    if (frameData.offsetX !== undefined || frameData.offsetY !== undefined) {
      const position = entity.getComponent('position');
      if (position) {
        position.offsetX = frameData.offsetX || 0;
        position.offsetY = frameData.offsetY || 0;
        entity.addComponent('position', position);
      }
    }
    
    entity.addComponent('sprite', spriteComponent);
  }
  
  /**
   * Update all playing animations
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    // Skip if animations are disabled
    if (!this.enabled) {
      return;
    }
    
    // Update each playing animation
    for (const [entityId, playingAnim] of this.playingAnimations.entries()) {
      if (playingAnim.paused) {
        continue;
      }
      
      const entity = this.entityRegistry.getEntity(entityId);
      
      if (!entity) {
        this.playingAnimations.delete(entityId);
        continue;
      }
      
      // Apply speed multiplier
      const adjustedDelta = deltaTime * playingAnim.speed;
      playingAnim.elapsedTime += adjustedDelta;
      
      // Calculate current frame
      const frameDuration = playingAnim.definition.frameDuration;
      const newFrameIndex = Math.floor(playingAnim.elapsedTime / frameDuration);
      
      // Check if frame changed
      if (newFrameIndex !== playingAnim.frameIndex) {
        playingAnim.frameIndex = newFrameIndex;
        
        // Check if animation completed
        if (playingAnim.frameIndex >= playingAnim.definition.frames.length) {
          if (playingAnim.loop) {
            // Loop animation
            playingAnim.frameIndex = 0;
            playingAnim.elapsedTime = 0;
          } else {
            // Animation complete
            playingAnim.frameIndex = playingAnim.definition.frames.length - 1;
            
            // Call completion callback
            const callback = this.animationCallbacks.get(entityId);
            if (callback) {
              callback(entityId);
              this.animationCallbacks.delete(entityId);
            }
            
            // Call definition callback
            if (playingAnim.definition.onComplete) {
              playingAnim.definition.onComplete(entityId);
            }
            
            // Stop animation
            this.stopAnimation(entityId);
            continue;
          }
        }
        
        // Update sprite to new frame
        const frameData = playingAnim.definition.frames[playingAnim.frameIndex];
        this.updateEntitySprite(entity, frameData);
        
        // Update animation component
        const animComponent = entity.getComponent('animation');
        if (animComponent) {
          animComponent.frameIndex = playingAnim.frameIndex;
          entity.addComponent('animation', animComponent);
        }
      }
    }
  }
  
  /**
   * Get animation definition
   * @param {string} name - Animation name
   * @returns {object|null} Animation definition or null
   */
  getAnimation(name) {
    return this.animations.get(name) || null;
  }
  
  /**
   * Check if animation is registered
   * @param {string} name - Animation name
   * @returns {boolean} True if registered
   */
  hasAnimation(name) {
    return this.animations.has(name);
  }
  
  /**
   * Get all registered animation names
   * @returns {string[]} Array of animation names
   */
  getAnimationNames() {
    return Array.from(this.animations.keys());
  }
  
  /**
   * Clear all animations
   */
  clear() {
    // Stop all playing animations
    for (const entityId of this.playingAnimations.keys()) {
      this.stopAnimation(entityId);
    }
    
    this.playingAnimations.clear();
    this.animationCallbacks.clear();
  }
  
  /**
   * Clear all animation definitions
   */
  clearDefinitions() {
    this.animations.clear();
  }
  
  /**
   * Enable animations (for accessibility)
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    // If disabling, pause all animations
    if (!enabled) {
      for (const playingAnim of this.playingAnimations.values()) {
        playingAnim.paused = true;
      }
    } else {
      // If enabling, resume all animations
      for (const playingAnim of this.playingAnimations.values()) {
        playingAnim.paused = false;
      }
    }
  }
  
  /**
   * Check if animations are enabled
   * @returns {boolean} True if enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

export default AnimationSystem;
