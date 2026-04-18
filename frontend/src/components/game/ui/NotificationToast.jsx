import { useState, useEffect } from 'react';

/**
 * NotificationToast Component
 * 
 * Displays toast notifications for game events.
 * Supports multiple notification types with auto-hide and batching.
 * 
 * Features:
 * - Notification types (success, error, info, warning)
 * - Auto-hide with configurable duration
 * - Max 3 visible notifications
 * - Notification batching for similar events
 * - Smooth animations
 * 
 * Requirements: 7.4, 8.2, 8.3
 */

/**
 * Single notification toast
 */
const Toast = ({ notification, onClose }) => {
  const { id, type, message, duration, count } = notification;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

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
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${getColors()} animate-slide-in-right`}
      style={{ minWidth: '320px', maxWidth: '400px' }}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getIconBg()}`}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {count && count > 1 ? `${message} (${count})` : message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

/**
 * NotificationManager Component
 * 
 * Manages multiple toast notifications with queuing and batching.
 */
const NotificationManager = ({ scene }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationQueue, setNotificationQueue] = useState([]);

  // Maximum visible notifications
  const MAX_VISIBLE = 3;

  // Batching window (ms)
  const BATCH_WINDOW = 2000;

  // Add notification
  const addNotification = (notification) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification = {
      id,
      type: notification.type || 'info',
      message: notification.message,
      duration: notification.duration || (notification.type === 'error' ? 5000 : 3000),
      timestamp: Date.now(),
      batchKey: notification.batchKey || null,
      count: 1
    };

    setNotifications(prev => {
      // Check if we should batch this notification
      if (newNotification.batchKey) {
        const existingIndex = prev.findIndex(
          n => n.batchKey === newNotification.batchKey && 
               Date.now() - n.timestamp < BATCH_WINDOW
        );

        if (existingIndex !== -1) {
          // Batch with existing notification
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            count: updated[existingIndex].count + 1,
            timestamp: Date.now()
          };
          return updated;
        }
      }

      // Add new notification
      const updated = [...prev, newNotification];

      // If we exceed max visible, queue the oldest
      if (updated.length > MAX_VISIBLE) {
        const visible = updated.slice(-MAX_VISIBLE);
        const queued = updated.slice(0, -MAX_VISIBLE);
        setNotificationQueue(q => [...q, ...queued]);
        return visible;
      }

      return updated;
    });
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);

      // If we have queued notifications, show the next one
      if (updated.length < MAX_VISIBLE && notificationQueue.length > 0) {
        const [next, ...rest] = notificationQueue;
        setNotificationQueue(rest);
        return [...updated, next];
      }

      return updated;
    });
  };

  // Listen for game events
  useEffect(() => {
    if (!scene) return;

    // Task completed event
    const handleTaskCompleted = (event) => {
      const { taskType } = event.detail;
      addNotification({
        type: 'success',
        message: `Task completed: ${taskType}`,
        batchKey: 'task-completed',
        duration: 3000
      });
    };

    // Task failed event
    const handleTaskFailed = (event) => {
      const { taskType, error } = event.detail;
      addNotification({
        type: 'error',
        message: `Task failed: ${taskType}${error ? ` - ${error}` : ''}`,
        duration: 5000
      });
    };

    // Agent state changed event
    const handleAgentStateChanged = (event) => {
      const { agentId, newState } = event.detail;
      
      // Only show notifications for certain states
      if (newState === 'celebrating') {
        addNotification({
          type: 'success',
          message: 'Agent completed task successfully!',
          batchKey: 'agent-celebrating',
          duration: 2000
        });
      } else if (newState === 'error') {
        addNotification({
          type: 'error',
          message: 'Agent encountered an error',
          duration: 4000
        });
      }
    };

    // Connection status changed event
    const handleConnectionStatusChanged = (event) => {
      const { status } = event.detail;
      
      if (status === 'disconnected') {
        addNotification({
          type: 'warning',
          message: 'Connection lost. Reconnecting...',
          duration: 0 // Don't auto-hide
        });
      } else if (status === 'connected') {
        addNotification({
          type: 'success',
          message: 'Connection restored',
          duration: 2000
        });
      } else if (status === 'error') {
        addNotification({
          type: 'error',
          message: 'Connection error occurred',
          duration: 5000
        });
      }
    };

    // Sync error event
    const handleSyncError = (event) => {
      const { error } = event.detail;
      addNotification({
        type: 'error',
        message: `Sync error: ${error}`,
        duration: 5000
      });
    };

    // Register event listeners
    window.addEventListener('game:taskCompleted', handleTaskCompleted);
    window.addEventListener('game:taskFailed', handleTaskFailed);
    window.addEventListener('game:agentStateChanged', handleAgentStateChanged);
    window.addEventListener('game:connectionStatusChanged', handleConnectionStatusChanged);
    window.addEventListener('game:syncError', handleSyncError);

    return () => {
      window.removeEventListener('game:taskCompleted', handleTaskCompleted);
      window.removeEventListener('game:taskFailed', handleTaskFailed);
      window.removeEventListener('game:agentStateChanged', handleAgentStateChanged);
      window.removeEventListener('game:connectionStatusChanged', handleConnectionStatusChanged);
      window.removeEventListener('game:syncError', handleSyncError);
    };
  }, [scene]);

  // Expose addNotification globally for manual notifications
  useEffect(() => {
    window.gameNotifications = {
      show: addNotification
    };

    return () => {
      delete window.gameNotifications;
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-150 flex flex-col gap-2 pointer-events-none">
      {notifications.map(notification => (
        <div key={notification.id} className="pointer-events-auto">
          <Toast
            notification={notification}
            onClose={removeNotification}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationManager;
