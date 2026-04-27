import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricsSection from '../MetricsSection';

describe('MetricsSection Component', () => {
  it('renders metrics section', () => {
    render(<MetricsSection />);
    expect(screen.getByText(/Resultados Comprovados/i)).toBeInTheDocument();
  });

  it('renders all 6 metrics', () => {
    render(<MetricsSection />);
    expect(screen.getByText('10K+')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
    expect(screen.getByText('3x')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
  });

  it('renders metric labels', () => {
    render(<MetricsSection />);
    expect(screen.getByText(/Posts Gerados/i)).toBeInTheDocument();
    expect(screen.getByText(/Taxa de Satisfação/i)).toBeInTheDocument();
    expect(screen.getByText(/Clientes Ativos/i)).toBeInTheDocument();
    expect(screen.getByText(/Suporte Disponível/i)).toBeInTheDocument();
    expect(screen.getByText(/Aumento de Engajamento/i)).toBeInTheDocument();
    expect(screen.getByText(/Uptime Garantido/i)).toBeInTheDocument();
  });

  it('renders metric numbers', () => {
    render(<MetricsSection />);
    expect(screen.getByText('001')).toBeInTheDocument();
    expect(screen.getByText('002')).toBeInTheDocument();
    expect(screen.getByText('003')).toBeInTheDocument();
    expect(screen.getByText('004')).toBeInTheDocument();
    expect(screen.getByText('005')).toBeInTheDocument();
    expect(screen.getByText('006')).toBeInTheDocument();
  });
});
