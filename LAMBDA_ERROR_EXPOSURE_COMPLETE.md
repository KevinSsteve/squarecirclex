# Lambda Error Exposure Enhancement - COMPLETE ✅

## Overview
Modified the chat-handler Lambda to expose actual error details from Bedrock, DynamoDB, and other AWS services to the frontend for debugging.

## Problem Solved
**Before**: Generic fallback messages like "I'm having trouble..." masked the root cause of errors.

**After**: Full error details including message, code, and stack trace are logged to CloudWatch and exposed to the frontend.

## Changes Made

### 1. Enhanced Error Logging in `processOnboardingMessage()`
```javascript
} catch (error) {
  // CRITICAL: Log full error details to CloudWatch
  console.error('=== ONBOARDING MESSAGE ERROR ===');
  console.error('Error Message:', error.message);
  console.error('Error Code:', error.code);
  console.error('Error Name:', error.name);
  console.error('Error Stack:', error.stack);
  console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
  
  ErrorHandler.logError(error, { operation: 'processOnboardingMessage' });
  
  // Return fallback response with detailed error info for debugging
  return {
    extracted_entities: {},
    conversational_response: "I'm having trouble processing that right now. Could you tell me about your business?",
    business_type: null,
    show_upload_button: false,
    onboarding_complete: false,
    conversationHistory: conversationHistory,
    error: error.message,
    debug_info: {
      message: error.message,
      code: error.code || error.name,
      stack: error.stack,
      operation: 'processOnboardingMessage'
    }
  };
}
```

### 2. Enhanced Error Logging in `processMessageWithClaude()`
```javascript
} catch (error) {
  // CRITICAL: Log full error details to CloudWatch
  console.error('=== PROCESS MESSAGE WITH CLAUDE ERROR ===');
  console.error('Error Message:', error.message);
  console.error('Error Code:', error.code);
  console.error('Error Name:', error.name);
  console.error('Error Stack:', error.stack);
  console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
  
  ErrorHandler.logError(error, { operation: 'processMessageWithClaude' });
  
  // Return fallback with detailed error info
  return {
    intent: 'query',
    parameters: {},
    response_text: "I'm having trouble processing that request. Could you try rephrasing it?",
    conversationHistory: conversationHistory,
    error: error.message,
    debug_info: {
      message: error.message,
      code: error.code || error.name,
      stack: error.stack,
      operation: 'processMessageWithClaude'
    }
  };
}
```

### 3. Enhanced Error Exposure in Action Handler
```javascript
// Return error in conversational format with debug info
return ErrorHandler.formatSuccessResponse({
  response: `I encountered an error: ${actionError.message}. Please try again or rephrase your request.`,
  mode: 'social_media_manager',
  action_taken: null,
  affected_post_id: null,
  conversation_history: intentResult.conversationHistory,
  error: actionError.message,
  debug_info: {
    message: actionError.message,
    code: actionError.code || actionError.name,
    stack: actionError.stack,
    operation: 'executeAction',
    intent: intentResult.intent
  }
});
```

## What Gets Exposed

### To CloudWatch Logs
Every error now logs:
- ✅ Error message
- ✅ Error code (if available)
- ✅ Error name (e.g., "AccessDeniedException")
- ✅ Full stack trace
- ✅ Complete error object (all properties)
- ✅ Operation context

### To Frontend (via API Response)
The response includes a `debug_info` object:
```json
{
  "response": "I'm having trouble...",
  "error": "AccessDeniedException: You don't have access...",
  "debug_info": {
    "message": "AccessDeniedException: You don't have access to the model",
    "code": "AccessDeniedException",
    "stack": "Error: AccessDeniedException\n    at BedrockClient...",
    "operation": "processOnboardingMessage"
  }
}
```

## Error Types Now Visible

### 1. Bedrock API Errors
- AccessDeniedException
- ThrottlingException
- ValidationException
- ModelNotFoundException
- ServiceQuotaExceededException

### 2. DynamoDB Errors
- ResourceNotFoundException
- ConditionalCheckFailedException
- ProvisionedThroughputExceededException
- ValidationException

### 3. S3 Errors
- NoSuchBucket
- AccessDenied
- InvalidObjectState

### 4. General AWS SDK Errors
- NetworkingError
- TimeoutError
- CredentialsError

## Testing Instructions

### 1. Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/onzo-chat-handler-dev --follow
```

Look for:
```
=== ONBOARDING MESSAGE ERROR ===
Error Message: AccessDeniedException: You don't have access to the model...
Error Code: AccessDeniedException
Error Name: AccessDeniedException
Error Stack: Error: AccessDeniedException
    at BedrockRuntimeClient...
Full Error Object: {"message":"...","code":"AccessDeniedException",...}
```

### 2. Check Frontend Network Tab
1. Open browser DevTools → Network tab
2. Send a message in chat
3. Click on the `/chat` request
4. Go to "Response" tab
5. Look for `debug_info` object

Expected:
```json
{
  "response": "I'm having trouble...",
  "debug_info": {
    "message": "AccessDeniedException: ...",
    "code": "AccessDeniedException",
    "stack": "Error: AccessDeniedException\n    at ...",
    "operation": "processOnboardingMessage"
  }
}
```

### 3. Check Frontend Error Alert
The enhanced ChatPage.jsx will display the debug_info in the red alert box under "Show Debug Information".

## Deployment Details
- **Stack**: onzo
- **Region**: us-east-1
- **Function**: onzo-chat-handler-dev
- **Deployment Method**: `sam build && sam deploy --force-upload --no-confirm-changeset`
- **Status**: ✅ Successfully deployed

## Benefits

### For Debugging
- See exact Bedrock error codes (e.g., AccessDeniedException)
- Identify which operation failed
- Get full stack traces for troubleshooting
- Understand AWS SDK error details

### For Development
- No more guessing what went wrong
- Clear error messages in both CloudWatch and browser
- Stack traces point to exact line of failure
- Error codes help identify permission issues

### For Support
- Users can share debug_info from error alert
- CloudWatch logs have complete error context
- Error codes help identify AWS service issues
- Operation context shows where in the flow it failed

## Example Error Scenarios

### Scenario 1: Bedrock Access Denied
**CloudWatch Log**:
```
=== ONBOARDING MESSAGE ERROR ===
Error Message: AccessDeniedException: You don't have access to the model with the specified model ID.
Error Code: AccessDeniedException
```

**Frontend Response**:
```json
{
  "debug_info": {
    "message": "AccessDeniedException: You don't have access to the model...",
    "code": "AccessDeniedException",
    "operation": "processOnboardingMessage"
  }
}
```

### Scenario 2: DynamoDB Table Not Found
**CloudWatch Log**:
```
=== PROCESS MESSAGE WITH CLAUDE ERROR ===
Error Message: ResourceNotFoundException: Requested resource not found
Error Code: ResourceNotFoundException
```

**Frontend Response**:
```json
{
  "debug_info": {
    "message": "ResourceNotFoundException: Requested resource not found",
    "code": "ResourceNotFoundException",
    "operation": "processMessageWithClaude"
  }
}
```

## Files Modified
- `functions/chat-handler/handler.js` - Added comprehensive error logging and debug_info exposure

## Next Steps
1. Test the chat interface and trigger an error
2. Check CloudWatch logs for detailed error information
3. Inspect the Network tab in browser DevTools
4. Verify the error alert shows debug_info
5. Use the error details to diagnose the root cause

## Status: DEPLOYED ✅
The Lambda now exposes full error details to both CloudWatch and the frontend. No more silent failures or generic error messages.
