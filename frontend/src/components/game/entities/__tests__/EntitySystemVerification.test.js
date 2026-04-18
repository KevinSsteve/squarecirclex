/**
 * Entity System Verification Tests
 * 
 * Task 12 - Checkpoint: Verify Entity System
 * 
 * Tests:
 * - Entities can be created and destroyed
 * - Component addition/removal works
 * - Entity registry lookup performance
 * - No memory leaks
 * 
 * Phase 2, Task 12
 */

import Entity from '../Entity.js';
import EntityRegistry from '../EntityRegistry.js';
import AgentEntity, { AgentType, AgentState, createAgent } from '../AgentEntity.js';
import EnvironmentEntity, { EnvironmentType, createEnvironment, createWorkstation } from '../EnvironmentEntity.js';
import DepartmentEntity, { DepartmentType, createDepartment, createAllDepartments } from '../DepartmentEntity.js';

describe('Entity System Verification', () => {
  describe('Entity Creation and Destruction', () => {
    test('should create entity with unique ID', () => {
      const entity = new Entity('test-1', 'test');
      
      expect(entity.id).toBe('test-1');
      expect(entity.type).toBe('test');
      expect(entity.isActive()).toBe(true);
      expect(entity.isDestroyed()).toBe(false);
    });
    
    test('should destroy entity properly', () => {
      const entity = new Entity('test-1', 'test');
      
      entity.destroy();
      
      expect(entity.isDestroyed()).toBe(true);
      expect(entity.isActive()).toBe(false);
      expect(entity.components.size).toBe(0);
    });
    
    test('should create agent entity with all properties', () => {
      const agent = createAgent(AgentType.CONTENT_GENERATOR, { x: 100, y: 200, z: 0 });
      
      expect(agent).toBeInstanceOf(AgentEntity);
      expect(agent.agentType).toBe(AgentType.CONTENT_GENERATOR);
      expect(agent.getState()).toBe(AgentState.IDLE);
      expect(agent.hasComponent('position')).toBe(true);
      expect(agent.hasComponent('sprite')).toBe(true);
      expect(agent.hasComponent('animation')).toBe(true);
      expect(agent.hasComponent('task')).toBe(true);
      expect(agent.hasComponent('interaction')).toBe(true);
    });
    
    test('should create environment entity with all properties', () => {
      const env = createEnvironment(EnvironmentType.DESK, { x: 100, y: 200, z: 0 });
      
      expect(env).toBeInstanceOf(EnvironmentEntity);
      expect(env.environmentType).toBe(EnvironmentType.DESK);
      expect(env.hasComponent('position')).toBe(true);
      expect(env.hasComponent('sprite')).toBe(true);
    });
    
    test('should create department entity with all properties', () => {
      const dept = createDepartment(DepartmentType.CONTENT_CREATION);
      
      expect(dept).toBeInstanceOf(DepartmentEntity);
      expect(dept.departmentType).toBe(DepartmentType.CONTENT_CREATION);
      expect(dept.hasComponent('position')).toBe(true);
      expect(dept.getBounds()).toBeDefined();
      expect(dept.getGridBounds()).toBeDefined();
    });
    
    test('should create workstation with multiple furniture pieces', () => {
      const workstation = createWorkstation('BASIC', { x: 100, y: 200, z: 0 }, 'dept-1');
      
      expect(Array.isArray(workstation)).toBe(true);
      expect(workstation.length).toBeGreaterThan(0);
      
      workstation.forEach(furniture => {
        expect(furniture).toBeInstanceOf(EnvironmentEntity);
        expect(furniture.getWorkstation()).toBeDefined();
        expect(furniture.getWorkstation().workstationId).toBeDefined();
      });
    });
  });
  
  describe('Component Addition and Removal', () => {
    test('should add component to entity', () => {
      const entity = new Entity('test-1', 'test');
      
      entity.addComponent('position', { x: 100, y: 200 });
      
      expect(entity.hasComponent('position')).toBe(true);
      expect(entity.getComponent('position')).toEqual({ x: 100, y: 200 });
    });
    
    test('should remove component from entity', () => {
      const entity = new Entity('test-1', 'test');
      entity.addComponent('position', { x: 100, y: 200 });
      
      const removed = entity.removeComponent('position');
      
      expect(removed).toBe(true);
      expect(entity.hasComponent('position')).toBe(false);
      expect(entity.getComponent('position')).toBeNull();
    });
    
    test('should get all components from entity', () => {
      const entity = new Entity('test-1', 'test');
      entity.addComponent('position', { x: 100, y: 200 });
      entity.addComponent('sprite', { texture: 'test' });
      
      const components = entity.getAllComponents();
      
      expect(components.size).toBe(2);
      expect(components.has('position')).toBe(true);
      expect(components.has('sprite')).toBe(true);
    });
    
    test('should not add component to destroyed entity', () => {
      const entity = new Entity('test-1', 'test');
      entity.destroy();
      
      entity.addComponent('position', { x: 100, y: 200 });
      
      expect(entity.hasComponent('position')).toBe(false);
    });
    
    test('should not remove component from destroyed entity', () => {
      const entity = new Entity('test-1', 'test');
      entity.addComponent('position', { x: 100, y: 200 });
      entity.destroy();
      
      const removed = entity.removeComponent('position');
      
      expect(removed).toBe(false);
    });
  });
  
  describe('Entity Registry Lookup Performance', () => {
    test('should create entities in registry', () => {
      const registry = new EntityRegistry();
      
      const entity = registry.createEntity('test');
      
      expect(entity).toBeInstanceOf(Entity);
      expect(registry.hasEntity(entity.id)).toBe(true);
      expect(registry.getEntityCount()).toBe(1);
    });
    
    test('should lookup entity by ID efficiently', () => {
      const registry = new EntityRegistry();
      const entities = [];
      
      // Create 1000 entities
      for (let i = 0; i < 1000; i++) {
        entities.push(registry.createEntity('test'));
      }
      
      // Lookup should be O(1) - measure time
      const startTime = performance.now();
      const entity = registry.getEntity(entities[500].id);
      const endTime = performance.now();
      
      expect(entity).toBe(entities[500]);
      expect(endTime - startTime).toBeLessThan(1); // Should be < 1ms
    });
    
    test('should get entities by type efficiently', () => {
      const registry = new EntityRegistry();
      
      // Create 500 agents and 500 environments
      for (let i = 0; i < 500; i++) {
        registry.createEntity('agent');
        registry.createEntity('environment');
      }
      
      // Get by type should be efficient
      const startTime = performance.now();
      const agents = registry.getEntitiesByType('agent');
      const endTime = performance.now();
      
      expect(agents.length).toBe(500);
      expect(endTime - startTime).toBeLessThan(10); // Should be < 10ms
    });
    
    test('should query entities with component efficiently', () => {
      const registry = new EntityRegistry();
      
      // Create 1000 entities, half with position component
      for (let i = 0; i < 1000; i++) {
        const entity = registry.createEntity('test');
        if (i % 2 === 0) {
          entity.addComponent('position', { x: i, y: i });
        }
      }
      
      // Query should be reasonably fast
      const startTime = performance.now();
      const withPosition = registry.getEntitiesWithComponent('position');
      const endTime = performance.now();
      
      expect(withPosition.length).toBe(500);
      expect(endTime - startTime).toBeLessThan(50); // Should be < 50ms
    });
    
    test('should handle custom queries efficiently', () => {
      const registry = new EntityRegistry();
      
      // Create 1000 entities with varying properties
      for (let i = 0; i < 1000; i++) {
        const entity = registry.createEntity('test');
        entity.addComponent('position', { x: i, y: i });
      }
      
      // Custom query
      const startTime = performance.now();
      const filtered = registry.queryEntities(entity => {
        const pos = entity.getComponent('position');
        return pos && pos.x > 500;
      });
      const endTime = performance.now();
      
      expect(filtered.length).toBe(499);
      expect(endTime - startTime).toBeLessThan(50); // Should be < 50ms
    });
  });
  
  describe('Memory Leak Prevention', () => {
    test('should properly cleanup destroyed entities', () => {
      const registry = new EntityRegistry();
      
      // Create entities
      const entity1 = registry.createEntity('test');
      const entity2 = registry.createEntity('test');
      
      expect(registry.getEntityCount()).toBe(2);
      
      // Destroy one entity
      registry.destroyEntity(entity1.id);
      
      expect(registry.getEntityCount()).toBe(1);
      expect(registry.hasEntity(entity1.id)).toBe(false);
      expect(registry.hasEntity(entity2.id)).toBe(true);
    });
    
    test('should clear all references when destroying entity', () => {
      const registry = new EntityRegistry();
      const entity = registry.createEntity('test');
      
      entity.addComponent('position', { x: 100, y: 200 });
      entity.addComponent('sprite', { texture: 'test' });
      
      registry.destroyEntity(entity.id);
      
      expect(entity.isDestroyed()).toBe(true);
      expect(entity.components.size).toBe(0);
      expect(registry.getEntity(entity.id)).toBeNull();
    });
    
    test('should cleanup all entities when clearing registry', () => {
      const registry = new EntityRegistry();
      
      // Create many entities
      for (let i = 0; i < 100; i++) {
        registry.createEntity('test');
      }
      
      expect(registry.getEntityCount()).toBe(100);
      
      // Clear registry
      registry.clear();
      
      expect(registry.getEntityCount()).toBe(0);
      expect(registry.getStats().active).toBe(0);
    });
    
    test('should not leak memory when creating and destroying many entities', () => {
      const registry = new EntityRegistry();
      
      // Create and destroy 1000 entities
      for (let i = 0; i < 1000; i++) {
        const entity = registry.createEntity('test');
        entity.addComponent('position', { x: i, y: i });
        registry.destroyEntity(entity.id);
      }
      
      expect(registry.getEntityCount()).toBe(0);
      expect(registry.getStats().created).toBe(1000);
      expect(registry.getStats().destroyed).toBe(1000);
      expect(registry.getStats().active).toBe(0);
    });
  });
  
  describe('Agent Entity State Machine', () => {
    test('should transition between valid states', () => {
      const agent = createAgent(AgentType.CONTENT_GENERATOR, { x: 0, y: 0, z: 0 });
      
      expect(agent.getState()).toBe(AgentState.IDLE);
      
      // Valid transition: IDLE -> WORKING
      expect(agent.setState(AgentState.WORKING)).toBe(true);
      expect(agent.getState()).toBe(AgentState.WORKING);
      
      // Valid transition: WORKING -> CELEBRATING
      expect(agent.setState(AgentState.CELEBRATING)).toBe(true);
      expect(agent.getState()).toBe(AgentState.CELEBRATING);
      
      // Valid transition: CELEBRATING -> IDLE
      expect(agent.setState(AgentState.IDLE)).toBe(true);
      expect(agent.getState()).toBe(AgentState.IDLE);
    });
    
    test('should reject invalid state transitions', () => {
      const agent = createAgent(AgentType.CONTENT_GENERATOR, { x: 0, y: 0, z: 0 });
      
      expect(agent.getState()).toBe(AgentState.IDLE);
      
      // Invalid transition: IDLE -> CELEBRATING
      expect(agent.setState(AgentState.CELEBRATING)).toBe(false);
      expect(agent.getState()).toBe(AgentState.IDLE);
    });
    
    test('should track state history', () => {
      const agent = createAgent(AgentType.CONTENT_GENERATOR, { x: 0, y: 0, z: 0 });
      
      agent.setState(AgentState.WORKING);
      agent.setState(AgentState.CELEBRATING);
      agent.setState(AgentState.IDLE);
      
      const history = agent.getStateHistory();
      
      expect(history.length).toBe(4); // Initial IDLE + 3 transitions
      expect(history[0].state).toBe(AgentState.IDLE);
      expect(history[1].state).toBe(AgentState.WORKING);
      expect(history[2].state).toBe(AgentState.CELEBRATING);
      expect(history[3].state).toBe(AgentState.IDLE);
    });
  });
  
  describe('Environment Entity Occupancy', () => {
    test('should track single occupancy', () => {
      const desk = createEnvironment(EnvironmentType.DESK, { x: 0, y: 0, z: 0 });
      
      expect(desk.canBeOccupied()).toBe(true);
      expect(desk.isOccupied()).toBe(false);
      
      desk.occupy('agent-1');
      
      expect(desk.isOccupied()).toBe(true);
      expect(desk.getOccupants()).toBe('agent-1');
      
      desk.release();
      
      expect(desk.isOccupied()).toBe(false);
    });
    
    test('should track multi-occupancy', () => {
      const meetingRoom = createEnvironment(EnvironmentType.MEETING_ROOM, { x: 0, y: 0, z: 0 });
      
      expect(meetingRoom.canBeOccupied()).toBe(true);
      
      meetingRoom.occupy('agent-1');
      meetingRoom.occupy('agent-2');
      meetingRoom.occupy('agent-3');
      
      const occupants = meetingRoom.getOccupants();
      expect(occupants.length).toBe(3);
      expect(occupants).toContain('agent-1');
      expect(occupants).toContain('agent-2');
      expect(occupants).toContain('agent-3');
      
      meetingRoom.release('agent-2');
      
      expect(meetingRoom.getOccupants().length).toBe(2);
      expect(meetingRoom.getOccupants()).not.toContain('agent-2');
    });
  });
  
  describe('Department Entity Management', () => {
    test('should manage agents in department', () => {
      const dept = createDepartment(DepartmentType.CONTENT_CREATION);
      
      expect(dept.getAgents().length).toBe(0);
      
      dept.addAgent('agent-1');
      dept.addAgent('agent-2');
      
      expect(dept.getAgents().length).toBe(2);
      expect(dept.hasAgent('agent-1')).toBe(true);
      expect(dept.hasAgent('agent-2')).toBe(true);
      
      dept.removeAgent('agent-1');
      
      expect(dept.getAgents().length).toBe(1);
      expect(dept.hasAgent('agent-1')).toBe(false);
    });
    
    test('should manage furniture in department', () => {
      const dept = createDepartment(DepartmentType.CONTENT_CREATION);
      
      dept.addFurniture('desk-1');
      dept.addFurniture('chair-1');
      
      expect(dept.getFurniture().length).toBe(2);
      expect(dept.hasFurniture('desk-1')).toBe(true);
      
      dept.removeFurniture('desk-1');
      
      expect(dept.getFurniture().length).toBe(1);
      expect(dept.hasFurniture('desk-1')).toBe(false);
    });
    
    test('should check point containment', () => {
      const dept = createDepartment(DepartmentType.CONTENT_CREATION);
      const bounds = dept.getBounds();
      
      // Point inside
      expect(dept.containsPoint(bounds.x + 10, bounds.y + 10)).toBe(true);
      
      // Point outside
      expect(dept.containsPoint(bounds.x - 10, bounds.y - 10)).toBe(false);
    });
  });
  
  describe('Serialization and Deserialization', () => {
    test('should serialize and deserialize entity', () => {
      const entity = new Entity('test-1', 'test');
      entity.addComponent('position', { x: 100, y: 200 });
      
      const json = entity.toJSON();
      const restored = Entity.fromJSON(json);
      
      expect(restored.id).toBe(entity.id);
      expect(restored.type).toBe(entity.type);
      expect(restored.hasComponent('position')).toBe(true);
      expect(restored.getComponent('position')).toEqual({ x: 100, y: 200 });
    });
    
    test('should serialize and deserialize agent entity', () => {
      const agent = createAgent(AgentType.CONTENT_GENERATOR, { x: 100, y: 200, z: 0 });
      agent.setState(AgentState.WORKING);
      
      const json = agent.toJSON();
      const restored = AgentEntity.fromJSON(json);
      
      expect(restored.id).toBe(agent.id);
      expect(restored.agentType).toBe(agent.agentType);
      expect(restored.getState()).toBe(AgentState.WORKING);
    });
    
    test('should serialize and deserialize entity registry', () => {
      const registry = new EntityRegistry();
      
      registry.createEntity('test');
      registry.createEntity('test');
      
      const json = registry.toJSON();
      
      const newRegistry = new EntityRegistry();
      newRegistry.fromJSON(json);
      
      expect(newRegistry.getEntityCount()).toBe(2);
      expect(newRegistry.getStats().created).toBe(registry.getStats().created);
    });
  });
  
  describe('Integration Tests', () => {
    test('should create complete office with all entity types', () => {
      const registry = new EntityRegistry();
      
      // Create departments
      const departments = createAllDepartments();
      departments.forEach(dept => {
        registry.entities.set(dept.id, dept);
      });
      
      // Create agents
      const agent1 = createAgent(AgentType.CONTENT_GENERATOR, { x: 100, y: 100, z: 0 });
      const agent2 = createAgent(AgentType.PUBLISHER, { x: 200, y: 100, z: 0 });
      registry.entities.set(agent1.id, agent1);
      registry.entities.set(agent2.id, agent2);
      
      // Create furniture
      const desk = createEnvironment(EnvironmentType.DESK, { x: 100, y: 100, z: 0 });
      registry.entities.set(desk.id, desk);
      
      expect(registry.getEntityCount()).toBe(5 + 2 + 1); // 5 depts + 2 agents + 1 furniture
    });
    
    test('should handle entity relationships', () => {
      const dept = createDepartment(DepartmentType.CONTENT_CREATION);
      const agent = createAgent(AgentType.CONTENT_GENERATOR, { x: 100, y: 100, z: 0 });
      const desk = createEnvironment(EnvironmentType.DESK, { x: 100, y: 100, z: 0 }, dept.id);
      
      // Assign agent to department
      agent.assignToDepartment(dept.id);
      dept.addAgent(agent.id);
      
      // Assign furniture to department
      desk.assignToDepartment(dept.id);
      dept.addFurniture(desk.id);
      
      // Agent occupies desk
      desk.occupy(agent.id);
      
      expect(agent.getDepartment()).toBe(dept.id);
      expect(dept.hasAgent(agent.id)).toBe(true);
      expect(dept.hasFurniture(desk.id)).toBe(true);
      expect(desk.isOccupied()).toBe(true);
      expect(desk.getOccupants()).toBe(agent.id);
    });
  });
});
