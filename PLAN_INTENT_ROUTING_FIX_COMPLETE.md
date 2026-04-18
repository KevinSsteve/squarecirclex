# Plan Intent Routing & Structured Schema Fix - DEPLOYED ✅

**Date**: March 6, 2026  
**Status**: Successfully Deployed to AWS  
**Deployment Stack**: onzo (us-east-1)

---

## Problem Statement

The AI was misclassifying content plan requests:
- Setting `response_type: "chat"` for plan/calendar requests
- Dumping entire calendar into a single text string in `conversational_response`
- Frontend unable to render rich ContentPlanCard components
- No structured `plan_data` array being returned

---

## Solution Implemented

### 1. Strict Intent Routing Rules

Added explicit intent routing logic to system prompt:

```
INTENT ROUTING RULES (CRITICAL):
- When user asks for "plano", "calendário", "estratégia da semana", "planejamento" 
  → response_type MUST be "plan"
- When user asks to generate a specific post 
  → response_type MUST be "post_content"
- For all other conversations 
  → response_type is "chat"
```

### 2. Structured Plan Schema

Enforced structured JSON format for Phase 2 (Calendar/Plan):

**Before** (broken):
```json
{
  "response_type": "chat",
  "conversational_response": "Segunda: Dica\nQuarta: Tendência\nSexta: Sucesso..."
}
```

**After** (fixed):
```json
{
  "response_type": "plan",
  "conversational_response": "Aqui está o plano de conteúdo para a semana!",
  "plan_data": [
    {
      "day": "Segunda-feira",
      "theme": "Dica de Valorização",
      "objective": "Educar proprietários sobre como aumentar o valor do imóvel"
    },
    {
      "day": "Quarta-feira",
      "theme": "Tendência do Mercado",
      "objective": "Mostrar expertise e atrair novos clientes"
    },
    {
      "day": "Sexta-feira",
      "theme": "Sucesso de Cliente",
      "objective": "Construir confiança através de prova social"
    }
  ]
}
```

### 3. Backend Response Handling

Updated `processSocialMediaMessage()` to:
- Extract `plan_data` from Claude response
- Pass `plan_data` through to main handler
- Log plan generation events

Updated main handler to:
- Include `plan_data` in response when available
- Log number of plan items generated
- Preserve existing `post_content` and `image_url` handling

---

## Technical Details

### Files Modified

**functions/chat-handler/handler.js**:

1. **System Prompt Enhancement** (lines ~540-580):
   - Added INTENT ROUTING RULES section
   - Added structured plan schema example
   - Added CRITICAL warning about structured format requirement

2. **Response Extraction** (lines ~620-630):
   - Added `plan_data: responseData.plan_data || null` to return object
   - Preserves null if no plan data present

3. **Main Handler Response** (lines ~1120-1130):
   - Added plan_data to responseData when available
   - Added logging for plan generation
   - Maintains separation between plan, post_content, and chat responses

---

## Response Type Matrix

| User Intent | Trigger Keywords | response_type | Data Field |
|------------|------------------|---------------|------------|
| Strategy Questions | "olá", "ajuda", "quero criar" | `"chat"` | `conversational_response` |
| Content Plan/Calendar | "plano", "calendário", "estratégia" | `"plan"` | `plan_data[]` |
| Post Generation | "gere agora", "crie o post" | `"post_content"` | `post_content{}` |

---

## Frontend Integration

The frontend can now properly detect and render plans:

```javascript
// In ChatPage.jsx or similar
if (response.response_type === 'plan' && response.plan_data) {
  // Render ContentPlanCard components
  response.plan_data.map(item => (
    <ContentPlanCard 
      day={item.day}
      theme={item.theme}
      objective={item.objective}
    />
  ))
}
```

---

## Expected Behavior After Fix

### Intent Classification
✅ "Crie um plano para a semana" → `response_type: "plan"`  
✅ "Qual é a estratégia de conteúdo?" → `response_type: "plan"`  
✅ "Gere o calendário" → `response_type: "plan"`  
✅ "Gere agora" → `response_type: "post_content"`  
✅ "Olá, preciso de ajuda" → `response_type: "chat"`

### Structured Data
✅ Plan requests return `plan_data` array with objects  
✅ Each plan item has `day`, `theme`, `objective` fields  
✅ No more text dumps in `conversational_response`  
✅ Frontend can map over `plan_data` to render cards

### Backward Compatibility
✅ Post generation still works (`post_content`)  
✅ Chat conversations still work (`conversational_response`)  
✅ Image generation still works (`image_url`)  
✅ All existing features preserved

---

## Testing Recommendations

1. **Test Plan Intent Recognition**:
   - Send: "Crie um plano de conteúdo para a semana"
   - Verify: `response_type === "plan"`
   - Verify: `plan_data` is an array with 3 objects
   - Verify: Each object has `day`, `theme`, `objective`

2. **Test Plan Data Structure**:
   - Check `plan_data[0].day` is a string (e.g., "Segunda-feira")
   - Check `plan_data[0].theme` is descriptive
   - Check `plan_data[0].objective` explains the goal
   - Verify no newline characters in strings

3. **Test Other Intents Still Work**:
   - Send: "Gere agora" → Should return `post_content`
   - Send: "Olá" → Should return `chat` with strategic question
   - Verify no regression in existing functionality

4. **Test Frontend Rendering**:
   - Verify ContentPlanCard components render correctly
   - Check that plan items display in proper format
   - Confirm no "undefined" or missing data

---

## CloudWatch Monitoring

**Success Indicators**:
```
Content plan generated { brandId: '...', planItems: 3 }
```

**Logs to Watch**:
- `response_type: plan` in response data
- `plan_data` array length
- No JSON parsing errors
- Proper intent classification

---

## Architecture Flow

```
User: "Crie um plano para a semana"
    ↓
Intent Routing: Detects "plano" keyword
    ↓
Claude: Generates structured plan_data array
    ↓
sanitizeAndExtractJSON(): Parses JSON safely
    ↓
processSocialMediaMessage(): Returns plan_data
    ↓
Main Handler: Adds plan_data to response
    ↓
Frontend: Renders ContentPlanCard components
```

---

## Related Fixes

This fix builds on:
1. **JSON Sanitization** (Previous): Handles control characters and markdown
2. **Conversation History** (Task 7): Maintains context across messages
3. **Agentic Workflow** (Task 2): 3-phase progression (Strategy → Plan → Execution)

---

## Next Steps

1. Test plan generation with various keywords
2. Verify frontend ContentPlanCard rendering
3. Check that plan_data structure matches frontend expectations
4. Monitor CloudWatch for intent classification accuracy
5. Confirm no regression in post generation or chat functionality

---

## Conclusion

The intent routing fix ensures that when users request content plans or calendars, the AI correctly classifies the intent as `response_type: "plan"` and returns a structured `plan_data` array instead of dumping text into `conversational_response`. This enables the frontend to properly render rich ContentPlanCard UI components.

The fix is now live in production and ready for testing.
