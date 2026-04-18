# Deploy Chat Persistence - Quick Guide

## What Was Implemented

✅ **Full Chat Persistence System**

### Infrastructure
- OnzoChatHistory DynamoDB table (user_id + timestamp)
- 90-day TTL for automatic cleanup
- Pay-per-request billing

### Backend
- ChatHistoryDataAccess data layer
- Automatic message saving (user + assistant)
- GET /chat/history endpoint
- Graceful error handling

### Frontend
- History loading on page mount
- Fallback to greeting if no history
- Seamless user experience

## Deploy Now

```bash
sam build && sam deploy
```

## What Changed

### Files Created
- ✅ `lib/nodejs/db/chat-history.js` - Data access layer
- ✅ `CHAT_PERSISTENCE_IMPLEMENTATION.md` - Full documentation
- ✅ `scripts/deploy-chat-persistence.ps1` - Deployment script

### Files Modified
- ✅ `template.yaml` - Added OnzoChatHistoryTable + GET endpoint
- ✅ `functions/chat-handler/handler.js` - Save messages + GET handler
- ✅ `frontend/src/config/api.js` - Added getChatHistory()
- ✅ `frontend/src/pages/ChatPage.jsx` - Load history on mount

## Test After Deploy

### Test 1: First Message
```
1. Open chat page
2. Send: "Hello Onzo"
3. Reload page
4. Verify: Message still there ✅
```

### Test 2: Conversation
```
1. Send multiple messages
2. Close browser
3. Reopen chat page
4. Verify: Full conversation restored ✅
```

### Test 3: API Endpoint
```bash
curl -H "Authorization: Bearer <token>" \
     https://your-api.com/chat/history
```

Expected response:
```json
{
  "history": [
    {
      "user_id": "...",
      "timestamp": "2024-...",
      "role": "user",
      "content": "Hello Onzo"
    },
    {
      "user_id": "...",
      "timestamp": "2024-...",
      "role": "assistant",
      "content": "Hello! How can I help?"
    }
  ],
  "count": 2
}
```

## Verify Deployment

### 1. Check DynamoDB Table
```bash
aws dynamodb describe-table \
    --table-name <stack-name>-OnzoChatHistory-dev
```

### 2. Check Lambda Environment
```bash
aws lambda get-function-configuration \
    --function-name <stack-name>-chat-handler-dev \
    --query 'Environment.Variables.CHAT_HISTORY_TABLE_NAME'
```

### 3. Test GET Endpoint
```bash
# Get API URL from outputs
aws cloudformation describe-stacks \
    --stack-name <stack-name> \
    --query 'Stacks[0].Outputs'
```

## How It Works

### Message Flow
```
User sends message
    ↓
Handler processes
    ↓
Generates response
    ↓
Saves user message to DynamoDB
    ↓
Saves assistant response to DynamoDB
    ↓
Returns response
```

### History Load
```
Page loads
    ↓
Calls GET /chat/history
    ↓
Retrieves last 20 messages
    ↓
Displays in chat
```

## Benefits

### User Experience
- ✅ Conversation continuity
- ✅ No repeated information
- ✅ Context preserved
- ✅ Professional feel

### System
- ✅ Audit trail
- ✅ Debugging capability
- ✅ Analytics data
- ✅ Compliance

## Monitoring

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/chat-handler --follow
```

Look for:
- `INFO: Chat history saved`
- `INFO: Chat history retrieved`

### DynamoDB
```bash
aws dynamodb scan \
    --table-name <stack-name>-OnzoChatHistory-dev \
    --limit 5
```

## Rollback (If Needed)

```bash
# Revert changes
git checkout HEAD -- template.yaml
git checkout HEAD -- functions/chat-handler/handler.js
git checkout HEAD -- frontend/src/pages/ChatPage.jsx

# Redeploy
sam build && sam deploy
```

## Status

- [x] Infrastructure code ready
- [x] Backend implementation complete
- [x] Frontend integration done
- [x] Documentation created
- [ ] Build and deploy pending

## Next Step

Run: `sam build && sam deploy`

Then test by:
1. Sending a message
2. Reloading the page
3. Verifying the message persists

## Success Criteria

- ✅ Messages persist across reloads
- ✅ History loads automatically
- ✅ No errors in CloudWatch
- ✅ DynamoDB contains messages
- ✅ User experience is seamless

The chat persistence feature is ready to deploy!
