/**
 * MovementSystem Class - Handles agent movement and pathfinding
 * 
 * Implements:
 * - A* pathfinding algorithm for navigation
 * - Collision detection and avoidance
 * - Smooth movement with tweening
 * - Walkability checking for grid cells
 * - Animation integration (Phase 3, Task 3.5)
 * 
 * Requirements: 3.2, 3.3, 3.5
 * Phase 3, Task 13, Task 3.5
 * 
 * Enhanced for Task 3.5:
 * - Triggers walking animation on movement start
 * - Updates direction based on movement velocity
 * - Returns to idle animation when stopped
 * - Smooth animation transitions
 */

/**
 * Priority Queue implementation for A* pathfinding
 * Uses binary heap for O(log n) insert and extract-min
 */
class PriorityQueue {
  constructor() {
    this.heap = [];
  }
  
  enqueue(item, priority) {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }
  
  dequeue() {
    if (this.isEmpty()) return null;
    
    const min = this.heap[0];
    const last = this.heap.pop();
    
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    
    return min.item;
  }
  
  isEmpty() {
    return this.heap.length === 0;
  }
  
  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      
      if (this.heap[index].priority >= this.heap[parentIndex].priority) {
        break;
      }
      
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }
  
  bubbleDown(index) {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;
      
      if (leftChild < this.heap.length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }
      
      if (rightChild < this.heap.length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }
      
      if (smallest === index) {
        break;
      }
      
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

/**
 * MovementSystem - Manages entity movement and pathfinding
 */
class MovementSystem {
  constructor(entityRegistry, animationSystem = null, gridSize = 64) {
    this.entityRegistry = entityRegistry;
    this.animationSystem = animationSystem; // Optional AnimationSystem for animation integration
    this.gridSize = gridSize; // Size of each grid cell in pixels
    
    // Grid dimensions (calculated from world bounds)
    this.gridWidth = Math.ceil(2000 / gridSize); // 32 cells
    this.gridHeight = Math.ceil(1500 / gridSize); // 24 cells
    
    // Walkability grid (true = walkable, false = blocked)
    this.walkabilityGrid = this.initializeWalkabilityGrid();
    
    // Moving entities (entityId -> movement state)
    this.movingEntities = new Map();
    
    // Movement speed (pixels per second)
    this.defaultSpeed = 100;
    
    // Velocity tracking for direction updates (entityId -> {vx, vy})
    this.entityVelocities = new Map();
  }
  
  /**
   * Initialize walkability grid
   * All cells start as walkable, will be updated based on environment entities
   */
  initializeWalkabilityGrid() {
    const grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        grid[y][x] = true; // All cells walkable by default
      }
    }
    return grid;
  }
  
  /**
   * Update walkability grid based on environment entities
   * Should be called when environment entities are added/removed
   */
  updateWalkabilityGrid() {
    // Reset grid
    this.walkabilityGrid = this.initializeWalkabilityGrid();
    
    // Mark cells occupied by blocking environment entities
    const environmentEntities = this.entityRegistry.getEntitiesByType('environment');
    
    environmentEntities.forEach(entity => {
      const position = entity.getComponent('position');
      if (!position) return;
      
      // Check if entity blocks movement
      const metadata = entity.metadata;
      if (metadata && metadata.blocksMovement) {
        // Mark grid cells as unwalkable
        const gridX = Math.floor(position.x / this.gridSize);
        const gridY = Math.floor(position.y / this.gridSize);
        
        // Mark the cell and adjacent cells based on entity size
        const size = metadata.size || { width: 1, height: 1 };
        const cellsWidth = Math.ceil(size.width);
        const cellsHeight = Math.ceil(size.height);
        
        for (let dy = 0; dy < cellsHeight; dy++) {
          for (let dx = 0; dx < cellsWidth; dx++) {
            const cx = gridX + dx;
            const cy = gridY + dy;
            
            if (this.isValidGridCell(cx, cy)) {
              this.walkabilityGrid[cy][cx] = false;
            }
          }
        }
      }
    });
  }
  
  /**
   * Check if a grid cell is valid (within bounds)
   */
  isValidGridCell(gridX, gridY) {
    return gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight;
  }
  
  /**
   * Check if a position is walkable
   * @param {object} position - Position {x, y} in world coordinates
   * @returns {boolean} True if walkable
   */
  isWalkable(position) {
    const gridX = Math.floor(position.x / this.gridSize);
    const gridY = Math.floor(position.y / this.gridSize);
    
    if (!this.isValidGridCell(gridX, gridY)) {
      return false;
    }
    
    return this.walkabilityGrid[gridY][gridX];
  }
  
  /**
   * Convert world coordinates to grid coordinates
   */
  worldToGrid(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.gridSize),
      y: Math.floor(worldY / this.gridSize)
    };
  }
  
  /**
   * Convert grid coordinates to world coordinates (center of cell)
   */
  gridToWorld(gridX, gridY) {
    return {
      x: gridX * this.gridSize + this.gridSize / 2,
      y: gridY * this.gridSize + this.gridSize / 2
    };
  }
  
  /**
   * Calculate Manhattan distance between two grid cells
   */
  manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
  
  /**
   * Calculate Euclidean distance between two points
   */
  euclideanDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Get neighbors of a grid cell (4-directional)
   */
  getNeighbors(gridX, gridY) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }  // West
    ];
    
    directions.forEach(dir => {
      const nx = gridX + dir.x;
      const ny = gridY + dir.y;
      
      if (this.isValidGridCell(nx, ny) && this.walkabilityGrid[ny][nx]) {
        neighbors.push({ x: nx, y: ny });
      }
    });
    
    return neighbors;
  }
  
  /**
   * Find path between two positions using A* pathfinding
   * @param {object} start - Start position {x, y} in world coordinates
   * @param {object} end - End position {x, y} in world coordinates
   * @returns {Array} Array of positions {x, y} in world coordinates, or empty array if no path
   */
  findPath(start, end) {
    // Convert to grid coordinates
    const startGrid = this.worldToGrid(start.x, start.y);
    const endGrid = this.worldToGrid(end.x, end.y);
    
    // Check if start and end are walkable
    if (!this.isValidGridCell(startGrid.x, startGrid.y) || 
        !this.walkabilityGrid[startGrid.y][startGrid.x]) {
      console.warn('Start position is not walkable');
      return [];
    }
    
    if (!this.isValidGridCell(endGrid.x, endGrid.y) || 
        !this.walkabilityGrid[endGrid.y][endGrid.x]) {
      console.warn('End position is not walkable');
      return [];
    }
    
    // A* algorithm
    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const startKey = `${startGrid.x},${startGrid.y}`;
    const endKey = `${endGrid.x},${endGrid.y}`;
    
    gScore.set(startKey, 0);
    fScore.set(startKey, this.manhattanDistance(startGrid, endGrid));
    openSet.enqueue(startGrid, fScore.get(startKey));
    
    while (!openSet.isEmpty()) {
      const current = openSet.dequeue();
      const currentKey = `${current.x},${current.y}`;
      
      // Check if we reached the goal
      if (currentKey === endKey) {
        return this.reconstructPath(cameFrom, current);
      }
      
      closedSet.add(currentKey);
      
      // Check neighbors
      const neighbors = this.getNeighbors(current.x, current.y);
      
      neighbors.forEach(neighbor => {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        if (closedSet.has(neighborKey)) {
          return;
        }
        
        const tentativeGScore = gScore.get(currentKey) + 1;
        
        if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + this.manhattanDistance(neighbor, endGrid));
          openSet.enqueue(neighbor, fScore.get(neighborKey));
        }
      });
    }
    
    // No path found
    console.warn('No path found from', start, 'to', end);
    return [];
  }
  
  /**
   * Reconstruct path from A* came-from map
   */
  reconstructPath(cameFrom, current) {
    const path = [];
    let currentKey = `${current.x},${current.y}`;
    
    // Build path in reverse
    while (cameFrom.has(currentKey)) {
      const worldPos = this.gridToWorld(current.x, current.y);
      path.unshift(worldPos);
      current = cameFrom.get(currentKey);
      currentKey = `${current.x},${current.y}`;
    }
    
    // Add start position
    const worldPos = this.gridToWorld(current.x, current.y);
    path.unshift(worldPos);
    
    return path;
  }
  
  /**
   * Move entity to target position
   * @param {string} entityId - Entity ID
   * @param {object} target - Target position {x, y} in world coordinates
   * @param {number} speed - Optional movement speed (pixels per second)
   * @returns {Promise} Resolves when movement is complete
   */
  moveToPosition(entityId, target, speed = null) {
    return new Promise((resolve, reject) => {
      const entity = this.entityRegistry.getEntity(entityId);
      
      if (!entity) {
        reject(new Error(`Entity ${entityId} not found`));
        return;
      }
      
      const position = entity.getComponent('position');
      
      if (!position) {
        reject(new Error(`Entity ${entityId} has no position component`));
        return;
      }
      
      // Find path
      const path = this.findPath(position, target);
      
      if (path.length === 0) {
        reject(new Error(`No path found to target`));
        return;
      }
      
      // Start movement
      this.movingEntities.set(entityId, {
        path,
        currentWaypoint: 0,
        speed: speed || this.defaultSpeed,
        resolve,
        reject
      });
      
      // Trigger walking animation if AnimationSystem is available (Task 3.5)
      if (this.animationSystem && entity.type === 'agent') {
        this.startWalkingAnimation(entityId);
      }
    });
  }
  
  /**
   * Stop entity movement
   * @param {string} entityId - Entity ID
   */
  stopMovement(entityId) {
    const movementState = this.movingEntities.get(entityId);
    
    if (movementState) {
      movementState.reject(new Error('Movement cancelled'));
      this.movingEntities.delete(entityId);
      
      // Stop walking animation and return to idle (Task 3.5)
      if (this.animationSystem) {
        this.stopWalkingAnimation(entityId);
      }
      
      // Clear velocity
      this.entityVelocities.delete(entityId);
    }
  }
  
  /**
   * Check if entity is currently moving
   * @param {string} entityId - Entity ID
   * @returns {boolean} True if entity is moving
   */
  isMoving(entityId) {
    return this.movingEntities.has(entityId);
  }
  
  /**
   * Update all moving entities
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    const deltaSeconds = deltaTime / 1000;
    
    // Update each moving entity
    for (const [entityId, movementState] of this.movingEntities.entries()) {
      const entity = this.entityRegistry.getEntity(entityId);
      
      if (!entity) {
        this.movingEntities.delete(entityId);
        this.entityVelocities.delete(entityId);
        continue;
      }
      
      const position = entity.getComponent('position');
      
      if (!position) {
        this.movingEntities.delete(entityId);
        this.entityVelocities.delete(entityId);
        continue;
      }
      
      // Store previous position for velocity calculation
      const prevX = position.x;
      const prevY = position.y;
      
      // Get current waypoint
      const waypoint = movementState.path[movementState.currentWaypoint];
      
      if (!waypoint) {
        // Path complete
        movementState.resolve();
        this.movingEntities.delete(entityId);
        
        // Stop walking animation and return to idle (Task 3.5)
        if (this.animationSystem && entity.type === 'agent') {
          this.stopWalkingAnimation(entityId);
        }
        
        // Clear velocity
        this.entityVelocities.delete(entityId);
        continue;
      }
      
      // Calculate direction to waypoint
      const dx = waypoint.x - position.x;
      const dy = waypoint.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if we reached the waypoint
      if (distance < 5) {
        // Move to next waypoint
        movementState.currentWaypoint++;
        
        // Check if path is complete
        if (movementState.currentWaypoint >= movementState.path.length) {
          // Snap to final position
          position.x = waypoint.x;
          position.y = waypoint.y;
          
          movementState.resolve();
          this.movingEntities.delete(entityId);
          
          // Stop walking animation and return to idle (Task 3.5)
          if (this.animationSystem && entity.type === 'agent') {
            this.stopWalkingAnimation(entityId);
          }
          
          // Clear velocity
          this.entityVelocities.delete(entityId);
        }
        
        continue;
      }
      
      // Move towards waypoint
      const moveDistance = movementState.speed * deltaSeconds;
      const ratio = Math.min(moveDistance / distance, 1);
      
      position.x += dx * ratio;
      position.y += dy * ratio;
      
      // Calculate velocity for direction updates (Task 3.5)
      const vx = (position.x - prevX) / deltaSeconds;
      const vy = (position.y - prevY) / deltaSeconds;
      
      // Store velocity
      this.entityVelocities.set(entityId, { vx, vy });
      
      // Update position component with velocity
      if (!position.velocity) {
        position.velocity = { x: 0, y: 0 };
      }
      position.velocity.x = vx;
      position.velocity.y = vy;
      
      // Update entity's position component
      entity.addComponent('position', position);
      
      // Update direction based on movement (Task 3.5)
      if (entity.type === 'agent' && entity.updateDirection) {
        entity.updateDirection(vx, vy, deltaTime);
      }
    }
  }
  
  /**
   * Start walking animation for entity (Task 3.5)
   * @param {string} entityId - Entity ID
   * @private
   */
  startWalkingAnimation(entityId) {
    if (!this.animationSystem) {
      return;
    }
    
    const entity = this.entityRegistry.getEntity(entityId);
    
    if (!entity) {
      return;
    }
    
    // Check if entity has animation component
    const animComponent = entity.getComponent('animation');
    
    if (!animComponent) {
      return;
    }
    
    // Start walking animation with smooth transition
    this.animationSystem.playAnimation(entityId, 'walking', {
      loop: true,
      transitionDuration: 150, // 150ms smooth transition
      restart: false // Don't restart if already walking
    });
  }
  
  /**
   * Stop walking animation and return to idle (Task 3.5)
   * @param {string} entityId - Entity ID
   * @private
   */
  stopWalkingAnimation(entityId) {
    if (!this.animationSystem) {
      return;
    }
    
    const entity = this.entityRegistry.getEntity(entityId);
    
    if (!entity) {
      return;
    }
    
    // Check if entity has animation component
    const animComponent = entity.getComponent('animation');
    
    if (!animComponent) {
      return;
    }
    
    // Return to idle animation with smooth transition
    this.animationSystem.playAnimation(entityId, 'idle', {
      loop: true,
      transitionDuration: 150, // 150ms smooth transition
      restart: false
    });
  }
  
  /**
   * Get movement state for debugging
   * @param {string} entityId - Entity ID
   * @returns {object|null} Movement state or null
   */
  getMovementState(entityId) {
    const state = this.movingEntities.get(entityId);
    
    if (!state) {
      return null;
    }
    
    return {
      pathLength: state.path.length,
      currentWaypoint: state.currentWaypoint,
      speed: state.speed,
      remainingWaypoints: state.path.length - state.currentWaypoint
    };
  }
  
  /**
   * Clear all movement
   */
  clear() {
    // Cancel all movements
    for (const [entityId, movementState] of this.movingEntities.entries()) {
      movementState.reject(new Error('Movement system cleared'));
    }
    
    this.movingEntities.clear();
    this.entityVelocities.clear();
  }
}

export default MovementSystem;
