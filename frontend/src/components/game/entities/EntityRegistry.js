/**
 * EntityRegistry Class - Manages all entities in the game world
 * 
 * Provides centralized entity management including:
 * - Entity creation and destruction
 * - Entity lookup by ID or type
 * - Entity lifecycle management
 * - Entity queries and filtering
 * 
 * Requirements: 2.1, 2.5
 * Phase 2, Task 7
 */

import Entity from './Entity.js';

class EntityRegistry {
  constructor() {
    // Map of entity ID to entity instance
    this.entities = new Map();
    
    // Map of entity type to Set of entity IDs
    this.entitiesByType = new Map();
    
    // Counter for generating unique IDs
    this.nextId = 1;
    
    // Statistics
    this.stats = {
      created: 0,
      destroyed: 0,
      active: 0
    };
  }
  
  /**
   * Generate a unique entity ID
   * @param {string} prefix - Optional prefix for the ID
   * @returns {string} Unique entity ID
   */
  generateId(prefix = 'entity') {
    const id = `${prefix}-${this.nextId}`;
    this.nextId++;
    return id;
  }
  
  /**
   * Create a new entity
   * @param {string} type - Entity type
   * @param {string} id - Optional custom ID (auto-generated if not provided)
   * @returns {Entity} The created entity
   */
  createEntity(type, id = null) {
    // Generate ID if not provided
    const entityId = id || this.generateId(type);
    
    // Check if entity with this ID already exists
    if (this.entities.has(entityId)) {
      console.warn(`Entity with ID ${entityId} already exists`);
      return this.entities.get(entityId);
    }
    
    // Create new entity
    const entity = new Entity(entityId, type);
    
    // Register entity
    this.entities.set(entityId, entity);
    
    // Add to type index
    if (!this.entitiesByType.has(type)) {
      this.entitiesByType.set(type, new Set());
    }
    this.entitiesByType.get(type).add(entityId);
    
    // Update stats
    this.stats.created++;
    this.stats.active++;
    
    return entity;
  }
  
  /**
   * Get an entity by ID
   * @param {string} id - Entity ID
   * @returns {Entity|null} Entity or null if not found
   */
  getEntity(id) {
    return this.entities.get(id) || null;
  }
  
  /**
   * Check if an entity exists
   * @param {string} id - Entity ID
   * @returns {boolean} True if entity exists
   */
  hasEntity(id) {
    return this.entities.has(id);
  }
  
  /**
   * Get all entities of a specific type
   * @param {string} type - Entity type
   * @returns {Entity[]} Array of entities
   */
  getEntitiesByType(type) {
    const ids = this.entitiesByType.get(type);
    if (!ids) {
      return [];
    }
    
    return Array.from(ids)
      .map(id => this.entities.get(id))
      .filter(entity => entity && !entity.isDestroyed());
  }
  
  /**
   * Get all entities with a specific component
   * @param {string} componentType - Component type
   * @returns {Entity[]} Array of entities
   */
  getEntitiesWithComponent(componentType) {
    const result = [];
    
    for (const entity of this.entities.values()) {
      if (!entity.isDestroyed() && entity.hasComponent(componentType)) {
        result.push(entity);
      }
    }
    
    return result;
  }
  
  /**
   * Get all active entities
   * @returns {Entity[]} Array of active entities
   */
  getActiveEntities() {
    const result = [];
    
    for (const entity of this.entities.values()) {
      if (entity.isActive()) {
        result.push(entity);
      }
    }
    
    return result;
  }
  
  /**
   * Get all entities
   * @returns {Entity[]} Array of all entities
   */
  getAllEntities() {
    return Array.from(this.entities.values());
  }
  
  /**
   * Query entities with custom filter
   * @param {function} filterFn - Filter function (entity) => boolean
   * @returns {Entity[]} Array of matching entities
   */
  queryEntities(filterFn) {
    const result = [];
    
    for (const entity of this.entities.values()) {
      if (!entity.isDestroyed() && filterFn(entity)) {
        result.push(entity);
      }
    }
    
    return result;
  }
  
  /**
   * Destroy an entity
   * @param {string} id - Entity ID
   * @returns {boolean} True if entity was destroyed
   */
  destroyEntity(id) {
    const entity = this.entities.get(id);
    
    if (!entity) {
      console.warn(`Cannot destroy entity ${id}: not found`);
      return false;
    }
    
    if (entity.isDestroyed()) {
      console.warn(`Entity ${id} is already destroyed`);
      return false;
    }
    
    // Mark entity as destroyed
    entity.destroy();
    
    // Remove from type index
    const typeSet = this.entitiesByType.get(entity.type);
    if (typeSet) {
      typeSet.delete(id);
    }
    
    // Remove from main registry
    this.entities.delete(id);
    
    // Update stats
    this.stats.destroyed++;
    this.stats.active--;
    
    return true;
  }
  
  /**
   * Destroy all entities of a specific type
   * @param {string} type - Entity type
   * @returns {number} Number of entities destroyed
   */
  destroyEntitiesByType(type) {
    const entities = this.getEntitiesByType(type);
    let count = 0;
    
    entities.forEach(entity => {
      if (this.destroyEntity(entity.id)) {
        count++;
      }
    });
    
    return count;
  }
  
  /**
   * Destroy all entities
   * @returns {number} Number of entities destroyed
   */
  destroyAllEntities() {
    const entities = this.getAllEntities();
    let count = 0;
    
    entities.forEach(entity => {
      if (this.destroyEntity(entity.id)) {
        count++;
      }
    });
    
    return count;
  }
  
  /**
   * Update all active entities
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    for (const entity of this.entities.values()) {
      if (entity.isActive()) {
        entity.update(deltaTime);
      }
    }
  }
  
  /**
   * Get entity count
   * @returns {number} Total number of entities
   */
  getEntityCount() {
    return this.entities.size;
  }
  
  /**
   * Get entity count by type
   * @param {string} type - Entity type
   * @returns {number} Number of entities of this type
   */
  getEntityCountByType(type) {
    const ids = this.entitiesByType.get(type);
    return ids ? ids.size : 0;
  }
  
  /**
   * Get registry statistics
   * @returns {object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      total: this.entities.size,
      byType: Array.from(this.entitiesByType.entries()).map(([type, ids]) => ({
        type,
        count: ids.size
      }))
    };
  }
  
  /**
   * Clear the registry
   * Destroys all entities and resets state
   */
  clear() {
    this.destroyAllEntities();
    this.entities.clear();
    this.entitiesByType.clear();
    this.nextId = 1;
    this.stats = {
      created: 0,
      destroyed: 0,
      active: 0
    };
  }
  
  /**
   * Serialize registry to JSON
   * @returns {object} JSON representation
   */
  toJSON() {
    return {
      entities: Array.from(this.entities.values()).map(e => e.toJSON()),
      stats: this.getStats(),
      nextId: this.nextId
    };
  }
  
  /**
   * Load registry from JSON
   * @param {object} json - JSON representation
   */
  fromJSON(json) {
    this.clear();
    
    // Restore next ID
    this.nextId = json.nextId || 1;
    
    // Restore entities
    if (json.entities) {
      json.entities.forEach(entityJson => {
        const entity = Entity.fromJSON(entityJson);
        this.entities.set(entity.id, entity);
        
        // Rebuild type index
        if (!this.entitiesByType.has(entity.type)) {
          this.entitiesByType.set(entity.type, new Set());
        }
        this.entitiesByType.get(entity.type).add(entity.id);
        
        // Update stats
        if (!entity.isDestroyed()) {
          this.stats.active++;
        }
      });
    }
    
    // Restore stats
    if (json.stats) {
      this.stats.created = json.stats.created || 0;
      this.stats.destroyed = json.stats.destroyed || 0;
    }
  }
}

export default EntityRegistry;
