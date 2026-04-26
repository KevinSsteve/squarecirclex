# Implementation Tasks

## Overview

This document breaks down the 3D visual upgrade into concrete, actionable tasks organized by phase. Each task includes acceptance criteria and estimated effort.

**Total Estimated Time**: 12-15 days

---

## Phase 1: Foundation & Asset Acquisition (Days 1-3)

### Task 1.1: Asset Research and Acquisition
**Estimated Time**: 4-6 hours

**Description**: Research and acquire isometric office asset packs

**Subtasks**:
1. Research free asset sources (Kenney.nl, OpenGameArt, itch.io)
2. Evaluate asset quality and licensing
3. Download/purchase selected asset pack
4. Organize assets into folder structure
5. Create asset inventory document

**Acceptance Criteria**:
- [ ] Asset pack acquired with commercial license
- [ ] Assets organized in `/public/assets/` structure
- [ ] Asset inventory document created
- [ ] All required asset types available (furniture, characters, environment)

**Files to Create**:
- `/public/assets/` folder structure
- `ASSET_INVENTORY.md` documentation

---

### Task 1.2: Sprite Atlas System
**Estimated Time**: 4-6 hours

**Description**: Implement sprite atlas management for efficient texture loading

**Subtasks**:
1. Create `SpriteAtlasManager.js`
2. Implement atlas loading from JSON definitions
3. Add texture caching
4. Create sprite extraction utilities
5. Add error handling for missing sprites

**Acceptance Criteria**:
- [ ] SpriteAtlasManager class created
- [ ] Can load sprite sheets with JSON atlas definitions
- [ ] Texture caching implemented
- [ ] Error handling for missing sprites
- [ ] Unit tests pass

**Files to Create**:
- `frontend/src/components/game/utils/SpriteAtlasManager.js`
- `frontend/src/components/game/utils/__tests__/SpriteAtlasManager.test.js`

**Files to Modify**:
- `frontend/src/components/game/utils/AssetLoader.js` (integrate atlas loading)

---

### Task 1.3: Asset Manifest System
**Estimated Time**: 3-4 hours

**Description**: Create asset manifest for declarative asset management

**Subtasks**:
1. Create `AssetManifest.js` with asset definitions
2. Define all furniture assets
3. Define all character assets
4. Define all environment assets
5. Add asset metadata (size, type, category)

**Acceptance Criteria**:
- [ ] AssetManifest.js created with complete asset list
- [ ] Assets categorized by type
- [ ] Metadata includes dimensions and anchor points
- [ ] Critical vs non-critical assets marked

**Files to Create**:
- `frontend/src/components/game/assets/AssetManifest.js`

---

### Task 1.4: Enhanced Layer System
**Estimated Time**: 4-5 hours

**Description**: Extend Scene.js layer system for 3D depth sorting

**Subtasks**:
1. Add new layers to Scene.js (floor, floor_decorations, walls_back, shadows, walls_front)
2. Implement z-index ordering
3. Add Y-sorting within layers
4. Create layer utility functions
5. Update existing code to use new layers

**Acceptance Criteria**:
- [ ] New layers added to Scene.js
- [ ] Z-index ordering implemented
- [ ] Y-sorting algorithm working correctly
- [ ] Existing functionality not broken
- [ ] Visual tests pass

**Files to Modify**:
- `frontend/src/components/game/Scene.js`

**Testing**:
- Verify layer ordering with test sprites
- Check Y-sorting with overlapping objects

---

### Task 1.5: Shadow System Implementation
**Estimated Time**: 5-6 hours

**Description**: Create shadow rendering system for depth perception

**Subtasks**:
1. Create `ShadowSystem.js` class
2. Implement circular shadow sprites
3. Add shadow attachment to entities
4. Implement shadow position updates
5. Add shadow alpha/size controls
6. Integrate with Scene.js

**Acceptance Criteria**:
- [ ] ShadowSystem class created
- [ ] Shadows render on shadow layer
- [ ] Shadows follow entity movement
- [ ] Shadow alpha adjustable
- [ ] Performance impact minimal (< 5% FPS drop)

**Files to Create**:
- `frontend/src/components/game/systems/ShadowSystem.js`
- `frontend/src/components/game/systems/__tests__/ShadowSystem.test.js`

**Files to Modify**:
- `frontend/src/components/game/Scene.js` (integrate ShadowSystem)

---

## Phase 2: Department Visuals (Days 4-6)

### Task 2.1: Floor and Carpet Rendering
**Estimated Time**: 4-5 hours

**Description**: Implement floor tiles and department carpets

**Subtasks**:
1. Create floor tile sprites
2. Implement tiling algorithm for floor coverage
3. Add department carpet sprites
4. Position carpets in department areas
5. Add floor texture variations

**Acceptance Criteria**:
- [ ] Floor tiles cover entire office area
- [ ] Carpets positioned in each department
- [ ] Carpets use department theme colors
- [ ] Smooth transitions between floor and carpets
- [ ] No visual gaps or overlaps

**Files to Modify**:
- `frontend/src/components/game/GameView.jsx` (update drawOfficeLayout)

---

### Task 2.2: Wall and Structure Rendering
**Estimated Time**: 4-5 hours

**Description**: Add walls, windows, and office structure

**Subtasks**:
1. Create wall sprites (back and front)
2. Position walls around office perimeter
3. Add windows to exterior walls
4. Add department dividers
5. Implement wall depth sorting

**Acceptance Criteria**:
- [ ] Walls render on correct layers
- [ ] Windows positioned appropriately
- [ ] Department dividers visible
- [ ] Depth sorting correct (agents behind/in front of walls)
- [ ] No z-fighting or visual artifacts

**Files to Modify**:
- `frontend/src/components/game/GameView.jsx` (update drawOfficeLayout)

---

### Task 2.3: Furniture Layout System
**Estimated Time**: 5-6 hours

**Description**: Create system for placing furniture in departments

**Subtasks**:
1. Create `FurnitureLayout.js` with department layouts
2. Define furniture positions for Content Creation
3. Define furniture positions for Publishing
4. Define furniture positions for Trend Analysis
5. Define furniture positions for Customer Support
6. Define furniture positions for Administration
7. Implement furniture rendering function

**Acceptance Criteria**:
- [ ] FurnitureLayout.js created with all department layouts
- [ ] Furniture positioned logically in each department
- [ ] Furniture uses correct sprites from asset pack
- [ ] Furniture depth sorting correct
- [ ] Each department visually distinct

**Files to Create**:
- `frontend/src/components/game/layout/FurnitureLayout.js`

**Files to Modify**:
- `frontend/src/components/game/GameView.jsx` (integrate furniture rendering)

---

### Task 2.4: Department Renderer Implementation
**Estimated Time**: 5-6 hours

**Description**: Create comprehensive department rendering system

**Subtasks**:
1. Create `DepartmentRenderer.js` class
2. Implement floor rendering
3. Implement furniture rendering
4. Implement decoration rendering
5. Add department theme application
6. Integrate with Scene.js

**Acceptance Criteria**:
- [ ] DepartmentRenderer class created
- [ ] All departments render with unique visuals
- [ ] Theme colors applied correctly
- [ ] Performance acceptable (60 FPS maintained)
- [ ] Code is maintainable and documented

**Files to Create**:
- `frontend/src/components/game/renderers/DepartmentRenderer.js`

**Files to Modify**:
- `frontend/src/components/game/Scene.js` (integrate DepartmentRenderer)
- `frontend/src/components/game/GameView.jsx` (use DepartmentRenderer)

---

### Task 2.5: Department Decorations
**Estimated Time**: 4-5 hours

**Description**: Add decorative elements to each department

**Subtasks**:
1. Add plants to all departments
2. Add wall decorations (posters, whiteboards, charts)
3. Add desk items (computers, monitors, coffee mugs)
4. Add department-specific decorations
5. Balance decoration density

**Acceptance Criteria**:
- [ ] Each department has appropriate decorations
- [ ] Decorations match department theme
- [ ] Visual balance maintained (not too cluttered)
- [ ] Decorations on correct layers
- [ ] Performance impact minimal

**Files to Modify**:
- `frontend/src/components/game/layout/FurnitureLayout.js` (add decorations)

---

## Phase 3: Character Sprites (Days 7-9)

### Task 3.1: Character Sprite Manager
**Estimated Time**: 5-6 hours

**Description**: Create system for managing character sprites and animations

**Subtasks**:
1. Create `CharacterSpriteManager.js` class
2. Implement sprite loading for 8 directions
3. Add animation state management
4. Implement frame sequencing
5. Add sprite caching

**Acceptance Criteria**:
- [ ] CharacterSpriteManager class created
- [ ] Supports 8-directional sprites
- [ ] Animation states: idle, walking, working, celebrating
- [ ] Frame sequencing smooth
- [ ] Sprite caching working

**Files to Create**:
- `frontend/src/components/game/sprites/CharacterSpriteManager.js`
- `frontend/src/components/game/sprites/__tests__/CharacterSpriteManager.test.js`

---

### Task 3.2: Direction Calculation System
**Estimated Time**: 3-4 hours

**Description**: Implement direction calculation from velocity

**Subtasks**:
1. Create direction calculation utility
2. Map velocity to 8 directions
3. Add direction smoothing (prevent rapid switching)
4. Handle edge cases (zero velocity)
5. Add unit tests

**Acceptance Criteria**:
- [ ] Direction calculated correctly from velocity
- [ ] 8 directions supported (N, NE, E, SE, S, SW, W, NW)
- [ ] Direction changes smooth
- [ ] Edge cases handled
- [ ] Unit tests pass

**Files to Create**:
- `frontend/src/components/game/utils/DirectionUtils.js`
- `frontend/src/components/game/utils/__tests__/DirectionUtils.test.js`

---

### Task 3.3: Enhanced Agent Entity Visuals
**Estimated Time**: 6-7 hours

**Description**: Replace circle graphics with character sprites in AgentEntity

**Subtasks**:
1. Modify AgentEntity to use CharacterSpriteManager
2. Replace circle graphics with sprite
3. Update animation state machine
4. Add direction-based sprite selection
5. Update shadow to match character
6. Test all agent types

**Acceptance Criteria**:
- [ ] AgentEntity uses character sprites instead of circles
- [ ] All agent types have unique sprites
- [ ] Animations smooth and correct
- [ ] Direction changes work correctly
- [ ] Shadows positioned correctly
- [ ] Existing functionality preserved

**Files to Modify**:
- `frontend/src/components/game/entities/AgentEntity.js`
- `frontend/src/components/game/GameView.jsx` (update createAgentEntity)

---

### Task 3.4: Animation System Enhancement
**Estimated Time**: 5-6 hours

**Description**: Enhance AnimationSystem to support sprite-based animations

**Subtasks**:
1. Add sprite animation support to AnimationSystem
2. Implement frame-based animation
3. Add animation blending/transitions
4. Support variable frame rates
5. Add animation events (onComplete, onLoop)

**Acceptance Criteria**:
- [ ] AnimationSystem supports sprite animations
- [ ] Frame-based animations working
- [ ] Smooth transitions between animations
- [ ] Variable frame rates supported
- [ ] Animation events firing correctly

**Files to Modify**:
- `frontend/src/components/game/systems/AnimationSystem.js`

---

### Task 3.5: Walking Animation Integration ✅
**Estimated Time**: 4-5 hours

**Description**: Integrate walking animations with movement system

**Subtasks**:
1. ✅ Connect MovementSystem with AnimationSystem
2. ✅ Trigger walking animation on movement
3. ✅ Update direction based on movement
4. ✅ Return to idle when stopped
5. ✅ Test smooth transitions

**Acceptance Criteria**:
- [x] Walking animation plays during movement
- [x] Direction updates based on movement direction
- [x] Smooth transition to idle when stopped
- [x] No animation glitches
- [x] Performance maintained

**Files to Modify**:
- `frontend/src/components/game/systems/MovementSystem.js` ✅
- `frontend/src/components/game/entities/AgentEntity.js` ✅

**Files Created**:
- `frontend/src/components/game/systems/__tests__/MovementSystem.animation.test.js` ✅

---

## Phase 4: Polish & Effects (Days 10-12)

### Task 4.1: Lighting System ✅
**Estimated Time**: 4-5 hours

**Description**: Implement ambient lighting and time-of-day effects

**Subtasks**:
1. ✅ Create `LightingSystem.js` class
2. ✅ Implement ambient color overlay
3. ✅ Add time-of-day presets (morning, afternoon, evening, night)
4. ✅ Add smooth transitions between lighting states
5. ✅ Integrate with Scene.js

**Acceptance Criteria**:
- [x] LightingSystem class created
- [x] Ambient lighting affects entire scene
- [x] Time-of-day presets working (4 presets)
- [x] Smooth transitions between states with cubic easing
- [x] Performance impact minimal

**Files Created**:
- `frontend/src/components/game/systems/LightingSystem.js` ✅
- `frontend/src/components/game/systems/__tests__/LightingSystem.test.js` ✅

**Files Modified**:
- `frontend/src/components/game/Scene.js` (integrated LightingSystem) ✅

---

### Task 4.2: Highlight Effects ✅
**Estimated Time**: 3-4 hours

**Description**: Add hover and selection highlight effects

**Subtasks**:
1. ✅ Create `HighlightEffect.js` utility
2. ✅ Implement hover glow effect
3. ✅ Implement selection highlight
4. ✅ Add smooth fade in/out
5. ✅ Integrate with InteractionSystem

**Acceptance Criteria**:
- [x] Hover effect shows on mouse over with white glow
- [x] Selection highlight shows on click with indigo glow
- [x] Effects fade smoothly (150ms hover, 200ms selection)
- [x] Performance acceptable (< 1% FPS impact)
- [x] Works with all entity types

**Files Created**:
- `frontend/src/components/game/effects/HighlightEffect.js` ✅
- `frontend/src/components/game/effects/__tests__/HighlightEffect.test.js` ✅

**Files Modified**:
- `frontend/src/components/game/systems/InteractionSystem.js` (integrated HighlightEffect) ✅

---

### Task 4.3: Enhanced Particle Effects ✅
**Estimated Time**: 4-5 hours

**Description**: Enhance particle system with new effects for 3D environment

**Subtasks**:
1. ✅ Add dust particles for ambient atmosphere
2. ✅ Add sparkle effects for celebrations
3. ✅ Add work progress indicators
4. ✅ Add task completion effects
5. ✅ Optimize particle rendering

**Acceptance Criteria**:
- [x] New particle effects added (8 new effect types)
- [x] Effects match 3D visual style with department themes
- [x] Particles render on correct layer (effects layer)
- [x] Performance maintained (< 5% FPS impact via pooling)
- [x] Effects enhance visual feedback

**Files Modified**:
- `frontend/src/components/game/systems/ParticleSystem.js` (enhanced with 3D effects) ✅

---

### Task 4.4: UI Overlay Modernization ✅
**Estimated Time**: 5-6 hours

**Description**: Update UI overlay to match new 3D visual style

**Subtasks**:
1. ✅ Update panel styling to match 3D aesthetic
2. ✅ Add agent avatar circles (like reference image)
3. ✅ Enhance status indicators
4. ✅ Add smooth panel animations
5. ✅ Update color scheme to match departments

**Acceptance Criteria**:
- [x] UI panels match 3D visual style
- [x] Agent avatars displayed as circles
- [x] Status indicators clear and attractive
- [x] Panel animations smooth
- [x] Color scheme cohesive

**Files Modified**:
- `frontend/src/components/game/ui/UIOverlay.jsx` (enhanced with 3D styling) ✅
- `frontend/src/components/game/ui/AgentListPanel.jsx` (avatar circles, gradients, animations) ✅
- `frontend/src/components/game/ui/TaskQueuePanel.jsx` (enhanced cards, progress bars) ✅

---

### Task 4.5: Camera Polish ✅
**Estimated Time**: 3-4 hours

**Description**: Enhance camera controls for better 3D navigation

**Subtasks**:
1. ✅ Add smooth zoom to department feature
2. ✅ Enhance camera easing curves
3. ✅ Add camera shake for events
4. ✅ Improve focus transitions
5. ✅ Add camera bounds visualization (debug mode)

**Acceptance Criteria**:
- [x] Zoom to department smooth and intuitive (elastic easing)
- [x] Camera easing feels natural (smooth, snap, elastic modes)
- [x] Camera shake adds impact to events (celebration, level up)
- [x] Focus transitions smooth (enhanced easing with progress tracking)
- [x] Debug visualization helpful (camera state in performance tab)

**Files Modified**:
- `frontend/src/components/game/Scene.js` (enhanced camera system) ✅
- `frontend/src/components/game/systems/ParticleSystem.js` (integrated camera shake) ✅
- `frontend/src/components/game/debug/DebugOverlay.js` (added camera visualization) ✅

---

## Phase 5: Optimization & Testing (Days 13-15)

### Task 5.1: Performance Profiling
**Estimated Time**: 4-5 hours

**Description**: Profile performance and identify bottlenecks

**Subtasks**:
1. Run performance profiler on game scene
2. Measure FPS with varying agent counts
3. Measure memory usage
4. Identify rendering bottlenecks
5. Document findings

**Acceptance Criteria**:
- [ ] Performance profile completed
- [ ] Bottlenecks identified
- [ ] FPS measurements documented
- [ ] Memory usage documented
- [ ] Optimization targets identified

**Deliverables**:
- Performance profile report
- Optimization recommendations

---

### Task 5.2: Sprite Batching Optimization
**Estimated Time**: 4-5 hours

**Description**: Optimize sprite rendering with batching

**Subtasks**:
1. Group sprites by texture
2. Minimize texture switches
3. Optimize sprite sheet usage
4. Reduce draw calls
5. Measure improvement

**Acceptance Criteria**:
- [ ] Sprites batched by texture
- [ ] Draw calls reduced by > 50%
- [ ] FPS improved by > 10%
- [ ] No visual regressions
- [ ] Measurements documented

**Files to Modify**:
- `frontend/src/components/game/utils/SpriteBatchOptimizer.js`

---

### Task 5.3: Asset Optimization
**Estimated Time**: 3-4 hours

**Description**: Optimize asset sizes and loading

**Subtasks**:
1. Compress sprite sheets
2. Optimize atlas packing
3. Remove unused assets
4. Implement progressive loading
5. Measure load time improvement

**Acceptance Criteria**:
- [ ] Asset sizes reduced by > 30%
- [ ] Load time < 3 seconds
- [ ] No quality degradation
- [ ] Progressive loading working
- [ ] Measurements documented

---

### Task 5.4: Visual Testing Suite
**Estimated Time**: 5-6 hours

**Description**: Create comprehensive visual tests

**Subtasks**:
1. Create screenshot comparison tests
2. Test all department visuals
3. Test all character animations
4. Test depth sorting edge cases
5. Test shadow rendering

**Acceptance Criteria**:
- [ ] Screenshot tests created
- [ ] All departments tested
- [ ] All animations tested
- [ ] Edge cases covered
- [ ] Tests pass consistently

**Files to Create**:
- `frontend/src/components/game/__tests__/visual/` (test suite)

---

### Task 5.5: Integration Testing
**Estimated Time**: 4-5 hours

**Description**: Test integration with existing systems

**Subtasks**:
1. Test with StateSyncSystem
2. Test with TaskExecutionSystem
3. Test with InteractionSystem
4. Test with ErrorRecoverySystem
5. Test with AccessibilitySystem

**Acceptance Criteria**:
- [ ] All systems integrate correctly
- [ ] No regressions in existing functionality
- [ ] State sync working with new visuals
- [ ] Task execution visual feedback correct
- [ ] Interaction system working with sprites

---

### Task 5.6: Bug Fixes and Polish
**Estimated Time**: 6-8 hours

**Description**: Fix bugs and add final polish

**Subtasks**:
1. Fix any visual artifacts
2. Fix depth sorting issues
3. Fix animation glitches
4. Adjust colors and lighting
5. Final visual tweaks

**Acceptance Criteria**:
- [ ] No visual artifacts
- [ ] Depth sorting perfect
- [ ] Animations smooth
- [ ] Colors balanced
- [ ] Overall visual quality excellent

---

### Task 5.7: Documentation
**Estimated Time**: 3-4 hours

**Description**: Document new systems and usage

**Subtasks**:
1. Update README with new features
2. Document ShadowSystem API
3. Document CharacterSpriteManager API
4. Document DepartmentRenderer API
5. Create visual style guide

**Acceptance Criteria**:
- [ ] README updated
- [ ] All new systems documented
- [ ] API documentation complete
- [ ] Visual style guide created
- [ ] Examples provided

**Files to Create**:
- `VISUAL_STYLE_GUIDE.md`

**Files to Modify**:
- `frontend/src/components/game/README.md`

---

## Task Dependencies

```
Phase 1 (Foundation):
  1.1 → 1.2 → 1.3
  1.4 → 1.5

Phase 2 (Departments):
  1.3 → 2.1 → 2.2
  1.4 → 2.3 → 2.4 → 2.5

Phase 3 (Characters):
  1.2 → 3.1 → 3.2
  3.1 → 3.3 → 3.4 → 3.5
  1.5 → 3.3

Phase 4 (Polish):
  2.4 → 4.1
  3.3 → 4.2
  3.4 → 4.3
  All Phase 3 → 4.4
  All Phase 2 → 4.5

Phase 5 (Testing):
  All Phase 4 → 5.1 → 5.2 → 5.3
  All Phase 4 → 5.4 → 5.5 → 5.6 → 5.7
```

## Progress Tracking

Use this checklist to track overall progress:

### Phase 1: Foundation ☐
- [x] Task 1.1: Asset Research and Acquisition
- [x] Task 1.2: Sprite Atlas System
- [x] Task 1.3: Asset Manifest System
- [x] Task 1.4: Enhanced Layer System
- [x] Task 1.5: Shadow System Implementation

### Phase 2: Department Visuals ☐
- [x] Task 2.1: Floor and Carpet Rendering ✅ COMPLETE
- [x] Task 2.2: Wall and Structure Rendering ✅ COMPLETE
- [x] Task 2.3: Furniture Layout System ✅ COMPLETE
- [x] Task 2.4: Department Renderer Implementation
- [x] Task 2.5: Department Decorations

### Phase 3: Character Sprites ✅
- [x] Task 3.1: Character Sprite Manager ✅ COMPLETE
- [x] Task 3.2: Direction Calculation System ✅ COMPLETE
- [x] Task 3.3: Enhanced Agent Entity Visuals ✅ COMPLETE
- [x] Task 3.4: Animation System Enhancement ✅ COMPLETE
- [x] Task 3.5: Walking Animation Integration ✅ COMPLETE

### Phase 4: Polish & Effects ☐
- [x] Task 4.1: Lighting System ✅ COMPLETE
- [x] Task 4.2: Highlight Effects ✅ COMPLETE
- [x] Task 4.3: Enhanced Particle Effects ✅ COMPLETE
- [x] Task 4.4: UI Overlay Modernization ✅ COMPLETE
- [ ] Task 4.5: Camera Polish

### Phase 5: Optimization & Testing ☐
- [x] Task 5.1: Performance Profiling ✅ COMPLETE
- [ ] Task 5.2: Sprite Batching Optimization
- [ ] Task 5.3: Asset Optimization
- [ ] Task 5.4: Visual Testing Suite
- [ ] Task 5.5: Integration Testing
- [ ] Task 5.6: Bug Fixes and Polish
- [ ] Task 5.7: Documentation

## Notes

- Tasks can be parallelized within phases where dependencies allow
- Estimated times are for a single developer
- Testing should be continuous throughout development
- Visual reviews recommended after each phase
- Performance monitoring should be ongoing
