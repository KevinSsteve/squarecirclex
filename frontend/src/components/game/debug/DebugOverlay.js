/**
 * DebugOverlay System
 * 
 * Comprehensive debug overlay for game development and troubleshooting.
 * 
 * Features:
 * - Performance metrics (FPS, entity count, draw calls, memory)
 * - State inspector (backend vs rendered state comparison)
 * - Visual bounding boxes for collision debugging
 * - Entity inspector with detailed component information
 * - System status monitoring
 * 
 * Phase 10, Task 62
 * Requirements: 15.1, 15.3, 15.4
 */

import * as PIXI from 'pixi.js';

class DebugOverlay {
  constructor(scene, app) {
    this.scene = scene;
    this.app = app;
    
    // Debug state
    this.enabled = false;
    this.activeTab = 'performance'; // 'performance', 'state', 'entities', 'systems'
    this.showBoundingBoxes = false;
    this.selectedEntity = null;
    
    // UI elements
    this.container = null;
    this.boundingBoxGraphics = null;
    
    // State comparison
    this.backendState = null;
    this.lastSyncTime = null;
    
    // Initialize
    this.setupUI();
    this.setupKeyboardShortcuts();
    this.setupBoundingBoxes();
  }
  
  /**
   * Setup debug overlay UI
   */
  setupUI() {
    // Create main container
    const container = document.createElement('div');
    container.id = 'debug-overlay';
    container.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 0;
      border-radius: 6px;
      z-index: 10000;
      display: none;
      width: 400px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(container);
    this.container = container;
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (event) => {
      // Toggle debug overlay with 'D' key
      if (event.key === 'd' || event.key === 'D') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          this.toggle();
          event.preventDefault();
        }
      }
      
      // Toggle bounding boxes with 'B' key
      if (event.key === 'b' || event.key === 'B') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          this.toggleBoundingBoxes();
          event.preventDefault();
        }
      }
      
      // Switch tabs with number keys (when overlay is open)
      if (this.enabled && event.key >= '1' && event.key <= '4') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          const tabs = ['performance', 'state', 'entities', 'systems'];
          this.activeTab = tabs[parseInt(event.key) - 1];
          this.render();
          event.preventDefault();
        }
      }
    });
  }
  
  /**
   * Setup bounding box visualization
   */
  setupBoundingBoxes() {
    // Create graphics object for bounding boxes
    this.boundingBoxGraphics = new PIXI.Graphics();
    this.boundingBoxGraphics.visible = false;
    
    // Add to UI layer (rendered on top)
    this.scene.addToLayer('ui_world', this.boundingBoxGraphics);
  }
  
  /**
   * Toggle debug overlay visibility
   */
  toggle() {
    this.enabled = !this.enabled;
    
    if (this.container) {
      this.container.style.display = this.enabled ? 'block' : 'none';
    }
    
    if (this.enabled) {
      this.render();
    }
    
    console.log(`Debug overlay: ${this.enabled ? 'ON' : 'OFF'}`);
  }
  
  /**
   * Toggle bounding box visualization
   */
  toggleBoundingBoxes() {
    this.showBoundingBoxes = !this.showBoundingBoxes;
    
    if (this.boundingBoxGraphics) {
      this.boundingBoxGraphics.visible = this.showBoundingBoxes;
    }
    
    console.log(`Bounding boxes: ${this.showBoundingBoxes ? 'ON' : 'OFF'}`);
  }

  /**
   * Update debug overlay
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Update bounding boxes if visible
    if (this.showBoundingBoxes) {
      this.updateBoundingBoxes();
    }
    
    // Update UI if enabled
    if (this.enabled) {
      this.render();
    }
  }
  
  /**
   * Update bounding box visualization
   */
  updateBoundingBoxes() {
    if (!this.boundingBoxGraphics) return;
    
    this.boundingBoxGraphics.clear();
    
    // Get all entities
    const entities = this.scene.entityRegistry.getAllEntities();
    
    entities.forEach(entity => {
      const position = entity.getComponent('position');
      const sprite = entity.getComponent('sprite');
      
      if (!position || !sprite || !sprite.pixiSprite) return;
      
      // Get sprite bounds
      const bounds = sprite.pixiSprite.getBounds();
      
      // Draw bounding box
      this.boundingBoxGraphics.rect(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height
      );
      
      // Color based on entity type
      let color = 0x00ff00; // Green for default
      if (entity.type === 'agent') {
        color = 0x00ffff; // Cyan for agents
      } else if (entity.type === 'task') {
        color = 0xffff00; // Yellow for tasks
      } else if (entity.type === 'environment') {
        color = 0xff00ff; // Magenta for environment
      }
      
      this.boundingBoxGraphics.stroke({ width: 1, color, alpha: 0.8 });
      
      // Draw center point
      this.boundingBoxGraphics.circle(position.x, position.y, 3);
      this.boundingBoxGraphics.fill({ color: 0xff0000, alpha: 0.8 });
    });
  }
  
  /**
   * Render debug overlay UI
   */
  render() {
    if (!this.container || !this.enabled) return;
    
    // Build HTML based on active tab
    let content = '';
    
    // Tab navigation
    content += this.renderTabNavigation();
    
    // Tab content
    switch (this.activeTab) {
      case 'performance':
        content += this.renderPerformanceTab();
        break;
      case 'state':
        content += this.renderStateTab();
        break;
      case 'entities':
        content += this.renderEntitiesTab();
        break;
      case 'systems':
        content += this.renderSystemsTab();
        break;
    }
    
    // Footer with shortcuts
    content += this.renderFooter();
    
    this.container.innerHTML = content;
  }

  /**
   * Render tab navigation
   */
  renderTabNavigation() {
    const tabs = [
      { id: 'performance', label: 'Performance', key: '1' },
      { id: 'state', label: 'State', key: '2' },
      { id: 'entities', label: 'Entities', key: '3' },
      { id: 'systems', label: 'Systems', key: '4' }
    ];
    
    let html = '<div style="display: flex; border-bottom: 1px solid #333; background: #111;">';
    
    tabs.forEach(tab => {
      const isActive = this.activeTab === tab.id;
      const bgColor = isActive ? '#222' : '#111';
      const textColor = isActive ? '#00ff00' : '#666';
      
      html += `
        <div style="
          flex: 1;
          padding: 8px;
          text-align: center;
          background: ${bgColor};
          color: ${textColor};
          cursor: pointer;
          border-right: 1px solid #333;
          font-weight: ${isActive ? 'bold' : 'normal'};
        ">
          ${tab.label} (${tab.key})
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }
  
  /**
   * Render performance tab
   */
  renderPerformanceTab() {
    const performanceMonitor = this.scene.getPerformanceMonitor();
    if (!performanceMonitor) {
      return '<div style="padding: 10px;">Performance monitor not available</div>';
    }
    
    const metrics = performanceMonitor.getMetrics();
    const thresholds = performanceMonitor.thresholds;
    const qualityLevel = performanceMonitor.getQualityLevel();
    
    // Color code values
    const fpsColor = this.getColorForValue(metrics.fps, thresholds.fps.warning, thresholds.fps.critical, true);
    const entityColor = this.getColorForValue(metrics.entityCount, thresholds.entityCount.warning, thresholds.entityCount.critical, false);
    const memoryColor = this.getColorForValue(metrics.memoryUsage, thresholds.memoryUsage.warning, thresholds.memoryUsage.critical, false);
    
    return `
      <div style="padding: 10px; max-height: calc(90vh - 100px); overflow-y: auto;">
        <div style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px;">FRAME RATE</div>
          <div style="font-size: 16px;">
            FPS: <span style="color: ${fpsColor}; font-weight: bold;">${metrics.fps}</span> / ${thresholds.fps.target}
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px;">ENTITIES</div>
          <div>
            Count: <span style="color: ${entityColor};">${metrics.entityCount}</span>
          </div>
          <div style="font-size: 9px; color: #666;">
            Warning: ${thresholds.entityCount.warning} | Critical: ${thresholds.entityCount.critical}
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px;">RENDERING</div>
          <div>Draw Calls: <span style="color: #00aaff;">${metrics.drawCalls}</span></div>
          <div>Update Time: <span style="color: #00aaff;">${metrics.updateTime.toFixed(2)} ms</span></div>
          <div>Render Time: <span style="color: #00aaff;">${metrics.renderTime.toFixed(2)} ms</span></div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px;">MEMORY</div>
          <div>
            Usage: <span style="color: ${memoryColor};">${metrics.memoryUsage} MB</span>
          </div>
          <div style="font-size: 9px; color: #666;">
            Warning: ${thresholds.memoryUsage.warning} MB | Critical: ${thresholds.memoryUsage.critical} MB
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px;">QUALITY</div>
          <div>
            Level: <span style="color: #ffaa00; text-transform: uppercase;">${qualityLevel}</span>
          </div>
          <div style="font-size: 9px; color: #666;">
            Auto-adjust: ${performanceMonitor.autoQuality.enabled ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render state inspector tab
   */
  renderStateTab() {
    const stateSyncSystem = this.scene.getStateSyncSystem();
    
    if (!stateSyncSystem) {
      return '<div style="padding: 10px;">State sync system not available</div>';
    }
    
    const currentState = stateSyncSystem.getCurrentState();
    const syncStatus = stateSyncSystem.getSyncStatus();
    const lastSyncTime = stateSyncSystem.getLastSyncTime();
    
    // Get backend state (if available)
    const backendState = stateSyncSystem.getBackendState ? stateSyncSystem.getBackendState() : null;
    
    // Calculate time since last sync
    const timeSinceSync = lastSyncTime ? Date.now() - lastSyncTime : null;
    const syncTimeStr = timeSinceSync ? `${(timeSinceSync / 1000).toFixed(1)}s ago` : 'Never';
    
    // Status color
    const statusColor = syncStatus === 'connected' ? '#00ff00' : 
                       syncStatus === 'syncing' ? '#ffaa00' : '#ff0000';
    
    return `
      <div style="padding: 10px; max-height: calc(90vh - 100px); overflow-y: auto;">
        <div style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px;">SYNC STATUS</div>
          <div>
            Status: <span style="color: ${statusColor}; text-transform: uppercase;">${syncStatus}</span>
          </div>
          <div style="font-size: 9px; color: #666;">
            Last sync: ${syncTimeStr}
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px;">FRONTEND STATE</div>
          <div style="font-size: 9px; background: #111; padding: 8px; border-radius: 4px; overflow-x: auto;">
            <pre style="margin: 0; color: #00ff00;">${this.formatState(currentState)}</pre>
          </div>
        </div>
        
        ${backendState ? `
          <div style="margin-bottom: 12px;">
            <div style="color: #888; font-size: 10px; margin-bottom: 4px;">BACKEND STATE</div>
            <div style="font-size: 9px; background: #111; padding: 8px; border-radius: 4px; overflow-x: auto;">
              <pre style="margin: 0; color: #00aaff;">${this.formatState(backendState)}</pre>
            </div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="color: #888; font-size: 10px; margin-bottom: 4px;">STATE DIFF</div>
            <div style="font-size: 9px; background: #111; padding: 8px; border-radius: 4px;">
              ${this.renderStateDiff(currentState, backendState)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * Render entities tab
   */
  renderEntitiesTab() {
    const entities = this.scene.entityRegistry.getAllEntities();
    const stats = this.scene.entityRegistry.getStats();
    
    // Group entities by type
    const entitiesByType = {};
    entities.forEach(entity => {
      const type = entity.type || 'unknown';
      if (!entitiesByType[type]) {
        entitiesByType[type] = [];
      }
      entitiesByType[type].push(entity);
    });
    
    let html = `
      <div style="padding: 10px; max-height: calc(90vh - 100px); overflow-y: auto;">
        <div style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px;">ENTITY STATS</div>
          <div>Total: <span style="color: #00ff00;">${stats.active}</span></div>
          <div>Created: <span style="color: #00aaff;">${stats.created}</span></div>
          <div>Destroyed: <span style="color: #ff6666;">${stats.destroyed}</span></div>
        </div>
    `;
    
    // Render each entity type
    Object.keys(entitiesByType).sort().forEach(type => {
      const typeEntities = entitiesByType[type];
      
      html += `
        <div style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px; text-transform: uppercase;">
            ${type} (${typeEntities.length})
          </div>
          <div style="font-size: 9px;">
      `;
      
      typeEntities.slice(0, 5).forEach(entity => {
        const position = entity.getComponent('position');
        const posStr = position ? `(${Math.round(position.x)}, ${Math.round(position.y)})` : 'N/A';
        
        html += `
          <div style="padding: 4px; background: #111; margin-bottom: 2px; border-radius: 2px;">
            <div style="color: #00ff00;">${entity.id}</div>
            <div style="color: #666;">Position: ${posStr}</div>
            <div style="color: #666;">Components: ${entity.components.size}</div>
          </div>
        `;
      });
      
      if (typeEntities.length > 5) {
        html += `<div style="color: #666; padding: 4px;">... and ${typeEntities.length - 5} more</div>`;
      }
      
      html += `
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  /**
   * Render systems tab
   */
  renderSystemsTab() {
    const systems = [
      { name: 'Animation System', getter: 'getAnimationSystem' },
      { name: 'Movement System', getter: 'getMovementSystem' },
      { name: 'Task Execution System', getter: 'getTaskExecutionSystem' },
      { name: 'State Sync System', getter: 'getStateSyncSystem' },
      { name: 'Interaction System', getter: 'getInteractionSystem' },
      { name: 'Particle System', getter: 'getParticleSystem' },
      { name: 'Performance Monitor', getter: 'getPerformanceMonitor' },
      { name: 'Culling System', getter: 'getCullingSystem' },
      { name: 'LOD System', getter: 'getLODSystem' },
      { name: 'Theme System', getter: 'getThemeSystem' },
      { name: 'Error Recovery System', getter: 'getErrorRecoverySystem' },
      { name: 'Accessibility System', getter: 'getAccessibilitySystem' }
    ];
    
    let html = `
      <div style="padding: 10px; max-height: calc(90vh - 100px); overflow-y: auto;">
        <div style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 10px; margin-bottom: 4px;">GAME SYSTEMS</div>
        </div>
    `;
    
    systems.forEach(system => {
      const instance = this.scene[system.getter] ? this.scene[system.getter]() : null;
      const status = instance ? 'ACTIVE' : 'INACTIVE';
      const statusColor = instance ? '#00ff00' : '#666';
      
      html += `
        <div style="padding: 6px; background: #111; margin-bottom: 4px; border-radius: 3px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #00aaff;">${system.name}</span>
            <span style="color: ${statusColor}; font-size: 9px;">${status}</span>
          </div>
          ${instance ? this.renderSystemDetails(system.name, instance) : ''}
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }
  
  /**
   * Render system-specific details
   */
  renderSystemDetails(systemName, instance) {
    let details = '';
    
    try {
      switch (systemName) {
        case 'Animation System':
          if (instance.getActiveAnimationCount) {
            details = `<div style="font-size: 9px; color: #666; margin-top: 2px;">
              Active animations: ${instance.getActiveAnimationCount()}
            </div>`;
          }
          break;
          
        case 'Particle System':
          if (instance.getActiveParticleCount) {
            details = `<div style="font-size: 9px; color: #666; margin-top: 2px;">
              Active particles: ${instance.getActiveParticleCount()}
            </div>`;
          }
          break;
          
        case 'Culling System':
          if (instance.getVisibleCount) {
            details = `<div style="font-size: 9px; color: #666; margin-top: 2px;">
              Visible entities: ${instance.getVisibleCount()}
            </div>`;
          }
          break;
          
        case 'LOD System':
          if (instance.getCurrentLOD) {
            details = `<div style="font-size: 9px; color: #666; margin-top: 2px;">
              Current LOD: ${instance.getCurrentLOD()}
            </div>`;
          }
          break;
          
        case 'Theme System':
          if (instance.getCurrentTheme) {
            details = `<div style="font-size: 9px; color: #666; margin-top: 2px;">
              Theme: ${instance.getCurrentTheme()}
            </div>`;
          }
          break;
      }
    } catch (error) {
      // Silently ignore errors getting system details
    }
    
    return details;
  }
  
  /**
   * Render footer with shortcuts
   */
  renderFooter() {
    return `
      <div style="
        padding: 8px;
        background: #111;
        border-top: 1px solid #333;
        font-size: 9px;
        color: #666;
      ">
        <div>D: Toggle overlay | B: Toggle bounding boxes</div>
        <div>1-4: Switch tabs | ESC: Close</div>
      </div>
    `;
  }

  /**
   * Format state object for display
   */
  formatState(state) {
    if (!state) return 'null';
    
    try {
      // Create a simplified version for display
      const simplified = {
        agents: Object.keys(state.agents || {}).length,
        tasks: Object.keys(state.tasks || {}).length,
        environment: Object.keys(state.environment || {}).length,
        departments: Object.keys(state.departments || {}).length,
        camera: state.camera ? {
          zoom: state.camera.zoom?.toFixed(2),
          position: state.camera.position ? 
            `(${Math.round(state.camera.position.x)}, ${Math.round(state.camera.position.y)})` : 
            'N/A'
        } : 'N/A',
        syncStatus: state.syncStatus || 'unknown'
      };
      
      return JSON.stringify(simplified, null, 2);
    } catch (error) {
      return 'Error formatting state';
    }
  }
  
  /**
   * Render state diff between frontend and backend
   */
  renderStateDiff(frontendState, backendState) {
    if (!frontendState || !backendState) {
      return '<div style="color: #666;">No diff available</div>';
    }
    
    const diffs = [];
    
    // Compare agent counts
    const frontendAgents = Object.keys(frontendState.agents || {}).length;
    const backendAgents = Object.keys(backendState.agents || {}).length;
    if (frontendAgents !== backendAgents) {
      diffs.push(`Agents: ${frontendAgents} (frontend) vs ${backendAgents} (backend)`);
    }
    
    // Compare task counts
    const frontendTasks = Object.keys(frontendState.tasks || {}).length;
    const backendTasks = Object.keys(backendState.tasks || {}).length;
    if (frontendTasks !== backendTasks) {
      diffs.push(`Tasks: ${frontendTasks} (frontend) vs ${backendTasks} (backend)`);
    }
    
    // Compare sync status
    if (frontendState.syncStatus !== backendState.syncStatus) {
      diffs.push(`Sync status: ${frontendState.syncStatus} (frontend) vs ${backendState.syncStatus} (backend)`);
    }
    
    if (diffs.length === 0) {
      return '<div style="color: #00ff00;">✓ States match</div>';
    }
    
    return diffs.map(diff => 
      `<div style="color: #ffaa00;">⚠ ${diff}</div>`
    ).join('');
  }
  
  /**
   * Get color for value based on thresholds
   */
  getColorForValue(value, warningThreshold, criticalThreshold, higherIsBetter = true) {
    if (higherIsBetter) {
      if (value < criticalThreshold) return '#ff0000'; // Red
      if (value < warningThreshold) return '#ffaa00'; // Orange
      return '#00ff00'; // Green
    } else {
      if (value > criticalThreshold) return '#ff0000'; // Red
      if (value > warningThreshold) return '#ffaa00'; // Orange
      return '#00ff00'; // Green
    }
  }
  
  /**
   * Update backend state (called by state sync system)
   */
  updateBackendState(state) {
    this.backendState = state;
    this.lastSyncTime = Date.now();
  }
  
  /**
   * Destroy debug overlay
   */
  destroy() {
    // Remove UI container
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    
    // Remove bounding box graphics
    if (this.boundingBoxGraphics) {
      this.boundingBoxGraphics.destroy();
      this.boundingBoxGraphics = null;
    }
  }
}

export default DebugOverlay;
