import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../config/api';
import { tokenManager } from '../utils/tokenManager';

const ConnectAccounts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [connections, setConnections] = useState({
    instagram: {
      connected: false,
      username: null,
      profilePic: null
    },
    linkedin: {
      connected: false,
      username: null,
      profilePic: null
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brandId, setBrandId] = useState(null);

  useEffect(() => {
    loadConnectionStatus();
    
    // Check for OAuth callback success
    const success = searchParams.get('success');
    const platform = searchParams.get('platform');
    if (success === 'true' && platform) {
      // Reload connection status after successful OAuth
      setTimeout(() => {
        loadConnectionStatus();
      }, 1000);
    }
  }, [searchParams]);

  const loadConnectionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get brand ID from token
      const userBrandId = await tokenManager.getBrandId();
      if (!userBrandId) {
        setError('Brand ID not found. Please complete onboarding first.');
        setLoading(false);
        return;
      }
      
      setBrandId(userBrandId);
      
      // Fetch brand data to get connection status
      const response = await api.getConnectionStatus(userBrandId);
      const brandData = response.data;
      
      setConnections({
        instagram: {
          connected: brandData.has_instagram_connection || false,
          username: brandData.instagram_username || null,
          profilePic: null
        },
        linkedin: {
          connected: brandData.has_linkedin_connection || false,
          username: brandData.linkedin_username || null,
          profilePic: null
        }
      });
    } catch (err) {
      console.error('Error loading connection status:', err);
      setError('Failed to load connection status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform) => {
    try {
      if (!brandId) {
        alert('Brand ID not found. Please complete onboarding first.');
        return;
      }

      // Get OAuth authorization URL from backend
      const response = await api.getOAuthAuthorizeUrl(platform, brandId);
      const { authorizationUrl } = response.data;

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        authorizationUrl,
        `${platform}_oauth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for popup closure
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          // Reload connection status after popup closes
          loadConnectionStatus();
        }
      }, 500);
    } catch (err) {
      console.error('Error initiating OAuth flow:', err);
      alert(`Failed to connect ${platform}. ${err.message || 'Please try again.'}`);
    }
  };

  const handleDisconnect = async (platform) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }

    try {
      if (!brandId) {
        alert('Brand ID not found.');
        return;
      }

      await api.disconnectOAuth(platform, brandId);
      
      // Update local state
      setConnections(prev => ({
        ...prev,
        [platform]: {
          connected: false,
          username: null,
          profilePic: null
        }
      }));

      alert(`${platform} disconnected successfully!`);
    } catch (err) {
      console.error('Error disconnecting:', err);
      alert(`Failed to disconnect ${platform}. ${err.message || 'Please try again.'}`);
    }
  };

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      color: 'bg-gray-900',
      description: 'Connect your Instagram account to automatically publish posts',
      features: [
        'Auto-publish posts to your feed',
        'Schedule content in advance',
        'AI-generated captions and images'
      ]
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-gray-800',
      description: 'Connect your LinkedIn account to share professional content',
      features: [
        'Auto-publish to your profile or company page',
        'Schedule professional content',
        'AI-generated business insights'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Connect Accounts</h1>
          <p className="mt-2 text-gray-600">
            Connect your social media accounts to enable automatic posting
          </p>
        </div>

        {/* Info Banner */}
        {loading && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">Loading connection status...</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Platform Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {platforms.map((platform) => {
            const connection = connections[platform.id];
            
            return (
              <div key={platform.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Platform Header */}
                <div className={`${platform.color} p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{platform.icon}</span>
                      <div>
                        <h2 className="text-2xl font-bold">{platform.name}</h2>
                        {connection.connected && connection.username && (
                          <p className="text-sm opacity-90">@{connection.username}</p>
                        )}
                      </div>
                    </div>
                    {connection.connected ? (
                      <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm font-medium">Not Connected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform Body */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{platform.description}</p>

                  {/* Features */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Features:</h3>
                    <ul className="space-y-2">
                      {platform.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  {connection.connected ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        className="w-full px-4 py-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      >
                        Disconnect {platform.name}
                      </button>
                      <button
                        onClick={() => handleConnect(platform.id)}
                        className={`w-full px-4 py-3 ${platform.color} text-white rounded-lg hover:opacity-90 transition-opacity font-medium`}
                      >
                        Reconnect {platform.name}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      className={`w-full px-4 py-3 ${platform.color} text-white rounded-lg hover:opacity-90 transition-opacity font-medium`}
                    >
                      Connect {platform.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure OAuth</h3>
              <p className="text-sm text-gray-600">
                We use industry-standard OAuth 2.0 for secure authentication. Your passwords are never shared.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600">
                Our AI generates engaging content tailored to each platform's best practices.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Automatic Publishing</h3>
              <p className="text-sm text-gray-600">
                Schedule posts in advance and let Experta handle the publishing automatically.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is my data secure?</h3>
              <p className="text-sm text-gray-600">
                Yes! We use AWS Secrets Manager with KMS encryption to store all credentials. 
                Your tokens are encrypted at rest and in transit, and we never store your passwords.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I disconnect at any time?</h3>
              <p className="text-sm text-gray-600">
                Absolutely. You can disconnect any platform at any time. 
                This will revoke Experta's access and delete all stored credentials.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What permissions do you need?</h3>
              <p className="text-sm text-gray-600">
                We only request the minimum permissions needed: read your profile information and publish posts. 
                We never access your private messages or other sensitive data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectAccounts;
