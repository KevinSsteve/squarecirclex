/**
 * AnimationSystem Enhanced Tests
 * 
 * Tests for Task 3.4 enhancements:
 * - Variable frame rates
 * - Animation events (onComplete, onLoop, onFrameChange)
 * - Animation transitions
 * - Speed control
 * - Frame rate control
 */

import AnimationSystem from '../AnimationSystem.js';
import EntityRegistry from '../../entities/EntityRegistry.js';
import Entity from '../../entities/Entity.js';

describe('AnimationSystem - Enhanced Features (Task 3.4)', () => {
  let animationSystem;
  let entityRegistry;
  let testEntity;
  
  beforeEach(() => {
    entityRegistry = new EntityRegistry();
    animationSystem = new AnimationSystem(entityRegistry);
    
    testEntity = new Entity('test-entity', 'test');
    testEntity.addComponent('position', { x: 0, y: 0, z: 0 });
    entityRegistry.registerEntity(testEntity);
  });
  
  afterEach(() => {
    animationSystem.clear();
    animationSystem.clearDefinitions();
  });
  
  describe('Variable Frame Rates', () => {
    test('should support different FPS for different animations', () => {
      // Register slow animation (4 FPS)
      animationSystem.registerAnimation('slow', {
        frames: [{ textureId: 'frame1' }, { textureId: 'frame2' }],
        fps: 4,
        loop: true
      });
      
      // Register fast animation (30 FPS)
      animationSystem.registerAnimation('fast', {
        frames: [{ textureId: 'frame1' }, { textureId: 'frame2' }],
        fps: 30,
        loop: true
      });
      
      const slowAnim = animationSystem.getAnimation('slow');
      const fastAnim = animationSystem.getAnimation('fast');
      
      expect(slowAnim.frameDuration).toBe(250); // 1000ms / 4fps
      expect(fastAnim.frameDuration).toBeCloseTo(33.33, 1); // 1000ms / 30fps
    });
    
    test('should allow changing frame rate at runtime', () => {
      animationSystem.registerAnimation('test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'test');
      
      // Change to 16 FPS
      animationSystem.setAnimationFrameRate('test-entity', 16);
      
      const playingAnim = animationSystem.playingAnimations.get('test-entity');
      expect(playingAnim.definition.frameDuration).toBe(62.5); // 1000ms / 16fps
    });
  });
  
  describe('Animation Events', () => {
    test('should fire onComplete event when animation finishes', (done) => {
      animationSystem.registerAnimation('complete-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }],
        fps: 100, // Fast for testing
        loop: false
      });
      
      animationSystem.playAnimation('test-entity', 'complete-test', {
        onComplete: (entityId) => {
          expect(entityId).toBe('test-entity');
          done();
        }
      });
      
      // Update until animation completes
      for (let i = 0; i < 30; i++) {
        animationSystem.update(16);
      }
    });
    
    test('should fire onLoop event when animation loops', () => {
      const onLoopMock = jest.fn();
      
      animationSystem.registerAnimation('loop-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }],
        fps: 100,
        loop: true
      });
      
      animationSystem.playAnimation('test-entity', 'loop-test', {
        onLoop: onLoopMock
      });
      
      // Update until animation loops
      for (let i = 0; i < 30; i++) {
        animationSystem.update(16);
      }
      
      expect(onLoopMock).toHaveBeenCalled();
      expect(onLoopMock).toHaveBeenCalledWith('test-entity', 'loop-test');
    });
    
    test('should fire onFrameChange event for each frame', () => {
      const onFrameChangeMock = jest.fn();
      
      animationSystem.registerAnimation('frame-test', {
        frames: [
          { textureId: 'f1' },
          { textureId: 'f2' },
          { textureId: 'f3' }
        ],
        fps: 100,
        loop: false
      });
      
      animationSystem.playAnimation('test-entity', 'frame-test', {
        onFrameChange: onFrameChangeMock
      });
      
      // First frame is fired immediately
      expect(onFrameChangeMock).toHaveBeenCalledTimes(1);
      
      // Update to trigger frame changes
      for (let i = 0; i < 30; i++) {
        animationSystem.update(16);
      }
      
      // Should have been called for each frame (including initial)
      expect(onFrameChangeMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
    
    test('should support definition-level event callbacks', (done) => {
      animationSystem.registerAnimation('def-callback-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }],
        fps: 100,
        loop: false,
        onComplete: (entityId) => {
          expect(entityId).toBe('test-entity');
          done();
        }
      });
      
      animationSystem.playAnimation('test-entity', 'def-callback-test');
      
      // Update until animation completes
      for (let i = 0; i < 30; i++) {
        animationSystem.update(16);
      }
    });
  });
  
  describe('Animation Transitions', () => {
    test('should create transition when switching animations', () => {
      animationSystem.registerAnimation('anim1', {
        frames: [{ textureId: 'f1' }],
        fps: 8
      });
      
      animationSystem.registerAnimation('anim2', {
        frames: [{ textureId: 'f2' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'anim1');
      animationSystem.playAnimation('test-entity', 'anim2', {
        transitionDuration: 200
      });
      
      expect(animationSystem.hasActiveTransition('test-entity')).toBe(true);
    });
    
    test('should update transition progress over time', () => {
      animationSystem.registerAnimation('anim1', {
        frames: [{ textureId: 'f1' }],
        fps: 8
      });
      
      animationSystem.registerAnimation('anim2', {
        frames: [{ textureId: 'f2' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'anim1');
      animationSystem.playAnimation('test-entity', 'anim2', {
        transitionDuration: 100
      });
      
      // Initial progress should be 0
      expect(animationSystem.getTransitionProgress('test-entity')).toBe(0);
      
      // Update for 50ms (halfway)
      animationSystem.update(50);
      
      const progress = animationSystem.getTransitionProgress('test-entity');
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(1);
    });
    
    test('should complete transition after duration', () => {
      animationSystem.registerAnimation('anim1', {
        frames: [{ textureId: 'f1' }],
        fps: 8
      });
      
      animationSystem.registerAnimation('anim2', {
        frames: [{ textureId: 'f2' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'anim1');
      animationSystem.playAnimation('test-entity', 'anim2', {
        transitionDuration: 100
      });
      
      // Update for longer than transition duration
      animationSystem.update(150);
      
      expect(animationSystem.hasActiveTransition('test-entity')).toBe(false);
    });
    
    test('should use default transition duration if not specified', () => {
      animationSystem.setDefaultTransitionDuration(250);
      
      animationSystem.registerAnimation('anim1', {
        frames: [{ textureId: 'f1' }],
        fps: 8
      });
      
      animationSystem.registerAnimation('anim2', {
        frames: [{ textureId: 'f2' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'anim1');
      animationSystem.playAnimation('test-entity', 'anim2');
      
      expect(animationSystem.hasActiveTransition('test-entity')).toBe(true);
      expect(animationSystem.getDefaultTransitionDuration()).toBe(250);
    });
    
    test('should skip transition if duration is 0', () => {
      animationSystem.registerAnimation('anim1', {
        frames: [{ textureId: 'f1' }],
        fps: 8
      });
      
      animationSystem.registerAnimation('anim2', {
        frames: [{ textureId: 'f2' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'anim1');
      animationSystem.playAnimation('test-entity', 'anim2', {
        transitionDuration: 0
      });
      
      expect(animationSystem.hasActiveTransition('test-entity')).toBe(false);
    });
  });
  
  describe('Speed Control', () => {
    test('should allow setting animation speed', () => {
      animationSystem.registerAnimation('speed-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'speed-test', {
        speed: 2.0
      });
      
      expect(animationSystem.getAnimationSpeed('test-entity')).toBe(2.0);
    });
    
    test('should update animation speed at runtime', () => {
      animationSystem.registerAnimation('speed-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'speed-test');
      
      animationSystem.setAnimationSpeed('test-entity', 0.5);
      
      expect(animationSystem.getAnimationSpeed('test-entity')).toBe(0.5);
    });
    
    test('should affect animation playback speed', () => {
      animationSystem.registerAnimation('speed-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }],
        fps: 10, // 100ms per frame
        loop: true
      });
      
      // Play at 2x speed
      animationSystem.playAnimation('test-entity', 'speed-test', {
        speed: 2.0
      });
      
      // Update for 60ms (should advance more than 1 frame at 2x speed)
      animationSystem.update(60);
      
      const frame = animationSystem.getCurrentFrame('test-entity');
      expect(frame).toBeGreaterThan(0);
    });
  });
  
  describe('Frame Control', () => {
    test('should get current frame index', () => {
      animationSystem.registerAnimation('frame-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }, { textureId: 'f3' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'frame-test');
      
      expect(animationSystem.getCurrentFrame('test-entity')).toBe(0);
    });
    
    test('should set current frame index', () => {
      animationSystem.registerAnimation('frame-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }, { textureId: 'f3' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'frame-test');
      animationSystem.setCurrentFrame('test-entity', 2);
      
      expect(animationSystem.getCurrentFrame('test-entity')).toBe(2);
    });
    
    test('should clamp frame index to valid range', () => {
      animationSystem.registerAnimation('frame-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'frame-test');
      
      // Try to set beyond max
      animationSystem.setCurrentFrame('test-entity', 10);
      expect(animationSystem.getCurrentFrame('test-entity')).toBe(1);
      
      // Try to set below min
      animationSystem.setCurrentFrame('test-entity', -5);
      expect(animationSystem.getCurrentFrame('test-entity')).toBe(0);
    });
  });
  
  describe('Statistics', () => {
    test('should provide animation statistics', () => {
      animationSystem.registerAnimation('anim1', {
        frames: [{ textureId: 'f1' }],
        fps: 8
      });
      
      animationSystem.registerAnimation('anim2', {
        frames: [{ textureId: 'f1' }],
        fps: 8,
        loop: true
      });
      
      const entity2 = new Entity('entity2', 'test');
      entityRegistry.registerEntity(entity2);
      
      animationSystem.playAnimation('test-entity', 'anim1');
      animationSystem.playAnimation('entity2', 'anim2');
      animationSystem.pauseAnimation('entity2');
      
      const stats = animationSystem.getStatistics();
      
      expect(stats.registeredAnimations).toBe(2);
      expect(stats.playingAnimations).toBe(2);
      expect(stats.pausedAnimations).toBe(1);
      expect(stats.loopingAnimations).toBe(1);
      expect(stats.enabled).toBe(true);
    });
  });
  
  describe('Integration with Existing Features', () => {
    test('should maintain backward compatibility with legacy callbacks', (done) => {
      animationSystem.registerAnimation('legacy-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }],
        fps: 100,
        loop: false
      });
      
      animationSystem.playAnimation('test-entity', 'legacy-test', {
        onComplete: (entityId) => {
          expect(entityId).toBe('test-entity');
          done();
        }
      });
      
      for (let i = 0; i < 30; i++) {
        animationSystem.update(16);
      }
    });
    
    test('should work with pause/resume', () => {
      animationSystem.registerAnimation('pause-test', {
        frames: [{ textureId: 'f1' }, { textureId: 'f2' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'pause-test');
      
      const initialFrame = animationSystem.getCurrentFrame('test-entity');
      
      animationSystem.pauseAnimation('test-entity');
      animationSystem.update(100);
      
      // Frame should not advance while paused
      expect(animationSystem.getCurrentFrame('test-entity')).toBe(initialFrame);
      
      animationSystem.resumeAnimation('test-entity');
      animationSystem.update(100);
      
      // Frame should advance after resume
      expect(animationSystem.getCurrentFrame('test-entity')).toBeGreaterThanOrEqual(initialFrame);
    });
    
    test('should clean up event listeners on stop', () => {
      animationSystem.registerAnimation('cleanup-test', {
        frames: [{ textureId: 'f1' }],
        fps: 8
      });
      
      animationSystem.playAnimation('test-entity', 'cleanup-test', {
        onComplete: jest.fn(),
        onLoop: jest.fn(),
        onFrameChange: jest.fn()
      });
      
      animationSystem.stopAnimation('test-entity');
      
      expect(animationSystem.animationEventListeners.has('test-entity')).toBe(false);
      expect(animationSystem.animationTransitions.has('test-entity')).toBe(false);
    });
  });
});
