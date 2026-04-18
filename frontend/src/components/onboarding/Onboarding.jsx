import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageBubble from '../chat/MessageBubble';
import TypingIndicator from '../chat/TypingIndicator';
import OnboardingInput from './OnboardingInput';
import DataConfirmation from './DataConfirmation';
import CompletionCelebration from './CompletionCelebration';
import UserMenu from '../user/UserMenu';

const Onboarding = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState('chat'); // 'chat', 'confirmation', 'celebration'
  const [collectedData, setCollectedData] = useState({
    brand_name: '',
    industry: '',
    target_audience: '',
    tone_of_voice: '',
    visual_style: '',
    content_pillars: [],
    post_times: [],
  });
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Initial greeting
  useEffect(() => {
    const initialMessage = {
      role: 'assistant',
      content: "Hi! I'm Experta, your AI social media manager. I'm excited to help you automate your social media presence! Let's get started by learning about your brand. What's your brand name?",
      timestamp: new Date().toISOString(),
    };
    
    setMessages([initialMessage]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (role, content) => {
    const newMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const simulateTyping = (delay = 1000) => {
    setIsTyping(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        resolve();
      }, delay);
    });
  };

  const handleUserMessage = async (message) => {
    // Add user message
    addMessage('user', message);

    // Simulate AI thinking
    await simulateTyping();

    // Process the message based on current data collection state
    processOnboardingFlow(message);
  };

  const processOnboardingFlow = (userInput) => {
    // Determine what information we're collecting
    if (!collectedData.brand_name) {
      setCollectedData((prev) => ({ ...prev, brand_name: userInput }));
      updateCompletionPercentage({ ...collectedData, brand_name: userInput });
      addMessage('assistant', `Great! ${userInput} is a wonderful name. What industry does ${userInput} operate in?`);
    } else if (!collectedData.industry) {
      setCollectedData((prev) => ({ ...prev, industry: userInput }));
      updateCompletionPercentage({ ...collectedData, industry: userInput });
      addMessage('assistant', `Perfect! Now, who is your target audience? For example, "young professionals aged 25-35" or "small business owners".`);
    } else if (!collectedData.target_audience) {
      setCollectedData((prev) => ({ ...prev, target_audience: userInput }));
      updateCompletionPercentage({ ...collectedData, target_audience: userInput });
      addMessage('assistant', `Excellent! How would you describe your brand's tone of voice? For example, "professional and authoritative", "friendly and casual", or "inspirational and motivating".`);
    } else if (!collectedData.tone_of_voice) {
      setCollectedData((prev) => ({ ...prev, tone_of_voice: userInput }));
      updateCompletionPercentage({ ...collectedData, tone_of_voice: userInput });
      addMessage('assistant', `Got it! Now, describe your visual style preferences. For example, "minimalist with pastel colors", "bold and vibrant", or "elegant and sophisticated".`);
    } else if (!collectedData.visual_style) {
      setCollectedData((prev) => ({ ...prev, visual_style: userInput }));
      updateCompletionPercentage({ ...collectedData, visual_style: userInput });
      addMessage('assistant', `Wonderful! Let's define your content pillars - these are the main themes for your posts. Please provide at least 3 content pillars separated by commas. For example: "product features, customer stories, industry insights".`);
    } else if (collectedData.content_pillars.length === 0) {
      const pillars = userInput.split(',').map((p) => p.trim()).filter((p) => p);
      if (pillars.length < 3) {
        addMessage('assistant', `I need at least 3 content pillars to create diverse content. Please provide at least 3 themes separated by commas.`);
      } else {
        setCollectedData((prev) => ({ ...prev, content_pillars: pillars }));
        updateCompletionPercentage({ ...collectedData, content_pillars: pillars });
        addMessage('assistant', `Perfect! Now, when would you like to post? Please provide your preferred posting times in 24-hour format, separated by commas. For example: "09:00, 14:00, 18:00".`);
      }
    } else if (collectedData.post_times.length === 0) {
      const times = userInput.split(',').map((t) => t.trim()).filter((t) => t);
      // Basic validation for time format
      const validTimes = times.filter((t) => /^\d{2}:\d{2}$/.test(t));
      if (validTimes.length === 0) {
        addMessage('assistant', `Please provide times in HH:MM format (24-hour), separated by commas. For example: "09:00, 14:00, 18:00".`);
      } else {
        const updatedData = { ...collectedData, post_times: validTimes };
        setCollectedData((prev) => ({ ...prev, post_times: validTimes }));
        updateCompletionPercentage(updatedData);
        
        // Move to confirmation step - all required data collected
        setTimeout(() => {
          setCurrentStep('confirmation');
        }, 500);
      }
    }
  };

  const updateCompletionPercentage = (data) => {
    const requiredFields = ['brand_name', 'industry', 'target_audience', 'tone_of_voice', 'visual_style'];
    const completedFields = requiredFields.filter(field => data[field] && data[field].length > 0).length;
    const hasPillars = data.content_pillars && data.content_pillars.length >= 3 ? 1 : 0;
    const hasTimes = data.post_times && data.post_times.length > 0 ? 1 : 0;
    
    const totalFields = requiredFields.length + 2; // +2 for pillars and times
    const totalCompleted = completedFields + hasPillars + hasTimes;
    const percentage = Math.round((totalCompleted / totalFields) * 100);
    
    setCompletionPercentage(percentage);
  };

  const handleConfirmData = () => {
    // Validate that we have all required data
    if (!collectedData.brand_name || !collectedData.industry || !collectedData.target_audience ||
        !collectedData.tone_of_voice || !collectedData.visual_style || 
        collectedData.content_pillars.length < 3 || collectedData.post_times.length === 0) {
      addMessage('assistant', 'It looks like some information is missing. Let me ask you again about the missing details.');
      // Reset to start
      setCurrentStep('chat');
      return;
    }
    
    // Move to celebration/completion step
    setCurrentStep('celebration');
  };

  const handleEditData = () => {
    // Go back to chat to edit
    setCurrentStep('chat');
    addMessage('assistant', 'No problem! What would you like to change? Just tell me which field and the new value.');
  };

  if (currentStep === 'confirmation') {
    return (
      <DataConfirmation
        data={collectedData}
        onConfirm={handleConfirmData}
        onEdit={handleEditData}
      />
    );
  }

  if (currentStep === 'celebration') {
    return (
      <CompletionCelebration
        brandName={collectedData.brand_name}
        data={collectedData}
        onComplete={() => navigate('/connections')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col" style={{ height: '90vh' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Welcome to Experta</h1>
            <p className="text-blue-100 text-sm mt-1">Let's set up your brand in just a few minutes</p>
            {completionPercentage > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-blue-100">Progress</span>
                  <span className="text-xs text-blue-100 font-semibold">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-blue-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <UserMenu />
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              message={msg.content}
              role={msg.role}
              timestamp={msg.timestamp}
            />
          ))}
          
          {isTyping && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <OnboardingInput onSendMessage={handleUserMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default Onboarding;
