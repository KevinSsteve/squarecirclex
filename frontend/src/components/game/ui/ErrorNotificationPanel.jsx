import { useState, useEffect } from 'react';

/**
 * ErrorNotificationPanel Component
 * 
 * Displays error notifications with manual retry buttons.
 * Listens for game:errorNotification events from ErrorRecoverySystem.
 * 
 * Features:
 * - Error notification display
 * - Manual retry buttons
 * - View logs action
 * - Contact support action
 * - Auto-dismiss for recovered errors
 * - Persistent display for critical errors
 * 
 * Requirements: 4.4, 8.6
 * Phase 10, Task 60
 */
const ErrorNotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for error notifications from ErrorRecoverySystem
    const handleErrorNotification = (event) => {
      const notification = event.detail;
      
      // Add notification to list
      setNotifications(prev => {
        // Check if notification with same context already exists
        const existingIndex = prev.findIndex(
          n => n.context?.operationId === notification.context?.operationId
        );
        
        if (existingIndex !== -1) {
          // Update existing notification
          const updated = [...prev];
          updated[existingIndex] = {
            ...notification,
            id: prev[existingIndex].id // Keep same ID
          };
          return updated;
        }
        
        // Add new notification
        return [...prev, {
          ...notification,
          id: `error-${Date.now()}-${Math.random()}`
        }];
      });
    };

    window.addEventListener('game:errorNotification', handleErrorNotification);

    return () => {
      window.removeEventListener('game:errorNotification', handleErrorNotification);
    };
  }, []);

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Handle retry action
  const handleRetry = (notification) => {
    const { context } = notification;
    
    if (context?.operationId) {
      // Emit retry event for ErrorRecoverySystem to handle
      window.dispatchEvent(new CustomEvent('game:manualRetry', {
        detail: { operationId: context.operationId }
      }));
      
      // Remove notification (will be re-added if retry fails)
      removeNotification(notification.id);
    }
  };

  // Handle view logs action
  const handleViewLogs = () => {
    // Open browser console
    console.log('Opening console for error logs...');
    // Note: Can't programmatically open console, user must do it manually
    alert('Please open your browser console (F12) to view detailed error logs.');
  };

  // Handle contact support action
  const handleContactSupport = () => {
    // Open support page or email
    window.open('mailto:support@example.com?subject=Game%20Error%20Report', '_blank');
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-150 flex flex-col gap-2 pointer-events-none">
      {notifications.map(notification => (
        <ErrorNotification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          onRetry={() => handleRetry(notification)}
          onViewLogs={handleViewLogs}
          onContactSupport={handleContactSupport}
        />
      ))}
    </div>
  );
};

/**
 * Single error notification component
 */
const ErrorNotification = ({ 
  notification, 
  onClose, 
  onRetry, 
  onViewLogs, 
  onContactSupport 
}) => {
  const { type, title, message, details, actions } = notification;

  // Get colors based on type
  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Get icon background color
  const getIconBg = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-lg border shadow-lg ${getColors()} animate-slide-in-right pointer-events-auto`}
      style={{ minWidth: '320px', maxWidth: '400px' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getIconBg()}`}>
          {getIcon()}
        </div>

        {/* Title and message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-sm mt-1">{message}</p>
          {details && (
            <p className="text-xs mt-2 opacity-75 font-mono">{details}</p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-current border-opacity-20">
          {actions.includes('retry') && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 text-xs font-medium bg-white bg-opacity-50 hover:bg-opacity-75 rounded transition-colors"
            >
              🔄 Retry
            </button>
          )}
          {actions.includes('view_logs') && (
            <button
              onClick={onViewLogs}
              className="px-3 py-1.5 text-xs font-medium bg-white bg-opacity-50 hover:bg-opacity-75 rounded transition-colors"
            >
              📋 View Logs
            </button>
          )}
          {actions.includes('contact_support') && (
            <button
              onClick={onContactSupport}
              className="px-3 py-1.5 text-xs font-medium bg-white bg-opacity-50 hover:bg-opacity-75 rounded transition-colors"
            >
              💬 Support
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorNotificationPanel;
