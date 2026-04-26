/**
 * ShadowSystem Unit Tests
 * 
 * Tests shadow rendering system for 3D isometric game layer
 * Phase 1, Task 1.5
 */

import ShadowSystem from '../ShadowSystem.js';
import * as PIXI from 'pixi.js';

// Mock PixiJS
jest.mock('pixi.js', () => ({
  Graphics: jest.fn().mockImplementation(() => ({
    ellipse: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    destroy: jest.fn()
  })),
  Sprite: jest.fn().mockImplementation(() => ({
    anchor: { set: jest.fn() },
    scale: { set: jest.fn() },
    destroy: jest.fn(),
    x: 0,
    y: 0,
    alpha: 1,
    tint: 0x000000,
    visible: true,
    zIndex: 0
  })),
  Container: jest.fn().mockImplementation(() => ({
    addChild: jest.fn(),
    removeChild: jest.fn(),
    children: []
  }))
}));

describe('ShadowSystem', () => {
  let shadowSystem;
  let mockScene;
  let mockApp;
  let mockRenderer;
  let mockShadowLayer;
  
  beforeEach(() => {
    // Create mock renderer
    mockRenderer = {
      generateTexture: jest.fn().mockReturnValue({
        destroy: jest.fn()
      })
    };
    
    // Create mock app
    mockApp = {
      renderer: mockRenderer
    };
    
    // Create mock shadow layer
    mockShadowLayer = {
      addChild: jest.fn(),
      removeChild: jest.fn(),
      children: []
    };
    
    // Create mock scene
    mockScene = {
      app: mockApp,
      layers: {
        shadows: mockShadowLayer
      }
    };
    
    // Create shadow system
    shadowSystem = new ShadowSystem(mockScene);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Initialization', () => {
    test('should initialize with correct configuration', () => {
      expect(shadowSystem.scene).toBe(mockScene);
      expect(shadowSystem.shadowLayer).toBe(mockShadowLayer);
      expect(shadowSystem.shadowCache).toBeInstanceOf(Map);
      expect(shadowSystem.textures).toBeInstanceOf(Map);
    });
    
    test('should create shadow textures for all sizes', () => {
      expect(shadowSystem.textures.size).toBe(3);
      expect(shadowSystem.textures.has('small')).toBe(true);
      expect(shadowSystem.textures.has('medium')).toBe(true);
      expect(shadowSystem.textures.has('large')).toBe(true);
    });
    
    test('should have correct default configuration', () => {
      expect(shadowSystem.config.defaultAlpha).toBe(0.3);
      expect(shadowSystem.config.defaultSize).toBe(48);
      expect(shadowSystem.config.offsetY).toBe(10);
      expect(shadowSystem.config.tint).toBe(0x000000);
    });
  });
  
  describe('createShadowTexture', () => {
    test('should create elliptical shadow texture', () => {
      const size = 48;
      const texture = shadowSystem.createShadowTexture(size);
      
      expect(PIXI.Graphics).toHaveBeenCalled();
      expect(mockRenderer.generateTexture).toHaveBeenCalled();
      expect(texture).toBeDefined();
    });
    
    test('should create textures of different sizes', () => {
      const sizes = [32, 48, 64];
      
      sizes.forEach(size => {
        const texture = shadowSystem.createShadowTexture(size);
        expect(texture).toBeDefined();
      });
    });
  });
  
  describe('createShadow', () => {
    let mockEntity;
    
    beforeEach(() => {
      mockEntity = {
        id: 'test-entity-1',
        getComponent: jest.fn().mockReturnValue({
          x: 100,
          y: 200
        })
      };
    });
    
    test('should create shadow for entity', () => {
      const shadow = shadowSystem.createShadow(mockEntity, 'medium');
      
      expect(shadow).toBeDefined();
      expect(PIXI.Sprite).toHaveBeenCalled();
      expect(mockShadowLayer.addChild).toHaveBeenCalledWith(shadow);
      expect(shadowSystem.shadowCache.has(mockEntity.id)).toBe(true);
    });
    
    test('should position shadow below entity', () => {
      const shadow = shadowSystem.createShadow(mockEntity, 'medium');
      
      expect(shadow.x).toBe(100);
      expect(shadow.y).toBe(210); // 200 + offsetY (10)
    });
    
    test('should set shadow alpha from options', () => {
      const shadow = shadowSystem.createShadow(mockEntity, 'medium', { alpha: 0.5 });
      
      expect(shadow.alpha).toBe(0.5);
    });
    
    test('should use default alpha if not provided', () => {
      const shadow = shadowSystem.createShadow(mockEntity, 'medium');
      
      expect(shadow.alpha).toBe(0.3);
    });
    
    test('should set shadow tint from options', () => {
      const shadow = shadowSystem.createShadow(mockEntity, 'medium', { tint: 0xFF0000 });
      
      expect(shadow.tint).toBe(0xFF0000);
    });
    
    test('should use default tint if not provided', () => {
      const shadow = shadowSystem.createShadow(mockEntity, 'medium');
      
      expect(shadow.tint).toBe(0x000000);
    });
    
    test('should set shadow zIndex for depth sorting', () => {
      const shadow = shadowSystem.createShadow(mockEntity, 'medium');
      
      expect(shadow.zIndex).toBe(209); // y (200) + offsetY (10) - 1
    });
    
    test('should warn if shadow already exists', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      shadowSystem.createShadow(mockEntity, 'medium');
      const shadow2 = shadowSystem.createShadow(mockEntity, 'medium');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Shadow already exists')
      );
      expect(shadow2).toBeDefined();
      
      consoleSpy.mockRestore();
    });
    
    test('should use medium size if invalid type provided', () => {
      const shadow = shadowSystem.createShadow(mockEntity, 'invalid');
      
      expect(shadow).toBeDefined();
      expect(shadowSystem.shadowCache.has(mockEntity.id)).toBe(true);
    });
    
    test('should handle entity without position component', () => {
      mockEntity.getComponent.mockReturnValue(null);
      
      const shadow = shadowSystem.createShadow(mockEntity, 'medium');
      
      expect(shadow).toBeDefined();
      expect(shadow.x).toBe(0);
      expect(shadow.y).toBe(0);
    });
  });
  
  describe('updateShadow', () => {
    let mockEntity;
    
    beforeEach(() => {
      mockEntity = {
        id: 'test-entity-1',
        getComponent: jest.fn().mockReturnValue({
          x: 100,
          y: 200
        })
      };
      
      shadowSystem.createShadow(mockEntity, 'medium');
    });
    
    test('should update shadow position', () => {
      shadowSystem.updateShadow(mockEntity.id, 150, 250);
      
      const shadow = shadowSystem.getShadow(mockEntity.id);
      expect(shadow.x).toBe(150);
      expect(shadow.y).toBe(260); // 250 + offsetY (10)
    });
    
    test('should update shadow zIndex', () => {
      shadowSystem.updateShadow(mockEntity.id, 150, 250);
      
      const shadow = shadowSystem.getShadow(mockEntity.id);
      expect(shadow.zIndex).toBe(259); // y (250) + offsetY (10) - 1
    });
    
    test('should handle non-existent shadow gracefully', () => {
      expect(() => {
        shadowSystem.updateShadow('non-existent', 100, 100);
      }).not.toThrow();
    });
  });
  
  describe('updateShadowFromEntity', () => {
    let mockEntity;
    
    beforeEach(() => {
      mockEntity = {
        id: 'test-entity-1',
        getComponent: jest.fn().mockReturnValue({
          x: 100,
          y: 200
        })
      };
      
      shadowSystem.createShadow(mockEntity, 'medium');
    });
    
    test('should update shadow from entity position', () => {
      mockEntity.getComponent.mockReturnValue({
        x: 150,
        y: 250
      });
      
      shadowSystem.updateShadowFromEntity(mockEntity);
      
      const shadow = shadowSystem.getShadow(mockEntity.id);
      expect(shadow.x).toBe(150);
      expect(shadow.y).toBe(260);
    });
    
    test('should handle entity without position component', () => {
      mockEntity.getComponent.mockReturnValue(null);
      
      expect(() => {
        shadowSystem.updateShadowFromEntity(mockEntity);
      }).not.toThrow();
    });
  });
  
  describe('setShadowAlpha', () => {
    let mockEntity;
    
    beforeEach(() => {
      mockEntity = {
        id: 'test-entity-1',
        getComponent: jest.fn().mockReturnValue({
          x: 100,
          y: 200
        })
      };
      
      shadowSystem.createShadow(mockEntity, 'medium');
    });
    
    test('should set shadow alpha', () => {
      shadowSystem.setShadowAlpha(mockEntity.id, 0.7);
      
      const shadow = shadowSystem.getShadow(mockEntity.id);
      expect(shadow.alpha).toBe(0.7);
    });
    
    test('should clamp alpha to 0-1 range', () => {
      shadowSystem.setShadowAlpha(mockEntity.id, 1.5);
      let shadow = shadowSystem.getShadow(mockEntity.id);
      expect(shadow.alpha).toBe(1.0);
      
      shadowSystem.setShadowAlpha(mockEntity.id, -0.5);
      shadow = shadowSystem.getShadow(mockEntity.id);
      expect(shadow.alpha).toBe(0.0);
    });
    
    test('should handle non-existent shadow gracefully', () => {
      expect(() => {
        shadowSystem.setShadowAlpha('non-existent', 0.5);
      }).not.toThrow();
    });
  });
  
  describe('setShadowScale', () => {
    let mockEntity;
    
    beforeEach(() => {
      mockEntity = {
        id: 'test-entity-1',
        getComponent: jest.fn().mockReturnValue({
          x: 100,
          y: 200
        })
      };
      
      shadowSystem.createShadow(mockEntity, 'medium');
    });
    
    test('should set shadow scale', () => {
      const shadow = shadowSystem.getShadow(mockEntity.id);
      shadowSystem.setShadowScale(mockEntity.id, 1.5);
      
      expect(shadow.scale.set).toHaveBeenCalledWith(1.5);
    });
    
    test('should handle non-existent shadow gracefully', () => {
      expect(() => {
        shadowSystem.setShadowScale('non-existent', 1.5);
      }).not.toThrow();
    });
  });
  
  describe('setShadowVisibility', () => {
    let mockEntity;
    
    beforeEach(() => {
      mockEntity = {
        id: 'test-entity-1',
        getComponent: jest.fn().mockReturnValue({
          x: 100,
          y: 200
        })
      };
      
      shadowSystem.createShadow(mockEntity, 'medium');
    });
    
    test('should set shadow visibility', () => {
      shadowSystem.setShadowVisibility(mockEntity.id, false);
      
      const shadow = shadowSystem.getShadow(mockEntity.id);
      expect(shadow.visible).toBe(false);
    });
    
    test('should handle non-existent shadow gracefully', () => {
      expect(() => {
        shadowSystem.setShadowVisibility('non-existent', false);
      }).not.toThrow();
    });
  });
  
  describe('removeShadow', () => {
    let mockEntity;
    
    beforeEach(() => {
      mockEntity = {
        id: 'test-entity-1',
        getComponent: jest.fn().mockReturnValue({
          x: 100,
          y: 200
        })
      };
      
      shadowSystem.createShadow(mockEntity, 'medium');
    });
    
    test('should remove shadow from entity', () => {
      const shadow = shadowSystem.getShadow(mockEntity.id);
      
      shadowSystem.removeShadow(mockEntity.id);
      
      expect(mockShadowLayer.removeChild).toHaveBeenCalledWith(shadow);
      expect(shadow.destroy).toHaveBeenCalled();
      expect(shadowSystem.shadowCache.has(mockEntity.id)).toBe(false);
    });
    
    test('should handle non-existent shadow gracefully', () => {
      expect(() => {
        shadowSystem.removeShadow('non-existent');
      }).not.toThrow();
    });
  });
  
  describe('hasShadow', () => {
    let mockEntity;
    
    beforeEach(() => {
      mockEntity = {
        id: 'test-entity-1',
        getComponent: jest.fn().mockReturnValue({
          x: 100,
          y: 200
        })
      };
    });
    
    test('should return true if entity has shadow', () => {
      shadowSystem.createShadow(mockEntity, 'medium');
      
      expect(shadowSystem.hasShadow(mockEntity.id)).toBe(true);
    });
    
    test('should return false if entity has no shadow', () => {
      expect(shadowSystem.hasShadow(mockEntity.id)).toBe(false);
    });
  });
  
  describe('getShadow', () => {
    let mockEntity;
    
    beforeEach(() => {
      mockEntity = {
        id: 'test-entity-1',
        getComponent: jest.fn().mockReturnValue({
          x: 100,
          y: 200
        })
      };
    });
    
    test('should return shadow sprite if exists', () => {
      const shadow = shadowSystem.createShadow(mockEntity, 'medium');
      
      expect(shadowSystem.getShadow(mockEntity.id)).toBe(shadow);
    });
    
    test('should return null if shadow does not exist', () => {
      expect(shadowSystem.getShadow(mockEntity.id)).toBeNull();
    });
  });
  
  describe('update', () => {
    test('should not throw error', () => {
      expect(() => {
        shadowSystem.update();
      }).not.toThrow();
    });
  });
  
  describe('getStats', () => {
    test('should return correct statistics', () => {
      const mockEntity1 = {
        id: 'entity-1',
        getComponent: jest.fn().mockReturnValue({ x: 100, y: 200 })
      };
      const mockEntity2 = {
        id: 'entity-2',
        getComponent: jest.fn().mockReturnValue({ x: 150, y: 250 })
      };
      
      shadowSystem.createShadow(mockEntity1, 'medium');
      shadowSystem.createShadow(mockEntity2, 'large');
      
      const stats = shadowSystem.getStats();
      
      expect(stats.shadowCount).toBe(2);
      expect(stats.textureCount).toBe(3);
      expect(stats.layerChildCount).toBe(0); // Mock layer doesn't track children
    });
  });
  
  describe('clearAll', () => {
    test('should clear all shadows', () => {
      const mockEntity1 = {
        id: 'entity-1',
        getComponent: jest.fn().mockReturnValue({ x: 100, y: 200 })
      };
      const mockEntity2 = {
        id: 'entity-2',
        getComponent: jest.fn().mockReturnValue({ x: 150, y: 250 })
      };
      
      const shadow1 = shadowSystem.createShadow(mockEntity1, 'medium');
      const shadow2 = shadowSystem.createShadow(mockEntity2, 'large');
      
      shadowSystem.clearAll();
      
      expect(mockShadowLayer.removeChild).toHaveBeenCalledWith(shadow1);
      expect(mockShadowLayer.removeChild).toHaveBeenCalledWith(shadow2);
      expect(shadow1.destroy).toHaveBeenCalled();
      expect(shadow2.destroy).toHaveBeenCalled();
      expect(shadowSystem.shadowCache.size).toBe(0);
    });
  });
  
  describe('destroy', () => {
    test('should destroy all shadows and textures', () => {
      const mockEntity = {
        id: 'entity-1',
        getComponent: jest.fn().mockReturnValue({ x: 100, y: 200 })
      };
      
      shadowSystem.createShadow(mockEntity, 'medium');
      
      shadowSystem.destroy();
      
      expect(shadowSystem.shadowCache.size).toBe(0);
      expect(shadowSystem.textures.size).toBe(0);
    });
  });
});
