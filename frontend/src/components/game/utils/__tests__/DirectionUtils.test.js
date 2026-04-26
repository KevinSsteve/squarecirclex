/**
 * DirectionUtils.test.js - Unit tests for Direction Calculation System
 * 
 * Tests direction calculation, smoothing, and utility functions.
 * 
 * Phase 3, Task 3.2: Direction Calculation System
 */

import {
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
} from '../DirectionUtils';

describe('DirectionUtils', () => {
  describe('Direction Constants', () => {
    test('should have 8 directions', () => {
      expect(DIRECTIONS).toHaveLength(8);
    });
    
    test('should include all cardinal directions', () => {
      expect(DIRECTIONS).toContain(Direction.NORTH);
      expect(DIRECTIONS).toContain(Direction.EAST);
      expect(DIRECTIONS).toContain(Direction.SOUTH);
      expect(DIRECTIONS).toContain(Direction.WEST);
    });
    
    test('should include all intercardinal directions', () => {
      expect(DIRECTIONS).toContain(Direction.NORTH_EAST);
      expect(DIRECTIONS).toContain(Direction.SOUTH_EAST);
      expect(DIRECTIONS).toContain(Direction.SOUTH_WEST);
      expect(DIRECTIONS).toContain(Direction.NORTH_WEST);
    });
  });
  
  describe('calculateDirection', () => {
    test('should return null for zero velocity', () => {
      expect(calculateDirection(0, 0)).toBeNull();
    });
    
    test('should return EAST for positive X velocity', () => {
      expect(calculateDirection(100, 0)).toBe(Direction.EAST);
    });
    
    test('should return WEST for negative X velocity', () => {
      expect(calculateDirection(-100, 0)).toBe(Direction.WEST);
    });
    
    test('should return SOUTH for positive Y velocity', () => {
      expect(calculateDirection(0, 100)).toBe(Direction.SOUTH);
    });
    
    test('should return NORTH for negative Y velocity', () => {
      expect(calculateDirection(0, -100)).toBe(Direction.NORTH);
    });
    
    test('should return SOUTH_EAST for positive X and Y velocity', () => {
      expect(calculateDirection(100, 100)).toBe(Direction.SOUTH_EAST);
    });
    
    test('should return NORTH_EAST for positive X and negative Y velocity', () => {
      expect(calculateDirection(100, -100)).toBe(Direction.NORTH_EAST);
    });
    
    test('should return SOUTH_WEST for negative X and positive Y velocity', () => {
      expect(calculateDirection(-100, 100)).toBe(Direction.SOUTH_WEST);
    });
    
    test('should return NORTH_WEST for negative X and Y velocity', () => {
      expect(calculateDirection(-100, -100)).toBe(Direction.NORTH_WEST);
    });
    
    test('should handle small velocity values', () => {
      expect(calculateDirection(0.1, 0)).toBe(Direction.EAST);
      expect(calculateDirection(0, 0.1)).toBe(Direction.SOUTH);
    });
    
    test('should handle large velocity values', () => {
      expect(calculateDirection(10000, 0)).toBe(Direction.EAST);
      expect(calculateDirection(0, -10000)).toBe(Direction.NORTH);
    });
  });
  
  describe('calculateDirectionFromPositions', () => {
    test('should calculate direction from two positions', () => {
      const from = { x: 0, y: 0 };
      const to = { x: 100, y: 0 };
      expect(calculateDirectionFromPositions(from, to)).toBe(Direction.EAST);
    });
    
    test('should handle diagonal movement', () => {
      const from = { x: 0, y: 0 };
      const to = { x: 100, y: 100 };
      expect(calculateDirectionFromPositions(from, to)).toBe(Direction.SOUTH_EAST);
    });
    
    test('should handle negative movement', () => {
      const from = { x: 100, y: 100 };
      const to = { x: 0, y: 0 };
      expect(calculateDirectionFromPositions(from, to)).toBe(Direction.NORTH_WEST);
    });
    
    test('should return null for same positions', () => {
      const from = { x: 50, y: 50 };
      const to = { x: 50, y: 50 };
      expect(calculateDirectionFromPositions(from, to)).toBeNull();
    });
  });
  
  describe('getDirectionAngle', () => {
    test('should return 0 for EAST', () => {
      expect(getDirectionAngle(Direction.EAST)).toBe(0);
    });
    
    test('should return PI/2 for NORTH', () => {
      expect(getDirectionAngle(Direction.NORTH)).toBeCloseTo(Math.PI / 2);
    });
    
    test('should return PI for WEST', () => {
      expect(getDirectionAngle(Direction.WEST)).toBeCloseTo(Math.PI);
    });
    
    test('should return -PI/2 for SOUTH', () => {
      expect(getDirectionAngle(Direction.SOUTH)).toBeCloseTo(-Math.PI / 2);
    });
    
    test('should return PI/4 for NORTH_EAST', () => {
      expect(getDirectionAngle(Direction.NORTH_EAST)).toBeCloseTo(Math.PI / 4);
    });
  });
  
  describe('getAngularDistance', () => {
    test('should return 0 for same direction', () => {
      expect(getAngularDistance(Direction.NORTH, Direction.NORTH)).toBe(0);
    });
    
    test('should return PI for opposite directions', () => {
      expect(getAngularDistance(Direction.NORTH, Direction.SOUTH)).toBeCloseTo(Math.PI);
      expect(getAngularDistance(Direction.EAST, Direction.WEST)).toBeCloseTo(Math.PI);
    });
    
    test('should return PI/2 for perpendicular directions', () => {
      expect(getAngularDistance(Direction.NORTH, Direction.EAST)).toBeCloseTo(Math.PI / 2);
      expect(getAngularDistance(Direction.SOUTH, Direction.WEST)).toBeCloseTo(Math.PI / 2);
    });
    
    test('should return shortest angular distance', () => {
      // NORTH to NORTH_EAST should be PI/4, not 7*PI/4
      expect(getAngularDistance(Direction.NORTH, Direction.NORTH_EAST)).toBeCloseTo(Math.PI / 4);
    });
  });
  
  describe('DirectionSmoother', () => {
    let smoother;
    
    beforeEach(() => {
      smoother = new DirectionSmoother({
        velocityThreshold: 10,
        directionHoldTime: 100,
        angularThreshold: Math.PI / 8
      });
    });
    
    describe('initialization', () => {
      test('should initialize with default direction', () => {
        expect(smoother.getDirection()).toBe(Direction.SOUTH);
      });
      
      test('should accept custom thresholds', () => {
        const customSmoother = new DirectionSmoother({
          velocityThreshold: 20,
          directionHoldTime: 200
        });
        
        expect(customSmoother.velocityThreshold).toBe(20);
        expect(customSmoother.directionHoldTime).toBe(200);
      });
    });
    
    describe('update', () => {
      test('should maintain direction for zero velocity', () => {
        const direction = smoother.update(0, 0);
        expect(direction).toBe(Direction.SOUTH);
      });
      
      test('should maintain direction for velocity below threshold', () => {
        const direction = smoother.update(5, 0);
        expect(direction).toBe(Direction.SOUTH);
      });
      
      test('should not change direction immediately', () => {
        // First update with EAST velocity
        const direction1 = smoother.update(100, 0, 0);
        expect(direction1).toBe(Direction.SOUTH); // Still SOUTH
        
        // Second update immediately after
        const direction2 = smoother.update(100, 0, 50);
        expect(direction2).toBe(Direction.SOUTH); // Still SOUTH (not enough time)
      });
      
      test('should change direction after hold time', (done) => {
        // Start with SOUTH
        expect(smoother.getDirection()).toBe(Direction.SOUTH);
        
        // Update with EAST velocity
        smoother.update(100, 0, 0);
        
        // Wait for hold time
        setTimeout(() => {
          const direction = smoother.update(100, 0, 150);
          expect(direction).toBe(Direction.EAST);
          done();
        }, 150);
      });
      
      test('should not change for small angular differences', () => {
        smoother.setDirection(Direction.EAST);
        
        // Slightly north-east velocity (small angular difference)
        const direction = smoother.update(100, -10, 0);
        expect(direction).toBe(Direction.EAST);
      });
      
      test('should reset pending direction on velocity change', () => {
        // Start moving EAST
        smoother.update(100, 0, 0);
        
        // Change to NORTH before hold time
        smoother.update(0, -100, 50);
        
        // Should still be SOUTH (original direction)
        expect(smoother.getDirection()).toBe(Direction.SOUTH);
      });
    });
    
    describe('setDirection', () => {
      test('should force set direction', () => {
        smoother.setDirection(Direction.NORTH);
        expect(smoother.getDirection()).toBe(Direction.NORTH);
      });
      
      test('should clear pending direction', () => {
        smoother.update(100, 0, 0); // Start pending EAST
        smoother.setDirection(Direction.WEST);
        
        const state = smoother.getState();
        expect(state.pendingDirection).toBeNull();
      });
    });
    
    describe('reset', () => {
      test('should reset to default direction', () => {
        smoother.setDirection(Direction.NORTH);
        smoother.reset();
        expect(smoother.getDirection()).toBe(Direction.SOUTH);
      });
      
      test('should reset to custom direction', () => {
        smoother.reset(Direction.EAST);
        expect(smoother.getDirection()).toBe(Direction.EAST);
      });
      
      test('should clear pending state', () => {
        smoother.update(100, 0, 0);
        smoother.reset();
        
        const state = smoother.getState();
        expect(state.pendingDirection).toBeNull();
        expect(state.pendingDuration).toBe(0);
      });
    });
    
    describe('getState', () => {
      test('should return current state', () => {
        const state = smoother.getState();
        
        expect(state).toHaveProperty('currentDirection');
        expect(state).toHaveProperty('pendingDirection');
        expect(state).toHaveProperty('pendingDuration');
        expect(state).toHaveProperty('velocityThreshold');
        expect(state).toHaveProperty('directionHoldTime');
        expect(state).toHaveProperty('angularThreshold');
      });
      
      test('should show pending state when direction is pending', () => {
        smoother.update(100, 0, 0);
        
        const state = smoother.getState();
        expect(state.pendingDirection).toBe(Direction.EAST);
        expect(state.pendingDuration).toBeGreaterThanOrEqual(0);
      });
    });
  });
  
  describe('getOppositeDirection', () => {
    test('should return opposite for cardinal directions', () => {
      expect(getOppositeDirection(Direction.NORTH)).toBe(Direction.SOUTH);
      expect(getOppositeDirection(Direction.SOUTH)).toBe(Direction.NORTH);
      expect(getOppositeDirection(Direction.EAST)).toBe(Direction.WEST);
      expect(getOppositeDirection(Direction.WEST)).toBe(Direction.EAST);
    });
    
    test('should return opposite for intercardinal directions', () => {
      expect(getOppositeDirection(Direction.NORTH_EAST)).toBe(Direction.SOUTH_WEST);
      expect(getOppositeDirection(Direction.SOUTH_EAST)).toBe(Direction.NORTH_WEST);
      expect(getOppositeDirection(Direction.SOUTH_WEST)).toBe(Direction.NORTH_EAST);
      expect(getOppositeDirection(Direction.NORTH_WEST)).toBe(Direction.SOUTH_EAST);
    });
  });
  
  describe('getAdjacentDirections', () => {
    test('should return adjacent directions for NORTH', () => {
      const adjacent = getAdjacentDirections(Direction.NORTH);
      expect(adjacent.clockwise).toBe(Direction.NORTH_EAST);
      expect(adjacent.counterclockwise).toBe(Direction.NORTH_WEST);
    });
    
    test('should return adjacent directions for EAST', () => {
      const adjacent = getAdjacentDirections(Direction.EAST);
      expect(adjacent.clockwise).toBe(Direction.SOUTH_EAST);
      expect(adjacent.counterclockwise).toBe(Direction.NORTH_EAST);
    });
    
    test('should wrap around at boundaries', () => {
      const adjacent = getAdjacentDirections(Direction.SOUTH_EAST);
      expect(adjacent.clockwise).toBe(Direction.SOUTH);
      expect(adjacent.counterclockwise).toBe(Direction.EAST);
    });
  });
  
  describe('areDirectionsAdjacent', () => {
    test('should return true for adjacent directions', () => {
      expect(areDirectionsAdjacent(Direction.NORTH, Direction.NORTH_EAST)).toBe(true);
      expect(areDirectionsAdjacent(Direction.NORTH, Direction.NORTH_WEST)).toBe(true);
      expect(areDirectionsAdjacent(Direction.EAST, Direction.NORTH_EAST)).toBe(true);
    });
    
    test('should return false for non-adjacent directions', () => {
      expect(areDirectionsAdjacent(Direction.NORTH, Direction.SOUTH)).toBe(false);
      expect(areDirectionsAdjacent(Direction.NORTH, Direction.EAST)).toBe(false);
      expect(areDirectionsAdjacent(Direction.EAST, Direction.WEST)).toBe(false);
    });
    
    test('should return false for same direction', () => {
      expect(areDirectionsAdjacent(Direction.NORTH, Direction.NORTH)).toBe(false);
    });
  });
  
  describe('getDirectionVector', () => {
    test('should return unit vector for EAST', () => {
      const vector = getDirectionVector(Direction.EAST);
      expect(vector.x).toBeCloseTo(1);
      expect(vector.y).toBeCloseTo(0);
    });
    
    test('should return unit vector for NORTH', () => {
      const vector = getDirectionVector(Direction.NORTH);
      expect(vector.x).toBeCloseTo(0);
      expect(vector.y).toBeCloseTo(1);
    });
    
    test('should return unit vector for SOUTH_EAST', () => {
      const vector = getDirectionVector(Direction.SOUTH_EAST);
      expect(vector.x).toBeCloseTo(Math.SQRT1_2);
      expect(vector.y).toBeCloseTo(-Math.SQRT1_2);
    });
    
    test('should return normalized vectors', () => {
      DIRECTIONS.forEach(direction => {
        const vector = getDirectionVector(direction);
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        expect(magnitude).toBeCloseTo(1);
      });
    });
  });
  
  describe('interpolateDirection', () => {
    test('should return from direction at t=0', () => {
      const result = interpolateDirection(Direction.NORTH, Direction.EAST, 0);
      expect(result).toBe(Direction.NORTH);
    });
    
    test('should return to direction at t=1', () => {
      const result = interpolateDirection(Direction.NORTH, Direction.EAST, 1);
      expect(result).toBe(Direction.EAST);
    });
    
    test('should interpolate between adjacent directions', () => {
      const result = interpolateDirection(Direction.NORTH, Direction.NORTH_EAST, 0.5);
      // Should round to one of the two
      expect([Direction.NORTH, Direction.NORTH_EAST]).toContain(result);
    });
    
    test('should take shortest path', () => {
      // From NORTH to SOUTH_EAST (clockwise is shorter)
      const result = interpolateDirection(Direction.NORTH, Direction.SOUTH_EAST, 0.5);
      expect([Direction.NORTH_EAST, Direction.EAST]).toContain(result);
    });
    
    test('should handle wrap-around', () => {
      const result = interpolateDirection(Direction.SOUTH_EAST, Direction.NORTH_EAST, 0.5);
      expect([Direction.EAST, Direction.SOUTH_EAST, Direction.NORTH_EAST]).toContain(result);
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle very small velocity values', () => {
      const direction = calculateDirection(0.001, 0.001);
      expect(direction).toBe(Direction.SOUTH_EAST);
    });
    
    test('should handle very large velocity values', () => {
      const direction = calculateDirection(1000000, 1000000);
      expect(direction).toBe(Direction.SOUTH_EAST);
    });
    
    test('should handle negative zero', () => {
      const direction = calculateDirection(-0, -0);
      expect(direction).toBeNull();
    });
    
    test('DirectionSmoother should handle rapid velocity changes', () => {
      const smoother = new DirectionSmoother({
        velocityThreshold: 10,
        directionHoldTime: 100
      });
      
      // Rapid changes
      smoother.update(100, 0, 0);
      smoother.update(0, 100, 10);
      smoother.update(-100, 0, 20);
      smoother.update(0, -100, 30);
      
      // Should still be at original direction
      expect(smoother.getDirection()).toBe(Direction.SOUTH);
    });
  });
  
  describe('Performance', () => {
    test('calculateDirection should be fast', () => {
      const iterations = 10000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        calculateDirection(Math.random() * 200 - 100, Math.random() * 200 - 100);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });
    
    test('DirectionSmoother.update should be fast', () => {
      const smoother = new DirectionSmoother();
      const iterations = 10000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        smoother.update(Math.random() * 200 - 100, Math.random() * 200 - 100, 16);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });
  });
});
