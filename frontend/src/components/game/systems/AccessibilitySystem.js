/**
 * AccessibilitySystem - Manages accessibility features for the game layer
 * 
 * Provides keyboard navigation, screen reader support, text descriptions,
 * animation controls, and simplified view mode.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 * Phase 10, Task 61
 */

class AccessibilitySystem {
  /**
   * Create a new accessibility system
   * @param {Scene} scene - Scene instance
   * @param {EntityRegistry} entityRegistry - Entity registry
   */
  constructor(scene, entityRegistry) {
    this.scene = scene;
    this.entityRegistry = entityRegistry;
    
    // Accessibility preferences (loaded from localStorage)
    this.preferences = this.loadPreferences();
    
    // Screen reader announcements queue
    this.announcementQueue = [];
    this.isAnnouncing = false;
    
    // Live region for screen reader announcements
    this.liveRegion = null;
    
    // Keyboard navigation state
    this.keyboardNavigationEnabled = true;
    this.focusedElementIndex = -1;
    this.focusableElements = [];
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize accessibility system
   */
  initialize() {
    // Create live region for screen reader announcements
    this.createLiveRegion();
    
    // Apply preferences
    this.applyPreferences();
    
    // Setup keyboard navigation
    this.setupKeyboardNavigation();
    
    // Listen for entity state changes to announce
    this.setupStateChangeListeners();
    
    // Announce initial state
    this.announceGameState();
  }
  
  /**
   * Load accessibility preferences from localStorage
   * @returns {object} Preferences object
   */
  loadPreferences() {
    const defaultPreferences = {
      animationsEnabled: true,
      simplifiedView: false,
      highContrast: false,
      screenReaderEnabled: true,
      keyboardNavigationEnabled: true,
      reducedMotion: false,
      textDescriptions: true
    };
    
    try {
      const saved = localStorage.getItem('accessibility-preferences');
      if (saved) {
        return { ...defaultPreferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load accessibility preferences:', error);
    }
    
    return defaultPreferences;
  }
  
  /**
   * Save accessibility preferences to localStorage
   */
  savePreferences() {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
      
      // Emit event for UI to update
      window.dispatchEvent(new CustomEvent('game:accessibilityPreferencesChanged', {
        detail: { preferences: this.preferences }
      }));
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
    }
  }
  
  /**
   * Apply accessibility preferences to the game
   */
  applyPreferences() {
    // Apply animation settings
    if (!this.preferences.animationsEnabled || this.preferences.reducedMotion) {
      this.disableAnimations();
    } else {
      this.enableAnimations();
    }
    
    // Apply simplified view
    if (this.preferences.simplifiedView) {
      this.enableSimplifiedView();
    } else {
      this.disableSimplifiedView();
    }
    
    // Apply high contrast mode
    if (this.preferences.highContrast) {
      this.enableHighContrast();
    } else {
      this.disableHighContrast();
    }
  }
  
  /**
   * Create ARIA live region for screen reader announcements
   */
  createLiveRegion() {
    // Check if already exists
    let existing = document.getElementById('game-live-region');
    if (existing) {
      this.liveRegion = existing;
      return;
    }
    
    // Create live region element
    const liveRegion = document.createElement('div');
    liveRegion.id = 'game-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only'; // Screen reader only (visually hidden)
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
    this.liveRegion = liveRegion;
  }
  
  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - Priority level ('polite' | 'assertive')
   */
  announce(message, priority = 'polite') {
    if (!this.preferences.screenReaderEnabled || !this.liveRegion) {
      return;
    }
    
    // Update live region priority
    this.liveRegion.setAttribute('aria-live', priority);
    
    // Queue announcement
    this.announcementQueue.push(message);
    
    // Process queue
    if (!this.isAnnouncing) {
      this.processAnnouncementQueue();
    }
  }
  
  /**
   * Process announcement queue
   */
  async processAnnouncementQueue() {
    if (this.announcementQueue.length === 0) {
      this.isAnnouncing = false;
      return;
    }
    
    this.isAnnouncing = true;
    
    const message = this.announcementQueue.shift();
    
    // Clear and set new message
    this.liveRegion.textContent = '';
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause
    this.liveRegion.textContent = message;
    
    // Wait for announcement to be read (estimate 3 seconds per message)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Process next announcement
    this.processAnnouncementQueue();
  }
  
  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Keyboard navigation is already handled by InteractionSystem
    // This method adds additional accessibility-specific navigation
    
    // Listen for accessibility keyboard shortcuts
    window.addEventListener('keydown', (event) => {
      // Skip if user is typing in an input field
      const target = event.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // Accessibility shortcuts
      switch(event.key) {
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.toggleAccessibilityPanel();
          }
          break;
          
        case 'h':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.announceHelp();
          }
          break;
          
        case 's':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.announceGameState();
          }
          break;
          
        default:
          break;
      }
    });
  }
  
  /**
   * Setup state change listeners for announcements
   */
  setupStateChangeListeners() {
    // Listen for entity selection
    window.addEventListener('game:entitySelect', (event) => {
      const { entityId, entityType } = event.detail;
      const entity = this.entityRegistry.getEntity(entityId);
      
      if (entity) {
        const description = this.getEntityDescription(entity);
        this.announce(`Selected: ${description}`);
      }
    });
    
    // Listen for task completion
    window.addEventListener('game:taskComplete', (event) => {
      const { taskType, agentName } = event.detail;
      this.announce(`Task completed: ${taskType} by ${agentName}`, 'assertive');
    });
    
    // Listen for task start
    window.addEventListener('game:taskStart', (event) => {
      const { taskType, agentName } = event.detail;
      this.announce(`Task started: ${taskType} by ${agentName}`);
    });
    
    // Listen for errors
    window.addEventListener('game:error', (event) => {
      const { message } = event.detail;
      this.announce(`Error: ${message}`, 'assertive');
    });
    
    // Listen for connection status changes
    window.addEventListener('game:connectionStatusChanged', (event) => {
      const { status } = event.detail;
      const statusText = status === 'connected' ? 'Connected to backend' :
                        status === 'disconnected' ? 'Connection lost, reconnecting' :
                        'Connection error';
      this.announce(statusText, 'assertive');
    });
  }
  
  /**
   * Get text description of an entity
   * @param {Entity} entity - Entity to describe
   * @returns {string} Text description
   */
  getEntityDescription(entity) {
    if (!entity) {
      return 'Unknown entity';
    }
    
    const type = entity.type;
    
    if (type === 'agent') {
      const metadata = entity.metadata || {};
      const name = metadata.name || 'Unknown Agent';
      const agentType = entity.agentType || 'agent';
      const state = entity.getState ? entity.getState() : 'unknown';
      
      const stateText = this.getStateDescription(state);
      const typeText = agentType.replace(/_/g, ' ');
      
      return `${name}, ${typeText}, currently ${stateText}`;
    } else if (type === 'task') {
      const taskType = entity.taskType || 'task';
      const status = entity.status || 'unknown';
      const progress = entity.progress || 0;
      
      const taskName = taskType.replace(/_/g, ' ');
      const statusText = this.getTaskStatusDescription(status);
      
      return `${taskName}, ${statusText}, ${progress}% complete`;
    } else if (type === 'environment') {
      const envType = entity.envType || 'object';
      const name = envType.replace(/_/g, ' ');
      
      return `${name}`;
    }
    
    return `${type} entity`;
  }
  
  /**
   * Get text description of agent state
   * @param {string} state - Agent state
   * @returns {string} State description
   */
  getStateDescription(state) {
    const descriptions = {
      idle: 'idle and waiting for tasks',
      working: 'actively working on a task',
      blocked: 'blocked and waiting',
      thinking: 'thinking and processing',
      celebrating: 'celebrating task completion',
      error: 'encountered an error'
    };
    
    return descriptions[state] || state;
  }
  
  /**
   * Get text description of task status
   * @param {string} status - Task status
   * @returns {string} Status description
   */
  getTaskStatusDescription(status) {
    const descriptions = {
      queued: 'queued and waiting',
      active: 'actively running',
      completed: 'completed successfully',
      failed: 'failed with error'
    };
    
    return descriptions[status] || status;
  }
  
  /**
   * Announce current game state
   */
  announceGameState() {
    const agents = Array.from(this.entityRegistry.entitiesByType.get('agent') || [])
      .map(id => this.entityRegistry.getEntity(id))
      .filter(entity => entity !== null);
    
    const tasks = Array.from(this.entityRegistry.entitiesByType.get('task') || [])
      .map(id => this.entityRegistry.getEntity(id))
      .filter(entity => entity !== null);
    
    const activeAgents = agents.filter(agent => {
      const state = agent.getState ? agent.getState() : 'unknown';
      return state === 'working';
    });
    
    const activeTasks = tasks.filter(task => task.status === 'active');
    
    const message = `Game state: ${agents.length} agents, ${activeAgents.length} working. ${tasks.length} tasks, ${activeTasks.length} active.`;
    
    this.announce(message);
  }
  
  /**
   * Announce help information
   */
  announceHelp() {
    const helpText = `
      Keyboard shortcuts:
      Tab to cycle through agents.
      Enter to open details.
      Escape to deselect.
      Numbers 1 through 5 to focus on departments.
      Arrow keys to pan camera.
      Plus and minus to zoom.
      Home to reset view.
      Control A to toggle accessibility panel.
      Control H for help.
      Control S for game state.
    `;
    
    this.announce(helpText.trim().replace(/\s+/g, ' '));
  }
  
  /**
   * Toggle accessibility settings panel
   */
  toggleAccessibilityPanel() {
    window.dispatchEvent(new CustomEvent('game:toggleAccessibilityPanel'));
  }
  
  /**
   * Disable animations
   */
  disableAnimations() {
    const animationSystem = this.scene.getAnimationSystem();
    if (animationSystem) {
      animationSystem.setEnabled(false);
    }
    
    const particleSystem = this.scene.getParticleSystem();
    if (particleSystem) {
      particleSystem.setEnabled(false);
    }
    
    // Emit event for other systems
    window.dispatchEvent(new CustomEvent('game:animationsDisabled'));
  }
  
  /**
   * Enable animations
   */
  enableAnimations() {
    const animationSystem = this.scene.getAnimationSystem();
    if (animationSystem) {
      animationSystem.setEnabled(true);
    }
    
    const particleSystem = this.scene.getParticleSystem();
    if (particleSystem) {
      particleSystem.setEnabled(true);
    }
    
    // Emit event for other systems
    window.dispatchEvent(new CustomEvent('game:animationsEnabled'));
  }
  
  /**
   * Enable simplified view mode
   */
  enableSimplifiedView() {
    // Disable particle effects
    const particleSystem = this.scene.getParticleSystem();
    if (particleSystem) {
      particleSystem.setEnabled(false);
    }
    
    // Reduce visual complexity
    const lodSystem = this.scene.getLODSystem();
    if (lodSystem) {
      lodSystem.setForcedLOD('low');
    }
    
    // Emit event for UI to simplify
    window.dispatchEvent(new CustomEvent('game:simplifiedViewEnabled'));
  }
  
  /**
   * Disable simplified view mode
   */
  disableSimplifiedView() {
    // Re-enable particle effects if animations are enabled
    if (this.preferences.animationsEnabled) {
      const particleSystem = this.scene.getParticleSystem();
      if (particleSystem) {
        particleSystem.setEnabled(true);
      }
    }
    
    // Restore normal LOD
    const lodSystem = this.scene.getLODSystem();
    if (lodSystem) {
      lodSystem.setForcedLOD(null);
    }
    
    // Emit event for UI to restore
    window.dispatchEvent(new CustomEvent('game:simplifiedViewDisabled'));
  }
  
  /**
   * Enable high contrast mode
   */
  enableHighContrast() {
    const themeSystem = this.scene.getThemeSystem();
    if (themeSystem) {
      themeSystem.setTheme('highContrast');
    }
  }
  
  /**
   * Disable high contrast mode
   */
  disableHighContrast() {
    const themeSystem = this.scene.getThemeSystem();
    if (themeSystem) {
      // Restore previous theme (light or dark based on system preference)
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeSystem.setTheme(prefersDark ? 'dark' : 'light');
    }
  }
  
  /**
   * Update preference
   * @param {string} key - Preference key
   * @param {any} value - Preference value
   */
  setPreference(key, value) {
    this.preferences[key] = value;
    this.savePreferences();
    this.applyPreferences();
  }
  
  /**
   * Get preference
   * @param {string} key - Preference key
   * @returns {any} Preference value
   */
  getPreference(key) {
    return this.preferences[key];
  }
  
  /**
   * Get all preferences
   * @returns {object} All preferences
   */
  getAllPreferences() {
    return { ...this.preferences };
  }
  
  /**
   * Update accessibility system
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    // Future: Handle any time-based accessibility features
  }
  
  /**
   * Destroy accessibility system
   */
  destroy() {
    // Remove live region
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
    
    // Clear announcement queue
    this.announcementQueue = [];
    this.isAnnouncing = false;
  }
}

export default AccessibilitySystem;
