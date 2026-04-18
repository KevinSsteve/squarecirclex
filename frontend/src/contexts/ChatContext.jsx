import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../config/api';
import { useDashboard } from './DashboardContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const { triggerRefresh } = useDashboard();

  // Send a message to the chat API
  const sendMessage = useCallback(async (messageText) => {
    try {
      setError(null);
      
      // Add user message to conversation
      const userMessage = {
        role: 'user',
        content: messageText,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      // Prepare conversation history for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call chat API
      const response = await api.sendChatMessage({
        message: messageText,
        conversation_history: conversationHistory,
      });

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        action_taken: response.data.action_taken,
        affected_post_id: response.data.affected_post_id,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If an action was taken that affects posts, trigger dashboard refresh
      if (response.data.action_taken && 
          ['create_post', 'modify_post', 'delete_post'].includes(response.data.action_taken)) {
        // Add a small delay to allow backend to complete the action
        setTimeout(() => {
          triggerRefresh();
        }, 500);
      }

      return assistantMessage;
    } catch (err) {
      console.error('Error sending chat message:', err);
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${err.message || 'Unable to process your request'}. Please try again.`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(err.message || 'Failed to send message');
      
      throw err;
    } finally {
      setIsTyping(false);
    }
  }, [messages, triggerRefresh]);

  // Clear conversation history
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Add a system message (for action confirmations)
  const addSystemMessage = useCallback((content) => {
    const systemMessage = {
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      isSystem: true,
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  const value = {
    messages,
    isTyping,
    error,
    sendMessage,
    clearMessages,
    addSystemMessage,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
