/**
 * TaskEntity - Specialized entity class for tasks
 * 
 * Represents backend tasks (posts, chat messages, etc.) as visual entities
 * in the game world. Tasks are assigned to agents and go through a lifecycle
 * from queued to completion.
 * 
 * Requirements: 3.1, 3.6
 * Phase 5, Task 24
 */

import Entity from './Entity.js';

/**
 * Task types corresponding to backend operations
 */
export const TaskType = {
  GENERATE_CONTENT: 'generate_content',
  PUBLISH_POST: 'publish_post',
  SCRAPE_TRENDS: 'scrape_trends',
  HANDLE_CHAT: 'handle_chat',
  OAUTH_FLOW: 'oauth_flow'
};

/**
 * Task status state machine
 */
export const TaskStatus = {
  QUEUED: 'queued',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Task metadata by type
 */
const TASK_METADATA = {
  [TaskType.GENERATE_CONTENT]: {
    name: 'Generate Content',
    description: 'Create social media content using AI',
    icon: '✍️',
    color: 0x4F46E5, // Indigo
    estimatedDuration: 15000, // 15 seconds
    requiredAgentType: 'content_generator',
    department: 'content_creation'
  },
  [TaskType.PUBLISH_POST]: {
    name: 'Publish Post',
    description: 'Publish content to social media platforms',
    icon: '📤',
    color: 0x10B981, // Green
    estimatedDuration: 5000, // 5 seconds
    requiredAgentType: 'publisher',
    department: 'publishing'
  },
  [TaskType.SCRAPE_TRENDS]: {
    name: 'Scrape Trends',
    description: 'Analyze trends and gather insights',
    icon: '📊',
    color: 0xF59E0B, // Amber
    estimatedDuration: 12000, // 12 seconds
    requiredAgentType: 'trend_scraper',
    department: 'trend_analysis'
  },
  [TaskType.HANDLE_CHAT]: {
    name: 'Handle Chat',
    description: 'Respond to user messages',
    icon: '💬',
    color: 0x8B5CF6, // Purple
    estimatedDuration: 8000, // 8 seconds
    requiredAgentType: 'chat_assistant',
    department: 'customer_support'
  },
  [TaskType.OAUTH_FLOW]: {
    name: 'OAuth Flow',
    description: 'Handle authentication and platform connections',
    icon: '🔐',
    color: 0x6B7280, // Gray
    estimatedDuration: 3000, // 3 seconds
    requiredAgentType: 'oauth_handler',
    department: 'administration'
  }
};

/**
 * Valid status transitions for task state machine
 */
const STATUS_TRANSITIONS = {
  [TaskStatus.QUEUED]: [TaskStatus.ACTIVE],
  [TaskStatus.ACTIVE]: [TaskStatus.COMPLETED, TaskStatus.FAILED],
  [TaskStatus.COMPLETED]: [], // Terminal state
  [TaskStatus.FAILED]: [] // Terminal state
};

/**
 * TaskEntity class - Specialized entity for tasks
 */
class TaskEntity extends Entity {
  /**
   * Create a new task entity
   * @param {string} id - Unique identifier
   * @param {string} taskType - Type of task (from TaskType enum)
   * @param {object} backendReference - Reference to backend data
   */
  constructor(id, taskType, backendReference = {}) {
    super(id, 'task');
    
    // Validate task type
    if (!Object.values(TaskType).includes(taskType)) {
      throw new Error(`Invalid task type: ${taskType}`);
    }
    
    this.taskType = taskType;
    this.taskStatus = TaskStatus.QUEUED;
    
    // Get metadata for this task type
    const metadata = TASK_METADATA[taskType];
    this.metadata = {
      name: metadata.name,
      description: metadata.description,
      icon: metadata.icon,
      color: metadata.color,
      estimatedDuration: metadata.estimatedDuration,
      requiredAgentType: metadata.requiredAgentType,
      department: metadata.department
    };
    
    // Agent assignment
    this.assignedAgent = null;
    
    // Progress tracking (0-100)
    this.progress = 0;
    
    // Timing
    this.queuedAt = Date.now();
    this.startTime = null;
    this.endTime = null;
    this.estimatedDuration = metadata.estimatedDuration;
    
    // Backend reference for syncing with real data
    this.backendReference = {
      lambdaArn: backendReference.lambdaArn || null,
      executionId: backendReference.executionId || null,
      dynamodbKey: backendReference.dynamodbKey || null,
      postId: backendReference.postId || null,
      conversationId: backendReference.conversationId || null
    };
    
    // Status history for debugging and analytics
    this.statusHistory = [
      {
        status: TaskStatus.QUEUED,
        timestamp: Date.now(),
        duration: 0
      }
    ];
    
    // Error information (if failed)
    this.error = null;
    
    // Result data (if completed)
    this.result = null;
  }
  
  /**
   * Assign task to an agent
   * @param {string} agentId - ID of agent to assign to
   * @returns {boolean} True if assignment successful
   */
  assignToAgent(agentId) {
    if (this.taskStatus !== TaskStatus.QUEUED) {
      console.warn(`Cannot assign task ${this.id} - not in queued state`);
      return false;
    }
    
    this.assignedAgent = agentId;
    this.updatedAt = Date.now();
    return true;
  }
  
  /**
   * Start task execution
   * @returns {boolean} True if started successfully
   */
  start() {
    if (!this.canTransitionTo(TaskStatus.ACTIVE)) {
      console.warn(`Cannot start task ${this.id} - invalid state transition`);
      return false;
    }
    
    if (!this.assignedAgent) {
      console.warn(`Cannot start task ${this.id} - no agent assigned`);
      return false;
    }
    
    this.startTime = Date.now();
    this.progress = 0;
    this.changeStatus(TaskStatus.ACTIVE);
    return true;
  }
  
  /**
   * Update task progress
   * @param {number} progress - Progress value (0-100)
   */
  updateProgress(progress) {
    if (this.taskStatus !== TaskStatus.ACTIVE) {
      return;
    }
    
    this.progress = Math.max(0, Math.min(100, progress));
    this.updatedAt = Date.now();
  }
  
  /**
   * Complete task successfully
   * @param {object} result - Task result data
   * @returns {boolean} True if completed successfully
   */
  complete(result = null) {
    if (!this.canTransitionTo(TaskStatus.COMPLETED)) {
      console.warn(`Cannot complete task ${this.id} - invalid state transition`);
      return false;
    }
    
    this.endTime = Date.now();
    this.progress = 100;
    this.result = result;
    this.changeStatus(TaskStatus.COMPLETED);
    return true;
  }
  
  /**
   * Fail task with error
   * @param {Error|string} error - Error information
   * @returns {boolean} True if failed successfully
   */
  fail(error) {
    if (!this.canTransitionTo(TaskStatus.FAILED)) {
      console.warn(`Cannot fail task ${this.id} - invalid state transition`);
      return false;
    }
    
    this.endTime = Date.now();
    this.error = error instanceof Error ? error.message : error;
    this.changeStatus(TaskStatus.FAILED);
    return true;
  }
  
  /**
   * Change task status
   * @param {string} newStatus - New status
   * @private
   */
  changeStatus(newStatus) {
    if (this.taskStatus === newStatus) {
      return;
    }
    
    // Update status history
    const lastEntry = this.statusHistory[this.statusHistory.length - 1];
    lastEntry.duration = Date.now() - lastEntry.timestamp;
    
    this.statusHistory.push({
      status: newStatus,
      timestamp: Date.now(),
      duration: 0
    });
    
    this.taskStatus = newStatus;
    this.updatedAt = Date.now();
  }
  
  /**
   * Check if can transition to new status
   * @param {string} newStatus - Status to transition to
   * @returns {boolean} True if transition is valid
   */
  canTransitionTo(newStatus) {
    const validTransitions = STATUS_TRANSITIONS[this.taskStatus] || [];
    return validTransitions.includes(newStatus);
  }
  
  /**
   * Get task duration in milliseconds
   * @returns {number} Duration or null if not started
   */
  getDuration() {
    if (!this.startTime) {
      return null;
    }
    
    const endTime = this.endTime || Date.now();
    return endTime - this.startTime;
  }
  
  /**
   * Get time in queue in milliseconds
   * @returns {number} Time in queue
   */
  getQueueTime() {
    const startTime = this.startTime || Date.now();
    return startTime - this.queuedAt;
  }
  
  /**
   * Get estimated completion time
   * @returns {number|null} Timestamp of estimated completion or null
   */
  getEstimatedCompletion() {
    if (this.taskStatus !== TaskStatus.ACTIVE || !this.startTime) {
      return null;
    }
    
    return this.startTime + this.estimatedDuration;
  }
  
  /**
   * Get estimated time remaining in milliseconds
   * @returns {number|null} Time remaining or null
   */
  getEstimatedTimeRemaining() {
    const completion = this.getEstimatedCompletion();
    if (!completion) {
      return null;
    }
    
    return Math.max(0, completion - Date.now());
  }
  
  /**
   * Check if task is terminal (completed or failed)
   * @returns {boolean} True if task is in terminal state
   */
  isTerminal() {
    return this.taskStatus === TaskStatus.COMPLETED || 
           this.taskStatus === TaskStatus.FAILED;
  }
  
  /**
   * Check if task is running
   * @returns {boolean} True if task is active
   */
  isRunning() {
    return this.taskStatus === TaskStatus.ACTIVE;
  }
  
  /**
   * Check if task is queued
   * @returns {boolean} True if task is queued
   */
  isQueued() {
    return this.taskStatus === TaskStatus.QUEUED;
  }
  
  /**
   * Get task type metadata
   * @returns {object} Task metadata
   */
  getMetadata() {
    return { ...this.metadata };
  }
  
  /**
   * Get backend reference
   * @returns {object} Backend reference data
   */
  getBackendReference() {
    return { ...this.backendReference };
  }
  
  /**
   * Update backend reference
   * @param {object} reference - New reference data
   */
  updateBackendReference(reference) {
    this.backendReference = {
      ...this.backendReference,
      ...reference
    };
    this.updatedAt = Date.now();
  }
  
  /**
   * Serialize task to JSON
   * @returns {object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      taskType: this.taskType,
      taskStatus: this.taskStatus,
      assignedAgent: this.assignedAgent,
      progress: this.progress,
      queuedAt: this.queuedAt,
      startTime: this.startTime,
      endTime: this.endTime,
      estimatedDuration: this.estimatedDuration,
      backendReference: this.backendReference,
      statusHistory: this.statusHistory,
      error: this.error,
      result: this.result,
      metadata: this.metadata
    };
  }
  
  /**
   * Create task from JSON
   * @param {object} json - JSON representation
   * @returns {TaskEntity} Reconstructed task
   */
  static fromJSON(json) {
    const task = new TaskEntity(json.id, json.taskType, json.backendReference);
    
    // Restore state
    task.taskStatus = json.taskStatus;
    task.assignedAgent = json.assignedAgent;
    task.progress = json.progress;
    task.queuedAt = json.queuedAt;
    task.startTime = json.startTime;
    task.endTime = json.endTime;
    task.estimatedDuration = json.estimatedDuration;
    task.statusHistory = json.statusHistory;
    task.error = json.error;
    task.result = json.result;
    
    // Restore base entity state
    task.active = json.active;
    task.destroyed = json.destroyed;
    task.createdAt = json.createdAt;
    task.updatedAt = json.updatedAt;
    
    // Restore components
    if (json.components) {
      json.components.forEach(({ type, data }) => {
        task.addComponent(type, data);
      });
    }
    
    return task;
  }
}

/**
 * Helper function to create a task entity from backend post data
 * @param {object} post - Backend post data
 * @returns {TaskEntity} New task entity
 */
export function createTaskFromPost(post) {
  const taskId = `task-${post.postId}`;
  const taskType = TaskType.GENERATE_CONTENT;
  
  const backendReference = {
    dynamodbKey: post.postId,
    postId: post.postId
  };
  
  const task = new TaskEntity(taskId, taskType, backendReference);
  
  // Map post status to task status
  if (post.status === 'draft' || post.status === 'pending') {
    task.taskStatus = TaskStatus.QUEUED;
  } else if (post.status === 'generating' || post.status === 'publishing') {
    task.taskStatus = TaskStatus.ACTIVE;
    task.startTime = Date.now();
  } else if (post.status === 'published' || post.status === 'completed') {
    task.taskStatus = TaskStatus.COMPLETED;
    task.progress = 100;
    task.startTime = post.createdAt || Date.now();
    task.endTime = post.updatedAt || Date.now();
  } else if (post.status === 'failed' || post.status === 'error') {
    task.taskStatus = TaskStatus.FAILED;
    task.error = post.error || 'Unknown error';
    task.startTime = post.createdAt || Date.now();
    task.endTime = post.updatedAt || Date.now();
  }
  
  return task;
}

/**
 * Helper function to create a task entity from chat conversation
 * @param {object} conversation - Backend conversation data
 * @returns {TaskEntity} New task entity
 */
export function createTaskFromConversation(conversation) {
  const taskId = `task-chat-${conversation.conversationId}`;
  const taskType = TaskType.HANDLE_CHAT;
  
  const backendReference = {
    conversationId: conversation.conversationId
  };
  
  const task = new TaskEntity(taskId, taskType, backendReference);
  
  // Chat tasks are typically quick and complete immediately
  if (conversation.messages && conversation.messages.length > 0) {
    task.taskStatus = TaskStatus.COMPLETED;
    task.progress = 100;
    task.startTime = conversation.createdAt || Date.now();
    task.endTime = conversation.updatedAt || Date.now();
  }
  
  return task;
}

export default TaskEntity;
