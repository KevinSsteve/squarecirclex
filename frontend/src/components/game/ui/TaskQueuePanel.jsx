import { useState, useEffect } from 'react';

const TaskQueuePanel = ({ scene, isCollapsed, onToggleCollapse }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!scene) return;

    const updateTasks = () => {
      const entityRegistry = scene.getEntityRegistry();
      const taskIds = Array.from(entityRegistry.entitiesByType.get('task') || []);
      
      const taskData = taskIds
        .map(id => entityRegistry.getEntity(id))
        .filter(entity => entity !== null)
        .map(entity => {
          const position = entity.getComponent('position');
          
          return {
            id: entity.id,
            type: entity.taskType,
            status: entity.status,
            title: entity.getDisplayName(),
            icon: entity.getIcon(),
            color: entity.getColor(),
            progress: entity.progress || 0,
            assignedAgentId: entity.assignedAgentId,
            backendRef: entity.backendRef,
            createdAt: entity.createdAt,
            completedAt: entity.completedAt,
            position: position ? { x: position.x, y: position.y } : null
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
      
      setTasks(taskData);
    };

    updateTasks();
    const intervalId = setInterval(updateTasks, 500);
    return () => clearInterval(intervalId);
  }, [scene]);

  const activeTasks = tasks.filter(task => task.status === 'active');
  const queuedTasks = tasks.filter(task => task.status === 'queued');
  const historyTasks = tasks.filter(task => 
    task.status === 'completed' || task.status === 'failed'
  ).slice(0, 20);

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'active': return activeTasks;
      case 'queued': return queuedTasks;
      case 'history': return historyTasks;
      default: return [];
    }
  };

  const handleTaskClick = (task) => {
    if (!task.position) return;
    
    const event = new CustomEvent('game:highlightTask', {
      detail: { taskId: task.id, position: task.position },
      bubbles: true
    });
    window.dispatchEvent(event);
    
    const focusEvent = new CustomEvent('game:focusOnEntity', {
      detail: { entityId: task.id, entityType: 'task' },
      bubbles: true
    });
    window.dispatchEvent(focusEvent);
  };

  if (isCollapsed) {
    return (
      <div className="fixed right-0 top-16 bottom-10 w-12 bg-white border-l border-gray-200 shadow-lg z-40">
        <button
          onClick={onToggleCollapse}
          className="w-full h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Expand task queue"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-16 bottom-10 w-80 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        <button onClick={onToggleCollapse} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Collapse panel">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'active' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active
          {activeTasks.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-600 rounded-full">{activeTasks.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('queued')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'queued' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Queued
          {queuedTasks.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{queuedTasks.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          History
          {historyTasks.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{historyTasks.length}</span>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {getCurrentTasks().length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {activeTab === 'active' && (<><p>No active tasks</p><p className="text-xs mt-2">Tasks will appear here when agents start working</p></>)}
            {activeTab === 'queued' && (<><p>No queued tasks</p><p className="text-xs mt-2">Tasks waiting for agents will appear here</p></>)}
            {activeTab === 'history' && (<><p>No task history</p><p className="text-xs mt-2">Completed and failed tasks will appear here</p></>)}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {getCurrentTasks().map(task => (
              <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({ task, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'border-blue-500 bg-blue-50';
      case 'queued': return 'border-gray-300 bg-gray-50';
      case 'completed': return 'border-green-500 bg-green-50';
      case 'failed': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'In Progress';
      case 'queued': return 'Waiting';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '⚡';
      case 'queued': return '⏳';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  return (
    <button onClick={onClick} className={`w-full p-3 border-l-4 rounded-lg transition-all hover:shadow-md ${getStatusColor(task.status)}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `#${task.color.toString(16).padStart(6, '0')}20` }}>
          <span className="text-xl">{task.icon}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-medium text-sm text-gray-900 truncate">{task.title}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{getStatusIcon(task.status)} {getStatusText(task.status)}</span>
          </div>
          {task.status === 'active' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(task.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${task.progress}%` }} />
              </div>
            </div>
          )}
          {(task.status === 'completed' || task.status === 'failed') && task.completedAt && (
            <div className="text-xs text-gray-500 mt-1">{new Date(task.completedAt).toLocaleTimeString()}</div>
          )}
        </div>
      </div>
    </button>
  );
};

export default TaskQueuePanel;