/**
 * AgentEntity - Specialized entity class for AI agents
 * 
 * Represents AI workers in the game world with specific types, states, and behaviors.
 * Extends the base Entity class with agent-specific functionality.
 * 
 * Requirements: 2.1, 2.2, 2.4
 * Phase 2, Task 9
 */

import Entity from './Entity.js';
import {
  createPositionComponent,
  createSpriteComponent,
  createAnimationComponent,
  createTaskComponent,
  createInteractionComponent
} from './components/index.js';

/**
 * Agent types corresponding to Lambda functions
 */
export const AgentType = {
  CONTENT_GENERATOR: 'content_generator',
  PUBLISHER: 'publisher',
  TREND_SCRAPER: 'trend_scraper',
  CHAT_ASSISTANT: 'chat_assistant',
  OAUTH_HANDLER: 'oauth_handler'
};

/**
 * Agent states for state machine
 */
export const AgentState = {
  IDLE: 'idle',
  WORKING: 'working',
  BLOCKED: 'blocked',
  THINKING: 'thinking',
  CELEBRATING: 'celebrating',
  ERROR: 'error'
};

/**
 * Agent metadata by type
 */
const AGENT_METADATA = {
  [AgentType.CONTENT_GENERATOR]: {
    name: 'Content Generator',
    description: 'Creates engaging social media content using AI',
    capabilities: ['generate_post', 'write_caption', 'suggest_hashtags'],
    department: 'content_creation',
    color: 0x4F46E5, // Indigo
    icon: '✍️'
  },
  [AgentType.PUBLISHER]: {
    name: 'Publisher',
    description: 'Publishes content to social media platforms',
    capabilities: ['publish_post', 'schedule_post', 'manage_platforms'],
    department: 'publishing',
    color: 0x10B981, // Green
    icon: '📤'
  },
  [AgentType.TREND_SCRAPER]: {
    name: 'Trend Scraper',
    description: 'Analyzes trends and provides insights',
    capabilities: ['scrape_trends', 'analyze_data', 'generate_insights'],
    department: 'trend_analysis',
    color: 0xF59E0B, // Amber
    icon: '📊'
  },
  [AgentType.CHAT_ASSISTANT]: {
    name: 'Chat Assistant',
    description: 'Handles user conversations and provides support',
    capabilities: ['respond_to_chat', 'answer_questions', 'provide_guidance'],
    department: 'customer_support',
    color: 0x8B5CF6, // Purple
    icon: '💬'
  },
  [AgentType.OAUTH_HANDLER]: {
    name: 'OAuth Handler',
    description: 'Manages authentication and platform connections',
    capabilities: ['handle_oauth', 'manage_tokens', 'verify_connections'],
    department: 'administration',
    color: 0x6B7280, // Gray
    icon: '🔐'
  }
};

/**
 * Valid state transitions for agent state machine
 */
const STATE_TRANSITIONS = {
  [AgentState.IDLE]: [AgentState.WORKING, AgentState.THINKING],
  [AgentState.WORKING]: [AgentState.IDLE, AgentState.BLOCKED, AgentState.CELEBRATING, AgentState.ERROR],
  [AgentState.BLOCKED]: [AgentState.WORKING, AgentState.IDLE, AgentState.ERROR],
  [AgentState.THINKING]: [AgentState.WORKING, AgentState.IDLE],
  [AgentState.CELEBRATING]: [AgentState.IDLE],
  [AgentState.ERROR]: [AgentState.IDLE, AgentState.WORKING]
};

/**
 * AgentEntity class - Specialized entity for AI agents
 */
class AgentEntity extends Entity {
  /**
   * Create a new agent entity
   * @param {string} id - Unique identifier
   * @param {string} agentType - Type of agent (from AgentType enum)
   */
  constructor(id, agentType) {
    super(id, 'agent');
    
    // Validate agent type
    if (!Object.values(AgentType).includes(agentType)) {
      throw new Error(`Invalid agent type: ${agentType}`);
    }
    
    this.agentType = agentType;
    this.agentState = AgentState.IDLE;
    
    // Get metadata for this agent type
    const metadata = AGENT_METADATA[agentType];
    this.metadata = {
      name: metadata.name,
      description: metadata.description,
      capabilities: [...metadata.capabilities],
      department: metadata.department,
      color: metadata.color,
      icon: metadata.icon
    };
    
    // State machine history
    this.stateHistory = [
      {
        state: AgentState.IDLE,
        timestamp: Date.now(),
        duration: 0
      }
    ];
    
    // Department assignment
    this.assignedDepartment = metadata.department;
    
    // Performance metrics
    this.metrics = {
      tasksCompleted: 0,
      tasksFailed: 0,
      totalWorkTime: 0,
      averageTaskDuration: 0,
      successRate: 1.0
    };
  }
  
  /**
   * Get current agent state
   * @returns {string} Current state
   */
  getState() {
    return this.agentState;
  }
  
  /**
   * Set agent state with validation
   * @param {string} newState - New state to transition to
   * @returns {boolean} True if transition was successful
   */
  setState(newState) {
    // Validate state
    if (!Object.values(AgentState).includes(newState)) {
      console.warn(`Invalid agent state: ${newState}`);
      return false;
    }
    
    // Check if transition is valid
    const validTransitions = STATE_TRANSITIONS[this.agentState];
    if (!validTransitions.includes(newState)) {
      console.warn(`Invalid state transition: ${this.agentState} -> ${newState}`);
      return false;
    }
    
    // Update state history
    const now = Date.now();
    const lastState = this.stateHistory[this.stateHistory.length - 1];
    lastState.duration = now - lastState.timestamp;
    
    // Add new state to history
    this.stateHistory.push({
      state: newState,
      timestamp: now,
      duration: 0
    });
    
    // Keep only last 20 states
    if (this.stateHistory.length > 20) {
      this.stateHistory = this.stateHistory.slice(-20);
    }
    
    // Update state
    const oldState = this.agentState;
    this.agentState = newState;
    this.updatedAt = now;
    
    // Trigger state change callback if exists
    if (this.onStateChange) {
      this.onStateChange(oldState, newState);
    }
    
    return true;
  }
  
  /**
   * Check if agent can transition to a state
   * @param {string} state - State to check
   * @returns {boolean} True if transition is valid
   */
  canTransitionTo(state) {
    const validTransitions = STATE_TRANSITIONS[this.agentState];
    return validTransitions.includes(state);
  }
  
  /**
   * Get state history
   * @returns {Array} State history
   */
  getStateHistory() {
    return [...this.stateHistory];
  }
  
  /**
   * Get time in current state
   * @returns {number} Time in milliseconds
   */
  getTimeInCurrentState() {
    const lastState = this.stateHistory[this.stateHistory.length - 1];
    return Date.now() - lastState.timestamp;
  }
  
  /**
   * Assign agent to department
   * @param {string} departmentId - Department ID
   */
  assignToDepartment(departmentId) {
    this.assignedDepartment = departmentId;
    this.updatedAt = Date.now();
  }
  
  /**
   * Get assigned department
   * @returns {string} Department ID
   */
  getDepartment() {
    return this.assignedDepartment;
  }
  
  /**
   * Update agent metrics
   * @param {object} updates - Metric updates
   */
  updateMetrics(updates) {
    this.metrics = {
      ...this.metrics,
      ...updates
    };
    
    // Recalculate success rate
    const total = this.metrics.tasksCompleted + this.metrics.tasksFailed;
    if (total > 0) {
      this.metrics.successRate = this.metrics.tasksCompleted / total;
    }
    
    this.updatedAt = Date.now();
  }
  
  /**
   * Get agent metrics
   * @returns {object} Agent metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Check if agent is busy
   * @returns {boolean} True if agent is working or blocked
   */
  isBusy() {
    return this.agentState === AgentState.WORKING || 
           this.agentState === AgentState.BLOCKED ||
           this.agentState === AgentState.THINKING;
  }
  
  /**
   * Check if agent is available for work
   * @returns {boolean} True if agent is idle
   */
  isAvailable() {
    return this.agentState === AgentState.IDLE;
  }
  
  /**
   * Check if agent is in error state
   * @returns {boolean} True if agent has error
   */
  hasError() {
    return this.agentState === AgentState.ERROR;
  }
  
  /**
   * Get agent display name
   * @returns {string} Display name
   */
  getDisplayName() {
    return this.metadata.name;
  }
  
  /**
   * Get agent icon
   * @returns {string} Icon emoji
   */
  getIcon() {
    return this.metadata.icon;
  }
  
  /**
   * Get agent color
   * @returns {number} Color hex value
   */
  getColor() {
    return this.metadata.color;
  }
  
  /**
   * Serialize agent to JSON
   * @returns {object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      agentType: this.agentType,
      agentState: this.agentState,
      metadata: this.metadata,
      stateHistory: this.stateHistory,
      assignedDepartment: this.assignedDepartment,
      metrics: this.metrics
    };
  }
  
  /**
   * Create agent from JSON
   * @param {object} json - JSON representation
   * @returns {AgentEntity} Reconstructed agent
   */
  static fromJSON(json) {
    const agent = new AgentEntity(json.id, json.agentType);
    
    // Restore base entity properties
    agent.active = json.active;
    agent.destroyed = json.destroyed;
    agent.createdAt = json.createdAt;
    agent.updatedAt = json.updatedAt;
    
    // Restore components
    if (json.components) {
      json.components.forEach(({ type, data }) => {
        agent.addComponent(type, data);
      });
    }
    
    // Restore agent-specific properties
    agent.agentState = json.agentState;
    agent.metadata = json.metadata;
    agent.stateHistory = json.stateHistory;
    agent.assignedDepartment = json.assignedDepartment;
    agent.metrics = json.metrics;
    
    return agent;
  }
}

/**
 * Factory function to create a fully configured agent entity
 * @param {string} agentType - Type of agent
 * @param {object} position - Initial position {x, y, z}
 * @param {string} id - Optional custom ID
 * @returns {AgentEntity} Configured agent entity
 */
export function createAgent(agentType, position = { x: 0, y: 0, z: 0 }, id = null) {
  // Generate ID if not provided
  const agentId = id || `agent-${agentType}-${Date.now()}`;
  
  // Create agent
  const agent = new AgentEntity(agentId, agentType);
  
  // Add position component
  agent.addComponent('position', createPositionComponent(position.x, position.y, position.z));
  
  // Add sprite component with agent color
  const metadata = AGENT_METADATA[agentType];
  agent.addComponent('sprite', createSpriteComponent(
    `agent_${agentType}_idle`,
    1.0,
    0,
    metadata.color
  ));
  
  // Add animation component
  agent.addComponent('animation', createAnimationComponent('idle', 0, 1.0, true, true));
  
  // Add task component
  agent.addComponent('task', createTaskComponent(null, [], []));
  
  // Add interaction component with context menu
  const contextMenu = [
    { label: 'View Details', action: 'show_details' },
    { label: 'View History', action: 'show_history' },
    { label: 'Assign Task', action: 'assign_task' }
  ];
  agent.addComponent('interaction', createInteractionComponent(true, true, false, contextMenu));
  
  return agent;
}

/**
 * Get all agent types
 * @returns {Array} Array of agent type strings
 */
export function getAllAgentTypes() {
  return Object.values(AgentType);
}

/**
 * Get agent metadata by type
 * @param {string} agentType - Agent type
 * @returns {object} Agent metadata
 */
export function getAgentMetadata(agentType) {
  return AGENT_METADATA[agentType] ? { ...AGENT_METADATA[agentType] } : null;
}

/**
 * Get all agent states
 * @returns {Array} Array of agent state strings
 */
export function getAllAgentStates() {
  return Object.values(AgentState);
}

/**
 * Check if state transition is valid
 * @param {string} fromState - Current state
 * @param {string} toState - Target state
 * @returns {boolean} True if transition is valid
 */
export function isValidTransition(fromState, toState) {
  const validTransitions = STATE_TRANSITIONS[fromState];
  return validTransitions ? validTransitions.includes(toState) : false;
}

export default AgentEntity;
