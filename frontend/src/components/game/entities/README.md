# Entity System Documentation

## Overview

The Entity System is a component-based architecture for managing all game objects in the V4 Frontend Game Layer. It provides a flexible, composable approach to entity management where entities are defined by the components they contain rather than through inheritance.

**Phase:** Phase 2 - Entity Component System  
**Task:** Task 7 - Implement core entity system  
**Requirements:** 2.1, 2.5

## Architecture

### Component-Based Design

Instead of using inheritance hierarchies, entities are composed of components:

```javascript
// Create an agent entity
const agent = entityRegistry.createEntity('agent', 'agent-1');

// Add components to define behavior
agent.addComponent('position', createPositionComponent(100, 200, 0));
agent.addComponent('sprite', createSpriteComponent('agent_idle'));
agent.addComponent('animation', createAnimationComponent('idle'));
agent.addComponent('task', createTaskComponent());
agent.addComponent('interaction', createInteractionComponent());
```

### Benefits

1. **Flexibility**: Entities can have any combination of components
2. **Reusability**: Components can be shared across entity types
3. **Maintainability**: Changes to one component don't affect others
4. **Performance**: Easy to query entities by component type
5. **Extensibility**: New components can be added without modifying existing code

## Core Classes

### Entity

Base class for all game entities. Manages component storage and lifecycle.

**Key Methods:**
- `addComponent(type, data)` - Add a component
- `getComponent(type)` - Get a component
- `hasComponent(type)` - Check if component exists
- `removeComponent(type)` - Remove a component
- `update(deltaTime)` - Update entity (called every frame)
- `destroy()` - Mark entity for destruction

**Example:**
```javascript
const entity = new Entity('entity-1', 'agent');
entity.addComponent('position', { x: 100, y: 200, z: 0 });
const pos = entity.getComponent('position');
console.log(pos.x, pos.y); // 100, 200
```

### EntityRegistry

Centralized registry for managing all entities in the game world.

**Key Methods:**
- `createEntity(type, id?)` - Create a new entity
- `getEntity(id)` - Get entity by ID
- `getEntitiesByType(type)` - Get all entities of a type
- `getEntitiesWithComponent(componentType)` - Query by component
- `destroyEntity(id)` - Destroy an entity
- `update(deltaTime)` - Update all active entities

**Example:**
```javascript
const registry = new EntityRegistry();

// Create entities
const agent1 = registry.createEntity('agent');
const agent2 = registry.createEntity('agent');
const desk = registry.createEntity('environment');

// Query entities
const allAgents = registry.getEntitiesByType('agent');
console.log(allAgents.length); // 2

// Destroy entity
registry.destroyEntity(agent1.id);
```

## Component Types

### PositionComponent

Stores spatial data for entities in the game world.

**Properties:**
- `x`, `y`, `z` - World coordinates
- `rotation` - Rotation in degrees
- `scale` - Scale factor

**Functions:**
```javascript
import { createPositionComponent, getDistance } from './components';

const pos1 = createPositionComponent(100, 200, 0);
const pos2 = createPositionComponent(150, 250, 0);
const distance = getDistance(pos1, pos2);
```

### SpriteComponent

Visual representation for entities.

**Properties:**
- `textureId` - ID of texture to use
- `scale` - Scale factor
- `rotation` - Rotation in degrees
- `tint` - Color tint
- `alpha` - Opacity (0.0-1.0)
- `visible` - Visibility flag
- `pixiSprite` - Reference to PIXI sprite

**Functions:**
```javascript
import { createSpriteComponent, showSprite, hideSprite } from './components';

const sprite = createSpriteComponent('agent_idle', 1.0, 0, 0xFFFFFF);
const hidden = hideSprite(sprite);
const shown = showSprite(hidden);
```

### AnimationComponent

Animation state for entities.

**Properties:**
- `currentAnimation` - Name of current animation
- `frameIndex` - Current frame
- `animationSpeed` - Playback speed multiplier
- `loop` - Whether to loop
- `playing` - Whether animation is playing

**Functions:**
```javascript
import { createAnimationComponent, playAnimation } from './components';

const anim = createAnimationComponent('idle');
const walking = playAnimation(anim, 'walk', true);
```

### TaskComponent

Task tracking for agent entities.

**Properties:**
- `currentTask` - Currently executing task
- `taskQueue` - Queue of pending tasks
- `taskHistory` - History of completed tasks
- `stats` - Task statistics

**Functions:**
```javascript
import { createTaskComponent, assignTask, queueTask } from './components';

const taskComp = createTaskComponent();
const assigned = assignTask(taskComp, { id: 'task-1', type: 'generate_content' });
const queued = queueTask(assigned, { id: 'task-2', type: 'publish_post' });
```

### InteractionComponent

User interaction state for entities.

**Properties:**
- `clickable` - Whether entity can be clicked
- `hoverable` - Whether entity responds to hover
- `draggable` - Whether entity can be dragged
- `contextMenu` - Context menu items
- `state` - Interaction state (hovered, selected, dragging)

**Functions:**
```javascript
import { createInteractionComponent, setSelected } from './components';

const interaction = createInteractionComponent(true, true, false);
const selected = setSelected(interaction, true);
```

## Usage Patterns

### Creating an Agent Entity

```javascript
import { EntityRegistry } from './entities';
import {
  createPositionComponent,
  createSpriteComponent,
  createAnimationComponent,
  createTaskComponent,
  createInteractionComponent
} from './entities';

const registry = new EntityRegistry();

// Create agent entity
const agent = registry.createEntity('agent', 'agent-content-generator-1');

// Add components
agent.addComponent('position', createPositionComponent(400, 300, 0));
agent.addComponent('sprite', createSpriteComponent('agent_idle', 1.0));
agent.addComponent('animation', createAnimationComponent('idle', 0, 1.0, true));
agent.addComponent('task', createTaskComponent(null, [], []));
agent.addComponent('interaction', createInteractionComponent(true, true, false));

// Add metadata
agent.metadata = {
  name: 'Content Generator',
  type: 'content_generator',
  department: 'content_creation'
};
```

### Querying Entities

```javascript
// Get all agents
const agents = registry.getEntitiesByType('agent');

// Get all entities with position component
const positioned = registry.getEntitiesWithComponent('position');

// Custom query
const workingAgents = registry.queryEntities(entity => {
  const task = entity.getComponent('task');
  return task && task.currentTask !== null;
});
```

### Updating Entities

```javascript
// Update single entity
const agent = registry.getEntity('agent-1');
const position = agent.getComponent('position');
agent.addComponent('position', { ...position, x: position.x + 10 });

// Update all entities (called every frame)
registry.update(deltaTime);
```

### Destroying Entities

```javascript
// Destroy single entity
registry.destroyEntity('agent-1');

// Destroy all entities of a type
registry.destroyEntitiesByType('agent');

// Destroy all entities
registry.destroyAllEntities();
```

## Integration with Scene

The EntityRegistry is integrated with the Scene class:

```javascript
import Scene from './Scene';

const scene = new Scene(app);
const registry = scene.getEntityRegistry();

// Create entities through registry
const agent = registry.createEntity('agent');

// Entities are automatically updated in scene.update()
scene.update(deltaTime);
```

## Future Enhancements

### Task 8: Define Entity Components
- More specialized components
- Component validation
- Component dependencies

### Task 9: Implement Agent Entity Type
- AgentEntity subclass
- Agent state machine
- Agent-specific behaviors

### Task 10: Implement Environment Entity Types
- EnvironmentEntity subclass
- Furniture types
- Occupancy tracking

### Task 11: Create Department Entity System
- DepartmentEntity subclass
- Department bounds
- Agent-to-department assignment

## Performance Considerations

1. **Component Storage**: Components stored in Map for O(1) lookup
2. **Type Indexing**: Entities indexed by type for fast queries
3. **Active Filtering**: Only active entities are updated
4. **Memory Management**: Destroyed entities are removed from registry
5. **Batch Updates**: All entities updated in single pass

## Testing

The entity system should be tested for:

1. **Entity Creation**: Entities created with unique IDs
2. **Component Management**: Components can be added/removed
3. **Entity Queries**: Queries return correct entities
4. **Entity Destruction**: Entities properly cleaned up
5. **Memory Leaks**: No references retained after destruction
6. **Performance**: Update loop maintains 60 FPS

## Debugging

Use the debug overlay to inspect entity state:

```javascript
// Get entity stats
const stats = registry.getStats();
console.log('Total entities:', stats.total);
console.log('By type:', stats.byType);

// Serialize entity for inspection
const entity = registry.getEntity('agent-1');
console.log(JSON.stringify(entity.toJSON(), null, 2));
```

## Conclusion

The Entity System provides a solid foundation for Phase 2 and beyond. Its component-based architecture enables flexible entity composition while maintaining performance and maintainability.

**Status:** ✅ Task 7 Complete - Core entity system implemented

**Next:** Task 8 - Define entity components (specialized components for different entity types)
