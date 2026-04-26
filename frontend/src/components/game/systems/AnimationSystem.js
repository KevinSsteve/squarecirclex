/**
 * AnimationSystem Class - Handles sprite-based animations for entities
 * 
 * Implements:
 * - Frame-by-frame animation player
 * - Animation state management (play, stop, loop)
 * - Animation registration and definitions
 * - Animation blending for smooth transitions
 * - Sprite sheet support
 * - Character sprite animation integration (Phase 3, Task 3.4)
 * 
 * Requirements: 2.6, 3.4, 3.5
 * Phase 3, Task 14
 * 
 * Enhanced for Task 3.4:
 * - Support for variable frame rates per animation
 * - Animation events (onComplete, onLoop, onFrameChange)
 * - Smooth animation transitions with blending
 * - Integration with CharacterSpriteManager
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
    
    // Animation event listeners (entityId -> { onComplete, onLoop, onFrameChange })
    this.animationEventListeners = new Map();
    
    // Animation transitions (entityId -> TransitionState)
    this.animationTransitions = new Map();
    
    // Enabled state (for accessibility)
    this.enabled = true;
    
    // Default transition duration (milliseconds)
    this.defaultTransitionDuration = 150;
  }
  
  /**
   * Register an animation definition
   * @param {string} name - Animation name
   * @param {object} definition - Animation definition
   * @param {Array} definition.frames - Array of frame data
   * @param {number} [definition.fps] - Frames per second (alternative to duration)
   * @param {number} [definition.duration] - Total animation duration in ms
   * @param {boolean} [definition.loop=false] - Whether animation loops
   * @param {Function} [definition.onComplete] - Callback when animation completes
   * @param {Function} [definition.onLoop] - Callback when animation loops
   * @param {Function} [definition.onFrameChange] - Callback when frame changes
   * @param {number} [definition.priority=0] - Animation priority for transitions
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
      priority: definition.priority || 0,
      onComplete: definition.onComplete || null,
      onLoop: definition.onLoop || null,
      onFrameChange: definition.onFrameChange || null
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
   * @param {boolean} [options.loop] - Override loop setting
   * @param {number} [options.speed=1.0] - Animation speed multiplier
   * @param {boolean} [options.restart=false] - Force restart if already playing
   * @param {number} [options.transitionDuration] - Transition duration in ms
   * @param {Function} [options.onComplete] - Completion callback
   * @param {Function} [options.onLoop] - Loop callback
   * @param {Function} [options.onFrameChange] - Frame change callback
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
    
    // Handle animation transition if different animation is playing
    if (currentAnim && currentAnim.name !== animationName) {
      const transitionDuration = options.transitionDuration !== undefined 
        ? options.transitionDuration 
        : this.defaultTransitionDuration;
      
      if (transitionDuration > 0) {
        this.startAnimationTransition(entityId, currentAnim.name, animationName, transitionDuration);
      }
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
      paused: false,
      priority: animationDef.priority
    });
    
    // Store event listeners
    const eventListeners = {
      onComplete: options.onComplete || animationDef.onComplete || null,
      onLoop: options.onLoop || animationDef.onLoop || null,
      onFrameChange: options.onFrameChange || animationDef.onFrameChange || null
    };
    
    if (eventListeners.onComplete || eventListeners.onLoop || eventListeners.onFrameChange) {
      this.animationEventListeners.set(entityId, eventListeners);
    }
    
    // Legacy callback support
    if (options.onComplete) {
      this.animationCallbacks.set(entityId, options.onComplete);
    }
    
    // Update sprite to first frame
    this.updateEntitySprite(entity, animationDef.frames[0]);
    
    // Fire frame change event for first frame
    if (eventListeners.onFrameChange) {
      eventListeners.onFrameChange(entityId, 0, animationDef.frames[0]);
    }
    
    return true;
  }
  
  /**
   * Start animation transition between two animations
   * @param {string} entityId - Entity ID
   * @param {string} fromAnimation - Current animation
   * @param {string} toAnimation - Target animation
   * @param {number} duration - Transition duration in ms
   */
  startAnimationTransition(entityId, fromAnimation, toAnimation, duration) {
    this.animationTransitions.set(entityId, {
      fromAnimation,
      toAnimation,
      startTime: Date.now(),
      duration,
      progress: 0
    });
  }
  
  /**
   * Update animation transition
   * @param {string} entityId - Entity ID
   * @param {number} deltaTime - Time since last update
   * @returns {boolean} True if transition is complete
   */
  updateAnimationTransition(entityId, deltaTime) {
    const transition = this.animationTransitions.get(entityId);
    
    if (!transition) {
      return true;
    }
    
    const elapsed = Date.now() - transition.startTime;
    transition.progress = Math.min(elapsed / transition.duration, 1.0);
    
    // Transition complete
    if (transition.progress >= 1.0) {
      this.animationTransitions.delete(entityId);
      return true;
    }
    
    return false;
  }
  
  /**
   * Set animation speed for entity
   * @param {string} entityId - Entity ID
   * @param {number} speed - Speed multiplier
   */
  setAnimationSpeed(entityId, speed) {
    const playingAnim = this.playingAnimations.get(entityId);
    
    if (playingAnim) {
      playingAnim.speed = speed;
      
      // Update animation component
      const entity = this.entityRegistry.getEntity(entityId);
      if (entity) {
        const animComponent = entity.getComponent('animation');
        if (animComponent) {
          animComponent.animationSpeed = speed;
          entity.addComponent('animation', animComponent);
        }
      }
    }
  }
  
  /**
   * Get animation speed for entity
   * @param {string} entityId - Entity ID
   * @returns {number} Speed multiplier
   */
  getAnimationSpeed(entityId) {
    const playingAnim = this.playingAnimations.get(entityId);
    return playingAnim ? playingAnim.speed : 1.0;
  }
  
  /**
   * Set animation frame rate
   * @param {string} entityId - Entity ID
   * @param {number} fps - Frames per second
   */
  setAnimationFrameRate(entityId, fps) {
    const playingAnim = this.playingAnimations.get(entityId);
    
    if (playingAnim) {
      const frameDuration = 1000 / fps;
      playingAnim.definition.frameDuration = frameDuration;
      playingAnim.definition.totalDuration = frameDuration * playingAnim.definition.frames.length;
    }
  }
  
  /**
   * Get current frame index
   * @param {string} entityId - Entity ID
   * @returns {number} Current frame index
   */
  getCurrentFrame(entityId) {
    const playingAnim = this.playingAnimations.get(entityId);
    return playingAnim ? playingAnim.frameIndex : 0;
  }
  
  /**
   * Set current frame index
   * @param {string} entityId - Entity ID
   * @param {number} frameIndex - Frame index to set
   */
  setCurrentFrame(entityId, frameIndex) {
    const playingAnim = this.playingAnimations.get(entityId);
    
    if (!playingAnim) {
      return;
    }
    
    const entity = this.entityRegistry.getEntity(entityId);
    if (!entity) {
      return;
    }
    
    // Clamp frame index
    frameIndex = Math.max(0, Math.min(frameIndex, playingAnim.definition.frames.length - 1));
    
    playingAnim.frameIndex = frameIndex;
    playingAnim.elapsedTime = frameIndex * playingAnim.definition.frameDuration;
    
    // Update sprite
    const frameData = playingAnim.definition.frames[frameIndex];
    this.updateEntitySprite(entity, frameData);
    
    // Update animation component
    const animComponent = entity.getComponent('animation');
    if (animComponent) {
      animComponent.frameIndex = frameIndex;
      entity.addComponent('animation', animComponent);
    }
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
    this.animationEventListeners.delete(entityId);
    this.animationTransitions.delete(entityId);
    
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
    
    // Update animation transitions
    for (const [entityId, transition] of this.animationTransitions.entries()) {
      this.updateAnimationTransition(entityId, deltaTime);
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
        const oldFrameIndex = playingAnim.frameIndex;
        playingAnim.frameIndex = newFrameIndex;
        
        // Check if animation completed
        if (playingAnim.frameIndex >= playingAnim.definition.frames.length) {
          if (playingAnim.loop) {
            // Loop animation
            playingAnim.frameIndex = 0;
            playingAnim.elapsedTime = 0;
            
            // Fire loop event
            const eventListeners = this.animationEventListeners.get(entityId);
            if (eventListeners && eventListeners.onLoop) {
              eventListeners.onLoop(entityId, playingAnim.name);
            }
          } else {
            // Animation complete
            playingAnim.frameIndex = playingAnim.definition.frames.length - 1;
            
            // Fire completion events
            const eventListeners = this.animationEventListeners.get(entityId);
            if (eventListeners && eventListeners.onComplete) {
              eventListeners.onComplete(entityId, playingAnim.name);
            }
            
            // Legacy callback support
            const callback = this.animationCallbacks.get(entityId);
            if (callback) {
              callback(entityId);
              this.animationCallbacks.delete(entityId);
            }
            
            // Definition callback
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
        
        // Fire frame change event
        const eventListeners = this.animationEventListeners.get(entityId);
        if (eventListeners && eventListeners.onFrameChange) {
          eventListeners.onFrameChange(entityId, playingAnim.frameIndex, frameData);
        }
        
        // Definition frame change callback
        if (playingAnim.definition.onFrameChange) {
          playingAnim.definition.onFrameChange(entityId, playingAnim.frameIndex, frameData);
        }
        
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
    this.animationEventListeners.clear();
    this.animationTransitions.clear();
  }
  
  /**
   * Clear all animation definitions
   */
  clearDefinitions() {
    this.animations.clear();
  }
  
  /**
   * Pause all playing animations
   */
  pauseAll() {
    for (const playingAnim of this.playingAnimations.values()) {
      playingAnim.paused = true;
    }
  }
  
  /**
   * Resume all paused animations
   */
  resumeAll() {
    for (const playingAnim of this.playingAnimations.values()) {
      playingAnim.paused = false;
    }
  }
  
  /**
   * Enable animations (for accessibility)
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    // If disabling, pause all animations
    if (!enabled) {
      this.pauseAll();
    } else {
      // If enabling, resume all animations
      this.resumeAll();
    }
  }
  
  /**
   * Check if animations are enabled
   * @returns {boolean} True if enabled
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Set default transition duration
   * @param {number} duration - Duration in milliseconds
   */
  setDefaultTransitionDuration(duration) {
    this.defaultTransitionDuration = Math.max(0, duration);
  }
  
  /**
   * Get default transition duration
   * @returns {number} Duration in milliseconds
   */
  getDefaultTransitionDuration() {
    return this.defaultTransitionDuration;
  }
  
  /**
   * Check if entity has active transition
   * @param {string} entityId - Entity ID
   * @returns {boolean} True if transition is active
   */
  hasActiveTransition(entityId) {
    return this.animationTransitions.has(entityId);
  }
  
  /**
   * Get transition progress
   * @param {string} entityId - Entity ID
   * @returns {number} Progress from 0 to 1, or 0 if no transition
   */
  getTransitionProgress(entityId) {
    const transition = this.animationTransitions.get(entityId);
    return transition ? transition.progress : 0;
  }
  
  /**
   * Get animation statistics
   * @returns {object} Statistics object
   */
  getStatistics() {
    let totalPlaying = 0;
    let totalPaused = 0;
    let totalLooping = 0;
    
    for (const playingAnim of this.playingAnimations.values()) {
      totalPlaying++;
      if (playingAnim.paused) {
        totalPaused++;
      }
      if (playingAnim.loop) {
        totalLooping++;
      }
    }
    
    return {
      registeredAnimations: this.animations.size,
      playingAnimations: totalPlaying,
      pausedAnimations: totalPaused,
      loopingAnimations: totalLooping,
      activeTransitions: this.animationTransitions.size,
      enabled: this.enabled
    };
  }
}

export default AnimationSystem;
