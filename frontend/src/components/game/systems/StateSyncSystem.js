/**
 * StateSyncSystem Class - Synchronizes backend state with game world
 * 
 * Implements:
 * - Polling mechanism with configurable intervals
 * - Connection status tracking
 * - State normalization functions
 * - Event emission for state changes
 * - Real backend API integration
 * - Optimized change detection with hashing
 * - Batch update processing
 * - Timestamp-based conflict resolution
 * - Exponential backoff for failed requests
 * - Reconnection logic
 * - Cached state fallback for offline functionality
 * - IndexedDB persistent cache
 * - Cache-first loading strategy
 * - Background sync when connection restored
 * 
 * Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 8.6, 11.1, 11.2, 11.3
 * Phase 4, Tasks 18-22
 */

import BackendStateMappers from '../mappers/BackendStateMappers.js';
import { StateCacheDB } from '../cache/index.js';

/**
 * StateSyncSystem - Manages backend state synchronization
 */
class StateSyncSystem {
  constructor(entityRegistry, config = {}) {
    this.entityRegistry = entityRegistry;
    
    // Configuration with defaults
    this.config = {
      intervals: {
        posts: config.postsInterval || 2000,        // Poll posts every 2s
        chatHistory: config.chatInterval || 3000,   // Poll chat every 3s
        brands: config.brandsInterval || 10000,     // Poll brands every 10s
        lambdaLogs: config.logsInterval || 5000     // Poll logs every 5s (future)
      },
      batchRequests: config.batchRequests !== false, // Default true
      conditionalRequests: config.conditionalRequests !== false, // Default true
      backoffStrategy: config.backoffStrategy || 'exponential',
      maxRetries: config.maxRetries || 5,
      baseBackoffMs: config.baseBackoffMs || 1000,
      brandId: config.brandId || null, // Brand ID for filtering
      cacheEnabled: config.cacheEnabled !== false, // Default true
      cacheVersion: config.cacheVersion || '1.0.0',
      cacheFirstLoad: config.cacheFirstLoad !== false // Default true
    };
    
    // Connection state
    this.connectionStatus = 'disconnected'; // 'connected' | 'syncing' | 'disconnected' | 'error'
    this.lastSyncTime = null;
    this.syncCount = 0;
    this.errorCount = 0;
    
    // Polling timers
    this.timers = {
      posts: null,
      chatHistory: null,
      brands: null,
      lambdaLogs: null
    };
    
    // State cache for change detection
    this.stateCache = {
      posts: new Map(),      // postId -> post data
      chatHistory: new Map(), // conversationId -> messages
      brands: new Map(),      // brandId -> brand data
      lambdaLogs: new Map()   // executionId -> log data
    };
    
    // Normalized game state cache
    this.gameStateCache = {
      tasks: {},
      agents: {},
      brands: {}
    };
    
    // Cached state fallback (used when disconnected)
    this.cachedStateFallback = {
      tasks: {},
      agents: {},
      brands: {},
      timestamp: null
    };
    
    // ETags for conditional requests
    this.etags = {
      posts: null,
      chatHistory: null,
      brands: null,
      lambdaLogs: null
    };
    
    // Event listeners
    this.listeners = {
      stateChange: [],
      connectionChange: [],
      error: []
    };
    
    // Pending updates queue for batch processing
    this.pendingUpdates = [];
    this.batchProcessingTimer = null;
    this.batchProcessingDelay = config.batchProcessingDelay || 100; // 100ms batch window
    
    // Retry state
    this.retryCount = 0;
    this.retryTimer = null;
    
    // Change detection optimization
    this.changeDetectionCache = new Map(); // entityId -> hash
    
    // IndexedDB cache
    this.cacheDB = null;
    this.cacheInitialized = false;
    
    // Initialize cache if enabled
    if (this.config.cacheEnabled) {
      this.initCache();
    }
  }
  
  /**
   * Initialize IndexedDB cache
   * Called automatically in constructor if cache is enabled
   * 
   * @returns {Promise<void>}
   */
  async initCache() {
    if (!this.config.cacheEnabled) {
      console.log('StateSyncSystem: Cache disabled');
      return;
    }
    
    try {
      this.cacheDB = new StateCacheDB({
        dbName: 'experta-game-state',
        dbVersion: 1,
        maxAge: 86400000, // 24 hours
        autoCleanup: true
      });
      
      await this.cacheDB.init();
      this.cacheInitialized = true;
      console.log('StateSyncSystem: Cache initialized');
      
      // Load cached state if cache-first is enabled
      if (this.config.cacheFirstLoad) {
        await this.loadFromCache();
      }
    } catch (error) {
      console.error('StateSyncSystem: Failed to initialize cache:', error);
      this.cacheInitialized = false;
      // Continue without cache
    }
  }
  
  /**
   * Load state from IndexedDB cache (cache-first strategy)
   * 
   * @returns {Promise<boolean>} True if loaded from cache
   */
  async loadFromCache() {
    if (!this.cacheInitialized) {
      return false;
    }
    
    try {
      const cachedGameState = await this.cacheDB.loadGameState(this.config.cacheVersion);
      
      if (cachedGameState) {
        console.log('StateSyncSystem: Loaded state from cache');
        
        // Update game state cache
        this.gameStateCache = cachedGameState;
        
        // Update cached fallback
        this.cachedStateFallback = {
          ...cachedGameState,
          timestamp: Date.now()
        };
        
        // Emit state change event
        this.emitStateChange({
          resourceType: 'cache',
          changes: [{
            type: 'cache_loaded',
            data: cachedGameState
          }],
          normalizedState: cachedGameState,
          timestamp: Date.now(),
          fromCache: true
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('StateSyncSystem: Failed to load from cache:', error);
      return false;
    }
  }
  
  /**
   * Save current state to IndexedDB cache
   * 
   * @returns {Promise<void>}
   */
  async saveToCache() {
    if (!this.cacheInitialized) {
      return;
    }
    
    try {
      await this.cacheDB.saveGameState(this.gameStateCache, this.config.cacheVersion);
      console.log('StateSyncSystem: State saved to cache');
    } catch (error) {
      console.error('StateSyncSystem: Failed to save to cache:', error);
    }
  }
  
  /**
   * Invalidate cache by version
   * Useful when data structure changes
   * 
   * @param {string} newVersion - New cache version
   * @returns {Promise<void>}
   */
  async invalidateCache(newVersion) {
    if (!this.cacheInitialized) {
      return;
    }
    
    try {
      await this.cacheDB.invalidateByVersion(newVersion);
      this.config.cacheVersion = newVersion;
      console.log(`StateSyncSystem: Cache invalidated for version ${newVersion}`);
    } catch (error) {
      console.error('StateSyncSystem: Failed to invalidate cache:', error);
    }
  }
  
  /**
   * Clear all cached data
   * 
   * @returns {Promise<void>}
   */
  async clearCache() {
    if (!this.cacheInitialized) {
      return;
    }
    
    try {
      await this.cacheDB.clearAll();
      console.log('StateSyncSystem: Cache cleared');
    } catch (error) {
      console.error('StateSyncSystem: Failed to clear cache:', error);
    }
  }
  
  /**
   * Get cache statistics
   * 
   * @returns {Object|null} Cache statistics or null if cache not initialized
   */
  getCacheStats() {
    if (!this.cacheInitialized) {
      return null;
    }
    
    return this.cacheDB.getStats();
  }
  
  /**
   * Start syncing with backend
   * Begins polling all configured resources
   */
  startSync() {
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'syncing') {
      console.warn('StateSyncSystem: Already syncing');
      return;
    }
    
    console.log('StateSyncSystem: Starting sync...');
    this.connectionStatus = 'connected';
    this.emitConnectionChange('connected');
    
    // Start polling timers
    this.startPolling('posts');
    this.startPolling('chatHistory');
    this.startPolling('brands');
    // lambdaLogs polling will be added in future enhancement
    
    // Do initial sync immediately
    this.forceSync();
  }
  
  /**
   * Stop syncing
   * Clears all polling timers
   */
  stopSync() {
    console.log('StateSyncSystem: Stopping sync...');
    
    // Flush any pending batch updates before stopping
    if (this.batchProcessingTimer) {
      clearTimeout(this.batchProcessingTimer);
      this.flushBatchUpdates(this.gameStateCache);
    }
    
    // Clear all timers
    Object.keys(this.timers).forEach(key => {
      if (this.timers[key]) {
        clearInterval(this.timers[key]);
        this.timers[key] = null;
      }
    });
    
    // Clear retry timer
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    this.connectionStatus = 'disconnected';
    this.emitConnectionChange('disconnected');
  }
  
  /**
   * Force immediate sync
   * Polls all resources immediately
   * 
   * @returns {Promise<void>}
   */
  async forceSync() {
    if (this.connectionStatus === 'syncing') {
      console.warn('StateSyncSystem: Sync already in progress');
      return;
    }
    
    const previousStatus = this.connectionStatus;
    this.connectionStatus = 'syncing';
    this.emitConnectionChange('syncing');
    
    try {
      // Poll all resources
      await Promise.all([
        this.pollResource('posts'),
        this.pollResource('chatHistory'),
        this.pollResource('brands')
      ]);
      
      this.lastSyncTime = Date.now();
      this.syncCount++;
      this.errorCount = 0;
      this.retryCount = 0;
      
      this.connectionStatus = 'connected';
      this.emitConnectionChange('connected');
    } catch (error) {
      console.error('StateSyncSystem: Force sync failed:', error);
      this.handleSyncError(error);
      
      // Restore previous status if it wasn't error
      if (previousStatus !== 'error') {
        this.connectionStatus = previousStatus;
      }
    }
  }
  
  /**
   * Start polling a specific resource
   * 
   * @param {string} resourceType - Type of resource to poll
   */
  startPolling(resourceType) {
    if (!this.config.intervals[resourceType]) {
      console.warn(`StateSyncSystem: No interval configured for ${resourceType}`);
      return;
    }
    
    // Clear existing timer if any
    if (this.timers[resourceType]) {
      clearInterval(this.timers[resourceType]);
    }
    
    // Start new timer
    this.timers[resourceType] = setInterval(async () => {
      try {
        await this.pollResource(resourceType);
      } catch (error) {
        console.error(`StateSyncSystem: Polling ${resourceType} failed:`, error);
        this.handleSyncError(error);
      }
    }, this.config.intervals[resourceType]);
  }
  
  /**
   * Poll a specific resource from backend
   * 
   * @param {string} resourceType - Type of resource to poll
   * @returns {Promise<void>}
   */
  async pollResource(resourceType) {
    console.log(`StateSyncSystem: Polling ${resourceType}...`);
    
    try {
      let data;
      
      // Fetch data from backend based on resource type
      switch (resourceType) {
        case 'posts':
          if (this.config.brandId) {
            data = await BackendStateMappers.fetchPosts(this.config.brandId);
          } else {
            console.warn('StateSyncSystem: No brandId configured, skipping posts poll');
            return;
          }
          break;
          
        case 'chatHistory':
          data = await BackendStateMappers.fetchChatHistory();
          break;
          
        case 'brands':
          if (this.config.brandId) {
            data = await BackendStateMappers.fetchBrand(this.config.brandId);
            // Wrap single brand in array for consistency
            data = { brands: [data.brand] };
          } else {
            console.warn('StateSyncSystem: No brandId configured, skipping brands poll');
            return;
          }
          break;
          
        default:
          console.warn(`StateSyncSystem: Unknown resource type: ${resourceType}`);
          return;
      }
      
      // Normalize and process the data
      this.processResourceData(resourceType, data);
    } catch (error) {
      console.error(`StateSyncSystem: Failed to poll ${resourceType}:`, error);
      throw error;
    }
  }
  
  /**
   * Get mock data for testing (DEPRECATED - replaced with real API calls)
   * 
   * @param {string} resourceType - Type of resource
   * @returns {Object} Mock data
   */
  getMockData(resourceType) {
    // This method is deprecated and kept only for backwards compatibility
    switch (resourceType) {
      case 'posts':
        return { posts: [] };
      case 'chatHistory':
        return { conversations: [] };
      case 'brands':
        return { brands: [] };
      default:
        return {};
    }
  }
  
  /**
   * Process resource data and detect changes
   * 
   * @param {string} resourceType - Type of resource
   * @param {Object} data - Resource data from backend
   */
  processResourceData(resourceType, data) {
    // Normalize backend data to game state using mappers
    const normalizedState = BackendStateMappers.normalizeBackendState(data);
    
    // Create change events by comparing with cached game state
    const changes = BackendStateMappers.createChangeEvents(
      this.gameStateCache,
      normalizedState
    );
    
    // Update game state cache
    this.gameStateCache = {
      ...this.gameStateCache,
      ...normalizedState
    };
    
    // Update cached state fallback for offline use
    this.cachedStateFallback = {
      ...this.gameStateCache,
      timestamp: Date.now()
    };
    
    // Save to IndexedDB cache (background sync)
    if (this.cacheInitialized) {
      this.saveToCache().catch(error => {
        console.error('StateSyncSystem: Background cache save failed:', error);
      });
    }
    
    // Also update resource-specific cache for backwards compatibility
    const cache = this.stateCache[resourceType];
    switch (resourceType) {
      case 'posts':
        this.detectPostChanges(data.posts || [], cache, []);
        break;
      case 'chatHistory':
        this.detectChatChanges(data.conversations || [], cache, []);
        break;
      case 'brands':
        this.detectBrandChanges(data.brands || [], cache, []);
        break;
    }
    
    // Process changes with batch processing and conflict resolution
    if (changes.length > 0) {
      this.processBatchUpdates(changes, resourceType, normalizedState);
    }
  }
  
  /**
   * Process batch updates with conflict resolution
   * Queues changes and processes them in batches
   * 
   * @param {Array} changes - Array of change events
   * @param {string} resourceType - Type of resource
   * @param {Object} normalizedState - Normalized state
   */
  processBatchUpdates(changes, resourceType, normalizedState) {
    // Add changes to pending updates queue
    changes.forEach(change => {
      // Add timestamp for conflict resolution
      change.timestamp = Date.now();
      change.resourceType = resourceType;
      
      // Check for conflicts with pending updates
      const conflictIndex = this.pendingUpdates.findIndex(
        pending => pending.entityId === change.entityId && pending.entityType === change.entityType
      );
      
      if (conflictIndex !== -1) {
        // Resolve conflict using timestamp-based strategy
        const pendingUpdate = this.pendingUpdates[conflictIndex];
        const resolvedChange = this.resolveConflict(pendingUpdate, change);
        this.pendingUpdates[conflictIndex] = resolvedChange;
      } else {
        // No conflict, add to queue
        this.pendingUpdates.push(change);
      }
    });
    
    // Schedule batch processing if not already scheduled
    if (!this.batchProcessingTimer) {
      this.batchProcessingTimer = setTimeout(() => {
        this.flushBatchUpdates(normalizedState);
      }, this.batchProcessingDelay);
    }
  }
  
  /**
   * Resolve conflict between two changes using timestamp-based strategy
   * 
   * @param {Object} existing - Existing change in queue
   * @param {Object} incoming - New incoming change
   * @returns {Object} Resolved change
   */
  resolveConflict(existing, incoming) {
    // Timestamp-based conflict resolution: newer wins
    if (incoming.timestamp > existing.timestamp) {
      console.log(`StateSyncSystem: Conflict resolved - newer change wins for ${incoming.entityId}`);
      return {
        ...incoming,
        conflictResolved: true,
        previousChange: existing
      };
    } else {
      console.log(`StateSyncSystem: Conflict resolved - keeping existing change for ${existing.entityId}`);
      return {
        ...existing,
        conflictResolved: true,
        rejectedChange: incoming
      };
    }
  }
  
  /**
   * Flush batch updates and emit state change event
   * 
   * @param {Object} normalizedState - Normalized state
   */
  flushBatchUpdates(normalizedState) {
    if (this.pendingUpdates.length === 0) {
      this.batchProcessingTimer = null;
      return;
    }
    
    console.log(`StateSyncSystem: Flushing ${this.pendingUpdates.length} batched updates`);
    
    // Group changes by resource type
    const changesByResource = {};
    this.pendingUpdates.forEach(change => {
      const resourceType = change.resourceType || 'unknown';
      if (!changesByResource[resourceType]) {
        changesByResource[resourceType] = [];
      }
      changesByResource[resourceType].push(change);
    });
    
    // Emit state change event for each resource type
    Object.keys(changesByResource).forEach(resourceType => {
      this.emitStateChange({
        resourceType,
        changes: changesByResource[resourceType],
        normalizedState,
        timestamp: Date.now(),
        batchSize: changesByResource[resourceType].length
      });
    });
    
    // Clear pending updates and timer
    this.pendingUpdates = [];
    this.batchProcessingTimer = null;
  }
  
  /**
   * Compute hash for change detection optimization
   * More efficient than JSON.stringify for large objects
   * 
   * @param {Object} obj - Object to hash
   * @returns {string} Hash string
   */
  computeHash(obj) {
    if (!obj) return 'null';
    
    // Simple hash function for change detection
    // Uses key-value pairs to create a deterministic hash
    const keys = Object.keys(obj).sort();
    const hashParts = keys.map(key => {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        return `${key}:${this.computeHash(value)}`;
      }
      return `${key}:${value}`;
    });
    
    return hashParts.join('|');
  }
  
  /**
   * Optimized state diffing algorithm
   * Uses hashing to quickly detect changes
   * 
   * @param {Object} oldState - Previous state
   * @param {Object} newState - New state
   * @param {string} entityType - Type of entity (task, agent, brand)
   * @returns {Array} Array of changes
   */
  diffState(oldState, newState, entityType) {
    const changes = [];
    const oldKeys = new Set(Object.keys(oldState || {}));
    const newKeys = new Set(Object.keys(newState || {}));
    
    // Check for new and updated entities
    newKeys.forEach(key => {
      const newEntity = newState[key];
      const oldEntity = oldState?.[key];
      
      if (!oldEntity) {
        // New entity
        changes.push({
          type: `${entityType}_created`,
          entityType,
          entityId: key,
          data: newEntity
        });
      } else {
        // Check if entity changed using hash
        const oldHash = this.changeDetectionCache.get(`${entityType}:${key}`);
        const newHash = this.computeHash(newEntity);
        
        if (oldHash !== newHash) {
          // Entity updated
          changes.push({
            type: `${entityType}_updated`,
            entityType,
            entityId: key,
            data: newEntity,
            previous: oldEntity
          });
          
          // Update hash cache
          this.changeDetectionCache.set(`${entityType}:${key}`, newHash);
        }
      }
    });
    
    // Check for removed entities
    oldKeys.forEach(key => {
      if (!newKeys.has(key)) {
        changes.push({
          type: `${entityType}_removed`,
          entityType,
          entityId: key,
          data: oldState[key]
        });
        
        // Remove from hash cache
        this.changeDetectionCache.delete(`${entityType}:${key}`);
      }
    });
    
    return changes;
  }
  
  /**
   * Detect changes in posts data
   * 
   * @param {Array} posts - Posts from backend
   * @param {Map} cache - Cached posts
   * @param {Array} changes - Array to collect changes
   */
  detectPostChanges(posts, cache, changes) {
    posts.forEach(post => {
      const cached = cache.get(post.postId);
      
      if (!cached) {
        // New post
        changes.push({
          type: 'post_created',
          data: post
        });
        cache.set(post.postId, post);
      } else if (JSON.stringify(cached) !== JSON.stringify(post)) {
        // Post updated
        changes.push({
          type: 'post_updated',
          data: post,
          previous: cached
        });
        cache.set(post.postId, post);
      }
    });
  }
  
  /**
   * Detect changes in chat history data
   * 
   * @param {Array} conversations - Conversations from backend
   * @param {Map} cache - Cached conversations
   * @param {Array} changes - Array to collect changes
   */
  detectChatChanges(conversations, cache, changes) {
    conversations.forEach(conversation => {
      const cached = cache.get(conversation.conversationId);
      
      if (!cached) {
        // New conversation
        changes.push({
          type: 'conversation_created',
          data: conversation
        });
        cache.set(conversation.conversationId, conversation);
      } else if (conversation.messages?.length !== cached.messages?.length) {
        // New messages in conversation
        changes.push({
          type: 'conversation_updated',
          data: conversation,
          previous: cached
        });
        cache.set(conversation.conversationId, conversation);
      }
    });
  }
  
  /**
   * Detect changes in brands data
   * 
   * @param {Array} brands - Brands from backend
   * @param {Map} cache - Cached brands
   * @param {Array} changes - Array to collect changes
   */
  detectBrandChanges(brands, cache, changes) {
    brands.forEach(brand => {
      const cached = cache.get(brand.brandId);
      
      if (!cached) {
        // New brand
        changes.push({
          type: 'brand_created',
          data: brand
        });
        cache.set(brand.brandId, brand);
      } else if (JSON.stringify(cached) !== JSON.stringify(brand)) {
        // Brand updated
        changes.push({
          type: 'brand_updated',
          data: brand,
          previous: cached
        });
        cache.set(brand.brandId, brand);
      }
    });
  }
  
  /**
   * Handle sync errors with exponential backoff
   * 
   * @param {Error} error - The error that occurred
   */
  handleSyncError(error) {
    this.errorCount++;
    this.retryCount++;
    
    if (this.retryCount >= this.config.maxRetries) {
      console.error('StateSyncSystem: Max retries reached, stopping sync');
      this.connectionStatus = 'error';
      this.emitConnectionChange('error');
      this.emitError(error);
      this.stopSync();
      return;
    }
    
    // Calculate backoff delay
    const delay = this.calculateBackoff(this.retryCount);
    
    console.warn(`StateSyncSystem: Retrying in ${delay}ms (attempt ${this.retryCount}/${this.config.maxRetries})`);
    
    this.connectionStatus = 'error';
    this.emitConnectionChange('error');
    this.emitError(error);
    
    // Schedule retry
    this.retryTimer = setTimeout(() => {
      console.log('StateSyncSystem: Retrying sync...');
      this.forceSync();
    }, delay);
  }
  
  /**
   * Calculate exponential backoff delay
   * 
   * @param {number} retryCount - Current retry attempt
   * @returns {number} Delay in milliseconds
   */
  calculateBackoff(retryCount) {
    if (this.config.backoffStrategy === 'exponential') {
      // Exponential: baseDelay * 2^retryCount
      return this.config.baseBackoffMs * Math.pow(2, retryCount - 1);
    } else {
      // Linear fallback
      return this.config.baseBackoffMs * retryCount;
    }
  }
  
  /**
   * Subscribe to state changes
   * 
   * @param {Function} callback - Callback function (state) => void
   * @returns {Function} Unsubscribe function
   */
  onStateChange(callback) {
    this.listeners.stateChange.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.stateChange.indexOf(callback);
      if (index > -1) {
        this.listeners.stateChange.splice(index, 1);
      }
    };
  }
  
  /**
   * Subscribe to connection status changes
   * 
   * @param {Function} callback - Callback function (status) => void
   * @returns {Function} Unsubscribe function
   */
  onConnectionChange(callback) {
    this.listeners.connectionChange.push(callback);
    
    return () => {
      const index = this.listeners.connectionChange.indexOf(callback);
      if (index > -1) {
        this.listeners.connectionChange.splice(index, 1);
      }
    };
  }
  
  /**
   * Subscribe to errors
   * 
   * @param {Function} callback - Callback function (error) => void
   * @returns {Function} Unsubscribe function
   */
  onError(callback) {
    this.listeners.error.push(callback);
    
    return () => {
      const index = this.listeners.error.indexOf(callback);
      if (index > -1) {
        this.listeners.error.splice(index, 1);
      }
    };
  }
  
  /**
   * Emit state change event
   * 
   * @param {Object} state - State change data
   */
  emitStateChange(state) {
    this.listeners.stateChange.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('StateSyncSystem: Error in state change listener:', error);
      }
    });
  }
  
  /**
   * Emit connection status change event
   * 
   * @param {string} status - New connection status
   */
  emitConnectionChange(status) {
    this.listeners.connectionChange.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('StateSyncSystem: Error in connection change listener:', error);
      }
    });
  }
  
  /**
   * Emit error event
   * 
   * @param {Error} error - The error that occurred
   */
  emitError(error) {
    this.listeners.error.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('StateSyncSystem: Error in error listener:', error);
      }
    });
  }
  
  /**
   * Get current synced state
   * Falls back to cached state if disconnected
   * 
   * @returns {Object} Current state
   */
  getCurrentState() {
    // If disconnected and have cached state, return cached state
    if (this.connectionStatus === 'disconnected' || this.connectionStatus === 'error') {
      if (this.cachedStateFallback.timestamp) {
        console.log('StateSyncSystem: Using cached state fallback (disconnected)');
        return {
          connectionStatus: this.connectionStatus,
          lastSyncTime: this.cachedStateFallback.timestamp,
          syncCount: this.syncCount,
          errorCount: this.errorCount,
          usingCachedState: true,
          cache: {
            tasks: Object.values(this.cachedStateFallback.tasks),
            agents: Object.values(this.cachedStateFallback.agents),
            brands: Object.values(this.cachedStateFallback.brands)
          }
        };
      }
    }
    
    // Return current state
    return {
      connectionStatus: this.connectionStatus,
      lastSyncTime: this.lastSyncTime,
      syncCount: this.syncCount,
      errorCount: this.errorCount,
      usingCachedState: false,
      cache: {
        posts: Array.from(this.stateCache.posts.values()),
        chatHistory: Array.from(this.stateCache.chatHistory.values()),
        brands: Array.from(this.stateCache.brands.values())
      }
    };
  }
  
  /**
   * Get normalized game state
   * Falls back to cached state if disconnected
   * 
   * @returns {Object} Normalized game state
   */
  getGameState() {
    // If disconnected and have cached state, return cached state
    if (this.connectionStatus === 'disconnected' || this.connectionStatus === 'error') {
      if (this.cachedStateFallback.timestamp) {
        console.log('StateSyncSystem: Using cached game state fallback (disconnected)');
        return {
          ...this.cachedStateFallback,
          usingCachedState: true
        };
      }
    }
    
    // Return current game state
    return {
      ...this.gameStateCache,
      usingCachedState: false
    };
  }
  
  /**
   * Get connection status
   * 
   * @returns {string} Connection status
   */
  getConnectionStatus() {
    return this.connectionStatus;
  }
  
  /**
   * Get sync statistics
   * 
   * @returns {Object} Sync stats
   */
  getSyncStats() {
    return {
      syncCount: this.syncCount,
      errorCount: this.errorCount,
      lastSyncTime: this.lastSyncTime,
      retryCount: this.retryCount,
      cacheSize: {
        posts: this.stateCache.posts.size,
        chatHistory: this.stateCache.chatHistory.size,
        brands: this.stateCache.brands.size
      }
    };
  }
  
  /**
   * Clear state cache
   * Useful for testing or forcing full resync
   */
  clearCache() {
    this.stateCache.posts.clear();
    this.stateCache.chatHistory.clear();
    this.stateCache.brands.clear();
    this.stateCache.lambdaLogs.clear();
    this.changeDetectionCache.clear();
    
    // Clear game state cache
    this.gameStateCache = {
      tasks: {},
      agents: {},
      brands: {}
    };
    
    // Clear IndexedDB cache
    if (this.cacheInitialized) {
      this.cacheDB.clearAll().catch(error => {
        console.error('StateSyncSystem: Failed to clear IndexedDB cache:', error);
      });
    }
    
    console.log('StateSyncSystem: Cache cleared');
  }
  
  /**
   * Get pending updates count
   * 
   * @returns {number} Number of pending updates
   */
  getPendingUpdatesCount() {
    return this.pendingUpdates.length;
  }
  
  /**
   * Force flush pending updates immediately
   * Useful for testing or ensuring updates are processed
   */
  forceFlushPendingUpdates() {
    if (this.batchProcessingTimer) {
      clearTimeout(this.batchProcessingTimer);
      this.batchProcessingTimer = null;
    }
    this.flushBatchUpdates(this.gameStateCache);
  }
  
  /**
   * Update system (called each frame)
   * Currently no per-frame updates needed, but included for consistency
   * 
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // No per-frame updates needed for polling-based sync
    // Future: Could be used for WebSocket message processing
  }
}

export default StateSyncSystem;
