/**
 * InteractionSystem - Handles user interactions with game entities
 * 
 * Manages click detection, hover states, selection, and context menus.
 * Uses PixiJS interaction manager for hit testing.
 * 
 * Requirements: 6.1, 6.2, 6.3
 * Phase 6, Task 31
 */

import * as PIXI from 'pixi.js';

/**
 * InteractionSystem class - Manages entity interactions
 */
class InteractionSystem {
  /**
   * Create a new interaction system
   * @param {EntityRegistry} entityRegistry - Entity registry
   * @param {PIXI.Application} app - PixiJS application
   */
  constructor(entityRegistry, app) {
    this.entityRegistry = entityRegistry;
    this.app = app;
    
    // Selection state
    this.selectedEntity = null;
    
    // Hover state
    this.hoveredEntity = null;
    
    // Interaction callbacks
    this.callbacks = {
      onEntityClick: null,
      onEntityHover: null,
      onEntityHoverEnd: null,
      onEntitySelect: null,
      onEntityDeselect: null,
      onEmptySpaceClick: null,
      onEntityContextMenu: null
    };
    
    // Enable PixiJS interaction
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    
    // Bind methods
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  /**
   * Setup event listeners for interactions
   */
  setupEventListeners() {
    // Stage-level events for empty space clicks
    this.app.stage.on('pointerdown', this.handlePointerDown);
    this.app.stage.on('pointerup', this.handlePointerUp);
    this.app.stage.on('pointermove', this.handlePointerMove);
    
    // Context menu (right-click) - use native event
    this.app.canvas.addEventListener('contextmenu', this.handleContextMenu);
    
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown);
  }
  
  /**
   * Make an entity interactive
   * @param {Entity} entity - Entity to make interactive
   * @param {PIXI.DisplayObject} sprite - Sprite to attach interactions to
   */
  makeInteractive(entity, sprite) {
    const interactionComponent = entity.getComponent('interaction');
    if (!interactionComponent) {
      return;
    }
    
    // Enable interaction on sprite
    sprite.eventMode = 'static';
    sprite.cursor = interactionComponent.clickable ? 'pointer' : 'default';
    
    // Store entity reference on sprite for hit testing
    sprite.userData = { entityId: entity.id };
    
    // Click handler
    if (interactionComponent.clickable) {
      sprite.on('pointerdown', (event) => {
        event.stopPropagation();
        this.handleEntityClick(entity, event);
      });
    }
    
    // Hover handlers
    if (interactionComponent.hoverable) {
      sprite.on('pointerover', (event) => {
        this.handleEntityHover(entity, event);
      });
      
      sprite.on('pointerout', (event) => {
        this.handleEntityHoverEnd(entity, event);
      });
    }
  }
  
  /**
   * Remove interaction from entity
   * @param {PIXI.DisplayObject} sprite - Sprite to remove interactions from
   */
  removeInteractive(sprite) {
    sprite.eventMode = 'none';
    sprite.cursor = 'default';
    sprite.removeAllListeners();
    sprite.userData = null;
  }
  
  /**
   * Handle entity click
   * @param {Entity} entity - Clicked entity
   * @param {PIXI.FederatedPointerEvent} event - Pointer event
   */
  handleEntityClick(entity, event) {
    // Select the entity
    this.selectEntity(entity);
    
    // Call entity-specific click callback
    const interactionComponent = entity.getComponent('interaction');
    if (interactionComponent?.callbacks?.onClick) {
      interactionComponent.callbacks.onClick(entity, event);
    }
    
    // Call global click callback
    if (this.callbacks.onEntityClick) {
      this.callbacks.onEntityClick(entity, event);
    }
    
    // Emit custom event for UI
    this.emitInteractionEvent('entityClick', {
      entityId: entity.id,
      entityType: entity.type,
      position: event.global
    });
  }
  
  /**
   * Handle entity hover start
   * @param {Entity} entity - Hovered entity
   * @param {PIXI.FederatedPointerEvent} event - Pointer event
   */
  handleEntityHover(entity, event) {
    // Skip if already hovering this entity
    if (this.hoveredEntity === entity) {
      return;
    }
    
    // End hover on previous entity
    if (this.hoveredEntity) {
      this.handleEntityHoverEnd(this.hoveredEntity, event);
    }
    
    // Set new hovered entity
    this.hoveredEntity = entity;
    
    // Update interaction component state
    const interactionComponent = entity.getComponent('interaction');
    if (interactionComponent) {
      interactionComponent.state.hovered = true;
      entity.addComponent('interaction', interactionComponent);
    }
    
    // Apply hover highlight
    this.applyHoverHighlight(entity);
    
    // Call entity-specific hover callback
    if (interactionComponent?.callbacks?.onHover) {
      interactionComponent.callbacks.onHover(entity, event);
    }
    
    // Call global hover callback
    if (this.callbacks.onEntityHover) {
      this.callbacks.onEntityHover(entity, event);
    }
    
    // Emit custom event for UI
    this.emitInteractionEvent('entityHover', {
      entityId: entity.id,
      entityType: entity.type
    });
  }
  
  /**
   * Handle entity hover end
   * @param {Entity} entity - Entity that was hovered
   * @param {PIXI.FederatedPointerEvent} event - Pointer event
   */
  handleEntityHoverEnd(entity, event) {
    // Skip if not currently hovering this entity
    if (this.hoveredEntity !== entity) {
      return;
    }
    
    // Clear hovered entity
    this.hoveredEntity = null;
    
    // Update interaction component state
    const interactionComponent = entity.getComponent('interaction');
    if (interactionComponent) {
      interactionComponent.state.hovered = false;
      entity.addComponent('interaction', interactionComponent);
    }
    
    // Remove hover highlight (unless selected)
    if (this.selectedEntity !== entity) {
      this.removeHoverHighlight(entity);
    }
    
    // Call entity-specific hover end callback
    if (interactionComponent?.callbacks?.onHoverEnd) {
      interactionComponent.callbacks.onHoverEnd(entity, event);
    }
    
    // Call global hover end callback
    if (this.callbacks.onEntityHoverEnd) {
      this.callbacks.onEntityHoverEnd(entity, event);
    }
    
    // Emit custom event for UI
    this.emitInteractionEvent('entityHoverEnd', {
      entityId: entity.id,
      entityType: entity.type
    });
  }
  
  /**
   * Handle pointer move (for hover detection)
   * @param {PIXI.FederatedPointerEvent} event - Pointer event
   */
  handlePointerMove(event) {
    // Hit testing is handled by PixiJS automatically via pointerover/pointerout
    // This method is here for future enhancements like drag detection
  }
  
  /**
   * Handle pointer down (for click detection)
   * @param {PIXI.FederatedPointerEvent} event - Pointer event
   */
  handlePointerDown(event) {
    // Check if clicked on empty space (no entity)
    if (!event.target.userData?.entityId) {
      // Deselect current entity
      if (this.selectedEntity) {
        this.deselectEntity();
      }
      
      // Call empty space click callback
      if (this.callbacks.onEmptySpaceClick) {
        this.callbacks.onEmptySpaceClick(event);
      }
      
      // Emit custom event for UI
      this.emitInteractionEvent('emptySpaceClick', {
        position: event.global
      });
    }
  }
  
  /**
   * Handle pointer up (for click completion)
   * @param {PIXI.FederatedPointerEvent} event - Pointer event
   */
  handlePointerUp(event) {
    // Future: Handle drag end, context menu, etc.
  }
  
  /**
   * Handle context menu (right-click)
   * @param {MouseEvent} event - Mouse event
   */
  handleContextMenu(event) {
    event.preventDefault();
    
    // Get world coordinates from screen coordinates
    const rect = this.app.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    // Find entity at this position using hit testing
    const point = new PIXI.Point(screenX, screenY);
    const hitEntity = this.findEntityAtPoint(point);
    
    if (hitEntity) {
      // Get interaction component
      const interactionComponent = hitEntity.getComponent('interaction');
      if (interactionComponent && interactionComponent.contextMenu && interactionComponent.contextMenu.length > 0) {
        // Call entity-specific context menu callback
        if (interactionComponent.callbacks?.onContextMenu) {
          interactionComponent.callbacks.onContextMenu(hitEntity, event);
        }
        
        // Call global context menu callback
        if (this.callbacks.onEntityContextMenu) {
          this.callbacks.onEntityContextMenu(hitEntity, event);
        }
        
        // Emit custom event for UI
        this.emitInteractionEvent('entityContextMenu', {
          entityId: hitEntity.id,
          entityType: hitEntity.type,
          position: { x: event.clientX, y: event.clientY },
          menuItems: interactionComponent.contextMenu
        });
      }
    }
  }
  
  /**
   * Handle keyboard input
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    // Ignore if user is typing in an input field
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    
    switch(event.key) {
      case 'Tab':
        event.preventDefault();
        this.cycleAgentSelection(event.shiftKey);
        break;
        
      case 'Enter':
        event.preventDefault();
        this.openSelectedEntityDetails();
        break;
        
      case 'Escape':
        event.preventDefault();
        this.deselectEntity();
        break;
        
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        event.preventDefault();
        this.focusOnDepartment(parseInt(event.key));
        break;
        
      default:
        break;
    }
  }
  
  /**
   * Cycle through agent entities
   * @param {boolean} reverse - Whether to cycle in reverse (Shift+Tab)
   */
  cycleAgentSelection(reverse = false) {
    // Get all agent entities
    const agentEntities = Array.from(this.entityRegistry.entitiesByType.get('agent') || [])
      .map(id => this.entityRegistry.getEntity(id))
      .filter(entity => entity !== null);
    
    if (agentEntities.length === 0) {
      return;
    }
    
    // Find current selected agent index
    let currentIndex = -1;
    if (this.selectedEntity && this.selectedEntity.type === 'agent') {
      currentIndex = agentEntities.findIndex(agent => agent.id === this.selectedEntity.id);
    }
    
    // Calculate next index
    let nextIndex;
    if (reverse) {
      nextIndex = currentIndex <= 0 ? agentEntities.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= agentEntities.length - 1 ? 0 : currentIndex + 1;
    }
    
    // Select next agent
    const nextAgent = agentEntities[nextIndex];
    if (nextAgent) {
      this.selectEntity(nextAgent);
      
      // Emit event to focus camera on agent
      this.emitInteractionEvent('focusOnEntity', {
        entityId: nextAgent.id,
        entityType: nextAgent.type
      });
    }
  }
  
  /**
   * Open details panel for selected entity
   */
  openSelectedEntityDetails() {
    if (!this.selectedEntity) {
      return;
    }
    
    // Emit event to open entity details panel
    this.emitInteractionEvent('openEntityDetails', {
      entityId: this.selectedEntity.id,
      entityType: this.selectedEntity.type
    });
  }
  
  /**
   * Focus camera on a specific department
   * @param {number} departmentNumber - Department number (1-5)
   */
  focusOnDepartment(departmentNumber) {
    // Department mapping (1-5 to department IDs)
    const departmentMap = {
      1: 'content_creation',
      2: 'publishing',
      3: 'trend_analysis',
      4: 'customer_support',
      5: 'administration'
    };
    
    const departmentId = departmentMap[departmentNumber];
    if (!departmentId) {
      return;
    }
    
    // Emit event to focus camera on department
    this.emitInteractionEvent('focusOnDepartment', {
      departmentId,
      departmentNumber
    });
  }
  
  /**
   * Find entity at screen point using hit testing
   * @param {PIXI.Point} point - Screen point
   * @returns {Entity|null} Entity at point or null
   */
  findEntityAtPoint(point) {
    // Use PixiJS hit testing
    const hitTarget = this.app.renderer.plugins.interaction.hitTest(point);
    
    if (hitTarget && hitTarget.userData?.entityId) {
      const entityId = hitTarget.userData.entityId;
      return this.entityRegistry.getEntity(entityId);
    }
    
    return null;
  }
  
  /**
   * Select an entity
   * @param {Entity} entity - Entity to select
   */
  selectEntity(entity) {
    // Skip if already selected
    if (this.selectedEntity === entity) {
      return;
    }
    
    // Deselect previous entity
    if (this.selectedEntity) {
      this.deselectEntity();
    }
    
    // Set new selected entity
    this.selectedEntity = entity;
    
    // Update interaction component state
    const interactionComponent = entity.getComponent('interaction');
    if (interactionComponent) {
      interactionComponent.state.selected = true;
      entity.addComponent('interaction', interactionComponent);
    }
    
    // Apply selection highlight
    this.applySelectionHighlight(entity);
    
    // Call global select callback
    if (this.callbacks.onEntitySelect) {
      this.callbacks.onEntitySelect(entity);
    }
    
    // Emit custom event for UI
    this.emitInteractionEvent('entitySelect', {
      entityId: entity.id,
      entityType: entity.type
    });
  }
  
  /**
   * Deselect current entity
   */
  deselectEntity() {
    if (!this.selectedEntity) {
      return;
    }
    
    const entity = this.selectedEntity;
    
    // Update interaction component state
    const interactionComponent = entity.getComponent('interaction');
    if (interactionComponent) {
      interactionComponent.state.selected = false;
      entity.addComponent('interaction', interactionComponent);
    }
    
    // Remove selection highlight
    this.removeSelectionHighlight(entity);
    
    // Clear selected entity
    this.selectedEntity = null;
    
    // Call global deselect callback
    if (this.callbacks.onEntityDeselect) {
      this.callbacks.onEntityDeselect(entity);
    }
    
    // Emit custom event for UI
    this.emitInteractionEvent('entityDeselect', {
      entityId: entity.id,
      entityType: entity.type
    });
  }
  
  /**
   * Apply hover highlight to entity
   * @param {Entity} entity - Entity to highlight
   */
  applyHoverHighlight(entity) {
    const spriteComponent = entity.getComponent('sprite');
    if (!spriteComponent || !spriteComponent.pixiSprite) {
      return;
    }
    
    // Store original tint if not already stored
    if (spriteComponent.originalTint === undefined) {
      spriteComponent.originalTint = spriteComponent.tint;
    }
    
    // Apply lighter tint for hover (20% lighter)
    const sprite = spriteComponent.pixiSprite;
    sprite.tint = this.lightenColor(spriteComponent.originalTint, 0.2);
  }
  
  /**
   * Remove hover highlight from entity
   * @param {Entity} entity - Entity to remove highlight from
   */
  removeHoverHighlight(entity) {
    const spriteComponent = entity.getComponent('sprite');
    if (!spriteComponent || !spriteComponent.pixiSprite) {
      return;
    }
    
    // Restore original tint
    if (spriteComponent.originalTint !== undefined) {
      const sprite = spriteComponent.pixiSprite;
      sprite.tint = spriteComponent.originalTint;
    }
  }
  
  /**
   * Apply selection highlight to entity
   * @param {Entity} entity - Entity to highlight
   */
  applySelectionHighlight(entity) {
    const spriteComponent = entity.getComponent('sprite');
    if (!spriteComponent || !spriteComponent.pixiSprite) {
      return;
    }
    
    // Store original tint if not already stored
    if (spriteComponent.originalTint === undefined) {
      spriteComponent.originalTint = spriteComponent.tint;
    }
    
    // Apply brighter tint for selection (40% lighter)
    const sprite = spriteComponent.pixiSprite;
    sprite.tint = this.lightenColor(spriteComponent.originalTint, 0.4);
    
    // Add selection indicator (white outline)
    this.addSelectionIndicator(entity);
  }
  
  /**
   * Remove selection highlight from entity
   * @param {Entity} entity - Entity to remove highlight from
   */
  removeSelectionHighlight(entity) {
    const spriteComponent = entity.getComponent('sprite');
    if (!spriteComponent || !spriteComponent.pixiSprite) {
      return;
    }
    
    // Restore original tint
    if (spriteComponent.originalTint !== undefined) {
      const sprite = spriteComponent.pixiSprite;
      sprite.tint = spriteComponent.originalTint;
    }
    
    // Remove selection indicator
    this.removeSelectionIndicator(entity);
  }
  
  /**
   * Add selection indicator (outline) to entity
   * @param {Entity} entity - Entity to add indicator to
   */
  addSelectionIndicator(entity) {
    const spriteComponent = entity.getComponent('sprite');
    if (!spriteComponent || !spriteComponent.pixiSprite) {
      return;
    }
    
    const sprite = spriteComponent.pixiSprite;
    
    // Create selection circle if it doesn't exist
    if (!sprite.selectionIndicator) {
      const indicator = new PIXI.Graphics();
      indicator.lineStyle(2, 0xFFFFFF, 1);
      indicator.drawCircle(0, 0, 35);
      indicator.position.set(0, 0);
      sprite.addChild(indicator);
      sprite.selectionIndicator = indicator;
    }
  }
  
  /**
   * Remove selection indicator from entity
   * @param {Entity} entity - Entity to remove indicator from
   */
  removeSelectionIndicator(entity) {
    const spriteComponent = entity.getComponent('sprite');
    if (!spriteComponent || !spriteComponent.pixiSprite) {
      return;
    }
    
    const sprite = spriteComponent.pixiSprite;
    
    // Remove selection indicator if it exists
    if (sprite.selectionIndicator) {
      sprite.removeChild(sprite.selectionIndicator);
      sprite.selectionIndicator.destroy();
      sprite.selectionIndicator = null;
    }
  }
  
  /**
   * Lighten a color by a percentage
   * @param {number} color - Original color (hex)
   * @param {number} amount - Amount to lighten (0-1)
   * @returns {number} Lightened color (hex)
   */
  lightenColor(color, amount) {
    // Extract RGB components
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    
    // Lighten each component
    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
    
    // Combine back into hex
    return (newR << 16) | (newG << 8) | newB;
  }
  
  /**
   * Get currently selected entity
   * @returns {Entity|null} Selected entity or null
   */
  getSelectedEntity() {
    return this.selectedEntity;
  }
  
  /**
   * Get currently hovered entity
   * @returns {Entity|null} Hovered entity or null
   */
  getHoveredEntity() {
    return this.hoveredEntity;
  }
  
  /**
   * Set callback for interaction events
   * @param {string} eventName - Event name
   * @param {function} callback - Callback function
   */
  setCallback(eventName, callback) {
    if (this.callbacks.hasOwnProperty(eventName)) {
      this.callbacks[eventName] = callback;
    } else {
      console.warn(`Unknown callback: ${eventName}`);
    }
  }
  
  /**
   * Emit custom event for UI integration
   * @param {string} eventName - Event name
   * @param {object} detail - Event detail
   */
  emitInteractionEvent(eventName, detail) {
    const event = new CustomEvent(`game:${eventName}`, {
      detail,
      bubbles: true
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Update interaction system
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    // Future: Handle drag updates, tooltip delays, etc.
  }
  
  /**
   * Clear all interaction state
   */
  clear() {
    // Deselect entity
    if (this.selectedEntity) {
      this.deselectEntity();
    }
    
    // Clear hover state
    if (this.hoveredEntity) {
      this.handleEntityHoverEnd(this.hoveredEntity, null);
    }
    
    // Clear callbacks
    Object.keys(this.callbacks).forEach(key => {
      this.callbacks[key] = null;
    });
  }
  
  /**
   * Destroy interaction system
   */
  destroy() {
    // Clear state
    this.clear();
    
    // Remove event listeners
    this.app.stage.off('pointerdown', this.handlePointerDown);
    this.app.stage.off('pointerup', this.handlePointerUp);
    this.app.stage.off('pointermove', this.handlePointerMove);
    this.app.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}

export default InteractionSystem;
