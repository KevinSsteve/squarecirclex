import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PricingCard from '../PricingCard';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PricingCard Component', () => {
  const mockPlan = {
    name: 'Test Plan',
    price: 99,
    period: 'mês',
    description: 'Test plan description',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    popular: false
  };

  it('renders pricing card', () => {
    renderWithRouter(<PricingCard {...mockPlan} />);
    expect(screen.getByText('Test Plan')).toBeInTheDocument();
  });

  it('renders plan name', () => {
    renderWithRouter(<PricingCard {...mockPlan} />);
    expect(screen.getByText('Test Plan')).toBeInTheDocument();
  });

  it('renders plan price', () => {
    renderWithRouter(<PricingCard {...mockPlan} />);
    expect(screen.getByText(/R\$ 99/i)).toBeInTheDocument();
  });

  it('renders plan period', () => {
    renderWithRouter(<PricingCard {...mockPlan} />);
    expect(screen.getByText(/\/mês/i)).toBeInTheDocument();
  });

  it('renders plan description', () => {
    renderWithRouter(<PricingCard {...mockPlan} />);
    expect(screen.getByText('Test plan description')).toBeInTheDocument();
  });

  it('renders all features', () => {
    renderWithRouter(<PricingCard {...mockPlan} />);
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Feature 3')).toBeInTheDocument();
  });

  it('renders CTA button', () => {
    renderWithRouter(<PricingCard {...mockPlan} />);
    expect(screen.getByText(/Começar Agora/i)).toBeInTheDocument();
  });

  it('shows popular badge when popular is true', () => {
    renderWithRouter(<PricingCard {...mockPlan} popular={true} />);
    expect(screen.getByText(/Mais Popular/i)).toBeInTheDocument();
  });

  it('does not show popular badge when popular is false', () => {
    renderWithRouter(<PricingCard {...mockPlan} popular={false} />);
    expect(screen.queryByText(/Mais Popular/i)).not.toBeInTheDocument();
  });

  it('applies popular styling when popular is true', () => {
    const { container } = renderWithRouter(<PricingCard {...mockPlan} popular={true} />);
    const card = container.firstChild;
    expect(card).toHaveClass('border-black');
  });
});
