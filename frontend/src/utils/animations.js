// Professional Animation Utilities with Motion (Framer Motion)
// Based on 2024 best practices for micro-interactions and UI animations

// Animation variants for common patterns
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Hover and tap animations for interactive elements
export const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2, ease: 'easeOut' }
};

export const buttonTap = {
  scale: 0.95
};

// Card hover effect
export const cardHover = {
  y: -8,
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  transition: { duration: 0.3, ease: 'easeOut' }
};

// Smooth spring transition
export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
};

// Smooth ease transition
export const easeTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] // Custom cubic-bezier for smooth motion
};

// Page transition
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeInOut' }
};

// Scroll reveal animation
export const scrollReveal = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

// Number counter animation helper
export const animateNumber = (from, to, duration = 2000, onUpdate) => {
  const startTime = Date.now();
  const animate = () => {
    const now = Date.now();
    const progress = Math.min((now - startTime) / duration, 1);
    
    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = from + (to - from) * easeOutQuart;
    
    onUpdate(current);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

// Micro-interaction presets
export const microInteractions = {
  // Button press feedback
  buttonPress: {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.02 },
    transition: springTransition
  },
  
  // Icon bounce
  iconBounce: {
    whileHover: { 
      scale: 1.2,
      rotate: [0, -10, 10, -10, 0],
      transition: { duration: 0.5 }
    }
  },
  
  // Smooth lift on hover
  lift: {
    whileHover: { 
      y: -4,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  },
  
  // Pulse effect
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },
  
  // Shake effect (for errors)
  shake: {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    }
  }
};

// Accessibility-friendly reduced motion variants
export const getAccessibleVariant = (variant, prefersReducedMotion) => {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }
    };
  }
  return variant;
};
