/**
 * Placeholder Sprite System
 * 
 * Creates placeholder sprites for agent animations until actual sprite assets are available.
 * Uses PixiJS Graphics to generate colored rectangles as stand-ins.
 * 
 * Phase 3, Task 15
 */

import * as PIXI from 'pixi.js';

/**
 * Generate placeholder textures for agent animations
 * @param {PIXI.Application} app - PixiJS application instance
 * @returns {Object} Map of textureId to PIXI.Texture
 */
export function generatePlaceholderTextures(app) {
  const textures = {};
  
  // Agent dimensions
  const agentWidth = 32;
  const agentHeight = 48;
  
  // Color variations for different animation frames
  const baseColor = 0x4A90E2; // Blue
  const highlightColor = 0x5BA3F5; // Lighter blue
  const shadowColor = 0x3A7BC8; // Darker blue
  
  /**
   * Create a simple agent sprite texture
   * @param {string} id - Texture ID
   * @param {number} color - Base color
   * @param {number} variant - Frame variant (0-7)
   */
  function createAgentTexture(id, color, variant = 0) {
    const graphics = new PIXI.Graphics();
    
    // Body (rectangle)
    graphics.beginFill(color);
    graphics.drawRect(8, 16, 16, 24);
    graphics.endFill();
    
    // Head (circle)
    const headColor = variant % 2 === 0 ? highlightColor : color;
    graphics.beginFill(headColor);
    graphics.drawCircle(16, 12, 8);
    graphics.endFill();
    
    // Arms (small rectangles) - vary position slightly per frame
    const armOffset = Math.sin(variant * 0.5) * 2;
    graphics.beginFill(shadowColor);
    graphics.drawRect(4, 20 + armOffset, 4, 12);
    graphics.drawRect(24, 20 - armOffset, 4, 12);
    graphics.endFill();
    
    // Legs (small rectangles) - vary position for walking
    const legOffset = Math.sin(variant * 0.8) * 3;
    graphics.beginFill(shadowColor);
    graphics.drawRect(10, 40 + legOffset, 4, 8);
    graphics.drawRect(18, 40 - legOffset, 4, 8);
    graphics.endFill();
    
    // Generate texture from graphics
    const texture = app.renderer.generateTexture(graphics, {
      resolution: 2,
      scaleMode: 'linear'
    });
    
    graphics.destroy();
    
    textures[id] = texture;
  }
  
  // Generate idle animation frames (4 frames)
  for (let i = 1; i <= 4; i++) {
    createAgentTexture(`agent_idle_${i}`, baseColor, i - 1);
  }
  
  // Generate walking animations (8 frames per direction)
  const directions = ['down', 'up', 'left', 'right'];
  directions.forEach(direction => {
    for (let i = 1; i <= 8; i++) {
      createAgentTexture(`agent_walk_${direction}_${i}`, baseColor, i - 1);
    }
  });
  
  // Generate typing animation frames (6 frames)
  for (let i = 1; i <= 6; i++) {
    createAgentTexture(`agent_typing_${i}`, 0x50C878, i - 1); // Green for working
  }
  
  // Generate thinking animation frames (4 frames)
  for (let i = 1; i <= 4; i++) {
    createAgentTexture(`agent_thinking_${i}`, 0xF5A623, i - 1); // Orange for thinking
  }
  
  // Generate celebrating animation frames (8 frames)
  for (let i = 1; i <= 8; i++) {
    createAgentTexture(`agent_celebrate_${i}`, 0x7ED321, i - 1); // Bright green for success
  }
  
  // Generate error animation frames (4 frames)
  for (let i = 1; i <= 4; i++) {
    createAgentTexture(`agent_error_${i}`, 0xD0021B, i - 1); // Red for error
  }
  
  console.log(`Generated ${Object.keys(textures).length} placeholder agent textures`);
  
  return textures;
}

/**
 * Load placeholder textures into PixiJS texture cache
 * @param {PIXI.Application} app - PixiJS application instance
 */
export function loadPlaceholderTextures(app) {
  const textures = generatePlaceholderTextures(app);
  
  // Add textures to PixiJS v8 cache using Assets API
  Object.entries(textures).forEach(([id, texture]) => {
    PIXI.Assets.cache.set(id, texture);
  });
  
  return textures;
}

/**
 * Check if a texture exists in the cache
 * @param {string} textureId - Texture ID to check
 * @returns {boolean} True if texture exists
 */
export function hasTexture(textureId) {
  return PIXI.Texture.from(textureId) !== PIXI.Texture.EMPTY;
}

/**
 * Get texture from cache or create placeholder
 * @param {string} textureId - Texture ID
 * @returns {PIXI.Texture} The texture
 */
export function getTexture(textureId) {
  const texture = PIXI.Texture.from(textureId);
  
  if (texture === PIXI.Texture.EMPTY) {
    console.warn(`Texture ${textureId} not found, using fallback`);
    return PIXI.Texture.WHITE;
  }
  
  return texture;
}

export default {
  generatePlaceholderTextures,
  loadPlaceholderTextures,
  hasTexture,
  getTexture
};
