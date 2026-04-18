# Game Layer MVP - Quick Start Guide

## 🎯 Goal

Build a minimal "living company" visualization in 2-4 days:
- **1 agent** (marketing)
- **1 room** (office)  
- **1 task** (content generation)
- **Real backend connection**

## 📋 What You're Building

A simple canvas that shows:
- A blue circle representing your marketing agent
- Agent pulses when generating content (from real backend)
- Agent turns green when content completes
- Toggle between this view and traditional dashboard

## 🚀 Implementation Path

### Day 1: Get Something on Screen
1. Create `GameView.jsx` component
2. Add canvas element (400x300px)
3. Draw gray room with border
4. Draw blue circle in center (the agent)
5. Add labels ("Marketing Office", "Marketing Agent")

**Goal:** See a room with an agent by end of day 1

### Day 2: Connect to Backend
1. Poll `/api/posts` every 3 seconds
2. Check if any post has `status === 'generating'`
3. If yes → agent turns blue and pulses
4. If no → agent is gray and idle
5. Test with real post creation

**Goal:** Agent responds to real backend activity

### Day 3: Make It Feel Alive
1. Add success animation (green + ✅ for 2 seconds)
2. Add "Generating content..." text when working
3. Create toggle button in Dashboard
4. Save toggle state to localStorage
5. Polish colors and animations

**Goal:** Feels satisfying and polished

### Day 4: Test & Refine
1. Manual testing (create posts, watch agent)
2. Fix bugs
3. Add error handling
4. Final polish
5. Demo prep

**Goal:** Ready to show stakeholders

## 📁 Files to Create

```
frontend/src/
  components/
    game/
      GameView.jsx          # Main component (all logic here)
  pages/
    Dashboard.jsx           # Add toggle button
```

## 💻 Key Code Snippets

### GameView Component Structure

```jsx
import { useEffect, useRef, useState } from 'react';

export default function GameView() {
  const canvasRef = useRef(null);
  const [agentState, setAgentState] = useState('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Poll backend every 3s
  useEffect(() => {
    const interval = setInterval(async () => {
      // Fetch posts and update agent state
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    function render() {
      // Draw room
      // Draw agent
      requestAnimationFrame(render);
    }
    render();
  }, [agentState, showSuccess]);
  
  return <canvas ref={canvasRef} width={400} height={300} />;
}
```

### Backend Polling

```javascript
const fetchPosts = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/posts', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
};

// In useEffect
const posts = await fetchPosts();
const generating = posts.find(p => p.status === 'generating');

if (generating && agentState !== 'working') {
  setAgentState('working');
} else if (!generating && agentState === 'working') {
  setShowSuccess(true);
  setTimeout(() => {
    setAgentState('idle');
    setShowSuccess(false);
  }, 2000);
}
```

### Agent Rendering

```javascript
function drawAgent(ctx, state, showSuccess) {
  const x = 200, y = 150;
  
  // Circle
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fillStyle = showSuccess ? '#10B981' : 
                  state === 'working' ? '#3B82F6' : '#6B7280';
  ctx.fill();
  
  // Pulsing when working
  if (state === 'working') {
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
  const status = showSuccess ? '✅ Content generated!' :
                 state === 'working' ? '💻 Generating...' : '😴 Idle';
  ctx.fillText(status, x, y + 65);
}
```

### Toggle Button (in Dashboard)

```jsx
const [gameView, setGameView] = useState(
  localStorage.getItem('gameView') === 'true'
);

const toggleView = () => {
  const newValue = !gameView;
  setGameView(newValue);
  localStorage.setItem('gameView', String(newValue));
};

return (
  <div>
    <button onClick={toggleView} className="...">
      {gameView ? '📊 Traditional View' : '🎮 Game View'}
    </button>
    
    {gameView ? <GameView /> : <TraditionalDashboard />}
  </div>
);
```

## ✅ Success Checklist

- [ ] Canvas renders with room and agent
- [ ] Agent changes state when backend post is generating
- [ ] Success animation plays when generation completes
- [ ] Toggle switches between game and traditional view
- [ ] Toggle state persists on page refresh
- [ ] No console errors
- [ ] Feels satisfying to watch

## 🎨 Visual Guidelines

**Colors:**
- Room background: `#F3F4F6` (light gray)
- Room border: `#D1D5DB` (medium gray)
- Agent idle: `#6B7280` (gray)
- Agent working: `#3B82F6` (blue)
- Agent success: `#10B981` (green)

**Animations:**
- Pulsing: `Math.sin(Date.now() / 500) * 5` for smooth pulse
- Success duration: 2 seconds
- Polling interval: 3 seconds

**Text:**
- Room label: 14px, gray
- Agent label: 12px bold, dark gray
- Status: 11px, colored by state

## 🚫 What NOT to Do

- Don't add multiple agents (just one!)
- Don't add movement/pathfinding (static position)
- Don't use PixiJS or game libraries (native Canvas)
- Don't create sprite assets (use shapes/emoji)
- Don't write tests (manual testing only)
- Don't over-engineer (keep it simple!)

## 🎯 The Point

This MVP proves:
1. Backend activity can be visualized
2. It feels more alive than a dashboard
3. Users can understand what's happening
4. The concept is worth investing in

If stakeholders like it, you have the full V4 spec ready to implement properly!

## 📚 Reference Documents

- Full requirements: `.kiro/specs/game-layer-mvp/requirements.md`
- Full design: `.kiro/specs/game-layer-mvp/design.md`
- Task breakdown: `.kiro/specs/game-layer-mvp/tasks.md`
- Full V4 vision: `.kiro/specs/v4-frontend-game-layer/`

## 🚀 Ready to Start?

Open `.kiro/specs/game-layer-mvp/tasks.md` and start with Task 1!

Good luck! 🎮✨
