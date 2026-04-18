# AI-First Chat Onboarding Implementation

**Date**: February 16, 2026  
**Status**: Backend Complete - Frontend Pending

## What Was Done

### Backend Changes (✅ Complete)

Updated `functions/chat-handler/handler.js` with dual persona system:

1. **Onboarding Mode (Strategic Interviewer)**
   - Activated when user has no brand profile
   - Extracts information through natural conversation
   - Collects: brand_name, industry, target_audience, tone_of_voice, visual_style, content_pillars, post_times
   - Classifies business type (Asset-Heavy vs Generative-Heavy)
   - Saves data in real-time to DynamoDB
   - Returns hidden JSON for frontend state updates

2. **Social Media Manager Mode**
   - Activated when user has existing brand profile
   - Handles post creation, modification, deletion
   - Provides content suggestions
   - Manages content calendar

3. **Key Features**
   - Real-time entity extraction from conversation
   - Automatic brand creation/update in DynamoDB
   - Business classification logic (Type A/B)
   - Graceful error handling with fallback responses
   - CORS headers updated for localhost:5173

## Frontend Changes Needed

### 1. Update Routing (`frontend/src/App.jsx`)
```jsx
// Make / the default route (chat interface)
// Remove separate /onboarding route
// After signup → redirect to / (chat)
// After login → check if brand exists
//   - If no brand → redirect to / (onboarding via chat)
//   - If brand exists → redirect to /dashboard
```

### 2. Update Chat UI
- Add upload button (conditionally shown for asset-heavy businesses)
- Handle onboarding mode responses
- Display progress indicator (subtle)
- Update state when onboarding_complete is true

### 3. Delete Old Onboarding Components
- `frontend/src/components/onboarding/CompletionCelebration.jsx` (DELETE)
- `frontend/src/components/onboarding/Onboarding.jsx` (REMOVE form flow)
- Keep `frontend/src/components/onboarding/OnboardingInput.jsx` if used in chat

### 4. Update Auth Flow
- `frontend/src/components/auth/Signup.jsx`: Redirect to `/` instead of `/onboarding`
- `frontend/src/components/auth/Login.jsx`: Check brand existence, redirect accordingly

## API Response Format

### Onboarding Mode Response
```json
{
  "response": "Conversational AI response",
  "mode": "onboarding",
  "extracted_entities": {
    "brand_name": "value or null",
    "industry": "value or null",
    "target_audience": "value or null",
    "tone_of_voice": "value or null",
    "visual_style": "value or null",
    "content_pillars": [],
    "post_times": []
  },
  "business_type": "asset_heavy" | "generative_heavy" | null,
  "show_upload_button": true | false,
  "onboarding_complete": true | false,
  "brand_id": "uuid or null",
  "conversation_history": []
}
```

### Social Media Manager Mode Response
```json
{
  "response": "Conversational AI response",
  "mode": "social_media_manager",
  "action_taken": "create_post" | "modify_post" | "delete_post" | "query",
  "affected_post_id": "uuid or null",
  "conversation_history": [],
  "action_result": {}
}
```

## Business Classification Logic

**Type A (Asset-Heavy)**: Requires real photos
- Barber shops, restaurants, retail stores, salons, gyms, clothing stores
- `show_upload_button: true`

**Type B (Generative-Heavy)**: Can use AI-generated images
- Consulting, coaching, nutrition, education, SaaS, professional services
- `show_upload_button: false`

## Deployment Steps

1. Deploy backend changes:
   ```bash
   sam build
   sam deploy --config-env dev
   ```

2. Test onboarding flow:
   - Create new user account
   - Send chat messages
   - Verify brand creation in DynamoDB
   - Check entity extraction accuracy

3. Implement frontend changes (see above)

4. Test end-to-end flow

## Testing Checklist

- [ ] New user signup → redirects to chat
- [ ] Chat detects no brand → onboarding mode activated
- [ ] AI extracts entities from conversation
- [ ] Brand created in DynamoDB with extracted data
- [ ] onboarding_complete flag set when all data collected
- [ ] Existing user login → redirects to dashboard
- [ ] Chat with existing brand → social media manager mode
- [ ] Business classification works correctly
- [ ] Upload button shown for asset-heavy businesses
- [ ] Error handling works (Bedrock failures, DynamoDB errors)

## Known Issues / Notes

- toLowerCase error: Not found in current codebase, may have been resolved
- CORS already configured for localhost:5173
- Node.js 20.x runtime already in use
- All error handling includes fallback responses to keep conversation flowing

## Next Steps

1. Deploy backend changes
2. Test with Postman or curl
3. Implement frontend changes
4. End-to-end testing
5. Update documentation

---

**Implementation Time**: ~2 hours (backend only)  
**Risk Level**: Low (backend changes are isolated, frontend can be updated incrementally)
