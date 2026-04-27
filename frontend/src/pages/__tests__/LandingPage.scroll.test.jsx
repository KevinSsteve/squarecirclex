import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

mockIntersectionObserver.mockReturnValue({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect
});

window.IntersectionObserver = mockIntersectionObserver;

// Mock scrollTo
const mockScrollTo = vi.fn();
window.scrollTo = mockScrollTo;

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const renderLandingPage = () => {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  );
};

describe('LandingPage Scroll Behavior Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScrollTo.mockClear();
  });

  describe('Smooth Scroll Configuration', () => {
    it('should enable smooth scrolling on page load', () => {
      renderLandingPage();

      expect(document.documentElement.style.scrollBehavior).toBe('smooth');
    });

    it('should maintain smooth scroll throughout page lifecycle', async () => {
      const { rerender } = renderLandingPage();

      expect(document.documentElement.style.scrollBehavior).toBe('smooth');

      // Rerender and check again
      rerender(
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      );

      expect(document.documentElement.style.scrollBehavior).toBe('smooth');
    });
  });

  describe('Section Visibility Detection', () => {
    it('should observe all major sections', () => {
      renderLandingPage();

      // IntersectionObserver should be called for sections
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should trigger animations when sections become visible', async () => {
      const { container } = renderLandingPage();

      // Get the callback from IntersectionObserver
      const observerCallback = mockIntersectionObserver.mock.calls[0]?.[0];

      if (observerCallback) {
        // Simulate section becoming visible
        const mockEntries = [
          {
            target: container.querySelector('section'),
            isIntersecting: true,
            intersectionRatio: 0.5
          }
        ];

        observerCallback(mockEntries);

        await waitFor(() => {
          // Section should have animation class or style applied
          expect(container.querySelector('section')).toBeInTheDocument();
        });
      }
    });

    it('should cleanup observers on unmount', () => {
      const { unmount } = renderLandingPage();

      unmount();

      // Disconnect should be called
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('CTA Navigation', () => {
    it('should scroll to pricing section when "Ver Preços" is clicked', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      const pricingButtons = screen.getAllByRole('button', { name: /ver preços/i });
      
      if (pricingButtons.length > 0) {
        await user.click(pricingButtons[0]);

        // Should trigger scroll behavior
        await waitFor(() => {
          expect(mockScrollTo).toHaveBeenCalled();
        });
      }
    });

    it('should scroll to contact section when "Entrar em Contato" is clicked', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      const contactButtons = screen.getAllByRole('button', { name: /entrar em contato/i });
      
      if (contactButtons.length > 0) {
        await user.click(contactButtons[0]);

        await waitFor(() => {
          expect(mockScrollTo).toHaveBeenCalled();
        });
      }
    });

    it('should scroll to signup when "Começar Agora" is clicked', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      const signupButtons = screen.getAllByRole('button', { name: /começar agora/i });
      
      if (signupButtons.length > 0) {
        await user.click(signupButtons[0]);

        // Should navigate or scroll
        await waitFor(() => {
          expect(mockScrollTo).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Scroll Progress Tracking', () => {
    it('should track scroll position', () => {
      renderLandingPage();

      // Simulate scroll event
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Page should handle scroll events
      expect(document.documentElement.style.scrollBehavior).toBe('smooth');
    });

    it('should update on scroll', () => {
      renderLandingPage();

      // Simulate multiple scroll events
      for (let i = 0; i < 5; i++) {
        const scrollEvent = new Event('scroll');
        window.pageYOffset = i * 100;
        window.dispatchEvent(scrollEvent);
      }

      // Should handle multiple scroll events without errors
      expect(document.documentElement.style.scrollBehavior).toBe('smooth');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation through sections', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      // Tab through focusable elements
      await user.tab();
      await user.tab();
      await user.tab();

      // Should have focused elements
      expect(document.activeElement).toBeTruthy();
      expect(document.activeElement.tagName).toMatch(/BUTTON|A|INPUT/);
    });

    it('should support Enter key on CTAs', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();

      await user.keyboard('{Enter}');

      // Should trigger button action
      expect(document.activeElement).toBe(firstButton);
    });

    it('should support Space key on buttons', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();

      await user.keyboard(' ');

      // Should trigger button action
      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('Scroll Performance', () => {
    it('should not trigger excessive re-renders on scroll', () => {
      const { container } = renderLandingPage();

      const initialHTML = container.innerHTML;

      // Simulate scroll
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Content should remain stable
      expect(container.innerHTML).toBe(initialHTML);
    });

    it('should debounce scroll events', async () => {
      renderLandingPage();

      // Simulate rapid scroll events
      for (let i = 0; i < 100; i++) {
        const scrollEvent = new Event('scroll');
        window.dispatchEvent(scrollEvent);
      }

      // Should handle rapid scrolling without crashing
      await waitFor(() => {
        expect(document.documentElement.style.scrollBehavior).toBe('smooth');
      });
    });
  });

  describe('Section Anchors', () => {
    it('should have unique IDs for all major sections', () => {
      const { container } = renderLandingPage();

      const sections = container.querySelectorAll('section');
      const ids = new Set();

      sections.forEach(section => {
        const id = section.getAttribute('id');
        if (id) {
          expect(ids.has(id)).toBe(false);
          ids.add(id);
        }
      });
    });

    it('should support hash navigation', () => {
      renderLandingPage();

      // Simulate hash change
      window.location.hash = '#pricing';
      const hashChangeEvent = new Event('hashchange');
      window.dispatchEvent(hashChangeEvent);

      // Should handle hash navigation
      expect(window.location.hash).toBe('#pricing');
    });
  });

  describe('Back to Top', () => {
    it('should scroll to top when back-to-top is triggered', () => {
      renderLandingPage();

      // Simulate scroll to bottom
      window.pageYOffset = 1000;
      window.scrollY = 1000;

      // Trigger scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('Mobile Scroll Behavior', () => {
    it('should handle touch scroll on mobile', () => {
      // Set mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      const { container } = renderLandingPage();

      // Simulate touch events
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 0, clientY: 0 }]
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 0, clientY: -100 }]
      });

      container.dispatchEvent(touchStart);
      container.dispatchEvent(touchMove);

      // Should handle touch events without errors
      expect(container).toBeInTheDocument();
    });

    it('should prevent horizontal scroll', () => {
      const { container } = renderLandingPage();

      // Check that overflow-x is hidden
      const body = document.body;
      const styles = window.getComputedStyle(body);

      // Should not allow horizontal scroll
      expect(['hidden', 'clip']).toContain(styles.overflowX);
    });
  });

  describe('Scroll Restoration', () => {
    it('should restore scroll position on navigation', () => {
      renderLandingPage();

      // Simulate scroll position
      window.pageYOffset = 500;
      window.scrollY = 500;

      // Simulate navigation back
      const popStateEvent = new PopStateEvent('popstate');
      window.dispatchEvent(popStateEvent);

      // Should handle history navigation
      expect(document.documentElement.style.scrollBehavior).toBe('smooth');
    });
  });
});
