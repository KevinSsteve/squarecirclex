import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import FAQSection from '../FAQSection';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('FAQSection Component', () => {
  it('renders FAQ section', () => {
    renderWithRouter(<FAQSection />);
    expect(screen.getByText(/Perguntas Frequentes/i)).toBeInTheDocument();
  });

  it('renders all FAQ items', () => {
    renderWithRouter(<FAQSection />);
    // Check for at least some FAQ questions
    const faqItems = screen.getAllByRole('button');
    expect(faqItems.length).toBeGreaterThan(0);
  });

  it('expands FAQ item when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<FAQSection />);
    
    const firstQuestion = screen.getAllByRole('button')[0];
    await user.click(firstQuestion);
    
    // After clicking, the answer should be visible
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
  });

  it('collapses previously expanded item when another is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<FAQSection />);
    
    const buttons = screen.getAllByRole('button');
    const firstQuestion = buttons[0];
    const secondQuestion = buttons[1];
    
    // Expand first
    await user.click(firstQuestion);
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
    
    // Expand second (should collapse first)
    await user.click(secondQuestion);
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'true');
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders CTA button', () => {
    renderWithRouter(<FAQSection />);
    expect(screen.getByText(/Ainda tem dúvidas/i)).toBeInTheDocument();
  });
});
