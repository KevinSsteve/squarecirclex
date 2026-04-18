/**
 * SoundControlPanel - UI for controlling game audio
 * 
 * Features:
 * - Master volume slider
 * - Effects volume slider
 * - Ambient volume slider
 * - Mute toggle button
 * - Visual feedback for current settings
 */

import React, { useState, useEffect } from 'react';

const SoundControlPanel = ({ soundSystem, onClose }) => {
  const [volumes, setVolumes] = useState({
    master: 0.7,
    effects: 0.8,
    ambient: 0.5
  });
  const [muted, setMuted] = useState(false);
  
  // Load current settings
  useEffect(() => {
    if (soundSystem) {
      setVolumes(soundSystem.getVolumes());
      setMuted(soundSystem.isMuted());
    }
  }, [soundSystem]);
  
  const handleMasterVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolumes(prev => ({ ...prev, master: value }));
    if (soundSystem) {
      soundSystem.setMasterVolume(value);
    }
  };
  
  const handleEffectsVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolumes(prev => ({ ...prev, effects: value }));
    if (soundSystem) {
      soundSystem.setEffectsVolume(value);
    }
  };
  
  const handleAmbientVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolumes(prev => ({ ...prev, ambient: value }));
    if (soundSystem) {
      soundSystem.setAmbientVolume(value);
    }
  };
  
  const handleMuteToggle = () => {
    if (soundSystem) {
      soundSystem.setMuted(!muted);
      setMuted(!muted);
    }
  };
  
  const handleTestSound = async (type) => {
    if (soundSystem && !muted) {
      // Play a test sound based on type
      const soundName = type === 'effect' ? 'click' : 'office_ambient';
      await soundSystem.playSound(soundName, { type });
    }
  };
  
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-96 z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          Sound Settings
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close sound settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Mute Toggle */}
      <div className="mb-6">
        <button
          onClick={handleMuteToggle}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            muted
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
          }`}
        >
          {muted ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              Unmute All Sounds
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Mute All Sounds
            </span>
          )}
        </button>
      </div>
      
      {/* Volume Controls */}
      <div className="space-y-6">
        {/* Master Volume */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Master Volume
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(volumes.master * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volumes.master}
            onChange={handleMasterVolumeChange}
            disabled={muted}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: muted ? undefined : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volumes.master * 100}%, #e5e7eb ${volumes.master * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
        
        {/* Effects Volume */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sound Effects
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(volumes.effects * 100)}%
              </span>
              <button
                onClick={() => handleTestSound('effect')}
                disabled={muted}
                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Test
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volumes.effects}
            onChange={handleEffectsVolumeChange}
            disabled={muted}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: muted ? undefined : `linear-gradient(to right, #10b981 0%, #10b981 ${volumes.effects * 100}%, #e5e7eb ${volumes.effects * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
        
        {/* Ambient Volume */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ambient Sounds
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(volumes.ambient * 100)}%
              </span>
              <button
                onClick={() => handleTestSound('ambient')}
                disabled={muted}
                className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Test
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volumes.ambient}
            onChange={handleAmbientVolumeChange}
            disabled={muted}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: muted ? undefined : `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${volumes.ambient * 100}%, #e5e7eb ${volumes.ambient * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
      </div>
      
      {/* Info */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Tip:</strong> Sound effects play for task completions, notifications, and interactions. 
          Ambient sounds create atmosphere in the office environment.
        </p>
      </div>
    </div>
  );
};

export default SoundControlPanel;
