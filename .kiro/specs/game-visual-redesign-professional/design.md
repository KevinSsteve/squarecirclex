# Design Document - Professional Game Visual Redesign

## Introduction

This document outlines the technical architecture and implementation approach for the complete visual redesign of the AI Company Simulator game to achieve professional aesthetics inspired by pixel art tilesets and modern isometric business simulation games.

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     GameView (React)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              PixiJS Application                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           Scene Manager                          │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐            │  │  │
│  │  │  │ Asset System │  │ Render System│            │  │  │
│  │  │  └──────────────┘  └──────────────┘            │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐            │  │  │
│  │  │  │ Tileset Mgr  │  │ Sprite Mgr   │            │  │  │
│  │  │  └──────────────┘  └──────────────┘            │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐            │  │  │
│  │  │  │ Animation    │  │ Lighting     │            │  │  │
│  │  │  └──────────────┘  └──────────────┘            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Asset Files → AssetLoader → SpriteAtlasManager → Renderers → PixiJS Stage
     ↓
Asset Manifest (JSON)
     ↓
Metadata & Configuration
```

## Component Design

### 1. Asset Management System

#### TilesetManager
**Purpose**: Load, manage, and provide access to tileset textures

**Interface**:
```javascript
class TilesetManager {
  constructor(assetLoader)
  
  // Load a tileset from sprite atlas
  async loadTileset(tilesetId, atlasPath, metadataPath)
  
  // Get a specific tile texture by ID
  getTile(tilesetId, tileId)
  
  // Get all tiles in a category (e.g., "floors", "walls")
  getTilesByCategory(tilesetId, category)
  
  // Unload tileset to free memory
  unloadTileset(tilesetId)
  
  // Get tileset metadata
  getMetadata(tilesetId)
}
```

**Data Structure**:
```javascript
// Tileset Metadata (JSON)
{
  "id": "office-interior-16x16",
  "tileSize": 16,
  "tiles": [
    {
      "id": "floor_carpet_01",
      "category": "floors",
      "frame": { "x": 0, "y": 0, "w": 16, "h": 16 },
      "tags": ["carpet", "blue", "office"]
    },
    {
      "id": "wall_vertical_01",
      "category": "walls",
      "frame": { "x": 16, "y": 0, "w": 16, "h": 16 },
      "autoTile": true,
      "connections": ["top", "bottom"]
    }
  ]
}
```

#### CharacterSpriteManager (Enhanced)
**Purpose**: Manage character sprite sheets with 8-directional animations

**Interface**:
```javascript
class CharacterSpriteManager {
  // Existing methods...
  
  // Load character sprite sheet with 8 directions
  async loadCharacterSpriteSheet(characterType, atlasPath, metadataPath)
  
  // Get animation frames for specific direction and state
  getAnimationFrames(characterType, direction, state)
  
  // Get idle animation for direction
  getIdleAnimation(characterType, direction)
  
  // Get walking animation for direction
  getWalkingAnimation(characterType, direction)
  
  // Get working animation
  getWorkingAnimation(characterType)
}
```

**Data Structure**:
```javascript
// Character Sprite Metadata
{
  "id": "agent-professional",
  "spriteSize": { "w": 16, "h": 24 },
  "directions": ["n", "ne", "e", "se", "s", "sw", "w", "nw"],
  "states": {
    "idle": {
      "frames": 4,
      "fps": 4,
      "loop": true
    },
    "walk": {
      "frames": 6,
      "fps": 12,
      "loop": true
    },
    "work": {
      "frames": 8,
      "fps": 8,
      "loop": true
    }
  },
  "animations": [
    {
      "state": "walk",
      "direction": "s",
      "frames": [
        { "x": 0, "y": 0, "w": 16, "h": 24 },
        { "x": 16, "y": 0, "w": 16, "h": 24 }
      ]
    }
  ]
}
```

### 2. Rendering System

#### TileRenderer
**Purpose**: Render tile-based floors, walls, and furniture

**Interface**:
```javascript
class TileRenderer {
  constructor(scene, tilesetManager)
  
  // Render floor tiles for a department
  renderFloor(department, tilesetId, tileId, bounds)
  
  // Render walls with auto-tiling
  renderWalls(department, tilesetId, wallConfig)
  
  // Place furniture sprite at position
  placeFurniture(furnitureId, position, tilesetId, tileId)
  
  // Clear and re-render area
  refreshArea(bounds)
  
  // Get container for specific layer
  getLayer(layerName)
}
```

**Layers** (bottom to top):
1. Floor layer (z-index: 0)
2. Floor decorations (z-index: 1)
3. Furniture base (z-index: 2)
4. Characters (z-index: 3)
5. Furniture top (z-index: 4) - for items that should appear above characters
6. Effects (z-index: 5)
7. UI overlay (z-index: 6)

#### IsometricRenderer
**Purpose**: Handle isometric projection and depth sorting

**Interface**:
```javascript
class IsometricRenderer {
  // Convert world coordinates to isometric screen coordinates
  worldToScreen(worldX, worldY)
  
  // Convert screen coordinates to world coordinates
  screenToWorld(screenX, screenY)
  
  // Sort sprites by depth (for proper overlap)
  sortByDepth(sprites)
  
  // Calculate z-index based on position
  calculateZIndex(worldX, worldY)
}
```

**Isometric Projection**:
```
Screen X = (World X - World Y) * tileWidth / 2
Screen Y = (World X + World Y) * tileHeight / 2
```

### 3. Animation System Enhancement

#### AnimationController (Enhanced)
**Purpose**: Manage frame-based animations with blending

**Interface**:
```javascript
class AnimationController {
  constructor(sprite, animationData)
  
  // Play animation with optional blending
  play(animationName, options = {})
  
  // Stop current animation
  stop()
  
  // Pause/resume
  pause()
  resume()
  
  // Blend between animations
  blendTo(targetAnimation, blendTime)
  
  // Set animation speed multiplier
  setSpeed(multiplier)
  
  // Register animation events
  on(event, callback) // events: 'start', 'complete', 'loop', 'frame'
}
```

**Animation State Machine**:
```javascript
// State transitions
{
  "idle": {
    "canTransitionTo": ["walk", "work"],
    "blendTime": 0.2
  },
  "walk": {
    "canTransitionTo": ["idle", "work"],
    "blendTime": 0.1
  },
  "work": {
    "canTransitionTo": ["idle"],
    "blendTime": 0.3
  }
}
```

### 4. Lighting System

#### LightingSystem (Enhanced)
**Purpose**: Ambient and point lighting with shadows

**Interface**:
```javascript
class LightingSystem {
  constructor(scene)
  
  // Set ambient light level (0-1)
  setAmbientLight(intensity, color)
  
  // Add point light source
  addLight(id, position, radius, intensity, color)
  
  // Remove light
  removeLight(id)
  
  // Update light position (for moving lights)
  updateLightPosition(id, position)
  
  // Set time of day (affects ambient light)
  setTimeOfDay(hour) // 0-23
  
  // Enable/disable day-night cycle
  setDayNightCycle(enabled, cycleDuration)
}
```

**Lighting Implementation**:
- Use PixiJS filters for lighting effects
- Multiply blend mode for shadows
- Add blend mode for light sources
- Color temperature adjustment based on time

#### ShadowSystem (Enhanced)
**Purpose**: Soft shadows for depth

**Interface**:
```javascript
class ShadowSystem {
  // Existing methods...
  
  // Create soft shadow with blur
  createSoftShadow(entity, size, blur, opacity)
  
  // Update shadow based on light direction
  updateShadowDirection(entity, lightDirection)
  
  // Adjust shadow intensity based on ambient light
  adjustShadowIntensity(ambientLightLevel)
}
```

### 5. Visual Effects System

#### ParticleSystem (Enhanced)
**Purpose**: Particle effects for celebrations and feedback

**Interface**:
```javascript
class ParticleSystem {
  // Existing methods...
  
  // Emit celebration particles
  emitCelebration(position, type = 'confetti')
  
  // Emit task complete effect
  emitTaskComplete(position)
  
  // Emit level up effect
  emitLevelUp(position)
  
  // Emit ambient particles (dust motes, etc.)
  emitAmbient(bounds, type = 'dust')
}
```

**Particle Types**:
- Confetti (celebration)
- Stars (achievement)
- Sparkles (hover effect)
- Dust motes (ambient)
- Paper (task complete)

#### EffectManager
**Purpose**: Manage visual feedback effects

**Interface**:
```javascript
class EffectManager {
  constructor(scene)
  
  // Show hover effect on entity
  showHoverEffect(entity)
  hideHoverEffect(entity)
  
  // Show click feedback
  showClickFeedback(position)
  
  // Show floating text
  showFloatingText(text, position, options)
  
  // Screen shake effect
  screenShake(intensity, duration)
  
  // Flash effect
  flash(color, duration)
}
```

### 6. UI System Redesign

#### UITheme
**Purpose**: Centralized UI styling

**Data Structure**:
```javascript
{
  "colors": {
    "primary": "#3498db",
    "secondary": "#2ecc71",
    "background": "rgba(0, 0, 0, 0.7)",
    "text": "#ffffff",
    "textSecondary": "#bdc3c7"
  },
  "fonts": {
    "primary": "Arial, sans-serif",
    "size": {
      "small": 12,
      "medium": 14,
      "large": 18
    }
  },
  "spacing": {
    "small": 8,
    "medium": 16,
    "large": 24
  },
  "borderRadius": 8,
  "shadows": {
    "small": "0 2px 4px rgba(0,0,0,0.1)",
    "medium": "0 4px 8px rgba(0,0,0,0.2)"
  }
}
```

#### MinimapComponent
**Purpose**: Show overview of office layout

**Interface**:
```javascript
class MinimapComponent extends React.Component {
  render() {
    return (
      <div className="minimap">
        <canvas ref={this.canvasRef} />
      </div>
    )
  }
  
  // Update minimap view
  updateView(departments, agents, camera)
  
  // Handle minimap click (move camera)
  handleClick(x, y)
}
```

### 7. Theme System

#### ThemeManager
**Purpose**: Manage visual themes and customization

**Interface**:
```javascript
class ThemeManager {
  constructor()
  
  // Load theme configuration
  async loadTheme(themeId)
  
  // Get current theme
  getCurrentTheme()
  
  // Apply theme to scene
  applyTheme(scene, theme)
  
  // Get available themes
  getAvailableThemes()
  
  // Save theme preference
  saveThemePreference(themeId)
  
  // Customize theme colors
  customizeTheme(themeId, colorOverrides)
}
```

**Theme Structure**:
```javascript
{
  "id": "modern-tech",
  "name": "Modern Tech Office",
  "tilesets": {
    "floor": "modern-floor-tileset",
    "walls": "modern-wall-tileset",
    "furniture": "modern-furniture-tileset"
  },
  "colorPalette": {
    "primary": "#3498db",
    "secondary": "#2ecc71",
    "accent": "#e74c3c"
  },
  "lighting": {
    "ambient": { "intensity": 0.7, "color": "#ffffff" },
    "temperature": 5500
  }
}
```

## Asset Pipeline

### Asset Organization

```
frontend/public/assets/
├── sprites/
│   ├── tilesets/
│   │   ├── office-floor-16x16.png
│   │   ├── office-floor-16x16.json
│   │   ├── office-walls-16x16.png
│   │   ├── office-walls-16x16.json
│   │   ├── office-furniture-16x16.png
│   │   └── office-furniture-16x16.json
│   ├── characters/
│   │   ├── agent-spritesheet.png
│   │   ├── agent-spritesheet.json
│   │   ├── manager-spritesheet.png
│   │   └── manager-spritesheet.json
│   ├── ui/
│   │   ├── ui-elements.png
│   │   ├── ui-elements.json
│   │   ├── icons.png
│   │   └── icons.json
│   └── effects/
│       ├── particles.png
│       ├── particles.json
│       ├── effects.png
│       └── effects.json
└── themes/
    ├── modern-tech.json
    ├── classic-office.json
    └── startup-casual.json
```

### Asset Loading Strategy

**Priority Levels**:
1. **Critical** (load immediately): Core tilesets, UI elements
2. **High** (load on game start): Character sprites, basic furniture
3. **Medium** (lazy load): Additional furniture, decorations
4. **Low** (load on demand): Effects, particles, alternate themes

**Loading Flow**:
```
1. Show loading screen
2. Load critical assets (tilesets, UI)
3. Initialize PixiJS application
4. Load high priority assets (characters)
5. Render initial scene
6. Hide loading screen
7. Background load medium/low priority assets
```

### Asset Manifest

```javascript
// AssetManifest.js (enhanced)
export const ASSET_MANIFEST = {
  tilesets: [
    {
      id: 'office-floor-16x16',
      atlas: '/assets/sprites/tilesets/office-floor-16x16.png',
      metadata: '/assets/sprites/tilesets/office-floor-16x16.json',
      priority: 'critical'
    },
    {
      id: 'office-walls-16x16',
      atlas: '/assets/sprites/tilesets/office-walls-16x16.png',
      metadata: '/assets/sprites/tilesets/office-walls-16x16.json',
      priority: 'critical'
    },
    {
      id: 'office-furniture-16x16',
      atlas: '/assets/sprites/tilesets/office-furniture-16x16.png',
      metadata: '/assets/sprites/tilesets/office-furniture-16x16.json',
      priority: 'high'
    }
  ],
  characters: [
    {
      id: 'agent-professional',
      atlas: '/assets/sprites/characters/agent-spritesheet.png',
      metadata: '/assets/sprites/characters/agent-spritesheet.json',
      priority: 'high'
    }
  ],
  ui: [
    {
      id: 'ui-elements',
      atlas: '/assets/sprites/ui/ui-elements.png',
      metadata: '/assets/sprites/ui/ui-elements.json',
      priority: 'critical'
    }
  ],
  effects: [
    {
      id: 'particles',
      atlas: '/assets/sprites/effects/particles.png',
      metadata: '/assets/sprites/effects/particles.json',
      priority: 'low'
    }
  ]
};
```

## Performance Considerations

### Optimization Strategies

1. **Sprite Batching**
   - Group sprites by texture to minimize draw calls
   - Use ParticleContainer for large numbers of similar sprites
   - Batch static elements (floors, walls) separately from dynamic (characters)

2. **Texture Atlases**
   - Combine related sprites into single texture
   - Use power-of-2 dimensions (512x512, 1024x1024, 2048x2048)
   - Separate frequently updated sprites from static ones

3. **Culling**
   - Only render sprites within camera view
   - Use spatial partitioning (quadtree) for efficient culling
   - Cull particles outside view

4. **LOD (Level of Detail)**
   - Reduce animation frame rate for distant characters
   - Use simpler sprites for distant objects
   - Disable shadows for distant entities

5. **Caching**
   - Cache rendered tiles as textures
   - Cache complex UI elements
   - Reuse particle emitters

### Performance Targets

- **FPS**: 60 FPS on desktop, 30 FPS on mobile
- **Draw Calls**: < 100 per frame
- **Texture Memory**: < 256 MB
- **Load Time**: < 3 seconds for initial assets

## Accessibility Features

### Visual Accessibility

1. **High Contrast Mode**
   - Increase contrast between elements
   - Use distinct colors for different entity types
   - Add outlines to important elements

2. **Colorblind Support**
   - Provide colorblind-friendly palettes
   - Use patterns/icons in addition to colors
   - Test with colorblind simulators

3. **Zoom Support**
   - Allow zoom from 50% to 200%
   - Maintain UI readability at all zoom levels
   - Smooth zoom transitions

4. **Reduced Motion**
   - Option to disable particle effects
   - Reduce animation speed
   - Disable screen shake

### Implementation

```javascript
// AccessibilitySettings
{
  highContrast: false,
  colorblindMode: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
  reducedMotion: false,
  zoomLevel: 1.0,
  textSize: 'medium'
}
```

## Testing Strategy

### Visual Testing

1. **Screenshot Comparison**
   - Capture screenshots of key scenes
   - Compare against reference images
   - Detect visual regressions

2. **Animation Testing**
   - Verify all animation states work
   - Check animation transitions
   - Test animation events

3. **Performance Testing**
   - Profile render loop
   - Measure FPS under load
   - Test on target devices

### Integration Testing

1. **Asset Loading**
   - Test all assets load correctly
   - Handle missing assets gracefully
   - Test asset unloading

2. **Theme Switching**
   - Test all themes apply correctly
   - Verify no memory leaks
   - Test theme persistence

3. **Accessibility**
   - Test high contrast mode
   - Test colorblind modes
   - Test zoom levels

## Migration Strategy

### Phase 1: Parallel Implementation
- Create new components alongside existing ones
- Use feature flag to toggle between old and new
- Test new system thoroughly

### Phase 2: Gradual Rollout
- Enable new visuals for specific departments first
- Monitor performance and user feedback
- Fix issues before full rollout

### Phase 3: Complete Migration
- Remove old rendering code
- Clean up unused assets
- Optimize final implementation

### Rollback Plan
- Keep old rendering system for 1-2 releases
- Feature flag to revert if critical issues found
- Document known issues and workarounds

## Dependencies

### External Libraries
- **PixiJS v8**: Core rendering engine (already installed)
- **@pixi/filter-glow** (optional): For glow effects
- **@pixi/filter-drop-shadow** (optional): For drop shadows

### Asset Tools
- **TexturePacker**: Generate sprite atlases
- **Aseprite**: Create/edit pixel art
- **Tiled**: Design tile layouts

### Development Tools
- **PixiJS DevTools**: Debug rendering
- **Chrome DevTools**: Profile performance
- **Lighthouse**: Test accessibility

## Success Metrics

### Visual Quality
- User satisfaction score > 8/10
- Visual appeal rating > 7/10
- Professional appearance rating > 8/10

### Performance
- Maintain 60 FPS on target hardware
- Load time < 3 seconds
- Memory usage < 256 MB

### User Engagement
- Session time increase > 50%
- Return rate increase > 30%
- Task completion rate > 80%

## Future Enhancements

### Post-Launch Features
1. **Custom Asset Upload**: Allow users to upload custom sprites
2. **Advanced Lighting**: Real-time shadows, dynamic lighting
3. **Weather Effects**: Rain, snow, fog
4. **Seasonal Themes**: Holiday decorations, seasonal changes
5. **3D Elements**: Pseudo-3D effects, parallax layers

### Performance Improvements
1. **WebGL 2.0**: Use advanced rendering features
2. **Web Workers**: Offload processing to background threads
3. **Streaming Assets**: Load assets progressively
4. **Compression**: Use compressed texture formats

## Conclusion

This design provides a comprehensive architecture for transforming the AI Company Simulator from a functional prototype into a visually professional game. The modular approach allows for incremental implementation while maintaining system stability.

Key design principles:
- **Modularity**: Each system is independent and reusable
- **Performance**: Optimized for 60 FPS with many entities
- **Extensibility**: Easy to add new themes, assets, and effects
- **Accessibility**: Inclusive design for all users
- **Maintainability**: Clear interfaces and documentation

Next step: Create tasks.md with detailed implementation tasks.
