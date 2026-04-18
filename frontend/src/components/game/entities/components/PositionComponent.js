/**
 * PositionComponent - Spatial data for entities
 * 
 * Stores position, rotation, and scale information for entities in the game world.
 * Uses isometric coordinate system.
 * 
 * Requirements: 2.2, 2.6
 * Phase 2, Task 7
 */

/**
 * Create a position component
 * @param {number} x - X coordinate in world space
 * @param {number} y - Y coordinate in world space
 * @param {number} z - Z coordinate (height/depth) in world space
 * @param {number} rotation - Rotation in degrees (0-360)
 * @param {number} scale - Scale factor (1.0 = normal size)
 * @returns {object} Position component data
 */
export function createPositionComponent(x = 0, y = 0, z = 0, rotation = 0, scale = 1.0) {
  return {
    type: 'position',
    x,
    y,
    z,
    rotation,
    scale
  };
}

/**
 * Update position component
 * @param {object} component - Position component to update
 * @param {object} updates - Updates to apply
 * @returns {object} Updated component
 */
export function updatePositionComponent(component, updates) {
  return {
    ...component,
    ...updates
  };
}

/**
 * Get distance between two position components
 * @param {object} pos1 - First position component
 * @param {object} pos2 - Second position component
 * @returns {number} Distance in world units
 */
export function getDistance(pos1, pos2) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if two positions are within a certain distance
 * @param {object} pos1 - First position component
 * @param {object} pos2 - Second position component
 * @param {number} maxDistance - Maximum distance
 * @returns {boolean} True if within distance
 */
export function isWithinDistance(pos1, pos2, maxDistance) {
  return getDistance(pos1, pos2) <= maxDistance;
}
