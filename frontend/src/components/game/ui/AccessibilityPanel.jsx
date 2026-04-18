import { useState, useEffect } from 'react';

/**
 * AccessibilityPanel Component
 * 
 * Provides UI for managing accessibility settings.
 * Allows users to toggle animations, simplified view, high contrast, etc.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 * Phase 10, Task 61
 */
const AccessibilityPanel = ({ scene, isOpen, onClose }) => {
  const [preferences, setPreferences] = useState({
    animationsEnabled: true,
    simplifiedView: false,
    highContrast: false,
    screenReaderEnabled: true,
    keyboardNavigationEnabled: true,
    reducedMotion: false,
    textDescriptions: true
  });

  // Load preferences from accessibility system
  useEffect(() => {
    if (!scene) return;
    
    const accessibilitySystem = scene.getAccessibilitySystem();
    if (accessibilitySystem) {
      setPreferences(accessibilitySystem.getAllPreferences());
    }
  }, [scene]);

  // Listen for preference changes
  useEffect(() => {
    const handlePreferencesChanged = (event) => {
      setPreferences(event.detail.preferences);
    };

    window.addEventListener('game:accessibilityPreferencesChanged', handlePreferencesChanged);
    return () => window.removeEventListener('game:accessibilityPreferencesChanged', handlePreferencesChanged);
  }, []);

  // Handle preference change
  const handlePreferenceChange = (key, value) => {
    if (!scene) return;
    
    const accessibilitySystem = scene.getAccessibilitySystem();
    if (accessibilitySystem) {
      accessibilitySystem.setPreference(key, value);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]"
      onClick={onClose}
      role="dialog"
      aria-labelledby="accessibility-panel-title"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="accessibility-panel-title" className="text-2xl font-bold text-gray-900">
            Accessibility Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close accessibility settings"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Visual Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Settings</h3>
            <div className="space-y-4">
              {/* Animations */}
              <SettingToggle
                id="animations-enabled"
                label="Enable Animations"
                description="Show animated transitions and effects"
                checked={preferences.animationsEnabled}
                onChange={(checked) => handlePreferenceChange('animationsEnabled', checked)}
              />

              {/* Reduced Motion */}
              <SettingToggle
                id="reduced-motion"
                label="Reduce Motion"
                description="Minimize movement and animations for motion sensitivity"
                checked={preferences.reducedMotion}
                onChange={(checked) => handlePreferenceChange('reducedMotion', checked)}
              />

              {/* Simplified View */}
              <SettingToggle
                id="simplified-view"
                label="Simplified View"
                description="Reduce visual complexity for better clarity"
                checked={preferences.simplifiedView}
                onChange={(checked) => handlePreferenceChange('simplifiedView', checked)}
              />

              {/* High Contrast */}
              <SettingToggle
                id="high-contrast"
                label="High Contrast Mode"
                description="Increase contrast for better visibility"
                checked={preferences.highContrast}
                onChange={(checked) => handlePreferenceChange('highContrast', checked)}
              />
            </div>
          </section>

          {/* Screen Reader Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Screen Reader Settings</h3>
            <div className="space-y-4">
              {/* Screen Reader */}
              <SettingToggle
                id="screen-reader-enabled"
                label="Screen Reader Announcements"
                description="Enable audio descriptions of game events"
                checked={preferences.screenReaderEnabled}
                onChange={(checked) => handlePreferenceChange('screenReaderEnabled', checked)}
              />

              {/* Text Descriptions */}
              <SettingToggle
                id="text-descriptions"
                label="Text Descriptions"
                description="Provide text descriptions for visual states"
                checked={preferences.textDescriptions}
                onChange={(checked) => handlePreferenceChange('textDescriptions', checked)}
              />
            </div>
          </section>

          {/* Keyboard Navigation */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Navigation</h3>
            <div className="space-y-4">
              {/* Keyboard Navigation */}
              <SettingToggle
                id="keyboard-navigation-enabled"
                label="Keyboard Navigation"
                description="Enable keyboard shortcuts for navigation"
                checked={preferences.keyboardNavigationEnabled}
                onChange={(checked) => handlePreferenceChange('keyboardNavigationEnabled', checked)}
              />

              {/* Keyboard Shortcuts Reference */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Keyboard Shortcuts</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Cycle through agents</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300">Tab</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Open entity details</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300">Enter</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Deselect entity</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300">Esc</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Focus on department</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300">1-5</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Pan camera</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300">↑↓←→</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Zoom in/out</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300">+/-</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Reset camera</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300">Home</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Accessibility settings</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300">Ctrl+A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Help</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300">Ctrl+H</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Game state</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300">Ctrl+S</kbd>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * SettingToggle Component
 * 
 * Reusable toggle switch for accessibility settings
 */
const SettingToggle = ({ id, label, description, checked, onChange }) => {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-900 cursor-pointer">
          {label}
        </label>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <div className="ml-4">
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${checked ? 'bg-blue-600' : 'bg-gray-200'}
          `}
        >
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
    </div>
  );
};

export default AccessibilityPanel;
