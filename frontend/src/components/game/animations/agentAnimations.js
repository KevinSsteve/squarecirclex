/**
 * Agent Animation Definitions
 * 
 * Defines all agent animations with frame data, timing, and behavior.
 * These animations are registered with the AnimationSystem.
 * 
 * Requirements: 2.2, 2.4, 8.1, 8.2, 8.3
 * Phase 3, Task 15
 */

/**
 * Agent Animation Definitions
 * 
 * Each animation includes:
 * - frames: Array of frame data with textureId and optional transforms
 * - fps: Frames per second
 * - loop: Whether animation should loop
 * - onComplete: Optional callback when animation completes
 */
const agentAnimations = {
  /**
   * Idle Animation
   * 4 frames, 2 FPS
   * Subtle breathing/standing animation
   */
  idle: {
    frames: [
      { textureId: 'agent_idle_1', offsetY: 0 },
      { textureId: 'agent_idle_2', offsetY: -1 },
      { textureId: 'agent_idle_3', offsetY: -2 },
      { textureId: 'agent_idle_4', offsetY: -1 }
    ],
    fps: 2,
    loop: true
  },

  /**
   * Walking Animation - Down (South)
   * 8 frames, 12 FPS
   * Agent walking toward camera
   */
  walking_down: {
    frames: [
      { textureId: 'agent_walk_down_1', offsetY: 0 },
      { textureId: 'agent_walk_down_2', offsetY: -1 },
      { textureId: 'agent_walk_down_3', offsetY: 0 },
      { textureId: 'agent_walk_down_4', offsetY: 1 },
      { textureId: 'agent_walk_down_5', offsetY: 0 },
      { textureId: 'agent_walk_down_6', offsetY: -1 },
      { textureId: 'agent_walk_down_7', offsetY: 0 },
      { textureId: 'agent_walk_down_8', offsetY: 1 }
    ],
    fps: 12,
    loop: true
  },

  /**
   * Walking Animation - Up (North)
   * 8 frames, 12 FPS
   * Agent walking away from camera
   */
  walking_up: {
    frames: [
      { textureId: 'agent_walk_up_1', offsetY: 0 },
      { textureId: 'agent_walk_up_2', offsetY: -1 },
      { textureId: 'agent_walk_up_3', offsetY: 0 },
      { textureId: 'agent_walk_up_4', offsetY: 1 },
      { textureId: 'agent_walk_up_5', offsetY: 0 },
      { textureId: 'agent_walk_up_6', offsetY: -1 },
      { textureId: 'agent_walk_up_7', offsetY: 0 },
      { textureId: 'agent_walk_up_8', offsetY: 1 }
    ],
    fps: 12,
    loop: true
  },

  /**
   * Walking Animation - Left (West)
   * 8 frames, 12 FPS
   * Agent walking to the left
   */
  walking_left: {
    frames: [
      { textureId: 'agent_walk_left_1', offsetY: 0 },
      { textureId: 'agent_walk_left_2', offsetY: -1 },
      { textureId: 'agent_walk_left_3', offsetY: 0 },
      { textureId: 'agent_walk_left_4', offsetY: 1 },
      { textureId: 'agent_walk_left_5', offsetY: 0 },
      { textureId: 'agent_walk_left_6', offsetY: -1 },
      { textureId: 'agent_walk_left_7', offsetY: 0 },
      { textureId: 'agent_walk_left_8', offsetY: 1 }
    ],
    fps: 12,
    loop: true
  },

  /**
   * Walking Animation - Right (East)
   * 8 frames, 12 FPS
   * Agent walking to the right
   */
  walking_right: {
    frames: [
      { textureId: 'agent_walk_right_1', offsetY: 0 },
      { textureId: 'agent_walk_right_2', offsetY: -1 },
      { textureId: 'agent_walk_right_3', offsetY: 0 },
      { textureId: 'agent_walk_right_4', offsetY: 1 },
      { textureId: 'agent_walk_right_5', offsetY: 0 },
      { textureId: 'agent_walk_right_6', offsetY: -1 },
      { textureId: 'agent_walk_right_7', offsetY: 0 },
      { textureId: 'agent_walk_right_8', offsetY: 1 }
    ],
    fps: 12,
    loop: true
  },

  /**
   * Typing Animation
   * 6 frames, 8 FPS
   * Agent typing at computer
   */
  typing: {
    frames: [
      { textureId: 'agent_typing_1', offsetY: 0 },
      { textureId: 'agent_typing_2', offsetY: -1 },
      { textureId: 'agent_typing_3', offsetY: 0 },
      { textureId: 'agent_typing_4', offsetY: -1 },
      { textureId: 'agent_typing_5', offsetY: 0 },
      { textureId: 'agent_typing_6', offsetY: -1 }
    ],
    fps: 8,
    loop: true
  },

  /**
   * Thinking Animation
   * 4 frames, 3 FPS
   * Agent in contemplative pose
   */
  thinking: {
    frames: [
      { textureId: 'agent_thinking_1', offsetY: 0 },
      { textureId: 'agent_thinking_2', offsetY: -1 },
      { textureId: 'agent_thinking_3', offsetY: -2 },
      { textureId: 'agent_thinking_4', offsetY: -1 }
    ],
    fps: 3,
    loop: true
  },

  /**
   * Celebrating Animation
   * 8 frames, 10 FPS
   * Agent celebrating success
   * Non-looping - returns to idle when complete
   */
  celebrating: {
    frames: [
      { textureId: 'agent_celebrate_1', offsetY: 0 },
      { textureId: 'agent_celebrate_2', offsetY: -3 },
      { textureId: 'agent_celebrate_3', offsetY: -5 },
      { textureId: 'agent_celebrate_4', offsetY: -7 },
      { textureId: 'agent_celebrate_5', offsetY: -5 },
      { textureId: 'agent_celebrate_6', offsetY: -3 },
      { textureId: 'agent_celebrate_7', offsetY: -1 },
      { textureId: 'agent_celebrate_8', offsetY: 0 }
    ],
    fps: 10,
    loop: false
  },

  /**
   * Error Animation
   * 4 frames, 4 FPS
   * Agent showing confusion/error state
   * Non-looping - returns to idle when complete
   */
  error: {
    frames: [
      { textureId: 'agent_error_1', offsetY: 0, rotation: -0.1 },
      { textureId: 'agent_error_2', offsetY: 0, rotation: 0.1 },
      { textureId: 'agent_error_3', offsetY: 0, rotation: -0.1 },
      { textureId: 'agent_error_4', offsetY: 0, rotation: 0 }
    ],
    fps: 4,
    loop: false
  },

  /**
   * Confused Animation
   * 6 frames, 3 FPS
   * Agent looking around confused (for error states)
   * Loops until error is resolved
   */
  confused: {
    frames: [
      { textureId: 'agent_confused_1', offsetY: 0, rotation: 0 },
      { textureId: 'agent_confused_2', offsetY: 0, rotation: -0.05 },
      { textureId: 'agent_confused_3', offsetY: -1, rotation: 0 },
      { textureId: 'agent_confused_4', offsetY: 0, rotation: 0.05 },
      { textureId: 'agent_confused_5', offsetY: -1, rotation: 0 },
      { textureId: 'agent_confused_6', offsetY: 0, rotation: 0 }
    ],
    fps: 3,
    loop: true
  }
};

/**
 * Helper function to get walking animation based on direction
 * @param {number} dx - Delta X (target.x - current.x)
 * @param {number} dy - Delta Y (target.y - current.y)
 * @returns {string} Animation name for the direction
 */
export function getWalkingAnimationForDirection(dx, dy) {
  // Determine primary direction based on larger delta
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  if (absDx > absDy) {
    // Horizontal movement is dominant
    return dx > 0 ? 'walking_right' : 'walking_left';
  } else {
    // Vertical movement is dominant
    return dy > 0 ? 'walking_down' : 'walking_up';
  }
}

/**
 * Helper function to get animation for agent state
 * @param {string} state - Agent state (idle, working, blocked, thinking, celebrating, error)
 * @returns {string} Animation name for the state
 */
export function getAnimationForState(state) {
  const stateAnimationMap = {
    idle: 'idle',
    working: 'typing',
    blocked: 'confused',
    thinking: 'thinking',
    celebrating: 'celebrating',
    error: 'error',
    confused: 'confused'
  };
  
  return stateAnimationMap[state] || 'idle';
}

/**
 * Register all agent animations with the AnimationSystem
 * @param {AnimationSystem} animationSystem - The animation system instance
 */
export function registerAgentAnimations(animationSystem) {
  animationSystem.registerAnimations(agentAnimations);
  console.log(`Registered ${Object.keys(agentAnimations).length} agent animations`);
}

export default agentAnimations;
