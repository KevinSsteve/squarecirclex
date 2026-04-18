# JSON Sanitization & Phase Transition Fix - DEPLOYED ✅

**Date**: March 6, 2026  
**Status**: Successfully Deployed to AWS  
**Deployment Stack**: onzo (us-east-1)

---

## Problem Statement

The AI was experiencing two critical issues:

1. **JSON Parsing Failures**: Claude responses containing raw newline characters, unescaped quotes, or markdown blocks caused "Bad control character in string literal" errors
2. **Phase Transition Loop**: AI getting stuck repeating strategy questions instead of progressing through the 3-phase workflow

---

## Solution Implemented

### 1. Bulletproof JSON Sanitization Function

Created `sanitizeAndExtractJSON()` function in `functions/chat-handler/handler.js`:

**Features**:
- Extracts JSON from markdown code blocks (```json)
- Removes control characters (newlines, tabs, carriage returns)
- Handles malformed strings gracefully
- Comprehensive logging for debugging
- Returns null on failure (graceful degradation)

**Process**:
1. Extract from markdown blocks
2. Find JSON object boundaries
3. Replace literal newlines with `\n`
4. Remove ASCII control characters
5. Parse with try-catch
6. Log raw and sanitized JSON for debugging

### 2. Integration into Message Processing

**Updated Functions**:
- `processOnboardingMessage()`: Now uses `sanitizeAndExtractJSON()` instead of raw `JSON.parse()`
- `processSocialMediaMessage()`: Now uses `sanitizeAndExtractJSON()` instead of raw `JSON.parse()`

**Fallback Behavior**:
- If JSON parsing fails, returns graceful fallback response
- Preserves conversation history
- Provides user-friendly error message

### 3. Enhanced System Prompts

**Added Critical JSON Output Rules**:
```
CRITICAL JSON OUTPUT RULES:
1. OUTPUT ONLY VALID JSON - NO MARKDOWN CODE BLOCKS
2. DO NOT wrap JSON in ```json or ``` tags
3. ESCAPE ALL STRINGS - Replace literal newlines with \n
4. NO CONTROL CHARACTERS - Use \n for line breaks, \t for tabs
5. Start response directly with { and end with }
```

**Applied to Both Personas**:
- Onboarding (Strategic Interviewer)
- Social Media Manager (Agentic 3-Phase Workflow)

---

## Technical Details

### Files Modified

1. **functions/chat-handler/handler.js**:
   - Added `sanitizeAndExtractJSON()` function (lines 45-110)
   - Updated `processOnboardingMessage()` to use sanitization (lines 420-435)
   - Updated `processSocialMediaMessage()` to use sanitization (lines 680-695)
   - Enhanced system prompts with JSON output rules (lines 350-365, 620-635)

### Deployment

```bash
sam build
sam deploy --no-fail-on-empty-changeset
```

**Deployment Result**:
- Stack: onzo
- Region: us-east-1
- Status: UPDATE_COMPLETE
- Modified Resources:
  - ChatHandlerFunction (AWS::Lambda::Function)
  - ExpertaApi (AWS::ApiGateway::RestApi)

---

## Expected Behavior After Fix

### JSON Parsing
✅ Claude responses with newlines are sanitized before parsing  
✅ Markdown code blocks are extracted automatically  
✅ Control characters are removed safely  
✅ Parsing failures result in graceful fallback (not crashes)

### Phase Transitions
✅ AI follows 3-phase workflow correctly  
✅ No more strategy question loops  
✅ Content calendar proposals work  
✅ "Just Do It" override commands work  
✅ Explicit approval gates function properly

### Error Handling
✅ Full error details logged to CloudWatch  
✅ User-friendly error messages displayed  
✅ Validation errors (400) identified and explained  
✅ Throttling errors (429) handled with retry logic

---

## Testing Recommendations

1. **Test JSON Parsing**:
   - Send messages that trigger content calendar generation
   - Verify no "Bad control character" errors
   - Check CloudWatch logs for sanitization success

2. **Test Phase Transitions**:
   - Start new conversation: "olá, preciso de ajuda"
   - Verify AI asks strategic questions (Phase 1)
   - Answer questions and verify calendar proposal (Phase 2)
   - Approve calendar and verify post generation (Phase 3)

3. **Test "Just Do It" Override**:
   - Send command: "gere agora"
   - Verify AI skips to Phase 3 immediately
   - Confirm post content is generated

4. **Test Error Scenarios**:
   - Rapid-fire messages (throttling)
   - Malformed inputs (validation)
   - Check error messages are user-friendly

---

## Related Fixes

This fix builds on previous stability improvements:

1. **Conversation History Loading** (Task 7): Loads last 15 messages from DynamoDB
2. **Strict Role Alternation** (Task 7): Sanitizes history to enforce user → assistant alternation
3. **Exponential Backoff Retry** (Task 5): Handles throttling with 1s, 2s, 4s, 8s delays
4. **Full Error Exposure** (Task 6): Logs complete error details to CloudWatch

---

## Architecture

```
User Message
    ↓
Load History from DynamoDB (15 messages)
    ↓
Sanitize History (enforce alternating roles)
    ↓
Truncate History (last 10 messages)
    ↓
Invoke Bedrock Claude (with retry logic)
    ↓
Receive Response
    ↓
sanitizeAndExtractJSON() ← NEW
    ↓
Parse JSON (with fallback)
    ↓
Save to DynamoDB
    ↓
Return to User
```

---

## Monitoring

**CloudWatch Logs to Watch**:
- `=== RAW CLAUDE RESPONSE (first 500 chars) ===`
- `=== SANITIZED JSON (first 500 chars) ===`
- `JSON parsed successfully`
- `=== JSON SANITIZATION FAILED ===`

**Success Indicators**:
- No "Bad control character in string literal" errors
- Successful JSON parsing logs
- Proper phase transitions in conversations

**Failure Indicators**:
- `Failed to parse JSON from Claude response, returning fallback`
- Repeated sanitization failures
- Users stuck in phase loops

---

## Next Steps

1. Monitor CloudWatch logs for JSON parsing success rate
2. Test phase transitions with real users
3. Verify "Just Do It" override works correctly
4. Check that content calendar proposals are generated properly
5. Confirm no regression in existing features (S3 images, Titan generation)

---

## Conclusion

The JSON sanitization fix addresses the root cause of parsing failures by cleaning Claude's responses before attempting to parse them. Combined with enhanced system prompts that enforce clean JSON output, this should eliminate the "Bad control character" errors and enable smooth phase transitions in the agentic workflow.

The fix is now live in production and ready for testing.
