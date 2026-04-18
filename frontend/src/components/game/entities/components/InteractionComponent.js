/**
 * InteractionComponent - User interaction state for entities
 * 
 * Manages clickability, hover state, and context menu for entities.
 * 
 * Requirements: 2.2, 2.6
 * Phase 2, Task 7
 */

/**
 * Create an interaction component
 * @param {boolean} clickable - Whether entity can be clicked
 * @param {boolean} hoverable - Whether entity responds to hover
 * @param {boolean} draggable - Whether entity can be dragged
 * @param {Array} contextMenu - Context menu items
 * @returns {object} Interaction component data
 */
export function createInteractionComponent(
  clickable = true,
  hoverable = true,
  draggable = false,
  contextMenu = []
) {
  return {
    type: 'interaction',
    clickable,
    hoverable,
    draggable,
    contextMenu,
    // Interaction state
    state: {
      hovered: false,
      selected: false,
      dragging: false
    },
    // Callbacks (set by interaction system)
    callbacks: {
      onClick: null,
      onHover: null,
      onHoverEnd: null,
      onDragStart: null,
      onDrag: null,
      onDragEnd: null,
      onContextMenu: null
    }
  };
}

/**
 * Update interaction component
 * @param {object} component - Interaction component to update
 * @param {object} updates - Updates to apply
 * @returns {object} Updated component
 */
export function updateInteractionComponent(component, updates) {
  return {
    ...component,
    ...updates
  };
}

/**
 * Set hover state
 * @param {object} component - Interaction component
 * @param {boolean} hovered - Hover state
 * @returns {object} Updated component
 */
export function setHovered(component, hovered) {
  return updateInteractionComponent(component, {
    state: {
      ...component.state,
      hovered
    }
  });
}

/**
 * Set selected state
 * @param {object} component - Interaction component
 * @param {boolean} selected - Selected state
 * @returns {object} Updated component
 */
export function setSelected(component, selected) {
  return updateInteractionComponent(component, {
    state: {
      ...component.state,
      selected
    }
  });
}

/**
 * Set dragging state
 * @param {object} component - Interaction component
 * @param {boolean} dragging - Dragging state
 * @returns {object} Updated component
 */
export function setDragging(component, dragging) {
  return updateInteractionComponent(component, {
    state: {
      ...component.state,
      dragging
    }
  });
}

/**
 * Enable interaction
 * @param {object} component - Interaction component
 * @returns {object} Updated component
 */
export function enableInteraction(component) {
  return updateInteractionComponent(component, {
    clickable: true,
    hoverable: true
  });
}

/**
 * Disable interaction
 * @param {object} component - Interaction component
 * @returns {object} Updated component
 */
export function disableInteraction(component) {
  return updateInteractionComponent(component, {
    clickable: false,
    hoverable: false,
    state: {
      hovered: false,
      selected: false,
      dragging: false
    }
  });
}

/**
 * Set context menu items
 * @param {object} component - Interaction component
 * @param {Array} menuItems - Context menu items
 * @returns {object} Updated component
 */
export function setContextMenu(component, menuItems) {
  return updateInteractionComponent(component, {
    contextMenu: menuItems
  });
}

/**
 * Add context menu item
 * @param {object} component - Interaction component
 * @param {object} menuItem - Menu item to add
 * @returns {object} Updated component
 */
export function addContextMenuItem(component, menuItem) {
  return updateInteractionComponent(component, {
    contextMenu: [...component.contextMenu, menuItem]
  });
}

/**
 * Set callback
 * @param {object} component - Interaction component
 * @param {string} callbackName - Name of callback
 * @param {function} callback - Callback function
 * @returns {object} Updated component
 */
export function setCallback(component, callbackName, callback) {
  return updateInteractionComponent(component, {
    callbacks: {
      ...component.callbacks,
      [callbackName]: callback
    }
  });
}

/**
 * Check if entity is interactable
 * @param {object} component - Interaction component
 * @returns {boolean} True if entity can be interacted with
 */
export function isInteractable(component) {
  return component.clickable || component.hoverable || component.draggable;
}

/**
 * Check if entity is hovered
 * @param {object} component - Interaction component
 * @returns {boolean} True if entity is hovered
 */
export function isHovered(component) {
  return component.state.hovered;
}

/**
 * Check if entity is selected
 * @param {object} component - Interaction component
 * @returns {boolean} True if entity is selected
 */
export function isSelected(component) {
  return component.state.selected;
}

/**
 * Check if entity is being dragged
 * @param {object} component - Interaction component
 * @returns {boolean} True if entity is being dragged
 */
export function isDragging(component) {
  return component.state.dragging;
}
