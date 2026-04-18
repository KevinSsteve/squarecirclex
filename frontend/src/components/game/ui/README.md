# Game UI Overlay Components

This directory contains the React UI components that render above the PixiJS game canvas.

## Architecture

The UI overlay uses React portals to render components above the game canvas while maintaining proper z-index layering and pointer event management.

### Component Hierarchy

```
UIOverlay (Portal Root)
├── TopBar (z-index: 110)
│   ├── Logo & Title
│   ├── View Toggle Button
│   ├── Camera Controls Info
│   └── Connection Status
├── LeftSidebar (z-index: 105)
│   ├── Header with collapse button
│   ├── Agent List (scrollable)
│   └── Add Agent Button
├── RightSidebar (z-index: 105)
│   ├── Header with collapse button
│   ├── Tab Navigation (Active/Queued/History)
│   ├── Task List (scrollable)
│   └── Actions
├── BottomBar (z-index: 110)
│   ├── Sync Status
│   ├── Agent Count
│   ├── Task Count
│   └── FPS Counter
└── Floating Panels (z-index: 120)
    └── (Future: Entity details, modals, notifications)
```

## Components

### UIOverlay

Main container component that manages the entire UI overlay structure.

**Props:**
- `fps` (number): Current frames per second
- `connectionStatus` (string): 'connected' | 'disconnected' | 'error'
- `agentCount` (number): Number of active agents
- `taskCount` (number): Number of active tasks
- `onViewToggle` (function): Callback for view toggle button
- `children` (ReactNode): Floating panels and modals

**Features:**
- React portal rendering to document.body
- Panel collapse/expand state management
- Z-index layering for proper stacking
- Pointer events management (panels are interactive, background is not)

### TopBar

Navigation bar at the top of the screen.

**Props:**
- `onViewToggle` (function): Callback for view toggle
- `connectionStatus` (string): Connection status indicator

**Features:**
- Logo and title
- View toggle button (game/traditional)
- Camera control hints
- Connection status indicator

### LeftSidebar

Agent list panel on the left side.

**Props:**
- `isOpen` (boolean): Panel visibility state
- `onToggle` (function): Callback to toggle panel
- `agentCount` (number): Number of agents to display

**Features:**
- Collapsible with smooth animation
- Agent list (to be populated in future tasks)
- Add agent button
- Scrollable content area

### RightSidebar

Task queue panel on the right side.

**Props:**
- `isOpen` (boolean): Panel visibility state
- `onToggle` (function): Callback to toggle panel
- `taskCount` (number): Number of tasks to display

**Features:**
- Collapsible with smooth animation
- Tab navigation (Active/Queued/History)
- Task list (to be populated in future tasks)
- Badge counts on tabs
- Scrollable content area

### BottomBar

Status bar at the bottom of the screen.

**Props:**
- `fps` (number): Current FPS
- `connectionStatus` (string): Connection status
- `agentCount` (number): Active agent count
- `taskCount` (number): Active task count

**Features:**
- Sync status indicator
- Agent and task counts
- FPS counter with color coding
- Compact, always-visible design

## Z-Index Management

The UI overlay uses a strict z-index hierarchy:

- **100**: Base overlay container (pointer-events: none)
- **105**: Sidebars (left and right)
- **106**: Collapse/expand toggle buttons
- **110**: Top and bottom bars
- **120**: Floating panels and modals

This ensures proper layering and prevents interaction conflicts.

## Pointer Events

The overlay uses `pointer-events-none` on the root container to allow clicks to pass through to the game canvas. Individual panels use `pointer-events-auto` to capture interactions.

## Collapse/Expand Functionality

Both sidebars can be collapsed to provide more screen space for the game view:

- Smooth CSS transitions (300ms)
- Toggle buttons appear when collapsed
- State managed in UIOverlay component
- Keyboard shortcuts (future enhancement)

## Future Enhancements

### Phase 7 Tasks (Upcoming)

1. **Agent List Panel** (Task 37)
   - Agent cards with avatars
   - Status indicators
   - Click-to-focus functionality
   - Department filtering

2. **Task Queue Panel** (Task 38)
   - Task cards with icons
   - Progress indicators
   - Click-to-highlight functionality
   - Real-time updates

3. **Entity Detail Panel** (Task 39)
   - Floating panel for selected entities
   - Draggable positioning
   - Agent and task details
   - Action buttons

4. **Notification System** (Task 40)
   - Toast notifications
   - Auto-hide with duration
   - Notification queue
   - Event batching

5. **UI-Game Communication** (Task 43)
   - Event bus for bidirectional communication
   - Shared state synchronization
   - Click handlers for UI → game
   - Update handlers for game → UI

## Usage Example

```jsx
import UIOverlay from './ui/UIOverlay';

function GameView() {
  const [fps, setFps] = useState(60);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [agentCount, setAgentCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  return (
    <>
      {/* Game canvas */}
      <div ref={canvasRef} className="fixed inset-0" />

      {/* UI Overlay */}
      <UIOverlay
        fps={fps}
        connectionStatus={connectionStatus}
        agentCount={agentCount}
        taskCount={taskCount}
        onViewToggle={() => console.log('Toggle view')}
      >
        {/* Floating panels go here */}
      </UIOverlay>
    </>
  );
}
```

## Styling

All components use Tailwind CSS for styling:
- Consistent spacing and sizing
- Smooth transitions and animations
- Responsive design (desktop and tablet)
- Accessible color contrast
- Hover and focus states

## Accessibility

- Semantic HTML elements
- ARIA labels for icon buttons
- Keyboard navigation support (future)
- Screen reader friendly (future)
- High contrast mode support (future)

## Performance

- Minimal re-renders (state managed at top level)
- CSS transitions (GPU accelerated)
- Portal rendering (separate from game loop)
- Efficient event handling
- No unnecessary DOM updates

## Testing

Unit tests should cover:
- Panel collapse/expand functionality
- State management
- Event handlers
- Conditional rendering
- Accessibility features

Integration tests should cover:
- UI-game communication
- Real-time updates
- Multi-panel interactions
- Responsive behavior
