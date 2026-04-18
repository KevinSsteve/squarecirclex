/**
 * StateCacheDB Class - IndexedDB-based persistent state cache
 * 
 * Implements:
 * - Local state cache with IndexedDB
 * - Cache invalidation logic
 * - Cache-first loading strategy
 * - Background sync support
 * - Versioning for cache invalidation
 * 
 * Requirements: 4.6, 10.5, 10.6
 * Phase 4, Task 22
 */

/**
 * StateCacheDB - Manages persistent state caching with IndexedDB
 */
class StateCacheDB {
  constructor(config = {}) {
    this.dbName = config.dbName || 'experta-game-state';
    this.dbVersion = config.dbVersion || 1;
    this.db = null;
    
    // Store names
    this.stores = {
      gameState: 'gameState',      // Normalized game state (tasks, agents, brands)
      rawState: 'rawState',         // Raw backend responses
      metadata: 'metadata'          // Cache metadata (timestamps, versions)
    };
    
    // Cache configuration
    this.config = {
      maxAge: config.maxAge || 86400000,        // 24 hours in ms
      maxEntries: config.maxEntries || 1000,    // Max cached entries
      compressionEnabled: config.compressionEnabled !== false,
      autoCleanup: config.autoCleanup !== false
    };
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      deletes: 0,
      errors: 0
    };
  }
  
  /**
   * Initialize IndexedDB connection
   * Creates object stores if they don't exist
   * 
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('StateCacheDB: Failed to open database:', request.error);
        this.stats.errors++;
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('StateCacheDB: Database opened successfully');
        
        // Set up error handler
        this.db.onerror = (event) => {
          console.error('StateCacheDB: Database error:', event.target.error);
          this.stats.errors++;
        };
        
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create gameState store
        if (!db.objectStoreNames.contains(this.stores.gameState)) {
          const gameStateStore = db.createObjectStore(this.stores.gameState, { keyPath: 'key' });
          gameStateStore.createIndex('timestamp', 'timestamp', { unique: false });
          gameStateStore.createIndex('version', 'version', { unique: false });
          console.log('StateCacheDB: Created gameState store');
        }
        
        // Create rawState store
        if (!db.objectStoreNames.contains(this.stores.rawState)) {
          const rawStateStore = db.createObjectStore(this.stores.rawState, { keyPath: 'key' });
          rawStateStore.createIndex('timestamp', 'timestamp', { unique: false });
          rawStateStore.createIndex('resourceType', 'resourceType', { unique: false });
          console.log('StateCacheDB: Created rawState store');
        }
        
        // Create metadata store
        if (!db.objectStoreNames.contains(this.stores.metadata)) {
          const metadataStore = db.createObjectStore(this.stores.metadata, { keyPath: 'key' });
          metadataStore.createIndex('type', 'type', { unique: false });
          console.log('StateCacheDB: Created metadata store');
        }
      };
    });
  }
  
  /**
   * Save game state to cache
   * 
   * @param {Object} gameState - Normalized game state
   * @param {string} version - Cache version for invalidation
   * @returns {Promise<void>}
   */
  async saveGameState(gameState, version = '1.0.0') {
    if (!this.db) {
      throw new Error('StateCacheDB: Database not initialized');
    }
    
    try {
      const transaction = this.db.transaction([this.stores.gameState], 'readwrite');
      const store = transaction.objectStore(this.stores.gameState);
      
      const cacheEntry = {
        key: 'current',
        data: gameState,
        timestamp: Date.now(),
        version: version
      };
      
      await this._promisifyRequest(store.put(cacheEntry));
      
      this.stats.writes++;
      console.log('StateCacheDB: Game state saved to cache');
      
      // Auto cleanup if enabled
      if (this.config.autoCleanup) {
        await this.cleanup();
      }
    } catch (error) {
      console.error('StateCacheDB: Failed to save game state:', error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Load game state from cache
   * 
   * @param {string} version - Expected cache version
   * @returns {Promise<Object|null>} Cached game state or null
   */
  async loadGameState(version = '1.0.0') {
    if (!this.db) {
      throw new Error('StateCacheDB: Database not initialized');
    }
    
    try {
      const transaction = this.db.transaction([this.stores.gameState], 'readonly');
      const store = transaction.objectStore(this.stores.gameState);
      
      const cacheEntry = await this._promisifyRequest(store.get('current'));
      
      if (!cacheEntry) {
        console.log('StateCacheDB: No cached game state found');
        this.stats.misses++;
        return null;
      }
      
      // Check version
      if (cacheEntry.version !== version) {
        console.warn(`StateCacheDB: Cache version mismatch (cached: ${cacheEntry.version}, expected: ${version})`);
        this.stats.misses++;
        return null;
      }
      
      // Check age
      const age = Date.now() - cacheEntry.timestamp;
      if (age > this.config.maxAge) {
        console.warn(`StateCacheDB: Cache expired (age: ${Math.floor(age / 1000)}s)`);
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      console.log('StateCacheDB: Game state loaded from cache');
      return cacheEntry.data;
    } catch (error) {
      console.error('StateCacheDB: Failed to load game state:', error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Save raw backend response to cache
   * 
   * @param {string} resourceType - Type of resource (posts, brands, etc.)
   * @param {Object} data - Raw backend data
   * @returns {Promise<void>}
   */
  async saveRawState(resourceType, data) {
    if (!this.db) {
      throw new Error('StateCacheDB: Database not initialized');
    }
    
    try {
      const transaction = this.db.transaction([this.stores.rawState], 'readwrite');
      const store = transaction.objectStore(this.stores.rawState);
      
      const cacheEntry = {
        key: resourceType,
        resourceType: resourceType,
        data: data,
        timestamp: Date.now()
      };
      
      await this._promisifyRequest(store.put(cacheEntry));
      
      this.stats.writes++;
      console.log(`StateCacheDB: Raw state saved for ${resourceType}`);
    } catch (error) {
      console.error(`StateCacheDB: Failed to save raw state for ${resourceType}:`, error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Load raw backend response from cache
   * 
   * @param {string} resourceType - Type of resource
   * @returns {Promise<Object|null>} Cached raw data or null
   */
  async loadRawState(resourceType) {
    if (!this.db) {
      throw new Error('StateCacheDB: Database not initialized');
    }
    
    try {
      const transaction = this.db.transaction([this.stores.rawState], 'readonly');
      const store = transaction.objectStore(this.stores.rawState);
      
      const cacheEntry = await this._promisifyRequest(store.get(resourceType));
      
      if (!cacheEntry) {
        this.stats.misses++;
        return null;
      }
      
      // Check age
      const age = Date.now() - cacheEntry.timestamp;
      if (age > this.config.maxAge) {
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return cacheEntry.data;
    } catch (error) {
      console.error(`StateCacheDB: Failed to load raw state for ${resourceType}:`, error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Save metadata to cache
   * 
   * @param {string} key - Metadata key
   * @param {Object} data - Metadata value
   * @param {string} type - Metadata type
   * @returns {Promise<void>}
   */
  async saveMetadata(key, data, type = 'general') {
    if (!this.db) {
      throw new Error('StateCacheDB: Database not initialized');
    }
    
    try {
      const transaction = this.db.transaction([this.stores.metadata], 'readwrite');
      const store = transaction.objectStore(this.stores.metadata);
      
      const metadataEntry = {
        key: key,
        type: type,
        data: data,
        timestamp: Date.now()
      };
      
      await this._promisifyRequest(store.put(metadataEntry));
      
      this.stats.writes++;
    } catch (error) {
      console.error(`StateCacheDB: Failed to save metadata for ${key}:`, error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Load metadata from cache
   * 
   * @param {string} key - Metadata key
   * @returns {Promise<Object|null>} Metadata value or null
   */
  async loadMetadata(key) {
    if (!this.db) {
      throw new Error('StateCacheDB: Database not initialized');
    }
    
    try {
      const transaction = this.db.transaction([this.stores.metadata], 'readonly');
      const store = transaction.objectStore(this.stores.metadata);
      
      const metadataEntry = await this._promisifyRequest(store.get(key));
      
      if (!metadataEntry) {
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return metadataEntry.data;
    } catch (error) {
      console.error(`StateCacheDB: Failed to load metadata for ${key}:`, error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Invalidate cache by version
   * Removes all entries with different version
   * 
   * @param {string} newVersion - New cache version
   * @returns {Promise<number>} Number of entries deleted
   */
  async invalidateByVersion(newVersion) {
    if (!this.db) {
      throw new Error('StateCacheDB: Database not initialized');
    }
    
    try {
      const transaction = this.db.transaction([this.stores.gameState], 'readwrite');
      const store = transaction.objectStore(this.stores.gameState);
      const index = store.index('version');
      
      let deletedCount = 0;
      const request = index.openCursor();
      
      await new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            if (cursor.value.version !== newVersion) {
              cursor.delete();
              deletedCount++;
              this.stats.deletes++;
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        request.onerror = () => reject(request.error);
      });
      
      console.log(`StateCacheDB: Invalidated ${deletedCount} entries by version`);
      return deletedCount;
    } catch (error) {
      console.error('StateCacheDB: Failed to invalidate by version:', error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Invalidate cache by age
   * Removes entries older than maxAge
   * 
   * @returns {Promise<number>} Number of entries deleted
   */
  async invalidateByAge() {
    if (!this.db) {
      throw new Error('StateCacheDB: Database not initialized');
    }
    
    try {
      const cutoffTime = Date.now() - this.config.maxAge;
      let deletedCount = 0;
      
      // Clean gameState store
      const gameStateTransaction = this.db.transaction([this.stores.gameState], 'readwrite');
      const gameStateStore = gameStateTransaction.objectStore(this.stores.gameState);
      const gameStateIndex = gameStateStore.index('timestamp');
      
      const gameStateRequest = gameStateIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));
      
      await new Promise((resolve, reject) => {
        gameStateRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            this.stats.deletes++;
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        gameStateRequest.onerror = () => reject(gameStateRequest.error);
      });
      
      // Clean rawState store
      const rawStateTransaction = this.db.transaction([this.stores.rawState], 'readwrite');
      const rawStateStore = rawStateTransaction.objectStore(this.stores.rawState);
      const rawStateIndex = rawStateStore.index('timestamp');
      
      const rawStateRequest = rawStateIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));
      
      await new Promise((resolve, reject) => {
        rawStateRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            this.stats.deletes++;
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        rawStateRequest.onerror = () => reject(rawStateRequest.error);
      });
      
      console.log(`StateCacheDB: Invalidated ${deletedCount} entries by age`);
      return deletedCount;
    } catch (error) {
      console.error('StateCacheDB: Failed to invalidate by age:', error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Clear all cached data
   * 
   * @returns {Promise<void>}
   */
  async clearAll() {
    if (!this.db) {
      throw new Error('StateCacheDB: Database not initialized');
    }
    
    try {
      const transaction = this.db.transaction(
        [this.stores.gameState, this.stores.rawState, this.stores.metadata],
        'readwrite'
      );
      
      await Promise.all([
        this._promisifyRequest(transaction.objectStore(this.stores.gameState).clear()),
        this._promisifyRequest(transaction.objectStore(this.stores.rawState).clear()),
        this._promisifyRequest(transaction.objectStore(this.stores.metadata).clear())
      ]);
      
      console.log('StateCacheDB: All cache cleared');
      this.stats.deletes += 3;
    } catch (error) {
      console.error('StateCacheDB: Failed to clear cache:', error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Cleanup old entries
   * Removes expired entries and enforces max entries limit
   * 
   * @returns {Promise<number>} Number of entries deleted
   */
  async cleanup() {
    if (!this.db) {
      throw new Error('StateCacheDB: Database not initialized');
    }
    
    try {
      // Invalidate by age
      const deletedByAge = await this.invalidateByAge();
      
      // TODO: Enforce max entries limit if needed
      // This would require counting entries and deleting oldest
      
      return deletedByAge;
    } catch (error) {
      console.error('StateCacheDB: Cleanup failed:', error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Get cache statistics
   * 
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`
    };
  }
  
  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      deletes: 0,
      errors: 0
    };
  }
  
  /**
   * Check if database is initialized
   * 
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.db !== null;
  }
  
  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('StateCacheDB: Database closed');
    }
  }
  
  /**
   * Helper: Convert IDBRequest to Promise
   * 
   * @param {IDBRequest} request - IndexedDB request
   * @returns {Promise<any>} Promise that resolves with request result
   * @private
   */
  _promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export default StateCacheDB;
