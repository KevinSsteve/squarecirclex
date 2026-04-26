/**
 * Tests for HighlightEffect
 * 
 * Tests visual highlight effects for hover and selection states.
 */

import * as PIXI from 'pixi.js';
import HighlightEffect from '../HighlightEffect';

// Mock requestAnimationFrame for testing
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

describe('HighlightEffect', () => {
  let app;
  let sprite;

  beforeEach(() => {
    // Create PixiJS application
    app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundAlpha: 0
    });

    // Create test sprite
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xFF0000);
    graphics.drawCircle(0, 0, 20);
    graphics.endFill();
    
    const texture = app.renderer.generateTexture(graphics);
    sprite = new PIXI.Sprite(texture);
    sprite.x = 100;
    sprite.y = 100;
    
    app.stage.addChild(sprite);
  });

  afterEach(() => {
    if (sprite) {
      sprite.destroy();
    }
    if (app) {
      app.destroy(true);
    }
  });

  describe('Effect Types', () => {
    test('should have correct effect type constants', () => {
      expect(HighlightEffect.EFFECT_TYPES.HOVER).toBe('hover');
      expect(HighlightEffect.EFFECT_TYPES.SELECTION).toBe('selection');
      expect(HighlightEffect.EFFECT_TYPES.NONE).toBe('none');
    });

    test('should have effect configurations', () => {
      expect(HighlightEffect.EFFECT_CONFIGS.hover).toBeDefined();
      expect(HighlightEffect.EFFECT_CONFIGS.selection).toBeDefined();
      
      expect(HighlightEffect.EFFECT_CONFIGS.hover.glowDistance).toBe(10);
      expect(HighlightEffect.EFFECT_CONFIGS.selection.glowDistance).toBe(15);
    });
  });

  describe('Hover Effect', () => {
    test('should apply hover effect to sprite', () => {
      const effectState = HighlightEffect.applyHoverEffect(sprite);
      
      expect(effectState).toBeDefined();
      expect(effectState.type).toBe(HighlightEffect.EFFECT_TYPES.HOVER);
      expect(effectState.filter).toBeInstanceOf(PIXI.GlowFilter);
      expect(sprite.filters).toContain(effectState.filter);
    });

    test('should store original tint', () => {
      const originalTint = sprite.tint;
      HighlightEffect.applyHoverEffect(sprite);
      
      expect(sprite.userData.originalTint).toBe(originalTint);
    });

    test('should lighten sprite tint', () => {
      const originalTint = sprite.tint;
      HighlightEffect.applyHoverEffect(sprite);
      
      expect(sprite.tint).not.toBe(originalTint);
      expect(sprite.tint).toBeGreaterThan(originalTint);
    });

    test('should apply glow filter with correct config', () => {
      const effectState = HighlightEffect.applyHoverEffect(sprite);
      const filter = effectState.filter;
      
      expect(filter.distance).toBe(10);
      expect(filter.color).toBe(0xFFFFFF);
    });

    test('should handle null sprite', () => {
      const effectState = HighlightEffect.applyHoverEffect(null);
      expect(effectState).toBeNull();
    });

    test('should handle sprite without parent', () => {
      const orphanSprite = new PIXI.Sprite();
      const effectState = HighlightEffect.applyHoverEffect(orphanSprite);
      expect(effectState).toBeNull();
    });

    test('should accept custom options', () => {
      const customOptions = {
        glowDistance: 20,
        glowColor: 0xFF0000,
        tintAmount: 0.5
      };
      
      const effectState = HighlightEffect.applyHoverEffect(sprite, customOptions);
      
      expect(effectState.filter.distance).toBe(20);
      expect(effectState.filter.color).toBe(0xFF0000);
      expect(effectState.config.tintAmount).toBe(0.5);
    });
  });

  describe('Selection Effect', () => {
    test('should apply selection effect to sprite', () => {
      const effectState = HighlightEffect.applySelectionEffect(sprite);
      
      expect(effectState).toBeDefined();
      expect(effectState.type).toBe(HighlightEffect.EFFECT_TYPES.SELECTION);
      expect(effectState.filter).toBeInstanceOf(PIXI.GlowFilter);
      expect(sprite.filters).toContain(effectState.filter);
    });

    test('should use stronger glow than hover', () => {
      const hoverState = HighlightEffect.applyHoverEffect(sprite);
      HighlightEffect.clearEffects(sprite, false);
      
      const selectionState = HighlightEffect.applySelectionEffect(sprite);
      
      expect(selectionState.filter.distance).toBeGreaterThan(hoverState.filter.distance);
      expect(selectionState.filter.outerStrength).toBeGreaterThan(hoverState.filter.outerStrength);
    });

    test('should use different color than hover', () => {
      const hoverState = HighlightEffect.applyHoverEffect(sprite);
      HighlightEffect.clearEffects(sprite, false);
      
      const selectionState = HighlightEffect.applySelectionEffect(sprite);
      
      expect(selectionState.filter.color).not.toBe(hoverState.filter.color);
      expect(selectionState.filter.color).toBe(0x4F46E5); // Indigo
    });

    test('should lighten more than hover', () => {
      const originalTint = sprite.tint;
      
      HighlightEffect.applyHoverEffect(sprite);
      const hoverTint = sprite.tint;
      HighlightEffect.clearEffects(sprite, false);
      
      sprite.tint = originalTint;
      HighlightEffect.applySelectionEffect(sprite);
      const selectionTint = sprite.tint;
      
      expect(selectionTint).toBeGreaterThan(hoverTint);
    });

    test('should accept custom options', () => {
      const customOptions = {
        glowDistance: 25,
        glowColor: 0x00FF00,
        tintAmount: 0.6
      };
      
      const effectState = HighlightEffect.applySelectionEffect(sprite, customOptions);
      
      expect(effectState.filter.distance).toBe(25);
      expect(effectState.filter.color).toBe(0x00FF00);
      expect(effectState.config.tintAmount).toBe(0.6);
    });
  });

  describe('Clear Effects', () => {
    test('should clear effects from sprite', async () => {
      HighlightEffect.applyHoverEffect(sprite);
      expect(sprite.filters).not.toBeNull();
      
      await HighlightEffect.clearEffects(sprite, false);
      
      expect(sprite.filters).toBeNull();
      expect(sprite.userData.currentEffect).toBeNull();
    });

    test('should restore original tint', async () => {
      const originalTint = sprite.tint;
      HighlightEffect.applyHoverEffect(sprite);
      
      await HighlightEffect.clearEffects(sprite, false);
      
      expect(sprite.tint).toBe(originalTint);
    });

    test('should handle sprite without effect', async () => {
      await expect(HighlightEffect.clearEffects(sprite, false)).resolves.toBeUndefined();
    });

    test('should handle null sprite', async () => {
      await expect(HighlightEffect.clearEffects(null, false)).resolves.toBeUndefined();
    });

    test('should support animated fade out', async () => {
      HighlightEffect.applyHoverEffect(sprite);
      const filter = sprite.userData.currentEffect.filter;
      const initialStrength = filter.outerStrength;
      
      const clearPromise = HighlightEffect.clearEffects(sprite, true);
      
      // Wait a bit for animation to start
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Strength should be decreasing
      expect(filter.outerStrength).toBeLessThan(initialStrength);
      
      await clearPromise;
      
      // Should be fully cleared
      expect(sprite.filters).toBeNull();
    });
  });

  describe('Effect State Management', () => {
    test('should track current effect type', () => {
      expect(HighlightEffect.getCurrentEffectType(sprite)).toBe(HighlightEffect.EFFECT_TYPES.NONE);
      
      HighlightEffect.applyHoverEffect(sprite);
      expect(HighlightEffect.getCurrentEffectType(sprite)).toBe(HighlightEffect.EFFECT_TYPES.HOVER);
      
      HighlightEffect.clearEffects(sprite, false);
      HighlightEffect.applySelectionEffect(sprite);
      expect(HighlightEffect.getCurrentEffectType(sprite)).toBe(HighlightEffect.EFFECT_TYPES.SELECTION);
    });

    test('should check if sprite has effect', () => {
      expect(HighlightEffect.hasEffect(sprite)).toBe(false);
      
      HighlightEffect.applyHoverEffect(sprite);
      expect(HighlightEffect.hasEffect(sprite)).toBe(true);
      
      HighlightEffect.clearEffects(sprite, false);
      expect(HighlightEffect.hasEffect(sprite)).toBe(false);
    });

    test('should handle null sprite in state checks', () => {
      expect(HighlightEffect.getCurrentEffectType(null)).toBe(HighlightEffect.EFFECT_TYPES.NONE);
      expect(HighlightEffect.hasEffect(null)).toBe(false);
    });
  });

  describe('Color Utilities', () => {
    test('should lighten color correctly', () => {
      const color = 0x808080; // Gray
      const lightened = HighlightEffect.lightenColor(color, 0.5);
      
      expect(lightened).toBeGreaterThan(color);
      expect(lightened).toBeLessThanOrEqual(0xFFFFFF);
    });

    test('should handle black color', () => {
      const black = 0x000000;
      const lightened = HighlightEffect.lightenColor(black, 0.5);
      
      expect(lightened).toBeGreaterThan(black);
    });

    test('should handle white color', () => {
      const white = 0xFFFFFF;
      const lightened = HighlightEffect.lightenColor(white, 0.5);
      
      expect(lightened).toBe(white); // Can't lighten white
    });

    test('should handle zero lighten amount', () => {
      const color = 0x808080;
      const lightened = HighlightEffect.lightenColor(color, 0);
      
      expect(lightened).toBe(color);
    });

    test('should handle full lighten amount', () => {
      const color = 0x000000;
      const lightened = HighlightEffect.lightenColor(color, 1);
      
      expect(lightened).toBe(0xFFFFFF);
    });

    test('should lighten each RGB component independently', () => {
      const red = 0xFF0000;
      const lightened = HighlightEffect.lightenColor(red, 0.5);
      
      // Red should stay at max, green and blue should increase
      const r = (lightened >> 16) & 0xFF;
      const g = (lightened >> 8) & 0xFF;
      const b = lightened & 0xFF;
      
      expect(r).toBe(255);
      expect(g).toBeGreaterThan(0);
      expect(b).toBeGreaterThan(0);
    });
  });

  describe('Easing Functions', () => {
    test('should ease out cubic correctly', () => {
      expect(HighlightEffect.easeOutCubic(0)).toBe(0);
      expect(HighlightEffect.easeOutCubic(1)).toBe(1);
      expect(HighlightEffect.easeOutCubic(0.5)).toBeGreaterThan(0.5); // Fast start
    });

    test('should ease in cubic correctly', () => {
      expect(HighlightEffect.easeInCubic(0)).toBe(0);
      expect(HighlightEffect.easeInCubic(1)).toBe(1);
      expect(HighlightEffect.easeInCubic(0.5)).toBeLessThan(0.5); // Slow start
    });

    test('easing functions should be smooth', () => {
      const steps = 10;
      let prevValue = 0;
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const eased = HighlightEffect.easeOutCubic(t);
        
        expect(eased).toBeGreaterThanOrEqual(prevValue);
        prevValue = eased;
      }
    });
  });

  describe('Custom Configuration', () => {
    test('should create custom config with defaults', () => {
      const config = HighlightEffect.createCustomConfig();
      
      expect(config.glowDistance).toBe(10);
      expect(config.glowStrength).toBe(2);
      expect(config.glowColor).toBe(0xFFFFFF);
      expect(config.glowQuality).toBe(0.5);
      expect(config.tintAmount).toBe(0.2);
      expect(config.fadeDuration).toBe(150);
    });

    test('should merge custom config with defaults', () => {
      const custom = {
        glowDistance: 20,
        glowColor: 0xFF0000
      };
      
      const config = HighlightEffect.createCustomConfig(custom);
      
      expect(config.glowDistance).toBe(20);
      expect(config.glowColor).toBe(0xFF0000);
      expect(config.glowStrength).toBe(2); // Default
    });

    test('should handle empty config', () => {
      const config = HighlightEffect.createCustomConfig({});
      
      expect(config.glowDistance).toBe(10);
      expect(config.glowStrength).toBe(2);
    });
  });

  describe('Update Method', () => {
    test('should handle update without effect', () => {
      expect(() => {
        HighlightEffect.update(sprite, 16);
      }).not.toThrow();
    });

    test('should handle update with effect', () => {
      HighlightEffect.applyHoverEffect(sprite);
      
      expect(() => {
        HighlightEffect.update(sprite, 16);
      }).not.toThrow();
    });

    test('should handle null sprite', () => {
      expect(() => {
        HighlightEffect.update(null, 16);
      }).not.toThrow();
    });
  });

  describe('Multiple Effects', () => {
    test('should replace hover with selection', () => {
      HighlightEffect.applyHoverEffect(sprite);
      expect(HighlightEffect.getCurrentEffectType(sprite)).toBe(HighlightEffect.EFFECT_TYPES.HOVER);
      
      HighlightEffect.clearEffects(sprite, false);
      HighlightEffect.applySelectionEffect(sprite);
      expect(HighlightEffect.getCurrentEffectType(sprite)).toBe(HighlightEffect.EFFECT_TYPES.SELECTION);
    });

    test('should handle rapid effect changes', () => {
      for (let i = 0; i < 10; i++) {
        HighlightEffect.applyHoverEffect(sprite);
        HighlightEffect.clearEffects(sprite, false);
      }
      
      expect(sprite.filters).toBeNull();
      expect(HighlightEffect.hasEffect(sprite)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle sprite destroyed during animation', async () => {
      HighlightEffect.applyHoverEffect(sprite);
      
      const clearPromise = HighlightEffect.clearEffects(sprite, true);
      
      // Destroy sprite mid-animation
      sprite.destroy();
      
      await expect(clearPromise).resolves.toBeUndefined();
    });

    test('should handle sprite removed from stage', async () => {
      HighlightEffect.applyHoverEffect(sprite);
      
      const clearPromise = HighlightEffect.clearEffects(sprite, true);
      
      // Remove from stage mid-animation
      app.stage.removeChild(sprite);
      
      await expect(clearPromise).resolves.toBeUndefined();
    });

    test('should handle zero fade duration', () => {
      const effectState = HighlightEffect.applyHoverEffect(sprite, { fadeDuration: 0 });
      
      expect(effectState).toBeDefined();
      expect(sprite.filters).toContain(effectState.filter);
    });

    test('should handle negative fade duration', () => {
      const effectState = HighlightEffect.applyHoverEffect(sprite, { fadeDuration: -100 });
      
      expect(effectState).toBeDefined();
      expect(sprite.filters).toContain(effectState.filter);
    });
  });

  describe('Performance', () => {
    test('should apply effect quickly', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const testSprite = new PIXI.Sprite();
        app.stage.addChild(testSprite);
        HighlightEffect.applyHoverEffect(testSprite);
        HighlightEffect.clearEffects(testSprite, false);
        testSprite.destroy();
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000); // Should complete in < 1 second
    });

    test('should not leak memory', () => {
      const initialFilters = sprite.filters ? sprite.filters.length : 0;
      
      for (let i = 0; i < 10; i++) {
        HighlightEffect.applyHoverEffect(sprite);
        HighlightEffect.clearEffects(sprite, false);
      }
      
      const finalFilters = sprite.filters ? sprite.filters.length : 0;
      expect(finalFilters).toBe(initialFilters);
    });
  });
});
