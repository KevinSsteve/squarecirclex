# Game Visual Redesign - Professional Implementation Plan

**Status**: 📋 Planning  
**Date**: 2026-04-19  
**Priority**: High - User Experience Enhancement

## Overview

Complete visual overhaul of the AI Company Simulator to achieve professional game aesthetics inspired by pixel art tilesets and modern isometric business simulation games like "Game Dev Tycoon", "Two Point Hospital", and "Startup Company".

## Current State vs. Target State

### Current State
- ❌ Simple geometric shapes (circles, rectangles)
- ❌ Flat colors without depth
- ❌ No detailed furniture or environment
- ❌ Basic placeholder sprites
- ❌ Minimal visual feedback
- ❌ No atmospheric effects

### Target State
- ✅ Professional pixel art tileset (16x16 or 32x32)
- ✅ Detailed isometric office environment
- ✅ Animated character sprites (8-direction, multiple states)
- ✅ Furniture and decorations (desks, chairs, plants, computers)
- ✅ Lighting and shadows
- ✅ Particle effects and visual polish
- ✅ Professional UI/HUD design

## Inspiration References

### Visual Style
- **Office Interior Tileset (16x16)** - Clean pixel art office assets
- **Game Dev Tycoon** - Isometric office simulation aesthetic
- **Two Point Hospital** - Colorful, detailed isometric environments
- **Startup Company** - Modern office simulation visuals

### Key Visual Elements
1. **Isometric Perspective**: 2:1 ratio (2 pixels horizontal for 1 pixel vertical)
2. **Pixel Art Style**: Crisp, clean pixels with limited color palette
3. **Depth and Shadows**: Soft shadows to create depth
4. **Animated Characters**: Smooth walking and working animations
5. **Environmental Details**: Plants, decorations, lighting fixtures

## Implementation Phases

### Phase 1: Asset Acquisition and Preparation
**Goal**: Gather or create professional game assets

**Tasks**:
1. Research and select tileset (purchase or use free assets)
2. Organize assets into categories:
   - Floor tiles (carpet, wood, tile)
   - Wall tiles (with corners and edges)
   - Furniture (desks, chairs, computers, filing cabinets)
   - Decorations (plants, pictures, lamps)
   - Characters (agents with animations)
   - UI elements (buttons, panels, icons)
3. Create sprite atlases for efficient loading
4. Set up asset pipeline and directory structure

**Recommended Asset Sources**:
- **itch.io** - Many free and paid pixel art tilesets
- **OpenGameArt.org** - Free game assets
- **Kenney.nl** - Free game assets with consistent style
- **Custom Creation** - Commission or create custom assets

### Phase 2: Core Rendering System Upgrade
**Goal**: Implement tileset rendering and sprite management

**Tasks**:
1. Create TilesetManager for loading and managing tilesets
2. Implement tile-based floor rendering
3. Add wall rendering with auto-tiling (corners, edges)
4. Create FurnitureRenderer for placing furniture sprites
5. Update CharacterSpriteManager for new character sprites
6. Implement sprite layering system (floor → furniture → characters → effects)

### Phase 3: Character Animation Enhancement
**Goal**: Professional animated character sprites

**Tasks**:
1. Import character sprite sheets (8 directions × multiple states)
2. Update animation system for frame-based animations
3. Implement smooth transitions between animations
4. Add idle animations (breathing, subtle movement)
5. Add working animations (typing, thinking, celebrating)
6. Test all animation states and directions

### Phase 4: Lighting and Atmosphere
**Goal**: Add depth and atmosphere with lighting

**Tasks**:
1. Implement ambient lighting system
2. Add light sources (windows, lamps, monitors)
3. Create soft shadow system for furniture and characters
4. Add day/night cycle with gradual transitions
5. Implement light color temperature (warm/cool)
6. Add atmospheric particles (dust motes in sunlight)

### Phase 5: UI/HUD Redesign
**Goal**: Professional, non-intrusive UI

**Tasks**:
1. Design new UI mockups (Figma/Sketch)
2. Create UI sprite atlas
3. Implement semi-transparent panel system
4. Add icon-based indicators for agents
5. Create minimap component
6. Add smooth UI transitions and animations
7. Implement tooltip system with rich information

### Phase 6: Visual Effects and Polish
**Goal**: Responsive, satisfying visual feedback

**Tasks**:
1. Implement hover effects (outline, glow)
2. Add click feedback (ripple, flash)
3. Create particle system for celebrations
4. Add floating text for events
5. Implement screen shake for important events
6. Add transition effects (fade, slide, scale)
7. Polish all animations and timings

### Phase 7: Performance Optimization
**Goal**: Maintain 60 FPS with all visual enhancements

**Tasks**:
1. Implement sprite batching
2. Add LOD system for distant objects
3. Cache rendered tiles
4. Optimize particle systems
5. Profile and optimize render loop
6. Add performance monitoring
7. Implement quality settings (low, medium, high)

### Phase 8: Customization and Themes
**Goal**: Allow players to personalize visuals

**Tasks**:
1. Create theme system architecture
2. Design multiple office themes
3. Implement theme switching
4. Add color palette customization
5. Create theme preview system
6. Save preferences to local storage

## Asset Requirements

### Tilesets Needed

#### Floor Tiles (16x16 or 32x32)
- Carpet (various colors)
- Wood flooring
- Tile flooring
- Transitions between floor types

#### Wall Tiles
- Straight walls (horizontal, vertical)
- Corner walls (inner, outer)
- Doorways
- Windows

#### Furniture Sprites
- Desks (various styles)
- Office chairs
- Computers and monitors
- Filing cabinets
- Bookshelves
- Meeting tables
- Coffee machines
- Plants (small, medium, large)
- Lamps and lighting
- Decorative items

#### Character Sprites
- 8 directions (N, NE, E, SE, S, SW, W, NW)
- States: idle, walking, working, celebrating
- Multiple character types (different roles)
- 4-6 frames per animation

#### UI Elements
- Panel backgrounds
- Buttons (normal, hover, pressed)
- Icons (agents, tasks, departments)
- Progress bars
- Minimap frame

### Sprite Atlas Organization

```
/assets/sprites/
  /tilesets/
    office-floor-16x16.png
    office-walls-16x16.png
    office-furniture-16x16.png
  /characters/
    agent-spritesheet-8dir.png
    manager-spritesheet-8dir.png
  /ui/
    ui-elements-atlas.png
    icons-atlas.png
  /effects/
    particles-atlas.png
    effects-atlas.png
```

## Technical Specifications

### Tile Size
- **Base Tile**: 16x16 pixels (or 32x32 for higher detail)
- **Isometric Ratio**: 2:1 (width:height)
- **Character Size**: 16x24 or 32x48 (taller than tiles)

### Color Palette
- **Limited Palette**: 32-64 colors for consistent style
- **Department Colors**: Distinct hues for each department
- **Lighting**: Warm (2700K) to cool (6500K) temperature range

### Animation Specifications
- **Frame Rate**: 8-12 FPS for pixel art
- **Walking Cycle**: 4-6 frames
- **Idle Animation**: 2-4 frames, slow loop
- **Working Animation**: 4-8 frames

### Performance Targets
- **FPS**: Maintain 60 FPS
- **Draw Calls**: < 100 per frame
- **Texture Memory**: < 256 MB
- **Load Time**: < 3 seconds for all assets

## Development Workflow

### 1. Asset Creation/Acquisition
- Research and select tileset
- Purchase or download assets
- Organize into project structure

### 2. Asset Processing
- Create sprite atlases
- Generate metadata JSON
- Optimize file sizes

### 3. Implementation
- Follow phase-by-phase implementation
- Test each phase before moving to next
- Gather user feedback

### 4. Iteration
- Refine based on feedback
- Polish animations and effects
- Optimize performance

## Success Criteria

### Visual Quality
- ✅ Professional pixel art aesthetic
- ✅ Consistent art style throughout
- ✅ Smooth animations (no jank)
- ✅ Clear visual hierarchy

### Performance
- ✅ 60 FPS on target hardware
- ✅ Fast asset loading (< 3s)
- ✅ Low memory usage (< 256 MB)

### User Experience
- ✅ Intuitive visual feedback
- ✅ Clear information display
- ✅ Satisfying interactions
- ✅ Accessible to all players

## Next Steps

1. **Create Spec**: Write detailed requirements.md (✅ DONE)
2. **Asset Research**: Find suitable tilesets and character sprites
3. **Prototype**: Create visual mockup with new assets
4. **User Feedback**: Show prototype to stakeholders
5. **Implementation**: Begin Phase 1 development

## Resources

### Asset Marketplaces
- itch.io/game-assets
- OpenGameArt.org
- Kenney.nl
- Unity Asset Store (can be used with PixiJS)

### Tools
- **Aseprite**: Pixel art creation and animation
- **Tiled**: Tilemap editor
- **TexturePacker**: Sprite atlas generation
- **Figma**: UI mockup design

### References
- PixiJS Documentation: https://pixijs.com/
- Pixel Art Tutorial: https://lospec.com/pixel-art-tutorials
- Isometric Game Design: https://www.gamedeveloper.com/design/isometric-game-design

## Budget Estimate

### Asset Costs
- **Professional Tileset**: $10-50
- **Character Sprites**: $20-100
- **UI Elements**: $10-30
- **Total Assets**: $40-180

### Development Time
- **Phase 1-2**: 2-3 days
- **Phase 3-4**: 3-4 days
- **Phase 5-6**: 2-3 days
- **Phase 7-8**: 2-3 days
- **Total**: 9-13 days

### Alternative: Free Assets
- Use free tilesets from Kenney.nl or OpenGameArt
- Create custom sprites using Aseprite
- Total cost: $0 (time investment only)
