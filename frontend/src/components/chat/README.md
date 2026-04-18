# Chat Components

This directory contains the chat sidebar components for the Experta AI Social Media Manager.

## Components

### ChatSidebar
The main chat sidebar component that provides a persistent conversational interface with Experta AI.

**Features:**
- Persistent sidebar layout (sticky on desktop, toggleable on mobile)
- Message history display
- Auto-scroll to latest messages
- Typing indicators
- Welcome message for empty state

**Props:**
- `onSendMessage`: Function called when user sends a message
- `isTyping`: Boolean indicating if AI is typing
- `messages`: Array of message objects with `{ role, content, timestamp }`

### MessageBubble
Individual message bubble component for displaying user and assistant messages.

**Features:**
- Different styling for user vs assistant messages
- Avatar icons
- Timestamp display
- Text wrapping and formatting

**Props:**
- `message`: The message text content
- `role`: Either 'user' or 'assistant'
- `timestamp`: ISO timestamp string (optional)

### ChatInput
Text input component with send button for composing messages.

**Features:**
- Auto-resizing textarea
- Enter to send, Shift+Enter for new line
- Character counter
- Disabled state during AI response
- Send button with icon

**Props:**
- `onSend`: Function called with message text when user sends
- `disabled`: Boolean to disable input during AI response

### TypingIndicator
Animated typing indicator shown when AI is composing a response.

**Features:**
- Three-dot bouncing animation
- Consistent styling with assistant messages
- Avatar icon

## Usage Example

```jsx
import { ChatSidebar } from './components/chat';

function App() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (message) => {
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }]);

    // Show typing indicator
    setIsTyping(true);

    // Call API
    const response = await api.sendChatMessage({ message });

    // Add assistant response
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response.data.response,
      timestamp: new Date().toISOString()
    }]);

    setIsTyping(false);
  };

  return (
    <ChatSidebar
      messages={messages}
      isTyping={isTyping}
      onSendMessage={handleSendMessage}
    />
  );
}
```

## Styling

All components use Tailwind CSS for styling with:
- Responsive design (mobile-first)
- Smooth animations and transitions
- Accessible color contrast
- Focus states for keyboard navigation

## Requirements Validation

These components satisfy:
- **Requirement 8.1**: Persistent chat sidebar with Experta
- **Requirement 8.2**: Message processing and display
