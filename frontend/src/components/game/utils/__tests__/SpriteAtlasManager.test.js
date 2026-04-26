import SpriteAtlasManager from '../SpriteAtlasManager';
import * as PIXI from 'pixi.js';

// Mock PIXI
jest.mock('pixi.js', () => ({
  Assets: {
    load: jest.fn()
  },
  Spritesheet: jest.fn(),
  Texture: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('SpriteAtlasManager', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset manager state
    SpriteAtlasManager.unloadAll();
    
    // Setup default mock implementations
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        frames: {
          'sprite1.png': { frame: { x: 0, y: 0, w: 64, h: 64 } },
          'sprite2.png': { frame: { x: 64, y: 0, w: 64, h: 64 } }
        },
        meta: {
          image: 'test.png',
          size: { w: 128, h: 64 }
        }
      })
    });

    const mockTexture = { width: 128, height: 64 };
    PIXI.Assets.load.mockResolvedValue(mockTexture);

    const mockSpritesheet = {
      textures: {
        'sprite1.png': { width: 64, height: 64 },
        'sprite2.png': { width: 64, height: 64 }
      },
      parse: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn()
    };
    PIXI.Spritesheet.mockImplementation(() => mockSpritesheet);
  });

  describe('loadAtlas', () => {
    it('should load an atlas successfully', async () => {
      const atlasName = 'test-atlas';
      const imagePath = '/assets/test.png';
      const jsonPath = '/assets/test.json';

      const spritesheet = await SpriteAtlasManager.loadAtlas(atlasName, imagePath, jsonPath);

      expect(global.fetch).toHaveBeenCalledWith(jsonPath);
      expect(PIXI.Assets.load).toHaveBeenCalledWith(imagePath);
      expect(spritesheet).toBeDefined();
      expect(spritesheet.parse).toHaveBeenCalled();
    });

    it('should cache loaded atlases', async () => {
      const atlasName = 'test-atlas';
      const imagePath = '/assets/test.png';
      const jsonPath = '/assets/test.json';

      await SpriteAtlasManager.loadAtlas(atlasName, imagePath, jsonPath);
      await SpriteAtlasManager.loadAtlas(atlasName, imagePath, jsonPath);

      // Should only load once
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(PIXI.Assets.load).toHaveBeenCalledTimes(1);
    });

    it('should handle loading errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(
        SpriteAtlasManager.loadAtlas('bad-atlas', '/bad.png', '/bad.json')
      ).rejects.toThrow('Failed to load sprite atlas');
    });

    it('should handle concurrent loads of same atlas', async () => {
      const atlasName = 'test-atlas';
      const imagePath = '/assets/test.png';
      const jsonPath = '/assets/test.json';

      const promise1 = SpriteAtlasManager.loadAtlas(atlasName, imagePath, jsonPath);
      const promise2 = SpriteAtlasManager.loadAtlas(atlasName, imagePath, jsonPath);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe(result2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTexture', () => {
    beforeEach(async () => {
      await SpriteAtlasManager.loadAtlas('test-atlas', '/test.png', '/test.json');
    });

    it('should return texture from loaded atlas', () => {
      const texture = SpriteAtlasManager.getTexture('test-atlas', 'sprite1.png');
      expect(texture).toBeDefined();
      expect(texture.width).toBe(64);
    });

    it('should return null for non-existent texture', () => {
      const texture = SpriteAtlasManager.getTexture('test-atlas', 'nonexistent.png');
      expect(texture).toBeNull();
    });

    it('should return null for non-existent atlas', () => {
      const texture = SpriteAtlasManager.getTexture('nonexistent-atlas', 'sprite1.png');
      expect(texture).toBeNull();
    });

    it('should cache retrieved textures', () => {
      const texture1 = SpriteAtlasManager.getTexture('test-atlas', 'sprite1.png');
      const texture2 = SpriteAtlasManager.getTexture('test-atlas', 'sprite1.png');
      expect(texture1).toBe(texture2);
    });
  });

  describe('getAllTextures', () => {
    beforeEach(async () => {
      await SpriteAtlasManager.loadAtlas('test-atlas', '/test.png', '/test.json');
    });

    it('should return all textures from atlas', () => {
      const textures = SpriteAtlasManager.getAllTextures('test-atlas');
      expect(Object.keys(textures)).toHaveLength(2);
      expect(textures['sprite1.png']).toBeDefined();
      expect(textures['sprite2.png']).toBeDefined();
    });

    it('should return empty object for non-existent atlas', () => {
      const textures = SpriteAtlasManager.getAllTextures('nonexistent');
      expect(textures).toEqual({});
    });
  });

  describe('isAtlasLoaded', () => {
    it('should return false for unloaded atlas', () => {
      expect(SpriteAtlasManager.isAtlasLoaded('test-atlas')).toBe(false);
    });

    it('should return true for loaded atlas', async () => {
      await SpriteAtlasManager.loadAtlas('test-atlas', '/test.png', '/test.json');
      expect(SpriteAtlasManager.isAtlasLoaded('test-atlas')).toBe(true);
    });
  });

  describe('hasTexture', () => {
    beforeEach(async () => {
      await SpriteAtlasManager.loadAtlas('test-atlas', '/test.png', '/test.json');
    });

    it('should return true for existing texture', () => {
      expect(SpriteAtlasManager.hasTexture('test-atlas', 'sprite1.png')).toBe(true);
    });

    it('should return false for non-existent texture', () => {
      expect(SpriteAtlasManager.hasTexture('test-atlas', 'nonexistent.png')).toBe(false);
    });

    it('should return false for non-existent atlas', () => {
      expect(SpriteAtlasManager.hasTexture('nonexistent', 'sprite1.png')).toBe(false);
    });
  });

  describe('unloadAtlas', () => {
    beforeEach(async () => {
      await SpriteAtlasManager.loadAtlas('test-atlas', '/test.png', '/test.json');
    });

    it('should unload atlas and clear cache', () => {
      SpriteAtlasManager.unloadAtlas('test-atlas');
      expect(SpriteAtlasManager.isAtlasLoaded('test-atlas')).toBe(false);
      expect(SpriteAtlasManager.getTexture('test-atlas', 'sprite1.png')).toBeNull();
    });

    it('should call destroy on spritesheet', () => {
      const mockSpritesheet = PIXI.Spritesheet.mock.results[0].value;
      SpriteAtlasManager.unloadAtlas('test-atlas');
      expect(mockSpritesheet.destroy).toHaveBeenCalledWith(true);
    });

    it('should handle unloading non-existent atlas gracefully', () => {
      expect(() => {
        SpriteAtlasManager.unloadAtlas('nonexistent');
      }).not.toThrow();
    });
  });

  describe('unloadAll', () => {
    beforeEach(async () => {
      await SpriteAtlasManager.loadAtlas('atlas1', '/test1.png', '/test1.json');
      await SpriteAtlasManager.loadAtlas('atlas2', '/test2.png', '/test2.json');
    });

    it('should unload all atlases', () => {
      SpriteAtlasManager.unloadAll();
      expect(SpriteAtlasManager.isAtlasLoaded('atlas1')).toBe(false);
      expect(SpriteAtlasManager.isAtlasLoaded('atlas2')).toBe(false);
    });

    it('should clear all caches', () => {
      SpriteAtlasManager.unloadAll();
      const stats = SpriteAtlasManager.getStats();
      expect(stats.atlasCount).toBe(0);
      expect(stats.cachedTextureCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct stats for empty manager', () => {
      const stats = SpriteAtlasManager.getStats();
      expect(stats.atlasCount).toBe(0);
      expect(stats.cachedTextureCount).toBe(0);
      expect(stats.loadingCount).toBe(0);
      expect(stats.atlases).toEqual([]);
    });

    it('should return correct stats after loading atlases', async () => {
      await SpriteAtlasManager.loadAtlas('atlas1', '/test1.png', '/test1.json');
      await SpriteAtlasManager.loadAtlas('atlas2', '/test2.png', '/test2.json');

      const stats = SpriteAtlasManager.getStats();
      expect(stats.atlasCount).toBe(2);
      expect(stats.cachedTextureCount).toBe(4); // 2 sprites per atlas
      expect(stats.atlases).toContain('atlas1');
      expect(stats.atlases).toContain('atlas2');
    });
  });
});
