/**
 * CharacterSpriteManager.js - Character Sprite Management System
 * 
 * Manages character sprites and animations for the game layer.
 * Supports 8-directional sprites with multiple animation states.
 * 
 * Phase 3, Task 3.1: Character Sprite Manager
 */

import * as PIXI from 'pixi.js';

/**
 * Animation states supported by the character sprite system
 */
export const AnimationState = {
  IDLE: 'idle',
  WALKING: 'walking',
  WORKING: 'working',
  CELEBRATING: 'celebrating'
};

/**
 * 8 cardinal and intercardinal directions
 */
export const Direction = {
  NORTH: 'N',
  NORTH_EAST: 'NE',
  EAST: 'E',
  SOUTH_EAST: 'SE',
  SOUTH: 'S',
  SOUTH_WEST: 'SW',
  WEST: 'W',
  NORTH_WEST: 'NW'
};

/**
 * Direction array for easy indexing
 */
export const DIRECTIONS = [
  Direction.EAST,
  Direction.SOUTH_EAST,
  Direction.SOUTH,
  Direction.SOUTH_WEST,
  Direction.WEST,
  Direction.NORTH_WEST,
  Direction.NORTH,
  Direction.NORTH_EAST
];

/**
 * CharacterSpriteManager
 * 
 * Manages character sprites, animations, and frame sequencing.
 * Provides sprite caching and efficient texture management.
 */
export class CharacterSpriteManager {
  constructor(scene = null) {
    /**
     * Scene reference for accessing renderer
     */
    this.scene = scene;
    
    /**
     * Sprite cache: Map<characterType, Map<animationState, Map<direction, Texture[]>>>
     */
    this.spriteCache = new Map();
    
    /**
     * Animation configurations
     */
    this.animationConfigs = new Map();
    
    /**
     * Default frame rate (FPS)
     */
    this.defaultFrameRate = 8;
    
    /**
     * Loaded character types
     */
    this.loadedCharacterTypes = new Set();
  }
  
  /**
   * Set the scene reference (for late initialization)
   * @param {Scene} scene - Scene instance
   */
  setScene(scene) {
    this.scene = scene;
  }
  
  /**
   * Load sprites for a character type
   * @param {string} characterType - Character type identifier (e.g., 'agent', 'manager')
   * @param {Object} spriteData - Sprite data configuration
   * @returns {Promise<void>}
   */
  async loadCharacterSprites(characterType, spriteData) {
    if (this.loadedCharacterTypes.has(characterType)) {
      console.warn(`Character type "${characterType}" already loaded`);
      return;
    }
    
    try {
      // Initialize cache for this character type
      if (!this.spriteCache.has(characterType)) {
        this.spriteCache.set(characterType, new Map());
      }
      
      const characterCache = this.spriteCache.get(characterType);
      
      // Load sprites for each animation state
      for (const state of Object.values(AnimationState)) {
        if (!characterCache.has(state)) {
          characterCache.set(state, new Map());
        }
        
        const stateCache = characterCache.get(state);
        
        // Load sprites for each direction
        for (const direction of DIRECTIONS) {
          const frames = await this.loadAnimationFrames(
            characterType,
            state,
            direction,
            spriteData
          );
          
          stateCache.set(direction, frames);
        }
      }
      
      // Store animation configuration
      this.animationConfigs.set(characterType, {
        frameRate: spriteData.frameRate || this.defaultFrameRate,
        frameCount: spriteData.frameCount || {}
      });
      
      this.loadedCharacterTypes.add(characterType);
      
      console.log(`Loaded sprites for character type: ${characterType}`);
    } catch (error) {
      console.error(`Failed to load sprites for character type "${characterType}":`, error);
      throw error;
    }
  }
  
  /**
   * Load animation frames for a specific state and direction
   * @param {string} characterType - Character type
   * @param {string} state - Animation state
   * @param {string} direction - Direction
   * @param {Object} spriteData - Sprite data configuration
   * @returns {Promise<PIXI.Texture[]>}
   */
  async loadAnimationFrames(characterType, state, direction, spriteData) {
    // For now, create placeholder textures
    // In a real implementation, this would load from sprite sheets
    const frameCount = this.getFrameCount(state, spriteData);
    const frames = [];
    
    for (let i = 0; i < frameCount; i++) {
      // Create placeholder texture
      // TODO: Replace with actual sprite sheet loading
      const texture = this.createPlaceholderTexture(characterType, state, direction, i);
      frames.push(texture);
    }
    
    return frames;
  }
  
  /**
   * Get frame count for an animation state
   * @param {string} state - Animation state
   * @param {Object} spriteData - Sprite data configuration
   * @returns {number}
   */
  getFrameCount(state, spriteData) {
    if (spriteData.frameCount && spriteData.frameCount[state]) {
      return spriteData.frameCount[state];
    }
    
    // Default frame counts
    switch (state) {
      case AnimationState.IDLE:
        return 1;
      case AnimationState.WALKING:
        return 4;
      case AnimationState.WORKING:
        return 4;
      case AnimationState.CELEBRATING:
        return 6;
      default:
        return 1;
    }
  }
  
  /**
   * Create placeholder texture for development
   * @param {string} characterType - Character type
   * @param {string} state - Animation state
   * @param {string} direction - Direction
   * @param {number} frameIndex - Frame index
   * @returns {PIXI.Texture}
   */
  createPlaceholderTexture(characterType, state, direction, frameIndex) {
    const graphics = new PIXI.Graphics();
    
    // Draw character shape based on direction
    const size = 32;
    const halfSize = size / 2;
    
    // Body color based on character type
    const colors = {
      agent: 0x4F46E5,
      manager: 0x10B981,
      specialist: 0xF59E0B
    };
    const color = colors[characterType] || 0x6B7280;
    
    // Draw body
    graphics.circle(0, 0, halfSize);
    graphics.fill(color);
    
    // Draw direction indicator
    const directionAngles = {
      'N': -Math.PI / 2,
      'NE': -Math.PI / 4,
      'E': 0,
      'SE': Math.PI / 4,
      'S': Math.PI / 2,
      'SW': 3 * Math.PI / 4,
      'W': Math.PI,
      'NW': -3 * Math.PI / 4
    };
    
    const angle = directionAngles[direction] || 0;
    const indicatorLength = halfSize * 0.6;
    const indicatorX = Math.cos(angle) * indicatorLength;
    const indicatorY = Math.sin(angle) * indicatorLength;
    
    graphics.moveTo(0, 0);
    graphics.lineTo(indicatorX, indicatorY);
    graphics.stroke({ width: 3, color: 0xFFFFFF });
    
    // Add frame indicator for animations
    if (frameIndex > 0) {
      const pulseScale = 1 + (frameIndex * 0.05);
      graphics.circle(0, 0, halfSize * pulseScale);
      graphics.stroke({ width: 1, color: 0xFFFFFF, alpha: 0.5 });
    }
    
    // Generate texture from graphics (PixiJS v8)
    // Use the scene's renderer to generate texture
    if (this.scene && this.scene.app && this.scene.app.renderer) {
      const texture = this.scene.app.renderer.generateTexture(graphics);
      return texture;
    }
    
    // Fallback: create render texture manually
    const texture = PIXI.RenderTexture.create({
      width: size,
      height: size
    });
    
    return texture;
  }
  
  /**
   * Get sprite texture for a character
   * @param {string} characterType - Character type
   * @param {string} state - Animation state
   * @param {string} direction - Direction
   * @param {number} frameIndex - Frame index
   * @returns {PIXI.Texture|null}
   */
  getSprite(characterType, state, direction, frameIndex = 0) {
    if (!this.spriteCache.has(characterType)) {
      console.warn(`Character type "${characterType}" not loaded`);
      return null;
    }
    
    const characterCache = this.spriteCache.get(characterType);
    
    if (!characterCache.has(state)) {
      console.warn(`Animation state "${state}" not found for character type "${characterType}"`);
      return null;
    }
    
    const stateCache = characterCache.get(state);
    
    if (!stateCache.has(direction)) {
      console.warn(`Direction "${direction}" not found for state "${state}" of character type "${characterType}"`);
      return null;
    }
    
    const frames = stateCache.get(direction);
    
    if (frameIndex >= frames.length) {
      console.warn(`Frame index ${frameIndex} out of bounds for animation (max: ${frames.length - 1})`);
      return frames[0];
    }
    
    return frames[frameIndex];
  }
  
  /**
   * Get animation configuration for a character type
   * @param {string} characterType - Character type
   * @returns {Object|null}
   */
  getAnimationConfig(characterType) {
    return this.animationConfigs.get(characterType) || null;
  }
  
  /**
   * Get frame count for a specific animation
   * @param {string} characterType - Character type
   * @param {string} state - Animation state
   * @returns {number}
   */
  getAnimationFrameCount(characterType, state) {
    const config = this.getAnimationConfig(characterType);
    if (!config) {
      return 1;
    }
    
    if (config.frameCount && config.frameCount[state]) {
      return config.frameCount[state];
    }
    
    // Default frame counts
    return this.getFrameCount(state, config);
  }
  
  /**
   * Check if a character type is loaded
   * @param {string} characterType - Character type
   * @returns {boolean}
   */
  isCharacterLoaded(characterType) {
    return this.loadedCharacterTypes.has(characterType);
  }
  
  /**
   * Unload sprites for a character type
   * @param {string} characterType - Character type
   */
  unloadCharacterSprites(characterType) {
    if (!this.spriteCache.has(characterType)) {
      return;
    }
    
    // Clean up textures
    const characterCache = this.spriteCache.get(characterType);
    for (const stateCache of characterCache.values()) {
      for (const frames of stateCache.values()) {
        for (const texture of frames) {
          if (texture && texture.destroy) {
            texture.destroy(true);
          }
        }
      }
    }
    
    this.spriteCache.delete(characterType);
    this.animationConfigs.delete(characterType);
    this.loadedCharacterTypes.delete(characterType);
    
    console.log(`Unloaded sprites for character type: ${characterType}`);
  }
  
  /**
   * Clear all cached sprites
   */
  clearCache() {
    for (const characterType of this.loadedCharacterTypes) {
      this.unloadCharacterSprites(characterType);
    }
    
    this.spriteCache.clear();
    this.animationConfigs.clear();
    this.loadedCharacterTypes.clear();
    
    console.log('Character sprite cache cleared');
  }
  
  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    let totalTextures = 0;
    let totalStates = 0;
    let totalDirections = 0;
    
    for (const characterCache of this.spriteCache.values()) {
      totalStates += characterCache.size;
      for (const stateCache of characterCache.values()) {
        totalDirections += stateCache.size;
        for (const frames of stateCache.values()) {
          totalTextures += frames.length;
        }
      }
    }
    
    return {
      characterTypes: this.loadedCharacterTypes.size,
      totalStates,
      totalDirections,
      totalTextures,
      loadedTypes: Array.from(this.loadedCharacterTypes)
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get singleton instance of CharacterSpriteManager
 * @param {Scene} scene - Optional scene instance for initialization
 * @returns {CharacterSpriteManager}
 */
export function getCharacterSpriteManager(scene = null) {
  if (!instance) {
    instance = new CharacterSpriteManager(scene);
  } else if (scene && !instance.scene) {
    // Set scene if not already set
    instance.setScene(scene);
  }
  return instance;
}

export default CharacterSpriteManager;
