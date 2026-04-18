# Game Layer MVP - AI Company Simulator

## Overview

The Game Layer is a real-time visualization of your AI company's operations. It transforms backend activity into a living, animated office environment where you can watch your AI agents work.

## Features

### Real-Time Backend Integration
- Polls `/api/posts` every 3 seconds
- Detects posts with `status === 'generating'`
- Shows agent working when content is being generated
- Celebrates when tasks complete

### Agent States
- **Idle** (Gray): Agent is waiting for work
- **Working** (Blue, Pulsing): Agent is generating content
- **Success** (Green, 2 seconds): Content generation completed

### Connection Status
- **Green dot**: Connected to backend
- **Yellow dot (pulsing)**: Temporarily disconnected, reconnecting
- **Red dot (pulsing)**: Connection error after 3 failed attempts

### Error Handling
- Graceful fallback on API errors
- Validates response structure
- Prevents crashes from bad data
- Maintains last known state during outages
- Visual connection status indicator

## Usage

### Toggle Game View

In the Dashboard component, users can toggle between traditional view and game view:

```jsx
import GameView from '../components/game/GameView';

// Toggle state persists in localStorage
const [showGameView, setShowGameView] = useState(
  localStorage.getItem('showGameView') === 'true'
);
```

### Component Structure

```
GameView.jsx
├── Backend Polling (useEffect)
│   ├── Fetch posts every 3 seconds
│   ├── Detect generating posts
│   ├── Handle state transitions
│   └── Error handling with retry
├── Render Loop (useEffect)
│   ├── requestAnimationFrame for 60 FPS
│   ├── Draw room background
│   ├── Draw animated agent
│   └── Draw connection status
└── Drawing Functions
    ├── drawRoom() - Office background
    ├── drawAgent() - Agent with animations
    └── drawConnectionStatus() - Status indicator
```

## Technical Details

### Canvas Rendering
- Native Canvas API (no external libraries)
- 400x300px canvas size
- 60 FPS using requestAnimationFrame
- Efficient full-canvas redraw each frame

### State Management
- React hooks for state
- useRef for animation frame and task tracking
- localStorage for toggle persistence

### Performance
- Lightweight: ~200 lines of code
- No external dependencies (except React)
- Minimal memory footprint
- Smooth animations on all devices

## Future Enhancements

Potential additions for V4:
- Multiple agents (marketing, publisher, assistant)
- Multiple rooms (departments)
- Agent movement between rooms
- Task queues visualization
- Sound effects
- More detailed animations
- Click interactions

## Testing

### Manual Testing Checklist
- [ ] Agent shows idle when no posts generating
- [ ] Agent shows working when post is generating
- [ ] Success animation plays when generation completes
- [ ] Agent returns to idle after success
- [ ] Connection indicator shows disconnected on network error
- [ ] Connection indicator shows error after 3 failures
- [ ] Toggle persists on page refresh
- [ ] No console errors during normal operation
- [ ] Smooth 60 FPS animation
- [ ] Works on mobile devices

### Edge Cases
- [ ] Multiple posts generating simultaneously
- [ ] Rapid toggle on/off
- [ ] Page refresh during generation
- [ ] Network disconnection
- [ ] Invalid API responses
- [ ] Empty posts array

## Code Example

```jsx
import GameView from './components/game/GameView';

function Dashboard() {
  const [showGameView, setShowGameView] = useState(false);

  return (
    <div>
      <button onClick={() => setShowGameView(!showGameView)}>
        {showGameView ? '📊 Traditional View' : '🎮 Game View'}
      </button>
      
      {showGameView ? <GameView /> : <TraditionalDashboard />}
    </div>
  );
}
```

## Architecture Decisions

### Why Native Canvas?
- Fast implementation (no library setup)
- Lightweight (no dependencies)
- Full control over rendering
- Easy to understand and modify

### Why Shapes Instead of Sprites?
- No asset creation needed
- Faster MVP development
- Easy to customize colors
- Scales to any size

### Why 3-Second Polling?
- Balance between responsiveness and server load
- Matches typical content generation time
- Prevents excessive API calls
- Can be adjusted based on needs

## Deployment

The game layer is part of the frontend build:

```bash
cd frontend
npm run build
```

No backend changes required - uses existing `/api/posts` endpoint.

## Support

For issues or questions:
1. Check console for errors
2. Verify `/api/posts` endpoint is working
3. Test with network tab open
4. Check connection status indicator

## License

Part of Experta AI Social Manager
