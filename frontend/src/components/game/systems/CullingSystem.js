/**
 * CullingSystem Class - Implements frustum culling for performance optimization
 * 
 * Responsibilities:
 * - Check viewport bounds to determine visible entities
 * - Skip rendering of off-screen entities
 * - Add margin for entities near viewport edge
 * - Optimize culling check frequency
 * 
 * Requirements: 9.3
 * Phase 9, Task 53
 */

class CullingSystem {
  constructor(scene, entityRegistry) {
    this.scene = scene;
    this.entityRegistry = entityRegistry;
    
    // Culling configuration
    this.config = {
      margin: 100,           // pixels outside viewport to still render
      checkInterval: 100,    // ms between culling checks
      enabled: true          // can be disabled for debugging
    };
    
    // Culling state
    this.state = {
      lastCheckTime: 0,
      visibleEntities: new Set(),
      culledEntities: new Set()
    };
    
    // Statistics
    this.stats = {
      totalEntities: 0,
      visibleEntities: 0,
      culledEntities: 0,
      checksPerformed: 0
    };
  }
  
  /**
   * Enable culling system
   */
  enable() {
    this.config.enabled = true;
  }
  
  /**
   * Disable culling system (all entities visible)
   */
  disable() {
    this.config.enabled = false;
    
    // Make all entities visible
    this.state.culledEntities.forEach(entityId => {
      const entity = this.entityRegistry.getEntity(entityId);
      if (entity) {
        this.setEntityVisible(entity, true);
      }
    });
    
    this.state.culledEntities.clear();
  }
  
  /**
   * Set culling margin
   * @param {number} margin - Margin in pixels
   */
  setMargin(margin) {
    this.config.margin = margin;
  }
  
  /**
   * Set culling check interval
   * @param {number} interval - Interval in milliseconds
   */
  setCheckInterval(interval) {
    this.config.checkInterval = interval;
  }
  
  /**
   * Get viewport bounds in world coordinates
   * @returns {object} Viewport bounds {minX, minY, maxX, maxY}
   */
  getViewportBounds() {
    const camera = this.scene.getCameraState();
    const viewport = this.scene.viewport;
    const margin = this.config.margin;
    
    // Calculate viewport bounds in world coordinates with margin
    const minX = camera.x - (margin / camera.zoom);
    const minY = camera.y - (margin / camera.zoom);
    const maxX = camera.x + (viewport.width / camera.zoom) + (margin / camera.zoom);
    const maxY = camera.y + (viewport.height / camera.zoom) + (margin / camera.zoom);
    
    return { minX, minY, maxX, maxY };
  }
  
  /**
   * Check if entity is within viewport bounds
   * @param {Entity} entity - Entity to check
   * @param {object} bounds - Viewport bounds
   * @returns {boolean} True if entity is visible
   */
  isEntityVisible(entity, bounds) {
    // Get entity position
    const position = entity.getComponent('position');
    if (!position) {
      // Entities without position are always visible (e.g., UI elements)
      return true;
    }
    
    // Get entity sprite for size information
    const sprite = entity.getComponent('sprite');
    const entityWidth = sprite?.width || 64;  // Default to grid size
    const entityHeight = sprite?.height || 64;
    
    // Calculate entity bounds
    const entityMinX = position.x - entityWidth / 2;
    const entityMinY = position.y - entityHeight / 2;
    const entityMaxX = position.x + entityWidth / 2;
    const entityMaxY = position.y + entityHeight / 2;
    
    // Check if entity bounds intersect with viewport bounds
    const visible = !(
      entityMaxX < bounds.minX ||
      entityMinX > bounds.maxX ||
      entityMaxY < bounds.minY ||
      entityMinY > bounds.maxY
    );
    
    return visible;
  }
  
  /**
   * Set entity visibility
   * @param {Entity} entity - Entity to update
   * @param {boolean} visible - Visibility state
   */
  setEntityVisible(entity, visible) {
    const sprite = entity.getComponent('sprite');
    if (sprite && sprite.pixiSprite) {
      sprite.pixiSprite.visible = visible;
    }
    
    // Also handle animation component visibility
    const animation = entity.getComponent('animation');
    if (animation && animation.pixiSprite) {
      animation.pixiSprite.visible = visible;
    }
  }
  
  /**
   * Perform culling check on all entities
   */
  performCullingCheck() {
    if (!this.config.enabled) {
      return;
    }
    
    const bounds = this.getViewportBounds();
    const entities = this.entityRegistry.getActiveEntities();
    
    let visibleCount = 0;
    let culledCount = 0;
    
    entities.forEach(entity => {
      const visible = this.isEntityVisible(entity, bounds);
      
      if (visible) {
        visibleCount++;
        
        // Entity became visible
        if (this.state.culledEntities.has(entity.id)) {
          this.setEntityVisible(entity, true);
          this.state.culledEntities.delete(entity.id);
          this.state.visibleEntities.add(entity.id);
        }
      } else {
        culledCount++;
        
        // Entity became culled
        if (!this.state.culledEntities.has(entity.id)) {
          this.setEntityVisible(entity, false);
          this.state.visibleEntities.delete(entity.id);
          this.state.culledEntities.add(entity.id);
        }
      }
    });
    
    // Update statistics
    this.stats.totalEntities = entities.length;
    this.stats.visibleEntities = visibleCount;
    this.stats.culledEntities = culledCount;
    this.stats.checksPerformed++;
  }
  
  /**
   * Update culling system
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    if (!this.config.enabled) {
      return;
    }
    
    // Check if it's time to perform culling check
    this.state.lastCheckTime += deltaTime;
    
    if (this.state.lastCheckTime >= this.config.checkInterval) {
      this.performCullingCheck();
      this.state.lastCheckTime = 0;
    }
  }
  
  /**
   * Force immediate culling check
   */
  forceCheck() {
    this.performCullingCheck();
    this.state.lastCheckTime = 0;
  }
  
  /**
   * Get culling statistics
   * @returns {object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      enabled: this.config.enabled,
      margin: this.config.margin,
      checkInterval: this.config.checkInterval,
      cullingRatio: this.stats.totalEntities > 0 
        ? (this.stats.culledEntities / this.stats.totalEntities * 100).toFixed(1) + '%'
        : '0%'
    };
  }
  
  /**
   * Get count of visible entities
   * @returns {number} Number of visible entities
   */
  getVisibleCount() {
    return this.stats.visibleEntities;
  }
  
  /**
   * Get list of visible entity IDs
   * @returns {string[]} Array of visible entity IDs
   */
  getVisibleEntityIds() {
    return Array.from(this.state.visibleEntities);
  }
  
  /**
   * Get list of culled entity IDs
   * @returns {string[]} Array of culled entity IDs
   */
  getCulledEntityIds() {
    return Array.from(this.state.culledEntities);
  }
  
  /**
   * Check if specific entity is currently visible
   * @param {string} entityId - Entity ID
   * @returns {boolean} True if entity is visible
   */
  isEntityCurrentlyVisible(entityId) {
    return this.state.visibleEntities.has(entityId);
  }
  
  /**
   * Reset culling state
   */
  reset() {
    // Make all culled entities visible
    this.state.culledEntities.forEach(entityId => {
      const entity = this.entityRegistry.getEntity(entityId);
      if (entity) {
        this.setEntityVisible(entity, true);
      }
    });
    
    this.state.visibleEntities.clear();
    this.state.culledEntities.clear();
    this.state.lastCheckTime = 0;
    
    // Reset statistics
    this.stats = {
      totalEntities: 0,
      visibleEntities: 0,
      culledEntities: 0,
      checksPerformed: 0
    };
  }
  
  /**
   * Destroy culling system and cleanup
   */
  destroy() {
    this.reset();
  }
}

export default CullingSystem;
