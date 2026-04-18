/**
 * Entity Class - Base class for all game entities
 * 
 * Implements a component-based architecture where entities are composed
 * of components rather than using inheritance. This provides flexibility
 * and allows entities to be dynamically configured.
 * 
 * Requirements: 2.1, 2.5
 * Phase 2, Task 7
 */

class Entity {
  /**
   * Create a new entity
   * @param {string} id - Unique identifier for the entity
   * @param {string} type - Entity type (agent, task, environment, department)
   */
  constructor(id, type) {
    this.id = id;
    this.type = type;
    
    // Component storage - Map of component type to component data
    this.components = new Map();
    
    // Lifecycle state
    this.active = true;
    this.destroyed = false;
    
    // Creation timestamp
    this.createdAt = Date.now();
    
    // Update timestamp
    this.updatedAt = Date.now();
  }
  
  /**
   * Add a component to this entity
   * @param {string} componentType - Type of component (e.g., 'position', 'sprite')
   * @param {object} componentData - Component data
   * @returns {Entity} This entity for chaining
   */
  addComponent(componentType, componentData) {
    if (this.destroyed) {
      console.warn(`Cannot add component to destroyed entity ${this.id}`);
      return this;
    }
    
    this.components.set(componentType, componentData);
    this.updatedAt = Date.now();
    return this;
  }
  
  /**
   * Get a component from this entity
   * @param {string} componentType - Type of component to get
   * @returns {object|null} Component data or null if not found
   */
  getComponent(componentType) {
    return this.components.get(componentType) || null;
  }
  
  /**
   * Check if entity has a specific component
   * @param {string} componentType - Type of component to check
   * @returns {boolean} True if entity has the component
   */
  hasComponent(componentType) {
    return this.components.has(componentType);
  }
  
  /**
   * Remove a component from this entity
   * @param {string} componentType - Type of component to remove
   * @returns {boolean} True if component was removed
   */
  removeComponent(componentType) {
    if (this.destroyed) {
      console.warn(`Cannot remove component from destroyed entity ${this.id}`);
      return false;
    }
    
    const removed = this.components.delete(componentType);
    if (removed) {
      this.updatedAt = Date.now();
    }
    return removed;
  }
  
  /**
   * Get all components on this entity
   * @returns {Map} Map of component type to component data
   */
  getAllComponents() {
    return new Map(this.components);
  }
  
  /**
   * Update entity state
   * Called every frame by systems that manage this entity
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    if (this.destroyed) {
      return;
    }
    
    // Base update logic - can be overridden by subclasses
    // Most update logic should be in systems, not entities
  }
  
  /**
   * Activate the entity
   * Active entities are updated and rendered
   */
  activate() {
    this.active = true;
    this.updatedAt = Date.now();
  }
  
  /**
   * Deactivate the entity
   * Inactive entities are not updated or rendered but still exist
   */
  deactivate() {
    this.active = false;
    this.updatedAt = Date.now();
  }
  
  /**
   * Destroy the entity
   * Marks entity for removal and cleanup
   * Should be called by EntityRegistry, not directly
   */
  destroy() {
    if (this.destroyed) {
      return;
    }
    
    this.destroyed = true;
    this.active = false;
    this.components.clear();
    this.updatedAt = Date.now();
  }
  
  /**
   * Check if entity is active
   * @returns {boolean} True if entity is active
   */
  isActive() {
    return this.active && !this.destroyed;
  }
  
  /**
   * Check if entity is destroyed
   * @returns {boolean} True if entity is destroyed
   */
  isDestroyed() {
    return this.destroyed;
  }
  
  /**
   * Get entity age in milliseconds
   * @returns {number} Age in milliseconds
   */
  getAge() {
    return Date.now() - this.createdAt;
  }
  
  /**
   * Get time since last update in milliseconds
   * @returns {number} Time since last update
   */
  getTimeSinceUpdate() {
    return Date.now() - this.updatedAt;
  }
  
  /**
   * Serialize entity to JSON
   * Useful for debugging and state inspection
   * @returns {object} JSON representation of entity
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      active: this.active,
      destroyed: this.destroyed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      components: Array.from(this.components.entries()).map(([type, data]) => ({
        type,
        data
      }))
    };
  }
  
  /**
   * Create entity from JSON
   * @param {object} json - JSON representation
   * @returns {Entity} Reconstructed entity
   */
  static fromJSON(json) {
    const entity = new Entity(json.id, json.type);
    entity.active = json.active;
    entity.destroyed = json.destroyed;
    entity.createdAt = json.createdAt;
    entity.updatedAt = json.updatedAt;
    
    // Restore components
    if (json.components) {
      json.components.forEach(({ type, data }) => {
        entity.addComponent(type, data);
      });
    }
    
    return entity;
  }
}

export default Entity;
