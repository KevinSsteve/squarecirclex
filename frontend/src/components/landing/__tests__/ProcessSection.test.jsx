import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProcessSection from '../ProcessSection';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProcessSection Component', () => {
  it('renders process section', () => {
    renderWithRouter(<ProcessSection />);
    expect(screen.getByText(/Como Funciona/i)).toBeInTheDocument();
  });

  it('renders all 4 process steps', () => {
    renderWithRouter(<ProcessSection />);
    expect(screen.getByText(/Conecte Suas Contas/i)).toBeInTheDocument();
    expect(screen.getByText(/Configure Sua Marca/i)).toBeInTheDocument();
    expect(screen.getByText(/Gere Conteúdo/i)).toBeInTheDocument();
    expect(screen.getByText(/Publique e Analise/i)).toBeInTheDocument();
  });

  it('renders step numbers', () => {
    renderWithRouter(<ProcessSection />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
  });

  it('renders CTA button', () => {
    renderWithRouter(<ProcessSection />);
    expect(screen.getByText(/Ver Preços/i)).toBeInTheDocument();
  });
});
