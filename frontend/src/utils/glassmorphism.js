// Glassmorphism 2.0 Utilities (2026 Design Trends)
// High-contrast glass effects with adaptive translucency

import { colors } from '../styles/designSystem';

/**
 * Generate glassmorphism styles for cards and containers
 * Based on 2026 design trends with high-contrast and accessibility
 */
export const glassEffect = {
  // Light mode glass effect
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px) saturate(180%)',
    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
    border: `1px solid ${colors.gray[200]}`,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
  },
  
  // Dark mode glass effect
  dark: {
    background: 'rgba(17, 24, 39, 0.7)',
    backdropFilter: 'blur(10px) saturate(180%)',
    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
    border: `1px solid ${colors.gray[700]}`,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },
  
  // Subtle glass effect (less blur)
  subtle: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(5px) saturate(150%)',
    WebkitBackdropFilter: 'blur(5px) saturate(150%)',
    border: `1px solid ${colors.gray[200]}`,
    boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.05)',
  },
  
  // Strong glass effect (more blur)
  strong: {
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(20px) saturate(200%)',
    WebkitBackdropFilter: 'blur(20px) saturate(200%)',
    border: `1px solid ${colors.gray[300]}`,
    boxShadow: '0 12px 48px 0 rgba(0, 0, 0, 0.12)',
  },
};

/**
 * Frosted glass effect (Apple-style)
 */
export const frostedGlass = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid rgba(255, 255, 255, 0.18)`,
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
};

/**
 * Adaptive glass effect based on theme
 */
export const adaptiveGlass = (isDark = false) => {
  return isDark ? glassEffect.dark : glassEffect.light;
};

/**
 * Glass card with hover effect
 */
export const glassCard = {
  base: {
    ...glassEffect.light,
    borderRadius: '16px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  hover: {
    background: 'rgba(255, 255, 255, 0.85)',
    boxShadow: '0 12px 48px 0 rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-4px)',
  },
};

/**
 * Glass button effect
 */
export const glassButton = {
  background: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: `1px solid rgba(255, 255, 255, 0.3)`,
  boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease',
};

/**
 * Glass navigation bar
 */
export const glassNav = {
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderBottom: `1px solid ${colors.gray[200]}`,
  boxShadow: '0 2px 16px 0 rgba(0, 0, 0, 0.06)',
};

/**
 * Check if browser supports backdrop-filter
 */
export const supportsBackdropFilter = () => {
  if (typeof window === 'undefined') return false;
  return CSS.supports('backdrop-filter', 'blur(1px)') || 
         CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
};

/**
 * Get glass effect with fallback for unsupported browsers
 */
export const getGlassWithFallback = (glassStyle) => {
  if (!supportsBackdropFilter()) {
    // Fallback: solid background without blur
    return {
      background: colors.white,
      border: glassStyle.border,
      boxShadow: glassStyle.boxShadow,
    };
  }
  return glassStyle;
};

export default {
  glassEffect,
  frostedGlass,
  adaptiveGlass,
  glassCard,
  glassButton,
  glassNav,
  supportsBackdropFilter,
  getGlassWithFallback,
};
