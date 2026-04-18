import { useState, useEffect, useRef } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/chat/PostCard';
import LoadingIndicator from '../components/chat/LoadingIndicator';
import ContentPlanCard from '../components/chat/ContentPlanCard';
import PostContentCard from '../components/chat/PostContentCard';

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Changed to object for detailed errors
  const [debugInfo, setDebugInfo] = useState(null);
  const [notification, setNotification] = useState(null); // For button feedback
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Load chat history on mount
    const loadChatHistory = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        if (!token) {
          console.log('No token available, skipping history load');
          // Show initial greeting if no history
          setMessages([
            {
              role: 'assistant',
              content: "Connection established! I'm ONZO. How can I help you today?",
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }

        const response = await fetch(`${API_URL}/chat/history`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.history && data.history.length > 0) {
            // Load existing history
            const historyMessages = data.history.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
              image_url: msg.image_url || null, // Include image URL from metadata
            }));
            setMessages(historyMessages);
            console.log('Chat history loaded:', data.history.length, 'messages');
          } else {
            // No history, show initial greeting
            setMessages([
              {
                role: 'assistant',
                content: "Connection established! I'm ONZO. How can I help you today?",
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        } else {
          console.error('Failed to load chat history:', response.status);
          // Show initial greeting on error
          setMessages([
            {
              role: 'assistant',
              content: "Connection established! I'm ONZO. How can I help you today?",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Show initial greeting on error
        setMessages([
          {
            role: 'assistant',
            content: "Connection established! I'm ONZO. How can I help you today?",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    loadChatHistory();
  }, [API_URL]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    // Save the input before clearing it
    const messageText = input;

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Get Cognito token
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Build conversation history (exclude the initial greeting and system messages)
      const conversationHistory = messages
        .filter(msg => msg.role !== 'system')
        .slice(1) // Skip the initial greeting
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Debug logging removed for production

      // Send message to backend with conversation history
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
          conversation_history: conversationHistory,
        }),
      });

      // Debug logging removed for production

      // CRITICAL: Always read the response body, even on error
      let responseData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const textData = await response.text();
          responseData = { message: textData };
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        responseData = { message: 'Failed to parse server response' };
      }

      // Check if response is not OK
      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || `HTTP ${response.status}: ${response.statusText}`;
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          fullResponse: responseData,
          headers: Object.fromEntries(response.headers.entries()),
          url: `${API_URL}/chat`,
        };

        console.error('=== API ERROR ===', errorDetails);
        
        // Store debug info for display
        setDebugInfo(errorDetails);
        
        throw new Error(errorMessage);
      }

      // Success - process response

      // Check for throttling response
      if (responseData.throttling_detected || responseData.response_type === 'throttling_error') {
        // Show user-friendly throttling notification
        showNotification('⏳ Too many requests - please wait a moment and try again', 'warning');
        
        // Add throttling message to chat
        const throttlingMessage = {
          role: 'assistant',
          content: responseData.response || responseData.conversational_response || 'A minha criatividade está a recarregar! Como estamos a usar a infraestrutura de alta velocidade da AWS, preciso de 30 segundos de pausa entre pedidos rápidos. Pode aguardar um momento e tentar de novo?',
          timestamp: new Date().toISOString(),
          isThrottling: true,
        };

        setMessages((prev) => [...prev, throttlingMessage]);
        return; // Don't process further
      }

      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: responseData.response || responseData.message || 'No response from AI',
        timestamp: new Date().toISOString(),
        image_url: responseData.image_url || null, // Include image URL if available
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Handle invisible onboarding data if present
      if (responseData.extracted_entities || responseData.onboarding_complete !== undefined) {
        // Onboarding data processed silently
      }
    } catch (err) {
      console.error('=== CHAT ERROR ===', err);
      console.error('Error Stack:', err.stack);
      
      const errorObj = {
        message: err.message || 'Unknown error occurred',
        type: err.name || 'Error',
        timestamp: new Date().toISOString(),
      };
      
      setError(errorObj);
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `❌ Error: ${err.message}`,
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Button handlers with visual feedback
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUploadAssets = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      showNotification('❌ Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('❌ File size must be less than 5MB', 'error');
      return;
    }

    showNotification(`📎 Uploading ${file.name}...`, 'info');
    
    // TODO: Implement actual file upload to S3
    // For now, just show success message
    setTimeout(() => {
      showNotification(`✅ ${file.name} uploaded successfully!`, 'success');
      setInput(prev => prev + `\n[Image: ${file.name}]`);
    }, 1000);
  };

  const handleBrandKit = () => {
    setIsToolMenuOpen(!isToolMenuOpen);
  };

  // Mock action handlers for PostCard
  const handlePublishPost = () => {
    showNotification('📤 Mock Action: Post saved locally. Meta API integration coming in V2.', 'success');
  };

  const handleSchedulePost = () => {
    showNotification('📅 Mock Action: Scheduling feature coming in V2. Post saved locally.', 'success');
  };

  // Detect if message contains a generated post
  const isGeneratedPost = (message) => {
    return message.image_url && (
      message.content.includes('📝 LEGENDA') || 
      message.content.includes('🎨 DESCRIÇÃO DA IMAGEM')
    );
  };

  // Detect and parse plan data from message
  const parsePlanData = (message) => {
    try {
      // Check if message contains JSON with plan data
      const content = message.content;
      
      // Try to find JSON in the message
      let jsonMatch = content.match(/\{[\s\S]*"response_type"\s*:\s*"plan"[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Try to extract from markdown code blocks
        jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonMatch = [jsonMatch[1]];
        }
      }
      
      if (!jsonMatch) {
        // Try to find any JSON object
        jsonMatch = content.match(/\{[\s\S]*"plan_data"[\s\S]*\}/);
      }
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.response_type === 'plan' && parsed.plan_data && Array.isArray(parsed.plan_data)) {
          return parsed.plan_data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to parse plan data:', error);
      return null;
    }
  };

  // Detect and parse post content data from message
  const parsePostContentData = (message) => {
    try {
      // Check if message contains JSON with post_content data
      const content = message.content;
      
      // Try to find JSON in the message
      let jsonMatch = content.match(/\{[\s\S]*"response_type"\s*:\s*"post_content"[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Try to extract from markdown code blocks
        jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonMatch = [jsonMatch[1]];
        }
      }
      
      if (!jsonMatch) {
        // Try to find any JSON object with post_content
        jsonMatch = content.match(/\{[\s\S]*"post_content"[\s\S]*\}/);
      }
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.response_type === 'post_content' && parsed.post_content) {
          return {
            conversational_response: parsed.conversational_response,
            post_content: parsed.post_content
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to parse post content data:', error);
      return null;
    }
  };

  // Handle image generation
  const handleGenerateImage = async (imageDescription, messageIndex) => {
    try {
      showNotification('🎨 Generating image...', 'info');
      
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_URL}/chat/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          image_description: imageDescription,
          silent_mode: true  // Don't save to chat history
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.image_url) {
        showNotification('✅ Image generated successfully!', 'success');
        
        // Update the message with the generated image URL
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          if (messageIndex !== undefined && updatedMessages[messageIndex]) {
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              image_url: data.image_url
            };
          }
          return updatedMessages;
        });
        
        return data.image_url;
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      showNotification('❌ Failed to generate image: ' + error.message, 'error');
      throw error;
    }
  };

  // Extract clean conversational response from JSON if present
  const extractConversationalResponse = (content) => {
    try {
      // Try to parse as JSON
      let jsonMatch = content.match(/\{[\s\S]*"response_type"\s*:\s*"chat"[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Try to extract from markdown code blocks
        jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonMatch = [jsonMatch[1]];
        }
      }
      
      if (!jsonMatch) {
        // Try to find any JSON object with response_type
        jsonMatch = content.match(/\{[\s\S]*"response_type"[\s\S]*\}/);
      }
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // If it's a chat response, extract only the conversational_response
        if (parsed.response_type === 'chat' && parsed.conversational_response) {
          return parsed.conversational_response;
        }
      }
      
      // If not JSON or not parseable, return original content
      return content;
    } catch (error) {
      // If parsing fails, return original content
      return content;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Fixed Header - Compact SaaS Style */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div>
                <h1 className="text-base font-bold text-gray-900">experta</h1>
                <p className="text-xs text-gray-500">{user?.email || 'Connected'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-green-50 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable with padding for fixed header/footer */}
      <div className="flex-1 overflow-y-auto px-4 py-3 mt-12 pb-40">
        <div className="max-w-4xl mx-auto space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* User Message Bubble - Right aligned with gradient */}
              {message.role === 'user' && (
                <div className="max-w-2xl">
                  <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl rounded-br-md shadow-lg">
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className="text-xs mt-2 text-gray-300 opacity-80">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}

              {/* AI (Onzo) Message Bubble - Left aligned with shadow */}
              {message.role === 'assistant' && !message.isError && (
                <div className="max-w-2xl w-full">
                  {/* Check if this is a throttling message */}
                  {message.isThrottling && (
                    <div className="bg-yellow-50 text-yellow-900 px-4 py-3 rounded-2xl rounded-bl-md shadow-md border-2 border-yellow-200">
                      <div className="flex items-center mb-2">
                        <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold text-yellow-800">Rate Limited</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
                      <p className="text-xs mt-2 text-yellow-600">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                  
                  {/* Regular AI messages */}
                  {!message.isThrottling && (() => {
                    // Check for plan data first
                    const planData = parsePlanData(message);
                    if (planData) {
                      return (
                        <ContentPlanCard 
                          planData={planData}
                        />
                      );
                    }
                    
                    // Check for post content data
                    const postContentData = parsePostContentData(message);
                    if (postContentData) {
                      return (
                        <div className="space-y-3">
                          {/* Conversational response bubble */}
                          <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md shadow-md border border-gray-100">
                            <p className="whitespace-pre-wrap leading-relaxed text-sm">
                              {postContentData.conversational_response || 'Aqui está o seu post!'}
                            </p>
                            <p className="text-xs mt-1 text-gray-400">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {/* Post content card */}
                          <PostContentCard 
                            postContent={postContentData.post_content}
                            imageUrl={message.image_url}
                            onGenerateImage={(imageDescription) => handleGenerateImage(imageDescription, index)}
                          />
                        </div>
                      );
                    }
                    
                    // Check if this is a generated post (legacy format)
                    if (isGeneratedPost(message)) {
                      return (
                        <PostCard 
                          content={message.content}
                          imageUrl={message.image_url}
                          onPublish={handlePublishPost}
                          onSchedule={handleSchedulePost}
                        />
                      );
                    }
                    
                    // Default chat message
                    return (
                      <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md shadow-md border border-gray-100">
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">
                          {extractConversationalResponse(message.content)}
                        </p>
                        
                        {/* Render generated image if present but not a full post */}
                        {message.image_url && (
                          <div className="mt-3">
                            <img 
                              src={message.image_url} 
                              alt="Generated Post Image" 
                              className="rounded-lg shadow-lg w-full max-w-md border-2 border-gray-200 hover:border-gray-400 transition-colors"
                            />
                          </div>
                        )}
                        
                        <p className="text-xs mt-1 text-gray-400">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Error Message Bubble */}
              {(message.role === 'system' || message.isError) && (
                <div className="max-w-2xl">
                  <div className="bg-red-50 text-red-900 px-4 py-2 rounded-2xl rounded-bl-md shadow-md border-2 border-red-200">
                    {message.isError && (
                      <div className="flex items-center mb-1">
                        <svg className="h-4 w-4 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold text-red-700">ERROR</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
                    <p className="text-xs mt-1 text-red-600">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area - Modern SaaS Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 relative">
          {/* Brand Kit Popover Menu */}
          {isToolMenuOpen && (
            <div className="absolute bottom-full left-4 mb-2 bg-white rounded-xl shadow-xl border-2 border-gray-200 p-3 w-64 z-20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">🎨 Brand Kit</h3>
                <button
                  onClick={() => setIsToolMenuOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    showNotification('🎨 Brand colors coming in V2', 'info');
                    setIsToolMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Brand Colors
                </button>
                <button
                  onClick={() => {
                    showNotification('👤 Profile settings coming in V2', 'info');
                    setIsToolMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    showNotification('✨ Visual style coming in V2', 'info');
                    setIsToolMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Visual Style
                </button>
              </div>
            </div>
          )}

          {/* Notification Toast */}
          {notification && (
            <div className={`mb-3 p-2 rounded-xl shadow-lg border-2 animate-slide-up ${
              notification.type === 'info' ? 'bg-blue-50 border-blue-300 text-blue-800' :
              notification.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' :
              notification.type === 'error' ? 'bg-red-50 border-red-300 text-red-800' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' :
              'bg-gray-50 border-gray-300 text-gray-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{notification.message}</span>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-4 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Error Alert Box */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border-2 border-red-300 rounded-xl shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-bold text-red-800 mb-1">
                    API Error Detected
                  </h3>
                  <p className="text-sm text-red-700 font-medium mb-2">
                    {error.message}
                  </p>
                  {debugInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800 font-semibold">
                        🔍 Show Debug Information
                      </summary>
                      <div className="mt-2 p-3 bg-red-100 rounded-lg border border-red-300 text-xs font-mono">
                        <div className="space-y-1">
                          <div><strong>Status:</strong> {debugInfo.status} {debugInfo.statusText}</div>
                          <div><strong>URL:</strong> {debugInfo.url}</div>
                          <div><strong>Timestamp:</strong> {error.timestamp}</div>
                          {debugInfo.fullResponse && (
                            <div>
                              <strong>Full Response:</strong>
                              <pre className="mt-1 p-2 bg-white rounded overflow-x-auto">
                                {JSON.stringify(debugInfo.fullResponse, null, 2)}
                              </pre>
                            </div>
                          )}
                          {debugInfo.headers && (
                            <div>
                              <strong>Response Headers:</strong>
                              <pre className="mt-1 p-2 bg-white rounded overflow-x-auto">
                                {JSON.stringify(debugInfo.headers, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  )}
                  <button
                    onClick={() => {
                      setError(null);
                      setDebugInfo(null);
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 font-semibold underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Professional Input Container with Toolbar - Premium SaaS Style */}
          <div className="bg-white rounded-full border border-gray-200 shadow-sm hover:border-gray-300 transition-all">
            {/* Main Input Area with Integrated Toolbar */}
            <div className="flex items-end gap-3 px-6 py-3">
              {/* Left Toolbar - Asset & Brand Actions */}
              <div className="flex items-center gap-2">
                {/* Upload Assets Button (Paperclip) */}
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all"
                  title="Upload brand assets"
                  onClick={handleUploadAssets}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                {/* Brand Kit Settings Button (Color Palette) */}
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all"
                  title="Brand kit settings"
                  onClick={handleBrandKit}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </button>
              </div>

              {/* Text Input Area */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows="1"
                disabled={loading}
                className="flex-1 px-0 py-0 border-0 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-sm text-gray-900 placeholder-gray-400"
              />

              {/* Right Toolbar - Send Action */}
              <div className="flex items-center gap-2">
                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  title="Send message"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
