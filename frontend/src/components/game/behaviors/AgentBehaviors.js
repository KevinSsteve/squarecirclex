/**
 * Agent Behaviors - High-level agent movement and animation behaviors
 * 
 * Provides behavior functions that combine movement and animation systems
 * to create realistic agent actions like moving to workstations, returning
 * to idle positions, and handling collisions.
 * 
 * Requirements: 3.2, 3.3
 * Phase 3, Task 16
 */

import { getWalkingAnimationForDirection, getAnimationForState } from '../animations/index.js';

/**
 * Move agent to workstation behavior
 * Combines pathfinding, walking animation, and arrival handling
 * 
 * @param {Scene} scene - The game scene
 * @param {string} agentId - Agent entity ID
 * @param {Object} workstationPosition - Target workstation position {x, y}
 * @param {Object} options - Behavior options
 * @returns {Promise<boolean>} True if movement completed successfully
 */
export async function moveToWorkstation(scene, agentId, workstationPosition, options = {}) {
  const {
    onArrival = null,
    onBlocked = null,
    speed = 1.0
  } = options;
  
  const entityRegistry = scene.getEntityRegistry();
  const movementSystem = scene.getMovementSystem();
  const animationSystem = scene.getAnimationSystem();
  
  const agent = entityRegistry.getEntity(agentId);
  
  if (!agent) {
    console.warn(`Agent ${agentId} not found`);
    return false;
  }
  
  // Get current position
  const position = agent.getComponent('position');
  if (!position) {
    console.warn(`Agent ${agentId} has no position component`);
    return false;
  }
  
  try {
    // Calculate direction for walking animation
    const dx = workstationPosition.x - position.x;
    const dy = workstationPosition.y - position.y;
    
    // Start walking animation
    const walkingAnim = getWalkingAnimationForDirection(dx, dy);
    animationSystem.playAnimation(agentId, walkingAnim, { loop: true, speed });
    
    // Start movement
    await movementSystem.moveToPosition(agentId, workstationPosition);
    
    // Movement completed - stop walking animation
    animationSystem.stopAnimation(agentId);
    
    // Play idle animation
    animationSystem.playAnimation(agentId, 'idle', { loop: true });
    
    // Call arrival callback if provided
    if (onArrival) {
      onArrival(agentId, workstationPosition);
    }
    
    return true;
  } catch (error) {
    console.error(`Agent ${agentId} movement failed:`, error);
    
    // Stop walking animation on error
    animationSystem.stopAnimation(agentId);
    
    // Play idle animation
    animationSystem.playAnimation(agentId, 'idle', { loop: true });
    
    // Call blocked callback if provided
    if (onBlocked) {
      onBlocked(agentId, error);
    }
    
    return false;
  }
}

/**
 * Return agent to idle position behavior
 * Moves agent back to their designated idle/home position
 * 
 * @param {Scene} scene - The game scene
 * @param {string} agentId - Agent entity ID
 * @param {Object} idlePosition - Idle position {x, y}
 * @param {Object} options - Behavior options
 * @returns {Promise<boolean>} True if movement completed successfully
 */
export async function returnToIdlePosition(scene, agentId, idlePosition, options = {}) {
  const {
    onArrival = null,
    speed = 0.8 // Slightly slower return speed
  } = options;
  
  const entityRegistry = scene.getEntityRegistry();
  const movementSystem = scene.getMovementSystem();
  const animationSystem = scene.getAnimationSystem();
  
  const agent = entityRegistry.getEntity(agentId);
  
  if (!agent) {
    console.warn(`Agent ${agentId} not found`);
    return false;
  }
  
  // Get current position
  const position = agent.getComponent('position');
  if (!position) {
    console.warn(`Agent ${agentId} has no position component`);
    return false;
  }
  
  // Check if already at idle position (within threshold)
  const distance = Math.sqrt(
    Math.pow(idlePosition.x - position.x, 2) +
    Math.pow(idlePosition.y - position.y, 2)
  );
  
  if (distance < 5) {
    // Already at idle position
    animationSystem.playAnimation(agentId, 'idle', { loop: true });
    if (onArrival) {
      onArrival(agentId, idlePosition);
    }
    return true;
  }
  
  try {
    // Calculate direction for walking animation
    const dx = idlePosition.x - position.x;
    const dy = idlePosition.y - position.y;
    
    // Start walking animation
    const walkingAnim = getWalkingAnimationForDirection(dx, dy);
    animationSystem.playAnimation(agentId, walkingAnim, { loop: true, speed });
    
    // Start movement
    await movementSystem.moveToPosition(agentId, idlePosition);
    
    // Movement completed - stop walking animation
    animationSystem.stopAnimation(agentId);
    
    // Play idle animation
    animationSystem.playAnimation(agentId, 'idle', { loop: true });
    
    // Call arrival callback if provided
    if (onArrival) {
      onArrival(agentId, idlePosition);
    }
    
    return true;
  } catch (error) {
    console.error(`Agent ${agentId} return to idle failed:`, error);
    
    // Stop walking animation on error
    animationSystem.stopAnimation(agentId);
    
    // Play idle animation
    animationSystem.playAnimation(agentId, 'idle', { loop: true });
    
    return false;
  }
}

/**
 * Check if agent can move to position (collision avoidance)
 * Checks walkability and other agent positions
 * 
 * @param {Scene} scene - The game scene
 * @param {string} agentId - Agent entity ID
 * @param {Object} targetPosition - Target position {x, y}
 * @returns {boolean} True if position is available
 */
export function canMoveTo(scene, agentId, targetPosition) {
  const movementSystem = scene.getMovementSystem();
  const entityRegistry = scene.getEntityRegistry();
  
  // Check if position is walkable
  if (!movementSystem.isWalkable(targetPosition)) {
    return false;
  }
  
  // Check if another agent is at or near this position
  const agents = entityRegistry.getEntitiesByType('agent');
  const collisionRadius = 32; // Collision detection radius in pixels
  
  for (const otherAgent of agents) {
    if (otherAgent.id === agentId) continue; // Skip self
    
    const otherPosition = otherAgent.getComponent('position');
    if (!otherPosition) continue;
    
    // Calculate distance to other agent
    const distance = Math.sqrt(
      Math.pow(targetPosition.x - otherPosition.x, 2) +
      Math.pow(targetPosition.y - otherPosition.y, 2)
    );
    
    // Check if too close
    if (distance < collisionRadius) {
      return false;
    }
  }
  
  return true;
}

/**
 * Find nearest available position near target
 * Used when target position is occupied
 * 
 * @param {Scene} scene - The game scene
 * @param {string} agentId - Agent entity ID
 * @param {Object} targetPosition - Desired position {x, y}
 * @param {number} searchRadius - Search radius in pixels
 * @returns {Object|null} Available position or null
 */
export function findNearestAvailablePosition(scene, agentId, targetPosition, searchRadius = 64) {
  const movementSystem = scene.getMovementSystem();
  
  // Try positions in a spiral pattern around target
  const cellSize = movementSystem.cellSize;
  const maxSteps = Math.ceil(searchRadius / cellSize);
  
  for (let step = 1; step <= maxSteps; step++) {
    // Check positions at current distance
    const positions = [
      { x: targetPosition.x + (step * cellSize), y: targetPosition.y },
      { x: targetPosition.x - (step * cellSize), y: targetPosition.y },
      { x: targetPosition.x, y: targetPosition.y + (step * cellSize) },
      { x: targetPosition.x, y: targetPosition.y - (step * cellSize) },
      { x: targetPosition.x + (step * cellSize), y: targetPosition.y + (step * cellSize) },
      { x: targetPosition.x - (step * cellSize), y: targetPosition.y - (step * cellSize) },
      { x: targetPosition.x + (step * cellSize), y: targetPosition.y - (step * cellSize) },
      { x: targetPosition.x - (step * cellSize), y: targetPosition.y + (step * cellSize) }
    ];
    
    for (const pos of positions) {
      if (canMoveTo(scene, agentId, pos)) {
        return pos;
      }
    }
  }
  
  return null; // No available position found
}

/**
 * Queue movement for agent (handles busy paths)
 * Waits for path to clear before moving
 * 
 * @param {Scene} scene - The game scene
 * @param {string} agentId - Agent entity ID
 * @param {Object} targetPosition - Target position {x, y}
 * @param {Object} options - Behavior options
 * @returns {Promise<boolean>} True if movement completed successfully
 */
export async function queueMovement(scene, agentId, targetPosition, options = {}) {
  const {
    maxWaitTime = 5000, // Maximum wait time in ms
    checkInterval = 500, // Check interval in ms
    onWaiting = null,
    onTimeout = null
  } = options;
  
  const startTime = Date.now();
  
  // Wait for position to become available
  while (Date.now() - startTime < maxWaitTime) {
    if (canMoveTo(scene, agentId, targetPosition)) {
      // Position available - move now
      return await moveToWorkstation(scene, agentId, targetPosition, options);
    }
    
    // Position occupied - wait
    if (onWaiting) {
      onWaiting(agentId, targetPosition);
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  // Timeout - try to find alternative position
  const alternativePosition = findNearestAvailablePosition(scene, agentId, targetPosition);
  
  if (alternativePosition) {
    console.log(`Agent ${agentId} using alternative position`);
    return await moveToWorkstation(scene, agentId, alternativePosition, options);
  }
  
  // No alternative found
  if (onTimeout) {
    onTimeout(agentId, targetPosition);
  }
  
  return false;
}

/**
 * Update agent animation based on state
 * Convenience function to sync animation with agent state
 * 
 * @param {Scene} scene - The game scene
 * @param {string} agentId - Agent entity ID
 * @param {string} state - Agent state
 */
export function updateAgentAnimation(scene, agentId, state) {
  const animationSystem = scene.getAnimationSystem();
  const animation = getAnimationForState(state);
  
  // Check if already playing this animation
  const currentAnim = animationSystem.getCurrentAnimation(agentId);
  if (currentAnim === animation) {
    return; // Already playing correct animation
  }
  
  // Play new animation
  const loop = !['celebrating', 'error'].includes(animation);
  animationSystem.playAnimation(agentId, animation, {
    loop,
    onComplete: (id) => {
      // Return to idle after non-looping animations
      if (!loop) {
        animationSystem.playAnimation(id, 'idle', { loop: true });
      }
    }
  });
}

/**
 * Stop agent movement immediately
 * Cancels current movement and returns to idle
 * 
 * @param {Scene} scene - The game scene
 * @param {string} agentId - Agent entity ID
 */
export function stopMovement(scene, agentId) {
  const movementSystem = scene.getMovementSystem();
  const animationSystem = scene.getAnimationSystem();
  
  // Stop movement
  movementSystem.stopMovement(agentId);
  
  // Stop current animation
  animationSystem.stopAnimation(agentId);
  
  // Play idle animation
  animationSystem.playAnimation(agentId, 'idle', { loop: true });
}

/**
 * Check if agent is currently moving
 * 
 * @param {Scene} scene - The game scene
 * @param {string} agentId - Agent entity ID
 * @returns {boolean} True if agent is moving
 */
export function isMoving(scene, agentId) {
  const movementSystem = scene.getMovementSystem();
  return movementSystem.isMoving(agentId);
}

export default {
  moveToWorkstation,
  returnToIdlePosition,
  canMoveTo,
  findNearestAvailablePosition,
  queueMovement,
  updateAgentAnimation,
  stopMovement,
  isMoving
};
