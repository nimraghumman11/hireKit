import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import Input from './Input';

describe('Input', () => {
  it('renders label and input', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('shows hint when no error', () => {
    render(<Input label="Password" hint="Min 8 chars" />);
    expect(screen.getByText('Min 8 chars')).toBeInTheDocument();
  });

  it('marks input as aria-invalid when error present', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders required asterisk', () => {
    render(<Input label="Name" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
