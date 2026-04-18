/**
 * ObjectPool - Generic object pooling for performance optimization
 * 
 * Provides reusable object pools to avoid frequent allocation/deallocation
 * which can cause garbage collection pauses and performance issues.
 * 
 * Requirements: 9.2
 * Phase 9, Task 52
 */

/**
 * ObjectPool class - Generic object pool implementation
 * 
 * @template T - Type of objects in the pool
 */
class ObjectPool {
  /**
   * Create a new object pool
   * 
   * @param {Function} factory - Function that creates new objects
   * @param {Function} reset - Function that resets objects to initial state
   * @param {number} initialSize - Initial pool size
   * @param {number} maxSize - Maximum pool size (optional, defaults to initialSize * 2)
   */
  constructor(factory, reset, initialSize = 10, maxSize = null) {
    this.factory = factory;
    this.reset = reset;
    this.initialSize = initialSize;
    this.maxSize = maxSize || initialSize * 2;
    
    // Pool storage
    this.available = [];
    this.inUse = new Set();
    
    // Statistics
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      destroyed: 0,
      peakUsage: 0
    };
    
    // Pre-allocate initial objects
    this.preallocate(initialSize);
  }
  
  /**
   * Pre-allocate objects to fill the pool
   * 
   * @param {number} count - Number of objects to create
   * @private
   */
  preallocate(count) {
    for (let i = 0; i < count; i++) {
      const obj = this.factory();
      this.available.push(obj);
      this.stats.created++;
    }
  }
  
  /**
   * Acquire an object from the pool
   * 
   * @returns {T} Object from pool (either reused or newly created)
   */
  acquire() {
    let obj;
    
    // Try to reuse an available object
    if (this.available.length > 0) {
      obj = this.available.pop();
    } else {
      // Create new object if pool is empty and under max size
      if (this.inUse.size < this.maxSize) {
        obj = this.factory();
        this.stats.created++;
      } else {
        // Pool exhausted and at max size
        console.warn(`ObjectPool exhausted: ${this.inUse.size}/${this.maxSize} objects in use`);
        return null;
      }
    }
    
    // Track as in-use
    this.inUse.add(obj);
    this.stats.acquired++;
    
    // Update peak usage
    if (this.inUse.size > this.stats.peakUsage) {
      this.stats.peakUsage = this.inUse.size;
    }
    
    return obj;
  }
  
  /**
   * Release an object back to the pool
   * 
   * @param {T} obj - Object to release
   */
  release(obj) {
    if (!obj) return;
    
    // Check if object is actually in use
    if (!this.inUse.has(obj)) {
      console.warn('Attempting to release object not acquired from pool');
      return;
    }
    
    // Remove from in-use tracking
    this.inUse.delete(obj);
    
    // Reset object to initial state
    if (this.reset) {
      this.reset(obj);
    }
    
    // Return to available pool if under max size
    if (this.available.length + this.inUse.size < this.maxSize) {
      this.available.push(obj);
      this.stats.released++;
    } else {
      // Pool is full, destroy the object
      this.stats.destroyed++;
    }
  }
  
  /**
   * Release all in-use objects back to the pool
   */
  releaseAll() {
    const inUseArray = Array.from(this.inUse);
    
    for (const obj of inUseArray) {
      this.release(obj);
    }
  }
  
  /**
   * Clear the pool and destroy all objects
   */
  clear() {
    // Release all in-use objects
    this.releaseAll();
    
    // Clear available objects
    this.available = [];
    
    // Reset statistics
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      destroyed: 0,
      peakUsage: 0
    };
  }
  
  /**
   * Get pool statistics
   * 
   * @returns {Object} Pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
      maxSize: this.maxSize
    };
  }
  
  /**
   * Get current pool size
   * 
   * @returns {number} Total number of objects (available + in-use)
   */
  size() {
    return this.available.length + this.inUse.size;
  }
  
  /**
   * Get number of available objects
   * 
   * @returns {number} Number of available objects
   */
  availableCount() {
    return this.available.length;
  }
  
  /**
   * Get number of in-use objects
   * 
   * @returns {number} Number of in-use objects
   */
  inUseCount() {
    return this.inUse.size;
  }
  
  /**
   * Check if pool is exhausted
   * 
   * @returns {boolean} True if no objects available and at max size
   */
  isExhausted() {
    return this.available.length === 0 && this.inUse.size >= this.maxSize;
  }
  
  /**
   * Resize the pool
   * 
   * @param {number} newSize - New maximum pool size
   */
  resize(newSize) {
    if (newSize < this.inUse.size) {
      console.warn(`Cannot resize pool below current in-use count: ${this.inUse.size}`);
      return;
    }
    
    this.maxSize = newSize;
    
    // Trim available objects if over new max
    while (this.available.length + this.inUse.size > newSize) {
      this.available.pop();
      this.stats.destroyed++;
    }
  }
}

export default ObjectPool;
