/**
 * HighlightEffect - Utility for applying visual highlight effects to sprites
 * 
 * Provides hover and selection highlight effects using PixiJS filters.
 * Supports smooth fade in/out transitions and multiple effect types.
 * 
 * Requirements: REQ-4.2 (Highlight Effects)
 * Phase 4, Task 4.2
 */

import * as PIXI from 'pixi.js';

/**
 * HighlightEffect class - Manages visual highlight effects
 */
class HighlightEffect {
  /**
   * Effect types
   */
  static EFFECT_TYPES = {
    HOVER: 'hover',
    SELECTION: 'selection',
    NONE: 'none'
  };

  /**
   * Effect configurations
   */
  static EFFECT_CONFIGS = {
    hover: {
      glowDistance: 10,
      glowStrength: 2,
      glowColor: 0xFFFFFF,
      glowQuality: 0.5,
      tintAmount: 0.2,
      fadeDuration: 150
    },
    selection: {
      glowDistance: 15,
      glowStrength: 3,
      glowColor: 0x4F46E5, // Indigo-600
      glowQuality: 0.5,
      tintAmount: 0.4,
      fadeDuration: 200
    }
  };

  /**
   * Apply hover effect to sprite
   * @param {PIXI.Sprite} sprite - Sprite to apply effect to
   * @param {Object} options - Effect options (optional)
   * @returns {Object} Effect state for cleanup
   */
  static applyHoverEffect(sprite, options = {}) {
    if (!sprite || !sprite.parent) {
      return null;
    }

    const config = { ...this.EFFECT_CONFIGS.hover, ...options };
    
    // Store original state if not already stored
    if (!sprite.userData) {
      sprite.userData = {};
    }
    if (sprite.userData.originalTint === undefined) {
      sprite.userData.originalTint = sprite.tint;
    }
    if (sprite.userData.originalAlpha === undefined) {
      sprite.userData.originalAlpha = sprite.alpha;
    }

    // PixiJS v8: GlowFilter is not built-in, use ColorMatrixFilter for glow effect
    // Create a simple glow effect using alpha and tint instead
    // For a proper glow, you would need to install @pixi/filter-glow package
    
    // Apply tint (lighten) for hover effect
    sprite.tint = this.lightenColor(sprite.userData.originalTint, config.tintAmount);
    
    // Slightly increase alpha for emphasis
    sprite.alpha = Math.min(1.0, sprite.userData.originalAlpha * 1.1);

    // Store effect state
    const effectState = {
      type: this.EFFECT_TYPES.HOVER,
      filter: glowFilter,
      config: config,
      startTime: Date.now()
    };

    sprite.userData.currentEffect = effectState;

    // Fade in animation
    this.fadeInEffect(sprite, glowFilter, config.fadeDuration);

    return effectState;
  }

  /**
   * Apply selection effect to sprite
   * @param {PIXI.Sprite} sprite - Sprite to apply effect to
   * @param {Object} options - Effect options (optional)
   * @returns {Object} Effect state for cleanup
   */
  static applySelectionEffect(sprite, options = {}) {
    if (!sprite || !sprite.parent) {
      return null;
    }

    const config = { ...this.EFFECT_CONFIGS.selection, ...options };
    
    // Store original state if not already stored
    if (!sprite.userData) {
      sprite.userData = {};
    }
    if (sprite.userData.originalTint === undefined) {
      sprite.userData.originalTint = sprite.tint;
    }
    if (sprite.userData.originalAlpha === undefined) {
      sprite.userData.originalAlpha = sprite.alpha;
    }

    // Create glow filter
    const glowFilter = new PIXI.GlowFilter({
      distance: config.glowDistance,
      outerStrength: config.glowStrength,
      color: config.glowColor,
      quality: config.glowQuality
    });

    // Apply filter
    if (!sprite.filters) {
      sprite.filters = [];
    }
    sprite.filters = [...sprite.filters, glowFilter];

    // Apply tint (lighten more than hover)
    sprite.tint = this.lightenColor(sprite.userData.originalTint, config.tintAmount);

    // Store effect state
    const effectState = {
      type: this.EFFECT_TYPES.SELECTION,
      filter: glowFilter,
      config: config,
      startTime: Date.now()
    };

    sprite.userData.currentEffect = effectState;

    // Fade in animation
    this.fadeInEffect(sprite, glowFilter, config.fadeDuration);

    return effectState;
  }

  /**
   * Clear all effects from sprite
   * @param {PIXI.Sprite} sprite - Sprite to clear effects from
   * @param {boolean} animated - Whether to fade out (default: true)
   * @returns {Promise} Resolves when fade out completes
   */
  static clearEffects(sprite, animated = true) {
    if (!sprite || !sprite.userData?.currentEffect) {
      return Promise.resolve();
    }

    const effectState = sprite.userData.currentEffect;
    
    if (animated) {
      // Fade out animation
      return this.fadeOutEffect(sprite, effectState.filter, effectState.config.fadeDuration)
        .then(() => {
          this.removeEffectState(sprite);
        });
    } else {
      // Immediate removal
      this.removeEffectState(sprite);
      return Promise.resolve();
    }
  }

  /**
   * Remove effect state from sprite
   * @param {PIXI.Sprite} sprite - Sprite to remove effect from
   * @private
   */
  static removeEffectState(sprite) {
    if (!sprite || !sprite.userData) {
      return;
    }

    // Remove filters
    if (sprite.filters) {
      sprite.filters = sprite.filters.filter(f => !(f instanceof PIXI.GlowFilter));
      if (sprite.filters.length === 0) {
        sprite.filters = null;
      }
    }

    // Restore original tint
    if (sprite.userData.originalTint !== undefined) {
      sprite.tint = sprite.userData.originalTint;
    }

    // Clear effect state
    sprite.userData.currentEffect = null;
  }

  /**
   * Fade in effect animation
   * @param {PIXI.Sprite} sprite - Sprite with effect
   * @param {PIXI.GlowFilter} filter - Glow filter to fade in
   * @param {number} duration - Fade duration in ms
   * @private
   */
  static fadeInEffect(sprite, filter, duration) {
    if (!sprite || !filter || duration <= 0) {
      return;
    }

    const startStrength = 0;
    const endStrength = filter.outerStrength;
    const startTime = Date.now();

    const animate = () => {
      if (!sprite.parent || !sprite.userData?.currentEffect) {
        return; // Effect was removed
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeOutCubic(progress);

      filter.outerStrength = startStrength + (endStrength - startStrength) * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    filter.outerStrength = startStrength;
    requestAnimationFrame(animate);
  }

  /**
   * Fade out effect animation
   * @param {PIXI.Sprite} sprite - Sprite with effect
   * @param {PIXI.GlowFilter} filter - Glow filter to fade out
   * @param {number} duration - Fade duration in ms
   * @returns {Promise} Resolves when fade completes
   * @private
   */
  static fadeOutEffect(sprite, filter, duration) {
    return new Promise((resolve) => {
      if (!sprite || !filter || duration <= 0) {
        resolve();
        return;
      }

      const startStrength = filter.outerStrength;
      const endStrength = 0;
      const startTime = Date.now();

      const animate = () => {
        if (!sprite.parent) {
          resolve(); // Sprite was removed
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = this.easeInCubic(progress);

        filter.outerStrength = startStrength + (endStrength - startStrength) * easedProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Lighten a color by a percentage
   * @param {number} color - Original color (hex)
   * @param {number} amount - Amount to lighten (0-1)
   * @returns {number} Lightened color (hex)
   * @private
   */
  static lightenColor(color, amount) {
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
   * Ease out cubic function
   * @param {number} t - Progress (0-1)
   * @returns {number} Eased progress (0-1)
   * @private
   */
  static easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Ease in cubic function
   * @param {number} t - Progress (0-1)
   * @returns {number} Eased progress (0-1)
   * @private
   */
  static easeInCubic(t) {
    return t * t * t;
  }

  /**
   * Get current effect type on sprite
   * @param {PIXI.Sprite} sprite - Sprite to check
   * @returns {string} Effect type or 'none'
   */
  static getCurrentEffectType(sprite) {
    if (!sprite || !sprite.userData?.currentEffect) {
      return this.EFFECT_TYPES.NONE;
    }
    return sprite.userData.currentEffect.type;
  }

  /**
   * Check if sprite has any effect
   * @param {PIXI.Sprite} sprite - Sprite to check
   * @returns {boolean} True if sprite has an effect
   */
  static hasEffect(sprite) {
    return sprite && sprite.userData?.currentEffect !== null && sprite.userData?.currentEffect !== undefined;
  }

  /**
   * Update effect (for pulsing or animated effects)
   * @param {PIXI.Sprite} sprite - Sprite with effect
   * @param {number} deltaTime - Time since last update (ms)
   */
  static update(sprite, deltaTime) {
    if (!sprite || !sprite.userData?.currentEffect) {
      return;
    }

    // Future: Add pulsing or breathing effects here
    // For now, effects are static after fade-in
  }

  /**
   * Create a custom effect configuration
   * @param {Object} config - Custom configuration
   * @returns {Object} Merged configuration
   */
  static createCustomConfig(config = {}) {
    return {
      glowDistance: config.glowDistance || 10,
      glowStrength: config.glowStrength || 2,
      glowColor: config.glowColor || 0xFFFFFF,
      glowQuality: config.glowQuality || 0.5,
      tintAmount: config.tintAmount || 0.2,
      fadeDuration: config.fadeDuration || 150
    };
  }
}

export default HighlightEffect;
