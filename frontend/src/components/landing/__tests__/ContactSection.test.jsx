import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactSection from '../ContactSection';

describe('ContactSection Component', () => {
  it('renders contact section', () => {
    render(<ContactSection />);
    expect(screen.getByText(/Entre em Contato/i)).toBeInTheDocument();
  });

  it('renders contact form', () => {
    render(<ContactSection />);
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('renders contact information', () => {
    render(<ContactSection />);
    // Check for email or phone contact info
    expect(screen.getByText(/contato@/i) || screen.getByText(/@/i)).toBeInTheDocument();
  });

  it('renders location information', () => {
    render(<ContactSection />);
    expect(screen.getByText(/Brasil/i) || screen.getByText(/São Paulo/i)).toBeInTheDocument();
  });
});
