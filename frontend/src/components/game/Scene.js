import * as PIXI from 'pixi.js';
import EntityRegistry from './entities/EntityRegistry.js';
import { MovementSystem, AnimationSystem, StateSyncSystem, TaskExecutionSystem, InteractionSystem, ParticleSystem, ThemeSystem, CullingSystem, LODSystem, PerformanceMonitor, ErrorRecoverySystem, AccessibilitySystem } from './systems/index.js';
import SoundSystem from './systems/SoundSystem.js';
import { TaskWorkflowVisuals } from './visuals/index.js';
import SpriteBatchOptimizer from './utils/SpriteBatchOptimizer.js';
import { DebugOverlay } from './debug/index.js';
import { userPreferences } from './preferences/index.js';

/**
 * Scene Class - Manages the game world
 * 
 * Responsibilities:
 * - Camera control (pan, zoom, focus)
 * - Viewport management
 * - Layer ordering (background, entities, foreground, UI)
 * - Coordinate systems
 * - Entity management (Phase 2)
 * - Movement system (Phase 3)
 * - State synchronization (Phase 4)
 * - Task visualization (Phase 5)
 * - Interaction system (Phase 6)
 * - Frustum culling (Phase 9)
 * - Level of detail (Phase 9)
 * - Performance monitoring (Phase 9)
 * 
 * Requirements: 5.1, 5.4, 5.5, 2.1, 2.5, 3.2, 3.3, 4.1, 4.3, 4.6, 6.1, 6.2, 6.3, 9.1, 9.3, 9.6, 15.1
 */
class Scene {
  constructor(app, syncConfig = {}) {
    this.app = app;
    
    // Create main scene container
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    
    // Entity registry (Phase 2)
    this.entityRegistry = new EntityRegistry();
    
    // Movement system (Phase 3)
    this.movementSystem = new MovementSystem(this.entityRegistry, 64);
    
    // Animation system (Phase 3)
    this.animationSystem = new AnimationSystem(this.entityRegistry);
    
    // Theme system (Phase 8, Task 50)
    this.themeSystem = new ThemeSystem(this);
    
    // Culling system (Phase 9, Task 53)
    this.cullingSystem = new CullingSystem(this, this.entityRegistry);
    
    // LOD system (Phase 9, Task 55)
    this.lodSystem = new LODSystem(this, this.entityRegistry);
    
    // Sprite batch optimizer (Phase 9, Task 54)
    this.spriteBatchOptimizer = new SpriteBatchOptimizer(this.app);
    
    // Performance monitor (Phase 9, Task 56)
    this.performanceMonitor = new PerformanceMonitor(this, this.app);
    
    // Error recovery system (Phase 10, Task 60)
    this.errorRecoverySystem = new ErrorRecoverySystem({
      autoRetryEnabled: true,
      maxRetryAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffStrategy: 'exponential',
      showErrorToast: true,
      provideDetails: true,
      offerActions: ['retry', 'view_logs', 'contact_support']
    });
    
    // Accessibility system (Phase 10, Task 61)
    this.accessibilitySystem = new AccessibilitySystem(this, this.entityRegistry);
    
    // User preferences (Phase 10, Task 63)
    this.userPreferences = userPreferences;
    
    // Sound system (Phase 8, Task 49)
    this.soundSystem = new SoundSystem();
    
    // Interaction system (Phase 6)
    this.interactionSystem = new InteractionSystem(this.entityRegistry, this.app);
    
    // Create rendering layers
    this.layers = this.createLayers();
    
    // Debug overlay (Phase 10, Task 62) - Must be initialized AFTER layers are created
    this.debugOverlay = new DebugOverlay(this, this.app);
    
    // Particle system (Phase 8) - Must be initialized AFTER layers are created
    this.particleSystem = new ParticleSystem(this);
    
    // Task workflow visuals (Phase 5)
    this.taskWorkflowVisuals = new TaskWorkflowVisuals(this);
    
    // Task execution system (Phase 5)
    this.taskExecutionSystem = new TaskExecutionSystem(
      this.entityRegistry,
      this.movementSystem,
      this.animationSystem,
      this.taskWorkflowVisuals
    );
    
    // State sync system (Phase 4)
    this.stateSyncSystem = new StateSyncSystem(this.entityRegistry, syncConfig);
    
    // Department positions for keyboard focus (Phase 6, Task 34)
    this.departments = {
      content_creation: { gridX: 2, gridY: 2, gridWidth: 6, gridHeight: 5 },
      publishing: { gridX: 9, gridY: 2, gridWidth: 5, gridHeight: 5 },
      trend_analysis: { gridX: 2, gridY: 8, gridWidth: 5, gridHeight: 5 },
      customer_support: { gridX: 8, gridY: 8, gridWidth: 6, gridHeight: 5 },
      administration: { gridX: 15, gridY: 2, gridWidth: 4, gridHeight: 11 }
    };
    
    // Camera state
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1.0,
      targetX: 0,
      targetY: 0,
      targetZoom: 1.0,
      smoothing: 0.1 // Camera smoothing factor (0-1)
    };
    
    // World bounds
    this.bounds = {
      minX: 0,
      minY: 0,
      maxX: 2000,
      maxY: 1500
    };
    
    // Viewport size
    this.viewport = {
      width: app.canvas.width,
      height: app.canvas.height
    };
    
    // Load camera preferences (Phase 10, Task 63)
    const cameraPrefs = this.userPreferences.getCameraPreferences();
    
    // Initialize camera position
    if (cameraPrefs.x !== null && cameraPrefs.y !== null) {
      // Use saved camera position
      this.setCameraPosition(cameraPrefs.x, cameraPrefs.y);
    } else {
      // Use default: center of world
      this.setCameraPosition(
        this.bounds.maxX / 2 - this.viewport.width / 2,
        this.bounds.maxY / 2 - this.viewport.height / 2
      );
    }
    
    // Apply saved zoom level
    if (cameraPrefs.zoom) {
      this.setCameraZoom(cameraPrefs.zoom);
    }
    
    // Setup keyboard event listeners (Phase 6, Task 34)
    this.setupKeyboardEventListeners();
    
    // Setup preference change listeners (Phase 10, Task 63)
    this.setupPreferenceListeners();
  }
  
  /**
   * Create rendering layers for proper depth sorting
   * Layers are rendered in order: background → entities → foreground → UI
   */
  createLayers() {
    const layers = {
      background: new PIXI.Container(),
      furniture_back: new PIXI.Container(),
      agents: new PIXI.Container(),
      furniture_front: new PIXI.Container(),
      effects: new PIXI.Container(),
      ui_world: new PIXI.Container()
    };
    
    // Add layers to scene in correct order
    this.container.addChild(layers.background);
    this.container.addChild(layers.furniture_back);
    this.container.addChild(layers.agents);
    this.container.addChild(layers.furniture_front);
    this.container.addChild(layers.effects);
    this.container.addChild(layers.ui_world);
    
    // Set layer z-indices for clarity
    layers.background.zIndex = 0;
    layers.furniture_back.zIndex = 10;
    layers.agents.zIndex = 20;
    layers.furniture_front.zIndex = 30;
    layers.effects.zIndex = 40;
    layers.ui_world.zIndex = 50;
    
    return layers;
  }
  
  /**
   * Set camera position (instant, no smoothing)
   * @param {number} x - X position in world coordinates
   * @param {number} y - Y position in world coordinates
   * @param {boolean} savePreference - Whether to save to preferences (default: false)
   */
  setCameraPosition(x, y, savePreference = false) {
    // Clamp to world bounds
    const clampedX = this.clampCameraX(x);
    const clampedY = this.clampCameraY(y);
    
    this.camera.x = clampedX;
    this.camera.y = clampedY;
    this.camera.targetX = clampedX;
    this.camera.targetY = clampedY;
    
    this.updateCameraTransform();
    
    // Save to preferences if requested (Phase 10, Task 63)
    if (savePreference) {
      this.saveCameraPreferences();
    }
  }
  
  /**
   * Move camera to position with smooth transition
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   */
  moveCameraTo(x, y) {
    this.camera.targetX = this.clampCameraX(x);
    this.camera.targetY = this.clampCameraY(y);
  }
  
  /**
   * Set camera zoom level (instant, no smoothing)
   * @param {number} zoom - Zoom level (0.5 to 2.0)
   * @param {boolean} savePreference - Whether to save to preferences (default: false)
   */
  setCameraZoom(zoom, savePreference = false) {
    const clampedZoom = Math.max(0.5, Math.min(2.0, zoom));
    this.camera.zoom = clampedZoom;
    this.camera.targetZoom = clampedZoom;
    this.updateCameraTransform();
    
    // Save to preferences if requested (Phase 10, Task 63)
    if (savePreference) {
      this.saveCameraPreferences();
    }
  }
  
  /**
   * Zoom camera to level with smooth transition
   * @param {number} zoom - Target zoom level (0.5 to 2.0)
   */
  zoomCameraTo(zoom) {
    this.camera.targetZoom = Math.max(0.5, Math.min(2.0, zoom));
  }
  
  /**
   * Pan camera by delta amount
   * @param {number} dx - Delta X
   * @param {number} dy - Delta Y
   */
  panCamera(dx, dy) {
    this.moveCameraTo(
      this.camera.targetX + dx,
      this.camera.targetY + dy
    );
  }
  
  /**
   * Zoom camera by delta amount
   * @param {number} delta - Zoom delta (positive = zoom in, negative = zoom out)
   */
  zoomCamera(delta) {
    this.zoomCameraTo(this.camera.targetZoom + delta);
  }
  
  /**
   * Focus camera on a specific point in world coordinates
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {number} zoom - Optional zoom level
   */
  focusOn(x, y, zoom = null) {
    // Center the point in viewport
    const targetX = x - (this.viewport.width / 2) / this.camera.zoom;
    const targetY = y - (this.viewport.height / 2) / this.camera.zoom;
    
    this.moveCameraTo(targetX, targetY);
    
    if (zoom !== null) {
      this.zoomCameraTo(zoom);
    }
  }
  
  /**
   * Reset camera to default overview position
   */
  resetCamera() {
    this.moveCameraTo(
      this.bounds.maxX / 2 - this.viewport.width / 2,
      this.bounds.maxY / 2 - this.viewport.height / 2
    );
    this.zoomCameraTo(1.0);
    
    // Clear saved camera preferences (Phase 10, Task 63)
    this.userPreferences.resetCamera();
  }
  
  /**
   * Save camera preferences (Phase 10, Task 63)
   * Debounced to avoid excessive localStorage writes
   */
  saveCameraPreferences() {
    // Clear existing timeout
    if (this.cameraPreferenceSaveTimeout) {
      clearTimeout(this.cameraPreferenceSaveTimeout);
    }
    
    // Debounce save by 1 second
    this.cameraPreferenceSaveTimeout = setTimeout(() => {
      this.userPreferences.saveCameraPosition(this.camera.x, this.camera.y);
      this.userPreferences.saveCameraZoom(this.camera.zoom);
      this.cameraPreferenceSaveTimeout = null;
    }, 1000);
  }
  
  /**
   * Setup keyboard event listeners for interaction system events
   * Handles focusOnEntity and focusOnDepartment events from InteractionSystem
   */
  setupKeyboardEventListeners() {
    // Listen for focus on entity event (Tab key)
    window.addEventListener('game:focusOnEntity', (event) => {
      const { entityId } = event.detail;
      const entity = this.entityRegistry.getEntity(entityId);
      
      if (entity) {
        const position = entity.getComponent('position');
        if (position) {
          this.focusOn(position.x, position.y, 1.5);
        }
      }
    });
    
    // Listen for focus on department event (1-5 keys)
    window.addEventListener('game:focusOnDepartment', (event) => {
      const { departmentId } = event.detail;
      this.focusOnDepartmentById(departmentId);
    });
    
    // Listen for highlight task event (from TaskQueuePanel)
    window.addEventListener('game:highlightTask', (event) => {
      const { taskId, position } = event.detail;
      
      // Focus camera on task
      if (position) {
        this.focusOn(position.x, position.y, 1.5);
      }
      
      // TODO: Add visual highlight effect in future task
      console.log('Highlight task:', taskId);
    });
    
    // Listen for open entity details event (Enter key)
    window.addEventListener('game:openEntityDetails', (event) => {
      // This event is handled by UI components
      // Scene just needs to ensure it's propagated
      console.log('Open entity details:', event.detail);
    });
    
    // Listen for camera control events from TopBar (Task 41)
    window.addEventListener('game:cameraControl', (event) => {
      const { action } = event.detail;
      
      switch (action) {
        case 'zoomIn':
          this.zoomCamera(0.1);
          break;
        case 'zoomOut':
          this.zoomCamera(-0.1);
          break;
        case 'reset':
          this.resetCamera();
          break;
        default:
          console.warn('Unknown camera control action:', action);
      }
    });
    
    // Listen for search events from TopBar (Task 41)
    window.addEventListener('game:search', (event) => {
      const { query } = event.detail;
      const results = this.searchEntities(query);
      
      // Emit search results back to UI
      window.dispatchEvent(new CustomEvent('game:searchResults', {
        detail: { results }
      }));
    });
  }
  
  /**
   * Search for entities by name or type
   * @param {string} query - Search query
   * @returns {Array} Array of search results
   */
  searchEntities(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // Search agents
    const agents = this.entityRegistry.getEntitiesByType('agent');
    agents.forEach(agent => {
      const metadata = agent.metadata || {};
      const name = metadata.name || 'Unknown Agent';
      const type = agent.agentType || 'agent';
      
      if (name.toLowerCase().includes(lowerQuery) || type.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: agent.id,
          name: name,
          type: 'Agent',
          icon: '🤖'
        });
      }
    });
    
    // Search tasks
    const tasks = this.entityRegistry.getEntitiesByType('task');
    tasks.forEach(task => {
      const taskType = task.taskType || 'task';
      const status = task.status || 'unknown';
      
      if (taskType.toLowerCase().includes(lowerQuery) || status.toLowerCase().includes(lowerQuery)) {
        const taskName = taskType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        results.push({
          id: task.id,
          name: taskName,
          type: 'Task',
          icon: '📋'
        });
      }
    });
    
    return results.slice(0, 10); // Limit to 10 results
  }
  
  /**
   * Setup preference change listeners (Phase 10, Task 63)
   * Listens for preference changes and applies them to the scene
   */
  setupPreferenceListeners() {
    // Listen for theme changes
    this.userPreferences.addListener('theme.mode', (newValue) => {
      if (this.themeSystem) {
        const resolvedTheme = this.userPreferences.getCurrentTheme();
        this.themeSystem.setTheme(resolvedTheme);
      }
    });
    
    // Listen for performance mode changes
    this.userPreferences.addListener('performance.mode', (newValue) => {
      if (this.performanceMonitor && newValue !== 'auto') {
        this.performanceMonitor.setQualityLevel(newValue, true);
      }
    });
    
    // Listen for auto-quality changes
    this.userPreferences.addListener('performance.autoQualityEnabled', (newValue) => {
      if (this.performanceMonitor) {
        this.performanceMonitor.autoQuality.enabled = newValue;
      }
    });
    
    // Listen for accessibility changes
    this.userPreferences.addListener('accessibility.reducedMotion', (newValue) => {
      if (this.accessibilitySystem) {
        this.accessibilitySystem.setPreference('reducedMotion', newValue);
      }
    });
    
    this.userPreferences.addListener('accessibility.simplifiedView', (newValue) => {
      if (this.accessibilitySystem) {
        if (newValue) {
          this.accessibilitySystem.enableSimplifiedView();
        } else {
          this.accessibilitySystem.disableSimplifiedView();
        }
      }
    });
    
    // Apply initial preferences
    this.applyInitialPreferences();
  }
  
  /**
   * Apply initial preferences on scene creation
   */
  applyInitialPreferences() {
    // Apply theme
    const theme = this.userPreferences.getCurrentTheme();
    if (this.themeSystem) {
      this.themeSystem.setTheme(theme);
    }
    
    // Apply performance mode
    const perfPrefs = this.userPreferences.getPerformancePreferences();
    if (this.performanceMonitor) {
      if (perfPrefs.mode !== 'auto') {
        this.performanceMonitor.setQualityLevel(perfPrefs.mode, true);
      }
      this.performanceMonitor.autoQuality.enabled = perfPrefs.autoQualityEnabled;
    }
    
    // Apply accessibility settings
    const accessPrefs = this.userPreferences.getAccessibilityPreferences();
    if (this.accessibilitySystem) {
      this.accessibilitySystem.setPreference('reducedMotion', accessPrefs.reducedMotion);
      if (accessPrefs.simplifiedView) {
        this.accessibilitySystem.enableSimplifiedView();
      } else {
        this.accessibilitySystem.disableSimplifiedView();
      }
    }
  }
  
  /**
   * Focus camera on a department by ID
   * @param {string} departmentId - Department ID
   */
  focusOnDepartmentById(departmentId) {
    const dept = this.departments[departmentId];
    if (!dept) {
      console.warn(`Department not found: ${departmentId}`);
      return;
    }
    
    // Calculate center of department in grid coordinates
    const centerGridX = dept.gridX + dept.gridWidth / 2;
    const centerGridY = dept.gridY + dept.gridHeight / 2;
    
    // Convert to isometric coordinates
    const GRID_SIZE = 64;
    const ISO_RATIO = 2;
    const offsetX = 400;
    const offsetY = 200;
    
    const isoX = (centerGridX - centerGridY) * (GRID_SIZE / ISO_RATIO);
    const isoY = (centerGridX + centerGridY) * (GRID_SIZE / (ISO_RATIO * 2));
    
    const worldX = isoX + offsetX;
    const worldY = isoY + offsetY;
    
    // Focus camera on department center
    this.focusOn(worldX, worldY, 1.2);
  }
  
  /**
   * Clamp camera X position to world bounds
   * @param {number} x - X position
   * @returns {number} Clamped X position
   */
  clampCameraX(x) {
    const maxX = this.bounds.maxX - this.viewport.width / this.camera.zoom;
    return Math.max(this.bounds.minX, Math.min(maxX, x));
  }
  
  /**
   * Clamp camera Y position to world bounds
   * @param {number} y - Y position
   * @returns {number} Clamped Y position
   */
  clampCameraY(y) {
    const maxY = this.bounds.maxY - this.viewport.height / this.camera.zoom;
    return Math.max(this.bounds.minY, Math.min(maxY, y));
  }
  
  /**
   * Update camera transform (apply position and zoom to scene)
   */
  updateCameraTransform() {
    this.container.x = -this.camera.x * this.camera.zoom;
    this.container.y = -this.camera.y * this.camera.zoom;
    this.container.scale.set(this.camera.zoom);
  }
  
  /**
   * Update scene (called every frame)
   * Handles smooth camera transitions, entity updates, and movement system
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    // Start performance measurement
    this.performanceMonitor.startUpdateMeasurement();
    
    // Smooth camera position
    const positionChanged = 
      Math.abs(this.camera.x - this.camera.targetX) > 0.1 ||
      Math.abs(this.camera.y - this.camera.targetY) > 0.1;
    
    if (positionChanged) {
      this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;
      this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothing;
    }
    
    // Smooth camera zoom
    const zoomChanged = Math.abs(this.camera.zoom - this.camera.targetZoom) > 0.01;
    
    if (zoomChanged) {
      this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * this.camera.smoothing;
    }
    
    // Update transform if camera changed
    if (positionChanged || zoomChanged) {
      this.updateCameraTransform();
    }
    
    // Update all entities (Phase 2)
    this.entityRegistry.update(deltaTime);
    
    // Update movement system (Phase 3)
    this.movementSystem.update(deltaTime);
    
    // Update animation system (Phase 3)
    this.animationSystem.update(deltaTime);
    
    // Update particle system (Phase 8)
    this.particleSystem.update(deltaTime);
    
    // Update theme system (Phase 8, Task 50)
    this.themeSystem.update(deltaTime);
    
    // Update culling system (Phase 9, Task 53)
    this.cullingSystem.update(deltaTime);
    
    // Update LOD system (Phase 9, Task 55)
    this.lodSystem.update(deltaTime);
    
    // Update sprite batch optimizer stats (Phase 9, Task 54)
    this.spriteBatchOptimizer.updateStats();
    
    // Update interaction system (Phase 6)
    this.interactionSystem.update(deltaTime);
    
    // Update task execution system (Phase 5)
    this.taskExecutionSystem.update(deltaTime, this);
    
    // Update task workflow visuals (Phase 5)
    this.taskWorkflowVisuals.update(deltaTime);
    
    // Update state sync system (Phase 4)
    this.stateSyncSystem.update(deltaTime);
    
    // Update accessibility system (Phase 10, Task 61)
    this.accessibilitySystem.update(deltaTime);
    
    // End performance measurement
    this.performanceMonitor.endUpdateMeasurement();
    
    // Update performance monitor (Phase 9, Task 56)
    this.performanceMonitor.update(deltaTime);
    
    // Update debug overlay (Phase 10, Task 62)
    this.debugOverlay.update(deltaTime);
  }
  
  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {{x: number, y: number}} World coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX / this.camera.zoom) + this.camera.x,
      y: (screenY / this.camera.zoom) + this.camera.y
    };
  }
  
  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {{x: number, y: number}} Screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.camera.x) * this.camera.zoom,
      y: (worldY - this.camera.y) * this.camera.zoom
    };
  }
  
  /**
   * Get the current camera state
   * @returns {object} Camera state
   */
  getCameraState() {
    return {
      x: this.camera.x,
      y: this.camera.y,
      zoom: this.camera.zoom,
      targetX: this.camera.targetX,
      targetY: this.camera.targetY,
      targetZoom: this.camera.targetZoom
    };
  }
  
  /**
   * Add a display object to a specific layer
   * @param {string} layerName - Name of the layer
   * @param {PIXI.DisplayObject} displayObject - Object to add
   */
  addToLayer(layerName, displayObject) {
    if (this.layers[layerName]) {
      this.layers[layerName].addChild(displayObject);
    } else {
      console.warn(`Layer "${layerName}" does not exist`);
    }
  }
  
  /**
   * Remove a display object from a specific layer
   * @param {string} layerName - Name of the layer
   * @param {PIXI.DisplayObject} displayObject - Object to remove
   */
  removeFromLayer(layerName, displayObject) {
    if (this.layers[layerName]) {
      this.layers[layerName].removeChild(displayObject);
    }
  }
  
  /**
   * Clear all objects from a specific layer
   * @param {string} layerName - Name of the layer
   */
  clearLayer(layerName) {
    if (this.layers[layerName]) {
      this.layers[layerName].removeChildren();
    }
  }
  
  /**
   * Get entity registry
   * @returns {EntityRegistry} The entity registry
   */
  getEntityRegistry() {
    return this.entityRegistry;
  }
  
  /**
   * Get movement system
   * @returns {MovementSystem} The movement system
   */
  getMovementSystem() {
    return this.movementSystem;
  }
  
  /**
   * Get animation system
   * @returns {AnimationSystem} The animation system
   */
  getAnimationSystem() {
    return this.animationSystem;
  }
  
  /**
   * Get particle system
   * @returns {ParticleSystem} The particle system
   */
  getParticleSystem() {
    return this.particleSystem;
  }
  
  /**
   * Get theme system
   * @returns {ThemeSystem} The theme system
   */
  getThemeSystem() {
    return this.themeSystem;
  }
  
  /**
   * Get culling system
   * @returns {CullingSystem} The culling system
   */
  getCullingSystem() {
    return this.cullingSystem;
  }
  
  /**
   * Get LOD system
   * @returns {LODSystem} The LOD system
   */
  getLODSystem() {
    return this.lodSystem;
  }
  
  /**
   * Get sprite batch optimizer
   * @returns {SpriteBatchOptimizer} The sprite batch optimizer
   */
  getSpriteBatchOptimizer() {
    return this.spriteBatchOptimizer;
  }
  
  /**
   * Get performance monitor
   * @returns {PerformanceMonitor} The performance monitor
   */
  getPerformanceMonitor() {
    return this.performanceMonitor;
  }
  
  /**
   * Get error recovery system
   * @returns {ErrorRecoverySystem} The error recovery system
   */
  getErrorRecoverySystem() {
    return this.errorRecoverySystem;
  }
  
  /**
   * Get accessibility system
   * @returns {AccessibilitySystem} The accessibility system
   */
  getAccessibilitySystem() {
    return this.accessibilitySystem;
  }
  
  /**
   * Get debug overlay
   * @returns {DebugOverlay} The debug overlay
   */
  getDebugOverlay() {
    return this.debugOverlay;
  }
  
  /**
   * Get user preferences
   * @returns {UserPreferences} The user preferences system
   */
  getUserPreferences() {
    return this.userPreferences;
  }
  
  /**
   * Get interaction system
   * @returns {InteractionSystem} The interaction system
   */
  getInteractionSystem() {
    return this.interactionSystem;
  }
  
  /**
   * Get state sync system
   * @returns {StateSyncSystem} The state sync system
   */
  getStateSyncSystem() {
    return this.stateSyncSystem;
  }
  
  /**
   * Get task execution system
   * @returns {TaskExecutionSystem} The task execution system
   */
  getTaskExecutionSystem() {
    return this.taskExecutionSystem;
  }
  
  /**
   * Get sound system
   * @returns {SoundSystem} The sound system
   */
  getSoundSystem() {
    return this.soundSystem;
  }
  
  /**
   * Destroy the scene and cleanup resources
   */
  destroy() {
    // Stop state sync
    this.stateSyncSystem.stopSync();
    
    // Destroy debug overlay
    if (this.debugOverlay) {
      this.debugOverlay.destroy();
    }
    
    // Destroy accessibility system
    if (this.accessibilitySystem) {
      this.accessibilitySystem.destroy();
    }
    
    // Destroy error recovery system
    if (this.errorRecoverySystem) {
      this.errorRecoverySystem.destroy();
    }
    
    // Destroy performance monitor
    this.performanceMonitor.destroy();
    
    // Clear LOD system
    this.lodSystem.destroy();
    
    // Clear culling system
    this.cullingSystem.destroy();
    
    // Clear interaction system
    this.interactionSystem.destroy();
    
    // Clear particle system
    this.particleSystem.destroy();
    
    // Clear theme system
    this.themeSystem.destroy();
    
    // Destroy sound system
    if (this.soundSystem) {
      this.soundSystem.destroy();
    }
    
    // Clear task workflow visuals
    this.taskWorkflowVisuals.clearAll();
    
    // Clear task execution system
    this.taskExecutionSystem.clearAll();
    
    // Clear animation system
    this.animationSystem.clear();
    
    // Clear movement system
    this.movementSystem.clear();
    
    // Destroy all entities
    this.entityRegistry.clear();
    
    // Destroy scene container
    this.container.destroy({ children: true });
  }
}

export default Scene;
