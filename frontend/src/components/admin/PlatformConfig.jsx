import { useState, useEffect } from 'react';
import { api } from '../../config/api';

/**
 * Platform Configuration Component
 * 
 * Allows admins to configure master OAuth credentials for Instagram and LinkedIn.
 * These credentials are used for all brands in the system.
 */
const PlatformConfig = () => {
  const [instagramConfig, setInstagramConfig] = useState({
    appId: '',
    appSecret: '',
    redirectUri: '',
  });

  const [linkedinConfig, setLinkedinConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
  });

  const [metaConfig, setMetaConfig] = useState({
    appId: '',
    appSecret: '',
    redirectUri: '',
  });

  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing configurations on mount
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setIsLoading(true);
    try {
      // Load Meta configuration
      const metaResponse = await api.getAdminSettings('meta');
      if (metaResponse.data.configured && metaResponse.data.credentials) {
        setMetaConfig({
          appId: metaResponse.data.credentials.appId || '',
          appSecret: metaResponse.data.credentials.appSecret || '',
          redirectUri: metaResponse.data.credentials.redirectUri || '',
        });
      }

      // Load Instagram configuration (if separate from Meta)
      const instagramResponse = await api.getAdminSettings('instagram');
      if (instagramResponse.data.configured && instagramResponse.data.credentials) {
        setInstagramConfig({
          appId: instagramResponse.data.credentials.appId || '',
          appSecret: instagramResponse.data.credentials.appSecret || '',
          redirectUri: instagramResponse.data.credentials.redirectUri || '',
        });
      }

      // Load LinkedIn configuration
      const linkedinResponse = await api.getAdminSettings('linkedin');
      if (linkedinResponse.data.configured && linkedinResponse.data.credentials) {
        setLinkedinConfig({
          clientId: linkedinResponse.data.credentials.clientId || '',
          clientSecret: linkedinResponse.data.credentials.clientSecret || '',
          redirectUri: linkedinResponse.data.credentials.redirectUri || '',
        });
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      setSaveStatus({
        type: 'error',
        message: 'Failed to load existing configurations. You can still save new ones.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstagramChange = (field, value) => {
    setInstagramConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleLinkedinChange = (field, value) => {
    setLinkedinConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleMetaChange = (field, value) => {
    setMetaConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveInstagram = async () => {
    setIsSaving(true);
    setSaveStatus({ type: '', message: '' });

    try {
      const response = await api.saveAdminSettings({
        platform: 'instagram',
        credentials: instagramConfig,
      });

      setSaveStatus({
        type: 'success',
        message: response.data.message || 'Instagram configuration saved successfully!',
      });
    } catch (error) {
      console.error('Error saving Instagram configuration:', error);
      setSaveStatus({
        type: 'error',
        message: error.message || 'Failed to save Instagram configuration. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLinkedin = async () => {
    setIsSaving(true);
    setSaveStatus({ type: '', message: '' });

    try {
      const response = await api.saveAdminSettings({
        platform: 'linkedin',
        credentials: linkedinConfig,
      });

      setSaveStatus({
        type: 'success',
        message: response.data.message || 'LinkedIn configuration saved successfully!',
      });
    } catch (error) {
      console.error('Error saving LinkedIn configuration:', error);
      setSaveStatus({
        type: 'error',
        message: error.message || 'Failed to save LinkedIn configuration. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMeta = async () => {
    setIsSaving(true);
    setSaveStatus({ type: '', message: '' });

    try {
      const response = await api.saveAdminSettings({
        platform: 'meta',
        credentials: metaConfig,
      });

      setSaveStatus({
        type: 'success',
        message: response.data.message || 'Meta (Facebook/Instagram) configuration saved successfully!',
      });
    } catch (error) {
      console.error('Error saving Meta configuration:', error);
      setSaveStatus({
        type: 'error',
        message: error.message || 'Failed to save Meta configuration. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Configuration</h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure master OAuth credentials for social media platforms. These credentials will be used for all brands.
        </p>
      </div>

      {/* Status Message */}
      {saveStatus.message && (
        <div
          className={`p-4 rounded-md ${
            saveStatus.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {saveStatus.message}
        </div>
      )}

      {/* Instagram Configuration */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="mr-2">📸</span>
            Instagram Graph API
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure your Instagram Business App credentials
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="instagram-app-id" className="block text-sm font-medium text-gray-700">
              App ID
            </label>
            <input
              type="text"
              id="instagram-app-id"
              value={instagramConfig.appId}
              onChange={(e) => handleInstagramChange('appId', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Instagram App ID"
            />
          </div>
          <div>
            <label htmlFor="instagram-app-secret" className="block text-sm font-medium text-gray-700">
              App Secret
            </label>
            <input
              type="password"
              id="instagram-app-secret"
              value={instagramConfig.appSecret}
              onChange={(e) => handleInstagramChange('appSecret', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Instagram App Secret"
            />
          </div>
          <div>
            <label htmlFor="instagram-redirect-uri" className="block text-sm font-medium text-gray-700">
              Redirect URI
            </label>
            <input
              type="text"
              id="instagram-redirect-uri"
              value={instagramConfig.redirectUri}
              onChange={(e) => handleInstagramChange('redirectUri', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://your-domain.com/oauth/instagram/callback"
            />
          </div>
          <div className="pt-4">
            <button
              onClick={handleSaveInstagram}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Instagram Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* LinkedIn Configuration */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="mr-2">💼</span>
            LinkedIn API
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure your LinkedIn App credentials
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="linkedin-client-id" className="block text-sm font-medium text-gray-700">
              Client ID
            </label>
            <input
              type="text"
              id="linkedin-client-id"
              value={linkedinConfig.clientId}
              onChange={(e) => handleLinkedinChange('clientId', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter LinkedIn Client ID"
            />
          </div>
          <div>
            <label htmlFor="linkedin-client-secret" className="block text-sm font-medium text-gray-700">
              Client Secret
            </label>
            <input
              type="password"
              id="linkedin-client-secret"
              value={linkedinConfig.clientSecret}
              onChange={(e) => handleLinkedinChange('clientSecret', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter LinkedIn Client Secret"
            />
          </div>
          <div>
            <label htmlFor="linkedin-redirect-uri" className="block text-sm font-medium text-gray-700">
              Redirect URI
            </label>
            <input
              type="text"
              id="linkedin-redirect-uri"
              value={linkedinConfig.redirectUri}
              onChange={(e) => handleLinkedinChange('redirectUri', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://your-domain.com/oauth/linkedin/callback"
            />
          </div>
          <div className="pt-4">
            <button
              onClick={handleSaveLinkedin}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save LinkedIn Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Meta (Facebook/Instagram) Configuration */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="mr-2">📘</span>
            Meta Graph API (Facebook & Instagram)
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure your Meta App credentials for Facebook and Instagram publishing
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="meta-app-id" className="block text-sm font-medium text-gray-700">
              App ID
            </label>
            <input
              type="text"
              id="meta-app-id"
              value={metaConfig.appId}
              onChange={(e) => handleMetaChange('appId', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Meta App ID"
            />
          </div>
          <div>
            <label htmlFor="meta-app-secret" className="block text-sm font-medium text-gray-700">
              App Secret
            </label>
            <input
              type="password"
              id="meta-app-secret"
              value={metaConfig.appSecret}
              onChange={(e) => handleMetaChange('appSecret', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Meta App Secret"
            />
          </div>
          <div>
            <label htmlFor="meta-redirect-uri" className="block text-sm font-medium text-gray-700">
              Redirect URI
            </label>
            <input
              type="text"
              id="meta-redirect-uri"
              value={metaConfig.redirectUri}
              onChange={(e) => handleMetaChange('redirectUri', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://your-domain.com/oauth/meta/callback"
            />
          </div>
          <div className="pt-4">
            <button
              onClick={handleSaveMeta}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Meta Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Security Note</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Credentials are encrypted and stored securely in AWS Secrets Manager with KMS encryption.
                Only authorized Lambda functions can access these credentials.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">Setup Instructions</h3>
            <div className="mt-2 text-sm text-gray-700 space-y-2">
              <p className="font-semibold">Meta (Facebook/Instagram):</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta for Developers</a></li>
                <li>Create a new app or use an existing one</li>
                <li>Add "Facebook Login" and "Instagram Graph API" products</li>
                <li>Copy your App ID and App Secret</li>
                <li>Configure OAuth redirect URIs in your app settings</li>
                <li>Request permissions: pages_manage_posts, instagram_basic, instagram_content_publish</li>
              </ol>
              
              <p className="font-semibold mt-4">Instagram:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta for Developers</a></li>
                <li>Your Instagram Business Account must be connected to a Facebook Page</li>
                <li>Use the same Meta App credentials as Facebook</li>
                <li>Ensure Instagram Graph API product is added to your app</li>
              </ol>
              
              <p className="font-semibold mt-4">LinkedIn:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://www.linkedin.com/developers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn Developers</a></li>
                <li>Create a new app</li>
                <li>Copy your Client ID and Client Secret</li>
                <li>Add OAuth 2.0 redirect URLs</li>
                <li>Request permissions: w_member_social, r_liteprofile</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformConfig;
