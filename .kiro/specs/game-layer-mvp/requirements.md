# Requirements Document: Game Layer MVP (Vertical Slice)

## Introduction

A minimal vertical slice to prove the "living company" concept in 2-4 days. One agent, one room, one task type - connected to real backend data.

## Glossary

- **MVP_Game_Layer**: Minimal proof-of-concept visualization
- **Marketing_Agent**: Single AI agent character representing content generation
- **Office_Room**: Simple single-room environment
- **Content_Task**: Visual representation of post generation from backend

## Requirements

### Requirement 1: Minimal Canvas Rendering

**User Story:** As a developer, I want a basic canvas with one room, so that I can render a simple office environment.

#### Acceptance Criteria

1. THE System SHALL render a canvas element in React
2. THE System SHALL display a simple rectangular office room (400x300px)
3. THE System SHALL use a solid background color for the room
4. THE System SHALL render at 30+ FPS

### Requirement 2: Single Agent Visualization

**User Story:** As a user, I want to see one marketing agent character, so that I can visualize my AI worker.

#### Acceptance Criteria

1. THE System SHALL display one agent sprite in the office
2. THE Agent SHALL have two visual states: idle and working
3. WHEN idle, THE Agent SHALL display a static sprite
4. WHEN working, THE Agent SHALL display an animated sprite (simple 2-frame animation)

### Requirement 3: Backend State Connection

**User Story:** As a user, I want the agent to reflect real backend post status, so that I see actual system activity.

#### Acceptance Criteria

1. THE System SHALL poll the posts API every 3 seconds
2. WHEN a post has status "generating", THE Agent SHALL show working state
3. WHEN no posts are generating, THE Agent SHALL show idle state
4. THE System SHALL handle API errors gracefully

### Requirement 4: Basic Task Visualization

**User Story:** As a user, I want to see when content is being generated, so that I understand system activity.

#### Acceptance Criteria

1. WHEN a post is generating, THE System SHALL show a progress indicator above the agent
2. THE Progress indicator SHALL display "Generating content..."
3. WHEN generation completes, THE System SHALL show a brief success indicator (2 seconds)
4. THE System SHALL return agent to idle state after completion

### Requirement 5: Simple UI Integration

**User Story:** As a user, I want a toggle to switch between game view and traditional dashboard, so that I can choose my preferred interface.

#### Acceptance Criteria

1. THE System SHALL provide a "Game View" toggle button
2. WHEN toggled on, THE System SHALL show the game canvas
3. WHEN toggled off, THE System SHALL show the traditional dashboard
4. THE Toggle state SHALL persist in localStorage
