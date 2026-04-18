# Unified Chat-Based Onboarding - Implementation Plan

**Date**: February 15, 2026  
**Priority**: HIGH - UX Enhancement

## Overview

Transform the onboarding experience from a separate page into a seamless chat-first experience where onboarding happens naturally through conversation.

## Key Changes

### 1. User Flow Transformation

**OLD FLOW**:
- User signs up → Redirected to /onboarding page
- Fills out form fields
- Submits → Redirected to /dashboard

**NEW FLOW**:
- User signs up → Redirected to / (chat interface)
- AI detects no brand profile → Assumes "Strategic Interviewer" persona
- Extracts information through natural conversation
- Saves data in real-time to DynamoDB
- Once complete → AI switches to "Social Media Manager" persona
- User can immediately start getting content suggestions

### 2. AI Persona System

**Strategic Interviewer Persona** (No Brand Profile):
- Friendly, conversational tone
- Asks strategic questions one at a time
- Extracts: brand_name, industry, target_audience, tone_of_voice, visual_style, content_pillars, post_times
- Real-time entity extraction and storage
- Progress tracking (invisible to user)

**Social Media Manager Persona** (Brand Profile Exists):
- Professional, helpful tone
- Suggests content ideas
- Helps with post creation
- Manages content calendar

### 3. Business Classification Logic

**Type A: Asset-Heavy Businesses**
- Barber shops, restaurants, retail stores, salons, gyms
- Requires real photos/videos
- AI explains need for authentic content
- Activates upload button in chat UI

**Type B: Generative-Heavy Businesses**
- Consulting, coaching, nutrition, education, SaaS
- Can use AI-generated images
- Focuses on authority building
- Uses web data and trends

### 4. Real-Time Data Extraction

For each user message:
1. Claude 3.5 Sonnet analyzes for key information
2. Extracts entities (brand name, industry, etc.)
3. Immediately saves to DynamoDB
4. Returns hidden JSON for frontend state updates
5. Continues conversation naturally

## Implementation Tasks

### Backend Changes

1. **Update Chat Handler** (`functions/chat-handler/handler.js`):
   - Add user state detection (check for existing brand)
   - Implement dual persona system
   - Add real-time entity extraction
   - Add business type classification
   - Ensure Node.js 20.x compatibility
   - Add comprehensive error handling with fallbacks

2. **Update System Prompts**:
   - Strategic Interviewer prompt
   - Social Media Manager prompt
   - Business classification logic
   - Entity extraction instructions

3. **Database Schema**:
   - Use existing Brands table
   - Use existing OnboardingSessionsTable
   - Add business_type field (asset_heavy | generative_heavy)

### Frontend Changes

1. **Update Routing** (`frontend/src/App.jsx`):
   - Make `/` the default route (chat interface)
   - Remove separate `/onboarding` route
   - Keep `/dashboard`, `/connections`, etc.

2. **Update Chat UI** (`frontend/src/components/chat/ChatSidebar.jsx`):
   - Add upload button (conditionally shown for asset-heavy businesses)
   - Add progress indicator (subtle, non-intrusive)
   - Add persona indicator (optional)

3. **Update Auth Flow** (`frontend/src/contexts/AuthContext.jsx`):
   - After signup → Redirect to `/` (chat)
   - After login → Check if brand exists
     - If no brand → Redirect to `/` (onboarding via chat)
     - If brand exists → Redirect to `/dashboard`

## Technical Requirements

### 1. CORS (Already Fixed) ✅
- All responses include proper CORS headers
- API Gateway configured correctly
- No changes needed

### 2. Node.js 20.x Compatibility ✅
- All functions using nodejs20.x runtime
- CommonJS modules (require)
- No ES Module conflicts

### 3. Error Handling
- Bedrock API failures → Fallback message
- DynamoDB errors → Retry logic
- Network errors → User-friendly messages

### 4. Performance
- Real-time extraction (< 2s response time)
- Optimistic UI updates
- Background data persistence

## System Prompt Examples

### Strategic Interviewer Prompt

```
You are Experta, a friendly AI assistant helping new users set up their social media presence.

CURRENT STATE: User has no brand profile yet.

YOUR ROLE: Strategic Interviewer
- Ask natural, conversational questions
- Extract information organically
- Don't make it feel like a form
- Be encouraging and supportive

INFORMATION TO COLLECT:
1. brand_name - What's their business called?
2. industry - What do they do?
3. target_audience - Who are they trying to reach?
4. tone_of_voice - How should they sound?
5. visual_style - What aesthetic do they prefer?
6. content_pillars - What topics should they cover? (need 3+)
7. post_times - When should posts go live?

BUSINESS CLASSIFICATION:
- If barber shop, restaurant, retail, salon, gym → Type A (Asset-Heavy)
  - Explain they'll need real photos
  - Mention upload feature
- If consulting, coaching, education, SaaS → Type B (Generative-Heavy)
  - Explain AI can generate visuals
  - Focus on authority building

EXTRACTION FORMAT:
Return JSON with:
{
  "extracted_entities": {...},
  "conversational_response": "Your friendly response",
  "business_type": "asset_heavy" or "generative_heavy" or null,
  "show_upload_button": true/false
}
```

### Social Media Manager Prompt

```
You are Experta, an expert social media manager for [BRAND_NAME].

CURRENT STATE: User has complete brand profile.

YOUR ROLE: Social Media Manager
- Suggest content ideas
- Help create posts
- Manage content calendar
- Provide strategic advice

BRAND CONTEXT:
- Name: [brand_name]
- Industry: [industry]
- Audience: [target_audience]
- Tone: [tone_of_voice]
- Style: [visual_style]
- Topics: [content_pillars]
- Post Times: [post_times]

CAPABILITIES:
- Generate post ideas
- Create captions
- Generate images (for Type B businesses)
- Schedule posts
- Analyze trends
```

## Migration Strategy

### Phase 1: Backend (Priority)
1. Update chat handler with dual persona system
2. Add entity extraction logic
3. Add business classification
4. Test with existing frontend

### Phase 2: Frontend
1. Update routing (/ becomes chat)
2. Add upload button to chat
3. Update auth redirects
4. Remove old onboarding page

### Phase 3: Testing
1. Test onboarding flow end-to-end
2. Test persona switching
3. Test entity extraction accuracy
4. Test error handling

## Success Metrics

- Onboarding completion rate > 80%
- Average onboarding time < 5 minutes
- User satisfaction with conversational flow
- Accurate entity extraction (> 90%)

## Rollback Plan

If issues arise:
1. Keep old `/onboarding` route active
2. Add toggle in frontend to use old flow
3. Monitor metrics and user feedback
4. Gradually migrate users to new flow

---

**Status**: Ready for Implementation  
**Estimated Time**: 4-6 hours  
**Risk Level**: Medium (significant UX change)  
**Dependencies**: None (CORS already fixed, Node.js 20.x ready)
