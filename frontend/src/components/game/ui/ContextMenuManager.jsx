/**
 * ContextMenuManager - Manages context menu display and actions
 * 
 * Listens for context menu events from the game and displays appropriate menus.
 * Handles menu item actions and integrates with the game world.
 * 
 * Requirements: 6.6
 * Phase 6, Task 33
 */

import React, { useState, useEffect } from 'react';
import ContextMenu from './ContextMenu.jsx';

/**
 * Get context menu items for entity type
 * @param {string} entityType - Type of entity (agent, task, department, environment)
 * @param {object} entity - Entity data
 * @returns {Array} Menu items
 */
const getContextMenuItems = (entityType, entity) => {
  switch (entityType) {
    case 'agent':
      return [
        { label: 'View Details', action: 'show_details', icon: '👤' },
        { label: 'View History', action: 'show_history', icon: '📜' },
        { label: 'Assign Task', action: 'assign_task', icon: '📋' },
        { separator: true },
        { label: 'Pause Agent', action: 'pause_agent', icon: '⏸️', requiresConfirm: true }
      ];
    
    case 'task':
      return [
        { label: 'View Progress', action: 'show_progress', icon: '📊' },
        { label: 'View Logs', action: 'show_logs', icon: '📄' },
        { separator: true },
        { label: 'Cancel Task', action: 'cancel_task', icon: '❌', requiresConfirm: true }
      ];
    
    case 'department':
      return [
        { label: 'View All Agents', action: 'list_agents', icon: '👥' },
        { label: 'View All Tasks', action: 'list_tasks', icon: '📋' },
        { label: 'Department Stats', action: 'show_stats', icon: '📈' }
      ];
    
    case 'environment':
      return [
        { label: 'View Details', action: 'show_details', icon: '🏢' }
      ];
    
    default:
      return [];
  }
};

/**
 * ContextMenuManager component
 * @param {object} props - Component props
 * @param {object} props.scene - Game scene instance
 */
const ContextMenuManager = ({ scene }) => {
  const [contextMenu, setContextMenu] = useState(null);
  
  useEffect(() => {
    if (!scene) return;
    
    /**
     * Handle entity context menu event
     * @param {CustomEvent} event - Context menu event
     */
    const handleEntityContextMenu = (event) => {
      const { entityId, entityType, position, menuItems } = event.detail;
      
      // Use custom menu items if provided, otherwise get default items
      const items = menuItems && menuItems.length > 0
        ? menuItems
        : getContextMenuItems(entityType, { id: entityId });
      
      if (items.length > 0) {
        setContextMenu({
          entityId,
          entityType,
          position,
          items
        });
      }
    };
    
    // Listen for context menu events
    window.addEventListener('game:entityContextMenu', handleEntityContextMenu);
    
    return () => {
      window.removeEventListener('game:entityContextMenu', handleEntityContextMenu);
    };
  }, [scene]);
  
  /**
   * Handle context menu close
   */
  const handleClose = () => {
    setContextMenu(null);
  };
  
  /**
   * Handle menu item click
   * @param {object} item - Menu item
   */
  const handleItemClick = (item) => {
    if (!contextMenu) return;
    
    const { entityId, entityType } = contextMenu;
    
    // Emit action event for handling
    const actionEvent = new CustomEvent('game:contextMenuAction', {
      detail: {
        action: item.action,
        entityId,
        entityType
      },
      bubbles: true
    });
    window.dispatchEvent(actionEvent);
    
    // Log action for debugging
    console.log(`Context menu action: ${item.action} on ${entityType} ${entityId}`);
    
    // Close menu
    handleClose();
  };
  
  if (!contextMenu) {
    return null;
  }
  
  return (
    <ContextMenu
      items={contextMenu.items}
      position={contextMenu.position}
      onClose={handleClose}
      onItemClick={handleItemClick}
    />
  );
};

export default ContextMenuManager;
