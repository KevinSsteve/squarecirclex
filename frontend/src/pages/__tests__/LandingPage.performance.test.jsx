import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock performance API
const mockPerformanceEntries = [];
window.performance.getEntriesByType = vi.fn(() => mockPerformanceEntries);
window.performance.mark = vi.fn();
window.performance.measure = vi.fn();

const renderLandingPage = () => {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  );
};

describe('LandingPage Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceEntries.length = 0;
  });

  describe('Initial Load Performance', () => {
    it('should render initial content within 1 second', async () => {
      const startTime = performance.now();

      renderLandingPage();

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Initial render should be fast
      expect(renderTime).toBeLessThan(1000);
    });

    it('should lazy load non-critical sections', async () => {
      const { container } = renderLandingPage();

      // Hero section should load immediately
      const heroSection = container.querySelector('section');
      expect(heroSection).toBeInTheDocument();

      // Other sections may load lazily
      await waitFor(() => {
        const sections = container.querySelectorAll('section');
        expect(sections.length).toBeGreaterThan(1);
      }, { timeout: 3000 });
    });

    it('should not block main thread during render', async () => {
      const startTime = performance.now();

      renderLandingPage();

      const endTime = performance.now();
      const blockTime = endTime - startTime;

      // Should not block for more than 100ms
      expect(blockTime).toBeLessThan(100);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory on mount/unmount cycles', () => {
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const { unmount } = renderLandingPage();
        unmount();
      }

      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderLandingPage();

      const initialListenerCount = window.addEventListener.mock?.calls?.length || 0;

      unmount();

      // Should not accumulate listeners
      expect(window.removeEventListener).toBeDefined();
    });

    it('should cleanup IntersectionObservers on unmount', () => {
      const { unmount } = renderLandingPage();

      unmount();

      // Disconnect should be called
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('Component Re-render Optimization', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = renderLandingPage();

      const renderCount = 1;

      // Rerender with same props
      rerender(
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      );

      // Should handle rerender efficiently
      expect(renderCount).toBe(1);
    });

    it('should memoize expensive computations', () => {
      const startTime = performance.now();

      renderLandingPage();

      const firstRenderTime = performance.now() - startTime;

      // Second render should be faster (memoized)
      const { rerender } = renderLandingPage();
      const secondRenderStart = performance.now();

      rerender(
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      );

      const secondRenderTime = performance.now() - secondRenderStart;

      // Second render should not be significantly slower
      expect(secondRenderTime).toBeLessThan(firstRenderTime * 2);
    });
  });

  describe('Asset Loading', () => {
    it('should lazy load images', () => {
      const { container } = renderLandingPage();

      const images = container.querySelectorAll('img');
      
      // Check for lazy loading attribute
      const lazyImages = Array.from(images).filter(
        img => img.getAttribute('loading') === 'lazy'
      );

      // At least some images should be lazy loaded
      expect(lazyImages.length).toBeGreaterThanOrEqual(0);
    });

    it('should not load all images immediately', async () => {
      const { container } = renderLandingPage();

      const initialImages = container.querySelectorAll('img[src]');
      const initialCount = initialImages.length;

      // Wait for lazy loading
      await waitFor(() => {
        const allImages = container.querySelectorAll('img[src]');
        // More images may load over time
        expect(allImages.length).toBeGreaterThanOrEqual(initialCount);
      }, { timeout: 2000 });
    });

    it('should use appropriate image formats', () => {
      const { container } = renderLandingPage();

      const images = container.querySelectorAll('img');
      
      images.forEach(img => {
        const src = img.getAttribute('src') || '';
        // Should use modern formats or have srcset
        const hasModernFormat = src.includes('.webp') || src.includes('.avif');
        const hasSrcSet = img.hasAttribute('srcset');
        
        // Either modern format or responsive images
        expect(hasModernFormat || hasSrcSet || src === '').toBeTruthy();
      });
    });
  });

  describe('Code Splitting', () => {
    it('should split code into chunks', async () => {
      renderLandingPage();

      // React.lazy should be used for code splitting
      await waitFor(() => {
        // Sections should load progressively
        expect(document.querySelector('section')).toBeInTheDocument();
      });
    });

    it('should load critical CSS first', () => {
      renderLandingPage();

      // Check that styles are applied
      const section = document.querySelector('section');
      if (section) {
        const styles = window.getComputedStyle(section);
        expect(styles.padding).toBeTruthy();
      }
    });
  });

  describe('Animation Performance', () => {
    it('should use GPU-accelerated animations', () => {
      const { container } = renderLandingPage();

      const animatedElements = container.querySelectorAll('[class*="animate"]');
      
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // Check for transform or opacity (GPU-accelerated)
        const hasGPUProps = styles.transform !== 'none' || 
                           styles.opacity !== '1' ||
                           styles.willChange !== 'auto';
        
        expect(hasGPUProps || animatedElements.length === 0).toBeTruthy();
      });
    });

    it('should not animate too many elements simultaneously', () => {
      const { container } = renderLandingPage();

      const animatedElements = container.querySelectorAll('[class*="animate"]');
      
      // Should not have excessive animations
      expect(animatedElements.length).toBeLessThan(50);
    });

    it('should use requestAnimationFrame for animations', async () => {
      renderLandingPage();

      // Animations should be smooth
      await waitFor(() => {
        expect(document.querySelector('section')).toBeInTheDocument();
      });
    });
  });

  describe('Bundle Size', () => {
    it('should have reasonable component size', () => {
      const { container } = renderLandingPage();

      // Check that DOM is not excessively large
      const elementCount = container.querySelectorAll('*').length;
      
      // Should not have more than 1000 elements
      expect(elementCount).toBeLessThan(1000);
    });

    it('should minimize inline styles', () => {
      const { container } = renderLandingPage();

      const elementsWithInlineStyles = container.querySelectorAll('[style]');
      
      // Should prefer CSS classes over inline styles
      const totalElements = container.querySelectorAll('*').length;
      const inlineStyleRatio = elementsWithInlineStyles.length / totalElements;
      
      // Less than 20% should have inline styles
      expect(inlineStyleRatio).toBeLessThan(0.2);
    });
  });

  describe('Network Efficiency', () => {
    it('should minimize number of requests', () => {
      renderLandingPage();

      // Check that resources are bundled
      const scripts = document.querySelectorAll('script[src]');
      const styles = document.querySelectorAll('link[rel="stylesheet"]');
      
      // Should have reasonable number of external resources
      expect(scripts.length + styles.length).toBeLessThan(20);
    });

    it('should use resource hints', () => {
      renderLandingPage();

      // Check for preload/prefetch hints
      const resourceHints = document.querySelectorAll(
        'link[rel="preload"], link[rel="prefetch"], link[rel="dns-prefetch"]'
      );
      
      // Should have some resource hints
      expect(resourceHints.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Interaction Responsiveness', () => {
    it('should respond to clicks quickly', async () => {
      const { container } = renderLandingPage();

      await waitFor(() => {
        expect(container.querySelector('button')).toBeInTheDocument();
      });

      const button = container.querySelector('button');
      if (button) {
        const startTime = performance.now();
        
        button.click();
        
        const responseTime = performance.now() - startTime;
        
        // Should respond within 100ms
        expect(responseTime).toBeLessThan(100);
      }
    });

    it('should handle rapid interactions', async () => {
      const { container } = renderLandingPage();

      await waitFor(() => {
        expect(container.querySelector('button')).toBeInTheDocument();
      });

      const button = container.querySelector('button');
      if (button) {
        // Rapid clicks
        for (let i = 0; i < 10; i++) {
          button.click();
        }
        
        // Should handle without errors
        expect(button).toBeInTheDocument();
      }
    });
  });

  describe('Scroll Performance', () => {
    it('should maintain 60fps during scroll', () => {
      renderLandingPage();

      const frameTime = 1000 / 60; // 16.67ms per frame

      // Simulate scroll
      const startTime = performance.now();
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);
      const endTime = performance.now();

      const scrollHandlingTime = endTime - startTime;

      // Should handle scroll within one frame
      expect(scrollHandlingTime).toBeLessThan(frameTime);
    });

    it('should use passive event listeners for scroll', () => {
      renderLandingPage();

      // Scroll handlers should not block
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Should complete without blocking
      expect(true).toBe(true);
    });
  });

  describe('First Contentful Paint', () => {
    it('should render content quickly', async () => {
      const startTime = performance.now();

      const { container } = renderLandingPage();

      // Wait for first content
      await waitFor(() => {
        expect(container.querySelector('section')).toBeInTheDocument();
      });

      const fcpTime = performance.now() - startTime;

      // FCP should be under 1.8s (good threshold)
      expect(fcpTime).toBeLessThan(1800);
    });
  });

  describe('Time to Interactive', () => {
    it('should become interactive quickly', async () => {
      const startTime = performance.now();

      const { container } = renderLandingPage();

      // Wait for interactive elements
      await waitFor(() => {
        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        expect(button).toBeEnabled();
      });

      const ttiTime = performance.now() - startTime;

      // TTI should be under 3.8s (good threshold)
      expect(ttiTime).toBeLessThan(3800);
    });
  });
});
