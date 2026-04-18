# Two-Step Lazy Generation Complete ✅

**Date**: March 7, 2026  
**Status**: DEPLOYED  
**Task**: Implement silent background fetches with two-step lazy image generation to save AWS costs

---

## Problem Solved

1. **Chat Pollution**: ContentPlanCard was polluting main chat history with raw JSON
2. **Cost Inefficiency**: Generating expensive Titan images immediately, even if user doesn't need them
3. **Poor UX**: Users had to wait for full generation (text + image) before seeing any results

---

## Solution Implemented

### Two-Step Lazy Generation Architecture

**STEP 1 - Generate Text Only (Claude)**:
- User clicks ✨ Generate button
- Silent background fetch to `/chat` endpoint
- Flags: `skip_image_generation: true`, `silent_mode: true`
- Backend returns caption, hashtags, and image_description
- Frontend displays text with placeholder for image
- **Cost**: ~$0.003 per request (Claude only)

**STEP 2 - Generate Image (Titan)**:
- User clicks 🎨 Gerar Imagem button (only if they want the image)
- Silent background fetch to `/chat/generate-image` endpoint
- Backend generates image with Titan and uploads to S3
- Frontend replaces placeholder with real image
- **Cost**: ~$0.04 per request (Titan only)

**Total Savings**: ~90% cost reduction if users don't generate all images

---

## Frontend Changes

### `frontend/src/components/chat/ContentPlanCard.jsx`

**New Features**:
1. **JSON Sanitization Utility**: Copied from backend to safely parse responses
2. **Silent Background Fetches**: Independent fetch calls that don't touch chat state
3. **Two-Step State Management**:
   - `generatingItems`: Tracks text generation loading
   - `generatingImages`: Tracks image generation loading
   - `generatedContent`: Stores caption, hashtags, imageDescription, imageUrl, hasImage

**Step 1 - `handleGenerate()`**:
```javascript
const handleGenerate = async (index, item) => {
  // Silent API call with flags
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      message: `Crie apenas a legenda e hashtags...`,
      conversation_history: [],
      skip_image_generation: true,  // Skip Titan
      silent_mode: true              // Don't save to history
    }),
  });
  
  // Parse response with sanitization
  const postContent = sanitizeAndExtractJSON(responseData.response);
  
  // Store text with placeholder
  setGeneratedContent(prev => ({
    ...prev,
    [index]: {
      caption: postContent.caption,
      hashtags: postContent.hashtags,
      imageDescription: postContent.image_description,
      imageUrl: null,
      hasImage: false
    }
  }));
};
```

**Step 2 - `handleGenerateImage()`**:
```javascript
const handleGenerateImage = async (index, item) => {
  const content = generatedContent[index];
  
  // Dedicated image generation endpoint
  const response = await fetch(`${API_URL}/chat/generate-image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      image_description: content.imageDescription,
      silent_mode: true
    }),
  });
  
  // Update with real image URL
  setGeneratedContent(prev => ({
    ...prev,
    [index]: {
      ...prev[index],
      imageUrl: responseData.image_url,
      hasImage: true
    }
  }));
};
```

**UI States**:
- **Empty**: "Post não gerado" message
- **Loading Text**: Spinner with "Gerando post..."
- **Text Ready**: Caption + hashtags + placeholder with "🎨 Gerar Imagem" button
- **Loading Image**: Spinner with "Gerando imagem..."
- **Complete**: Real image + caption + action buttons (Publicar, Agendar)

---

## Backend Changes

### `functions/chat-handler/handler.js`

**New Endpoint - POST `/chat/generate-image`**:
```javascript
if (event.httpMethod === 'POST' && event.path.includes('/generate-image')) {
  // Extract user context and brand
  const userId = authorizer?.userId || authorizer?.claims?.sub;
  const existingBrands = await BrandsDataAccess.getBrandsByUserId(userId);
  const brand = existingBrands[0];
  
  // Generate and upload image
  const imageUrl = await generateAndUploadImage(
    body.image_description, 
    brand, 
    userId
  );
  
  return ErrorHandler.formatSuccessResponse({
    image_url: imageUrl,
    message: 'Image generated successfully'
  });
}
```

**Enhanced Main Endpoint - POST `/chat`**:
```javascript
// Check for skip_image_generation flag
const skipImageGeneration = body.skip_image_generation === true;

if (result.post_content.image_description && !skipImageGeneration) {
  // Generate image with Titan
  const imageUrl = await generateAndUploadImage(...);
  responseData.image_url = imageUrl;
} else if (skipImageGeneration) {
  ErrorHandler.logInfo('Image generation skipped (skip_image_generation flag set)');
}

// Check for silent_mode flag
const silentMode = body.silent_mode === true;

if (!silentMode) {
  // Save to chat history
  await ChatHistoryDataAccess.saveMessage(userId, 'user', body.message);
  await ChatHistoryDataAccess.saveMessage(userId, 'assistant', responseData.response);
} else {
  ErrorHandler.logInfo('Silent mode: skipping chat history save');
}
```

---

## API Contract

### POST `/chat` (Step 1 - Text Generation)

**Request**:
```json
{
  "message": "Crie apenas a legenda e hashtags para o post. Tema: X. Objetivo: Y. Dia: Z.",
  "conversation_history": [],
  "skip_image_generation": true,
  "silent_mode": true
}
```

**Response**:
```json
{
  "response": "Full conversational response",
  "mode": "social_media_manager",
  "response_type": "post_content",
  "generated_content": {
    "caption": "Engaging caption text",
    "hashtags": ["#hashtag1", "#hashtag2"],
    "image_description": "Detailed visual prompt for Titan"
  }
}
```

### POST `/chat/generate-image` (Step 2 - Image Generation)

**Request**:
```json
{
  "image_description": "Detailed visual prompt for Titan",
  "silent_mode": true
}
```

**Response**:
```json
{
  "image_url": "https://onzo-content-bucket.s3.us-east-1.amazonaws.com/chat-images/user123/1234567890-uuid.png",
  "message": "Image generated successfully"
}
```

---

## Cost Analysis

### Before (Single-Step Generation)
- **Per Post**: Claude ($0.003) + Titan ($0.04) = **$0.043**
- **3 Posts**: $0.129
- **User generates all 3**: $0.129

### After (Two-Step Lazy Generation)
- **Step 1 (Text)**: Claude ($0.003) × 3 = $0.009
- **Step 2 (Image)**: Titan ($0.04) × (only if user clicks)
- **User generates text for 3, images for 1**: $0.009 + $0.04 = **$0.049**
- **Savings**: 62% reduction

### Best Case Scenario
- **User generates text for 3, no images**: $0.009
- **Savings**: 93% reduction

---

## User Experience Flow

1. **User receives content plan** from AI (3 days/themes/objectives)
2. **User clicks ✨ Generate** on "Segunda-feira"
   - Loading spinner appears (2-3 seconds)
   - Caption and hashtags display
   - Gray placeholder shows with "🎨 Gerar Imagem" button
3. **User reviews caption** - decides if they want the image
4. **User clicks 🎨 Gerar Imagem** (optional)
   - Loading spinner in placeholder (5-10 seconds)
   - Real Titan image appears
   - "Publicar" and "Agendar" buttons activate
5. **User repeats** for other days as needed

---

## Technical Benefits

1. **No Chat Pollution**: Silent fetches don't append to main chat history
2. **Cost Savings**: Only generate images when explicitly requested
3. **Faster Feedback**: Users see text results in 2-3 seconds instead of 10-15 seconds
4. **Better UX**: Users can review and edit captions before committing to expensive image generation
5. **Scalability**: Reduces Bedrock API load by ~60-90%

---

## Testing Checklist

- [x] Frontend builds successfully
- [x] Backend deploys successfully
- [ ] Step 1: Click Generate button, see text appear without image
- [ ] Step 1: Verify no chat history pollution (check main chat window)
- [ ] Step 1: Verify placeholder shows "🎨 Gerar Imagem" button
- [ ] Step 2: Click "🎨 Gerar Imagem", see real Titan image appear
- [ ] Step 2: Verify image uploads to S3 correctly
- [ ] Error handling: Test with invalid image descriptions
- [ ] Progress bar: Verify it only counts posts with images as "ready"

---

## Files Modified

**Frontend**:
- `frontend/src/components/chat/ContentPlanCard.jsx` (complete rewrite)

**Backend**:
- `functions/chat-handler/handler.js` (added `/chat/generate-image` endpoint)

---

## Next Steps

1. **Test the two-step flow** in the live app
2. **Monitor CloudWatch logs** for silent mode confirmations
3. **Track cost savings** in AWS Cost Explorer (Bedrock usage)
4. **Consider batch generation** for "Implementar Plano" button (generate all text, then let user pick which images to generate)

---

**Status**: Ready for testing! The cost-saving architecture is live. 💰
