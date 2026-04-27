/**
 * Performance Monitoring Utilities
 * Tracks Core Web Vitals and other performance metrics
 */

/**
 * Report Web Vitals to analytics
 * @param {object} metric - Web Vital metric object
 */
export const reportWebVitals = (metric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}:`, metric.value, metric);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
};

/**
 * Measure page load performance
 */
export const measurePageLoad = () => {
  if (!window.performance || !window.performance.timing) {
    return null;
  }

  const timing = window.performance.timing;
  const metrics = {
    // DNS lookup time
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    // TCP connection time
    tcp: timing.connectEnd - timing.connectStart,
    // Time to first byte
    ttfb: timing.responseStart - timing.requestStart,
    // DOM content loaded
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    // Full page load
    pageLoad: timing.loadEventEnd - timing.navigationStart,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[Performance Metrics]', metrics);
  }

  return metrics;
};

/**
 * Measure component render time
 * @param {string} componentName - Name of the component
 * @param {function} callback - Function to measure
 */
export const measureRender = (componentName, callback) => {
  const startTime = performance.now();
  const result = callback();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (process.env.NODE_ENV === 'development' && duration > 16) {
    // Warn if render takes longer than 1 frame (16ms at 60fps)
    console.warn(`[Slow Render] ${componentName}: ${duration.toFixed(2)}ms`);
  }

  return result;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get connection speed
 */
export const getConnectionSpeed = () => {
  if (!navigator.connection) {
    return 'unknown';
  }

  const connection = navigator.connection;
  const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
  
  return {
    effectiveType,
    downlink: connection.downlink, // Mbps
    rtt: connection.rtt, // Round trip time in ms
    saveData: connection.saveData, // User has data saver enabled
  };
};

/**
 * Optimize images based on connection speed
 */
export const shouldLoadHighQualityImages = () => {
  const connection = getConnectionSpeed();
  
  if (connection === 'unknown') {
    return true; // Default to high quality
  }

  // Don't load high quality on slow connections or data saver mode
  if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    return false;
  }

  return true;
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Request idle callback wrapper with fallback
 */
export const requestIdleCallback = (callback, options = {}) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  // Fallback for browsers that don't support requestIdleCallback
  return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 1);
};

/**
 * Cancel idle callback wrapper with fallback
 */
export const cancelIdleCallback = (id) => {
  if ('cancelIdleCallback' in window) {
    return window.cancelIdleCallback(id);
  }
  return clearTimeout(id);
};

export default {
  reportWebVitals,
  measurePageLoad,
  measureRender,
  prefersReducedMotion,
  getConnectionSpeed,
  shouldLoadHighQualityImages,
  debounce,
  throttle,
  requestIdleCallback,
  cancelIdleCallback,
};
