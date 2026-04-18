# Design Document: Game Layer MVP (Vertical Slice)

## Overview

A minimal 2-4 day implementation to prove the "living company" concept. Focus on visual impact and backend connection, not architecture.

## Scope Constraints

**What's IN:**
- One agent (marketing/content generator)
- One room (simple office)
- One task type (content generation)
- Basic state sync (polling posts API)
- Simple animations (2-frame idle/working)
- Toggle between game/traditional view

**What's OUT:**
- Multiple agents
- Multiple rooms/departments
- Complex pathfinding
- Advanced animations
- Entity component system
- Performance optimization
- Comprehensive error handling
- Testing (manual testing only)

## Technical Approach

### Technology Stack

**Rendering: HTML5 Canvas (No PixiJS)**
- Use native Canvas 2D API
- Simpler, faster to implement
- Good enough for one agent

**State Management: React useState**
- No complex state library needed
- Simple polling with useEffect

**Assets: CSS/Emoji/Simple Shapes**
- No sprite sheets needed
- Use emoji or simple colored rectangles
- Text labels for states

## Architecture (Simplified)

```
┌─────────────────────────────────┐
│   GameView Component (React)    │
│  - Canvas rendering             │
│  - State polling                │
│  - Agent visualization          │
└─────────────────────────────────┘
           ↕
┌─────────────────────────────────┐
│   Posts API (Existing Backend)  │
│  - GET /posts                   │
│  - Filter by status             │
└─────────────────────────────────┘
```

## Component Design

### GameView Component

```typescript
interface GameViewProps {
  // No props needed - self-contained
}

interface GameState {
  agentState: 'idle' | 'working';
  currentTask: string | null;
  showSuccess: boolean;
}
```

**Responsibilities:**
- Render canvas
- Poll backend every 3s
- Update agent state
- Draw agent and indicators

### Agent Visualization

**Idle State:**
- Position: Center of room (200, 150)
- Visual: Blue circle (30px radius) or 🧑‍💼 emoji
- Label: "Marketing Agent" below
- Status: "Idle" in gray

**Working State:**
- Position: Same
- Visual: Blue circle with pulsing animation or 💻 emoji
- Label: "Marketing Agent" below
- Status: "Generating content..." in blue
- Progress: Simple text "Working..."

**Success State (2s):**
- Visual: Green circle or ✅ emoji
- Status: "Content generated!" in green
- Auto-return to idle after 2s

## State Synchronization

### Polling Strategy

```typescript
// Every 3 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const posts = await fetchPosts();
    const generating = posts.find(p => p.status === 'generating');
    
    if (generating && agentState !== 'working') {
      setAgentState('working');
      setCurrentTask(generating.postId);
    } else if (!generating && agentState === 'working') {
      setShowSuccess(true);
      setTimeout(() => {
        setAgentState('idle');
        setShowSuccess(false);
      }, 2000);
    }
  }, 3000);
  
  return () => clearInterval(interval);
}, [agentState]);
```

### Backend Integration

**API Call:**
```typescript
const fetchPosts = async () => {
  const response = await fetch('/api/posts', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
};
```

**State Mapping:**
- `status: "generating"` → Agent working
- `status: "completed"` → Show success, then idle
- No generating posts → Agent idle

## Canvas Rendering

### Room Rendering

```typescript
function drawRoom(ctx: CanvasRenderingContext2D) {
  // Background
  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(0, 0, 400, 300);
  
  // Room border
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 380, 280);
  
  // Room label
  ctx.fillStyle = '#6B7280';
  ctx.font = '14px sans-serif';
  ctx.fillText('Marketing Office', 20, 30);
}
```

### Agent Rendering

```typescript
function drawAgent(ctx: CanvasRenderingContext2D, state: GameState) {
  const x = 200, y = 150;
  
  // Agent circle
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fillStyle = state.agentState === 'working' ? '#3B82F6' : 
                  state.showSuccess ? '#10B981' : '#6B7280';
  ctx.fill();
  
  // Pulsing effect when working
  if (state.agentState === 'working') {
    const pulse = Math.sin(Date.now() / 500) * 5;
    ctx.beginPath();
    ctx.arc(x, y, 30 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Label
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Marketing Agent', x, y + 50);
  
  // Status
  const statusText = state.showSuccess ? '✅ Content generated!' :
                     state.agentState === 'working' ? '💻 Generating content...' :
                     '😴 Idle';
  ctx.fillStyle = state.showSuccess ? '#10B981' :
                  state.agentState === 'working' ? '#3B82F6' : '#6B7280';
  ctx.font = '11px sans-serif';
  ctx.fillText(statusText, x, y + 65);
}
```

## UI Integration

### Toggle Implementation

```typescript
// In Dashboard or main layout
const [gameViewEnabled, setGameViewEnabled] = useState(
  localStorage.getItem('gameViewEnabled') === 'true'
);

const toggleGameView = () => {
  const newValue = !gameViewEnabled;
  setGameViewEnabled(newValue);
  localStorage.setItem('gameViewEnabled', String(newValue));
};

// Render
{gameViewEnabled ? <GameView /> : <TraditionalDashboard />}
```

### Toggle Button

```typescript
<button
  onClick={toggleGameView}
  className="px-4 py-2 bg-indigo-600 text-white rounded"
>
  {gameViewEnabled ? '📊 Traditional View' : '🎮 Game View'}
</button>
```

## File Structure

```
frontend/src/
  components/
    game/
      GameView.jsx          # Main game component
      GameCanvas.jsx        # Canvas rendering logic
  pages/
    Dashboard.jsx           # Updated with toggle
```

## Implementation Notes

### Keep It Simple

1. **No external game libraries** - Use native Canvas API
2. **No sprite assets** - Use shapes, emoji, or CSS
3. **No complex state** - Just useState and useEffect
4. **No routing changes** - Add to existing Dashboard
5. **No tests** - Manual testing only for MVP

### Visual Polish

Even though simple, make it feel alive:
- Pulsing animation when working
- Smooth color transitions
- Clear status text
- Success celebration (even if just color change)

### Backend Connection

Use existing API:
- `/api/posts` endpoint
- Filter by `status === 'generating'`
- Use existing auth tokens
- Handle errors with try/catch

## Success Criteria

**MVP is successful if:**
1. User can toggle to game view
2. Agent appears in a room
3. Agent state changes when backend post is generating
4. Visual feedback is clear and satisfying
5. Can toggle back to traditional view
6. Works with real backend data

**Time Budget:**
- Day 1: Canvas setup, room rendering, agent rendering
- Day 2: Backend polling, state sync, agent state changes
- Day 3: Polish, toggle integration, success animations
- Day 4: Bug fixes, manual testing, demo prep

## Future Expansion Path

This MVP proves the concept. If successful, next steps:
- Add second agent
- Add movement between positions
- Add more task types
- Improve animations
- Add sound effects
- Implement proper architecture from full V4 spec
