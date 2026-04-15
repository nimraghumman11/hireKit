import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils/render';
import LoginPage from './LoginPage';

vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'notanemail' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    });
  });

  it('links to register page', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: 'Create one' })).toBeInTheDocument();
  });
});
