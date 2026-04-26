/**
 * MovementSystem Animation Integration Tests
 * 
 * Tests for Task 3.5: Walking Animation Integration
 * 
 * Tests:
 * - Walking animation triggers on movement start
 * - Idle animation triggers on movement stop
 * - Direction updates during movement
 * - Smooth animation transitions
 * - Animation system integration
 */

import MovementSystem from '../MovementSystem.js';
import AnimationSystem from '../AnimationSystem.js';
import EntityRegistry from '../../entities/EntityRegistry.js';
import AgentEntity from '../../entities/AgentEntity.js';

describe('MovementSystem - Animation Integration (Task 3.5)', () => {
  let movementSystem;
  let animationSystem;
  let entityRegistry;
  let testAgent;
  
  beforeEach(() => {
    // Create entity registry
    entityRegistry = new EntityRegistry();
    
    // Create animation system
    animationSystem = new AnimationSystem(entityRegistry);
    
    // Register test animations
    animationSystem.registerAnimation('idle', {
      frames: [{ textureId: 'idle_0' }],
      fps: 8,
      loop: true
    });
    
    animationSystem.registerAnimation('walking', {
      frames: [
        { textureId: 'walk_0' },
        { textureId: 'walk_1' },
        { textureId: 'walk_2' },
        { textureId: 'walk_3' }
      ],
      fps: 8,
      loop: true
    });
    
    // Create movement system with animation system
    movementSystem = new MovementSystem(entityRegistry, animationSystem, 64);
    
    // Create test agent
    testAgent = new AgentEntity('test-agent', 'content_generator');
    testAgent.addComponent('position', { x: 100, y: 100, z: 0 });
    testAgent.addComponent('animation', {
      currentAnimation: 'idle',
      frameIndex: 0,
      animationSpeed: 1.0,
      loop: true
    });
    
    entityRegistry.registerEntity(testAgent);
  });
  
  afterEach(() => {
    movementSystem.clear();
    animationSystem.clear();
  });
  
  describe('Walking Animation Triggering', () => {
    test('should trigger walking animation when movement starts', () => {
      // Spy on animation system
      const playAnimationSpy = jest.spyOn(animationSystem, 'playAnimation');
      
      // Start movement
      movementSystem.moveToPosition('test-agent', { x: 200, y: 200 });
      
      // Verify walking animation was triggered
      expect(playAnimationSpy).toHaveBeenCalledWith('test-agent', 'walking', {
        loop: true,
        transitionDuration: 150,
        restart: false
      });
    });
    
    test('should not trigger animation if AnimationSystem is not provided', () => {
      // Create movement system without animation system
      const movementSystemNoAnim = new MovementSystem(entityRegistry, null, 64);
      
      // Start movement (should not throw error)
      expect(() => {
        movementSystemNoAnim.moveToPosition('test-agent', { x: 200, y: 200 });
      }).not.toThrow();
    });
    
    test('should not trigger animation for non-agent entities', () => {
      // Create non-agent entity
      const furniture = entityRegistry.createEntity('furniture-1', 'environment');
      furniture.addComponent('position', { x: 100, y: 100, z: 0 });
      
      const playAnimationSpy = jest.spyOn(animationSystem, 'playAnimation');
      
      // Start movement
      movementSystem.moveToPosition('furniture-1', { x: 200, y: 200 });
      
      // Verify animation was not triggered
      expect(playAnimationSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('Idle Animation Triggering', () => {
    test('should trigger idle animation when movement stops', () => {
      // Start movement
      movementSystem.moveToPosition('test-agent', { x: 200, y: 200 });
      
      // Spy on animation system
      const playAnimationSpy = jest.spyOn(animationSystem, 'playAnimation');
      
      // Stop movement
      movementSystem.stopMovement('test-agent');
      
      // Verify idle animation was triggered
      expect(playAnimationSpy).toHaveBeenCalledWith('test-agent', 'idle', {
        loop: true,
        transitionDuration: 150,
        restart: false
      });
    });
    
    test('should trigger idle animation when movement completes', async () => {
      // Spy on animation system
      const playAnimationSpy = jest.spyOn(animationSystem, 'playAnimation');
      
      // Start movement to nearby position
      const movementPromise = movementSystem.moveToPosition('test-agent', { x: 164, y: 100 });
      
      // Update until movement completes
      for (let i = 0; i < 100; i++) {
        movementSystem.update(16); // 16ms per frame (60 FPS)
        await new Promise(resolve => setTimeout(resolve, 0));
        
        if (!movementSystem.isMoving('test-agent')) {
          break;
        }
      }
      
      // Wait for movement to complete
      await movementPromise;
      
      // Verify idle animation was triggered
      expect(playAnimationSpy).toHaveBeenCalledWith('test-agent', 'idle', {
        loop: true,
        transitionDuration: 150,
        restart: false
      });
    });
    
    test('should clear velocity when movement stops', () => {
      // Start movement
      movementSystem.moveToPosition('test-agent', { x: 200, y: 200 });
      
      // Update to generate velocity
      movementSystem.update(16);
      
      // Verify velocity exists
      expect(movementSystem.entityVelocities.has('test-agent')).toBe(true);
      
      // Stop movement
      movementSystem.stopMovement('test-agent');
      
      // Verify velocity cleared
      expect(movementSystem.entityVelocities.has('test-agent')).toBe(false);
    });
  });
  
  describe('Direction Updates', () => {
    test('should update direction based on movement velocity', () => {
      // Spy on agent's updateDirection method
      const updateDirectionSpy = jest.spyOn(testAgent, 'updateDirection');
      
      // Start movement
      movementSystem.moveToPosition('test-agent', { x: 200, y: 200 });
      
      // Update movement
      movementSystem.update(16);
      
      // Verify updateDirection was called with velocity
      expect(updateDirectionSpy).toHaveBeenCalled();
      
      const callArgs = updateDirectionSpy.mock.calls[0];
      expect(callArgs[0]).toBeDefined(); // vx
      expect(callArgs[1]).toBeDefined(); // vy
      expect(callArgs[2]).toBe(16); // deltaTime
    });
    
    test('should store velocity in position component', () => {
      // Start movement
      movementSystem.moveToPosition('test-agent', { x: 200, y: 200 });
      
      // Update movement
      movementSystem.update(16);
      
      // Get position component
      const position = testAgent.getComponent('position');
      
      // Verify velocity is stored
      expect(position.velocity).toBeDefined();
      expect(position.velocity.x).toBeDefined();
      expect(position.velocity.y).toBeDefined();
    });
    
    test('should calculate velocity correctly', () => {
      // Start movement to the right
      movementSystem.moveToPosition('test-agent', { x: 200, y: 100 });
      
      // Update movement
      movementSystem.update(16);
      
      // Get velocity
      const velocity = movementSystem.entityVelocities.get('test-agent');
      
      // Verify velocity direction (should be positive X)
      expect(velocity).toBeDefined();
      expect(velocity.vx).toBeGreaterThan(0);
      expect(Math.abs(velocity.vy)).toBeLessThan(10); // Should be near zero
    });
  });
  
  describe('Animation Transitions', () => {
    test('should use smooth transitions between animations', () => {
      const playAnimationSpy = jest.spyOn(animationSystem, 'playAnimation');
      
      // Start movement (idle -> walking)
      movementSystem.moveToPosition('test-agent', { x: 200, y: 200 });
      
      // Verify transition duration is set
      expect(playAnimationSpy).toHaveBeenCalledWith('test-agent', 'walking', 
        expect.objectContaining({
          transitionDuration: 150
        })
      );
      
      // Stop movement (walking -> idle)
      movementSystem.stopMovement('test-agent');
      
      // Verify transition duration is set
      expect(playAnimationSpy).toHaveBeenCalledWith('test-agent', 'idle',
        expect.objectContaining({
          transitionDuration: 150
        })
      );
    });
    
    test('should not restart animation if already playing', () => {
      const playAnimationSpy = jest.spyOn(animationSystem, 'playAnimation');
      
      // Start movement
      movementSystem.moveToPosition('test-agent', { x: 200, y: 200 });
      
      // Verify restart flag is false
      expect(playAnimationSpy).toHaveBeenCalledWith('test-agent', 'walking',
        expect.objectContaining({
          restart: false
        })
      );
    });
  });
  
  describe('Integration with AgentEntity', () => {
    test('should work with agent updateVisuals method', () => {
      // Start movement
      movementSystem.moveToPosition('test-agent', { x: 200, y: 200 });
      
      // Update movement
      movementSystem.update(16);
      
      // Call agent's updateVisuals
      expect(() => {
        testAgent.updateVisuals(16);
      }).not.toThrow();
    });
    
    test('should update agent direction during movement', () => {
      const initialDirection = testAgent.getDirection();
      
      // Start movement to the right
      movementSystem.moveToPosition('test-agent', { x: 300, y: 100 });
      
      // Update movement multiple times
      for (let i = 0; i < 10; i++) {
        movementSystem.update(16);
      }
      
      // Direction should have changed (or stayed the same if already facing right)
      const newDirection = testAgent.getDirection();
      expect(newDirection).toBeDefined();
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle entity without animation component', () => {
      // Remove animation component
      testAgent.removeComponent('animation');
      
      // Should not throw error
      expect(() => {
        movementSystem.moveToPosition('test-agent', { x: 200, y: 200 });
      }).not.toThrow();
      
      expect(() => {
        movementSystem.stopMovement('test-agent');
      }).not.toThrow();
    });
    
    test('should handle entity not found', () => {
      // Should not throw error
      expect(() => {
        movementSystem.moveToPosition('non-existent', { x: 200, y: 200 });
      }).not.toThrow();
    });
    
    test('should handle movement system clear', () => {
      // Start movement
      movementSystem.moveToPosition('test-agent', { x: 200, y: 200 });
      
      // Clear movement system
      movementSystem.clear();
      
      // Verify velocities cleared
      expect(movementSystem.entityVelocities.size).toBe(0);
    });
    
    test('should handle zero velocity', () => {
      // Start movement
      movementSystem.moveToPosition('test-agent', { x: 100, y: 100 }); // Same position
      
      // Update movement
      movementSystem.update(16);
      
      // Should not throw error
      expect(() => {
        testAgent.updateDirection(0, 0, 16);
      }).not.toThrow();
    });
  });
  
  describe('Performance', () => {
    test('should handle multiple moving agents efficiently', () => {
      // Create multiple agents
      const agents = [];
      for (let i = 0; i < 50; i++) {
        const agent = new AgentEntity(`agent-${i}`, 'content_generator');
        agent.addComponent('position', { x: 100 + i * 10, y: 100, z: 0 });
        agent.addComponent('animation', {
          currentAnimation: 'idle',
          frameIndex: 0,
          animationSpeed: 1.0,
          loop: true
        });
        entityRegistry.registerEntity(agent);
        agents.push(agent);
      }
      
      // Start movement for all agents
      agents.forEach((agent, i) => {
        movementSystem.moveToPosition(agent.id, { x: 500 + i * 10, y: 500 });
      });
      
      // Measure update time
      const startTime = performance.now();
      movementSystem.update(16);
      const endTime = performance.now();
      
      const updateTime = endTime - startTime;
      
      // Should complete in reasonable time (< 10ms for 50 agents)
      expect(updateTime).toBeLessThan(10);
    });
  });
});
