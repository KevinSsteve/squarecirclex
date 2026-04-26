/**
 * PerformanceMonitor System
 * 
 * Tracks performance metrics and automatically adjusts quality settings
 * to maintain target FPS.
 * 
 * Features:
 * - FPS tracking with moving average
 * - Entity count monitoring
 * - Draw call tracking (via PixiJS renderer stats)
 * - Memory usage estimation
 * - Auto-quality adjustment based on FPS thresholds
 * - Debug overlay display
 * 
 * Phase 9, Task 56
 * Requirements: 9.1, 9.6, 15.1
 */

class PerformanceMonitor {
  constructor(scene, app) {
    this.scene = scene;
    this.app = app;
    
    // Performance metrics
    this.metrics = {
      fps: 60,
      fpsHistory: [],
      fpsHistorySize: 60, // Track last 60 frames (1 second at 60fps)
      entityCount: 0,
      drawCalls: 0,
      memoryUsage: 0,
      updateTime: 0,
      renderTime: 0
    };
    
    // Performance thresholds
    this.thresholds = {
      fps: {
        target: 60,
        warning: 45,
        critical: 30
      },
      entityCount: {
        warning: 50,
        critical: 100
      },
      memoryUsage: {
        warning: 500, // MB
        critical: 800  // MB
      },
      updateTime: {
        target: 16,   // ms (60fps = 16.67ms per frame)
        warning: 20,  // ms
        critical: 30  // ms
      }
    };
    
    // Auto-quality adjustment
    this.autoQuality = {
      enabled: true,
      checkInterval: 5000, // Check every 5 seconds
      lastCheckTime: 0,
      currentQualityLevel: 'high', // 'high', 'medium', 'low', 'performance'
      adjustmentHistory: []
    };
    
    // Quality settings for each level
    this.qualityLevels = {
      high: {
        particles: true,
        particleMultiplier: 1.0,
        shadows: true,
        animations: true,
        animationSpeed: 1.0,
        effects: true
      },
      medium: {
        particles: true,
        particleMultiplier: 0.5,
        shadows: false,
        animations: true,
        animationSpeed: 0.8,
        effects: true
      },
      low: {
        particles: true,
        particleMultiplier: 0.2,
        shadows: false,
        animations: true,
        animationSpeed: 0.6,
        effects: false
      },
      performance: {
        particles: false,
        particleMultiplier: 0,
        shadows: false,
        animations: false,
        animationSpeed: 0,
        effects: false
      }
    };
    
    // Timing for performance measurement
    this.timing = {
      lastFrameTime: performance.now(),
      updateStartTime: 0,
      renderStartTime: 0
    };
    
    // Debug overlay state
    this.debugOverlay = {
      enabled: false,
      container: null
    };
    
    // Initialize
    this.setupDebugOverlay();
    this.setupKeyboardShortcuts();
  }
  
  /**
   * Setup debug overlay UI
   */
  setupDebugOverlay() {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'performance-debug-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      z-index: 10000;
      display: none;
      min-width: 250px;
    `;
    
    document.body.appendChild(overlay);
    this.debugOverlay.container = overlay;
  }
  
  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (event) => {
      // Toggle debug overlay with 'D' key
      if (event.key === 'd' || event.key === 'D') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          this.toggleDebugOverlay();
        }
      }
      
      // Toggle auto-quality with 'Q' key
      if (event.key === 'q' || event.key === 'Q') {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          this.toggleAutoQuality();
        }
      }
      
      // Manual quality level adjustment with 1-4 keys
      if (event.key >= '1' && event.key <= '4') {
        if (event.ctrlKey || event.metaKey) {
          const levels = ['high', 'medium', 'low', 'performance'];
          const level = levels[parseInt(event.key) - 1];
          this.setQualityLevel(level, true); // true = manual override
        }
      }
    });
  }
  
  /**
   * Toggle debug overlay visibility
   */
  toggleDebugOverlay() {
    this.debugOverlay.enabled = !this.debugOverlay.enabled;
    
    if (this.debugOverlay.container) {
      this.debugOverlay.container.style.display = 
        this.debugOverlay.enabled ? 'block' : 'none';
    }
    
    console.log(`Performance debug overlay: ${this.debugOverlay.enabled ? 'ON' : 'OFF'}`);
  }
  
  /**
   * Toggle auto-quality adjustment
   */
  toggleAutoQuality() {
    this.autoQuality.enabled = !this.autoQuality.enabled;
    console.log(`Auto-quality adjustment: ${this.autoQuality.enabled ? 'ON' : 'OFF'}`);
  }
  
  /**
   * Start measuring update time
   */
  startUpdateMeasurement() {
    this.timing.updateStartTime = performance.now();
  }
  
  /**
   * End measuring update time
   */
  endUpdateMeasurement() {
    if (this.timing.updateStartTime > 0) {
      this.metrics.updateTime = performance.now() - this.timing.updateStartTime;
      this.timing.updateStartTime = 0;
    }
  }
  
  /**
   * Start measuring render time
   */
  startRenderMeasurement() {
    this.timing.renderStartTime = performance.now();
  }
  
  /**
   * End measuring render time
   */
  endRenderMeasurement() {
    if (this.timing.renderStartTime > 0) {
      this.metrics.renderTime = performance.now() - this.timing.renderStartTime;
      this.timing.renderStartTime = 0;
    }
  }
  
  /**
   * Update performance metrics
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    // Calculate FPS
    const currentTime = performance.now();
    const frameTime = currentTime - this.timing.lastFrameTime;
    this.timing.lastFrameTime = currentTime;
    
    const currentFPS = frameTime > 0 ? 1000 / frameTime : 60;
    
    // Add to FPS history
    this.metrics.fpsHistory.push(currentFPS);
    if (this.metrics.fpsHistory.length > this.metrics.fpsHistorySize) {
      this.metrics.fpsHistory.shift();
    }
    
    // Calculate average FPS
    const sum = this.metrics.fpsHistory.reduce((a, b) => a + b, 0);
    this.metrics.fps = Math.round(sum / this.metrics.fpsHistory.length);
    
    // Update entity count
    this.metrics.entityCount = this.scene.entityRegistry.getAllEntities().length;
    
    // Update draw calls (from PixiJS renderer)
    if (this.app.renderer && this.app.renderer.gl) {
      // PixiJS doesn't expose draw calls directly, estimate from batch count
      this.metrics.drawCalls = this.estimateDrawCalls();
    }
    
    // Update memory usage (estimate)
    this.metrics.memoryUsage = this.estimateMemoryUsage();
    
    // Check for auto-quality adjustment
    if (this.autoQuality.enabled) {
      const timeSinceLastCheck = currentTime - this.autoQuality.lastCheckTime;
      
      if (timeSinceLastCheck >= this.autoQuality.checkInterval) {
        this.checkAndAdjustQuality();
        this.autoQuality.lastCheckTime = currentTime;
      }
    }
    
    // Update debug overlay
    if (this.debugOverlay.enabled) {
      this.updateDebugOverlay();
    }
  }
  
  /**
   * Estimate draw calls based on visible entities
   * @returns {number} Estimated draw calls
   */
  estimateDrawCalls() {
    // Rough estimate: each visible entity = 1 draw call
    // Batching can reduce this significantly
    const cullingSystem = this.scene.getCullingSystem();
    const visibleCount = cullingSystem ? cullingSystem.getVisibleCount() : this.metrics.entityCount;
    
    // Account for sprite batching (assume 50% reduction with batching)
    const batchOptimizer = this.scene.getSpriteBatchOptimizer();
    const batchingEnabled = batchOptimizer !== null;
    
    return batchingEnabled ? Math.ceil(visibleCount * 0.5) : visibleCount;
  }
  
  /**
   * Estimate memory usage in MB
   * @returns {number} Estimated memory usage in MB
   */
  estimateMemoryUsage() {
    // Use Performance API if available
    if (performance.memory) {
      return Math.round(performance.memory.usedJSHeapSize / 1048576); // Convert to MB
    }
    
    // Fallback: rough estimate based on entity count
    // Assume ~50KB per entity (sprite, components, etc.)
    const entityMemory = this.metrics.entityCount * 0.05; // MB
    const baseMemory = 50; // Base app memory
    
    return Math.round(baseMemory + entityMemory);
  }
  
  /**
   * Check performance and adjust quality if needed
   */
  checkAndAdjustQuality() {
    const avgFPS = this.metrics.fps;
    const currentLevel = this.autoQuality.currentQualityLevel;
    
    // Determine if adjustment is needed
    let targetLevel = currentLevel;
    
    if (avgFPS < this.thresholds.fps.critical) {
      // Critical FPS drop - switch to performance mode
      targetLevel = 'performance';
    } else if (avgFPS < this.thresholds.fps.warning) {
      // Warning FPS - reduce quality
      if (currentLevel === 'high') {
        targetLevel = 'medium';
      } else if (currentLevel === 'medium') {
        targetLevel = 'low';
      } else if (currentLevel === 'low') {
        targetLevel = 'performance';
      }
    } else if (avgFPS > this.thresholds.fps.target - 5) {
      // Good FPS - can increase quality
      if (currentLevel === 'performance') {
        targetLevel = 'low';
      } else if (currentLevel === 'low') {
        targetLevel = 'medium';
      } else if (currentLevel === 'medium') {
        targetLevel = 'high';
      }
    }
    
    // Apply adjustment if level changed
    if (targetLevel !== currentLevel) {
      this.setQualityLevel(targetLevel, false); // false = auto adjustment
    }
  }
  
  /**
   * Set quality level
   * @param {string} level - Quality level ('high', 'medium', 'low', 'performance')
   * @param {boolean} manual - Whether this is a manual override
   */
  setQualityLevel(level, manual = false) {
    if (!this.qualityLevels[level]) {
      console.warn(`Invalid quality level: ${level}`);
      return;
    }
    
    const previousLevel = this.autoQuality.currentQualityLevel;
    this.autoQuality.currentQualityLevel = level;
    
    const settings = this.qualityLevels[level];
    
    // Apply settings to systems
    this.applyQualitySettings(settings);
    
    // Record adjustment
    this.autoQuality.adjustmentHistory.push({
      timestamp: Date.now(),
      from: previousLevel,
      to: level,
      manual: manual,
      fps: this.metrics.fps
    });
    
    // Keep only last 10 adjustments
    if (this.autoQuality.adjustmentHistory.length > 10) {
      this.autoQuality.adjustmentHistory.shift();
    }
    
    // Emit event
    window.dispatchEvent(new CustomEvent('game:qualityChanged', {
      detail: { level, manual, previousLevel }
    }));
    
    console.log(`Quality level ${manual ? 'manually' : 'automatically'} changed: ${previousLevel} → ${level}`);
  }
  
  /**
   * Apply quality settings to game systems
   * @param {object} settings - Quality settings
   */
  applyQualitySettings(settings) {
    // Apply to particle system
    const particleSystem = this.scene.getParticleSystem();
    if (particleSystem) {
      particleSystem.setEnabled(settings.particles);
      // Only call setCountMultiplier if it exists
      if (typeof particleSystem.setCountMultiplier === 'function') {
        particleSystem.setCountMultiplier(settings.particleMultiplier);
      }
    }
    
    // Apply to LOD system
    const lodSystem = this.scene.getLODSystem();
    if (lodSystem && typeof lodSystem.setForcedLOD === 'function') {
      if (!settings.animations) {
        // Force low LOD if animations disabled
        lodSystem.setForcedLOD('low');
      } else {
        // Let LOD system auto-detect
        lodSystem.setForcedLOD(null);
      }
    }
    
    // Apply to animation system
    const animationSystem = this.scene.getAnimationSystem();
    if (animationSystem) {
      if (!settings.animations) {
        animationSystem.pauseAll();
      } else {
        animationSystem.resumeAll();
        // Adjust animation speed if needed
        // (would need to add this method to AnimationSystem)
      }
    }
    
    // Apply to task workflow visuals
    const taskWorkflowVisuals = this.scene.taskWorkflowVisuals;
    if (taskWorkflowVisuals) {
      // Disable effects if needed
      // (would need to add this capability to TaskWorkflowVisuals)
    }
  }
  
  /**
   * Update debug overlay display
   */
  updateDebugOverlay() {
    if (!this.debugOverlay.container) return;
    
    const { fps, entityCount, drawCalls, memoryUsage, updateTime, renderTime } = this.metrics;
    const { currentQualityLevel } = this.autoQuality;
    
    // Color code FPS
    let fpsColor = '#00ff00'; // Green
    if (fps < this.thresholds.fps.critical) {
      fpsColor = '#ff0000'; // Red
    } else if (fps < this.thresholds.fps.warning) {
      fpsColor = '#ffaa00'; // Orange
    }
    
    // Color code entity count
    let entityColor = '#00ff00';
    if (entityCount > this.thresholds.entityCount.critical) {
      entityColor = '#ff0000';
    } else if (entityCount > this.thresholds.entityCount.warning) {
      entityColor = '#ffaa00';
    }
    
    // Color code memory
    let memoryColor = '#00ff00';
    if (memoryUsage > this.thresholds.memoryUsage.critical) {
      memoryColor = '#ff0000';
    } else if (memoryUsage > this.thresholds.memoryUsage.warning) {
      memoryColor = '#ffaa00';
    }
    
    // Build overlay HTML
    const html = `
      <div style="margin-bottom: 8px; font-weight: bold; color: #ffffff;">
        PERFORMANCE MONITOR
      </div>
      <div style="margin-bottom: 4px;">
        FPS: <span style="color: ${fpsColor};">${fps}</span> / ${this.thresholds.fps.target}
      </div>
      <div style="margin-bottom: 4px;">
        Entities: <span style="color: ${entityColor};">${entityCount}</span>
      </div>
      <div style="margin-bottom: 4px;">
        Draw Calls: ${drawCalls}
      </div>
      <div style="margin-bottom: 4px;">
        Memory: <span style="color: ${memoryColor};">${memoryUsage} MB</span>
      </div>
      <div style="margin-bottom: 4px;">
        Update: ${updateTime.toFixed(2)} ms
      </div>
      <div style="margin-bottom: 4px;">
        Render: ${renderTime.toFixed(2)} ms
      </div>
      <div style="margin-bottom: 8px;">
        Quality: <span style="color: #00aaff;">${currentQualityLevel.toUpperCase()}</span>
      </div>
      <div style="font-size: 10px; color: #888888; border-top: 1px solid #444; padding-top: 4px;">
        D: Toggle overlay | Q: Toggle auto-quality<br/>
        Ctrl+1-4: Set quality level
      </div>
    `;
    
    this.debugOverlay.container.innerHTML = html;
  }
  
  /**
   * Get current performance metrics
   * @returns {object} Performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Get current quality level
   * @returns {string} Quality level
   */
  getQualityLevel() {
    return this.autoQuality.currentQualityLevel;
  }
  
  /**
   * Get quality adjustment history
   * @returns {Array} Adjustment history
   */
  getAdjustmentHistory() {
    return [...this.autoQuality.adjustmentHistory];
  }
  
  /**
   * Check if performance is within acceptable range
   * @returns {boolean} True if performance is acceptable
   */
  isPerformanceAcceptable() {
    return this.metrics.fps >= this.thresholds.fps.warning;
  }
  
  /**
   * Get performance status
   * @returns {string} Status ('good', 'warning', 'critical')
   */
  getPerformanceStatus() {
    const { fps } = this.metrics;
    
    if (fps >= this.thresholds.fps.warning) {
      return 'good';
    } else if (fps >= this.thresholds.fps.critical) {
      return 'warning';
    } else {
      return 'critical';
    }
  }
  
  /**
   * Destroy the performance monitor
   */
  destroy() {
    // Remove debug overlay
    if (this.debugOverlay.container) {
      this.debugOverlay.container.remove();
      this.debugOverlay.container = null;
    }
    
    // Clear metrics
    this.metrics.fpsHistory = [];
    this.autoQuality.adjustmentHistory = [];
  }
}

export default PerformanceMonitor;
