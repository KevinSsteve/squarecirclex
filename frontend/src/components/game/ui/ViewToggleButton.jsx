/**
 * ViewToggleButton Component
 * 
 * Button to toggle between game view and traditional dashboard view.
 * Shows current view mode and allows switching.
 * 
 * Requirements:
 * - 12.1: View toggle between game and traditional dashboard
 * 
 * Phase 10, Task 64
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import viewToggle, { ViewMode } from '../utils/ViewToggle';

const ViewToggleButton = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(viewToggle.getCurrentView());
  // Cache the game availability check to avoid multiple WebGL context creations
  const [isGameAvailable] = useState(() => viewToggle.isGameViewAvailable());
  
  useEffect(() => {
    // Listen for view changes
    const handleViewChange = (event) => {
      if (event.type === 'viewChange') {
        setCurrentView(event.currentView);
        
        // Navigate to appropriate route
        if (event.currentView === ViewMode.TRADITIONAL) {
          navigate('/dashboard');
        } else {
          navigate('/app');
        }
      }
    };
    
    viewToggle.addListener(handleViewChange);
    
    return () => {
      viewToggle.removeListener(handleViewChange);
    };
  }, [navigate]);
  
  const handleToggle = () => {
    viewToggle.toggleView();
  };
  
  // Don't show button if game view is not available
  if (!isGameAvailable) {
    return null;
  }
  
  const isGameView = currentView === ViewMode.GAME;
  
  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      title={isGameView ? 'Switch to traditional view' : 'Switch to game view'}
    >
      {isGameView ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Traditional View</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Game View</span>
        </>
      )}
    </button>
  );
};

export default ViewToggleButton;
