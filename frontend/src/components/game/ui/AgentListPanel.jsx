import { useState, useEffect } from 'react';

/**
 * AgentListPanel Component
 * 
 * Left sidebar panel showing list of all agents with their current status.
 * Allows filtering by department and clicking to focus camera on agent.
 * 
 * Features:
 * - Active/Idle agent sections
 * - Department filter dropdown
 * - Click to focus camera on agent
 * - Collapsible panel
 * - Real-time updates from entity registry
 * 
 * Requirements: 7.2
 * Phase 7, Task 37
 */
const AgentListPanel = ({ scene, isCollapsed, onToggleCollapse }) => {
  const [filter, setFilter] = useState('all');
  const [agents, setAgents] = useState([]);

  // Subscribe to entity registry updates
  useEffect(() => {
    if (!scene) return;

    const updateAgents = () => {
      const entityRegistry = scene.getEntityRegistry();
      const agentIds = Array.from(entityRegistry.entitiesByType.get('agent') || []);
      
      const agentData = agentIds
        .map(id => entityRegistry.getEntity(id))
        .filter(entity => entity !== null)
        .map(entity => {
          const position = entity.getComponent('position');
          const taskComponent = entity.getComponent('task');
          
          return {
            id: entity.id,
            name: entity.getDisplayName(),
            type: entity.type,
            state: entity.getState(),
            department: entity.department,
            icon: entity.getIcon(),
            color: entity.getColor(),
            currentTask: taskComponent?.currentTask?.type || null,
            position: position ? { x: position.x, y: position.y } : null
          };
        });
      
      setAgents(agentData);
    };

    // Initial update
    updateAgents();

    // Update every 500ms to reflect entity changes
    const intervalId = setInterval(updateAgents, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [scene]);

  // Filter agents based on selected filter
  const filteredAgents = agents.filter(agent => {
    if (filter === 'all') return true;
    return agent.department === filter;
  });

  // Separate active and idle agents
  const activeAgents = filteredAgents.filter(agent => 
    agent.state === 'working' || agent.state === 'thinking' || agent.state === 'blocked'
  );
  const idleAgents = filteredAgents.filter(agent => 
    agent.state === 'idle' || agent.state === 'celebrating'
  );
  
  // Handle agent click - focus camera on agent
  const handleAgentClick = (agent) => {
    if (!agent.position) return;
    
    // Emit event to focus camera on agent
    const event = new CustomEvent('game:focusOnEntity', {
      detail: {
        entityId: agent.id,
        entityType: 'agent'
      },
      bubbles: true
    });
    window.dispatchEvent(event);
  };

  if (isCollapsed) {
    return (
      <div className="fixed left-0 top-16 bottom-10 w-12 bg-white border-r border-gray-200 shadow-lg z-40">
        <button
          onClick={onToggleCollapse}
          className="w-full h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Expand agent list"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-16 bottom-10 w-72 bg-white border-r border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Agents</h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Collapse panel"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Filter */}
      <div className="p-4 border-b border-gray-200">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Departments</option>
          <option value="content_creation">Content Creation</option>
          <option value="publishing">Publishing</option>
          <option value="trend_analysis">Trend Analysis</option>
          <option value="customer_support">Customer Support</option>
          <option value="administration">Administration</option>
        </select>
      </div>

      {/* Agent Lists */}
      <div className="flex-1 overflow-y-auto">
        {/* Active Agents */}
        {activeAgents.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Active ({activeAgents.length})
            </h3>
            <div className="space-y-2">
              {activeAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => handleAgentClick(agent)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Idle Agents */}
        {idleAgents.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Idle ({idleAgents.length})
            </h3>
            <div className="space-y-2">
              {idleAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => handleAgentClick(agent)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredAgents.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No agents found
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * AgentCard Component
 * Individual agent card showing avatar, name, status, and current task
 */
const AgentCard = ({ agent, onClick }) => {
  const getStatusColor = (state) => {
    switch (state) {
      case 'working': return 'bg-blue-500';
      case 'thinking': return 'bg-purple-500';
      case 'blocked': return 'bg-orange-500';
      case 'idle': return 'bg-gray-400';
      case 'celebrating': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (state) => {
    switch (state) {
      case 'working': return 'Working';
      case 'thinking': return 'Thinking';
      case 'blocked': return 'Blocked';
      case 'idle': return 'Idle';
      case 'celebrating': return 'Celebrating';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };
  
  const getTaskDisplayName = (taskType) => {
    if (!taskType) return null;
    
    const taskNames = {
      'generate_content': 'Generating Content',
      'publish_post': 'Publishing Post',
      'scrape_trends': 'Scraping Trends',
      'handle_chat': 'Handling Chat',
      'oauth_flow': 'OAuth Flow'
    };
    
    return taskNames[taskType] || taskType;
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
    >
      <div className="flex items-start gap-3">
        {/* Avatar with agent icon */}
        <div className="relative">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `#${agent.color.toString(16).padStart(6, '0')}` }}
          >
            <span className="text-lg">{agent.icon}</span>
          </div>
          {/* Status indicator */}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(agent.state)} rounded-full border-2 border-white`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {agent.name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {getStatusText(agent.state)}
          </div>
          {agent.currentTask && (
            <div className="text-xs text-blue-600 mt-1 truncate">
              {getTaskDisplayName(agent.currentTask)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default AgentListPanel;
