// AutoAnimate Configuration Utilities
// Zero-config animations for React components (2026 best practices)

/**
 * Default AutoAnimate configuration
 * Respects prefers-reduced-motion and provides smooth animations
 */
export const defaultAutoAnimateConfig = {
  duration: 250,
  easing: 'ease-in-out',
  // Respect user's motion preferences
  disrespectUserMotionPreference: false,
};

/**
 * Fast animation config for quick interactions
 */
export const fastAutoAnimateConfig = {
  duration: 150,
  easing: 'ease-out',
  disrespectUserMotionPreference: false,
};

/**
 * Slow animation config for dramatic effects
 */
export const slowAutoAnimateConfig = {
  duration: 400,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  disrespectUserMotionPreference: false,
};

/**
 * Spring-like animation config
 */
export const springAutoAnimateConfig = {
  duration: 300,
  easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  disrespectUserMotionPreference: false,
};

/**
 * Stagger animation config for lists
 */
export const staggerAutoAnimateConfig = {
  duration: 250,
  easing: 'ease-in-out',
  disrespectUserMotionPreference: false,
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get appropriate config based on user preferences
 */
export const getAccessibleConfig = (config = defaultAutoAnimateConfig) => {
  if (prefersReducedMotion()) {
    return {
      ...config,
      duration: 0, // Instant for reduced motion
    };
  }
  return config;
};

export default {
  default: defaultAutoAnimateConfig,
  fast: fastAutoAnimateConfig,
  slow: slowAutoAnimateConfig,
  spring: springAutoAnimateConfig,
  stagger: staggerAutoAnimateConfig,
  getAccessibleConfig,
  prefersReducedMotion,
};
