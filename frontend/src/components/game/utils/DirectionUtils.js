/**
 * DirectionUtils.js - Direction Calculation Utilities
 * 
 * Provides utilities for calculating character facing direction from velocity vectors.
 * Supports 8-directional movement with smoothing to prevent rapid direction changes.
 * 
 * Phase 3, Task 3.2: Direction Calculation System
 */

/**
 * 8 cardinal and intercardinal directions
 */
export const Direction = {
  NORTH: 'N',
  NORTH_EAST: 'NE',
  EAST: 'E',
  SOUTH_EAST: 'SE',
  SOUTH: 'S',
  SOUTH_WEST: 'SW',
  WEST: 'W',
  NORTH_WEST: 'NW'
};

/**
 * Direction array ordered by angle (0 = East, counterclockwise)
 */
export const DIRECTIONS = [
  Direction.EAST,        // 0°
  Direction.NORTH_EAST,  // 45°
  Direction.NORTH,       // 90°
  Direction.NORTH_WEST,  // 135°
  Direction.WEST,        // 180°
  Direction.SOUTH_WEST,  // 225°
  Direction.SOUTH,       // 270°
  Direction.SOUTH_EAST   // 315°
];

/**
 * Direction angles in radians (for reverse lookup)
 */
const DIRECTION_ANGLES = {
  [Direction.EAST]: 0,
  [Direction.NORTH_EAST]: Math.PI / 4,
  [Direction.NORTH]: Math.PI / 2,
  [Direction.NORTH_WEST]: 3 * Math.PI / 4,
  [Direction.WEST]: Math.PI,
  [Direction.SOUTH_WEST]: -3 * Math.PI / 4,
  [Direction.SOUTH]: -Math.PI / 2,
  [Direction.SOUTH_EAST]: -Math.PI / 4
};

/**
 * Calculate direction from velocity vector
 * @param {number} vx - Velocity X component
 * @param {number} vy - Velocity Y component
 * @returns {string} Direction constant (e.g., Direction.NORTH)
 */
export function calculateDirection(vx, vy) {
  // Handle zero velocity (no movement)
  if (vx === 0 && vy === 0) {
    return null;
  }
  
  // Calculate angle from velocity vector
  // atan2 returns angle in radians from -PI to PI
  // 0 = East, PI/2 = South (in screen coordinates where Y increases downward)
  const angle = Math.atan2(vy, vx);
  
  // Convert angle to direction index (0-7)
  // Add PI to normalize to 0-2PI range, then divide by sector size
  const sectorSize = (Math.PI * 2) / 8;
  const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
  const sectorIndex = Math.round(normalizedAngle / sectorSize) % 8;
  
  return DIRECTIONS[sectorIndex];
}

/**
 * Calculate direction from two positions
 * @param {Object} from - Starting position {x, y}
 * @param {Object} to - Target position {x, y}
 * @returns {string} Direction constant
 */
export function calculateDirectionFromPositions(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  return calculateDirection(dx, dy);
}

/**
 * Get angle in radians for a direction
 * @param {string} direction - Direction constant
 * @returns {number} Angle in radians
 */
export function getDirectionAngle(direction) {
  return DIRECTION_ANGLES[direction] || 0;
}

/**
 * Calculate angular distance between two directions
 * Returns the shortest angular distance in radians
 * @param {string} from - Starting direction
 * @param {string} to - Target direction
 * @returns {number} Angular distance in radians (0 to PI)
 */
export function getAngularDistance(from, to) {
  const angle1 = getDirectionAngle(from);
  const angle2 = getDirectionAngle(to);
  
  let diff = Math.abs(angle2 - angle1);
  
  // Normalize to shortest path
  if (diff > Math.PI) {
    diff = Math.PI * 2 - diff;
  }
  
  return diff;
}

/**
 * DirectionSmoother - Prevents rapid direction switching
 * 
 * Implements hysteresis to smooth direction changes:
 * - Requires velocity to be above threshold to change direction
 * - Requires new direction to be maintained for minimum duration
 * - Prevents flickering between adjacent directions
 */
export class DirectionSmoother {
  constructor(options = {}) {
    /**
     * Minimum velocity magnitude to trigger direction change (pixels/second)
     */
    this.velocityThreshold = options.velocityThreshold || 10;
    
    /**
     * Minimum time to hold new direction before committing (milliseconds)
     */
    this.directionHoldTime = options.directionHoldTime || 100;
    
    /**
     * Minimum angular distance to trigger direction change (radians)
     */
    this.angularThreshold = options.angularThreshold || Math.PI / 8; // 22.5 degrees
    
    /**
     * Current committed direction
     */
    this.currentDirection = Direction.SOUTH;
    
    /**
     * Pending direction (being evaluated)
     */
    this.pendingDirection = null;
    
    /**
     * Time when pending direction started (milliseconds)
     */
    this.pendingStartTime = 0;
    
    /**
     * Last update timestamp
     */
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Update direction based on velocity
   * @param {number} vx - Velocity X component
   * @param {number} vy - Velocity Y component
   * @param {number} deltaTime - Time since last update (milliseconds)
   * @returns {string} Current direction
   */
  update(vx, vy, deltaTime = 0) {
    const now = Date.now();
    
    // Calculate velocity magnitude
    const velocityMagnitude = Math.sqrt(vx * vx + vy * vy);
    
    // If velocity is below threshold, keep current direction
    if (velocityMagnitude < this.velocityThreshold) {
      this.pendingDirection = null;
      this.lastUpdateTime = now;
      return this.currentDirection;
    }
    
    // Calculate new direction from velocity
    const newDirection = calculateDirection(vx, vy);
    
    if (!newDirection) {
      this.lastUpdateTime = now;
      return this.currentDirection;
    }
    
    // If new direction matches current, clear pending
    if (newDirection === this.currentDirection) {
      this.pendingDirection = null;
      this.lastUpdateTime = now;
      return this.currentDirection;
    }
    
    // Check angular distance to current direction
    const angularDistance = getAngularDistance(this.currentDirection, newDirection);
    
    // If angular distance is small, don't change (prevents micro-adjustments)
    if (angularDistance < this.angularThreshold) {
      this.lastUpdateTime = now;
      return this.currentDirection;
    }
    
    // If this is a new pending direction, start tracking it
    if (newDirection !== this.pendingDirection) {
      this.pendingDirection = newDirection;
      this.pendingStartTime = now;
      this.lastUpdateTime = now;
      return this.currentDirection;
    }
    
    // Check if pending direction has been held long enough
    const holdDuration = now - this.pendingStartTime;
    
    if (holdDuration >= this.directionHoldTime) {
      // Commit to new direction
      this.currentDirection = newDirection;
      this.pendingDirection = null;
    }
    
    this.lastUpdateTime = now;
    return this.currentDirection;
  }
  
  /**
   * Force set direction (bypasses smoothing)
   * @param {string} direction - Direction to set
   */
  setDirection(direction) {
    this.currentDirection = direction;
    this.pendingDirection = null;
    this.pendingStartTime = 0;
  }
  
  /**
   * Get current direction
   * @returns {string} Current direction
   */
  getDirection() {
    return this.currentDirection;
  }
  
  /**
   * Reset smoother to initial state
   * @param {string} initialDirection - Optional initial direction
   */
  reset(initialDirection = Direction.SOUTH) {
    this.currentDirection = initialDirection;
    this.pendingDirection = null;
    this.pendingStartTime = 0;
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Get smoother state for debugging
   * @returns {Object}
   */
  getState() {
    return {
      currentDirection: this.currentDirection,
      pendingDirection: this.pendingDirection,
      pendingDuration: this.pendingDirection 
        ? Date.now() - this.pendingStartTime 
        : 0,
      velocityThreshold: this.velocityThreshold,
      directionHoldTime: this.directionHoldTime,
      angularThreshold: this.angularThreshold
    };
  }
}

/**
 * Get opposite direction
 * @param {string} direction - Direction constant
 * @returns {string} Opposite direction
 */
export function getOppositeDirection(direction) {
  const opposites = {
    [Direction.NORTH]: Direction.SOUTH,
    [Direction.NORTH_EAST]: Direction.SOUTH_WEST,
    [Direction.EAST]: Direction.WEST,
    [Direction.SOUTH_EAST]: Direction.NORTH_WEST,
    [Direction.SOUTH]: Direction.NORTH,
    [Direction.SOUTH_WEST]: Direction.NORTH_EAST,
    [Direction.WEST]: Direction.EAST,
    [Direction.NORTH_WEST]: Direction.SOUTH_EAST
  };
  
  return opposites[direction] || direction;
}

/**
 * Get adjacent directions (clockwise and counterclockwise)
 * @param {string} direction - Direction constant
 * @returns {Object} {clockwise, counterclockwise}
 */
export function getAdjacentDirections(direction) {
  const index = DIRECTIONS.indexOf(direction);
  
  if (index === -1) {
    return { clockwise: direction, counterclockwise: direction };
  }
  
  const clockwiseIndex = (index + 1) % 8;
  const counterclockwiseIndex = (index - 1 + 8) % 8;
  
  return {
    clockwise: DIRECTIONS[clockwiseIndex],
    counterclockwise: DIRECTIONS[counterclockwiseIndex]
  };
}

/**
 * Check if two directions are adjacent
 * @param {string} dir1 - First direction
 * @param {string} dir2 - Second direction
 * @returns {boolean} True if directions are adjacent
 */
export function areDirectionsAdjacent(dir1, dir2) {
  const adjacent = getAdjacentDirections(dir1);
  return dir2 === adjacent.clockwise || dir2 === adjacent.counterclockwise;
}

/**
 * Get unit vector for a direction
 * @param {string} direction - Direction constant
 * @returns {Object} {x, y} unit vector
 */
export function getDirectionVector(direction) {
  const angle = getDirectionAngle(direction);
  return {
    x: Math.cos(angle),
    y: Math.sin(angle)
  };
}

/**
 * Interpolate between two directions
 * @param {string} from - Starting direction
 * @param {string} to - Target direction
 * @param {number} t - Interpolation factor (0-1)
 * @returns {string} Interpolated direction
 */
export function interpolateDirection(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  
  const fromIndex = DIRECTIONS.indexOf(from);
  const toIndex = DIRECTIONS.indexOf(to);
  
  if (fromIndex === -1 || toIndex === -1) {
    return from;
  }
  
  // Calculate shortest path
  let diff = toIndex - fromIndex;
  if (Math.abs(diff) > 4) {
    // Wrap around
    diff = diff > 0 ? diff - 8 : diff + 8;
  }
  
  const interpolatedIndex = Math.round(fromIndex + diff * t);
  const normalizedIndex = (interpolatedIndex + 8) % 8;
  
  return DIRECTIONS[normalizedIndex];
}

export default {
  Direction,
  DIRECTIONS,
  calculateDirection,
  calculateDirectionFromPositions,
  getDirectionAngle,
  getAngularDistance,
  DirectionSmoother,
  getOppositeDirection,
  getAdjacentDirections,
  areDirectionsAdjacent,
  getDirectionVector,
  interpolateDirection
};
