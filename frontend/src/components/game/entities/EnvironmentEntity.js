/**
 * EnvironmentEntity - Specialized entity class for environment objects
 * 
 * Represents furniture, equipment, and environmental objects in the game world.
 * Extends the base Entity class with environment-specific functionality.
 * 
 * Requirements: 2.3
 * Phase 2, Task 10
 */

import Entity from './Entity.js';
import {
  createPositionComponent,
  createSpriteComponent,
  createInteractionComponent
} from './components/index.js';

/**
 * Environment entity types (furniture and objects)
 */
export const EnvironmentType = {
  // Workstations
  DESK: 'desk',
  COMPUTER: 'computer',
  CHAIR: 'chair',
  MONITOR: 'monitor',
  
  // Meeting spaces
  MEETING_ROOM: 'meeting_room',
  CONFERENCE_TABLE: 'conference_table',
  
  // Amenities
  COFFEE_MACHINE: 'coffee_machine',
  WATER_COOLER: 'water_cooler',
  PLANT: 'plant',
  
  // Work tools
  WHITEBOARD: 'whiteboard',
  FILING_CABINET: 'filing_cabinet',
  BOOKSHELF: 'bookshelf',
  PRINTER: 'printer',
  
  // Decorations
  WALL_ART: 'wall_art',
  LAMP: 'lamp',
  CLOCK: 'clock',
  
  // Infrastructure
  SERVER_RACK: 'server_rack',
  SECURITY_MONITOR: 'security_monitor'
};

/**
 * Environment entity metadata by type
 */
const ENVIRONMENT_METADATA = {
  [EnvironmentType.DESK]: {
    name: 'Desk',
    description: 'A workstation desk',
    size: { width: 96, height: 64 },
    interactable: false,
    occupiable: true,
    blocksMovement: true,
    layer: 'furniture_back',
    sprite: 'desk'
  },
  [EnvironmentType.COMPUTER]: {
    name: 'Computer',
    description: 'A desktop computer',
    size: { width: 32, height: 32 },
    interactable: true,
    occupiable: false,
    blocksMovement: false,
    layer: 'furniture_front',
    sprite: 'computer_off',
    states: ['off', 'on', 'working']
  },
  [EnvironmentType.CHAIR]: {
    name: 'Chair',
    description: 'An office chair',
    size: { width: 32, height: 32 },
    interactable: false,
    occupiable: true,
    blocksMovement: true,
    layer: 'furniture_back',
    sprite: 'chair'
  },
  [EnvironmentType.MONITOR]: {
    name: 'Monitor',
    description: 'A computer monitor',
    size: { width: 48, height: 32 },
    interactable: false,
    occupiable: false,
    blocksMovement: false,
    layer: 'furniture_front',
    sprite: 'monitor',
    states: ['off', 'on', 'active']
  },
  [EnvironmentType.MEETING_ROOM]: {
    name: 'Meeting Room',
    description: 'A private meeting space',
    size: { width: 192, height: 128 },
    interactable: true,
    occupiable: true,
    blocksMovement: false,
    layer: 'background',
    sprite: 'meeting_room',
    capacity: 4
  },
  [EnvironmentType.CONFERENCE_TABLE]: {
    name: 'Conference Table',
    description: 'A large meeting table',
    size: { width: 128, height: 96 },
    interactable: false,
    occupiable: false,
    blocksMovement: true,
    layer: 'furniture_back',
    sprite: 'conference_table'
  },
  [EnvironmentType.COFFEE_MACHINE]: {
    name: 'Coffee Machine',
    description: 'A coffee maker for the team',
    size: { width: 32, height: 48 },
    interactable: true,
    occupiable: false,
    blocksMovement: true,
    layer: 'furniture_front',
    sprite: 'coffee_machine',
    states: ['idle', 'brewing']
  },
  [EnvironmentType.WATER_COOLER]: {
    name: 'Water Cooler',
    description: 'A water dispenser',
    size: { width: 32, height: 48 },
    interactable: true,
    occupiable: false,
    blocksMovement: true,
    layer: 'furniture_front',
    sprite: 'water_cooler'
  },
  [EnvironmentType.PLANT]: {
    name: 'Plant',
    description: 'A decorative plant',
    size: { width: 32, height: 48 },
    interactable: false,
    occupiable: false,
    blocksMovement: true,
    layer: 'furniture_front',
    sprite: 'plant'
  },
  [EnvironmentType.WHITEBOARD]: {
    name: 'Whiteboard',
    description: 'A whiteboard for brainstorming',
    size: { width: 96, height: 64 },
    interactable: true,
    occupiable: false,
    blocksMovement: true,
    layer: 'furniture_back',
    sprite: 'whiteboard'
  },
  [EnvironmentType.FILING_CABINET]: {
    name: 'Filing Cabinet',
    description: 'A cabinet for storing documents',
    size: { width: 48, height: 64 },
    interactable: true,
    occupiable: false,
    blocksMovement: true,
    layer: 'furniture_front',
    sprite: 'filing_cabinet'
  },
  [EnvironmentType.BOOKSHELF]: {
    name: 'Bookshelf',
    description: 'A shelf with books and resources',
    size: { width: 64, height: 96 },
    interactable: false,
    occupiable: false,
    blocksMovement: true,
    layer: 'furniture_back',
    sprite: 'bookshelf'
  },
  [EnvironmentType.PRINTER]: {
    name: 'Printer',
    description: 'An office printer',
    size: { width: 48, height: 48 },
    interactable: true,
    occupiable: false,
    blocksMovement: true,
    layer: 'furniture_front',
    sprite: 'printer',
    states: ['idle', 'printing']
  },
  [EnvironmentType.WALL_ART]: {
    name: 'Wall Art',
    description: 'Decorative wall art',
    size: { width: 64, height: 48 },
    interactable: false,
    occupiable: false,
    blocksMovement: false,
    layer: 'furniture_back',
    sprite: 'wall_art'
  },
  [EnvironmentType.LAMP]: {
    name: 'Lamp',
    description: 'A desk lamp',
    size: { width: 24, height: 32 },
    interactable: true,
    occupiable: false,
    blocksMovement: false,
    layer: 'furniture_front',
    sprite: 'lamp',
    states: ['off', 'on']
  },
  [EnvironmentType.CLOCK]: {
    name: 'Clock',
    description: 'A wall clock',
    size: { width: 32, height: 32 },
    interactable: false,
    occupiable: false,
    blocksMovement: false,
    layer: 'furniture_back',
    sprite: 'clock'
  },
  [EnvironmentType.SERVER_RACK]: {
    name: 'Server Rack',
    description: 'Backend server infrastructure',
    size: { width: 64, height: 128 },
    interactable: true,
    occupiable: false,
    blocksMovement: true,
    layer: 'furniture_front',
    sprite: 'server_rack',
    states: ['idle', 'active', 'busy']
  },
  [EnvironmentType.SECURITY_MONITOR]: {
    name: 'Security Monitor',
    description: 'A security monitoring display',
    size: { width: 48, height: 32 },
    interactable: true,
    occupiable: false,
    blocksMovement: false,
    layer: 'furniture_front',
    sprite: 'security_monitor'
  }
};;

/**
 * Workstation configuration
 * Defines which furniture pieces make up a complete workstation
 */
export const WorkstationConfig = {
  BASIC: {
    name: 'Basic Workstation',
    furniture: [
      { type: EnvironmentType.DESK, offset: { x: 0, y: 0 } },
      { type: EnvironmentType.CHAIR, offset: { x: 0, y: 32 } },
      { type: EnvironmentType.COMPUTER, offset: { x: 32, y: -16 } }
    ]
  },
  ADVANCED: {
    name: 'Advanced Workstation',
    furniture: [
      { type: EnvironmentType.DESK, offset: { x: 0, y: 0 } },
      { type: EnvironmentType.CHAIR, offset: { x: 0, y: 32 } },
      { type: EnvironmentType.MONITOR, offset: { x: 24, y: -16 } },
      { type: EnvironmentType.MONITOR, offset: { x: 56, y: -16 } },
      { type: EnvironmentType.LAMP, offset: { x: -24, y: -8 } }
    ]
  },
  MEETING: {
    name: 'Meeting Space',
    furniture: [
      { type: EnvironmentType.CONFERENCE_TABLE, offset: { x: 0, y: 0 } },
      { type: EnvironmentType.CHAIR, offset: { x: -48, y: 0 } },
      { type: EnvironmentType.CHAIR, offset: { x: 48, y: 0 } },
      { type: EnvironmentType.CHAIR, offset: { x: 0, y: -48 } },
      { type: EnvironmentType.CHAIR, offset: { x: 0, y: 48 } },
      { type: EnvironmentType.WHITEBOARD, offset: { x: 0, y: -96 } }
    ]
  }
};

/**
 * EnvironmentEntity class - Specialized entity for furniture and objects
 */
class EnvironmentEntity extends Entity {
  /**
   * Create a new environment entity
   * @param {string} id - Unique identifier
   * @param {string} environmentType - Type of environment entity (from EnvironmentType enum)
   */
  constructor(id, environmentType) {
    super(id, 'environment');
    
    // Validate environment type
    if (!Object.values(EnvironmentType).includes(environmentType)) {
      throw new Error(`Invalid environment type: ${environmentType}`);
    }
    
    this.environmentType = environmentType;
    
    // Get metadata for this environment type
    const metadata = ENVIRONMENT_METADATA[environmentType];
    this.metadata = {
      name: metadata.name,
      description: metadata.description,
      size: { ...metadata.size },
      interactable: metadata.interactable,
      occupiable: metadata.occupiable,
      blocksMovement: metadata.blocksMovement,
      layer: metadata.layer,
      sprite: metadata.sprite,
      states: metadata.states ? [...metadata.states] : null,
      capacity: metadata.capacity || 1
    };
    
    // Current state (for entities with states)
    this.currentState = this.metadata.states ? this.metadata.states[0] : null;
    
    // Occupancy tracking
    this.occupiedBy = null; // AgentId or null
    this.occupants = []; // Array of AgentIds for multi-occupancy
    
    // Department assignment
    this.assignedDepartment = null;
    
    // Workstation group (if part of a workstation)
    this.workstationId = null;
    this.workstationRole = null; // 'desk', 'chair', 'computer', etc.
  }
  
  /**
   * Get current state
   * @returns {string|null} Current state or null if no states
   */
  getState() {
    return this.currentState;
  }
  
  /**
   * Set entity state
   * @param {string} newState - New state to set
   * @returns {boolean} True if state was set successfully
   */
  setState(newState) {
    if (!this.metadata.states) {
      console.warn(`Entity ${this.id} does not have states`);
      return false;
    }
    
    if (!this.metadata.states.includes(newState)) {
      console.warn(`Invalid state ${newState} for entity ${this.id}`);
      return false;
    }
    
    const oldState = this.currentState;
    this.currentState = newState;
    this.updatedAt = Date.now();
    
    // Trigger state change callback if exists
    if (this.onStateChange) {
      this.onStateChange(oldState, newState);
    }
    
    return true;
  }
  
  /**
   * Check if entity is occupied
   * @returns {boolean} True if occupied
   */
  isOccupied() {
    if (this.metadata.capacity > 1) {
      return this.occupants.length >= this.metadata.capacity;
    }
    return this.occupiedBy !== null;
  }
  
  /**
   * Check if entity can be occupied
   * @returns {boolean} True if occupiable and not full
   */
  canBeOccupied() {
    return this.metadata.occupiable && !this.isOccupied();
  }
  
  /**
   * Occupy entity with agent
   * @param {string} agentId - Agent ID
   * @returns {boolean} True if successfully occupied
   */
  occupy(agentId) {
    if (!this.metadata.occupiable) {
      console.warn(`Entity ${this.id} is not occupiable`);
      return false;
    }
    
    if (this.isOccupied()) {
      console.warn(`Entity ${this.id} is already occupied`);
      return false;
    }
    
    if (this.metadata.capacity > 1) {
      this.occupants.push(agentId);
    } else {
      this.occupiedBy = agentId;
    }
    
    this.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Release occupancy
   * @param {string} agentId - Agent ID to release (optional for single occupancy)
   * @returns {boolean} True if successfully released
   */
  release(agentId = null) {
    if (this.metadata.capacity > 1) {
      if (!agentId) {
        console.warn(`Agent ID required for multi-occupancy entity ${this.id}`);
        return false;
      }
      
      const index = this.occupants.indexOf(agentId);
      if (index === -1) {
        console.warn(`Agent ${agentId} not found in occupants of ${this.id}`);
        return false;
      }
      
      this.occupants.splice(index, 1);
    } else {
      this.occupiedBy = null;
    }
    
    this.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Get occupant(s)
   * @returns {string|string[]|null} Agent ID, array of IDs, or null
   */
  getOccupants() {
    if (this.metadata.capacity > 1) {
      return [...this.occupants];
    }
    return this.occupiedBy;
  }
  
  /**
   * Assign to department
   * @param {string} departmentId - Department ID
   */
  assignToDepartment(departmentId) {
    this.assignedDepartment = departmentId;
    this.updatedAt = Date.now();
  }
  
  /**
   * Get assigned department
   * @returns {string|null} Department ID or null
   */
  getDepartment() {
    return this.assignedDepartment;
  }
  
  /**
   * Assign to workstation group
   * @param {string} workstationId - Workstation ID
   * @param {string} role - Role in workstation (desk, chair, computer, etc.)
   */
  assignToWorkstation(workstationId, role) {
    this.workstationId = workstationId;
    this.workstationRole = role;
    this.updatedAt = Date.now();
  }
  
  /**
   * Get workstation assignment
   * @returns {{workstationId: string, role: string}|null} Workstation info or null
   */
  getWorkstation() {
    if (!this.workstationId) return null;
    return {
      workstationId: this.workstationId,
      role: this.workstationRole
    };
  }
  
  /**
   * Check if entity blocks movement
   * @returns {boolean} True if blocks movement
   */
  blocksMovement() {
    return this.metadata.blocksMovement;
  }
  
  /**
   * Check if entity is interactable
   * @returns {boolean} True if interactable
   */
  isInteractable() {
    return this.metadata.interactable;
  }
  
  /**
   * Get entity size
   * @returns {{width: number, height: number}} Size in pixels
   */
  getSize() {
    return { ...this.metadata.size };
  }
  
  /**
   * Get render layer
   * @returns {string} Layer name
   */
  getLayer() {
    return this.metadata.layer;
  }
  
  /**
   * Serialize environment entity to JSON
   * @returns {object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      environmentType: this.environmentType,
      metadata: this.metadata,
      currentState: this.currentState,
      occupiedBy: this.occupiedBy,
      occupants: this.occupants,
      assignedDepartment: this.assignedDepartment,
      workstationId: this.workstationId,
      workstationRole: this.workstationRole
    };
  }
  
  /**
   * Create environment entity from JSON
   * @param {object} json - JSON representation
   * @returns {EnvironmentEntity} Reconstructed entity
   */
  static fromJSON(json) {
    const entity = new EnvironmentEntity(json.id, json.environmentType);
    
    // Restore base entity properties
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
    
    // Restore environment-specific properties
    entity.currentState = json.currentState;
    entity.occupiedBy = json.occupiedBy;
    entity.occupants = json.occupants || [];
    entity.assignedDepartment = json.assignedDepartment;
    entity.workstationId = json.workstationId;
    entity.workstationRole = json.workstationRole;
    
    return entity;
  }
}

/**
 * Factory function to create a fully configured environment entity
 * @param {string} environmentType - Type of environment entity
 * @param {object} position - Initial position {x, y, z}
 * @param {string} departmentId - Department ID (optional)
 * @param {string} id - Optional custom ID
 * @returns {EnvironmentEntity} Configured environment entity
 */
export function createEnvironment(environmentType, position = { x: 0, y: 0, z: 0 }, departmentId = null, id = null) {
  // Generate ID if not provided
  const entityId = id || `env-${environmentType}-${Date.now()}`;
  
  // Create environment entity
  const entity = new EnvironmentEntity(entityId, environmentType);
  
  // Add position component
  entity.addComponent('position', createPositionComponent(position.x, position.y, position.z));
  
  // Add sprite component
  const metadata = ENVIRONMENT_METADATA[environmentType];
  entity.addComponent('sprite', createSpriteComponent(
    metadata.sprite,
    1.0,
    0,
    0xFFFFFF // White tint (no color change)
  ));
  
  // Add interaction component if interactable
  if (metadata.interactable) {
    const contextMenu = [
      { label: 'View Details', action: 'show_details' },
      { label: 'Inspect', action: 'inspect' }
    ];
    entity.addComponent('interaction', createInteractionComponent(true, true, false, contextMenu));
  }
  
  // Assign to department if provided
  if (departmentId) {
    entity.assignToDepartment(departmentId);
  }
  
  return entity;
}

/**
 * Create a complete workstation with multiple furniture pieces
 * @param {string} workstationType - Type of workstation (BASIC, ADVANCED, MEETING)
 * @param {object} position - Base position {x, y, z}
 * @param {string} departmentId - Department ID
 * @param {string} workstationId - Optional workstation ID
 * @returns {EnvironmentEntity[]} Array of environment entities
 */
export function createWorkstation(workstationType, position, departmentId, workstationId = null) {
  const config = WorkstationConfig[workstationType];
  if (!config) {
    throw new Error(`Invalid workstation type: ${workstationType}`);
  }
  
  const wsId = workstationId || `workstation-${Date.now()}`;
  const entities = [];
  
  config.furniture.forEach((furnitureSpec, index) => {
    const furniturePos = {
      x: position.x + furnitureSpec.offset.x,
      y: position.y + furnitureSpec.offset.y,
      z: position.z || 0
    };
    
    const entity = createEnvironment(
      furnitureSpec.type,
      furniturePos,
      departmentId,
      `${wsId}-${furnitureSpec.type}-${index}`
    );
    
    // Assign to workstation group
    entity.assignToWorkstation(wsId, furnitureSpec.type);
    
    entities.push(entity);
  });
  
  return entities;
}

/**
 * Get all environment types
 * @returns {Array} Array of environment type strings
 */
export function getAllEnvironmentTypes() {
  return Object.values(EnvironmentType);
}

/**
 * Get environment metadata by type
 * @param {string} environmentType - Environment type
 * @returns {object} Environment metadata
 */
export function getEnvironmentMetadata(environmentType) {
  return ENVIRONMENT_METADATA[environmentType] ? { ...ENVIRONMENT_METADATA[environmentType] } : null;
}

/**
 * Get all workstation types
 * @returns {Array} Array of workstation type strings
 */
export function getAllWorkstationTypes() {
  return Object.keys(WorkstationConfig);
}

/**
 * Get workstation configuration
 * @param {string} workstationType - Workstation type
 * @returns {object} Workstation configuration
 */
export function getWorkstationConfig(workstationType) {
  return WorkstationConfig[workstationType] ? { ...WorkstationConfig[workstationType] } : null;
}

export default EnvironmentEntity;
