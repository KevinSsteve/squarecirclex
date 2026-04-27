import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-triggered animations using IntersectionObserver
 * @param {Object} options - IntersectionObserver options
 * @param {boolean} triggerOnce - Whether animation should trigger only once (default: true)
 * @returns {Object} - { ref, isVisible }
 */
export const useScrollAnimation = (options = {}, triggerOnce = true) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      ...options,
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!triggerOnce || !hasTriggered.current) {
          setIsVisible(true);
          hasTriggered.current = true;
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    }, defaultOptions);

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [options.threshold, options.rootMargin, triggerOnce]);

  return { ref, isVisible };
};

/**
 * Hook for staggered animations (cascade effect)
 * @param {number} index - Index of the element in the list
 * @param {number} delay - Base delay in milliseconds (default: 100)
 * @returns {Object} - { ref, isVisible, style }
 */
export const useStaggeredAnimation = (index, delay = 100) => {
  const { ref, isVisible } = useScrollAnimation();
  
  const style = {
    transitionDelay: isVisible ? `${index * delay}ms` : '0ms',
  };

  return { ref, isVisible, style };
};

/**
 * Hook for smooth scroll to element
 * @returns {Function} - scrollToElement function
 */
export const useSmoothScroll = () => {
  const scrollToElement = (elementId, offset = 80) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  };

  return scrollToElement;
};

/**
 * Hook for parallax effect
 * @param {number} speed - Parallax speed (0-1, default: 0.5)
 * @returns {Object} - { ref, transform }
 */
export const useParallax = (speed = 0.5) => {
  const ref = useRef(null);
  const [transform, setTransform] = useState('translateY(0px)');

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const element = ref.current;
      const rect = element.getBoundingClientRect();
      const scrolled = window.pageYOffset;
      const elementTop = rect.top + scrolled;
      const windowHeight = window.innerHeight;

      // Only apply parallax when element is in viewport
      if (scrolled + windowHeight > elementTop && scrolled < elementTop + rect.height) {
        const offset = (scrolled - elementTop) * speed;
        setTransform(`translateY(${offset}px)`);
      }
    };

    // Use requestAnimationFrame for better performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);

  return { ref, transform };
};

export default useScrollAnimation;
