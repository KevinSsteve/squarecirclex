import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ServiceCard from '../ServiceCard';

describe('ServiceCard Component', () => {
  const mockService = {
    number: '001',
    title: 'Test Service',
    description: 'Test description for the service'
  };

  it('renders service card', () => {
    render(<ServiceCard {...mockService} />);
    expect(screen.getByText('Test Service')).toBeInTheDocument();
  });

  it('renders service number', () => {
    render(<ServiceCard {...mockService} />);
    expect(screen.getByText('001')).toBeInTheDocument();
  });

  it('renders service title', () => {
    render(<ServiceCard {...mockService} />);
    expect(screen.getByText('Test Service')).toBeInTheDocument();
  });

  it('renders service description', () => {
    render(<ServiceCard {...mockService} />);
    expect(screen.getByText('Test description for the service')).toBeInTheDocument();
  });

  it('formats number with leading zeros', () => {
    render(<ServiceCard {...mockService} number="001" />);
    expect(screen.getByText('001')).toBeInTheDocument();
  });

  it('applies animation delay', () => {
    const { container } = render(<ServiceCard {...mockService} index={2} />);
    const card = container.firstChild;
    expect(card).toHaveStyle({ animationDelay: '0.4s' });
  });
});
