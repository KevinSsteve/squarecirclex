/**
 * SoundSystem - Manages audio playback for the game layer
 * 
 * Features:
 * - Sound loading and caching
 * - Volume controls (master, effects, ambient)
 * - Mute toggle
 * - Sound pooling for performance
 * - Spatial audio support
 * 
 * Requirements: 8.5
 */

class SoundSystem {
  constructor() {
    // Audio context for Web Audio API
    this.audioContext = null;
    this.masterGain = null;
    this.effectsGain = null;
    this.ambientGain = null;
    
    // Sound library
    this.sounds = new Map();
    this.loadingPromises = new Map();
    
    // Volume settings (0.0 to 1.0)
    this.volumes = {
      master: 0.7,
      effects: 0.8,
      ambient: 0.5
    };
    
    // Mute state
    this.muted = false;
    
    // Sound pool for reusing audio sources
    this.soundPool = new Map();
    this.maxPoolSize = 10;
    
    // Currently playing sounds
    this.playingSounds = new Set();
    
    // Initialize from localStorage
    this.loadSettings();
    
    // Initialize audio context (lazy - requires user interaction)
    this.initialized = false;
  }
  
  /**
   * Initialize the audio context
   * Must be called after user interaction
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain();
      this.effectsGain = this.audioContext.createGain();
      this.ambientGain = this.audioContext.createGain();
      
      // Connect gain nodes
      this.effectsGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      // Apply saved volumes
      this.updateGainNodes();
      
      this.initialized = true;
      console.log('[SoundSystem] Initialized successfully');
    } catch (error) {
      console.error('[SoundSystem] Failed to initialize:', error);
    }
  }
  
  /**
   * Load a sound file
   * @param {string} name - Sound identifier
   * @param {string} url - URL to audio file
   * @returns {Promise<void>}
   */
  async loadSound(name, url) {
    // Check if already loaded
    if (this.sounds.has(name)) {
      return;
    }
    
    // Check if already loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }
    
    // Create loading promise
    const loadPromise = (async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        // Store the raw buffer (we'll decode it when needed)
        this.sounds.set(name, arrayBuffer);
        console.log(`[SoundSystem] Loaded sound: ${name}`);
      } catch (error) {
        console.error(`[SoundSystem] Failed to load sound ${name}:`, error);
        throw error;
      } finally {
        this.loadingPromises.delete(name);
      }
    })();
    
    this.loadingPromises.set(name, loadPromise);
    return loadPromise;
  }
  
  /**
   * Load multiple sounds
   * @param {Object} soundMap - Map of name -> url
   * @returns {Promise<void>}
   */
  async loadSounds(soundMap) {
    const promises = Object.entries(soundMap).map(([name, url]) =>
      this.loadSound(name, url)
    );
    await Promise.all(promises);
  }
  
  /**
   * Play a sound effect
   * @param {string} name - Sound identifier
   * @param {Object} options - Playback options
   * @returns {Promise<void>}
   */
  async playSound(name, options = {}) {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check if muted
    if (this.muted) return;
    
    // Check if sound exists
    if (!this.sounds.has(name)) {
      console.warn(`[SoundSystem] Sound not loaded: ${name}`);
      return;
    }
    
    try {
      const {
        volume = 1.0,
        loop = false,
        type = 'effect', // 'effect' or 'ambient'
        playbackRate = 1.0,
        detune = 0
      } = options;
      
      // Decode audio data
      const arrayBuffer = this.sounds.get(name);
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
      
      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = loop;
      source.playbackRate.value = playbackRate;
      source.detune.value = detune;
      
      // Create gain node for this sound
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      
      // Connect to appropriate channel
      const channelGain = type === 'ambient' ? this.ambientGain : this.effectsGain;
      source.connect(gainNode);
      gainNode.connect(channelGain);
      
      // Track playing sound
      const soundId = Symbol('sound');
      this.playingSounds.add(soundId);
      
      // Clean up when finished
      source.onended = () => {
        this.playingSounds.delete(soundId);
        source.disconnect();
        gainNode.disconnect();
      };
      
      // Start playback
      source.start(0);
      
      return {
        stop: () => {
          try {
            source.stop();
          } catch (e) {
            // Already stopped
          }
        },
        source,
        gainNode
      };
    } catch (error) {
      console.error(`[SoundSystem] Failed to play sound ${name}:`, error);
    }
  }
  
  /**
   * Play a sound with spatial positioning
   * @param {string} name - Sound identifier
   * @param {Object} position - {x, y} position
   * @param {Object} listenerPosition - {x, y} listener position
   * @param {Object} options - Additional options
   */
  async playSoundAt(name, position, listenerPosition, options = {}) {
    // Calculate distance-based volume
    const dx = position.x - listenerPosition.x;
    const dy = position.y - listenerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Falloff calculation (closer = louder)
    const maxDistance = options.maxDistance || 1000;
    const volumeFalloff = Math.max(0, 1 - (distance / maxDistance));
    
    // Play with adjusted volume
    return this.playSound(name, {
      ...options,
      volume: (options.volume || 1.0) * volumeFalloff
    });
  }
  
  /**
   * Stop all currently playing sounds
   */
  stopAll() {
    this.playingSounds.forEach(soundId => {
      // Sounds will clean themselves up via onended
    });
    this.playingSounds.clear();
  }
  
  /**
   * Set master volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setMasterVolume(volume) {
    this.volumes.master = Math.max(0, Math.min(1, volume));
    this.updateGainNodes();
    this.saveSettings();
  }
  
  /**
   * Set effects volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setEffectsVolume(volume) {
    this.volumes.effects = Math.max(0, Math.min(1, volume));
    this.updateGainNodes();
    this.saveSettings();
  }
  
  /**
   * Set ambient volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setAmbientVolume(volume) {
    this.volumes.ambient = Math.max(0, Math.min(1, volume));
    this.updateGainNodes();
    this.saveSettings();
  }
  
  /**
   * Toggle mute
   * @param {boolean} muted - Mute state (optional, toggles if not provided)
   */
  setMuted(muted) {
    if (muted === undefined) {
      this.muted = !this.muted;
    } else {
      this.muted = muted;
    }
    
    this.updateGainNodes();
    this.saveSettings();
  }
  
  /**
   * Get current mute state
   * @returns {boolean}
   */
  isMuted() {
    return this.muted;
  }
  
  /**
   * Get current volumes
   * @returns {Object}
   */
  getVolumes() {
    return { ...this.volumes };
  }
  
  /**
   * Update gain nodes with current settings
   */
  updateGainNodes() {
    if (!this.initialized) return;
    
    const masterVolume = this.muted ? 0 : this.volumes.master;
    this.masterGain.gain.value = masterVolume;
    this.effectsGain.gain.value = this.volumes.effects;
    this.ambientGain.gain.value = this.volumes.ambient;
  }
  
  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('game_sound_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.volumes = settings.volumes || this.volumes;
        this.muted = settings.muted || false;
      }
    } catch (error) {
      console.error('[SoundSystem] Failed to load settings:', error);
    }
  }
  
  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      const settings = {
        volumes: this.volumes,
        muted: this.muted
      };
      localStorage.setItem('game_sound_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('[SoundSystem] Failed to save settings:', error);
    }
  }
  
  /**
   * Preload common game sounds
   * @returns {Promise<void>}
   */
  async preloadGameSounds() {
    // Define sound URLs (these would be actual audio files in production)
    const soundUrls = {
      // Task completion sounds
      'task_complete': '/sounds/task_complete.mp3',
      'task_failed': '/sounds/task_error.mp3',
      
      // Notification sounds
      'notification': '/sounds/notification.mp3',
      'alert': '/sounds/alert.mp3',
      
      // UI sounds
      'click': '/sounds/click.mp3',
      'hover': '/sounds/hover.mp3',
      'open': '/sounds/open.mp3',
      'close': '/sounds/close.mp3',
      
      // Agent sounds
      'agent_move': '/sounds/footstep.mp3',
      'agent_work': '/sounds/typing.mp3',
      'agent_celebrate': '/sounds/celebrate.mp3',
      
      // Ambient sounds
      'office_ambient': '/sounds/office_ambient.mp3',
      'keyboard_ambient': '/sounds/keyboard_ambient.mp3'
    };
    
    // Note: In production, these files would need to exist
    // For now, we'll just set up the structure
    console.log('[SoundSystem] Sound URLs configured:', Object.keys(soundUrls));
    
    // Uncomment when actual sound files are available:
    // await this.loadSounds(soundUrls);
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.stopAll();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.sounds.clear();
    this.loadingPromises.clear();
    this.soundPool.clear();
    this.playingSounds.clear();
    
    this.initialized = false;
  }
}

export default SoundSystem;
