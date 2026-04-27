import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import ContactForm from '../ContactForm';

describe('ContactForm Component', () => {
  it('renders contact form', () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Website/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plano/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensagem/i)).toBeInTheDocument();
  });

  it('shows validation error for empty required fields', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    const submitButton = screen.getByRole('button', { name: /Enviar/i });
    await user.click(submitButton);
    
    // Should show validation errors
    expect(screen.getByText(/Nome é obrigatório/i) || screen.getByText(/Campo obrigatório/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /Enviar/i });
    await user.click(submitButton);
    
    // Should show email validation error
    expect(screen.getByText(/Email inválido/i) || screen.getByText(/formato inválido/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ContactForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText(/Nome/i), 'João Silva');
    await user.type(screen.getByLabelText(/Email/i), 'joao@example.com');
    await user.type(screen.getByLabelText(/Mensagem/i), 'Teste de mensagem');
    
    const submitButton = screen.getByRole('button', { name: /Enviar/i });
    await user.click(submitButton);
    
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    const nameInput = screen.getByLabelText(/Nome/i);
    await user.type(nameInput, 'João Silva');
    
    const submitButton = screen.getByRole('button', { name: /Enviar/i });
    await user.click(submitButton);
    
    // After submission, form should be cleared
    expect(nameInput).toHaveValue('');
  });
});
