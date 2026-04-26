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
      <div className="fixed left-0 top-16 bottom-10 w-12 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-xl z-40 pointer-events-auto backdrop-blur-sm">
        <button
          onClick={onToggleCollapse}
          className="w-full h-12 flex items-center justify-center hover:bg-white/80 transition-all duration-200"
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
    <div className="fixed left-0 top-16 bottom-10 w-72 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-xl z-40 flex flex-col pointer-events-auto backdrop-blur-sm animate-slideInLeft">
      {/* Header with gradient */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Agents</h2>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-white/80 rounded-lg transition-all duration-200"
          title="Collapse panel"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Filter with enhanced styling */}
      <div className="p-4 border-b border-gray-200 bg-white/50">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:border-gray-400"
        >
          <option value="all">🏢 All Departments</option>
          <option value="content_creation">✨ Content Creation</option>
          <option value="publishing">📤 Publishing</option>
          <option value="trend_analysis">📊 Trend Analysis</option>
          <option value="customer_support">💬 Customer Support</option>
          <option value="administration">⚙️ Administration</option>
        </select>
      </div>

      {/* Agent Lists with smooth scrolling */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Active Agents */}
        {activeAgents.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Active
              </h3>
              <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {activeAgents.length}
              </span>
            </div>
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
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Idle
              </h3>
              <span className="ml-auto px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                {idleAgents.length}
              </span>
            </div>
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

        {/* Empty State with enhanced styling */}
        {filteredAgents.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">No agents found</p>
            <p className="text-gray-400 text-xs mt-1">Try selecting a different department</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * AgentCard Component
 * Individual agent card showing avatar, name, status, and current task
 * Enhanced with 3D visual style and department theme colors
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
  
  // Get department theme color (from Phase 2 DepartmentRenderer)
  const getDepartmentColor = (department) => {
    const colors = {
      content_creation: '#4F46E5', // Indigo
      publishing: '#10B981', // Green
      trend_analysis: '#F59E0B', // Amber
      customer_support: '#8B5CF6', // Purple
      administration: '#6B7280' // Gray
    };
    return colors[department] || '#6B7280';
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 text-left border border-gray-100 hover:border-gray-200 hover:shadow-md group"
    >
      <div className="flex items-start gap-3">
        {/* Avatar circle with department color and 3D effect */}
        <div className="relative flex-shrink-0">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-110"
            style={{ 
              backgroundColor: getDepartmentColor(agent.department),
              boxShadow: `0 4px 12px ${getDepartmentColor(agent.department)}40`
            }}
          >
            <span className="text-xl filter drop-shadow-sm">{agent.icon}</span>
          </div>
          {/* Status indicator with pulse animation */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getStatusColor(agent.state)} rounded-full border-2 border-white shadow-sm ${
            agent.state === 'working' || agent.state === 'thinking' ? 'animate-pulse' : ''
          }`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">
            {agent.name}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(agent.state)}`} />
            <span className="text-xs text-gray-600 font-medium">
              {getStatusText(agent.state)}
            </span>
          </div>
          {agent.currentTask && (
            <div className="mt-1.5 px-2 py-0.5 bg-blue-50 rounded-md inline-block">
              <span className="text-xs text-blue-700 font-medium truncate block max-w-[180px]">
                {getTaskDisplayName(agent.currentTask)}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default AgentListPanel;
