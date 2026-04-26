# Design Document

## Introduction

This document provides the technical design for upgrading the game layer from simple 2D geometric shapes to a rich 3D isometric office environment. The design maintains the existing PixiJS architecture while introducing pre-rendered 3D isometric sprites for visual depth and detail.

## Architecture Overview

### High-Level Approach

We will use **PixiJS with Pre-rendered 3D Isometric Sprites** (Hybrid 2D/3D approach):

- Maintain existing PixiJS rendering engine
- Use pre-rendered 3D isometric sprites for all visual elements
- Implement shadow system using sprite overlays
- Add depth sorting for proper layering
- Enhance existing layer system for 3D visual hierarchy

**Rationale**: This approach provides excellent visual quality while maintaining performance and compatibility with the existing codebase. It avoids the complexity of a full 3D engine while achieving convincing 3D visuals.

## System Components

### 1. Asset Management System

**Purpose**: Load, cache, and manage 3D isometric sprite assets

**Components**:
- `AssetManifest.js` - Defines all assets with metadata
- Enhanced `AssetLoader.js` - Already exists, will be extended
- `SpriteAtlasManager.js` - Manages sprite sheets and atlases
- `AssetPreloader.js` - Preloads critical assets on startup

**Asset Structure**:
```
/public/assets/
  /sprites/
    /furniture/
      - desks.png (sprite sheet)
      - desks.json (atlas definition)
      - chairs.png
      - chairs.json
      - shelves.png
      - shelves.json
    /decorations/
      - plants.png
      - plants.json
      - wall-art.png
      - wall-art.json
    /characters/
      - agents-idle.png (8 directions)
      - agents-idle.json
      - agents-walking.png (8 directions × 4 frames)
      - agents-walking.json
      - agents-working.png (4 frames)
      - agents-working.json
    /environment/
      - floors.png
      - floors.json
      - walls.png
      - walls.json
      - carpets.png
      - carpets.json
    /shadows/
      - object-shadows.png
      - character-shadows.png
```

**Asset Acquisition Strategy**:
1. **Phase 1**: Use free assets from Kenney.nl or OpenGameArt
2. **Phase 2**: Purchase premium asset pack if needed ($20-50)
3. **Phase 3**: Commission custom assets for unique elements

### 2. Enhanced Layer System

**Purpose**: Extend existing layer system for proper 3D depth sorting

**Current Layers** (from Scene.js):
- `background` - Floor and base environment
- `furniture_back` - Furniture behind agents
- `agents` - Character sprites
- `furniture_front` - Furniture in front of agents
- `effects` - Particles and visual effects
- `ui_world` - World-space UI elements

**New Layers**:
- `floor` - Floor tiles and carpets (z-index: 0)
- `floor_decorations` - Rugs, floor markings (z-index: 5)
- `walls_back` - Back walls (z-index: 8)
- `shadows` - Shadow sprites (z-index: 15)
- `furniture_back` - Existing (z-index: 20)
- `agents` - Existing (z-index: 30)
- `furniture_front` - Existing (z-index: 40)
- `walls_front` - Front walls, windows (z-index: 45)
- `effects` - Existing (z-index: 50)
- `ui_world` - Existing (z-index: 60)

**Depth Sorting Algorithm**:
```javascript
// Y-sorting within layers for isometric depth
function sortByDepth(a, b) {
  // Primary sort: layer z-index
  if (a.layer.zIndex !== b.layer.zIndex) {
    return a.layer.zIndex - b.layer.zIndex;
  }
  
  // Secondary sort: Y position (isometric depth)
  if (a.y !== b.y) {
    return a.y - b.y;
  }
  
  // Tertiary sort: X position (for same Y)
  return a.x - b.x;
}
```

### 3. Shadow System

**Purpose**: Render realistic shadows for depth perception

**Implementation**:
- `ShadowSystem.js` - New system class
- Shadow sprites attached to entities
- Dynamic shadow positioning based on entity position
- Soft shadows using alpha blending

**Shadow Types**:
1. **Character Shadows**: Circular, follows agent movement
2. **Furniture Shadows**: Pre-rendered with furniture sprites
3. **Ambient Occlusion**: Baked into floor tiles

**Shadow Rendering**:
```javascript
class ShadowSystem {
  constructor(scene) {
    this.scene = scene;
    this.shadowLayer = scene.layers.shadows;
    this.shadowCache = new Map();
  }
  
  createShadow(entity, type = 'circular') {
    const shadow = new PIXI.Sprite(this.getShadowTexture(type));
    shadow.anchor.set(0.5, 0.5);
    shadow.alpha = 0.3;
    shadow.tint = 0x000000;
    
    this.shadowLayer.addChild(shadow);
    this.shadowCache.set(entity.id, shadow);
    
    return shadow;
  }
  
  updateShadow(entityId, x, y) {
    const shadow = this.shadowCache.get(entityId);
    if (shadow) {
      shadow.x = x;
      shadow.y = y + 10; // Offset slightly below entity
    }
  }
}
```

### 4. Department Visual System

**Purpose**: Transform simple rectangles into rich office areas

**Components**:
- `DepartmentRenderer.js` - Renders department visuals
- `FurnitureLayout.js` - Defines furniture placement per department
- `DepartmentThemes.js` - Color schemes and decoration themes

**Department Themes**:

1. **Content Creation** (Indigo):
   - Creative workspace with whiteboards
   - Colorful post-it notes
   - Inspiration boards
   - Plants and creative decorations
   - Casual seating areas

2. **Publishing** (Green):
   - Multiple monitor setups
   - Publishing schedule boards
   - Calendar displays
   - Organized workstations

3. **Trend Analysis** (Amber):
   - Data visualization displays
   - Charts and graphs on walls
   - Research materials
   - Coffee station

4. **Customer Support** (Purple):
   - Headset stations
   - Support ticket boards
   - Comfortable seating
   - FAQ posters

5. **Administration** (Gray):
   - Executive desks
   - Filing cabinets
   - Meeting area
   - Professional decor

**Furniture Placement Algorithm**:
```javascript
class FurnitureLayout {
  static getLayoutForDepartment(departmentId) {
    const layouts = {
      content_creation: [
        { type: 'desk', gridX: 3, gridY: 3, rotation: 0 },
        { type: 'desk', gridX: 5, gridY: 3, rotation: 0 },
        { type: 'whiteboard', gridX: 2, gridY: 2, rotation: 0 },
        { type: 'plant_large', gridX: 7, gridY: 4, rotation: 0 },
        { type: 'chair', gridX: 3, gridY: 4, rotation: 180 },
        { type: 'chair', gridX: 5, gridY: 4, rotation: 180 }
      ],
      // ... other departments
    };
    
    return layouts[departmentId] || [];
  }
}
```

### 5. Character Sprite System

**Purpose**: Replace simple circles with detailed 3D character sprites

**Components**:
- Enhanced `AgentEntity.js` - Already exists, will be extended
- `CharacterSpriteManager.js` - Manages character sprites
- Enhanced `AnimationSystem.js` - Already exists, will be extended

**Character Sprite Requirements**:
- 8 directional sprites (N, NE, E, SE, S, SW, W, NW)
- 4 animation states: idle, walking, working, celebrating
- 4-8 frames per animation
- Consistent art style across all characters

**Animation State Machine**:
```javascript
// Already exists in AgentEntity.js, will be enhanced
class CharacterAnimationController {
  constructor(entity, spriteManager) {
    this.entity = entity;
    this.spriteManager = spriteManager;
    this.currentAnimation = 'idle';
    this.currentDirection = 'S';
    this.frameIndex = 0;
  }
  
  update(deltaTime) {
    // Update animation based on entity state
    const state = this.entity.getState();
    const velocity = this.entity.getComponent('position').velocity;
    
    // Determine animation
    if (state === AgentState.WORKING) {
      this.setAnimation('working');
    } else if (state === AgentState.CELEBRATING) {
      this.setAnimation('celebrating');
    } else if (velocity.x !== 0 || velocity.y !== 0) {
      this.setAnimation('walking');
      this.updateDirection(velocity);
    } else {
      this.setAnimation('idle');
    }
    
    // Update sprite frame
    this.updateFrame(deltaTime);
  }
  
  updateDirection(velocity) {
    // Calculate direction from velocity
    const angle = Math.atan2(velocity.y, velocity.x);
    const directions = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    const index = Math.round((angle + Math.PI) / (Math.PI / 4)) % 8;
    this.currentDirection = directions[index];
  }
}
```

### 6. Lighting and Visual Effects

**Purpose**: Add depth and atmosphere through lighting

**Components**:
- `LightingSystem.js` - Manages ambient lighting
- `HighlightEffect.js` - Hover and selection highlights
- Enhanced `ParticleSystem.js` - Already exists, will be extended

**Lighting Approach**:
- Pre-baked lighting in sprites (no dynamic lighting)
- Ambient color overlay for time-of-day effects
- Highlight effects for interactivity

**Highlight Effects**:
```javascript
class HighlightEffect {
  static applyHoverEffect(sprite) {
    // Add subtle glow on hover
    sprite.filters = [
      new PIXI.filters.GlowFilter({
        distance: 10,
        outerStrength: 2,
        color: 0xFFFFFF,
        quality: 0.5
      })
    ];
  }
  
  static applySelectionEffect(sprite) {
    // Add stronger glow on selection
    sprite.filters = [
      new PIXI.filters.GlowFilter({
        distance: 15,
        outerStrength: 3,
        color: 0x4F46E5,
        quality: 0.5
      })
    ];
  }
  
  static clearEffects(sprite) {
    sprite.filters = [];
  }
}
```

## Data Flow

### Asset Loading Flow

```
1. App Initialization
   ↓
2. AssetManifest.load()
   ↓
3. AssetLoader.loadCriticalAssets()
   - Floor tiles
   - Basic furniture
   - Character idle sprites
   ↓
4. Show Loading Screen (progress bar)
   ↓
5. AssetLoader.loadNonCriticalAssets() (background)
   - Decorations
   - Additional animations
   - Effects
   ↓
6. Initialize Game Scene
   ↓
7. Render with loaded assets
```

### Rendering Flow

```
1. Scene.update(deltaTime)
   ↓
2. Update all entities
   ↓
3. Update character animations
   ↓
4. Update shadow positions
   ↓
5. Sort sprites by depth
   ↓
6. Render layers in order:
   - floor
   - floor_decorations
   - walls_back
   - shadows
   - furniture_back
   - agents (with depth sorting)
   - furniture_front
   - walls_front
   - effects
   - ui_world
   ↓
7. Apply post-processing effects
   ↓
8. Render to screen
```

## Performance Considerations

### Optimization Strategies

1. **Sprite Batching** (Already implemented in SpriteBatchOptimizer.js):
   - Group sprites by texture
   - Minimize draw calls
   - Use sprite sheets

2. **Culling** (Already implemented in CullingSystem.js):
   - Only render visible sprites
   - Frustum culling based on camera viewport

3. **LOD System** (Already implemented in LODSystem.js):
   - Reduce detail for distant objects
   - Simplify animations when far from camera

4. **Asset Streaming**:
   - Load critical assets first
   - Stream non-critical assets in background
   - Unload unused assets

5. **Texture Atlases**:
   - Combine multiple sprites into single texture
   - Reduce texture switching overhead

### Performance Targets

- **60 FPS** on desktop (1920×1080)
- **30 FPS** on mobile devices
- **< 3 seconds** initial load time
- **< 100 MB** total asset size

## Integration Points

### Existing Systems to Enhance

1. **Scene.js**:
   - Add new layers
   - Enhance depth sorting
   - Integrate ShadowSystem

2. **AgentEntity.js**:
   - Replace circle graphics with sprite
   - Add character animation controller
   - Update visual representation

3. **DepartmentEntity.js**:
   - Add furniture placement
   - Add decorations
   - Add themed visuals

4. **AnimationSystem.js**:
   - Support sprite-based animations
   - Add direction-based animation selection
   - Enhance frame management

5. **AssetLoader.js**:
   - Add sprite sheet loading
   - Add atlas parsing
   - Enhance progress tracking

### New Systems to Create

1. **ShadowSystem.js** - Shadow rendering
2. **DepartmentRenderer.js** - Department visuals
3. **CharacterSpriteManager.js** - Character sprite management
4. **LightingSystem.js** - Ambient lighting
5. **SpriteAtlasManager.js** - Sprite atlas management

## Testing Strategy

### Visual Testing

1. **Screenshot Comparison**:
   - Capture before/after screenshots
   - Verify visual improvements
   - Check for rendering artifacts

2. **Animation Testing**:
   - Verify smooth transitions
   - Check all 8 directions
   - Test all animation states

3. **Depth Sorting Testing**:
   - Verify correct layering
   - Test edge cases (same Y position)
   - Check shadow rendering

### Performance Testing

1. **FPS Monitoring**:
   - Test with 1, 5, 10, 20 agents
   - Monitor frame rate
   - Identify bottlenecks

2. **Memory Testing**:
   - Monitor texture memory usage
   - Check for memory leaks
   - Verify asset cleanup

3. **Load Time Testing**:
   - Measure initial load time
   - Test on slow connections
   - Verify progressive loading

## Rollout Strategy

### Phase 1: Foundation (Days 1-3)
- Acquire/create basic asset set
- Implement ShadowSystem
- Enhance layer system
- Add sprite atlas support

### Phase 2: Departments (Days 4-6)
- Implement DepartmentRenderer
- Add furniture for all departments
- Add floor and wall visuals
- Test depth sorting

### Phase 3: Characters (Days 7-9)
- Implement CharacterSpriteManager
- Add character sprites
- Enhance AnimationSystem
- Test all animations

### Phase 4: Polish (Days 10-12)
- Add decorations
- Implement lighting effects
- Add particle effects
- Performance optimization

### Phase 5: Testing & Refinement (Days 13-15)
- Visual testing
- Performance testing
- Bug fixes
- Final polish

## Risk Mitigation

### Technical Risks

1. **Asset Quality**:
   - Risk: Free assets may not match desired quality
   - Mitigation: Budget for premium assets if needed

2. **Performance**:
   - Risk: Too many sprites may impact performance
   - Mitigation: Aggressive culling and LOD system

3. **Depth Sorting Complexity**:
   - Risk: Complex scenes may have sorting artifacts
   - Mitigation: Careful layer design and testing

### Schedule Risks

1. **Asset Acquisition Delays**:
   - Risk: Finding suitable assets takes longer than expected
   - Mitigation: Start asset search immediately, have backup options

2. **Integration Complexity**:
   - Risk: Integration with existing systems more complex than expected
   - Mitigation: Incremental approach, test each component

## Success Criteria

1. **Visual Quality**:
   - ✅ Rich 3D isometric office environment
   - ✅ Detailed furniture and decorations
   - ✅ Smooth character animations
   - ✅ Realistic shadows

2. **Performance**:
   - ✅ 60 FPS on desktop
   - ✅ < 3 second load time
   - ✅ Smooth animations

3. **Maintainability**:
   - ✅ Clean code architecture
   - ✅ Easy to add new assets
   - ✅ Well-documented systems

4. **User Experience**:
   - ✅ Engaging visual presentation
   - ✅ Clear department differentiation
   - ✅ Intuitive depth perception

## Conclusion

This design provides a clear path to transform the game layer into a rich 3D isometric office environment while maintaining the existing PixiJS architecture. The hybrid approach of using pre-rendered 3D sprites offers the best balance of visual quality, performance, and development complexity.

The incremental rollout strategy allows for early validation and course correction, while the comprehensive testing strategy ensures quality and performance targets are met.
