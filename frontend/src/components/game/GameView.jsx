import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as PIXI from 'pixi.js';
import { api } from '../../config/api';
import Scene from './Scene';
import UIOverlay from './ui/UIOverlay';
import ContextMenuManager from './ui/ContextMenuManager';
import LoadingScreen from './ui/LoadingScreen';
import ErrorNotificationPanel from './ui/ErrorNotificationPanel';
import DevModeBanner from './ui/DevModeBanner';
import AssetLoader from './utils/AssetLoader';
import viewToggle, { ViewMode } from './utils/ViewToggle';
import { createAgent, AgentType, AgentState } from './entities/index.js';
import { registerAgentAnimations, loadPlaceholderTextures } from './animations/index.js';
import { GameErrorBoundary, UIErrorBoundary } from './errors/index.js';
import { getLayoutForDepartment, getFurnitureType } from './layout/FurnitureLayout.js';

/**
 * GameView Component - V4 with PixiJS and Entity System
 * 
 * A real-time visualization of the AI company using PixiJS rendering engine.
 * Displays an interactive office environment with AI agents performing tasks.
 * 
 * V4 Features:
 * - PixiJS WebGL rendering engine
 * - Isometric office layout
 * - Multiple agent types and departments
 * - Advanced animations and effects
 * - Camera controls (pan, zoom)
 * - FPS monitoring
 * - Real-time backend synchronization
 * 
 * Phase 1 Implementation:
 * - PixiJS setup with WebGL renderer
 * - Basic scene management
 * - Isometric office layout
 * - Camera controls
 * - UI overlay structure
 * 
 * Phase 2 Implementation (Tasks 7-9):
 * - Entity component system
 * - Entity registry
 * - Component-based agent entities
 * - AgentEntity with state machine
 */
const GameView = () => {
  const navigate = useNavigate();
  
  // Container reference for PixiJS app
  const containerRef = useRef(null);
  
  // PixiJS application instance
  const appRef = useRef(null);
  
  // Scene instance
  const sceneRef = useRef(null);
  
  // Agent state: 'idle' | 'working'
  const [agentState, setAgentState] = useState('idle');
  
  // Show success animation flag
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Current task being processed
  const [currentTask, setCurrentTask] = useState(null);
  
  // Connection status: 'connected' | 'disconnected' | 'error' | 'auth_required'
  const [connectionStatus, setConnectionStatus] = useState('connected');
  
  // Track consecutive errors for connection status
  const [errorCount, setErrorCount] = useState(0);
  
  // Retry trigger for manual retry
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // FPS counter for performance monitoring
  const [fps, setFps] = useState(60);
  
  // Track last task ID to detect completion
  const lastTaskIdRef = useRef(null);
  
  // Asset loading state (Phase 9, Task 57)
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading assets...');
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const assetLoaderRef = useRef(null);
  
  // View toggle state (Phase 10, Task 64)
  const [gameLoadFailed, setGameLoadFailed] = useState(false);

  // View Toggle Effect removed - direct access without checks

  /**
   * Backend Polling Effect - TEMPORARILY DISABLED FOR PUBLIC ACCESS
   * 
   * Fetches posts from the backend every 3 seconds to check for:
   * - Posts currently generating (agent should be working)
   * - Completed posts (show success animation)
   * - Connection errors (update status indicator)
   * 
   * Enhanced with ErrorRecoverySystem integration (Phase 10, Task 60)
   * Implements circuit breaker with exponential backoff (Game View 502 Fix)
   * Enhanced with authentication checks (Task 1.3)
   * 
   * TODO: Re-enable when authentication is properly handled
   */
  // Backend polling - fetch posts with circuit breaker
  useEffect(() => {
    // DISABLED: Skip backend polling for public access
    console.log('[GameView] Backend polling disabled for public access');
    return;
    
    /* ORIGINAL CODE - COMMENTED OUT
    
    let timeoutId = null;
    let consecutiveErrors = 0;
    let currentDelay = 3000;
    const MAX_ERRORS = 5;
    const BASE_DELAY = 3000;
    const MAX_DELAY = 30000;
    
    const fetchPosts = async () => {
      try {
        const response = await api.getPosts();
        
        // Validate response structure
        if (!response || !response.data) {
          throw new Error('Invalid response structure');
        }
        
        const posts = Array.isArray(response.data?.posts) ? response.data.posts : [];

        // Connection successful - reset error count and clear degradation
        consecutiveErrors = 0;
        currentDelay = BASE_DELAY;
        setConnectionStatus('connected');
        setErrorCount(0);
        
        // Clear degradation mode if active
        if (sceneRef.current) {
          const errorRecoverySystem = sceneRef.current.getErrorRecoverySystem();
          if (errorRecoverySystem) {
            errorRecoverySystem.clearDegradation();
          }
        }

        // Check if any post is currently generating
        const generatingPost = posts.find(post => post?.status === 'generating');

        if (generatingPost) {
          // Agent is working
          setAgentState('working');
          setCurrentTask(generatingPost);
          setShowSuccess(false);
        } else {
          // Check if we just finished a task
          const wasWorking = agentState === 'working';
          const previousTaskId = lastTaskIdRef.current;

          if (wasWorking && previousTaskId) {
            // Task completed - show success animation
            setAgentState('idle');
            setShowSuccess(true);
            setCurrentTask(null);

            // Return to normal idle after 2 seconds
            setTimeout(() => {
              setShowSuccess(false);
              lastTaskIdRef.current = null;
            }, 2000);
          } else {
            // Normal idle state
            setAgentState('idle');
            setCurrentTask(null);
          }
        }

        // Track the current task ID
        if (generatingPost) {
          lastTaskIdRef.current = generatingPost.id;
        }
        
        // Schedule next poll if not at max errors
        if (consecutiveErrors < MAX_ERRORS) {
          timeoutId = setTimeout(fetchPosts, currentDelay);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        
        consecutiveErrors++;
        
        // Use ErrorRecoverySystem to handle the error
        if (sceneRef.current) {
          const errorRecoverySystem = sceneRef.current.getErrorRecoverySystem();
          if (errorRecoverySystem) {
            errorRecoverySystem.handleError(error, {
              operationId: 'backend-polling',
              operation: 'fetchPosts',
              retryFunction: fetchPosts
            });
          }
        }
        
        // Update UI state
        setErrorCount(consecutiveErrors);
        
        if (consecutiveErrors >= MAX_ERRORS) {
          // Stop polling after max errors
          setConnectionStatus('error');
          console.warn(`[GameView] Backend polling stopped after ${MAX_ERRORS} consecutive errors`);
          // Don't schedule next poll - user must manually retry
        } else {
          // Exponential backoff
          currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
          setConnectionStatus('disconnected');
          
          console.log(`[GameView] Retrying in ${currentDelay}ms (attempt ${consecutiveErrors}/${MAX_ERRORS})`);
          
          // Schedule next poll with backoff delay
          timeoutId = setTimeout(fetchPosts, currentDelay);
        }
        
        // Keep current state (don't crash the UI)
        // Agent continues showing last known state
      }
    };

    // Initial fetch
    fetchPosts();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    */ // END COMMENTED CODE
  }, [agentState, retryTrigger]); // Re-run when agentState or retryTrigger changes

  /**
   * PixiJS Initialization Effect
   * 
   * Sets up the PixiJS application with WebGL renderer.
   * Creates the game canvas and initializes the render loop.
   * Implements FPS counter for performance monitoring.
   * Initializes Scene management system.
   * Implements asset loading with progress tracking (Phase 9, Task 57).
   * Integrates ViewToggle for progressive enhancement (Phase 10, Task 64).
   */
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Start load timeout (Phase 10, Task 64)
    viewToggle.startLoadTimeout();
    
    // Get performance settings based on device capabilities (Phase 10, Task 64)
    const perfSettings = viewToggle.getPerformanceSettings();
    console.log('[GameView] Performance settings:', perfSettings);
    
    // Initialize asset loader (Phase 9, Task 57)
    const assetLoader = new AssetLoader();
    assetLoaderRef.current = assetLoader;
    
    // Register critical assets (must load before game starts)
    assetLoader.registerCriticalAssets([
      // Note: In a real implementation, these would be actual asset files
      // For now, we're using placeholder textures generated in code
      { id: 'agent-sprites', type: 'spritesheet', url: '/assets/sprites/agents.png', definitionUrl: '/assets/sprites/agents.json' },
      { id: 'furniture-sprites', type: 'image', url: '/assets/sprites/furniture.png' },
      { id: 'ui-icons', type: 'image', url: '/assets/ui/icons.png' }
    ]);
    
    // Register non-critical assets (lazy loaded in background)
    assetLoader.registerNonCriticalAssets([
      { id: 'particle-textures', type: 'image', url: '/assets/effects/particles.png' },
      { id: 'sound-effects', type: 'audio', url: '/assets/sounds/effects.mp3' }
    ]);
    
    // Setup progress callback
    assetLoader.onProgress((progress) => {
      setLoadingProgress(progress);
      
      if (progress < 50) {
        setLoadingMessage('Loading critical assets...');
      } else if (progress < 100) {
        setLoadingMessage('Loading additional assets...');
      } else {
        setLoadingMessage('Ready!');
      }
    });
    
    // Setup critical complete callback
    assetLoader.onCriticalComplete(() => {
      console.log('Critical assets loaded - starting game');
      setAssetsLoaded(true);
    });
    
    // Setup complete callback
    assetLoader.onComplete(() => {
      console.log('All assets loaded');
    });
    
    // Setup error callback
    assetLoader.onError((error) => {
      console.error('Asset loading error:', error);
      setLoadingMessage('Error loading assets. Using fallback...');
      // Continue anyway with placeholder assets
      setAssetsLoaded(true);
    });

    // Create PixiJS application
    const app = new PIXI.Application();
    
    // Store cleanup function for camera controls
    let cleanupCameraControls = null;
    
    // Store cleanup function for resize listener
    let cleanupResize = null;
    
    // Store cleanup function for degradation listeners
    let cleanupDegradationListeners = null;
    
    // Initialize the application
    (async () => {
      try {
        // Start asset loading (non-blocking for critical assets)
        // In a real implementation, this would load actual files
        // For now, we'll simulate loading and use placeholder textures
        try {
          // Note: Since we're using placeholder textures, we'll skip actual loading
          // and just mark as complete after a short delay
          setTimeout(() => {
            setLoadingProgress(100);
            setLoadingMessage('Ready!');
            setAssetsLoaded(true);
            
            // Clear load timeout - game loaded successfully (Phase 10, Task 64)
            viewToggle.clearLoadTimeout();
          }, 1000);
          
          // await assetLoader.load(); // Uncomment when real assets are available
        } catch (error) {
          console.error('Failed to load assets:', error);
          // Continue with placeholder assets
          setAssetsLoaded(true);
          
          // Clear load timeout even on asset error (Phase 10, Task 64)
          viewToggle.clearLoadTimeout();
        }
      
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0xF3F4F6,
        antialias: perfSettings.enableShadows, // Use performance settings (Phase 10, Task 64)
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        // Sprite batching configuration (Phase 9, Task 54)
        // PixiJS v7+ has automatic batching enabled by default
        // These settings optimize batch rendering performance
        preference: 'webgl', // Prefer WebGL for better batching
        powerPreference: 'high-performance', // Request high-performance GPU
      });

      // Add canvas to container (check if container still exists)
      if (!containerRef.current) {
        console.warn('[GameView] Container ref is null, cannot add canvas');
        app.destroy(true);
        return;
      }
      
      containerRef.current.appendChild(app.canvas);
      
      // Store app reference
      appRef.current = app;

      // Handle window resize
      const handleResize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      
      // Store cleanup function
      cleanupResize = () => {
        window.removeEventListener('resize', handleResize);
      };

      // Create Scene management system
      const scene = new Scene(app);
      sceneRef.current = scene;
      
      // Get ErrorRecoverySystem
      const errorRecoverySystem = scene.getErrorRecoverySystem();
      
      // Setup degradation event listeners (Phase 10, Task 60)
      const handleDegradation = (event) => {
        const { mode, action } = event.detail;
        
        console.log(`[GameView] Degradation event: mode=${mode}, action=${action}`);
        
        switch (action) {
          case 'pause_animations':
            // Pause animations when connection lost
            console.log('[GameView] Pausing animations due to connection loss');
            // Animation system will handle this internally
            break;
            
          case 'use_cached_state':
            // Continue with cached state when sync fails
            console.log('[GameView] Using cached state due to sync failure');
            // StateSyncSystem will handle this internally
            break;
            
          case 'fallback_to_traditional':
            // Fallback to traditional UI on critical error
            console.log('[GameView] Falling back to traditional UI');
            handleFallbackToTraditional();
            break;
            
          case 'resume_normal':
            // Resume normal operation after recovery
            console.log('[GameView] Resuming normal operation');
            setConnectionStatus('connected');
            break;
            
          default:
            console.warn('[GameView] Unknown degradation action:', action);
        }
      };
      
      // Setup manual retry event listener (Phase 10, Task 60)
      const handleManualRetry = (event) => {
        const { operationId } = event.detail;
        
        console.log(`[GameView] Manual retry requested for operation: ${operationId}`);
        
        if (errorRecoverySystem) {
          errorRecoverySystem.manualRetry(operationId);
        }
      };
      
      window.addEventListener('game:degradation', handleDegradation);
      window.addEventListener('game:manualRetry', handleManualRetry);
      
      // Store cleanup function
      cleanupDegradationListeners = () => {
        window.removeEventListener('game:degradation', handleDegradation);
        window.removeEventListener('game:manualRetry', handleManualRetry);
      };
      
      // Load placeholder textures for agent animations
      loadPlaceholderTextures(app);
      
      // Register agent animations with the animation system
      const animationSystem = scene.getAnimationSystem();
      registerAgentAnimations(animationSystem);

      // Set up camera controls
      cleanupCameraControls = setupCameraControls(app.canvas, scene);

      // Draw isometric office layout on background layer
      drawOfficeLayout(scene);

      // Create agent entity using entity system (Phase 2)
      // Now async for character sprite loading (Phase 3, Task 3.3)
      const agentEntity = await createAgentEntity(scene);

      // FPS counter
      let lastTime = performance.now();
      let frameCount = 0;
      let fpsUpdateTime = 0;

      // Render loop
      app.ticker.add(() => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        frameCount++;
        fpsUpdateTime += deltaTime;

        // Update FPS every second
        if (fpsUpdateTime >= 1000) {
          setFps(Math.round(frameCount * 1000 / fpsUpdateTime));
          frameCount = 0;
          fpsUpdateTime = 0;
        }

        // Update scene (camera smoothing, entity updates)
        scene.update(deltaTime);
        
        // Update agent visuals (direction, animation, sprite frame) - Phase 3, Task 3.3
        const entityRegistry = scene.getEntityRegistry();
        const agent = entityRegistry.getEntity(agentEntity);
        if (agent) {
          agent.updateVisuals(deltaTime);
        }

        // Update agent visual based on state
        updateAgentEntity(scene, agentEntity, agentState, showSuccess);
      });
      } catch (error) {
        console.error('[GameView] Failed to initialize game:', error);
        
        // Handle load failure (Phase 10, Task 64)
        viewToggle.handleLoadFailure('initialization');
        
        // Fallback to traditional view
        handleFallbackToTraditional();
      }
    })();

    // Cleanup
    return () => {
      // Clear load timeout (Phase 10, Task 64)
      viewToggle.clearLoadTimeout();
      
      // Remove degradation event listeners
      if (cleanupDegradationListeners) {
        cleanupDegradationListeners();
      }
      
      // Remove resize listener
      if (cleanupResize) {
        cleanupResize();
      }
      
      // Cleanup camera controls
      if (cleanupCameraControls) {
        cleanupCameraControls();
      }
      
      if (sceneRef.current) {
        sceneRef.current.destroy();
        sceneRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
      
      // Clear asset loader
      if (assetLoaderRef.current) {
        assetLoaderRef.current.clearCache();
        assetLoaderRef.current = null;
      }
    };
  }, []); // Only run once on mount

  /**
   * Agent State Update Effect
   * 
   * Updates the agent visual when state changes.
   */
  useEffect(() => {
    // Agent state updates are handled in the render loop
  }, [agentState, showSuccess]);

  /**
   * Set up camera controls
   * Handles mouse and keyboard input for camera pan and zoom
   * Enhanced with inertia, cursor changes, and touch support (Phase 6, Task 35)
   * @param {HTMLCanvasElement} canvas - The game canvas
   * @param {Scene} scene - The scene management system
   */
  const setupCameraControls = (canvas, scene) => {
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let lastMousePos = { x: 0, y: 0 };
    
    // Inertia state (Phase 6, Task 35)
    let velocity = { x: 0, y: 0 };
    let lastMoveTime = 0;
    let inertiaAnimationId = null;
    
    // Touch state (Phase 6, Task 35)
    let touchStartDistance = 0;
    let touchStartZoom = 1.0;
    let isTouching = false;
    
    // Deceleration constants (Phase 6, Task 35)
    const FRICTION = 0.92; // Deceleration factor (0-1, lower = more friction)
    const MIN_VELOCITY = 0.1; // Stop when velocity is below this threshold
    const VELOCITY_SCALE = 0.3; // Scale factor for velocity calculation
    
    /**
     * Apply inertia animation with smooth deceleration
     */
    const applyInertia = () => {
      // Apply friction to velocity
      velocity.x *= FRICTION;
      velocity.y *= FRICTION;
      
      // Stop if velocity is too small
      if (Math.abs(velocity.x) < MIN_VELOCITY && Math.abs(velocity.y) < MIN_VELOCITY) {
        velocity = { x: 0, y: 0 };
        inertiaAnimationId = null;
        return;
      }
      
      // Apply velocity to camera
      scene.panCamera(velocity.x, velocity.y);
      
      // Continue animation
      inertiaAnimationId = requestAnimationFrame(applyInertia);
    };
    
    /**
     * Stop inertia animation
     */
    const stopInertia = () => {
      if (inertiaAnimationId) {
        cancelAnimationFrame(inertiaAnimationId);
        inertiaAnimationId = null;
      }
      velocity = { x: 0, y: 0 };
    };
    
    // Mouse wheel zoom
    const handleWheel = (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      scene.zoomCamera(zoomDelta);
      // Save camera preferences after mouse wheel zoom (Phase 10, Task 63)
      scene.saveCameraPreferences();
    };
    
    // Middle mouse button pan (drag)
    const handleMouseDown = (e) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        lastMousePos = { x: e.clientX, y: e.clientY };
        lastMoveTime = performance.now();
        
        // Stop any ongoing inertia
        stopInertia();
        
        // Change cursor to grabbing
        canvas.style.cursor = 'grabbing';
      }
    };
    
    const handleMouseMove = (e) => {
      // Update cursor when hovering (not panning)
      if (!isPanning && e.button !== 1) {
        canvas.style.cursor = 'grab';
      }
      
      if (isPanning) {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastMoveTime;
        
        const dx = (lastMousePos.x - e.clientX) / scene.camera.zoom;
        const dy = (lastMousePos.y - e.clientY) / scene.camera.zoom;
        
        scene.panCamera(dx, dy);
        
        // Calculate velocity for inertia (only if enough time has passed)
        if (deltaTime > 0) {
          velocity.x = dx * VELOCITY_SCALE;
          velocity.y = dy * VELOCITY_SCALE;
        }
        
        lastMousePos = { x: e.clientX, y: e.clientY };
        lastMoveTime = currentTime;
      }
    };
    
    const handleMouseUp = (e) => {
      if (e.button === 1) { // Middle mouse button
        isPanning = false;
        canvas.style.cursor = 'grab';
        
        // Start inertia animation if velocity is significant
        if (Math.abs(velocity.x) > MIN_VELOCITY || Math.abs(velocity.y) > MIN_VELOCITY) {
          applyInertia();
        }
        
        // Save camera preferences after mouse pan (Phase 10, Task 63)
        scene.saveCameraPreferences();
      }
    };
    
    const handleMouseLeave = () => {
      if (isPanning) {
        isPanning = false;
        canvas.style.cursor = 'default';
        
        // Start inertia animation if velocity is significant
        if (Math.abs(velocity.x) > MIN_VELOCITY || Math.abs(velocity.y) > MIN_VELOCITY) {
          applyInertia();
        }
        
        // Save camera preferences after mouse pan (Phase 10, Task 63)
        scene.saveCameraPreferences();
      }
    };
    
    const handleMouseEnter = () => {
      // Set grab cursor when entering canvas
      if (!isPanning) {
        canvas.style.cursor = 'grab';
      }
    };
    
    // Touch gesture support (Phase 6, Task 35)
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        // Single touch - pan
        e.preventDefault();
        isTouching = true;
        const touch = e.touches[0];
        panStart = { x: touch.clientX, y: touch.clientY };
        lastMousePos = { x: touch.clientX, y: touch.clientY };
        lastMoveTime = performance.now();
        
        // Stop any ongoing inertia
        stopInertia();
      } else if (e.touches.length === 2) {
        // Two finger touch - zoom
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        touchStartDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        touchStartZoom = scene.camera.zoom;
      }
    };
    
    const handleTouchMove = (e) => {
      if (e.touches.length === 1 && isTouching) {
        // Single touch - pan
        e.preventDefault();
        const currentTime = performance.now();
        const deltaTime = currentTime - lastMoveTime;
        
        const touch = e.touches[0];
        const dx = (lastMousePos.x - touch.clientX) / scene.camera.zoom;
        const dy = (lastMousePos.y - touch.clientY) / scene.camera.zoom;
        
        scene.panCamera(dx, dy);
        
        // Calculate velocity for inertia
        if (deltaTime > 0) {
          velocity.x = dx * VELOCITY_SCALE;
          velocity.y = dy * VELOCITY_SCALE;
        }
        
        lastMousePos = { x: touch.clientX, y: touch.clientY };
        lastMoveTime = currentTime;
      } else if (e.touches.length === 2) {
        // Two finger touch - zoom (pinch)
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        // Calculate zoom based on distance change
        const zoomFactor = currentDistance / touchStartDistance;
        const newZoom = touchStartZoom * zoomFactor;
        scene.setCameraZoom(newZoom);
      }
    };
    
    const handleTouchEnd = (e) => {
      if (e.touches.length === 0) {
        isTouching = false;
        
        // Start inertia animation if velocity is significant
        if (Math.abs(velocity.x) > MIN_VELOCITY || Math.abs(velocity.y) > MIN_VELOCITY) {
          applyInertia();
        }
        
        // Save camera preferences after touch pan (Phase 10, Task 63)
        scene.saveCameraPreferences();
      }
    };
    
    // Keyboard controls
    const handleKeyDown = (e) => {
      const panSpeed = 20;
      const zoomSpeed = 0.1;
      
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          scene.panCamera(0, -panSpeed);
          // Save camera preferences after keyboard pan (Phase 10, Task 63)
          scene.saveCameraPreferences();
          break;
        case 'ArrowDown':
          e.preventDefault();
          scene.panCamera(0, panSpeed);
          // Save camera preferences after keyboard pan (Phase 10, Task 63)
          scene.saveCameraPreferences();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          scene.panCamera(-panSpeed, 0);
          // Save camera preferences after keyboard pan (Phase 10, Task 63)
          scene.saveCameraPreferences();
          break;
        case 'ArrowRight':
          e.preventDefault();
          scene.panCamera(panSpeed, 0);
          // Save camera preferences after keyboard pan (Phase 10, Task 63)
          scene.saveCameraPreferences();
          break;
        case '+':
        case '=':
          e.preventDefault();
          scene.zoomCamera(zoomSpeed);
          // Save camera preferences after keyboard zoom (Phase 10, Task 63)
          scene.saveCameraPreferences();
          break;
        case '-':
        case '_':
          e.preventDefault();
          scene.zoomCamera(-zoomSpeed);
          // Save camera preferences after keyboard zoom (Phase 10, Task 63)
          scene.saveCameraPreferences();
          break;
        case 'Home':
          e.preventDefault();
          scene.resetCamera();
          break;
        default:
          break;
      }
    };
    
    // Add event listeners
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    
    // Touch event listeners (Phase 6, Task 35)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Set initial cursor
    canvas.style.cursor = 'grab';
    
    // Cleanup function
    return () => {
      // Stop inertia animation
      stopInertia();
      
      // Remove event listeners
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      
      // Reset cursor
      canvas.style.cursor = 'default';
    };
  };

  /**
   * Isometric Projection Utilities
   * Converts grid coordinates to isometric screen coordinates
   * Uses 30-degree angle and 2:1 ratio as per requirements
   */
  const GRID_SIZE = 64; // pixels per grid cell
  const ISO_ANGLE = 30; // degrees
  const ISO_RATIO = 2; // width:height ratio

  /**
   * Convert grid coordinates to isometric screen coordinates
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {{x: number, y: number}} Screen coordinates
   */
  const gridToIso = (gridX, gridY) => {
    // Isometric projection formula
    // x_screen = (gridX - gridY) * (GRID_SIZE / 2)
    // y_screen = (gridX + gridY) * (GRID_SIZE / 4)
    const x = (gridX - gridY) * (GRID_SIZE / ISO_RATIO);
    const y = (gridX + gridY) * (GRID_SIZE / (ISO_RATIO * 2));
    return { x, y };
  };

  /**
   * Draw an isometric rectangle (department)
   * @param {PIXI.Graphics} graphics - Graphics object to draw on
   * @param {number} gridX - Grid X position
   * @param {number} gridY - Grid Y position
   * @param {number} gridWidth - Width in grid cells
   * @param {number} gridHeight - Height in grid cells
   * @param {number} color - Fill color
   * @param {number} strokeColor - Stroke color
   */
  const drawIsometricRect = (graphics, gridX, gridY, gridWidth, gridHeight, color, strokeColor) => {
    // Calculate corner points in isometric space
    const topLeft = gridToIso(gridX, gridY);
    const topRight = gridToIso(gridX + gridWidth, gridY);
    const bottomRight = gridToIso(gridX + gridWidth, gridY + gridHeight);
    const bottomLeft = gridToIso(gridX, gridY + gridHeight);

    // Draw the isometric rectangle
    graphics.moveTo(topLeft.x, topLeft.y);
    graphics.lineTo(topRight.x, topRight.y);
    graphics.lineTo(bottomRight.x, bottomRight.y);
    graphics.lineTo(bottomLeft.x, bottomLeft.y);
    graphics.lineTo(topLeft.x, topLeft.y);
    graphics.fill({ color, alpha: 0.2 });
    graphics.stroke({ width: 2, color: strokeColor });

    return topLeft; // Return top-left corner for label positioning
  };

  /**
   * Render furniture for a department
   * Uses FurnitureLayout definitions to place furniture items
   * @param {Scene} scene - The scene management system
   * @param {string} departmentId - Department identifier
   * @param {number} offsetX - X offset for positioning
   * @param {number} offsetY - Y offset for positioning
   */
  const renderDepartmentFurniture = (scene, departmentId, offsetX, offsetY) => {
    const furnitureLayout = getLayoutForDepartment(departmentId);
    
    furnitureLayout.forEach(item => {
      const furnitureType = getFurnitureType(item.type);
      
      if (!furnitureType) {
        console.warn(`Unknown furniture type: ${item.type}`);
        return;
      }
      
      // Calculate isometric position
      const pos = gridToIso(item.gridX, item.gridY);
      const x = pos.x + offsetX;
      const y = pos.y + offsetY;
      
      // Create furniture sprite (placeholder using Graphics for now)
      const furniture = new PIXI.Graphics();
      
      // Calculate furniture dimensions in isometric space
      const width = furnitureType.width * (GRID_SIZE / ISO_RATIO);
      const height = furnitureType.height * (GRID_SIZE / (ISO_RATIO * 2));
      
      // Draw furniture as isometric rectangle
      // For now, using simple shapes - will be replaced with sprites in future tasks
      switch (furnitureType.type) {
        case 'desk_simple':
        case 'desk_l_shape':
          // Draw desk as isometric rectangle
          drawFurnitureRect(furniture, 0, 0, width, height, furnitureType.color, 0x654321);
          break;
          
        case 'chair':
          // Draw chair as small circle
          furniture.circle(0, 0, 8);
          furniture.fill({ color: furnitureType.color, alpha: 0.9 });
          furniture.circle(0, 0, 8);
          furniture.stroke({ width: 1, color: 0x2D3748 });
          break;
          
        case 'whiteboard':
        case 'schedule_board':
          // Draw board as thin rectangle
          furniture.rect(-width / 2, -height / 2, width, height);
          furniture.fill({ color: furnitureType.color, alpha: 0.95 });
          furniture.rect(-width / 2, -height / 2, width, height);
          furniture.stroke({ width: 2, color: 0x2D3748 });
          break;
          
        case 'plant_small':
        case 'plant_large':
          // Draw plant as circle with darker center
          const plantRadius = furnitureType.width * 10;
          furniture.circle(0, 0, plantRadius);
          furniture.fill({ color: furnitureType.color, alpha: 0.8 });
          furniture.circle(0, 0, plantRadius * 0.6);
          furniture.fill({ color: 0x2F855A, alpha: 0.9 });
          break;
          
        case 'filing_cabinet':
          // Draw filing cabinet as tall rectangle
          furniture.rect(-width / 2, -height / 2, width, height);
          furniture.fill({ color: furnitureType.color, alpha: 0.9 });
          furniture.rect(-width / 2, -height / 2, width, height);
          furniture.stroke({ width: 1, color: 0x4A5568 });
          // Add drawer lines
          for (let i = 1; i < 3; i++) {
            const drawerY = -height / 2 + (height / 3) * i;
            furniture.moveTo(-width / 2, drawerY);
            furniture.lineTo(width / 2, drawerY);
            furniture.stroke({ width: 1, color: 0x2D3748 });
          }
          break;
          
        case 'bookshelf':
          // Draw bookshelf as rectangle with shelves
          furniture.rect(-width / 2, -height / 2, width, height);
          furniture.fill({ color: furnitureType.color, alpha: 0.9 });
          furniture.rect(-width / 2, -height / 2, width, height);
          furniture.stroke({ width: 1, color: 0x654321 });
          // Add shelf lines
          for (let i = 1; i < 4; i++) {
            const shelfY = -height / 2 + (height / 4) * i;
            furniture.moveTo(-width / 2, shelfY);
            furniture.lineTo(width / 2, shelfY);
            furniture.stroke({ width: 1, color: 0x654321 });
          }
          break;
          
        case 'monitor_stand':
          // Draw monitor as rectangle with stand
          furniture.rect(-width / 2, -height / 2, width, height * 0.7);
          furniture.fill({ color: furnitureType.color, alpha: 0.95 });
          furniture.rect(-width / 2, -height / 2, width, height * 0.7);
          furniture.stroke({ width: 1, color: 0x1A202C });
          // Stand
          furniture.rect(-width / 4, height * 0.2, width / 2, height * 0.3);
          furniture.fill({ color: 0x4A5568, alpha: 0.9 });
          break;
          
        case 'meeting_table':
        case 'coffee_table':
          // Draw table as isometric rectangle
          drawFurnitureRect(furniture, 0, 0, width, height, furnitureType.color, 0x654321);
          break;
          
        case 'water_cooler':
          // Draw water cooler as cylinder
          furniture.circle(0, 0, 10);
          furniture.fill({ color: furnitureType.color, alpha: 0.8 });
          furniture.rect(-8, -5, 16, 10);
          furniture.fill({ color: 0xFFFFFF, alpha: 0.6 });
          furniture.circle(0, 0, 10);
          furniture.stroke({ width: 1, color: 0x2C5282 });
          break;
          
        case 'printer':
          // Draw printer as box
          furniture.rect(-width / 2, -height / 2, width, height);
          furniture.fill({ color: furnitureType.color, alpha: 0.9 });
          furniture.rect(-width / 2, -height / 2, width, height);
          furniture.stroke({ width: 1, color: 0x718096 });
          // Paper tray
          furniture.rect(-width / 3, height / 4, width * 0.6, height / 4);
          furniture.fill({ color: 0xFFFFFF, alpha: 0.8 });
          break;
          
        default:
          // Default: simple rectangle
          drawFurnitureRect(furniture, 0, 0, width, height, furnitureType.color, 0x2D3748);
      }
      
      // Position furniture
      furniture.x = x;
      furniture.y = y;
      
      // Apply rotation if specified
      if (item.rotation) {
        furniture.rotation = (item.rotation * Math.PI) / 180;
      }
      
      // Set zIndex for depth sorting
      furniture.zIndex = y;
      
      // Add to appropriate layer
      const layer = item.layer || furnitureType.defaultLayer;
      scene.addToLayer(layer, furniture);
    });
  };
  
  /**
   * Draw furniture as isometric rectangle
   * Helper function for rendering furniture items
   * @param {PIXI.Graphics} graphics - Graphics object to draw on
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   * @param {number} color - Fill color
   * @param {number} strokeColor - Stroke color
   */
  const drawFurnitureRect = (graphics, centerX, centerY, width, height, color, strokeColor) => {
    // Draw as diamond shape for isometric view
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    graphics.moveTo(centerX, centerY - halfHeight);
    graphics.lineTo(centerX + halfWidth, centerY);
    graphics.lineTo(centerX, centerY + halfHeight);
    graphics.lineTo(centerX - halfWidth, centerY);
    graphics.lineTo(centerX, centerY - halfHeight);
    graphics.fill({ color, alpha: 0.9 });
    
    graphics.moveTo(centerX, centerY - halfHeight);
    graphics.lineTo(centerX + halfWidth, centerY);
    graphics.lineTo(centerX, centerY + halfHeight);
    graphics.lineTo(centerX - halfWidth, centerY);
    graphics.lineTo(centerX, centerY - halfHeight);
    graphics.stroke({ width: 1, color: strokeColor });
  };

  /**
   * Draw the isometric office layout using DepartmentRenderer
   * Creates a complete office environment with 5 departments
   * Uses grid-based coordinate system with isometric projection
   * Enhanced with DepartmentRenderer system (Phase 2, Task 2.4)
   * @param {Scene} scene - The scene management system
   */
  const drawOfficeLayout = (scene) => {
    // Create background
    const background = new PIXI.Graphics();
    background.rect(0, 0, 2000, 1500);
    background.fill({ color: 0xF3F4F6 });
    scene.addToLayer('background', background);

    // Department definitions from design.md
    const departments = [
      {
        id: 'content_creation',
        name: 'Content Creation',
        gridX: 2,
        gridY: 2,
        gridWidth: 6,
        gridHeight: 5,
        color: 0x4F46E5, // Indigo
      },
      {
        id: 'publishing',
        name: 'Publishing',
        gridX: 9,
        gridY: 2,
        gridWidth: 5,
        gridHeight: 5,
        color: 0x10B981, // Green
      },
      {
        id: 'trend_analysis',
        name: 'Trend Analysis',
        gridX: 2,
        gridY: 8,
        gridWidth: 5,
        gridHeight: 5,
        color: 0xF59E0B, // Amber
      },
      {
        id: 'customer_support',
        name: 'Customer Support',
        gridX: 8,
        gridY: 8,
        gridWidth: 6,
        gridHeight: 5,
        color: 0x8B5CF6, // Purple
      },
      {
        id: 'administration',
        name: 'Administration',
        gridX: 15,
        gridY: 2,
        gridWidth: 4,
        gridHeight: 11,
        color: 0x6B7280, // Gray
      },
    ];

    // Use DepartmentRenderer to render all departments
    const departmentRenderer = scene.getDepartmentRenderer();
    if (departmentRenderer) {
      departmentRenderer.renderAll(departments);
      
      // Log rendering statistics
      const stats = departmentRenderer.getStats();
      console.log('[GameView] Department rendering complete:', stats);
    } else {
      console.error('[GameView] DepartmentRenderer not available');
    }

    // Draw grid lines (optional, for debugging)
    const offsetX = 400;
    const offsetY = 200;
    const gridLines = new PIXI.Graphics();
    for (let x = 0; x <= 20; x++) {
      for (let y = 0; y <= 15; y++) {
        const pos = gridToIso(x, y);
        gridLines.circle(pos.x + offsetX, pos.y + offsetY, 2);
        gridLines.fill({ color: 0xD1D5DB, alpha: 0.3 });
      }
    }
    scene.addToLayer('background', gridLines);

    // Draw grid reference lines for better depth perception
    const referenceLines = new PIXI.Graphics();
    
    // Horizontal grid lines
    for (let y = 0; y <= 15; y += 3) {
      const start = gridToIso(0, y);
      const end = gridToIso(20, y);
      referenceLines.moveTo(start.x + offsetX, start.y + offsetY);
      referenceLines.lineTo(end.x + offsetX, end.y + offsetY);
      referenceLines.stroke({ width: 1, color: 0xD1D5DB, alpha: 0.2 });
    }
    
    // Vertical grid lines
    for (let x = 0; x <= 20; x += 3) {
      const start = gridToIso(x, 0);
      const end = gridToIso(x, 15);
      referenceLines.moveTo(start.x + offsetX, start.y + offsetY);
      referenceLines.lineTo(end.x + offsetX, end.y + offsetY);
      referenceLines.stroke({ width: 1, color: 0xD1D5DB, alpha: 0.2 });
    }
    
    scene.addToLayer('background', referenceLines);
  };

  /**
   * Create an agent entity using the AgentEntity class
   * Enhanced with character sprite rendering (Phase 3, Task 3.3)
   * @param {Scene} scene - The scene management system
   * @returns {string} Entity ID
   */
  const createAgentEntity = async (scene) => {
    const entityRegistry = scene.getEntityRegistry();
    
    // Grid position (4, 4) with offset
    const agentGridPos = gridToIso(4, 4);
    const worldX = agentGridPos.x + 400;
    const worldY = agentGridPos.y + 200;
    
    // Create agent using factory function (now async for sprite loading)
    const agent = await createAgent(
      AgentType.CONTENT_GENERATOR,
      { x: worldX, y: worldY, z: 0 },
      'agent-marketing-1',
      scene // Pass scene for shadow creation
    );
    
    // Register agent with entity registry
    entityRegistry.entities.set(agent.id, agent);
    
    // Add to type index
    if (!entityRegistry.entitiesByType.has('agent')) {
      entityRegistry.entitiesByType.set('agent', new Set());
    }
    entityRegistry.entitiesByType.get('agent').add(agent.id);
    
    // Update stats
    entityRegistry.stats.created++;
    entityRegistry.stats.active++;
    
    // Create visual representation with character sprite
    const agentContainer = new PIXI.Container();
    const position = agent.getComponent('position');
    agentContainer.x = position.x;
    agentContainer.y = position.y;

    // Character sprite (replaces circle)
    const spriteTexture = agent.getCurrentSpriteTexture();
    const characterSprite = new PIXI.Sprite(spriteTexture);
    characterSprite.anchor.set(0.5, 0.5);
    characterSprite.scale.set(1.5); // Scale up for visibility
    agentContainer.addChild(characterSprite);

    // Store reference to sprite for animation updates
    agentContainer.characterSprite = characterSprite;

    // Agent label with icon
    const label = new PIXI.Text({
      text: `${agent.getIcon()} ${agent.getDisplayName()}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0x1F2937,
        fontWeight: 'bold'
      }
    });
    label.anchor.set(0.5);
    label.y = 50;
    agentContainer.addChild(label);

    // Status text
    const status = new PIXI.Text({
      text: '😴 Idle',
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        fill: 0x6B7280
      }
    });
    status.anchor.set(0.5);
    status.y = 65;
    agentContainer.addChild(status);
    agentContainer.statusText = status;

    scene.addToLayer('agents', agentContainer);
    
    // Store reference to PIXI container in sprite component
    const spriteComponent = agent.getComponent('sprite');
    spriteComponent.pixiSprite = agentContainer;
    
    // Make agent interactive
    const interactionSystem = scene.getInteractionSystem();
    interactionSystem.makeInteractive(agent, agentContainer);
    
    return agent.id;
  };

  /**
   * Update agent entity visual based on current state
   * Enhanced with character sprite updates (Phase 3, Task 3.3)
   * @param {Scene} scene - The scene management system
   * @param {string} entityId - Entity ID
   * @param {string} state - Agent state ('idle' | 'working')
   * @param {boolean} success - Whether to show success animation
   */
  const updateAgentEntity = (scene, entityId, state, success) => {
    const entityRegistry = scene.getEntityRegistry();
    const agent = entityRegistry.getEntity(entityId);
    
    if (!agent) return;
    
    // Update agent state using state machine
    if (success && agent.canTransitionTo(AgentState.CELEBRATING)) {
      agent.setState(AgentState.CELEBRATING);
    } else if (state === 'working' && agent.canTransitionTo(AgentState.WORKING)) {
      agent.setState(AgentState.WORKING);
    } else if (state === 'idle' && agent.canTransitionTo(AgentState.IDLE)) {
      agent.setState(AgentState.IDLE);
    }
    
    const spriteComponent = agent.getComponent('sprite');
    if (!spriteComponent || !spriteComponent.pixiSprite) return;
    
    const agentContainer = spriteComponent.pixiSprite;
    
    // Update character sprite texture (Phase 3, Task 3.3)
    if (agentContainer.characterSprite) {
      const newTexture = agent.getCurrentSpriteTexture();
      if (newTexture) {
        agentContainer.characterSprite.texture = newTexture;
      }
    }

    // Update status text
    if (agentContainer.statusText) {
      const currentState = agent.getState();
      let statusText = '😴 Idle';
      let statusColor = 0x6B7280;

      if (currentState === AgentState.CELEBRATING) {
        statusText = '✅ Content generated!';
        statusColor = 0x10B981;
      } else if (currentState === AgentState.WORKING) {
        statusText = '💻 Working';
        statusColor = 0x3B82F6;
      }

      agentContainer.statusText.text = statusText;
      agentContainer.statusText.style.fill = statusColor;
    }
  };

  /**
   * Draw an agent sprite (DEPRECATED - replaced by createAgentEntity)
   * Kept for reference during transition
   * @deprecated Use createAgentEntity instead
   */
  const drawAgent = (scene, x, y) => {
    const agentContainer = new PIXI.Container();
    agentContainer.x = x;
    agentContainer.y = y;

    // Agent body (circle)
    const body = new PIXI.Graphics();
    body.circle(0, 0, 30);
    body.fill({ color: 0x6B7280 });
    agentContainer.addChild(body);

    // Store reference to body for animation updates
    agentContainer.body = body;

    // Agent label
    const label = new PIXI.Text({
      text: 'Marketing Agent',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0x1F2937,
        fontWeight: 'bold'
      }
    });
    label.anchor.set(0.5);
    label.y = 50;
    agentContainer.addChild(label);

    // Status text
    const status = new PIXI.Text({
      text: '😴 Idle',
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        fill: 0x6B7280
      }
    });
    status.anchor.set(0.5);
    status.y = 65;
    agentContainer.addChild(status);
    agentContainer.statusText = status;

    scene.addToLayer('agents', agentContainer);
    return agentContainer;
  };

  /**
   * Update agent visual based on current state (DEPRECATED)
   * @deprecated Use updateAgentEntity instead
   */
  const updateAgent = (agent, state, success) => {
    if (!agent || !agent.body) return;

    // Update body color based on state
    agent.body.clear();
    agent.body.circle(0, 0, 30);
    
    if (success) {
      agent.body.fill({ color: 0x10B981 }); // Green for success
    } else if (state === 'working') {
      agent.body.fill({ color: 0x3B82F6 }); // Blue for working
      
      // Add pulsing effect
      const pulse = Math.sin(Date.now() / 500) * 5;
      agent.body.circle(0, 0, 30 + pulse);
      agent.body.stroke({ width: 2, color: 0x3B82F6 });
    } else {
      agent.body.fill({ color: 0x6B7280 }); // Gray for idle
    }

    // Update status text
    if (agent.statusText) {
      let statusText = '😴 Idle';
      let statusColor = 0x6B7280;

      if (success) {
        statusText = '✅ Content generated!';
        statusColor = 0x10B981;
      } else if (state === 'working') {
        statusText = '💻 Working';
        statusColor = 0x3B82F6;
      }

      agent.statusText.text = statusText;
      agent.statusText.style.fill = statusColor;
    }
  };

  // Calculate agent and task counts for UI
  const agentCount = agentState === 'working' ? 1 : 0;
  const taskCount = currentTask ? 1 : 0;

  /**
   * Handle game layer error
   * Logs error and provides fallback option
   */
  const handleGameError = (error, errorInfo) => {
    console.error('Game layer error caught by boundary:', error, errorInfo);
    // Additional error handling could be added here (e.g., analytics)
  };

  /**
   * Handle UI overlay error
   * Logs error but allows game to continue
   */
  const handleUIError = (error, errorInfo) => {
    console.error('UI overlay error caught by boundary:', error, errorInfo);
    // Additional error handling could be added here (e.g., analytics)
  };

  /**
   * Fallback to traditional UI (disabled - direct access mode)
   * Logs error but does not redirect
   */
  const handleFallbackToTraditional = () => {
    console.log('[GameView] Fallback requested but disabled in direct access mode');
    setGameLoadFailed(true);
    // No redirect - stay on game view
  };
  
  /**
   * Handle view toggle button click
   */
  const handleViewToggle = () => {
    console.log('[GameView] View toggle clicked');
    viewToggle.toggleView();
  };
  
  /**
   * Handle manual retry of backend connection
   */
  const handleManualRetry = () => {
    console.log('[GameView] Manual retry requested by user');
    setErrorCount(0);
    setConnectionStatus('connected');
    setRetryTrigger(prev => prev + 1);
  };



  return (
    <GameErrorBoundary
      onError={handleGameError}
      onFallbackToTraditional={handleFallbackToTraditional}
    >
      {/* Development Mode Banner - shown when dev mode is active */}
      <DevModeBanner />
      
      {/* Loading Screen - shown while assets are loading (Phase 9, Task 57) */}
      <LoadingScreen
        progress={loadingProgress}
        message={loadingMessage}
        visible={!assetsLoaded}
      />
      
      {/* Main game canvas - full screen */}
      <div className="fixed inset-0 bg-gray-100">
        <div 
          ref={containerRef}
          className="w-full h-full"
        />
      </div>

      {/* UI Overlay - rendered above canvas using portal */}
      <UIErrorBoundary onError={handleUIError}>
        <UIOverlay
          scene={sceneRef.current}
          fps={fps}
          connectionStatus={connectionStatus}
          agentCount={agentCount}
          taskCount={taskCount}
          onViewToggle={handleViewToggle}
          onManualRetry={handleManualRetry}
        >
          {/* Floating panels will go here in future tasks */}
        </UIOverlay>
        
        {/* Context Menu Manager */}
        <ContextMenuManager scene={sceneRef.current} />
        
        {/* Error Notification Panel (Phase 10, Task 60) */}
        <ErrorNotificationPanel />
      </UIErrorBoundary>
    </GameErrorBoundary>
  );
};

export default GameView;
