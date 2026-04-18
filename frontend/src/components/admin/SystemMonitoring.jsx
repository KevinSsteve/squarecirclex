import { useState, useEffect } from 'react';

/**
 * System Monitoring Component
 * 
 * Displays system health metrics, recent activity, and error logs.
 */
const SystemMonitoring = () => {
  const [metrics, setMetrics] = useState({
    totalBrands: 0,
    totalPosts: 0,
    publishedToday: 0,
    failedToday: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    fetchRecentActivity();
  }, []);

  const fetchMetrics = async () => {
    try {
      // TODO: Implement API call to fetch system metrics
      // const response = await fetch('/api/admin/metrics');
      // const data = await response.json();

      // Simulated data for now
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMetrics({
        totalBrands: 42,
        totalPosts: 1250,
        publishedToday: 18,
        failedToday: 2,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // TODO: Implement API call to fetch recent activity
      // const response = await fetch('/api/admin/activity');
      // const data = await response.json();

      // Simulated data for now
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setRecentActivity([
        {
          id: 1,
          type: 'success',
          message: 'Post published successfully for Brand "TechStartup"',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
          id: 2,
          type: 'error',
          message: 'Failed to publish post for Brand "FashionBrand" - Instagram API error',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          id: 3,
          type: 'info',
          message: 'New brand "FoodieDelight" onboarded',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: 4,
          type: 'success',
          message: 'Content calendar generated for Brand "TravelBlog"',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
        <p className="mt-2 text-sm text-gray-600">
          Monitor system health, activity, and performance metrics.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">🏢</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Brands</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{metrics.totalBrands}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">📝</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Posts</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{metrics.totalPosts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">✅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Published Today</dt>
                  <dd className="text-3xl font-semibold text-green-600">{metrics.publishedToday}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">❌</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Failed Today</dt>
                  <dd className="text-3xl font-semibold text-red-600">{metrics.failedToday}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <p className="mt-1 text-sm text-gray-500">Latest system events and actions</p>
        </div>
        <div className="px-6 py-5">
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg border ${getActivityColor(activity.type)}`}
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <p className="font-medium">View CloudWatch Dashboard</p>
                  <p className="text-sm text-blue-600">Monitor Lambda metrics</p>
                </div>
              </div>
            </button>
            <button className="px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📝</span>
                <div>
                  <p className="font-medium">View Automation Logs</p>
                  <p className="text-sm text-green-600">Check publishing history</p>
                </div>
              </div>
            </button>
            <button className="px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔄</span>
                <div>
                  <p className="font-medium">Refresh Metrics</p>
                  <p className="text-sm text-purple-600">Update dashboard data</p>
                </div>
              </div>
            </button>
            <button className="px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚙️</span>
                <div>
                  <p className="font-medium">System Settings</p>
                  <p className="text-sm text-orange-600">Configure system parameters</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoring;
