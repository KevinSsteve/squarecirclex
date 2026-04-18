/**
 * TaskComponent - Task tracking for agent entities
 * 
 * Manages task assignment, queue, and history for agents.
 * 
 * Requirements: 2.2, 2.6
 * Phase 2, Task 7
 */

/**
 * Create a task component
 * @param {object|null} currentTask - Currently executing task
 * @param {Array} taskQueue - Queue of pending tasks
 * @param {Array} taskHistory - History of completed tasks
 * @returns {object} Task component data
 */
export function createTaskComponent(
  currentTask = null,
  taskQueue = [],
  taskHistory = []
) {
  return {
    type: 'task',
    currentTask,
    taskQueue,
    taskHistory,
    // Task statistics
    stats: {
      totalCompleted: 0,
      totalFailed: 0,
      successRate: 0,
      averageTaskTime: 0
    }
  };
}

/**
 * Update task component
 * @param {object} component - Task component to update
 * @param {object} updates - Updates to apply
 * @returns {object} Updated component
 */
export function updateTaskComponent(component, updates) {
  return {
    ...component,
    ...updates
  };
}

/**
 * Assign task to agent
 * @param {object} component - Task component
 * @param {object} task - Task to assign
 * @returns {object} Updated component
 */
export function assignTask(component, task) {
  return updateTaskComponent(component, {
    currentTask: task
  });
}

/**
 * Clear current task
 * @param {object} component - Task component
 * @returns {object} Updated component
 */
export function clearCurrentTask(component) {
  return updateTaskComponent(component, {
    currentTask: null
  });
}

/**
 * Add task to queue
 * @param {object} component - Task component
 * @param {object} task - Task to queue
 * @returns {object} Updated component
 */
export function queueTask(component, task) {
  return updateTaskComponent(component, {
    taskQueue: [...component.taskQueue, task]
  });
}

/**
 * Remove task from queue
 * @param {object} component - Task component
 * @param {string} taskId - ID of task to remove
 * @returns {object} Updated component
 */
export function removeFromQueue(component, taskId) {
  return updateTaskComponent(component, {
    taskQueue: component.taskQueue.filter(t => t.id !== taskId)
  });
}

/**
 * Get next task from queue
 * @param {object} component - Task component
 * @returns {object|null} Next task or null if queue is empty
 */
export function getNextTask(component) {
  return component.taskQueue.length > 0 ? component.taskQueue[0] : null;
}

/**
 * Pop next task from queue
 * @param {object} component - Task component
 * @returns {object} Updated component and popped task
 */
export function popNextTask(component) {
  if (component.taskQueue.length === 0) {
    return { component, task: null };
  }
  
  const [task, ...remainingQueue] = component.taskQueue;
  const updatedComponent = updateTaskComponent(component, {
    taskQueue: remainingQueue
  });
  
  return { component: updatedComponent, task };
}

/**
 * Add task to history
 * @param {object} component - Task component
 * @param {object} task - Completed task
 * @returns {object} Updated component
 */
export function addToHistory(component, task) {
  const history = [task, ...component.taskHistory];
  
  // Keep only last 20 tasks in history
  const trimmedHistory = history.slice(0, 20);
  
  // Update stats
  const stats = { ...component.stats };
  if (task.status === 'completed') {
    stats.totalCompleted++;
  } else if (task.status === 'failed') {
    stats.totalFailed++;
  }
  
  const total = stats.totalCompleted + stats.totalFailed;
  stats.successRate = total > 0 ? stats.totalCompleted / total : 0;
  
  // Update average task time
  if (task.completedAt && task.startedAt) {
    const taskTime = task.completedAt - task.startedAt;
    stats.averageTaskTime = (stats.averageTaskTime * (total - 1) + taskTime) / total;
  }
  
  return updateTaskComponent(component, {
    taskHistory: trimmedHistory,
    stats
  });
}

/**
 * Clear task history
 * @param {object} component - Task component
 * @returns {object} Updated component
 */
export function clearHistory(component) {
  return updateTaskComponent(component, {
    taskHistory: []
  });
}

/**
 * Get task statistics
 * @param {object} component - Task component
 * @returns {object} Task statistics
 */
export function getTaskStats(component) {
  return { ...component.stats };
}
