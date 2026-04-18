/**
 * DepartmentEntity - Specialized entity class for office departments
 * 
 * Represents organizational departments in the game world with agents and furniture.
 * Extends the base Entity class with department-specific functionality.
 * 
 * Requirements: 5.2, 5.3
 * Phase 2, Task 11
 */

import Entity from './Entity.js';
import { createPositionComponent } from './components/index.js';

/**
 * Department types
 */
export const DepartmentType = {
  CONTENT_CREATION: 'content_creation',
  PUBLISHING: 'publishing',
  TREND_ANALYSIS: 'trend_analysis',
  CUSTOMER_SUPPORT: 'customer_support',
  ADMINISTRATION: 'administration'
};

/**
 * Department metadata by type
 */
const DEPARTMENT_METADATA = {
  [DepartmentType.CONTENT_CREATION]: {
    name: 'Content Creation',
    description: 'Creates engaging social media content using AI',
    color: 0x4F46E5, // Indigo
    icon: '✍️',
    capabilities: ['generate_post', 'write_caption', 'suggest_hashtags'],
    defaultFurniture: [
      { type: 'desk', count: 3 },
      { type: 'computer', count: 3 },
      { type: 'chair', count: 3 },
      { type: 'whiteboard', count: 1 },
      { type: 'coffee_machine', count: 1 },
      { type: 'bookshelf', count: 1 },
      { type: 'plant', count: 2 }
    ]
  },
  [DepartmentType.PUBLISHING]: {
    name: 'Publishing',
    description: 'Publishes content to social media platforms',
    color: 0x10B981, // Green
    icon: '📤',
    capabilities: ['publish_post', 'schedule_post', 'manage_platforms'],
    defaultFurniture: [
      { type: 'desk', count: 2 },
      { type: 'monitor', count: 4 },
      { type: 'chair', count: 2 },
      { type: 'filing_cabinet', count: 1 },
      { type: 'clock', count: 1 }
    ]
  },
  [DepartmentType.TREND_ANALYSIS]: {
    name: 'Trend Analysis',
    description: 'Analyzes trends and provides insights',
    color: 0xF59E0B, // Amber
    icon: '📊',
    capabilities: ['scrape_trends', 'analyze_data', 'generate_insights'],
    defaultFurniture: [
      { type: 'desk', count: 2 },
      { type: 'monitor', count: 4 },
      { type: 'chair', count: 2 },
      { type: 'whiteboard', count: 1 },
      { type: 'bookshelf', count: 1 }
    ]
  },
  [DepartmentType.CUSTOMER_SUPPORT]: {
    name: 'Customer Support',
    description: 'Handles user conversations and provides support',
    color: 0x8B5CF6, // Purple
    icon: '💬',
    capabilities: ['respond_to_chat', 'answer_questions', 'provide_guidance'],
    defaultFurniture: [
      { type: 'desk', count: 3 },
      { type: 'computer', count: 3 },
      { type: 'chair', count: 3 },
      { type: 'whiteboard', count: 1 },
      { type: 'water_cooler', count: 1 }
    ]
  },
  [DepartmentType.ADMINISTRATION]: {
    name: 'Administration',
    description: 'Manages authentication and platform connections',
    color: 0x6B7280, // Gray
    icon: '🔐',
    capabilities: ['handle_oauth', 'manage_tokens', 'verify_connections', 'system_admin'],
    defaultFurniture: [
      { type: 'desk', count: 1 },
      { type: 'computer', count: 1 },
      { type: 'chair', count: 1 },
      { type: 'server_rack', count: 1 },
      { type: 'security_monitor', count: 2 },
      { type: 'filing_cabinet', count: 1 }
    ]
  }
};

/**
 * Default department layout configuration
 * Based on design.md specifications
 */
export const DEFAULT_DEPARTMENT_LAYOUT = {
  [DepartmentType.CONTENT_CREATION]: {
    gridPosition: { x: 2, y: 2 },
    gridSize: { width: 6, height: 5 },
    screenPosition: { x: 100, y: 100 },
    screenSize: { width: 400, height: 300 }
  },
  [DepartmentType.PUBLISHING]: {
    gridPosition: { x: 9, y: 2 },
    gridSize: { width: 5, height: 5 },
    screenPosition: { x: 550, y: 100 },
    screenSize: { width: 350, height: 300 }
  },
  [DepartmentType.TREND_ANALYSIS]: {
    gridPosition: { x: 2, y: 8 },
    gridSize: { width: 5, height: 5 },
    screenPosition: { x: 100, y: 450 },
    screenSize: { width: 350, height: 300 }
  },
  [DepartmentType.CUSTOMER_SUPPORT]: {
    gridPosition: { x: 8, y: 8 },
    gridSize: { width: 6, height: 5 },
    screenPosition: { x: 500, y: 450 },
    screenSize: { width: 400, height: 300 }
  },
  [DepartmentType.ADMINISTRATION]: {
    gridPosition: { x: 15, y: 2 },
    gridSize: { width: 4, height: 11 },
    screenPosition: { x: 950, y: 100 },
    screenSize: { width: 300, height: 650 }
  }
};

/**
 * DepartmentEntity class - Specialized entity for departments
 */
class DepartmentEntity extends Entity {
  /**
   * Create a new department entity
   * @param {string} id - Unique identifier
   * @param {string} departmentType - Type of department (from DepartmentType enum)
   * @param {object} bounds - Department bounds {x, y, width, height}
   */
  constructor(id, departmentType, bounds) {
    super(id, 'department');
    
    // Validate department type
    if (!Object.values(DepartmentType).includes(departmentType)) {
      throw new Error(`Invalid department type: ${departmentType}`);
    }
    
    this.departmentType = departmentType;
    
    // Get metadata for this department type
    const metadata = DEPARTMENT_METADATA[departmentType];
    this.metadata = {
      name: metadata.name,
      description: metadata.description,
      color: metadata.color,
      icon: metadata.icon,
      capabilities: [...metadata.capabilities],
      defaultFurniture: metadata.defaultFurniture.map(f => ({ ...f }))
    };
    
    // Department bounds (screen coordinates)
    this.bounds = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    };
    
    // Grid bounds (for pathfinding and placement)
    this.gridBounds = null; // Set via setGridBounds()
    
    // Assigned entities
    this.agents = []; // Array of agent IDs
    this.furniture = []; // Array of furniture entity IDs
    this.workstations = []; // Array of workstation IDs
    
    // Department statistics
    this.stats = {
      agentCount: 0,
      activeAgents: 0,
      idleAgents: 0,
      furnitureCount: 0,
      workstationCount: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      averageTaskDuration: 0
    };
  }
  
  /**
   * Set grid bounds for pathfinding
   * @param {object} gridBounds - Grid bounds {x, y, width, height}
   */
  setGridBounds(gridBounds) {
    this.gridBounds = {
      x: gridBounds.x,
      y: gridBounds.y,
      width: gridBounds.width,
      height: gridBounds.height
    };
    this.updatedAt = Date.now();
  }
  
  /**
   * Get grid bounds
   * @returns {object|null} Grid bounds or null
   */
  getGridBounds() {
    return this.gridBounds ? { ...this.gridBounds } : null;
  }
  
  /**
   * Get screen bounds
   * @returns {object} Screen bounds
   */
  getBounds() {
    return { ...this.bounds };
  }
  
  /**
   * Check if point is within department bounds
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if point is inside bounds
   */
  containsPoint(x, y) {
    return x >= this.bounds.x &&
           x <= this.bounds.x + this.bounds.width &&
           y >= this.bounds.y &&
           y <= this.bounds.y + this.bounds.height;
  }
  
  /**
   * Check if grid cell is within department
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {boolean} True if grid cell is inside department
   */
  containsGridCell(gridX, gridY) {
    if (!this.gridBounds) return false;
    
    return gridX >= this.gridBounds.x &&
           gridX < this.gridBounds.x + this.gridBounds.width &&
           gridY >= this.gridBounds.y &&
           gridY < this.gridBounds.y + this.gridBounds.height;
  }
  
  /**
   * Add agent to department
   * @param {string} agentId - Agent ID
   * @returns {boolean} True if added successfully
   */
  addAgent(agentId) {
    if (this.agents.includes(agentId)) {
      console.warn(`Agent ${agentId} already in department ${this.id}`);
      return false;
    }
    
    this.agents.push(agentId);
    this.stats.agentCount = this.agents.length;
    this.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Remove agent from department
   * @param {string} agentId - Agent ID
   * @returns {boolean} True if removed successfully
   */
  removeAgent(agentId) {
    const index = this.agents.indexOf(agentId);
    if (index === -1) {
      console.warn(`Agent ${agentId} not found in department ${this.id}`);
      return false;
    }
    
    this.agents.splice(index, 1);
    this.stats.agentCount = this.agents.length;
    this.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Get all agents in department
   * @returns {string[]} Array of agent IDs
   */
  getAgents() {
    return [...this.agents];
  }
  
  /**
   * Check if agent is in department
   * @param {string} agentId - Agent ID
   * @returns {boolean} True if agent is in department
   */
  hasAgent(agentId) {
    return this.agents.includes(agentId);
  }
  
  /**
   * Add furniture to department
   * @param {string} furnitureId - Furniture entity ID
   * @returns {boolean} True if added successfully
   */
  addFurniture(furnitureId) {
    if (this.furniture.includes(furnitureId)) {
      console.warn(`Furniture ${furnitureId} already in department ${this.id}`);
      return false;
    }
    
    this.furniture.push(furnitureId);
    this.stats.furnitureCount = this.furniture.length;
    this.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Remove furniture from department
   * @param {string} furnitureId - Furniture entity ID
   * @returns {boolean} True if removed successfully
   */
  removeFurniture(furnitureId) {
    const index = this.furniture.indexOf(furnitureId);
    if (index === -1) {
      console.warn(`Furniture ${furnitureId} not found in department ${this.id}`);
      return false;
    }
    
    this.furniture.splice(index, 1);
    this.stats.furnitureCount = this.furniture.length;
    this.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Get all furniture in department
   * @returns {string[]} Array of furniture entity IDs
   */
  getFurniture() {
    return [...this.furniture];
  }
  
  /**
   * Check if furniture is in department
   * @param {string} furnitureId - Furniture entity ID
   * @returns {boolean} True if furniture is in department
   */
  hasFurniture(furnitureId) {
    return this.furniture.includes(furnitureId);
  }
  
  /**
   * Add workstation to department
   * @param {string} workstationId - Workstation ID
   * @returns {boolean} True if added successfully
   */
  addWorkstation(workstationId) {
    if (this.workstations.includes(workstationId)) {
      console.warn(`Workstation ${workstationId} already in department ${this.id}`);
      return false;
    }
    
    this.workstations.push(workstationId);
    this.stats.workstationCount = this.workstations.length;
    this.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Remove workstation from department
   * @param {string} workstationId - Workstation ID
   * @returns {boolean} True if removed successfully
   */
  removeWorkstation(workstationId) {
    const index = this.workstations.indexOf(workstationId);
    if (index === -1) {
      console.warn(`Workstation ${workstationId} not found in department ${this.id}`);
      return false;
    }
    
    this.workstations.splice(index, 1);
    this.stats.workstationCount = this.workstations.length;
    this.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Get all workstations in department
   * @returns {string[]} Array of workstation IDs
   */
  getWorkstations() {
    return [...this.workstations];
  }
  
  /**
   * Update department statistics
   * @param {object} updates - Stat updates
   */
  updateStats(updates) {
    this.stats = {
      ...this.stats,
      ...updates
    };
    this.updatedAt = Date.now();
  }
  
  /**
   * Get department statistics
   * @returns {object} Department stats
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * Get department display name
   * @returns {string} Display name
   */
  getDisplayName() {
    return this.metadata.name;
  }
  
  /**
   * Get department icon
   * @returns {string} Icon emoji
   */
  getIcon() {
    return this.metadata.icon;
  }
  
  /**
   * Get department color
   * @returns {number} Color hex value
   */
  getColor() {
    return this.metadata.color;
  }
  
  /**
   * Get department capabilities
   * @returns {string[]} Array of capability strings
   */
  getCapabilities() {
    return [...this.metadata.capabilities];
  }
  
  /**
   * Check if department has capability
   * @param {string} capability - Capability to check
   * @returns {boolean} True if department has capability
   */
  hasCapability(capability) {
    return this.metadata.capabilities.includes(capability);
  }
  
  /**
   * Get center point of department
   * @returns {{x: number, y: number}} Center coordinates
   */
  getCenter() {
    return {
      x: this.bounds.x + this.bounds.width / 2,
      y: this.bounds.y + this.bounds.height / 2
    };
  }
  
  /**
   * Serialize department to JSON
   * @returns {object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      departmentType: this.departmentType,
      metadata: this.metadata,
      bounds: this.bounds,
      gridBounds: this.gridBounds,
      agents: this.agents,
      furniture: this.furniture,
      workstations: this.workstations,
      stats: this.stats
    };
  }
  
  /**
   * Create department from JSON
   * @param {object} json - JSON representation
   * @returns {DepartmentEntity} Reconstructed department
   */
  static fromJSON(json) {
    const department = new DepartmentEntity(json.id, json.departmentType, json.bounds);
    
    // Restore base entity properties
    department.active = json.active;
    department.destroyed = json.destroyed;
    department.createdAt = json.createdAt;
    department.updatedAt = json.updatedAt;
    
    // Restore components
    if (json.components) {
      json.components.forEach(({ type, data }) => {
        department.addComponent(type, data);
      });
    }
    
    // Restore department-specific properties
    department.gridBounds = json.gridBounds;
    department.agents = json.agents || [];
    department.furniture = json.furniture || [];
    department.workstations = json.workstations || [];
    department.stats = json.stats || department.stats;
    
    return department;
  }
}

/**
 * Factory function to create a fully configured department entity
 * @param {string} departmentType - Type of department
 * @param {object} bounds - Department bounds {x, y, width, height} (optional, uses default layout)
 * @param {object} gridBounds - Grid bounds {x, y, width, height} (optional)
 * @param {string} id - Optional custom ID
 * @returns {DepartmentEntity} Configured department entity
 */
export function createDepartment(departmentType, bounds = null, gridBounds = null, id = null) {
  // Generate ID if not provided
  const departmentId = id || `dept-${departmentType}`;
  
  // Use default layout if bounds not provided
  const layoutConfig = DEFAULT_DEPARTMENT_LAYOUT[departmentType];
  const departmentBounds = bounds || layoutConfig.screenPosition;
  const departmentSize = bounds ? { width: bounds.width, height: bounds.height } : layoutConfig.screenSize;
  
  const fullBounds = {
    x: departmentBounds.x,
    y: departmentBounds.y,
    width: departmentSize.width,
    height: departmentSize.height
  };
  
  // Create department
  const department = new DepartmentEntity(departmentId, departmentType, fullBounds);
  
  // Set grid bounds if provided, otherwise use default
  const defaultGridBounds = gridBounds || {
    x: layoutConfig.gridPosition.x,
    y: layoutConfig.gridPosition.y,
    width: layoutConfig.gridSize.width,
    height: layoutConfig.gridSize.height
  };
  department.setGridBounds(defaultGridBounds);
  
  // Add position component (center of department)
  const center = department.getCenter();
  department.addComponent('position', createPositionComponent(center.x, center.y, 0));
  
  return department;
}

/**
 * Create all default departments
 * @returns {DepartmentEntity[]} Array of department entities
 */
export function createAllDepartments() {
  return Object.values(DepartmentType).map(type => createDepartment(type));
}

/**
 * Get all department types
 * @returns {Array} Array of department type strings
 */
export function getAllDepartmentTypes() {
  return Object.values(DepartmentType);
}

/**
 * Get department metadata by type
 * @param {string} departmentType - Department type
 * @returns {object} Department metadata
 */
export function getDepartmentMetadata(departmentType) {
  return DEPARTMENT_METADATA[departmentType] ? { ...DEPARTMENT_METADATA[departmentType] } : null;
}

/**
 * Get default department layout
 * @param {string} departmentType - Department type
 * @returns {object} Layout configuration
 */
export function getDepartmentLayout(departmentType) {
  return DEFAULT_DEPARTMENT_LAYOUT[departmentType] ? { ...DEFAULT_DEPARTMENT_LAYOUT[departmentType] } : null;
}

/**
 * Find department containing a point
 * @param {DepartmentEntity[]} departments - Array of departments
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {DepartmentEntity|null} Department containing point or null
 */
export function findDepartmentAtPoint(departments, x, y) {
  return departments.find(dept => dept.containsPoint(x, y)) || null;
}

/**
 * Find department containing a grid cell
 * @param {DepartmentEntity[]} departments - Array of departments
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @returns {DepartmentEntity|null} Department containing grid cell or null
 */
export function findDepartmentAtGridCell(departments, gridX, gridY) {
  return departments.find(dept => dept.containsGridCell(gridX, gridY)) || null;
}

export default DepartmentEntity;
