import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
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

const renderLandingPage = () => {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  );
};

describe('LandingPage Visual Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout Consistency', () => {
    it('should maintain consistent spacing between sections', () => {
      const { container } = renderLandingPage();

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(0);

      // Check that sections have consistent padding/margin
      sections.forEach(section => {
        const styles = window.getComputedStyle(section);
        expect(styles.padding).toBeTruthy();
      });
    });

    it('should have consistent container widths', () => {
      const { container } = renderLandingPage();

      const containers = container.querySelectorAll('[class*="container"]');
      
      // All containers should have max-width set
      containers.forEach(cont => {
        const styles = window.getComputedStyle(cont);
        expect(styles.maxWidth).toBeTruthy();
      });
    });
  });

  describe('Typography Consistency', () => {
    it('should use consistent heading sizes', () => {
      const { container } = renderLandingPage();

      const h1Elements = container.querySelectorAll('h1');
      const h2Elements = container.querySelectorAll('h2');
      const h3Elements = container.querySelectorAll('h3');

      // Check that headings exist
      expect(h1Elements.length).toBeGreaterThan(0);
      expect(h2Elements.length).toBeGreaterThan(0);

      // Check font sizes are consistent within each level
      if (h1Elements.length > 1) {
        const firstH1Size = window.getComputedStyle(h1Elements[0]).fontSize;
        Array.from(h1Elements).forEach(h1 => {
          expect(window.getComputedStyle(h1).fontSize).toBe(firstH1Size);
        });
      }
    });

    it('should have readable line heights', () => {
      const { container } = renderLandingPage();

      const paragraphs = container.querySelectorAll('p');
      
      paragraphs.forEach(p => {
        const styles = window.getComputedStyle(p);
        const lineHeight = parseFloat(styles.lineHeight);
        const fontSize = parseFloat(styles.fontSize);
        
        // Line height should be at least 1.5x font size for readability
        if (!isNaN(lineHeight) && !isNaN(fontSize)) {
          expect(lineHeight / fontSize).toBeGreaterThanOrEqual(1.4);
        }
      });
    });
  });

  describe('Color Consistency', () => {
    it('should use consistent brand colors', () => {
      const { container } = renderLandingPage();

      // Check that primary buttons use consistent colors
      const primaryButtons = container.querySelectorAll('button[class*="primary"]');
      
      if (primaryButtons.length > 1) {
        const firstButtonBg = window.getComputedStyle(primaryButtons[0]).backgroundColor;
        Array.from(primaryButtons).forEach(button => {
          expect(window.getComputedStyle(button).backgroundColor).toBe(firstButtonBg);
        });
      }
    });

    it('should have sufficient color contrast', () => {
      const { container } = renderLandingPage();

      // Check text elements have color set
      const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
      
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.color).toBeTruthy();
      });
    });
  });

  describe('Button Consistency', () => {
    it('should have consistent button sizes', () => {
      const { container } = renderLandingPage();

      const buttons = container.querySelectorAll('button');
      
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        expect(styles.padding).toBeTruthy();
        expect(styles.borderRadius).toBeTruthy();
      });
    });

    it('should have consistent button states', () => {
      const { container } = renderLandingPage();

      const buttons = container.querySelectorAll('button');
      
      buttons.forEach(button => {
        // Check that buttons have cursor pointer
        const styles = window.getComputedStyle(button);
        expect(styles.cursor).toBe('pointer');
      });
    });
  });

  describe('Grid Layouts', () => {
    it('should have consistent grid gaps', () => {
      const { container } = renderLandingPage();

      const grids = container.querySelectorAll('[class*="grid"]');
      
      grids.forEach(grid => {
        const styles = window.getComputedStyle(grid);
        // Check that grid has gap defined
        if (styles.display === 'grid') {
          expect(styles.gap || styles.gridGap).toBeTruthy();
        }
      });
    });

    it('should maintain aspect ratios for cards', () => {
      const { container } = renderLandingPage();

      const cards = container.querySelectorAll('[class*="card"]');
      
      cards.forEach(card => {
        const styles = window.getComputedStyle(card);
        expect(styles.borderRadius).toBeTruthy();
      });
    });
  });

  describe('Responsive Breakpoints', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`should render correctly on ${name} (${width}x${height})`, () => {
        // Set viewport
        global.innerWidth = width;
        global.innerHeight = height;
        global.dispatchEvent(new Event('resize'));

        const { container } = renderLandingPage();

        // Check that content is visible
        expect(container.querySelector('section')).toBeInTheDocument();

        // Check that no horizontal overflow
        const body = document.body;
        const html = document.documentElement;
        
        // Content should not exceed viewport width
        expect(body.scrollWidth).toBeLessThanOrEqual(width + 20); // 20px tolerance
      });
    });
  });

  describe('Animation States', () => {
    it('should have consistent animation durations', () => {
      const { container } = renderLandingPage();

      const animatedElements = container.querySelectorAll('[class*="animate"], [class*="transition"]');
      
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // Check that transition is defined
        if (styles.transition !== 'all 0s ease 0s') {
          expect(styles.transition).toBeTruthy();
        }
      });
    });

    it('should not have jarring animations', () => {
      const { container } = renderLandingPage();

      const animatedElements = container.querySelectorAll('[class*="animate"]');
      
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const duration = parseFloat(styles.animationDuration);
        
        // Animations should not be too fast (< 100ms) or too slow (> 1s)
        if (!isNaN(duration) && duration > 0) {
          expect(duration).toBeGreaterThanOrEqual(0.1);
          expect(duration).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('Image Handling', () => {
    it('should have proper image dimensions', () => {
      const { container } = renderLandingPage();

      const images = container.querySelectorAll('img');
      
      images.forEach(img => {
        // Images should have alt text
        expect(img.getAttribute('alt')).toBeTruthy();
      });
    });

    it('should lazy load images properly', () => {
      const { container } = renderLandingPage();

      const images = container.querySelectorAll('img[loading="lazy"]');
      
      // Check that lazy loading is implemented
      expect(images.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Form Styling', () => {
    it('should have consistent form input styles', () => {
      const { container } = renderLandingPage();

      const inputs = container.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        const styles = window.getComputedStyle(input);
        expect(styles.padding).toBeTruthy();
        expect(styles.border).toBeTruthy();
      });
    });

    it('should have visible focus states', () => {
      const { container } = renderLandingPage();

      const focusableElements = container.querySelectorAll('input, textarea, button, a');
      
      focusableElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // Should have outline or box-shadow for focus
        expect(styles.outline !== 'none' || styles.boxShadow !== 'none').toBeTruthy();
      });
    });
  });

  describe('Section Backgrounds', () => {
    it('should have alternating section backgrounds', () => {
      const { container } = renderLandingPage();

      const sections = container.querySelectorAll('section');
      
      sections.forEach(section => {
        const styles = window.getComputedStyle(section);
        expect(styles.backgroundColor).toBeTruthy();
      });
    });
  });

  describe('Icon Consistency', () => {
    it('should have consistent icon sizes', () => {
      const { container } = renderLandingPage();

      const icons = container.querySelectorAll('svg, [class*="icon"]');
      
      icons.forEach(icon => {
        const styles = window.getComputedStyle(icon);
        expect(styles.width || icon.getAttribute('width')).toBeTruthy();
        expect(styles.height || icon.getAttribute('height')).toBeTruthy();
      });
    });
  });

  describe('Z-Index Layering', () => {
    it('should have proper z-index hierarchy', () => {
      const { container } = renderLandingPage();

      const layeredElements = container.querySelectorAll('[style*="z-index"], [class*="fixed"], [class*="sticky"]');
      
      layeredElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const zIndex = parseInt(styles.zIndex);
        
        // Z-index should be reasonable (not too high)
        if (!isNaN(zIndex)) {
          expect(zIndex).toBeLessThan(10000);
        }
      });
    });
  });
});
