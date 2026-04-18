/**
 * ParticleSystem Class - Handles particle effects for visual feedback
 * 
 * Implements:
 * - Particle emitter with physics (gravity, velocity)
 * - Particle pooling for performance (pool size: 100)
 * - Particle rendering with alpha blending
 * - Multiple particle effect types (confetti, sparkles, smoke, stars)
 * 
 * Requirements: 8.1, 8.2, 8.3, 9.1, 9.2
 * Phase 8, Task 45
 * Phase 9, Task 52 (Refactored to use ObjectPool)
 */

import * as PIXI from 'pixi.js';
import ObjectPool from '../utils/ObjectPool.js';

/**
 * Particle class - Represents a single particle
 */
class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.color = 0xFFFFFF;
    this.size = 4;
    this.gravity = 0;
    this.sprite = null;
  }
  
  /**
   * Initialize particle with properties
   */
  init(x, y, vx, vy, life, color, size, gravity) {
    this.active = true;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.gravity = gravity;
  }
  
  /**
   * Update particle physics
   */
  update(deltaTime) {
    if (!this.active) return;
    
    // Apply velocity
    const dt = deltaTime / 1000; // Convert to seconds
    this.x += this.vx * dt * 60; // Scale to 60 FPS baseline
    this.y += this.vy * dt * 60;
    
    // Apply gravity
    this.vy += this.gravity * dt * 60;
    
    // Decrease life
    this.life -= deltaTime;
    
    // Deactivate if life expired
    if (this.life <= 0) {
      this.active = false;
    }
    
    // Update sprite if exists
    if (this.sprite) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      
      // Alpha fade based on remaining life
      const alpha = Math.max(0, Math.min(1, this.life / this.maxLife));
      this.sprite.alpha = alpha;
      
      // Scale fade for some effects
      const scale = 0.5 + (alpha * 0.5);
      this.sprite.scale.set(scale);
    }
  }
  
  /**
   * Reset particle to inactive state
   */
  reset() {
    this.active = false;
    if (this.sprite) {
      this.sprite.visible = false;
    }
  }
}

/**
 * ParticleSystem - Manages particle effects
 */
class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    
    // Create particle pool using ObjectPool
    this.particlePool = new ObjectPool(
      () => new Particle(), // Factory function
      (particle) => particle.reset(), // Reset function
      100, // Initial size
      100  // Max size
    );
    
    // Active emitters
    this.emitters = [];
    
    // Particle container for rendering
    this.container = new PIXI.Container();
    this.scene.addToLayer('effects', this.container);
    
    // Particle graphics cache
    this.particleGraphics = new Map();
    
    // Enabled state (for accessibility)
    this.enabled = true;
    
    // Create default particle textures
    this.createParticleTextures();
  }
  
  /**
   * Create particle textures for different types
   */
  createParticleTextures() {
    // Create a simple circle texture for particles
    const graphics = new PIXI.Graphics();
    graphics.circle(4, 4, 4);
    graphics.fill({ color: 0xFFFFFF });
    
    const texture = this.scene.app.renderer.generateTexture(graphics);
    this.particleGraphics.set('circle', texture);
    
    // Create a square texture
    graphics.clear();
    graphics.rect(0, 0, 8, 8);
    graphics.fill({ color: 0xFFFFFF });
    
    const squareTexture = this.scene.app.renderer.generateTexture(graphics);
    this.particleGraphics.set('square', squareTexture);
    
    // Create a star texture
    graphics.clear();
    graphics.moveTo(4, 0);
    graphics.lineTo(5, 3);
    graphics.lineTo(8, 3);
    graphics.lineTo(6, 5);
    graphics.lineTo(7, 8);
    graphics.lineTo(4, 6);
    graphics.lineTo(1, 8);
    graphics.lineTo(2, 5);
    graphics.lineTo(0, 3);
    graphics.lineTo(3, 3);
    graphics.closePath();
    graphics.fill({ color: 0xFFFFFF });
    
    const starTexture = this.scene.app.renderer.generateTexture(graphics);
    this.particleGraphics.set('star', starTexture);
  }
  
  /**
   * Get an inactive particle from the pool
   */
  getParticle() {
    return this.particlePool.acquire();
  }
  
  /**
   * Release a particle back to the pool
   */
  releaseParticle(particle) {
    if (particle) {
      this.particlePool.release(particle);
    }
  }
  
  /**
   * Emit particles with specified configuration
   */
  emit(config) {
    const {
      x = 0,
      y = 0,
      count = 10,
      colors = [0x4F46E5, 0x10B981, 0xF59E0B],
      life = 2000,
      gravity = 0.5,
      spread = 45,
      speed = 2,
      size = 4,
      shape = 'circle'
    } = config;
    
    const emittedParticles = [];
    
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      
      if (!particle) {
        console.warn('Particle pool exhausted');
        break;
      }
      
      // Random angle within spread
      const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
      const baseAngle = -Math.PI / 2; // Up direction
      const finalAngle = baseAngle + angle;
      
      // Random speed variation
      const particleSpeed = speed * (0.5 + Math.random() * 0.5);
      
      // Calculate velocity
      const vx = Math.cos(finalAngle) * particleSpeed * 50;
      const vy = Math.sin(finalAngle) * particleSpeed * 50;
      
      // Random color from palette
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Random life variation
      const particleLife = life * (0.8 + Math.random() * 0.4);
      
      // Initialize particle
      particle.init(x, y, vx, vy, particleLife, color, size, gravity);
      
      // Create or reuse sprite
      if (!particle.sprite) {
        const texture = this.particleGraphics.get(shape) || this.particleGraphics.get('circle');
        particle.sprite = new PIXI.Sprite(texture);
        particle.sprite.anchor.set(0.5);
        this.container.addChild(particle.sprite);
      }
      
      // Update sprite
      particle.sprite.visible = true;
      particle.sprite.tint = color;
      particle.sprite.x = x;
      particle.sprite.y = y;
      particle.sprite.alpha = 1;
      particle.sprite.scale.set(1);
      
      emittedParticles.push(particle);
    }
    
    return emittedParticles;
  }
  
  /**
   * Emit confetti particles (task completion)
   */
  emitConfetti(x, y) {
    return this.emit({
      x,
      y,
      count: 20,
      colors: [0x4F46E5, 0x10B981, 0xF59E0B],
      life: 2000,
      gravity: 0.5,
      spread: 45,
      speed: 3,
      size: 4,
      shape: 'square'
    });
  }
  
  /**
   * Emit sparkles particles (milestone)
   */
  emitSparkles(x, y) {
    return this.emit({
      x,
      y,
      count: 30,
      colors: [0xFBBF24, 0xF59E0B],
      life: 3000,
      gravity: 0,
      spread: 360,
      speed: 2,
      size: 3,
      shape: 'star'
    });
  }
  
  /**
   * Emit smoke particles (error)
   */
  emitSmoke(x, y) {
    return this.emit({
      x,
      y,
      count: 10,
      colors: [0xEF4444, 0xDC2626],
      life: 1500,
      gravity: -0.2,
      spread: 30,
      speed: 1.5,
      size: 6,
      shape: 'circle'
    });
  }
  
  /**
   * Emit stars particles (post published)
   */
  emitStars(x, y) {
    return this.emit({
      x,
      y,
      count: 15,
      colors: [0x8B5CF6, 0xA78BFA],
      life: 2000,
      gravity: 0.3,
      spread: 60,
      speed: 2.5,
      size: 4,
      shape: 'star'
    });
  }
  
  /**
   * Create a continuous emitter
   */
  createEmitter(config) {
    const emitter = {
      x: config.x || 0,
      y: config.y || 0,
      rate: config.rate || 10, // particles per second
      config: config,
      active: true,
      elapsed: 0,
      duration: config.duration || Infinity
    };
    
    this.emitters.push(emitter);
    return emitter;
  }
  
  /**
   * Stop an emitter
   */
  stopEmitter(emitter) {
    emitter.active = false;
    const index = this.emitters.indexOf(emitter);
    if (index !== -1) {
      this.emitters.splice(index, 1);
    }
  }
  
  /**
   * Update all particles and emitters
   */
  update(deltaTime) {
    // Update all active particles from the pool
    const particles = Array.from(this.particlePool.inUse);
    
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].active) {
        particles[i].update(deltaTime);
        
        // Release particle back to pool if no longer active
        if (!particles[i].active) {
          this.releaseParticle(particles[i]);
        }
      }
    }
    
    // Update emitters
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i];
      
      if (!emitter.active) {
        this.emitters.splice(i, 1);
        continue;
      }
      
      emitter.elapsed += deltaTime;
      
      // Check if emitter duration expired
      if (emitter.elapsed >= emitter.duration) {
        this.emitters.splice(i, 1);
        continue;
      }
      
      // Emit particles based on rate
      const particlesToEmit = Math.floor((emitter.rate * deltaTime) / 1000);
      
      for (let j = 0; j < particlesToEmit; j++) {
        this.emit({
          ...emitter.config,
          x: emitter.x,
          y: emitter.y
        });
      }
    }
  }
  
  /**
   * Get count of active particles
   */
  getActiveParticleCount() {
    return this.particlePool.inUseCount();
  }
  
  /**
   * Get particle pool statistics
   */
  getPoolStats() {
    return this.particlePool.getStats();
  }
  
  /**
   * Clear all particles
   */
  clear() {
    // Release all particles back to pool
    this.particlePool.releaseAll();
    
    // Clear all emitters
    this.emitters = [];
  }
  
  /**
   * Destroy particle system and cleanup resources
   */
  destroy() {
    this.clear();
    
    // Destroy all particle sprites from the pool
    const allParticles = [
      ...Array.from(this.particlePool.inUse),
      ...this.particlePool.available
    ];
    
    for (let i = 0; i < allParticles.length; i++) {
      if (allParticles[i].sprite) {
        allParticles[i].sprite.destroy();
        allParticles[i].sprite = null;
      }
    }
    
    // Clear the pool
    this.particlePool.clear();
    
    // Destroy particle textures
    for (const [, texture] of this.particleGraphics.entries()) {
      texture.destroy(true);
    }
    this.particleGraphics.clear();
    
    // Destroy container
    this.container.destroy({ children: true });
  }
  
  /**
   * Enable or disable particle effects (for accessibility)
   * @param {boolean} enabled - Whether to enable particles
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    // If disabling, clear all active particles
    if (!enabled) {
      this.clear();
    }
  }
  
  /**
   * Check if particle system is enabled
   * @returns {boolean} True if enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

export default ParticleSystem;
