import { useState, useEffect } from 'react';
import { api } from '../../config/api';

const CompletionCelebration = ({ brandName, data, onComplete }) => {
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('Saving your brand information...');
  const [error, setError] = useState(null);
  const [brandId, setBrandId] = useState(null);

  useEffect(() => {
    // Call the backend API to create the brand
    const createBrand = async () => {
      try {
        setCurrentTask('Saving your brand information...');
        setProgress(10);

        const response = await api.createBrand(data);
        
        if (response.data && response.data.brand_id) {
          setBrandId(response.data.brand_id);
          
          // Simulate progress while content generation happens in the background
          simulateProgress();
        } else {
          throw new Error('Failed to create brand');
        }
      } catch (err) {
        console.error('Error creating brand:', err);
        setError(err.message || 'Failed to create brand. Please try again.');
        setIsGenerating(false);
      }
    };

    createBrand();
  }, [data]);

  const simulateProgress = () => {
    const tasks = [
      'Analyzing your brand identity...',
      'Generating content strategy...',
      'Creating your first 30 posts...',
      'Scheduling posts to your calendar...',
      'Setting up automation...',
    ];

    let taskIndex = 0;
    let progressValue = 10;

    const interval = setInterval(() => {
      progressValue += 2;
      setProgress(progressValue);

      // Update task every ~18% progress
      if (progressValue % 18 === 0 && taskIndex < tasks.length - 1) {
        taskIndex++;
        setCurrentTask(tasks[taskIndex]);
      }

      if (progressValue >= 100) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 150);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-8">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            {/* Animated Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                  <svg
                    className="w-12 h-12 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Setting Up {brandName}
            </h2>
            <p className="text-gray-600 mb-8">
              This will only take a moment...
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{progress}%</p>
            </div>

            {/* Current Task */}
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm font-medium">{currentTask}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 All Set!
          </h2>
          <p className="text-xl text-gray-700 mb-4">
            Welcome to Experta, {brandName}!
          </p>
          <p className="text-gray-600 mb-8">
            Your content calendar is ready with 30 posts scheduled over the next month. 
            Your posts will be automatically published at your preferred times.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">30</div>
              <div className="text-sm text-gray-600">Posts Created</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">{data.content_pillars.length}</div>
              <div className="text-sm text-gray-600">Content Pillars</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-600">{data.post_times.length}</div>
              <div className="text-sm text-gray-600">Daily Posts</div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Connect your social media accounts</strong> - Securely link Instagram and LinkedIn through OAuth</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>View your content calendar in the dashboard</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Edit or regenerate any post before it goes live</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Chat with Experta anytime to create new posts or make changes</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={onComplete}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-105 font-semibold"
          >
            Connect Social Media Accounts
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionCelebration;
