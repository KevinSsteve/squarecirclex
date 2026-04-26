import * as PIXI from 'pixi.js';

/**
 * SpriteAtlasManager
 * 
 * Manages sprite atlases (texture atlases) for efficient texture loading and memory usage.
 * Supports loading sprite sheets with JSON atlas definitions and provides texture caching.
 * 
 * Features:
 * - Load sprite sheets with JSON atlas definitions
 * - Texture caching for performance
 * - Error handling for missing sprites
 * - Support for multiple atlas formats
 */
class SpriteAtlasManager {
  constructor() {
    this.atlases = new Map(); // Map<atlasName, PIXI.Spritesheet>
    this.textureCache = new Map(); // Map<textureName, PIXI.Texture>
    this.loadingPromises = new Map(); // Map<atlasName, Promise>
  }

  /**
   * Load a sprite atlas from image and JSON definition
   * @param {string} atlasName - Unique name for this atlas
   * @param {string} imagePath - Path to the sprite sheet image
   * @param {string} jsonPath - Path to the atlas JSON definition
   * @returns {Promise<PIXI.Spritesheet>}
   */
  async loadAtlas(atlasName, imagePath, jsonPath) {
    // Return existing promise if already loading
    if (this.loadingPromises.has(atlasName)) {
      return this.loadingPromises.get(atlasName);
    }

    // Return cached atlas if already loaded
    if (this.atlases.has(atlasName)) {
      return Promise.resolve(this.atlases.get(atlasName));
    }

    const loadPromise = this._loadAtlasInternal(atlasName, imagePath, jsonPath);
    this.loadingPromises.set(atlasName, loadPromise);

    try {
      const spritesheet = await loadPromise;
      this.loadingPromises.delete(atlasName);
      return spritesheet;
    } catch (error) {
      this.loadingPromises.delete(atlasName);
      throw error;
    }
  }

  /**
   * Internal method to load atlas
   * @private
   */
  async _loadAtlasInternal(atlasName, imagePath, jsonPath) {
    try {
      // Load JSON definition
      const response = await fetch(jsonPath);
      if (!response.ok) {
        throw new Error(`Failed to load atlas JSON: ${jsonPath}`);
      }
      const atlasData = await response.json();

      // Load texture
      const texture = await PIXI.Assets.load(imagePath);

      // Create spritesheet
      const spritesheet = new PIXI.Spritesheet(texture, atlasData);
      await spritesheet.parse();

      // Cache the spritesheet
      this.atlases.set(atlasName, spritesheet);

      // Cache individual textures
      Object.keys(spritesheet.textures).forEach(frameName => {
        const cacheKey = `${atlasName}:${frameName}`;
        this.textureCache.set(cacheKey, spritesheet.textures[frameName]);
      });

      console.log(`[SpriteAtlasManager] Loaded atlas: ${atlasName} with ${Object.keys(spritesheet.textures).length} frames`);

      return spritesheet;
    } catch (error) {
      console.error(`[SpriteAtlasManager] Error loading atlas ${atlasName}:`, error);
      throw new Error(`Failed to load sprite atlas: ${atlasName}`);
    }
  }

  /**
   * Get a texture from a loaded atlas
   * @param {string} atlasName - Name of the atlas
   * @param {string} frameName - Name of the frame/sprite in the atlas
   * @returns {PIXI.Texture|null}
   */
  getTexture(atlasName, frameName) {
    const cacheKey = `${atlasName}:${frameName}`;
    
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey);
    }

    // Try to get from atlas directly
    const atlas = this.atlases.get(atlasName);
    if (atlas && atlas.textures[frameName]) {
      const texture = atlas.textures[frameName];
      this.textureCache.set(cacheKey, texture);
      return texture;
    }

    console.warn(`[SpriteAtlasManager] Texture not found: ${atlasName}:${frameName}`);
    return null;
  }

  /**
   * Get all textures from an atlas
   * @param {string} atlasName - Name of the atlas
   * @returns {Object<string, PIXI.Texture>}
   */
  getAllTextures(atlasName) {
    const atlas = this.atlases.get(atlasName);
    if (!atlas) {
      console.warn(`[SpriteAtlasManager] Atlas not found: ${atlasName}`);
      return {};
    }
    return atlas.textures;
  }

  /**
   * Check if an atlas is loaded
   * @param {string} atlasName - Name of the atlas
   * @returns {boolean}
   */
  isAtlasLoaded(atlasName) {
    return this.atlases.has(atlasName);
  }

  /**
   * Check if a texture exists in an atlas
   * @param {string} atlasName - Name of the atlas
   * @param {string} frameName - Name of the frame/sprite
   * @returns {boolean}
   */
  hasTexture(atlasName, frameName) {
    const cacheKey = `${atlasName}:${frameName}`;
    if (this.textureCache.has(cacheKey)) {
      return true;
    }

    const atlas = this.atlases.get(atlasName);
    return atlas && atlas.textures[frameName] !== undefined;
  }

  /**
   * Unload an atlas and free memory
   * @param {string} atlasName - Name of the atlas to unload
   */
  unloadAtlas(atlasName) {
    const atlas = this.atlases.get(atlasName);
    if (!atlas) {
      return;
    }

    // Remove from texture cache
    const keysToRemove = [];
    this.textureCache.forEach((texture, key) => {
      if (key.startsWith(`${atlasName}:`)) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.textureCache.delete(key));

    // Destroy spritesheet
    atlas.destroy(true);
    this.atlases.delete(atlasName);

    console.log(`[SpriteAtlasManager] Unloaded atlas: ${atlasName}`);
  }

  /**
   * Unload all atlases and clear cache
   */
  unloadAll() {
    this.atlases.forEach((atlas, name) => {
      atlas.destroy(true);
    });
    this.atlases.clear();
    this.textureCache.clear();
    this.loadingPromises.clear();
    console.log('[SpriteAtlasManager] Unloaded all atlases');
  }

  /**
   * Get memory usage statistics
   * @returns {Object}
   */
  getStats() {
    return {
      atlasCount: this.atlases.size,
      cachedTextureCount: this.textureCache.size,
      loadingCount: this.loadingPromises.size,
      atlases: Array.from(this.atlases.keys())
    };
  }
}

// Export singleton instance
export default new SpriteAtlasManager();
