import React from 'react';

/**
 * LoadingScreen Component
 * 
 * Displays loading progress while assets are being loaded.
 * Shows progress bar, percentage, and loading messages.
 * 
 * Phase 9, Task 57
 * Requirements: 10.3, 10.4
 */
const LoadingScreen = ({ progress = 0, message = 'Loading...', visible = true }) => {
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Logo/Title */}
      <div style={{
        fontSize: '32px',
        fontWeight: 'bold',
        marginBottom: '40px',
        color: '#4F46E5'
      }}>
        AI Company Simulator
      </div>
      
      {/* Loading Message */}
      <div style={{
        fontSize: '16px',
        marginBottom: '20px',
        color: '#9CA3AF'
      }}>
        {message}
      </div>
      
      {/* Progress Bar Container */}
      <div style={{
        width: '400px',
        maxWidth: '80%',
        height: '8px',
        backgroundColor: '#374151',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px'
      }}>
        {/* Progress Bar Fill */}
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#4F46E5',
          transition: 'width 0.3s ease',
          borderRadius: '4px'
        }} />
      </div>
      
      {/* Progress Percentage */}
      <div style={{
        fontSize: '14px',
        color: '#6B7280'
      }}>
        {progress}%
      </div>
      
      {/* Loading Spinner */}
      <div style={{
        marginTop: '30px',
        width: '40px',
        height: '40px',
        border: '4px solid #374151',
        borderTop: '4px solid #4F46E5',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      
      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
