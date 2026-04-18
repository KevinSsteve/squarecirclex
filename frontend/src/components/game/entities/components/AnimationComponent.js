/**
 * AnimationComponent - Animation state for entities
 * 
 * Manages sprite animation state including current animation, frame, and playback.
 * 
 * Requirements: 2.2, 2.6
 * Phase 2, Task 7
 */

/**
 * Create an animation component
 * @param {string} currentAnimation - Name of current animation
 * @param {number} frameIndex - Current frame index
 * @param {number} animationSpeed - Playback speed multiplier (1.0 = normal)
 * @param {boolean} loop - Whether animation should loop
 * @param {boolean} playing - Whether animation is playing
 * @returns {object} Animation component data
 */
export function createAnimationComponent(
  currentAnimation = 'idle',
  frameIndex = 0,
  animationSpeed = 1.0,
  loop = true,
  playing = true
) {
  return {
    type: 'animation',
    currentAnimation,
    frameIndex,
    animationSpeed,
    loop,
    playing,
    // Time accumulator for frame advancement
    frameTime: 0,
    // Animation definitions (set by animation system)
    animations: {}
  };
}

/**
 * Update animation component
 * @param {object} component - Animation component to update
 * @param {object} updates - Updates to apply
 * @returns {object} Updated component
 */
export function updateAnimationComponent(component, updates) {
  return {
    ...component,
    ...updates
  };
}

/**
 * Play animation
 * @param {object} component - Animation component
 * @param {string} animationName - Name of animation to play
 * @param {boolean} loop - Whether to loop
 * @returns {object} Updated component
 */
export function playAnimation(component, animationName, loop = true) {
  return updateAnimationComponent(component, {
    currentAnimation: animationName,
    frameIndex: 0,
    frameTime: 0,
    loop,
    playing: true
  });
}

/**
 * Stop animation
 * @param {object} component - Animation component
 * @returns {object} Updated component
 */
export function stopAnimation(component) {
  return updateAnimationComponent(component, {
    playing: false
  });
}

/**
 * Pause animation
 * @param {object} component - Animation component
 * @returns {object} Updated component
 */
export function pauseAnimation(component) {
  return updateAnimationComponent(component, {
    playing: false
  });
}

/**
 * Resume animation
 * @param {object} component - Animation component
 * @returns {object} Updated component
 */
export function resumeAnimation(component) {
  return updateAnimationComponent(component, {
    playing: true
  });
}

/**
 * Set animation speed
 * @param {object} component - Animation component
 * @param {number} speed - Speed multiplier
 * @returns {object} Updated component
 */
export function setAnimationSpeed(component, speed) {
  return updateAnimationComponent(component, {
    animationSpeed: Math.max(0, speed)
  });
}

/**
 * Register animation definition
 * @param {object} component - Animation component
 * @param {string} name - Animation name
 * @param {object} definition - Animation definition
 * @returns {object} Updated component
 */
export function registerAnimation(component, name, definition) {
  return updateAnimationComponent(component, {
    animations: {
      ...component.animations,
      [name]: definition
    }
  });
}
