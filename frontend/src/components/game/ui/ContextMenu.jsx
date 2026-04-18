/**
 * ContextMenu - Context menu component for entity interactions
 * 
 * Displays context-sensitive menus on right-click.
 * Supports agent, task, and department specific menus.
 * 
 * Requirements: 6.6
 * Phase 6, Task 33
 */

import React, { useEffect, useRef, useState } from 'react';
import './ContextMenu.css';

/**
 * ContextMenu component
 * @param {object} props - Component props
 * @param {Array} props.items - Menu items to display
 * @param {object} props.position - Menu position {x, y}
 * @param {function} props.onClose - Callback when menu closes
 * @param {function} props.onItemClick - Callback when item is clicked
 */
const ContextMenu = ({ items, position, onClose, onItemClick }) => {
  const menuRef = useRef(null);
  const [confirmingAction, setConfirmingAction] = useState(null);
  
  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    // Close on escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  
  // Adjust position to keep menu on screen
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Adjust horizontal position
      if (rect.right > viewportWidth) {
        menu.style.left = `${viewportWidth - rect.width - 10}px`;
      }
      
      // Adjust vertical position
      if (rect.bottom > viewportHeight) {
        menu.style.top = `${viewportHeight - rect.height - 10}px`;
      }
    }
  }, [position]);
  
  /**
   * Handle menu item click
   * @param {object} item - Menu item
   */
  const handleItemClick = (item) => {
    // Skip separators
    if (item.separator) {
      return;
    }
    
    // Handle confirmation for destructive actions
    if (item.requiresConfirm && confirmingAction !== item.action) {
      setConfirmingAction(item.action);
      return;
    }
    
    // Execute action
    onItemClick(item);
    onClose();
  };
  
  /**
   * Cancel confirmation
   */
  const handleCancelConfirm = () => {
    setConfirmingAction(null);
  };
  
  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      {items.map((item, index) => {
        // Render separator
        if (item.separator) {
          return <div key={`separator-${index}`} className="context-menu-separator" />;
        }
        
        // Check if this item is being confirmed
        const isConfirming = confirmingAction === item.action;
        
        return (
          <div key={item.action || index} className="context-menu-item-wrapper">
            <div
              className={`context-menu-item ${item.requiresConfirm ? 'destructive' : ''} ${isConfirming ? 'confirming' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && <span className="context-menu-icon">{item.icon}</span>}
              <span className="context-menu-label">{item.label}</span>
            </div>
            
            {isConfirming && (
              <div className="context-menu-confirm">
                <span className="context-menu-confirm-text">Are you sure?</span>
                <button
                  className="context-menu-confirm-button confirm"
                  onClick={() => handleItemClick(item)}
                >
                  Yes
                </button>
                <button
                  className="context-menu-confirm-button cancel"
                  onClick={handleCancelConfirm}
                >
                  No
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ContextMenu;
