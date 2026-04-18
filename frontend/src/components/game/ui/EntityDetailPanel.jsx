import { useState, useEffect } from 'react';

/**
 * EntityDetailPanel Component
 * 
 * Displays detailed information about a selected entity (agent or task).
 * Appears when an entity is selected in the game world.
 * 
 * Features:
 * - Agent details view (stats, current task, actions)
 * - Task details view (info, logs, actions)
 * - Draggable panel positioning
 * - Close button and minimize functionality
 * - Real-time updates
 * 
 * Requirements: 7.1, 7.5
 */
const EntityDetailPanel = ({ scene, selectedEntityId, onClose }) => {
  const [entity, setEntity] = useState(null);
  const [entityType, setEntityType] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 200, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Update entity data when selection changes
  useEffect(() => {
    if (!scene || !selectedEntityId) {
      setEntity(null);
      setEntityType(null);
      return;
    }

    const updateEntity = () => {
      const registry = scene.getEntityRegistry();
      const selectedEntity = registry.getEntity(selectedEntityId);
      
      if (selectedEntity) {
        setEntity(selectedEntity);
        setEntityType(selectedEntity.type);
      } else {
        setEntity(null);
        setEntityType(null);
      }
    };

    // Initial update
    updateEntity();

    // Poll for updates every 500ms
    const interval = setInterval(updateEntity, 500);

    return () => clearInterval(interval);
  }, [scene, selectedEntityId]);

  // Handle drag start
  const handleMouseDown = (e) => {
    if (e.target.closest('.panel-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Don't render if no entity selected
  if (!entity || !selectedEntityId) {
    return null;
  }

  return (
    <div
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '400px',
        zIndex: 130,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="panel-header bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-3 rounded-t-lg flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {entityType === 'agent' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            )}
          </svg>
          <h3 className="font-semibold">
            {entityType === 'agent' ? 'Agent Details' : 'Task Details'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 rounded p-1 transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMinimized ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              )}
            </svg>
          </button>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded p-1 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 max-h-96 overflow-y-auto">
          {entityType === 'agent' ? (
            <AgentDetails entity={entity} />
          ) : entityType === 'task' ? (
            <TaskDetails entity={entity} />
          ) : (
            <div className="text-gray-500 text-sm">Unknown entity type</div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * AgentDetails Component
 * 
 * Displays detailed information about an agent entity.
 */
const AgentDetails = ({ entity }) => {
  const position = entity.getComponent('position');
  const task = entity.getComponent('task');
  const animation = entity.getComponent('animation');

  // Get agent metadata
  const agentType = entity.agentType || 'unknown';
  const agentName = entity.name || 'Unknown Agent';
  const agentState = entity.state || 'idle';

  // Format agent type for display
  const formatAgentType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get state color
  const getStateColor = (state) => {
    switch (state) {
      case 'working': return 'text-blue-600 bg-blue-50';
      case 'idle': return 'text-gray-600 bg-gray-50';
      case 'thinking': return 'text-purple-600 bg-purple-50';
      case 'celebrating': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'blocked': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Agent Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {agentName.charAt(0)}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{agentName}</h4>
          <p className="text-sm text-gray-600">{formatAgentType(agentType)}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStateColor(agentState)}`}>
            {agentState.charAt(0).toUpperCase() + agentState.slice(1)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Tasks Completed</div>
          <div className="text-lg font-semibold text-gray-900">
            {entity.tasksCompleted || 0}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Success Rate</div>
          <div className="text-lg font-semibold text-gray-900">
            {entity.successRate ? `${Math.round(entity.successRate * 100)}%` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Current Task */}
      {task && task.currentTask ? (
        <div className="border-t pt-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">Current Task</h5>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium text-gray-900">
                {task.currentTask.type || 'Unknown Task'}
              </span>
            </div>
            {task.currentTask.progress !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(task.currentTask.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.currentTask.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t pt-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">Current Task</h5>
          <div className="text-sm text-gray-500 italic">No active task</div>
        </div>
      )}

      {/* Position Info */}
      {position && (
        <div className="border-t pt-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">Position</h5>
          <div className="text-xs text-gray-600 font-mono">
            X: {Math.round(position.x)}, Y: {Math.round(position.y)}
          </div>
        </div>
      )}

      {/* Animation State */}
      {animation && (
        <div className="border-t pt-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">Animation</h5>
          <div className="text-sm text-gray-600">
            {animation.currentAnimation || 'None'}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t pt-4 flex gap-2">
        <button className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          View History
        </button>
        <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
          Assign Task
        </button>
      </div>
    </div>
  );
};

/**
 * TaskDetails Component
 * 
 * Displays detailed information about a task entity.
 */
const TaskDetails = ({ entity }) => {
  const taskType = entity.taskType || 'unknown';
  const status = entity.status || 'queued';
  const progress = entity.progress || 0;
  const assignedAgentId = entity.assignedAgent;

  // Format task type for display
  const formatTaskType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'queued': return 'text-gray-600 bg-gray-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get task icon
  const getTaskIcon = (type) => {
    switch (type) {
      case 'generate_content':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        );
      case 'publish_post':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        );
      case 'scrape_trends':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        );
      case 'handle_chat':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        );
      default:
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Task Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {getTaskIcon(taskType)}
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{formatTaskType(taskType)}</h4>
          <p className="text-xs text-gray-500 mt-0.5">ID: {entity.id.slice(0, 8)}...</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      {/* Progress */}
      {status === 'active' && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex justify-between text-sm text-gray-700 mb-2">
            <span className="font-medium">Progress</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Assigned Agent */}
      <div className="border-t pt-4">
        <h5 className="text-sm font-semibold text-gray-900 mb-2">Assigned Agent</h5>
        {assignedAgentId ? (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{assignedAgentId.slice(0, 16)}...</span>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">Not assigned</div>
        )}
      </div>

      {/* Task Info */}
      <div className="border-t pt-4 space-y-2">
        <h5 className="text-sm font-semibold text-gray-900 mb-2">Task Information</h5>
        {entity.startTime && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Start Time</span>
            <span className="text-gray-900 font-mono">
              {new Date(entity.startTime).toLocaleTimeString()}
            </span>
          </div>
        )}
        {entity.estimatedDuration && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Est. Duration</span>
            <span className="text-gray-900 font-mono">
              {Math.round(entity.estimatedDuration / 1000)}s
            </span>
          </div>
        )}
      </div>

      {/* Backend Reference */}
      {entity.backendReference && (
        <div className="border-t pt-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">Backend Reference</h5>
          <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded p-2 break-all">
            {entity.backendReference.dynamodbKey || entity.backendReference.executionId || 'N/A'}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t pt-4 flex gap-2">
        <button className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          View Logs
        </button>
        {status === 'active' && (
          <button className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
            Cancel Task
          </button>
        )}
      </div>
    </div>
  );
};

export default EntityDetailPanel;
