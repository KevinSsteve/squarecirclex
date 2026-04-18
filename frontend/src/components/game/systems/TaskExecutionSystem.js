/**
 * TaskExecutionSystem - Manages task lifecycle and execution
 * 
 * Coordinates task assignment, execution, progress tracking, and completion.
 * Works with MovementSystem, AnimationSystem, and AgentEntity to visualize
 * task workflows in the game world.
 * 
 * Requirements: 3.3, 3.4, 3.5, 3.6
 * Phase 5, Task 25-26
 */

import { TaskStatus } from '../entities/TaskEntity.js';
import { AgentState } from '../entities/AgentEntity.js';

/**
 * TaskExecutionSystem class
 */
class TaskExecutionSystem {
  /**
   * Create a new task execution system
   * @param {EntityRegistry} entityRegistry - Entity registry for accessing entities
   * @param {MovementSystem} movementSystem - Movement system for agent navigation
   * @param {AnimationSystem} animationSystem - Animation system for visual feedback
   * @param {TaskWorkflowVisuals} workflowVisuals - Visual components for task workflows
   */
  constructor(entityRegistry, movementSystem = null, animationSystem = null, workflowVisuals = null) {
    this.entityRegistry = entityRegistry;
    this.movementSystem = movementSystem;
    this.animationSystem = animationSystem;
    this.workflowVisuals = workflowVisuals;
    
    // Active task executions (taskId -> execution state)
    this.activeExecutions = new Map();
    
    // Task queue per agent (agentId -> taskId[])
    this.agentQueues = new Map();
    
    // Task assignment tracking (taskId -> agentId)
    this.taskAssignments = new Map();
    
    // Workstation occupancy tracking (workstationId -> agentId)
    this.workstationOccupancy = new Map();
    
    // Workstation queue (workstationId -> agentId[])
    this.workstationQueues = new Map();
    
    // Completion callbacks
    this.completionCallbacks = new Map();
    
    // Progress update callbacks
    this.progressCallbacks = new Map();
    
    // Notification batching
    this.notificationBatch = {
      completions: [],
      batchWindow: 2000, // 2 seconds
      batchTimer: null
    };
    
    // Camera focus priority
    this.cameraFocusPriority = null;
    
    // Statistics
    this.stats = {
      tasksAssigned: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      totalExecutionTime: 0
    };
  }
  
  /**
   * Assign a task to an agent
   * @param {string} taskId - Task entity ID
   * @param {string} agentId - Agent entity ID
   * @returns {boolean} True if assignment successful
   */
  assignTask(taskId, agentId) {
    const task = this.entityRegistry.getEntity(taskId);
    const agent = this.entityRegistry.getEntity(agentId);
    
    if (!task || !agent) {
      console.warn(`Cannot assign task ${taskId} to agent ${agentId} - entity not found`);
      return false;
    }
    
    // Validate task type matches agent type
    const taskMetadata = task.getMetadata();
    if (taskMetadata.requiredAgentType !== agent.agentType) {
      console.warn(`Cannot assign task ${taskId} to agent ${agentId} - type mismatch`);
      return false;
    }
    
    // Assign task to agent
    if (!task.assignToAgent(agentId)) {
      return false;
    }
    
    // Track assignment
    this.taskAssignments.set(taskId, agentId);
    
    // Add to agent's queue
    if (!this.agentQueues.has(agentId)) {
      this.agentQueues.set(agentId, []);
    }
    this.agentQueues.get(agentId).push(taskId);
    
    // Update agent's task component
    const taskComponent = agent.getComponent('task');
    if (taskComponent) {
      taskComponent.taskQueue.push(task);
    }
    
    this.stats.tasksAssigned++;
    
    console.log(`Assigned task ${taskId} to agent ${agentId}`);
    return true;
  }
  
  /**
   * Execute a task workflow
   * @param {string} taskId - Task entity ID
   * @returns {Promise<object>} Task result
   */
  async executeTask(taskId) {
    const task = this.entityRegistry.getEntity(taskId);
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    if (!task.assignedAgent) {
      throw new Error(`Task ${taskId} has no assigned agent`);
    }
    
    const agent = this.entityRegistry.getEntity(task.assignedAgent);
    if (!agent) {
      throw new Error(`Agent ${task.assignedAgent} not found`);
    }
    
    // Start task execution
    if (!task.start()) {
      throw new Error(`Failed to start task ${taskId}`);
    }
    
    // Create execution state
    const execution = {
      taskId,
      agentId: task.assignedAgent,
      startTime: Date.now(),
      phase: 'queued',
      progress: 0
    };
    
    this.activeExecutions.set(taskId, execution);
    
    try {
      // Execute task workflow phases
      await this.executeWorkflow(task, agent, execution);
      
      // Complete task
      task.complete({ success: true });
      this.stats.tasksCompleted++;
      this.stats.totalExecutionTime += task.getDuration();
      
      // Batch notification for completion
      this.batchNotification(task, true);
      
      // Trigger completion callback
      if (this.completionCallbacks.has(taskId)) {
        this.completionCallbacks.get(taskId)(task, null);
        this.completionCallbacks.delete(taskId);
      }
      
      // Remove from active executions
      this.activeExecutions.delete(taskId);
      
      // Remove from agent queue
      this.removeFromAgentQueue(task.assignedAgent, taskId);
      
      // Update agent state
      agent.setState(AgentState.IDLE);
      
      return { success: true, task };
      
    } catch (error) {
      // Fail task
      task.fail(error.message);
      this.stats.tasksFailed++;
      
      // Show error completion visual
      if (this.workflowVisuals) {
        this.workflowVisuals.hideExecutionPhase(taskId);
        this.workflowVisuals.showCompletionPhase(taskId, task.assignedAgent, false);
      }
      
      // Batch notification for failure
      this.batchNotification(task, false);
      
      // Trigger completion callback with error
      if (this.completionCallbacks.has(taskId)) {
        this.completionCallbacks.get(taskId)(task, error);
        this.completionCallbacks.delete(taskId);
      }
      
      // Remove from active executions
      this.activeExecutions.delete(taskId);
      
      // Remove from agent queue
      this.removeFromAgentQueue(task.assignedAgent, taskId);
      
      // Update agent state
      agent.setState(AgentState.ERROR);
      
      throw error;
    }
  }
  
  /**
   * Execute task workflow phases with workstation sharing
   * @param {TaskEntity} task - Task entity
   * @param {AgentEntity} agent - Agent entity
   * @param {object} execution - Execution state
   * @private
   */
  async executeWorkflow(task, agent, execution) {
    const taskMetadata = task.getMetadata();
    let workstationId = null;
    
    // Phase 1: Queued (notification)
    execution.phase = 'queued';
    agent.setState(AgentState.THINKING);
    
    // Show queued phase visual
    if (this.workflowVisuals) {
      this.workflowVisuals.showQueuedPhase(task.id, agent.id);
    }
    
    await this.delay(500); // Brief acknowledgment
    
    // Phase 2: Movement (if MovementSystem available)
    if (this.movementSystem) {
      execution.phase = 'movement';
      // Find workstation in agent's department
      const workstation = this.findWorkstation(agent.getDepartment());
      if (workstation) {
        workstationId = workstation.id;
        
        // Show desk highlight when agent is approaching
        if (this.workflowVisuals) {
          this.workflowVisuals.showDeskHighlight(agent.id, workstation);
        }
        
        // Request workstation access (may queue if busy)
        await this.requestWorkstation(workstationId, agent.id);
        
        const position = workstation.getComponent('position');
        if (position) {
          await this.movementSystem.moveToPosition(agent.id, position);
        }
        
        // Hide desk highlight after agent arrives
        if (this.workflowVisuals) {
          this.workflowVisuals.hideDeskHighlight(agent.id);
        }
      }
    }
    
    // Phase 3: Setup
    execution.phase = 'setup';
    agent.setState(AgentState.WORKING);
    
    // Show setup phase visual
    if (this.workflowVisuals) {
      this.workflowVisuals.showSetupPhase(task.id, agent.id);
    }
    
    if (this.animationSystem) {
      this.animationSystem.playAnimation(agent.id, 'sit_down', false);
    }
    await this.delay(500);
    
    // Phase 4: Execution (work)
    execution.phase = 'execution';
    
    // Show execution phase visual
    if (this.workflowVisuals) {
      this.workflowVisuals.showExecutionPhase(task.id, agent.id);
    }
    
    const duration = taskMetadata.estimatedDuration;
    const startTime = Date.now();
    
    // Simulate work with progress updates
    while (Date.now() - startTime < duration) {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      
      task.updateProgress(progress);
      execution.progress = progress;
      
      // Update visual progress
      if (this.workflowVisuals) {
        this.workflowVisuals.updateExecutionProgress(task.id, progress);
      }
      
      // Trigger progress callback
      if (this.progressCallbacks.has(task.id)) {
        this.progressCallbacks.get(task.id)(task, progress);
      }
      
      // Play work animation
      if (this.animationSystem && elapsed % 2000 < 100) {
        this.animationSystem.playAnimation(agent.id, 'typing', true);
      }
      
      await this.delay(100); // Update every 100ms
    }
    
    // Hide execution phase visual
    if (this.workflowVisuals) {
      this.workflowVisuals.hideExecutionPhase(task.id);
    }
    
    // Phase 5: Completion
    execution.phase = 'completion';
    agent.setState(AgentState.CELEBRATING);
    
    // Show completion phase visual (success)
    if (this.workflowVisuals) {
      this.workflowVisuals.showCompletionPhase(task.id, agent.id, true);
    }
    
    if (this.animationSystem) {
      this.animationSystem.playAnimation(agent.id, 'celebrate', false);
    }
    await this.delay(1500);
    
    // Release workstation
    if (workstationId) {
      this.releaseWorkstation(workstationId, agent.id);
    }
  }
  
  /**
   * Cancel a running task
   * @param {string} taskId - Task entity ID
   * @returns {boolean} True if cancelled successfully
   */
  cancelTask(taskId) {
    const task = this.entityRegistry.getEntity(taskId);
    
    if (!task) {
      console.warn(`Cannot cancel task ${taskId} - not found`);
      return false;
    }
    
    if (!task.isRunning()) {
      console.warn(`Cannot cancel task ${taskId} - not running`);
      return false;
    }
    
    // Fail the task
    task.fail('Cancelled by user');
    
    // Remove from active executions
    this.activeExecutions.delete(taskId);
    
    // Remove from agent queue
    if (task.assignedAgent) {
      this.removeFromAgentQueue(task.assignedAgent, taskId);
      
      // Update agent state
      const agent = this.entityRegistry.getEntity(task.assignedAgent);
      if (agent) {
        agent.setState(AgentState.IDLE);
      }
    }
    
    console.log(`Cancelled task ${taskId}`);
    return true;
  }
  
  /**
   * Get task progress
   * @param {string} taskId - Task entity ID
   * @returns {number} Progress (0-100) or -1 if not found
   */
  getTaskProgress(taskId) {
    const task = this.entityRegistry.getEntity(taskId);
    
    if (!task) {
      return -1;
    }
    
    return task.progress;
  }
  
  /**
   * Get active execution state
   * @param {string} taskId - Task entity ID
   * @returns {object|null} Execution state or null
   */
  getExecutionState(taskId) {
    return this.activeExecutions.get(taskId) || null;
  }
  
  /**
   * Get agent's task queue
   * @param {string} agentId - Agent entity ID
   * @returns {string[]} Array of task IDs
   */
  getAgentQueue(agentId) {
    return this.agentQueues.get(agentId) || [];
  }
  
  /**
   * Get all active tasks
   * @returns {TaskEntity[]} Array of active task entities
   */
  getActiveTasks() {
    const tasks = [];
    for (const taskId of this.activeExecutions.keys()) {
      const task = this.entityRegistry.getEntity(taskId);
      if (task) {
        tasks.push(task);
      }
    }
    return tasks;
  }
  
  /**
   * Register completion callback
   * @param {string} taskId - Task entity ID
   * @param {Function} callback - Callback function (task, error) => void
   */
  onTaskComplete(taskId, callback) {
    this.completionCallbacks.set(taskId, callback);
  }
  
  /**
   * Register progress callback
   * @param {string} taskId - Task entity ID
   * @param {Function} callback - Callback function (task, progress) => void
   */
  onTaskProgress(taskId, callback) {
    this.progressCallbacks.set(taskId, callback);
  }
  
  /**
   * Find available workstation in department with occupancy tracking
   * @param {string} departmentId - Department ID
   * @returns {EnvironmentEntity|null} Workstation entity or null
   * @private
   */
  findWorkstation(departmentId) {
    const department = this.entityRegistry.getEntity(departmentId);
    if (!department) {
      return null;
    }
    
    // Get all workstations in department
    const workstations = department.furniture
      .map(id => this.entityRegistry.getEntity(id))
      .filter(entity => entity && entity.workstationType === 'desk');
    
    // Find unoccupied workstation using occupancy tracking
    for (const workstation of workstations) {
      if (!this.workstationOccupancy.has(workstation.id)) {
        return workstation;
      }
    }
    
    // All workstations occupied - return first for queuing
    return workstations[0] || null;
  }
  
  /**
   * Request workstation access (with queuing if busy)
   * @param {string} workstationId - Workstation entity ID
   * @param {string} agentId - Agent entity ID
   * @returns {Promise<boolean>} True when workstation is available
   */
  async requestWorkstation(workstationId, agentId) {
    // Check if workstation is occupied
    if (this.workstationOccupancy.has(workstationId)) {
      // Workstation busy - add to queue
      if (!this.workstationQueues.has(workstationId)) {
        this.workstationQueues.set(workstationId, []);
      }
      this.workstationQueues.get(workstationId).push(agentId);
      
      // Wait for workstation to become available
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const queue = this.workstationQueues.get(workstationId);
          if (queue && queue[0] === agentId && !this.workstationOccupancy.has(workstationId)) {
            // Agent is first in queue and workstation is free
            clearInterval(checkInterval);
            queue.shift(); // Remove from queue
            this.workstationOccupancy.set(workstationId, agentId);
            resolve(true);
          }
        }, 100);
      });
    } else {
      // Workstation available - occupy immediately
      this.workstationOccupancy.set(workstationId, agentId);
      return true;
    }
  }
  
  /**
   * Release workstation when task completes
   * @param {string} workstationId - Workstation entity ID
   * @param {string} agentId - Agent entity ID
   */
  releaseWorkstation(workstationId, agentId) {
    // Verify agent owns the workstation
    if (this.workstationOccupancy.get(workstationId) === agentId) {
      this.workstationOccupancy.delete(workstationId);
      
      // Process queue if exists
      const queue = this.workstationQueues.get(workstationId);
      if (queue && queue.length > 0) {
        // Next agent in queue will be notified via requestWorkstation polling
        console.log(`Workstation ${workstationId} released, ${queue.length} agents waiting`);
      }
    }
  }
  
  /**
   * Update camera focus based on task priority
   * @param {Scene} scene - Scene instance for camera control
   */
  updateCameraFocus(scene) {
    if (!scene) return;
    
    // Get all active tasks
    const activeTasks = this.getActiveTasks();
    if (activeTasks.length === 0) {
      this.cameraFocusPriority = null;
      return;
    }
    
    // Calculate priority for each task
    const taskPriorities = activeTasks.map(task => {
      const metadata = task.getMetadata();
      let priority = 0;
      
      // Priority factors:
      // 1. Task type importance (chat > content > publish > trends)
      const typeWeights = {
        'handle_chat': 100,
        'generate_content': 80,
        'publish_post': 60,
        'scrape_trends': 40,
        'oauth_flow': 50
      };
      priority += typeWeights[task.taskType] || 50;
      
      // 2. Execution phase (setup/completion more interesting than execution)
      const execution = this.activeExecutions.get(task.id);
      if (execution) {
        const phaseWeights = {
          'queued': 20,
          'movement': 40,
          'setup': 80,
          'execution': 30,
          'completion': 100
        };
        priority += phaseWeights[execution.phase] || 0;
      }
      
      // 3. Progress (near completion is more interesting)
      if (task.progress > 80) {
        priority += 30;
      }
      
      return { task, priority };
    });
    
    // Sort by priority (highest first)
    taskPriorities.sort((a, b) => b.priority - a.priority);
    
    // Focus on highest priority task if different from current
    const highestPriorityTask = taskPriorities[0].task;
    if (this.cameraFocusPriority !== highestPriorityTask.id) {
      this.cameraFocusPriority = highestPriorityTask.id;
      
      // Get agent position
      const agent = this.entityRegistry.getEntity(highestPriorityTask.assignedAgent);
      if (agent) {
        const position = agent.getComponent('position');
        if (position) {
          // Focus camera on agent with smooth transition
          scene.focusOn(position.x, position.y, 1.5);
        }
      }
    }
  }
  
  /**
   * Batch notification for task completion
   * @param {TaskEntity} task - Completed task
   * @param {boolean} success - Whether task succeeded
   * @private
   */
  batchNotification(task, success) {
    // Add to batch
    this.notificationBatch.completions.push({
      task,
      success,
      timestamp: Date.now()
    });
    
    // Clear existing timer
    if (this.notificationBatch.batchTimer) {
      clearTimeout(this.notificationBatch.batchTimer);
    }
    
    // Set new timer to flush batch
    this.notificationBatch.batchTimer = setTimeout(() => {
      this.flushNotificationBatch();
    }, this.notificationBatch.batchWindow);
  }
  
  /**
   * Flush notification batch and emit single notification
   * @private
   */
  flushNotificationBatch() {
    const completions = this.notificationBatch.completions;
    
    if (completions.length === 0) {
      return;
    }
    
    // Group by success/failure
    const successes = completions.filter(c => c.success);
    const failures = completions.filter(c => !c.success);
    
    // Emit batched notifications
    if (successes.length > 0) {
      if (successes.length === 1) {
        // Single success - detailed notification
        const task = successes[0].task;
        console.log(`Task completed: ${task.taskType}`);
        // Emit event for UI notification system
        window.dispatchEvent(new CustomEvent('task-completed', {
          detail: { task, success: true }
        }));
      } else {
        // Multiple successes - batched notification
        console.log(`${successes.length} tasks completed successfully`);
        window.dispatchEvent(new CustomEvent('tasks-completed-batch', {
          detail: { count: successes.length, tasks: successes.map(c => c.task) }
        }));
      }
    }
    
    if (failures.length > 0) {
      if (failures.length === 1) {
        // Single failure - detailed notification
        const task = failures[0].task;
        console.log(`Task failed: ${task.taskType}`);
        window.dispatchEvent(new CustomEvent('task-failed', {
          detail: { task, success: false }
        }));
      } else {
        // Multiple failures - batched notification
        console.log(`${failures.length} tasks failed`);
        window.dispatchEvent(new CustomEvent('tasks-failed-batch', {
          detail: { count: failures.length, tasks: failures.map(c => c.task) }
        }));
      }
    }
    
    // Clear batch
    this.notificationBatch.completions = [];
    this.notificationBatch.batchTimer = null;
  }
  
  /**
   * Remove task from agent's queue
   * @param {string} agentId - Agent entity ID
   * @param {string} taskId - Task entity ID
   * @private
   */
  removeFromAgentQueue(agentId, taskId) {
    const queue = this.agentQueues.get(agentId);
    if (queue) {
      const index = queue.indexOf(taskId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
    
    // Update agent's task component
    const agent = this.entityRegistry.getEntity(agentId);
    if (agent) {
      const taskComponent = agent.getComponent('task');
      if (taskComponent) {
        const task = this.entityRegistry.getEntity(taskId);
        if (task) {
          const queueIndex = taskComponent.taskQueue.indexOf(task);
          if (queueIndex !== -1) {
            taskComponent.taskQueue.splice(queueIndex, 1);
          }
          
          // Add to history
          taskComponent.taskHistory.push(task);
          
          // Keep history limited to last 20 tasks
          if (taskComponent.taskHistory.length > 20) {
            taskComponent.taskHistory = taskComponent.taskHistory.slice(-20);
          }
        }
      }
    }
  }
  
  /**
   * Delay helper for async workflows
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Update all active tasks
   * Called every frame by Scene
   * @param {number} deltaTime - Time since last update in milliseconds
   * @param {Scene} scene - Scene instance for camera control (optional)
   */
  update(deltaTime, scene = null) {
    // Update execution states
    for (const [taskId, execution] of this.activeExecutions.entries()) {
      const task = this.entityRegistry.getEntity(taskId);
      if (!task) {
        this.activeExecutions.delete(taskId);
        continue;
      }
      
      // Update execution time
      execution.elapsedTime = Date.now() - execution.startTime;
    }
    
    // Update camera focus based on task priority
    if (scene) {
      this.updateCameraFocus(scene);
    }
    
    // Update workflow visuals
    if (this.workflowVisuals) {
      this.workflowVisuals.update(deltaTime);
    }
  }
  
  /**
   * Get system statistics
   * @returns {object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      activeTasks: this.activeExecutions.size,
      averageExecutionTime: this.stats.tasksCompleted > 0 
        ? this.stats.totalExecutionTime / this.stats.tasksCompleted 
        : 0
    };
  }
  
  /**
   * Reset system statistics
   */
  resetStats() {
    this.stats = {
      tasksAssigned: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      totalExecutionTime: 0
    };
  }
  
  /**
   * Clear all active executions
   * Useful for cleanup or reset
   */
  clearAll() {
    // Clear notification batch timer
    if (this.notificationBatch.batchTimer) {
      clearTimeout(this.notificationBatch.batchTimer);
      this.notificationBatch.batchTimer = null;
    }
    
    // Flush any pending notifications
    this.flushNotificationBatch();
    
    this.activeExecutions.clear();
    this.agentQueues.clear();
    this.taskAssignments.clear();
    this.completionCallbacks.clear();
    this.progressCallbacks.clear();
    this.workstationOccupancy.clear();
    this.workstationQueues.clear();
    this.cameraFocusPriority = null;
    
    // Clear workflow visuals
    if (this.workflowVisuals) {
      this.workflowVisuals.clearAll();
    }
  }
}

export default TaskExecutionSystem;
