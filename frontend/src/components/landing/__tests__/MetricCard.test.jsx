import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricCard from '../MetricCard';

describe('MetricCard Component', () => {
  const mockMetric = {
    number: '001',
    value: '10K+',
    label: 'Test Metric'
  };

  it('renders metric card', () => {
    render(<MetricCard {...mockMetric} />);
    expect(screen.getByText('10K+')).toBeInTheDocument();
  });

  it('renders metric number', () => {
    render(<MetricCard {...mockMetric} />);
    expect(screen.getByText('001')).toBeInTheDocument();
  });

  it('renders metric value', () => {
    render(<MetricCard {...mockMetric} />);
    expect(screen.getByText('10K+')).toBeInTheDocument();
  });

  it('renders metric label', () => {
    render(<MetricCard {...mockMetric} />);
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
  });

  it('applies animation delay based on index', () => {
    const { container } = render(<MetricCard {...mockMetric} index={2} />);
    const card = container.firstChild;
    expect(card).toHaveStyle({ animationDelay: '0.4s' });
  });
});
