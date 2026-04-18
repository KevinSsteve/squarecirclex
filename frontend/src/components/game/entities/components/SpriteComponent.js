/**
 * SpriteComponent - Visual representation for entities
 * 
 * Stores sprite rendering information including texture, tint, and visibility.
 * 
 * Requirements: 2.2, 2.6
 * Phase 2, Task 7
 */

/**
 * Create a sprite component
 * @param {string} textureId - ID of the texture to use
 * @param {number} scale - Scale factor (1.0 = normal size)
 * @param {number} rotation - Rotation in degrees (0-360)
 * @param {number} tint - Color tint (0xFFFFFF = no tint)
 * @param {number} alpha - Opacity (0.0 = transparent, 1.0 = opaque)
 * @param {boolean} visible - Whether sprite is visible
 * @param {number} zIndex - Rendering order within layer
 * @returns {object} Sprite component data
 */
export function createSpriteComponent(
  textureId,
  scale = 1.0,
  rotation = 0,
  tint = 0xFFFFFF,
  alpha = 1.0,
  visible = true,
  zIndex = 0
) {
  return {
    type: 'sprite',
    textureId,
    scale,
    rotation,
    tint,
    alpha,
    visible,
    zIndex,
    // Reference to actual PIXI sprite (set by rendering system)
    pixiSprite: null
  };
}

/**
 * Update sprite component
 * @param {object} component - Sprite component to update
 * @param {object} updates - Updates to apply
 * @returns {object} Updated component
 */
export function updateSpriteComponent(component, updates) {
  return {
    ...component,
    ...updates
  };
}

/**
 * Show sprite
 * @param {object} component - Sprite component
 * @returns {object} Updated component
 */
export function showSprite(component) {
  return updateSpriteComponent(component, { visible: true });
}

/**
 * Hide sprite
 * @param {object} component - Sprite component
 * @returns {object} Updated component
 */
export function hideSprite(component) {
  return updateSpriteComponent(component, { visible: false });
}

/**
 * Set sprite tint
 * @param {object} component - Sprite component
 * @param {number} tint - Color tint
 * @returns {object} Updated component
 */
export function setSpriteTint(component, tint) {
  return updateSpriteComponent(component, { tint });
}

/**
 * Set sprite alpha
 * @param {object} component - Sprite component
 * @param {number} alpha - Opacity (0.0-1.0)
 * @returns {object} Updated component
 */
export function setSpriteAlpha(component, alpha) {
  return updateSpriteComponent(component, { alpha: Math.max(0, Math.min(1, alpha)) });
}
