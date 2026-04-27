import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ServicesSection from '../ServicesSection';

describe('ServicesSection Component', () => {
  it('renders services section', () => {
    render(<ServicesSection />);
    expect(screen.getByText(/Nossos Serviços/i)).toBeInTheDocument();
  });

  it('renders all 6 services', () => {
    render(<ServicesSection />);
    expect(screen.getByText(/Criação de Conteúdo/i)).toBeInTheDocument();
    expect(screen.getByText(/Agendamento Inteligente/i)).toBeInTheDocument();
    expect(screen.getByText(/Análise de Performance/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestão Multi-Plataforma/i)).toBeInTheDocument();
    expect(screen.getByText(/Otimização de Hashtags/i)).toBeInTheDocument();
    expect(screen.getByText(/Relatórios Personalizados/i)).toBeInTheDocument();
  });

  it('renders service numbers', () => {
    render(<ServicesSection />);
    expect(screen.getByText('001')).toBeInTheDocument();
    expect(screen.getByText('002')).toBeInTheDocument();
    expect(screen.getByText('003')).toBeInTheDocument();
    expect(screen.getByText('004')).toBeInTheDocument();
    expect(screen.getByText('005')).toBeInTheDocument();
    expect(screen.getByText('006')).toBeInTheDocument();
  });

  it('renders in grid layout', () => {
    const { container } = render(<ServicesSection />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });
});
