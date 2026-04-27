import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProcessStep from '../ProcessStep';

describe('ProcessStep Component', () => {
  const mockStep = {
    number: '01',
    title: 'Test Step',
    description: 'Test step description'
  };

  it('renders process step', () => {
    render(<ProcessStep {...mockStep} />);
    expect(screen.getByText('Test Step')).toBeInTheDocument();
  });

  it('renders step number', () => {
    render(<ProcessStep {...mockStep} />);
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  it('renders step title', () => {
    render(<ProcessStep {...mockStep} />);
    expect(screen.getByText('Test Step')).toBeInTheDocument();
  });

  it('renders step description', () => {
    render(<ProcessStep {...mockStep} />);
    expect(screen.getByText('Test step description')).toBeInTheDocument();
  });

  it('applies animation delay based on index', () => {
    const { container } = render(<ProcessStep {...mockStep} index={1} />);
    const step = container.firstChild;
    expect(step).toHaveStyle({ animationDelay: '0.2s' });
  });
});
