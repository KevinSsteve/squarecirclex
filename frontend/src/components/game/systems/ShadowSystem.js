import * as PIXI from 'pixi.js';

/**
 * ShadowSystem
 * 
 * Manages shadow rendering for entities in the 3D isometric game layer.
 * Provides realistic depth perception through dynamic shadow sprites.
 * 
 * Features:
 * - Circular shadow sprites for characters
 * - Dynamic shadow positioning based on entity position
 * - Adjustable shadow alpha and size
 * - Automatic shadow attachment to entities
 * - Memory-efficient shadow caching
 * 
 * Phase 1, Task 1.5
 * Game 3D Visual Upgrade Specification
 * Requirements: 1.3 (Shadow rendering for depth perception)
 */
class ShadowSystem {
  constructor(scene) {
    this.scene = scene;
    this.shadowLayer = scene.layers.shadows;
    this.shadowCache = new Map(); // Map<entityId, shadowSprite>
    
    // Shadow configuration
    this.config = {
      defaultAlpha: 0.3,
      defaultSize: 48,
      offsetY: 10, // Offset below entity
      tint: 0x000000,
      
      // Shadow sizes by type
      sizes: {
        small: 32,
        medium: 48,
        large: 64
      }
    };
    
    // Shadow textures cache
    this.textures = new Map();
    
    // Initialize shadow textures
    this.initializeShadowTextures();
    
    console.log('[ShadowSystem] Initialized');
  }
  
  /**
   * Initialize shadow textures
   * Creates circular shadow sprites of different sizes
   */
  initializeShadowTextures() {
    // Create shadow textures for each size
    Object.entries(this.config.sizes).forEach(([type, size]) => {
      const texture = this.createShadowTexture(size);
      this.textures.set(type, texture);
    });
    
    console.log(`[ShadowSystem] Created ${this.textures.size} shadow textures`);
  }
  
  /**
   * Create a circular shadow texture
   * @param {number} size - Shadow diameter in pixels
   * @returns {PIXI.Texture}
   */
  createShadowTexture(size) {
    // Create graphics object for drawing
    const graphics = new PIXI.Graphics();
    
    // Draw elliptical shadow (isometric perspective)
    const radiusX = size / 2;
    const radiusY = size / 4; // Flattened for isometric view
    
    // Create radial gradient effect using PixiJS v8 API
    graphics.ellipse(size / 2, size / 2, radiusX, radiusY);
    graphics.fill({ color: 0x000000, alpha: 1.0 });
    
    // Generate texture from graphics
    const texture = this.scene.app.renderer.generateTexture({
      target: graphics,
      resolution: 1
    });
    
    // Clean up graphics
    graphics.destroy();
    
    return texture;
  }
  
  /**
   * Create and attach a shadow to an entity
   * @param {Entity} entity - Entity to attach shadow to
   * @param {string} type - Shadow type ('small', 'medium', 'large')
   * @param {object} options - Shadow options
   * @returns {PIXI.Sprite} Created shadow sprite
   */
  createShadow(entity, type = 'medium', options = {}) {
    // Check if shadow already exists
    if (this.shadowCache.has(entity.id)) {
      console.warn(`[ShadowSystem] Shadow already exists for entity ${entity.id}`);
      return this.shadowCache.get(entity.id);
    }
    
    // Get shadow texture
    const texture = this.textures.get(type) || this.textures.get('medium');
    
    // Create shadow sprite
    const shadow = new PIXI.Sprite(texture);
    shadow.anchor.set(0.5, 0.5);
    shadow.alpha = options.alpha !== undefined ? options.alpha : this.config.defaultAlpha;
    shadow.tint = options.tint !== undefined ? options.tint : this.config.tint;
    
    // Store entity reference for updates
    shadow.entityId = entity.id;
    
    // Get entity position
    const position = entity.getComponent('position');
    if (position) {
      shadow.x = position.x;
      shadow.y = position.y + this.config.offsetY;
      
      // Set zIndex for depth sorting (slightly below entity)
      shadow.zIndex = position.y + this.config.offsetY - 1;
    }
    
    // Add to shadow layer
    this.shadowLayer.addChild(shadow);
    
    // Cache shadow
    this.shadowCache.set(entity.id, shadow);
    
    console.log(`[ShadowSystem] Created ${type} shadow for entity ${entity.id}`);
    
    return shadow;
  }
  
  /**
   * Update shadow position for an entity
   * @param {string} entityId - Entity ID
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  updateShadow(entityId, x, y) {
    const shadow = this.shadowCache.get(entityId);
    if (shadow) {
      shadow.x = x;
      shadow.y = y + this.config.offsetY;
      
      // Update zIndex for depth sorting
      shadow.zIndex = y + this.config.offsetY - 1;
    }
  }
  
  /**
   * Update shadow for an entity based on its current position
   * @param {Entity} entity - Entity to update shadow for
   */
  updateShadowFromEntity(entity) {
    const position = entity.getComponent('position');
    if (position) {
      this.updateShadow(entity.id, position.x, position.y);
    }
  }
  
  /**
   * Set shadow alpha (transparency)
   * @param {string} entityId - Entity ID
   * @param {number} alpha - Alpha value (0-1)
   */
  setShadowAlpha(entityId, alpha) {
    const shadow = this.shadowCache.get(entityId);
    if (shadow) {
      shadow.alpha = Math.max(0, Math.min(1, alpha));
    }
  }
  
  /**
   * Set shadow scale
   * @param {string} entityId - Entity ID
   * @param {number} scale - Scale factor
   */
  setShadowScale(entityId, scale) {
    const shadow = this.shadowCache.get(entityId);
    if (shadow) {
      shadow.scale.set(scale);
    }
  }
  
  /**
   * Set shadow visibility
   * @param {string} entityId - Entity ID
   * @param {boolean} visible - Visibility state
   */
  setShadowVisibility(entityId, visible) {
    const shadow = this.shadowCache.get(entityId);
    if (shadow) {
      shadow.visible = visible;
    }
  }
  
  /**
   * Remove shadow from an entity
   * @param {string} entityId - Entity ID
   */
  removeShadow(entityId) {
    const shadow = this.shadowCache.get(entityId);
    if (shadow) {
      this.shadowLayer.removeChild(shadow);
      shadow.destroy();
      this.shadowCache.delete(entityId);
      
      console.log(`[ShadowSystem] Removed shadow for entity ${entityId}`);
    }
  }
  
  /**
   * Check if entity has a shadow
   * @param {string} entityId - Entity ID
   * @returns {boolean}
   */
  hasShadow(entityId) {
    return this.shadowCache.has(entityId);
  }
  
  /**
   * Get shadow sprite for an entity
   * @param {string} entityId - Entity ID
   * @returns {PIXI.Sprite|null}
   */
  getShadow(entityId) {
    return this.shadowCache.get(entityId) || null;
  }
  
  /**
   * Update all shadows
   * Called from Scene update loop
   */
  update() {
    // Shadows are updated individually when entities move
    // This method is here for future enhancements (e.g., animated shadows)
  }
  
  /**
   * Get shadow system statistics
   * @returns {object} Statistics
   */
  getStats() {
    return {
      shadowCount: this.shadowCache.size,
      textureCount: this.textures.size,
      layerChildCount: this.shadowLayer.children.length
    };
  }
  
  /**
   * Clear all shadows
   */
  clearAll() {
    this.shadowCache.forEach((shadow) => {
      this.shadowLayer.removeChild(shadow);
      shadow.destroy();
    });
    
    this.shadowCache.clear();
    
    console.log('[ShadowSystem] Cleared all shadows');
  }
  
  /**
   * Destroy shadow system and cleanup resources
   */
  destroy() {
    // Clear all shadows
    this.clearAll();
    
    // Destroy shadow textures
    this.textures.forEach((texture) => {
      texture.destroy(true);
    });
    this.textures.clear();
    
    console.log('[ShadowSystem] Destroyed');
  }
}

export default ShadowSystem;
