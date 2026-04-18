# Implementation Plan: Game Layer MVP (2-4 Days)

## Overview

Minimal vertical slice to prove the "living company" concept. One agent, one room, one task - fast and visual.

## Tasks

### Day 1: Foundation & Rendering

- [x] 1. Create GameView component structure
  - Create `frontend/src/components/game/GameView.jsx`
  - Set up basic React component with canvas ref
  - Add component to Dashboard with toggle
  - Test component renders
  - _Requirements: 1.1, 1.2, 5.1_

- [x] 2. Implement canvas rendering setup
  - Create canvas element (400x300px)
  - Set up 2D rendering context
  - Implement render loop with requestAnimationFrame
  - Add FPS counter (optional, for debugging)
  - _Requirements: 1.1, 1.4_

- [x] 3. Draw simple office room
  - Render gray background (#F3F4F6)
  - Draw room border
  - Add "Marketing Office" label
  - Test room renders correctly
  - _Requirements: 1.2, 1.3_

- [x] 4. Draw agent in idle state
  - Draw blue circle at center (200, 150)
  - Add "Marketing Agent" label below
  - Add "Idle" status text
  - Test agent renders correctly
  - _Requirements: 2.1, 2.3_

- [ ] 5. Checkpoint - Visual foundation complete
  - Canvas renders at 30+ FPS
  - Room visible with border and label
  - Agent visible in center
  - All text readable

### Day 2: Backend Integration & State

- [x] 6. Set up backend polling
  - Create fetchPosts function using existing API
  - Implement useEffect with 3-second interval
  - Add error handling with try/catch
  - Log posts to console for debugging
  - _Requirements: 3.1, 3.4_

- [x] 7. Implement agent state management
  - Add useState for agentState ('idle' | 'working')
  - Add useState for currentTask
  - Add useState for showSuccess
  - Update state based on backend posts
  - _Requirements: 2.2, 3.2, 3.3_

- [x] 8. Connect backend state to agent visual
  - When post status is "generating", set agentState to 'working'
  - When no generating posts, set agentState to 'idle'
  - Change agent color based on state
  - Test with real backend data
  - _Requirements: 3.2, 3.3_

- [x] 9. Add working state animation
  - Implement pulsing circle animation when working
  - Change agent color to blue (#3B82F6)
  - Update status text to "Generating content..."
  - Add 💻 emoji or icon
  - _Requirements: 2.4, 4.1_

- [x] 10. Checkpoint - Backend connection working
  - Agent state changes when backend post is generating
  - Agent returns to idle when generation completes
  - No console errors
  - Polling works reliably

### Day 3: Polish & UI Integration

- [x] 11. Implement success celebration
  - When task completes, show green agent (#10B981)
  - Display "Content generated!" with ✅
  - Auto-return to idle after 2 seconds
  - Test transition feels satisfying
  - _Requirements: 4.3, 4.4_

- [x] 12. Add progress indicator
  - Display "Generating content..." above agent when working
  - Add simple text-based progress indicator
  - Style with appropriate colors
  - Test visibility and readability
  - _Requirements: 4.2_

- [x] 13. Create game view toggle
  - Add toggle button to Dashboard
  - Implement localStorage persistence
  - Add icons (🎮 Game View / 📊 Traditional View)
  - Style button to match existing UI
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 14. Integrate toggle with Dashboard
  - Show GameView when toggle is on
  - Show traditional Dashboard when toggle is off
  - Ensure smooth transition
  - Test toggle state persists on refresh
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 15. Add visual polish
  - Smooth color transitions (CSS transitions or canvas interpolation)
  - Improve text rendering (anti-aliasing, better fonts)
  - Add subtle shadows or glows
  - Ensure all states look polished
  - _Requirements: 1.4, 2.2_

- [x] 16. Checkpoint - MVP feature complete
  - Toggle works and persists
  - Agent responds to real backend
  - Success animation plays
  - Everything looks polished

### Day 4: Testing & Refinement

- [ ] 17. Manual testing - Happy path
  - Test with no posts generating (agent idle)
  - Create a post and watch agent work
  - Verify success animation plays
  - Confirm return to idle
  - _Requirements: All_

- [ ] 18. Manual testing - Edge cases
  - Test with API errors (disconnect network)
  - Test with multiple posts generating
  - Test rapid toggle on/off
  - Test page refresh during generation
  - _Requirements: 3.4_

- [x] 19. Error handling improvements
  - Add graceful fallback if API fails
  - Show connection status indicator (optional)
  - Prevent crashes from bad data
  - Log errors for debugging
  - _Requirements: 3.4_

- [x] 20. Performance check
  - Verify 30+ FPS maintained
  - Check memory usage doesn't grow
  - Ensure polling doesn't cause lag
  - Test on slower devices if possible
  - _Requirements: 1.4_

- [x] 21. Final polish and bug fixes
  - Fix any visual glitches
  - Improve animation timing
  - Adjust colors for better contrast
  - Clean up console logs
  - _Requirements: All_

- [x] 22. Documentation and demo prep
  - Add comments to code
  - Create simple README for the feature
  - Prepare demo script
  - Take screenshots/video
  - _Requirements: All_

## Notes

**Speed Optimizations:**
- Use native Canvas API (no PixiJS setup time)
- Use shapes/emoji (no asset creation)
- Use existing API (no backend changes)
- Use simple state (no complex architecture)
- Manual testing only (no test setup)

**Visual Impact:**
- Even though simple, make it feel alive
- Pulsing animation is key
- Color changes provide feedback
- Success celebration creates delight

**Flexibility:**
- If ahead of schedule, add second agent
- If behind schedule, simplify animations
- Core goal: prove the concept visually

**Success Metrics:**
- Can you show it to someone and they say "wow, that's cool"?
- Does it feel like a living company?
- Does it make the backend activity tangible?

If yes to all three, MVP is successful! 🎉
