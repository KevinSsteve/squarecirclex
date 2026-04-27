import { useEffect, useState } from 'react';

/**
 * Hook to detect keyboard vs mouse navigation
 * Adds appropriate classes to body for focus styling
 */
export const useKeyboardNavigation = () => {
  useEffect(() => {
    let isKeyboard = false;

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        isKeyboard = true;
        document.body.classList.add('keyboard-nav');
        document.body.classList.remove('mouse-nav');
      }
    };

    const handleMouseDown = () => {
      if (isKeyboard) {
        isKeyboard = false;
        document.body.classList.add('mouse-nav');
        document.body.classList.remove('keyboard-nav');
      }
    };

    // Initialize with mouse-nav
    document.body.classList.add('mouse-nav');

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};

/**
 * Hook to manage focus trap for modals/dialogs
 * @param {boolean} isOpen - Whether the modal is open
 * @param {React.RefObject} containerRef - Ref to the modal container
 */
export const useFocusTrap = (isOpen, containerRef) => {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        // Trigger close callback if provided
        const closeButton = container.querySelector('[data-close-modal]');
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    // Focus first element when modal opens
    firstElement?.focus();

    // Add event listeners
    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, containerRef]);
};

/**
 * Hook to announce content changes to screen readers
 * @returns {Function} announce - Function to announce messages
 */
export const useScreenReaderAnnounce = () => {
  const [announcer, setAnnouncer] = useState(null);

  useEffect(() => {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);

    setAnnouncer(liveRegion);

    return () => {
      document.body.removeChild(liveRegion);
    };
  }, []);

  const announce = (message, priority = 'polite') => {
    if (!announcer) return;

    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  };

  return announce;
};

/**
 * Hook to manage accordion accessibility
 * @param {string} id - Unique ID for the accordion
 * @returns {Object} - Accessibility props for accordion
 */
export const useAccordion = (id, isExpanded) => {
  const buttonProps = {
    'aria-expanded': isExpanded,
    'aria-controls': `${id}-content`,
    id: `${id}-button`,
  };

  const contentProps = {
    id: `${id}-content`,
    'aria-labelledby': `${id}-button`,
    role: 'region',
  };

  return { buttonProps, contentProps };
};

/**
 * Hook to manage carousel accessibility
 * @param {number} currentIndex - Current slide index
 * @param {number} totalSlides - Total number of slides
 * @returns {Object} - Accessibility props for carousel
 */
export const useCarousel = (currentIndex, totalSlides) => {
  const containerProps = {
    role: 'region',
    'aria-roledescription': 'carousel',
    'aria-label': 'Testimonials carousel',
  };

  const slideProps = (index) => ({
    role: 'group',
    'aria-roledescription': 'slide',
    'aria-label': `${index + 1} of ${totalSlides}`,
    'aria-hidden': index !== currentIndex,
  });

  const prevButtonProps = {
    'aria-label': 'Previous slide',
    'aria-controls': 'carousel-slides',
  };

  const nextButtonProps = {
    'aria-label': 'Next slide',
    'aria-controls': 'carousel-slides',
  };

  const dotProps = (index) => ({
    'aria-label': `Go to slide ${index + 1}`,
    'aria-current': index === currentIndex ? 'true' : 'false',
  });

  return {
    containerProps,
    slideProps,
    prevButtonProps,
    nextButtonProps,
    dotProps,
  };
};

/**
 * Hook to detect user's motion preference
 * @returns {boolean} - Whether user prefers reduced motion
 */
export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook to detect user's contrast preference
 * @returns {string} - 'high', 'low', or 'normal'
 */
export const usePrefersContrast = () => {
  const [contrast, setContrast] = useState('normal');

  useEffect(() => {
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const lowContrastQuery = window.matchMedia('(prefers-contrast: low)');

    const updateContrast = () => {
      if (highContrastQuery.matches) {
        setContrast('high');
      } else if (lowContrastQuery.matches) {
        setContrast('low');
      } else {
        setContrast('normal');
      }
    };

    updateContrast();

    highContrastQuery.addEventListener('change', updateContrast);
    lowContrastQuery.addEventListener('change', updateContrast);

    return () => {
      highContrastQuery.removeEventListener('change', updateContrast);
      lowContrastQuery.removeEventListener('change', updateContrast);
    };
  }, []);

  return contrast;
};

export default {
  useKeyboardNavigation,
  useFocusTrap,
  useScreenReaderAnnounce,
  useAccordion,
  useCarousel,
  usePrefersReducedMotion,
  usePrefersContrast,
};
