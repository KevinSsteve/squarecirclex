import SpriteAtlasManager from './SpriteAtlasManager';

/**
 * AssetLoader Utility
 * 
 * Manages progressive asset loading with priority-based loading strategy.
 * 
 * Features:
 * - Critical assets loaded first (blocking)
 * - Non-critical assets lazy loaded in background
 * - Loading progress tracking
 * - Asset caching with browser cache
 * - Error handling and retry logic
 * - Loading screen integration
 * - Sprite atlas loading support (Task 1.2)
 * 
 * Phase 9, Task 57
 * Requirements: 10.3, 10.4, 10.5
 */

class AssetLoader {
  constructor() {
    // Asset categories
    this.assets = {
      critical: [],
      nonCritical: []
    };
    
    // Loading state
    this.state = {
      phase: 'idle', // 'idle', 'loading_critical', 'loading_background', 'complete'
      criticalLoaded: false,
      backgroundLoaded: false,
      totalAssets: 0,
      loadedAssets: 0,
      failedAssets: [],
      progress: 0
    };
    
    // Configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 1000, // ms
      backgroundLoadDelay: 500, // ms after critical assets loaded
      cacheEnabled: true
    };
    
    // Callbacks
    this.callbacks = {
      onProgress: null,
      onCriticalComplete: null,
      onComplete: null,
      onError: null
    };
    
    // Loaded assets cache
    this.loadedAssets = new Map();
  }
  
  /**
   * Register critical assets (must load before game starts)
   * @param {Array} assets - Array of asset definitions
   */
  registerCriticalAssets(assets) {
    this.assets.critical = assets.map(asset => ({
      ...asset,
      priority: 'critical',
      loaded: false,
      retries: 0
    }));
    
    this.updateTotalAssets();
  }
  
  /**
   * Register non-critical assets (lazy loaded in background)
   * @param {Array} assets - Array of asset definitions
   */
  registerNonCriticalAssets(assets) {
    this.assets.nonCritical = assets.map(asset => ({
      ...asset,
      priority: 'non-critical',
      loaded: false,
      retries: 0
    }));
    
    this.updateTotalAssets();
  }
  
  /**
   * Update total asset count
   */
  updateTotalAssets() {
    this.state.totalAssets = 
      this.assets.critical.length + 
      this.assets.nonCritical.length;
  }
  
  /**
   * Set progress callback
   * @param {Function} callback - Called with progress (0-100)
   */
  onProgress(callback) {
    this.callbacks.onProgress = callback;
  }
  
  /**
   * Set critical complete callback
   * @param {Function} callback - Called when critical assets loaded
   */
  onCriticalComplete(callback) {
    this.callbacks.onCriticalComplete = callback;
  }
  
  /**
   * Set complete callback
   * @param {Function} callback - Called when all assets loaded
   */
  onComplete(callback) {
    this.callbacks.onComplete = callback;
  }
  
  /**
   * Set error callback
   * @param {Function} callback - Called on asset load error
   */
  onError(callback) {
    this.callbacks.onError = callback;
  }
  
  /**
   * Start loading assets
   * @returns {Promise} Resolves when critical assets loaded
   */
  async load() {
    if (this.state.phase !== 'idle') {
      console.warn('AssetLoader: Already loading');
      return;
    }
    
    console.log('AssetLoader: Starting asset loading...');
    this.state.phase = 'loading_critical';
    
    // Load critical assets first (blocking)
    await this.loadCriticalAssets();
    
    // Start background loading of non-critical assets
    this.startBackgroundLoading();
    
    return this.state;
  }
  
  /**
   * Load critical assets (blocking)
   * @returns {Promise} Resolves when all critical assets loaded
   */
  async loadCriticalAssets() {
    console.log(`AssetLoader: Loading ${this.assets.critical.length} critical assets...`);
    
    const promises = this.assets.critical.map(asset => 
      this.loadAsset(asset)
    );
    
    try {
      await Promise.all(promises);
      this.state.criticalLoaded = true;
      this.state.phase = 'loading_background';
      
      console.log('AssetLoader: Critical assets loaded');
      
      if (this.callbacks.onCriticalComplete) {
        this.callbacks.onCriticalComplete();
      }
    } catch (error) {
      console.error('AssetLoader: Failed to load critical assets', error);
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      
      throw error;
    }
  }
  
  /**
   * Start background loading of non-critical assets
   */
  startBackgroundLoading() {
    if (this.assets.nonCritical.length === 0) {
      this.state.backgroundLoaded = true;
      this.state.phase = 'complete';
      
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete();
      }
      
      return;
    }
    
    console.log(`AssetLoader: Starting background loading of ${this.assets.nonCritical.length} assets...`);
    
    // Delay background loading slightly to prioritize game startup
    setTimeout(() => {
      this.loadNonCriticalAssets();
    }, this.config.backgroundLoadDelay);
  }
  
  /**
   * Load non-critical assets in background
   */
  async loadNonCriticalAssets() {
    const promises = this.assets.nonCritical.map(asset => 
      this.loadAsset(asset)
    );
    
    try {
      await Promise.all(promises);
      this.state.backgroundLoaded = true;
      this.state.phase = 'complete';
      
      console.log('AssetLoader: All assets loaded');
      
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete();
      }
    } catch (error) {
      console.warn('AssetLoader: Some non-critical assets failed to load', error);
      
      // Non-critical failures don't block the game
      this.state.backgroundLoaded = true;
      this.state.phase = 'complete';
      
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete();
      }
    }
  }
  
  /**
   * Load a single asset
   * @param {object} asset - Asset definition
   * @returns {Promise} Resolves when asset loaded
   */
  async loadAsset(asset) {
    // Check cache first
    if (this.loadedAssets.has(asset.id)) {
      console.log(`AssetLoader: Using cached asset: ${asset.id}`);
      asset.loaded = true;
      this.updateProgress();
      return this.loadedAssets.get(asset.id);
    }
    
    try {
      let loadedData;
      
      switch (asset.type) {
        case 'image':
          loadedData = await this.loadImage(asset);
          break;
        case 'spritesheet':
          loadedData = await this.loadSpritesheet(asset);
          break;
        case 'json':
          loadedData = await this.loadJSON(asset);
          break;
        case 'audio':
          loadedData = await this.loadAudio(asset);
          break;
        default:
          throw new Error(`Unknown asset type: ${asset.type}`);
      }
      
      // Cache the loaded asset
      this.loadedAssets.set(asset.id, loadedData);
      asset.loaded = true;
      asset.data = loadedData;
      
      this.updateProgress();
      
      return loadedData;
    } catch (error) {
      console.error(`AssetLoader: Failed to load asset: ${asset.id}`, error);
      
      // Retry logic
      if (asset.retries < this.config.maxRetries) {
        asset.retries++;
        console.log(`AssetLoader: Retrying ${asset.id} (attempt ${asset.retries}/${this.config.maxRetries})`);
        
        await this.delay(this.config.retryDelay);
        return this.loadAsset(asset);
      }
      
      // Max retries exceeded
      this.state.failedAssets.push(asset);
      
      // Critical assets must succeed
      if (asset.priority === 'critical') {
        throw error;
      }
      
      // Non-critical assets can fail gracefully
      console.warn(`AssetLoader: Skipping failed non-critical asset: ${asset.id}`);
      this.updateProgress();
      return null;
    }
  }
  
  /**
   * Load an image
   * @param {object} asset - Asset definition
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(asset) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${asset.url}`));
      
      // Enable caching
      if (this.config.cacheEnabled) {
        img.crossOrigin = 'anonymous';
      }
      
      img.src = asset.url;
    });
  }
  
  /**
   * Load a spritesheet
   * @param {object} asset - Asset definition
   * @returns {Promise<object>}
   */
  async loadSpritesheet(asset) {
    // Use SpriteAtlasManager for sprite atlas loading
    if (asset.atlasName && asset.definitionUrl) {
      try {
        const spritesheet = await SpriteAtlasManager.loadAtlas(
          asset.atlasName,
          asset.url,
          asset.definitionUrl
        );
        
        return {
          atlasName: asset.atlasName,
          spritesheet,
          textures: spritesheet.textures
        };
      } catch (error) {
        console.error(`AssetLoader: Failed to load sprite atlas: ${asset.atlasName}`, error);
        throw error;
      }
    }
    
    // Fallback to legacy loading for backward compatibility
    const [image, definition] = await Promise.all([
      this.loadImage({ ...asset, type: 'image' }),
      this.loadJSON({ ...asset, url: asset.definitionUrl, type: 'json' })
    ]);
    
    return {
      image,
      definition
    };
  }
  
  /**
   * Load JSON data
   * @param {object} asset - Asset definition
   * @returns {Promise<object>}
   */
  async loadJSON(asset) {
    const response = await fetch(asset.url, {
      cache: this.config.cacheEnabled ? 'default' : 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${asset.url} (${response.status})`);
    }
    
    return response.json();
  }
  
  /**
   * Load audio file
   * @param {object} asset - Asset definition
   * @returns {Promise<HTMLAudioElement>}
   */
  loadAudio(asset) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = () => reject(new Error(`Failed to load audio: ${asset.url}`));
      
      audio.src = asset.url;
      audio.load();
    });
  }
  
  /**
   * Update loading progress
   */
  updateProgress() {
    this.state.loadedAssets++;
    this.state.progress = Math.round(
      (this.state.loadedAssets / this.state.totalAssets) * 100
    );
    
    if (this.callbacks.onProgress) {
      this.callbacks.onProgress(this.state.progress);
    }
  }
  
  /**
   * Get a loaded asset by ID
   * @param {string} id - Asset ID
   * @returns {any} Loaded asset data or null
   */
  getAsset(id) {
    return this.loadedAssets.get(id) || null;
  }
  
  /**
   * Check if an asset is loaded
   * @param {string} id - Asset ID
   * @returns {boolean}
   */
  isAssetLoaded(id) {
    return this.loadedAssets.has(id);
  }
  
  /**
   * Get loading state
   * @returns {object} Current loading state
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * Get loading progress (0-100)
   * @returns {number}
   */
  getProgress() {
    return this.state.progress;
  }
  
  /**
   * Check if critical assets are loaded
   * @returns {boolean}
   */
  isCriticalLoaded() {
    return this.state.criticalLoaded;
  }
  
  /**
   * Check if all assets are loaded
   * @returns {boolean}
   */
  isComplete() {
    return this.state.phase === 'complete';
  }
  
  /**
   * Get failed assets
   * @returns {Array}
   */
  getFailedAssets() {
    return [...this.state.failedAssets];
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.loadedAssets.clear();
    // Also clear sprite atlas cache
    SpriteAtlasManager.unloadAll();
    console.log('AssetLoader: Cache cleared');
  }
  
  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Reset loader state
   */
  reset() {
    this.state = {
      phase: 'idle',
      criticalLoaded: false,
      backgroundLoaded: false,
      totalAssets: 0,
      loadedAssets: 0,
      failedAssets: [],
      progress: 0
    };
    
    this.assets = {
      critical: [],
      nonCritical: []
    };
  }
}

export default AssetLoader;
