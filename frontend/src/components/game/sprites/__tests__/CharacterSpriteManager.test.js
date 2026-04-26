/**
 * CharacterSpriteManager.test.js - Unit Tests
 * 
 * Tests for the Character Sprite Manager system.
 * 
 * Phase 3, Task 3.1: Character Sprite Manager
 */

import {
  CharacterSpriteManager,
  getCharacterSpriteManager,
  AnimationState,
  Direction,
  DIRECTIONS
} from '../CharacterSpriteManager';

describe('CharacterSpriteManager', () => {
  let manager;
  
  beforeEach(() => {
    manager = new CharacterSpriteManager();
  });
  
  afterEach(() => {
    if (manager) {
      manager.clearCache();
    }
  });
  
  describe('Initialization', () => {
    test('should initialize with empty cache', () => {
      expect(manager.spriteCache.size).toBe(0);
      expect(manager.loadedCharacterTypes.size).toBe(0);
    });
    
    test('should have default frame rate', () => {
      expect(manager.defaultFrameRate).toBe(8);
    });
    
    test('should initialize animation configs map', () => {
      expect(manager.animationConfigs).toBeInstanceOf(Map);
    });
  });
  
  describe('Character Loading', () => {
    test('should load character sprites', async () => {
      const spriteData = {
        frameRate: 10,
        frameCount: {
          idle: 1,
          walking: 4,
          working: 4,
          celebrating: 6
        }
      };
      
      await manager.loadCharacterSprites('agent', spriteData);
      
      expect(manager.isCharacterLoaded('agent')).toBe(true);
      expect(manager.loadedCharacterTypes.has('agent')).toBe(true);
    });
    
    test('should not reload already loaded character', async () => {
      const spriteData = { frameRate: 10 };
      
      await manager.loadCharacterSprites('agent', spriteData);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await manager.loadCharacterSprites('agent', spriteData);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already loaded')
      );
      
      consoleSpy.mockRestore();
    });
    
    test('should store animation configuration', async () => {
      const spriteData = {
        frameRate: 12,
        frameCount: {
          idle: 2,
          walking: 6
        }
      };
      
      await manager.loadCharacterSprites('manager', spriteData);
      
      const config = manager.getAnimationConfig('manager');
      expect(config).toBeDefined();
      expect(config.frameRate).toBe(12);
      expect(config.frameCount.idle).toBe(2);
    });
  });
  
  describe('Sprite Retrieval', () => {
    beforeEach(async () => {
      await manager.loadCharacterSprites('agent', {
        frameRate: 8,
        frameCount: {
          idle: 1,
          walking: 4
        }
      });
    });
    
    test('should get sprite texture', () => {
      const texture = manager.getSprite('agent', AnimationState.IDLE, Direction.SOUTH, 0);
      
      expect(texture).toBeDefined();
      expect(texture).not.toBeNull();
    });
    
    test('should return null for unloaded character', () => {
      const texture = manager.getSprite('unknown', AnimationState.IDLE, Direction.SOUTH, 0);
      
      expect(texture).toBeNull();
    });
    
    test('should handle invalid animation state', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const texture = manager.getSprite('agent', 'invalid_state', Direction.SOUTH, 0);
      
      expect(texture).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    test('should handle invalid direction', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const texture = manager.getSprite('agent', AnimationState.IDLE, 'INVALID', 0);
      
      expect(texture).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    test('should handle out of bounds frame index', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const texture = manager.getSprite('agent', AnimationState.IDLE, Direction.SOUTH, 999);
      
      expect(texture).toBeDefined(); // Should return first frame
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Frame Count', () => {
    test('should return default frame counts', () => {
      const spriteData = {};
      
      expect(manager.getFrameCount(AnimationState.IDLE, spriteData)).toBe(1);
      expect(manager.getFrameCount(AnimationState.WALKING, spriteData)).toBe(4);
      expect(manager.getFrameCount(AnimationState.WORKING, spriteData)).toBe(4);
      expect(manager.getFrameCount(AnimationState.CELEBRATING, spriteData)).toBe(6);
    });
    
    test('should use custom frame counts from sprite data', () => {
      const spriteData = {
        frameCount: {
          idle: 2,
          walking: 8,
          working: 6,
          celebrating: 10
        }
      };
      
      expect(manager.getFrameCount(AnimationState.IDLE, spriteData)).toBe(2);
      expect(manager.getFrameCount(AnimationState.WALKING, spriteData)).toBe(8);
      expect(manager.getFrameCount(AnimationState.WORKING, spriteData)).toBe(6);
      expect(manager.getFrameCount(AnimationState.CELEBRATING, spriteData)).toBe(10);
    });
    
    test('should get animation frame count for loaded character', async () => {
      await manager.loadCharacterSprites('agent', {
        frameCount: {
          walking: 6
        }
      });
      
      expect(manager.getAnimationFrameCount('agent', AnimationState.WALKING)).toBe(6);
    });
    
    test('should return default for unloaded character', () => {
      expect(manager.getAnimationFrameCount('unknown', AnimationState.IDLE)).toBe(1);
    });
  });
  
  describe('8-Directional Support', () => {
    beforeEach(async () => {
      await manager.loadCharacterSprites('agent', { frameRate: 8 });
    });
    
    test('should support all 8 directions', () => {
      for (const direction of DIRECTIONS) {
        const texture = manager.getSprite('agent', AnimationState.IDLE, direction, 0);
        expect(texture).toBeDefined();
        expect(texture).not.toBeNull();
      }
    });
    
    test('should have correct direction constants', () => {
      expect(DIRECTIONS).toHaveLength(8);
      expect(DIRECTIONS).toContain(Direction.NORTH);
      expect(DIRECTIONS).toContain(Direction.NORTH_EAST);
      expect(DIRECTIONS).toContain(Direction.EAST);
      expect(DIRECTIONS).toContain(Direction.SOUTH_EAST);
      expect(DIRECTIONS).toContain(Direction.SOUTH);
      expect(DIRECTIONS).toContain(Direction.SOUTH_WEST);
      expect(DIRECTIONS).toContain(Direction.WEST);
      expect(DIRECTIONS).toContain(Direction.NORTH_WEST);
    });
  });
  
  describe('Animation States', () => {
    beforeEach(async () => {
      await manager.loadCharacterSprites('agent', { frameRate: 8 });
    });
    
    test('should support all animation states', () => {
      const states = [
        AnimationState.IDLE,
        AnimationState.WALKING,
        AnimationState.WORKING,
        AnimationState.CELEBRATING
      ];
      
      for (const state of states) {
        const texture = manager.getSprite('agent', state, Direction.SOUTH, 0);
        expect(texture).toBeDefined();
        expect(texture).not.toBeNull();
      }
    });
    
    test('should have correct animation state constants', () => {
      expect(AnimationState.IDLE).toBe('idle');
      expect(AnimationState.WALKING).toBe('walking');
      expect(AnimationState.WORKING).toBe('working');
      expect(AnimationState.CELEBRATING).toBe('celebrating');
    });
  });
  
  describe('Cache Management', () => {
    test('should unload character sprites', async () => {
      await manager.loadCharacterSprites('agent', { frameRate: 8 });
      
      expect(manager.isCharacterLoaded('agent')).toBe(true);
      
      manager.unloadCharacterSprites('agent');
      
      expect(manager.isCharacterLoaded('agent')).toBe(false);
      expect(manager.spriteCache.has('agent')).toBe(false);
    });
    
    test('should handle unloading non-existent character', () => {
      // Should not throw
      expect(() => {
        manager.unloadCharacterSprites('nonexistent');
      }).not.toThrow();
    });
    
    test('should clear all cache', async () => {
      await manager.loadCharacterSprites('agent', { frameRate: 8 });
      await manager.loadCharacterSprites('manager', { frameRate: 10 });
      
      expect(manager.loadedCharacterTypes.size).toBe(2);
      
      manager.clearCache();
      
      expect(manager.loadedCharacterTypes.size).toBe(0);
      expect(manager.spriteCache.size).toBe(0);
      expect(manager.animationConfigs.size).toBe(0);
    });
  });
  
  describe('Cache Statistics', () => {
    test('should return empty stats for empty cache', () => {
      const stats = manager.getCacheStats();
      
      expect(stats.characterTypes).toBe(0);
      expect(stats.totalStates).toBe(0);
      expect(stats.totalDirections).toBe(0);
      expect(stats.totalTextures).toBe(0);
      expect(stats.loadedTypes).toEqual([]);
    });
    
    test('should return correct stats after loading', async () => {
      await manager.loadCharacterSprites('agent', { frameRate: 8 });
      
      const stats = manager.getCacheStats();
      
      expect(stats.characterTypes).toBe(1);
      expect(stats.totalStates).toBe(4); // 4 animation states
      expect(stats.totalDirections).toBe(32); // 4 states × 8 directions
      expect(stats.totalTextures).toBeGreaterThan(0);
      expect(stats.loadedTypes).toContain('agent');
    });
    
    test('should track multiple character types', async () => {
      await manager.loadCharacterSprites('agent', { frameRate: 8 });
      await manager.loadCharacterSprites('manager', { frameRate: 10 });
      
      const stats = manager.getCacheStats();
      
      expect(stats.characterTypes).toBe(2);
      expect(stats.loadedTypes).toContain('agent');
      expect(stats.loadedTypes).toContain('manager');
    });
  });
  
  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = getCharacterSpriteManager();
      const instance2 = getCharacterSpriteManager();
      
      expect(instance1).toBe(instance2);
    });
    
    test('should maintain state across calls', async () => {
      const instance1 = getCharacterSpriteManager();
      await instance1.loadCharacterSprites('agent', { frameRate: 8 });
      
      const instance2 = getCharacterSpriteManager();
      
      expect(instance2.isCharacterLoaded('agent')).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle loading errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an error by passing invalid data
      const invalidData = null;
      
      await expect(
        manager.loadCharacterSprites('invalid', invalidData)
      ).rejects.toThrow();
      
      consoleSpy.mockRestore();
    });
    
    test('should log warnings for missing sprites', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      manager.getSprite('nonexistent', AnimationState.IDLE, Direction.SOUTH, 0);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Placeholder Textures', () => {
    test('should create placeholder textures', () => {
      const texture = manager.createPlaceholderTexture('agent', AnimationState.IDLE, Direction.SOUTH, 0);
      
      expect(texture).toBeDefined();
      expect(texture).not.toBeNull();
    });
    
    test('should create different textures for different directions', () => {
      const textureN = manager.createPlaceholderTexture('agent', AnimationState.IDLE, Direction.NORTH, 0);
      const textureS = manager.createPlaceholderTexture('agent', AnimationState.IDLE, Direction.SOUTH, 0);
      
      expect(textureN).toBeDefined();
      expect(textureS).toBeDefined();
      // Textures should be different objects
      expect(textureN).not.toBe(textureS);
    });
    
    test('should create different textures for different character types', () => {
      const agentTexture = manager.createPlaceholderTexture('agent', AnimationState.IDLE, Direction.SOUTH, 0);
      const managerTexture = manager.createPlaceholderTexture('manager', AnimationState.IDLE, Direction.SOUTH, 0);
      
      expect(agentTexture).toBeDefined();
      expect(managerTexture).toBeDefined();
      expect(agentTexture).not.toBe(managerTexture);
    });
  });
});
