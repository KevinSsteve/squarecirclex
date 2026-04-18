/**
 * TaskScreenVisuals - Task-specific screen visualizations
 * 
 * Creates visual representations of work being done on computer screens:
 * - Content Generation: Text editor with typing text
 * - Publishing: Social media dashboard
 * - Trend Scraping: Graphs and charts
 * - Chat Handling: Chat interface
 * 
 * Requirements: 3.1, 13.1, 13.2, 13.3, 13.4
 * Phase 5, Task 27
 */

import * as PIXI from 'pixi.js';

/**
 * TaskScreenVisuals class
 * Manages task-specific screen visualizations
 */
class TaskScreenVisuals {
  /**
   * Create a new task screen visuals manager
   * @param {Scene} scene - Game scene
   */
  constructor(scene) {
    this.scene = scene;
    this.entityRegistry = scene.getEntityRegistry();
    
    // Active screen visuals (taskId -> visual)
    this.activeScreens = new Map();
    
    // Visual pools for reuse
    this.textEditorPool = [];
    this.dashboardPool = [];
    this.graphsPool = [];
    this.chatInterfacePool = [];
  }
  
  /**
   * Show screen visual for task type
   * @param {string} taskId - Task entity ID
   * @param {string} taskType - Task type
   * @param {string} agentId - Agent entity ID
   */
  showScreenVisual(taskId, taskType, agentId) {
    const agent = this.entityRegistry.getEntity(agentId);
    if (!agent) return;
    
    // Find workstation
    const workstation = this.findNearestWorkstation(agent);
    if (!workstation) return;
    
    // Create appropriate screen visual based on task type
    let screenVisual;
    switch (taskType) {
      case 'generate_content':
        screenVisual = this.createTextEditorVisual();
        break;
      case 'publish_post':
        screenVisual = this.createDashboardVisual();
        break;
      case 'scrape_trends':
        screenVisual = this.createGraphsVisual();
        break;
      case 'handle_chat':
        screenVisual = this.createChatInterfaceVisual();
        break;
      default:
        screenVisual = this.createGenericScreenVisual();
    }
    
    // Position at workstation screen
    const position = workstation.getComponent('position');
    if (position) {
      screenVisual.x = position.x + 20; // Offset for screen position
      screenVisual.y = position.y - 15;
    }
    
    // Add to effects layer
    this.scene.addToLayer('effects', screenVisual);
    
    // Store visual
    this.activeScreens.set(taskId, screenVisual);
    
    // Animate in
    this.animateScreenIn(screenVisual);
  }
  
  /**
   * Hide screen visual
   * @param {string} taskId - Task entity ID
   */
  hideScreenVisual(taskId) {
    const screenVisual = this.activeScreens.get(taskId);
    if (!screenVisual) return;
    
    // Animate out
    this.animateScreenOut(screenVisual, () => {
      this.scene.removeFromLayer('effects', screenVisual);
      this.returnToPool(screenVisual);
      this.activeScreens.delete(taskId);
    });
  }
  
  /**
   * Create text editor visual (content generation)
   * @returns {PIXI.Container} Text editor container
   * @private
   */
  createTextEditorVisual() {
    // Try to reuse from pool
    if (this.textEditorPool.length > 0) {
      const visual = this.textEditorPool.pop();
      visual.alpha = 0;
      return visual;
    }
    
    const container = new PIXI.Container();
    container.label = 'text_editor';
    
    // Screen background
    const screen = new PIXI.Graphics();
    screen.roundRect(0, 0, 40, 30, 2);
    screen.fill({ color: 0x1E293B }); // Dark slate
    container.addChild(screen);
    
    // Text lines (simulated code/text)
    const lineColors = [0x60A5FA, 0x34D399, 0xFBBF24, 0xF87171];
    for (let i = 0; i < 4; i++) {
      const line = new PIXI.Graphics();
      const width = 20 + Math.random() * 15;
      line.rect(3, 5 + i * 6, width, 2);
      line.fill({ color: lineColors[i % lineColors.length] });
      line.label = `line_${i}`;
      container.addChild(line);
    }
    
    // Cursor (blinking)
    const cursor = new PIXI.Graphics();
    cursor.rect(3, 23, 1, 4);
    cursor.fill({ color: 0xFFFFFF });
    cursor.label = 'cursor';
    container.addChild(cursor);
    
    // Center pivot
    container.pivot.set(20, 15);
    container.alpha = 0;
    
    // Start cursor blink animation
    this.animateCursorBlink(cursor);
    
    return container;
  }
  
  /**
   * Create dashboard visual (publishing)
   * @returns {PIXI.Container} Dashboard container
   * @private
   */
  createDashboardVisual() {
    // Try to reuse from pool
    if (this.dashboardPool.length > 0) {
      const visual = this.dashboardPool.pop();
      visual.alpha = 0;
      return visual;
    }
    
    const container = new PIXI.Container();
    container.label = 'dashboard';
    
    // Screen background
    const screen = new PIXI.Graphics();
    screen.roundRect(0, 0, 40, 30, 2);
    screen.fill({ color: 0x1E293B }); // Dark slate
    container.addChild(screen);
    
    // Social media icons (simplified)
    const iconColors = [0x1DA1F2, 0x0A66C2, 0xE4405F]; // Twitter, LinkedIn, Instagram colors
    for (let i = 0; i < 3; i++) {
      const icon = new PIXI.Graphics();
      icon.circle(8 + i * 12, 8, 3);
      icon.fill({ color: iconColors[i] });
      container.addChild(icon);
    }
    
    // Post preview boxes
    for (let i = 0; i < 2; i++) {
      const post = new PIXI.Graphics();
      post.roundRect(3, 14 + i * 8, 34, 6, 1);
      post.fill({ color: 0x334155 }); // Slate
      container.addChild(post);
    }
    
    // Center pivot
    container.pivot.set(20, 15);
    container.alpha = 0;
    
    return container;
  }
  
  /**
   * Create graphs visual (trend scraping)
   * @returns {PIXI.Container} Graphs container
   * @private
   */
  createGraphsVisual() {
    // Try to reuse from pool
    if (this.graphsPool.length > 0) {
      const visual = this.graphsPool.pop();
      visual.alpha = 0;
      return visual;
    }
    
    const container = new PIXI.Container();
    container.label = 'graphs';
    
    // Screen background
    const screen = new PIXI.Graphics();
    screen.roundRect(0, 0, 40, 30, 2);
    screen.fill({ color: 0x1E293B }); // Dark slate
    container.addChild(screen);
    
    // Bar chart
    const barHeights = [8, 12, 6, 15, 10];
    for (let i = 0; i < 5; i++) {
      const bar = new PIXI.Graphics();
      bar.rect(4 + i * 7, 22 - barHeights[i], 5, barHeights[i]);
      bar.fill({ color: 0x10B981 }); // Green
      bar.label = `bar_${i}`;
      container.addChild(bar);
    }
    
    // Line graph
    const line = new PIXI.Graphics();
    line.moveTo(3, 10);
    line.lineTo(10, 8);
    line.lineTo(17, 12);
    line.lineTo(24, 7);
    line.lineTo(31, 9);
    line.lineTo(37, 6);
    line.stroke({ width: 1, color: 0x60A5FA }); // Blue
    container.addChild(line);
    
    // Data points
    const points = [
      { x: 3, y: 10 },
      { x: 10, y: 8 },
      { x: 17, y: 12 },
      { x: 24, y: 7 },
      { x: 31, y: 9 },
      { x: 37, y: 6 }
    ];
    points.forEach((point, i) => {
      const dot = new PIXI.Graphics();
      dot.circle(point.x, point.y, 1.5);
      dot.fill({ color: 0x60A5FA });
      dot.label = `point_${i}`;
      container.addChild(dot);
    });
    
    // Center pivot
    container.pivot.set(20, 15);
    container.alpha = 0;
    
    // Animate bars growing
    this.animateBarsGrowing(container);
    
    return container;
  }
  
  /**
   * Create chat interface visual (chat handling)
   * @returns {PIXI.Container} Chat interface container
   * @private
   */
  createChatInterfaceVisual() {
    // Try to reuse from pool
    if (this.chatInterfacePool.length > 0) {
      const visual = this.chatInterfacePool.pop();
      visual.alpha = 0;
      return visual;
    }
    
    const container = new PIXI.Container();
    container.label = 'chat_interface';
    
    // Screen background
    const screen = new PIXI.Graphics();
    screen.roundRect(0, 0, 40, 30, 2);
    screen.fill({ color: 0x1E293B }); // Dark slate
    container.addChild(screen);
    
    // Chat bubbles (user messages)
    const userBubble1 = new PIXI.Graphics();
    userBubble1.roundRect(15, 5, 20, 5, 2);
    userBubble1.fill({ color: 0x3B82F6 }); // Blue
    container.addChild(userBubble1);
    
    const userBubble2 = new PIXI.Graphics();
    userBubble2.roundRect(10, 12, 25, 5, 2);
    userBubble2.fill({ color: 0x3B82F6 });
    container.addChild(userBubble2);
    
    // AI response bubble (being typed)
    const aiBubble = new PIXI.Graphics();
    aiBubble.roundRect(5, 20, 30, 6, 2);
    aiBubble.fill({ color: 0x10B981 }); // Green
    aiBubble.label = 'ai_bubble';
    container.addChild(aiBubble);
    
    // Typing indicator dots
    for (let i = 0; i < 3; i++) {
      const dot = new PIXI.Graphics();
      dot.circle(12 + i * 4, 23, 1);
      dot.fill({ color: 0xFFFFFF });
      dot.label = `dot_${i}`;
      container.addChild(dot);
    }
    
    // Center pivot
    container.pivot.set(20, 15);
    container.alpha = 0;
    
    // Animate typing dots
    this.animateTypingDots(container);
    
    return container;
  }
  
  /**
   * Create generic screen visual (fallback)
   * @returns {PIXI.Container} Generic screen container
   * @private
   */
  createGenericScreenVisual() {
    const container = new PIXI.Container();
    container.label = 'generic_screen';
    
    // Screen background
    const screen = new PIXI.Graphics();
    screen.roundRect(0, 0, 40, 30, 2);
    screen.fill({ color: 0x1E293B }); // Dark slate
    container.addChild(screen);
    
    // Generic content (grid pattern)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = new PIXI.Graphics();
        cell.rect(3 + col * 9, 5 + row * 8, 7, 6);
        cell.fill({ color: 0x334155 });
        container.addChild(cell);
      }
    }
    
    // Center pivot
    container.pivot.set(20, 15);
    container.alpha = 0;
    
    return container;
  }
  
  /**
   * Animate cursor blinking
   * @param {PIXI.Graphics} cursor - Cursor graphics
   * @private
   */
  animateCursorBlink(cursor) {
    const startTime = Date.now();
    
    const animate = () => {
      if (!cursor.parent) return; // Stop if removed
      
      const elapsed = Date.now() - startTime;
      const cycle = (elapsed % 1000) / 1000; // 1 second cycle
      
      // Blink on/off
      cursor.alpha = cycle < 0.5 ? 1 : 0;
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * Animate bars growing
   * @param {PIXI.Container} container - Graphs container
   * @private
   */
  animateBarsGrowing(container) {
    const bars = [];
    for (let i = 0; i < 5; i++) {
      const bar = container.getChildByLabel(`bar_${i}`);
      if (bar) {
        bar.originalHeight = bar.height;
        bar.height = 0;
        bars.push(bar);
      }
    }
    
    const startTime = Date.now();
    const duration = 1000;
    
    const animate = () => {
      if (!container.parent) return; // Stop if removed
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      bars.forEach(bar => {
        bar.height = bar.originalHeight * eased;
        bar.y = 22 - bar.height;
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Animate typing dots
   * @param {PIXI.Container} container - Chat interface container
   * @private
   */
  animateTypingDots(container) {
    const dots = [];
    for (let i = 0; i < 3; i++) {
      const dot = container.getChildByLabel(`dot_${i}`);
      if (dot) {
        dots.push(dot);
      }
    }
    
    const startTime = Date.now();
    
    const animate = () => {
      if (!container.parent) return; // Stop if removed
      
      const elapsed = Date.now() - startTime;
      
      dots.forEach((dot, i) => {
        const offset = i * 200; // Stagger animation
        const cycle = ((elapsed + offset) % 1200) / 1200;
        
        // Bounce up and down
        const bounce = Math.sin(cycle * Math.PI * 2) * 2;
        dot.y = 23 + bounce;
        
        // Fade in/out
        dot.alpha = 0.3 + Math.sin(cycle * Math.PI * 2) * 0.7;
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * Animate screen in (fade + scale)
   * @param {PIXI.Container} screen - Screen container
   * @private
   */
  animateScreenIn(screen) {
    const startTime = Date.now();
    const duration = 300;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 2);
      
      screen.alpha = progress;
      screen.scale.set(0.8 + eased * 0.2);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Animate screen out (fade + scale)
   * @param {PIXI.Container} screen - Screen container
   * @param {Function} onComplete - Callback when animation completes
   * @private
   */
  animateScreenOut(screen, onComplete) {
    const startTime = Date.now();
    const duration = 200;
    const startAlpha = screen.alpha;
    const startScale = screen.scale.x;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      screen.alpha = startAlpha * (1 - progress);
      screen.scale.set(startScale * (1 - progress * 0.2));
      
      if (progress >= 1) {
        onComplete();
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
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
   * Return visual to appropriate pool
   * @param {PIXI.Container} visual - Visual to return
   * @private
   */
  returnToPool(visual) {
    // Reset visual state
    visual.alpha = 0;
    visual.scale.set(1);
    
    // Determine pool based on label
    let pool;
    switch (visual.label) {
      case 'text_editor':
        pool = this.textEditorPool;
        break;
      case 'dashboard':
        pool = this.dashboardPool;
        break;
      case 'graphs':
        pool = this.graphsPool;
        break;
      case 'chat_interface':
        pool = this.chatInterfacePool;
        break;
      default:
        visual.destroy();
        return;
    }
    
    // Add to pool if not full
    if (pool.length < 10) {
      pool.push(visual);
    } else {
      visual.destroy();
    }
  }
  
  /**
   * Update all active screen visuals
   * Called every frame by TaskWorkflowVisuals
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    // Screen visuals are mostly self-animating
    // No position updates needed as they're attached to workstations
  }
  
  /**
   * Clear all active screen visuals
   */
  clearAll() {
    for (const [taskId, screenVisual] of this.activeScreens.entries()) {
      this.scene.removeFromLayer('effects', screenVisual);
      screenVisual.destroy();
    }
    
    this.activeScreens.clear();
  }
}

export default TaskScreenVisuals;
