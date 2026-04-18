import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import PlatformConfig from './PlatformConfig';
import SystemMonitoring from './SystemMonitoring';

/**
 * Admin Dashboard Component
 * 
 * Main admin interface for platform configuration and system monitoring.
 * Only accessible to users in the "Admins" Cognito group.
 */
const Admin = () => {
  const { user, signOut } = useAuthContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statistics, setStatistics] = useState({
    totalBrands: 0,
    activeConnections: 0,
    instagramConnections: 0,
    linkedinConnections: 0,
    recentActivity: [],
    loading: true,
    error: null,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Fetch admin statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setStatistics(prev => ({ ...prev, loading: true, error: null }));

        // Note: In a production system, these would be dedicated admin endpoints
        // For now, we'll simulate the data structure that would come from the backend
        
        // Simulate fetching brand count and connection data
        // In production, this would be: const response = await api.getAdminStatistics();
        
        // Mock data for demonstration
        const mockStats = {
          totalBrands: 0,
          activeConnections: 0,
          instagramConnections: 0,
          linkedinConnections: 0,
          recentActivity: [
            {
              id: '1',
              type: 'brand_created',
              description: 'New brand onboarded',
              timestamp: new Date().toISOString(),
              user: 'user@example.com',
            },
            {
              id: '2',
              type: 'oauth_connected',
              description: 'Instagram account connected',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              user: 'user@example.com',
            },
            {
              id: '3',
              type: 'content_generated',
              description: 'Content calendar generated',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              user: 'user@example.com',
            },
          ],
        };

        setStatistics({
          ...mockStats,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setStatistics(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load statistics',
        }));
      }
    };

    if (activeTab === 'dashboard') {
      fetchStatistics();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'platform', name: 'Platform Configuration', icon: '⚙️' },
    { id: 'monitoring', name: 'System Monitoring', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🔐 Admin Dashboard
              </h1>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                ADMIN
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.username || 'Admin User'}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner */}
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Admin Access:</strong> You have elevated privileges. Changes made here affect all users and brands in the system.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Brands Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white text-2xl">
                        🏢
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Brands
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {statistics.loading ? '...' : statistics.totalBrands}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Connections Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white text-2xl">
                        🔗
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Connections
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {statistics.loading ? '...' : statistics.activeConnections}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instagram Connections Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white text-2xl">
                        📷
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Instagram
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {statistics.loading ? '...' : statistics.instagramConnections}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* LinkedIn Connections Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white text-2xl">
                        💼
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          LinkedIn
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {statistics.loading ? '...' : statistics.linkedinConnections}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {statistics.error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{statistics.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Activity
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Latest system events and user actions
                </p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {statistics.loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading activity...</p>
                  </div>
                ) : statistics.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {statistics.recentActivity.map((activity, activityIdx) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {activityIdx !== statistics.recentActivity.length - 1 ? (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                  {activity.type === 'brand_created' && '🏢'}
                                  {activity.type === 'oauth_connected' && '🔗'}
                                  {activity.type === 'content_generated' && '📝'}
                                  {activity.type === 'post_published' && '✅'}
                                  {!['brand_created', 'oauth_connected', 'content_generated', 'post_published'].includes(activity.type) && '📊'}
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-900">
                                    {activity.description}
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {activity.user}
                                  </p>
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                  <time dateTime={activity.timestamp}>
                                    {new Date(activity.timestamp).toLocaleString()}
                                  </time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* System Health Overview */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  System Health
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Quick overview of system status
                </p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                        <span className="text-green-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">API Gateway</p>
                      <p className="text-xs text-green-600">Operational</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                        <span className="text-green-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Lambda Functions</p>
                      <p className="text-xs text-green-600">Operational</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                        <span className="text-green-600 text-xl">✓</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">DynamoDB</p>
                      <p className="text-xs text-green-600">Operational</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'platform' && <PlatformConfig />}
        {activeTab === 'monitoring' && <SystemMonitoring />}
      </main>
    </div>
  );
};

export default Admin;
