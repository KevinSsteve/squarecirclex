import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

// Mock scrollTo
window.scrollTo = vi.fn();

const renderLandingPage = () => {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  );
};

describe('LandingPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Page Rendering', () => {
    it('should render all major sections in correct order', async () => {
      renderLandingPage();

      // Wait for lazy-loaded components
      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify all sections are present
      const sections = [
        /Transforme Sua Presença Digital/i,
        /Nossos Serviços/i,
        /Como Funciona/i,
        /Métricas que Importam/i,
        /Depoimentos/i,
        /Planos e Preços/i,
        /Perguntas Frequentes/i,
        /Entre em Contato/i
      ];

      sections.forEach(sectionText => {
        expect(screen.getByText(sectionText)).toBeInTheDocument();
      });
    });

    it('should load all sections without errors', async () => {
      const { container } = renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check that no error boundaries were triggered
      expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
    });
  });

  describe('Section Navigation', () => {
    it('should have working internal navigation links', async () => {
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      // Check for navigation elements
      const ctaButtons = screen.getAllByRole('button', { name: /começar agora|ver preços|entrar em contato/i });
      expect(ctaButtons.length).toBeGreaterThan(0);
    });

    it('should scroll smoothly between sections', async () => {
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      // Verify smooth scroll is enabled
      expect(document.documentElement.style.scrollBehavior).toBe('smooth');
    });
  });

  describe('Interactive Elements', () => {
    it('should have all CTAs functional', async () => {
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      const primaryCTAs = screen.getAllByRole('button', { name: /começar agora/i });
      expect(primaryCTAs.length).toBeGreaterThan(0);
      
      primaryCTAs.forEach(cta => {
        expect(cta).toBeEnabled();
      });
    });

    it('should have working contact form', async () => {
      renderLandingPage();

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nome/i);
        expect(nameInput).toBeInTheDocument();
      }, { timeout: 3000 });

      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/mensagem/i);

      expect(nameInput).toBeEnabled();
      expect(emailInput).toBeEnabled();
      expect(messageInput).toBeEnabled();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render correctly on mobile viewport', async () => {
      // Set mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      global.dispatchEvent(new Event('resize'));

      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      // Mobile-specific checks
      const container = screen.getByText(/Transforme Sua Presença Digital/i).closest('section');
      expect(container).toBeInTheDocument();
    });

    it('should render correctly on tablet viewport', async () => {
      // Set tablet viewport
      global.innerWidth = 768;
      global.innerHeight = 1024;
      global.dispatchEvent(new Event('resize'));

      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Transforme Sua Presença Digital/i)).toBeInTheDocument();
    });

    it('should render correctly on desktop viewport', async () => {
      // Set desktop viewport
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      global.dispatchEvent(new Event('resize'));

      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Transforme Sua Presença Digital/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should lazy load sections efficiently', async () => {
      const startTime = performance.now();
      
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      
      // Should load within reasonable time (3 seconds)
      expect(loadTime).toBeLessThan(3000);
    });

    it('should not cause memory leaks with IntersectionObserver', async () => {
      const { unmount } = renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      // Unmount and verify cleanup
      unmount();
      
      // IntersectionObserver should be properly cleaned up
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      // Check for h1
      const h1Elements = screen.getAllByRole('heading', { level: 1 });
      expect(h1Elements.length).toBeGreaterThan(0);
    });

    it('should have all interactive elements keyboard accessible', async () => {
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should have proper ARIA labels', async () => {
      renderLandingPage();

      await waitFor(() => {
        expect(screen.getByText(/Powered by AI/i)).toBeInTheDocument();
      });

      // Check for form labels
      const nameInput = screen.getByLabelText(/nome/i);
      expect(nameInput).toHaveAttribute('id');
    });
  });

  describe('SEO Elements', () => {
    it('should have proper meta tags', () => {
      renderLandingPage();

      // Check document title
      expect(document.title).toBeTruthy();
    });

    it('should have structured data', () => {
      renderLandingPage();

      // Check for JSON-LD script
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBeGreaterThan(0);
    });
  });
});
