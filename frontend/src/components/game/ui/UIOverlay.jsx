import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AgentListPanel from './AgentListPanel';
import TaskQueuePanel from './TaskQueuePanel';
import EntityDetailPanel from './EntityDetailPanel';
import NotificationManager from './NotificationToast';
import AccessibilityPanel from './AccessibilityPanel';
import ViewToggleButton from './ViewToggleButton';
import SoundControlPanel from './SoundControlPanel';

/**
 * UIOverlay Component
 * 
 * Renders React UI components above the PixiJS game canvas using portals.
 * Provides a complete overlay structure with sidebars, top bar, and bottom bar.
 * 
 * Features:
 * - React portal rendering above canvas
 * - Left sidebar (agent list)
 * - Right sidebar (task queue)
 * - Top navigation bar
 * - Bottom status bar
 * - Panel collapse/expand functionality
 * - Z-index layering management
 * 
 * Requirements: 7.1, 7.6
 */
const UIOverlay = ({ 
  scene,
  fps = 60,
  connectionStatus = 'connected',
  agentCount = 0,
  taskCount = 0,
  onViewToggle,
  onManualRetry,
  children 
}) => {
  // Get user preferences from scene (Phase 10, Task 63)
  const userPreferences = scene?.getUserPreferences();
  
  // Load panel preferences from user preferences (Phase 10, Task 63)
  const panelPrefs = userPreferences?.getPanelPreferences() || {
    leftSidebar: { visible: true, width: 280 },
    rightSidebar: { visible: true, width: 320 },
    agentList: { expanded: true },
    taskQueue: { expanded: true }
  };
  
  // Panel visibility state (Phase 10, Task 63)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(panelPrefs.leftSidebar.visible);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(panelPrefs.rightSidebar.visible);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);
  const [soundPanelOpen, setSoundPanelOpen] = useState(false);
  
  // Save panel visibility to preferences when changed (Phase 10, Task 63)
  const handleLeftSidebarToggle = () => {
    const newState = !leftSidebarOpen;
    setLeftSidebarOpen(newState);
    if (userPreferences) {
      userPreferences.savePanelVisibility('leftSidebar', newState);
    }
  };
  
  const handleRightSidebarToggle = () => {
    const newState = !rightSidebarOpen;
    setRightSidebarOpen(newState);
    if (userPreferences) {
      userPreferences.savePanelVisibility('rightSidebar', newState);
    }
  };

  // Listen for entity selection events from the game world
  useEffect(() => {
    const handleEntitySelected = (event) => {
      const { entityId } = event.detail;
      setSelectedEntityId(entityId);
    };

    const handleEntityDeselected = () => {
      setSelectedEntityId(null);
    };
    
    const handleToggleAccessibilityPanel = () => {
      setAccessibilityPanelOpen(prev => !prev);
    };

    window.addEventListener('game:entitySelect', handleEntitySelected);
    window.addEventListener('game:entityDeselect', handleEntityDeselected);
    window.addEventListener('game:toggleAccessibilityPanel', handleToggleAccessibilityPanel);

    return () => {
      window.removeEventListener('game:entitySelect', handleEntitySelected);
      window.removeEventListener('game:entityDeselect', handleEntityDeselected);
      window.removeEventListener('game:toggleAccessibilityPanel', handleToggleAccessibilityPanel);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto" style={{ zIndex: 110 }}>
        <TopBar 
          onViewToggle={onViewToggle}
          connectionStatus={connectionStatus}
          onAccessibilityClick={() => setAccessibilityPanelOpen(true)}
          onSoundClick={() => setSoundPanelOpen(true)}
          onManualRetry={onManualRetry}
        />
      </div>

      {/* Left Sidebar - Agent List */}
      {scene && (
        <AgentListPanel
          scene={scene}
          isCollapsed={!leftSidebarOpen}
          onToggleCollapse={handleLeftSidebarToggle}
        />
      )}

      {/* Right Sidebar - Task Queue */}
      {scene && (
        <TaskQueuePanel
          scene={scene}
          isCollapsed={!rightSidebarOpen}
          onToggleCollapse={handleRightSidebarToggle}
        />
      )}

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto" style={{ zIndex: 110 }}>
        <BottomBar 
          fps={fps}
          connectionStatus={connectionStatus}
          agentCount={agentCount}
          taskCount={taskCount}
        />
      </div>

      {/* Floating panels and modals */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 120 }}>
        {/* Entity Detail Panel */}
        {selectedEntityId && (
          <EntityDetailPanel
            scene={scene}
            selectedEntityId={selectedEntityId}
            onClose={() => setSelectedEntityId(null)}
          />
        )}
        
        {/* Notification Manager */}
        {scene && <NotificationManager scene={scene} />}
        
        {/* Accessibility Panel */}
        {scene && (
          <AccessibilityPanel
            scene={scene}
            isOpen={accessibilityPanelOpen}
            onClose={() => setAccessibilityPanelOpen(false)}
          />
        )}
        
        {/* Sound Control Panel */}
        {scene && soundPanelOpen && (
          <SoundControlPanel
            soundSystem={scene.getSoundSystem()}
            onClose={() => setSoundPanelOpen(false)}
          />
        )}
        
        {children}
      </div>

      {/* Collapse/Expand Toggle Buttons */}
      {!leftSidebarOpen && (
        <button
          onClick={handleLeftSidebarToggle}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-r-lg p-2 hover:bg-gray-50 transition-colors pointer-events-auto"
          style={{ zIndex: 106 }}
          aria-label="Expand left sidebar"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {!rightSidebarOpen && (
        <button
          onClick={handleRightSidebarToggle}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-l-lg p-2 hover:bg-gray-50 transition-colors pointer-events-auto"
          style={{ zIndex: 106 }}
          aria-label="Expand right sidebar"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </div>,
    document.body
  );
};

/**
 * TopBar Component
 * 
 * Navigation bar at the top of the screen.
 * Contains view toggle, camera controls, search, and user menu.
 * 
 * Requirements: 12.1
 */
const TopBar = ({ onViewToggle, connectionStatus, onAccessibilityClick, onSoundClick, onManualRetry }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Handle search input
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Emit search event for game world to handle
    window.dispatchEvent(new CustomEvent('game:search', {
      detail: { query: query.trim() }
    }));
    
    setShowSearchResults(true);
  };

  // Listen for search results from game world
  useEffect(() => {
    const handleSearchResults = (event) => {
      setSearchResults(event.detail.results || []);
    };

    window.addEventListener('game:searchResults', handleSearchResults);
    return () => window.removeEventListener('game:searchResults', handleSearchResults);
  }, []);

  // Camera control handlers
  const handleCameraControl = (action) => {
    window.dispatchEvent(new CustomEvent('game:cameraControl', {
      detail: { action }
    }));
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="h-16 px-4 flex items-center justify-between">
        {/* Left section - Logo and title */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">AI Company Simulator</h1>
          
          {/* View Toggle (Phase 10, Task 64) */}
          <ViewToggleButton />
        </div>

        {/* Center section - Camera controls and search */}
        <div className="flex items-center gap-4">
          {/* Camera Control Buttons */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => handleCameraControl('zoomIn')}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title="Zoom In (+)"
              aria-label="Zoom in"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
            <button
              onClick={() => handleCameraControl('zoomOut')}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title="Zoom Out (-)"
              aria-label="Zoom out"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6" />
              </svg>
            </button>
            <button
              onClick={() => handleCameraControl('reset')}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title="Reset View (Home)"
              aria-label="Reset camera view"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                placeholder="Search agents or tasks..."
                className="w-64 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('game:focusEntity', {
                        detail: { entityId: result.id }
                      }));
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-lg">{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{result.name}</div>
                      <div className="text-xs text-gray-500">{result.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
            <kbd className="px-2 py-1 bg-gray-100 rounded">↑↓←→</kbd>
            <span>Pan</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded">Tab</kbd>
            <span>Cycle</span>
          </div>
        </div>

        {/* Right section - Status and user menu */}
        <div className="flex items-center gap-4">
          {/* Sound Button */}
          <button
            onClick={onSoundClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sound Settings (Ctrl+S)"
            aria-label="Open sound settings"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          
          {/* Accessibility Button */}
          <button
            onClick={onAccessibilityClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Accessibility Settings (Ctrl+A)"
            aria-label="Open accessibility settings"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'disconnected' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500 animate-pulse'
            }`} 
            role="status"
            aria-label={
              connectionStatus === 'connected' ? 'Connected to backend' :
              connectionStatus === 'disconnected' ? 'Reconnecting to backend' :
              'Connection error'
            }
            />
            <span className="text-xs text-gray-600">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'disconnected' ? 'Reconnecting' :
               'Connection Error'}
            </span>
            
            {/* Manual Retry Button */}
            {connectionStatus === 'error' && onManualRetry && (
              <button
                onClick={onManualRetry}
                className="ml-2 px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
                title="Retry connection to backend"
                aria-label="Retry connection"
              >
                Retry
              </button>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="User menu"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('game:toggleDebug'));
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Toggle Debug (D)
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('game:togglePerformanceMode'));
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Performance Mode
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/settings';
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/dashboard';
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * BottomBar Component
 * 
 * Status bar at the bottom of the screen.
 * Shows sync status, agent count, task count, and FPS.
 * 
 * Requirements: 8.6
 */
const BottomBar = ({ fps, connectionStatus, agentCount, taskCount }) => {
  return (
    <div className="bg-white border-t border-gray-200 shadow-sm">
      <div className="h-10 px-4 flex items-center justify-between text-xs text-gray-600">
        {/* Left section - Sync status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>
              {connectionStatus === 'connected' ? 'Synced' :
               connectionStatus === 'disconnected' ? 'Syncing...' :
               'Sync Error'}
            </span>
          </div>
        </div>

        {/* Center section - Counts */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{agentCount} Agent{agentCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{taskCount} Task{taskCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Right section - Performance */}
        <div className="flex items-center gap-2">
          <span className="font-mono">{fps} FPS</span>
          <div className={`w-2 h-2 rounded-full ${
            fps >= 55 ? 'bg-green-500' :
            fps >= 45 ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
