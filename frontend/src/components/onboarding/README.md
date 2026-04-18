# Onboarding Component

## Overview

The Onboarding component provides a conversational interface for collecting brand information from new users. It guides users through a multi-step process to gather all necessary data for setting up their brand in Experta.

## Components

### Onboarding.jsx
Main orchestrator component that manages the onboarding flow.

**Features:**
- Chat-style conversational interface
- Progressive information collection
- Three-step flow: chat → confirmation → celebration
- Auto-scrolling message history
- Typing indicators for better UX

**Data Collected:**
- Brand name
- Industry
- Target audience
- Tone of voice
- Visual style preferences
- Content pillars (minimum 3)
- Posting times (HH:MM format)
- Instagram credentials (optional)
- LinkedIn credentials (optional)

### OnboardingInput.jsx
Input component for user messages.

**Features:**
- Text area with auto-resize
- Enter key to submit (Shift+Enter for new line)
- Disabled state during AI processing
- Send button with icon

### DataConfirmation.jsx
Review screen showing all collected information.

**Features:**
- Organized display of all brand data
- Visual tags for content pillars and post times
- Social media connection status indicators
- Edit and confirm actions

### CompletionCelebration.jsx
Final screen with progress indicator and success message.

**Features:**
- Real-time progress bar during brand creation
- Backend API integration for brand creation
- Task status updates
- Success celebration with stats
- Error handling with retry option
- Automatic redirect to dashboard on completion

## API Integration

The onboarding flow integrates with the backend through:

```javascript
api.createBrand(brandData)
```

**Request Payload:**
```json
{
  "brand_name": "string",
  "industry": "string",
  "target_audience": "string",
  "tone_of_voice": "string",
  "visual_style": "string",
  "content_pillars": ["string"],
  "post_times": ["HH:MM"],
  "instagram_token": "string",
  "linkedin_token": "string"
}
```

**Response:**
```json
{
  "brand_id": "uuid",
  "message": "Brand created successfully",
  "calendar_generation_started": true
}
```

## User Flow

1. **Initial Greeting**: User sees welcome message from Experta
2. **Information Collection**: User answers questions one by one
   - Brand name
   - Industry
   - Target audience
   - Tone of voice
   - Visual style
   - Content pillars (min 3)
   - Posting times
   - Social media credentials
3. **Confirmation**: User reviews all collected data
4. **Processing**: Backend creates brand and triggers content generation
5. **Celebration**: Success screen with stats and next steps
6. **Redirect**: Automatic navigation to dashboard

## Validation

- **Content Pillars**: Minimum 3 required
- **Post Times**: Must be in HH:MM format (24-hour)
- **Social Media**: Optional (can skip)
- **All Other Fields**: Required

## Error Handling

- Network errors display error message with retry option
- Invalid data triggers re-collection
- Missing required fields prevent progression
- API errors show user-friendly messages

## Usage

```jsx
import { Onboarding } from './components/onboarding';

// In App.jsx or routing
<Route path="/onboarding" element={
  <ProtectedRoute>
    <Onboarding />
  </ProtectedRoute>
} />
```

## Requirements Validated

- **1.1**: Conversational onboarding flow using chat interface
- **1.2**: Collects brand name, industry, target audience, tone, visual style
- **1.3**: Collects content pillars and posting times
- **1.4**: Collects social media credentials
- **1.6**: Saves brand data via API call
- **1.7**: Confirms successful setup and displays next steps
