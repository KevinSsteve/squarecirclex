# Chat Context

The ChatContext provides state management and API integration for the chat functionality in the Experta AI Social Media Manager.

## Overview

The ChatContext manages:
- Conversation history (messages array)
- Typing state (when AI is responding)
- Error handling
- API communication with the chat backend
- Dashboard refresh triggers after chat actions

## Usage

### Setup

Wrap your application with the ChatProvider:

```jsx
import { ChatProvider } from './contexts/ChatContext';

function App() {
  return (
    <ChatProvider>
      {/* Your app components */}
    </ChatProvider>
  );
}
```

### Using the Hook

```jsx
import { useChat } from './contexts/ChatContext';

function ChatComponent() {
  const { 
    messages, 
    isTyping, 
    error, 
    sendMessage, 
    clearMessages,
    addSystemMessage 
  } = useChat();

  const handleSend = async (text) => {
    try {
      await sendMessage(text);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.content}</div>
      ))}
      {isTyping && <div>AI is typing...</div>}
    </div>
  );
}
```

## API

### State

- `messages`: Array of message objects
  - `role`: 'user' | 'assistant'
  - `content`: Message text
  - `timestamp`: ISO timestamp string
  - `action_taken`: (optional) Action performed by AI
  - `affected_post_id`: (optional) ID of affected post
  - `isError`: (optional) Boolean indicating error message
  - `isSystem`: (optional) Boolean indicating system message

- `isTyping`: Boolean indicating if AI is composing response

- `error`: String error message or null

### Methods

#### `sendMessage(messageText: string): Promise<Message>`

Sends a message to the chat API and updates conversation history.

**Behavior:**
1. Adds user message to conversation
2. Shows typing indicator
3. Calls backend API with message and conversation history
4. Adds assistant response to conversation
5. Triggers dashboard refresh if action affects posts
6. Handles errors gracefully

**Parameters:**
- `messageText`: The user's message text

**Returns:**
- Promise resolving to the assistant's message object

**Throws:**
- Error if API call fails (error is also added to messages)

#### `clearMessages(): void`

Clears all messages from the conversation history.

#### `addSystemMessage(content: string): void`

Adds a system message to the conversation (for action confirmations).

**Parameters:**
- `content`: The system message text

## Integration with Dashboard

The ChatContext automatically triggers dashboard refreshes when chat actions affect posts:

- `create_post`: New post created
- `modify_post`: Existing post updated
- `delete_post`: Post deleted

A 500ms delay is added to allow the backend to complete the action before refreshing.

## Error Handling

Errors are handled gracefully:
1. Error is logged to console
2. Error message is added to chat as assistant message
3. Error state is set for UI feedback
4. Typing indicator is cleared

## Message Format

### User Message
```json
{
  "role": "user",
  "content": "Create a post about our new product launch",
  "timestamp": "2024-02-13T10:30:00.000Z"
}
```

### Assistant Message
```json
{
  "role": "assistant",
  "content": "I've created a post about your new product launch...",
  "timestamp": "2024-02-13T10:30:05.000Z",
  "action_taken": "create_post",
  "affected_post_id": "uuid-here"
}
```

### Error Message
```json
{
  "role": "assistant",
  "content": "I'm sorry, I encountered an error: Network error",
  "timestamp": "2024-02-13T10:30:05.000Z",
  "isError": true
}
```

## Requirements Validation

This context satisfies:
- **Requirement 8.2**: Message processing using Claude 3.5 Sonnet
- **Requirement 8.3**: Create post action handling
- **Requirement 8.4**: Modify post action handling
- **Requirement 8.5**: Delete post action handling
- **Requirement 8.6**: Dashboard refresh after chat actions

## Dependencies

- `api.sendChatMessage`: Backend API method for chat
- `useDashboard`: Dashboard context for refresh triggers
