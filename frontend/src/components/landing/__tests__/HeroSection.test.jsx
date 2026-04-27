import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HeroSection from '../HeroSection';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('HeroSection Component', () => {
  it('renders hero section', () => {
    renderWithRouter(<HeroSection />);
    expect(screen.getByText(/Transforme Sua Presença Digital/i)).toBeInTheDocument();
  });

  it('renders badge', () => {
    renderWithRouter(<HeroSection />);
    expect(screen.getByText(/Powered by AI & AWS/i)).toBeInTheDocument();
  });

  it('renders headline', () => {
    renderWithRouter(<HeroSection />);
    expect(screen.getByText(/Transforme Sua Presença Digital/i)).toBeInTheDocument();
  });

  it('renders subheadline', () => {
    renderWithRouter(<HeroSection />);
    expect(screen.getByText(/Gestão inteligente de redes sociais/i)).toBeInTheDocument();
  });

  it('renders primary CTA', () => {
    renderWithRouter(<HeroSection />);
    expect(screen.getByText(/Começar Agora/i)).toBeInTheDocument();
  });

  it('renders secondary CTA', () => {
    renderWithRouter(<HeroSection />);
    expect(screen.getByText(/Ver Preços/i)).toBeInTheDocument();
  });

  it('primary CTA links to signup', () => {
    renderWithRouter(<HeroSection />);
    const primaryCTA = screen.getByText(/Começar Agora/i);
    expect(primaryCTA).toHaveAttribute('href', '/signup');
  });

  it('secondary CTA scrolls to pricing section', () => {
    renderWithRouter(<HeroSection />);
    const secondaryCTA = screen.getByText(/Ver Preços/i);
    expect(secondaryCTA).toBeInTheDocument();
  });
});
