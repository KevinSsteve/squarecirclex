/**
 * TaskWorkflowVisuals - Visual components for task workflow phases
 * 
 * Creates visual indicators for each phase of task execution:
 * - Queued: Notification icon above agent
 * - Movement: Agent walks to desk (handled by MovementSystem)
 * - Setup: Screen lights up, agent sits
 * - Execution: Progress bar, work animation, task-specific screen visuals
 * - Completion: Celebration or error effects
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5, 9.2
 * Phase 5, Task 26-27
 * Phase 9, Task 52 (Refactored to use ObjectPool)
 */

import * as PIXI from 'pixi.js';
import TaskScreenVisuals from './TaskScreenVisuals.js';
import ObjectPool from '../utils/ObjectPool.js';

/**
 * TaskWorkflowVisuals class
 * Manages visual components for task workflow phases
 */
class TaskWorkflowVisuals {
  /**
   * Create a new task workflow visuals manager
   * @param {Scene} scene - Game scene
   */
  constructor(scene) {
    this.scene = scene;
    this.entityRegistry = scene.getEntityRegistry();
    
    // Task screen visuals manager
    this.taskScreenVisuals = new TaskScreenVisuals(scene);
    
    // Active visual components (taskId -> visuals)
    this.activeVisuals = new Map();
    
    // Create object pools for visual components
    this.notificationPool = new ObjectPool(
      () => this.createNotificationIcon(),
      (notification) => {
        notification.alpha = 0;
        notification.scale.set(0.5);
      },
      10, // Initial size
      10  // Max size
    );
    
    this.progressBarPool = new ObjectPool(
      () => this.createProgressBar(),
      (progressBar) => {
        progressBar.alpha = 0;
        const fill = progressBar.getChildByName('fill');
        if (fill) fill.width = 0;
        const percentText = progressBar.getChildByName('percentText');
        if (percentText) percentText.text = '0%';
      },
      20, // Initial size
      20  // Max size
    );
    
    this.screenGlowPool = new ObjectPool(
      () => new PIXI.Graphics(),
      (glow) => {
        glow.clear();
        glow.alpha = 0;
        glow._stopPulsing = false;
      },
      10, // Initial size
      10  // Max size
    );
    
    this.effectPool = new ObjectPool(
      () => new PIXI.Container(),
      (effect) => {
        effect.alpha = 0;
        effect.scale.set(1);
        effect.rotation = 0;
        effect.removeChildren();
      },
      10, // Initial size
      10  // Max size
    );
    
    this.deskHighlightPool = new ObjectPool(
      () => this.createDeskHighlight(),
      (highlight) => {
        highlight.alpha = 0;
        highlight._stopPulsing = false;
      },
      10, // Initial size
      10  // Max size
    );
    
    // Active desk highlights (agentId -> highlight)
    this.activeDeskHighlights = new Map();
  }
  
  /**
   * Show queued phase visualization
   * @param {string} taskId - Task entity ID
   * @param {string} agentId - Agent entity ID
   */
  showQueuedPhase(taskId, agentId) {
    const agent = this.entityRegistry.getEntity(agentId);
    if (!agent) return;
    
    // Acquire notification icon from pool
    const notification = this.notificationPool.acquire();
    if (!notification) {
      console.warn('Notification pool exhausted');
      return;
    }
    
    // Position above agent's head
    const position = agent.getComponent('position');
    if (position) {
      notification.x = position.x;
      notification.y = position.y - 40; // 40px above agent
    }
    
    // Add to effects layer
    this.scene.addToLayer('effects', notification);
    
    // Store visual
    if (!this.activeVisuals.has(taskId)) {
      this.activeVisuals.set(taskId, {});
    }
    this.activeVisuals.get(taskId).notification = notification;
    
    // Animate notification (bounce in)
    this.animateNotificationIn(notification);
    
    // Auto-remove after 1 second
    setTimeout(() => {
      this.hideQueuedPhase(taskId);
    }, 1000);
  }
  
  /**
   * Hide queued phase visualization
   * @param {string} taskId - Task entity ID
   */
  hideQueuedPhase(taskId) {
    const visuals = this.activeVisuals.get(taskId);
    if (!visuals || !visuals.notification) return;
    
    const notification = visuals.notification;
    
    // Animate out
    this.animateNotificationOut(notification, () => {
      this.scene.removeFromLayer('effects', notification);
      this.notificationPool.release(notification);
      delete visuals.notification;
    });
  }
  
  /**
   * Show setup phase visualization
   * @param {string} taskId - Task entity ID
   * @param {string} agentId - Agent entity ID
   */
  showSetupPhase(taskId, agentId) {
    const agent = this.entityRegistry.getEntity(agentId);
    if (!agent) return;
    
    // Get task to determine type for color coding
    const task = this.entityRegistry.getEntity(taskId);
    if (!task) return;
    
    // Find workstation near agent
    const workstation = this.findNearestWorkstation(agent);
    if (!workstation) return;
    
    // Acquire screen glow from pool and configure it
    const screenGlow = this.screenGlowPool.acquire();
    if (!screenGlow) {
      console.warn('Screen glow pool exhausted');
      return;
    }
    
    // Configure the glow with task-specific color
    const color = this.getScreenGlowColor(task.taskType);
    screenGlow.clear();
    screenGlow.rect(-15, -10, 30, 20);
    screenGlow.fill({ color: color, alpha: 0.6 });
    screenGlow.alpha = 0;
    
    // Position at workstation
    const position = workstation.getComponent('position');
    if (position) {
      screenGlow.x = position.x + 20; // Offset for screen position
      screenGlow.y = position.y - 10;
    }
    
    // Add to effects layer
    this.scene.addToLayer('effects', screenGlow);
    
    // Store visual
    if (!this.activeVisuals.has(taskId)) {
      this.activeVisuals.set(taskId, {});
    }
    this.activeVisuals.get(taskId).screenGlow = screenGlow;
    
    // Animate glow (fade in with pulsing)
    this.animateScreenGlowIn(screenGlow);
  }
  
  /**
   * Hide setup phase visualization
   * @param {string} taskId - Task entity ID
   */
  hideSetupPhase(taskId) {
    const visuals = this.activeVisuals.get(taskId);
    if (!visuals || !visuals.screenGlow) return;
    
    const screenGlow = visuals.screenGlow;
    
    // Keep glow during execution phase
    // Will be removed in hideExecutionPhase
  }
  
  /**
   * Show execution phase visualization
   * @param {string} taskId - Task entity ID
   * @param {string} agentId - Agent entity ID
   */
  showExecutionPhase(taskId, agentId) {
    const agent = this.entityRegistry.getEntity(agentId);
    if (!agent) return;
    
    // Get task to determine type
    const task = this.entityRegistry.getEntity(taskId);
    if (!task) return;
    
    // Find workstation near agent
    const workstation = this.findNearestWorkstation(agent);
    if (!workstation) return;
    
    // Acquire progress bar from pool
    const progressBar = this.progressBarPool.acquire();
    if (!progressBar) {
      console.warn('Progress bar pool exhausted');
      return;
    }
    
    // Position above workstation
    const position = workstation.getComponent('position');
    if (position) {
      progressBar.x = position.x;
      progressBar.y = position.y - 50; // 50px above workstation
    }
    
    // Add to ui_world layer
    this.scene.addToLayer('ui_world', progressBar);
    
    // Store visual
    if (!this.activeVisuals.has(taskId)) {
      this.activeVisuals.set(taskId, {});
    }
    this.activeVisuals.get(taskId).progressBar = progressBar;
    
    // Animate progress bar (fade in)
    this.animateProgressBarIn(progressBar);
    
    // Show task-specific screen visual
    this.taskScreenVisuals.showScreenVisual(taskId, task.taskType, agentId);
  }
  
  /**
   * Update execution phase progress
   * @param {string} taskId - Task entity ID
   * @param {number} progress - Progress (0-100)
   */
  updateExecutionProgress(taskId, progress) {
    const visuals = this.activeVisuals.get(taskId);
    if (!visuals || !visuals.progressBar) return;
    
    const progressBar = visuals.progressBar;
    
    // Update progress bar fill
    this.updateProgressBarFill(progressBar, progress);
  }
  
  /**
   * Hide execution phase visualization
   * @param {string} taskId - Task entity ID
   */
  hideExecutionPhase(taskId) {
    const visuals = this.activeVisuals.get(taskId);
    if (!visuals) return;
    
    // Remove progress bar
    if (visuals.progressBar) {
      const progressBar = visuals.progressBar;
      this.animateProgressBarOut(progressBar, () => {
        this.scene.removeFromLayer('ui_world', progressBar);
        this.progressBarPool.release(progressBar);
        delete visuals.progressBar;
      });
    }
    
    // Remove screen glow
    if (visuals.screenGlow) {
      const screenGlow = visuals.screenGlow;
      this.animateScreenGlowOut(screenGlow, () => {
        this.scene.removeFromLayer('effects', screenGlow);
        this.screenGlowPool.release(screenGlow);
        delete visuals.screenGlow;
      });
    }
    
    // Hide task-specific screen visual
    this.taskScreenVisuals.hideScreenVisual(taskId);
  }
  
  /**
   * Show completion phase visualization
   * @param {string} taskId - Task entity ID
   * @param {string} agentId - Agent entity ID
   * @param {boolean} success - True for success, false for failure
   */
  showCompletionPhase(taskId, agentId, success) {
    const agent = this.entityRegistry.getEntity(agentId);
    if (!agent) return;
    
    // Get agent position
    const position = agent.getComponent('position');
    if (!position) return;
    
    // Acquire effect from pool
    const effect = this.effectPool.acquire();
    if (!effect) {
      console.warn('Effect pool exhausted');
      return;
    }
    
    // Build the effect (checkmark or X)
    if (success) {
      this.buildSuccessEffect(effect);
    } else {
      this.buildErrorEffect(effect);
    }
    
    // Position at agent
    effect.x = position.x;
    effect.y = position.y - 20;
    
    // Add to effects layer
    this.scene.addToLayer('effects', effect);
    
    // Store visual
    if (!this.activeVisuals.has(taskId)) {
      this.activeVisuals.set(taskId, {});
    }
    this.activeVisuals.get(taskId).completionEffect = effect;
    
    // Animate effect
    if (success) {
      this.animateSuccessEffect(effect);
      
      // Trigger particle effects based on task type
      const task = this.entityRegistry.getEntity(taskId);
      if (task) {
        this.triggerCelebrationParticles(task.taskType, position.x, position.y);
      }
    } else {
      this.animateErrorEffect(effect);
      
      // Trigger error particle effects (smoke)
      this.triggerErrorParticles(position.x, position.y);
      
      // Trigger error notification
      this.triggerErrorNotification(taskId);
    }
    
    // Auto-remove after animation
    setTimeout(() => {
      this.hideCompletionPhase(taskId);
    }, 1500);
  }
  
  /**
   * Hide completion phase visualization
   * @param {string} taskId - Task entity ID
   */
  hideCompletionPhase(taskId) {
    const visuals = this.activeVisuals.get(taskId);
    if (!visuals || !visuals.completionEffect) return;
    
    const effect = visuals.completionEffect;
    
    // Fade out and remove
    this.animateEffectOut(effect, () => {
      this.scene.removeFromLayer('effects', effect);
      this.effectPool.release(effect);
      delete visuals.completionEffect;
    });
    
    // Clean up task visuals
    this.activeVisuals.delete(taskId);
  }
  
  /**
   * Create notification icon
   * @returns {PIXI.Container} Notification icon container
   * @private
   */
  createNotificationIcon() {
    // Create new notification icon
    const container = new PIXI.Container();
    
    // Background circle
    const bg = new PIXI.Graphics();
    bg.circle(0, 0, 12);
    bg.fill({ color: 0x4F46E5 }); // Indigo
    container.addChild(bg);
    
    // Exclamation mark
    const text = new PIXI.Text({
      text: '!',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      }
    });
    text.anchor.set(0.5);
    container.addChild(text);
    
    container.alpha = 0;
    container.scale.set(0.5);
    
    return container;
  }
  
  /**
   * Create screen glow effect with task-specific color
   * @param {string} taskType - Type of task for color coding
   * @returns {PIXI.Graphics} Screen glow graphics
   * @private
   */
  createScreenGlow(taskType = 'default') {
    // Create new screen glow with task-specific color
    const glow = new PIXI.Graphics();
    const color = this.getScreenGlowColor(taskType);
    glow.rect(-15, -10, 30, 20);
    glow.fill({ color: color, alpha: 0.6 });
    glow.alpha = 0;
    
    return glow;
  }
  
  /**
   * Get screen glow color based on task type
   * @param {string} taskType - Type of task
   * @returns {number} Color hex value
   * @private
   */
  getScreenGlowColor(taskType) {
    // Color coding by task type (from design document)
    const colorMap = {
      'generate_content': 0x60A5FA,  // Blue - content creation
      'publish_post': 0x10B981,      // Green - publishing
      'scrape_trends': 0xF59E0B,     // Amber - trend analysis
      'handle_chat': 0x8B5CF6,       // Purple - customer support
      'oauth_flow': 0x6B7280,        // Gray - administration
      'default': 0x60A5FA            // Default blue
    };
    
    return colorMap[taskType] || colorMap['default'];
  }
  
  /**
   * Create progress bar
   * @returns {PIXI.Container} Progress bar container
   * @private
   */
  createProgressBar() {
    // Create new progress bar
    const container = new PIXI.Container();
    
    // Background
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 80, 8, 4);
    bg.fill({ color: 0x1F2937 }); // Dark gray
    bg.label = 'background';
    container.addChild(bg);
    
    // Fill (progress)
    const fill = new PIXI.Graphics();
    fill.roundRect(0, 0, 0, 8, 4); // Start at 0 width
    fill.fill({ color: 0x10B981 }); // Green
    fill.label = 'fill';
    container.addChild(fill);
    
    // Percentage text
    const percentText = new PIXI.Text({
      text: '0%',
      style: {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      }
    });
    percentText.anchor.set(0.5);
    percentText.x = 40; // Center of bar
    percentText.y = 4;  // Center vertically
    percentText.label = 'percentText';
    container.addChild(percentText);
    
    // Center the bar
    container.pivot.set(40, 4);
    container.alpha = 0;
    
    return container;
  }
  
  /**
   * Build success effect (checkmark + sparkles) in existing container
   * @param {PIXI.Container} container - Container to build effect in
   * @private
   */
  buildSuccessEffect(container) {
    // Clear any existing children
    container.removeChildren();
    
    // Green circle background
    const bg = new PIXI.Graphics();
    bg.circle(0, 0, 20);
    bg.fill({ color: 0x10B981 }); // Green
    container.addChild(bg);
    
    // Checkmark
    const checkmark = new PIXI.Text({
      text: '✓',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      }
    });
    checkmark.anchor.set(0.5);
    container.addChild(checkmark);
    
    container.alpha = 0;
    container.scale.set(0.5);
  }
  
  /**
   * Build error effect (X mark + red glow) in existing container
   * @param {PIXI.Container} container - Container to build effect in
   * @private
   */
  buildErrorEffect(container) {
    // Clear any existing children
    container.removeChildren();
    
    // Red circle background
    const bg = new PIXI.Graphics();
    bg.circle(0, 0, 20);
    bg.fill({ color: 0xEF4444 }); // Red
    container.addChild(bg);
    
    // X mark
    const xmark = new PIXI.Text({
      text: '✕',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      }
    });
    xmark.anchor.set(0.5);
    container.addChild(xmark);
    
    container.alpha = 0;
    container.scale.set(0.5);
  }
  
  /**
   * Animate notification icon in (bounce)
   * @param {PIXI.Container} notification - Notification container
   * @private
   */
  animateNotificationIn(notification) {
    const startTime = Date.now();
    const duration = 300;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Ease out back (bounce)
      const t = progress - 1;
      const eased = 1 + t * t * (2.70158 * t + 1.70158);
      
      notification.alpha = progress;
      notification.scale.set(0.5 + eased * 0.5);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Animate notification icon out (fade)
   * @param {PIXI.Container} notification - Notification container
   * @param {Function} onComplete - Callback when animation completes
   * @private
   */
  animateNotificationOut(notification, onComplete) {
    const startTime = Date.now();
    const duration = 200;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      notification.alpha = 1 - progress;
      notification.y -= 0.5; // Float up
      
      if (progress >= 1) {
        onComplete();
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Animate screen glow in (fade + pulse)
   * @param {PIXI.Graphics} glow - Screen glow graphics
   * @private
   */
  animateScreenGlowIn(glow) {
    const startTime = Date.now();
    const duration = 500;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      glow.alpha = progress * 0.6;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Start pulsing
        this.pulseScreenGlow(glow);
      }
    };
    
    animate();
  }
  
  /**
   * Pulse screen glow (continuous)
   * @param {PIXI.Graphics} glow - Screen glow graphics
   * @private
   */
  pulseScreenGlow(glow) {
    const startTime = Date.now();
    
    const animate = () => {
      if (!glow.parent || glow._stopPulsing) return; // Stop if removed or flagged
      
      const elapsed = Date.now() - startTime;
      const cycle = (elapsed % 2000) / 2000; // 2 second cycle
      
      // Sine wave pulse for intensity
      const pulse = Math.sin(cycle * Math.PI * 2) * 0.2 + 0.6; // Range: 0.4 to 0.8
      glow.alpha = pulse;
      
      // Slight scale pulse for more dynamic effect
      const scalePulse = Math.sin(cycle * Math.PI * 2) * 0.05 + 1.0; // Range: 0.95 to 1.05
      glow.scale.set(scalePulse, scalePulse);
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * Animate screen glow out (fade)
   * @param {PIXI.Graphics} glow - Screen glow graphics
   * @param {Function} onComplete - Callback when animation completes
   * @private
   */
  animateScreenGlowOut(glow, onComplete) {
    // Stop pulsing animation
    glow._stopPulsing = true;
    
    const startTime = Date.now();
    const duration = 300;
    const startAlpha = glow.alpha;
    const startScale = glow.scale.x;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      glow.alpha = startAlpha * (1 - progress);
      
      // Reset scale during fade out
      const scale = startScale - (startScale - 1.0) * progress;
      glow.scale.set(scale, scale);
      
      if (progress >= 1) {
        onComplete();
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Animate progress bar in (fade)
   * @param {PIXI.Container} progressBar - Progress bar container
   * @private
   */
  animateProgressBarIn(progressBar) {
    const startTime = Date.now();
    const duration = 200;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      progressBar.alpha = progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Start pulsing animation
        this.pulseProgressBar(progressBar);
      }
    };
    
    animate();
  }
  
  /**
   * Pulse progress bar (continuous)
   * @param {PIXI.Container} progressBar - Progress bar container
   * @private
   */
  pulseProgressBar(progressBar) {
    const startTime = Date.now();
    
    const animate = () => {
      if (!progressBar.parent || progressBar._stopPulsing) {
        return; // Stop if removed or flagged to stop
      }
      
      const elapsed = Date.now() - startTime;
      const cycle = (elapsed % 1500) / 1500; // 1.5 second cycle
      
      // Sine wave pulse for scale
      const pulse = Math.sin(cycle * Math.PI * 2) * 0.05 + 1.0; // Scale 0.95 to 1.05
      progressBar.scale.set(pulse, pulse);
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * Update progress bar fill
   * @param {PIXI.Container} progressBar - Progress bar container
   * @param {number} progress - Progress (0-100)
   * @private
   */
  updateProgressBarFill(progressBar, progress) {
    const fill = progressBar.getChildByLabel('fill');
    const percentText = progressBar.getChildByLabel('percentText');
    if (!fill) return;
    
    // Smooth transition to new width
    const targetWidth = (progress / 100) * 80;
    const currentWidth = fill.width;
    const diff = targetWidth - currentWidth;
    
    // Animate to target width
    if (Math.abs(diff) > 0.5) {
      fill.width += diff * 0.2; // Smooth interpolation
    } else {
      fill.width = targetWidth;
    }
    
    // Color transition: blue → green as progress increases
    fill.clear();
    const color = this.interpolateColor(0x3B82F6, 0x10B981, progress / 100);
    fill.roundRect(0, 0, fill.width, 8, 4);
    fill.fill({ color: color });
    
    // Update percentage text
    if (percentText) {
      percentText.text = `${Math.round(progress)}%`;
    }
  }
  
  /**
   * Animate progress bar out (fade)
   * @param {PIXI.Container} progressBar - Progress bar container
   * @param {Function} onComplete - Callback when animation completes
   * @private
   */
  animateProgressBarOut(progressBar, onComplete) {
    // Stop pulsing animation
    progressBar._stopPulsing = true;
    
    const startTime = Date.now();
    const duration = 200;
    const startAlpha = progressBar.alpha;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      progressBar.alpha = startAlpha * (1 - progress);
      
      // Reset scale during fade out
      const scale = 1 + (1 - progress) * (progressBar.scale.x - 1);
      progressBar.scale.set(scale, scale);
      
      if (progress >= 1) {
        onComplete();
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Animate success effect (scale + fade)
   * @param {PIXI.Container} effect - Success effect container
   * @private
   */
  animateSuccessEffect(effect) {
    const startTime = Date.now();
    const duration = 1500;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      
      effect.alpha = 1 - progress;
      effect.scale.set(0.5 + eased * 0.5);
      effect.y -= 0.3; // Float up
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Animate error effect (shake + fade)
   * @param {PIXI.Container} effect - Error effect container
   * @private
   */
  animateErrorEffect(effect) {
    const startTime = Date.now();
    const duration = 1500;
    const originalX = effect.x;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Shake for first 500ms
      if (elapsed < 500) {
        const shake = Math.sin(elapsed * 0.05) * 3;
        effect.x = originalX + shake;
      } else {
        effect.x = originalX;
      }
      
      effect.alpha = 1 - progress;
      effect.scale.set(0.5 + progress * 0.3);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Animate effect out (fade)
   * @param {PIXI.Container} effect - Effect container
   * @param {Function} onComplete - Callback when animation completes
   * @private
   */
  animateEffectOut(effect, onComplete) {
    // Effect already animating out, just call complete
    onComplete();
  }
  
  /**
   * Find nearest workstation to agent
   * @param {AgentEntity} agent - Agent entity
   * @returns {EnvironmentEntity|null} Nearest workstation or null
   * @private
   */
  findNearestWorkstation(agent) {
    const department = this.entityRegistry.getEntity(agent.getDepartment());
    if (!department) return null;
    
    // Get workstations in department
    const workstations = department.furniture
      .map(id => this.entityRegistry.getEntity(id))
      .filter(entity => entity && entity.workstationType === 'desk');
    
    if (workstations.length === 0) return null;
    
    // Return first workstation (simplified)
    return workstations[0];
  }
  
  /**
   * Trigger celebration particles based on task type
   * @param {string} taskType - Type of task completed
   * @param {number} x - X position
   * @param {number} y - Y position
   * @private
   */
  triggerCelebrationParticles(taskType, x, y) {
    const particleSystem = this.scene.getParticleSystem();
    if (!particleSystem) return;
    
    // Different particle effects for different task types
    switch (taskType) {
      case 'generate_content':
        // Confetti for content generation
        particleSystem.emitConfetti(x, y);
        break;
        
      case 'publish_post':
        // Stars for publishing
        particleSystem.emitStars(x, y);
        break;
        
      case 'scrape_trends':
        // Sparkles for trend analysis (milestone)
        particleSystem.emitSparkles(x, y);
        break;
        
      case 'handle_chat':
        // Confetti for chat handling
        particleSystem.emitConfetti(x, y);
        break;
        
      case 'oauth_flow':
        // Sparkles for OAuth completion (milestone)
        particleSystem.emitSparkles(x, y);
        break;
        
      default:
        // Default confetti for unknown task types
        particleSystem.emitConfetti(x, y);
        break;
    }
  }
  
  /**
   * Trigger error particles (smoke effect)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @private
   */
  triggerErrorParticles(x, y) {
    const particleSystem = this.scene.getParticleSystem();
    if (!particleSystem) return;
    
    // Emit smoke particles for error state
    particleSystem.emitSmoke(x, y);
  }
  
  /**
   * Trigger error notification toast
   * @param {string} taskId - Task entity ID
   * @private
   */
  triggerErrorNotification(taskId) {
    const task = this.entityRegistry.getEntity(taskId);
    if (!task) return;
    
    // Get task type for better error message
    const taskType = task.taskType || 'task';
    
    // Dispatch error event for NotificationToast to catch
    window.dispatchEvent(new CustomEvent('game:taskFailed', {
      detail: {
        taskId,
        taskType,
        error: 'Task execution failed'
      }
    }));
  }
  
  /**
   * Interpolate between two colors
   * @param {number} color1 - Start color (hex)
   * @param {number} color2 - End color (hex)
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated color (hex)
   * @private
   */
  interpolateColor(color1, color2, t) {
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;
    
    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return (r << 16) | (g << 8) | b;
  }
  
  /**
   * Show desk highlight when agent is approaching
   * @param {string} agentId - Agent entity ID
   * @param {EnvironmentEntity} workstation - Target workstation
   */
  showDeskHighlight(agentId, workstation) {
    // Don't create duplicate highlights
    if (this.activeDeskHighlights.has(agentId)) {
      return;
    }
    
    // Acquire desk highlight from pool
    const highlight = this.deskHighlightPool.acquire();
    if (!highlight) {
      console.warn('Desk highlight pool exhausted');
      return;
    }
    
    // Position at workstation
    const position = workstation.getComponent('position');
    if (position) {
      highlight.x = position.x;
      highlight.y = position.y;
    }
    
    // Add to effects layer
    this.scene.addToLayer('effects', highlight);
    
    // Store highlight
    this.activeDeskHighlights.set(agentId, highlight);
    
    // Animate highlight (fade in)
    this.animateDeskHighlightIn(highlight);
  }
  
  /**
   * Hide desk highlight when agent arrives
   * @param {string} agentId - Agent entity ID
   */
  hideDeskHighlight(agentId) {
    const highlight = this.activeDeskHighlights.get(agentId);
    if (!highlight) return;
    
    // Animate out
    this.animateDeskHighlightOut(highlight, () => {
      this.scene.removeFromLayer('effects', highlight);
      this.deskHighlightPool.release(highlight);
      this.activeDeskHighlights.delete(agentId);
    });
  }
  
  /**
   * Create desk highlight effect
   * @returns {PIXI.Graphics} Desk highlight graphics
   * @private
   */
  createDeskHighlight() {
    // Create new desk highlight (pool handles reuse)
    const highlight = new PIXI.Graphics();
    highlight.rect(-48, -32, 96, 64); // Desk size
    highlight.fill({ color: 0xFFFFFF, alpha: 0.3 }); // White with 30% opacity
    highlight.alpha = 0;
    
    return highlight;
  }
  
  /**
   * Animate desk highlight in (fade)
   * @param {PIXI.Graphics} highlight - Desk highlight graphics
   * @private
   */
  animateDeskHighlightIn(highlight) {
    const startTime = Date.now();
    const duration = 300;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      highlight.alpha = progress * 0.3; // Fade to 30% opacity
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Animate desk highlight out (fade)
   * @param {PIXI.Graphics} highlight - Desk highlight graphics
   * @param {Function} onComplete - Callback when animation completes
   * @private
   */
  animateDeskHighlightOut(highlight, onComplete) {
    const startTime = Date.now();
    const duration = 300;
    const startAlpha = highlight.alpha;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      highlight.alpha = startAlpha * (1 - progress);
      
      if (progress >= 1) {
        onComplete();
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Update all active visuals
   * Called every frame by Scene
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    // Update positions of visuals attached to moving entities
    for (const [taskId, visuals] of this.activeVisuals.entries()) {
      const task = this.entityRegistry.getEntity(taskId);
      if (!task || !task.assignedAgent) continue;
      
      const agent = this.entityRegistry.getEntity(task.assignedAgent);
      if (!agent) continue;
      
      const position = agent.getComponent('position');
      if (!position) continue;
      
      // Update notification position
      if (visuals.notification) {
        visuals.notification.x = position.x;
        visuals.notification.y = position.y - 40;
      }
      
      // Update completion effect position
      if (visuals.completionEffect) {
        visuals.completionEffect.x = position.x;
        visuals.completionEffect.y = position.y - 20;
      }
    }
    
    // Update task screen visuals
    this.taskScreenVisuals.update(deltaTime);
  }
  
  /**
   * Clear all active visuals
   */
  clearAll() {
    for (const [taskId, visuals] of this.activeVisuals.entries()) {
      if (visuals.notification) {
        this.scene.removeFromLayer('effects', visuals.notification);
        visuals.notification.destroy();
      }
      if (visuals.screenGlow) {
        this.scene.removeFromLayer('effects', visuals.screenGlow);
        visuals.screenGlow.destroy();
      }
      if (visuals.progressBar) {
        this.scene.removeFromLayer('ui_world', visuals.progressBar);
        visuals.progressBar.destroy();
      }
      if (visuals.completionEffect) {
        this.scene.removeFromLayer('effects', visuals.completionEffect);
        visuals.completionEffect.destroy();
      }
    }
    
    this.activeVisuals.clear();
    
    // Clear desk highlights
    for (const [agentId, highlight] of this.activeDeskHighlights.entries()) {
      this.scene.removeFromLayer('effects', highlight);
      highlight.destroy();
    }
    
    this.activeDeskHighlights.clear();
    
    // Clear task screen visuals
    this.taskScreenVisuals.clearAll();
  }
}

export default TaskWorkflowVisuals;
