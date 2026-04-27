import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PricingSection from '../PricingSection';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PricingSection Component', () => {
  it('renders pricing section', () => {
    renderWithRouter(<PricingSection />);
    expect(screen.getByText(/Planos e Preços/i)).toBeInTheDocument();
  });

  it('renders all 3 pricing plans', () => {
    renderWithRouter(<PricingSection />);
    expect(screen.getByText(/Starter/i)).toBeInTheDocument();
    expect(screen.getByText(/Professional/i)).toBeInTheDocument();
    expect(screen.getByText(/Enterprise/i)).toBeInTheDocument();
  });

  it('renders pricing toggle (monthly/annual)', () => {
    renderWithRouter(<PricingSection />);
    expect(screen.getByText(/Mensal/i)).toBeInTheDocument();
    expect(screen.getByText(/Anual/i)).toBeInTheDocument();
  });

  it('highlights popular plan', () => {
    renderWithRouter(<PricingSection />);
    expect(screen.getByText(/Mais Popular/i)).toBeInTheDocument();
  });

  it('renders CTA buttons for all plans', () => {
    renderWithRouter(<PricingSection />);
    const ctaButtons = screen.getAllByText(/Começar Agora/i);
    expect(ctaButtons).toHaveLength(3);
  });
});
