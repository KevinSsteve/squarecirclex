import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TestimonialsSection from '../TestimonialsSection';

describe('TestimonialsSection Component', () => {
  it('renders testimonials section', () => {
    render(<TestimonialsSection />);
    expect(screen.getByText(/O Que Dizem Nossos Clientes/i)).toBeInTheDocument();
  });

  it('renders testimonial content', () => {
    render(<TestimonialsSection />);
    // Check for at least one testimonial quote
    const testimonials = screen.getAllByText(/revolucionou|transformou|economizei|aumentou|facilitou|profissional/i);
    expect(testimonials.length).toBeGreaterThan(0);
  });

  it('renders testimonial authors', () => {
    render(<TestimonialsSection />);
    // Check for author names
    expect(screen.getByText(/Maria Silva/i)).toBeInTheDocument();
  });

  it('renders carousel navigation', () => {
    const { container } = render(<TestimonialsSection />);
    // Check for navigation dots or arrows
    const navigation = container.querySelector('[class*="navigation"]') || 
                      container.querySelector('[class*="carousel"]');
    expect(navigation).toBeInTheDocument();
  });
});
