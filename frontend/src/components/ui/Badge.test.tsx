import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import Badge from './Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Senior</Badge>);
    expect(screen.getByText('Senior')).toBeInTheDocument();
  });

  it('applies easy variant', () => {
    render(<Badge variant="easy">Easy</Badge>);
    expect(screen.getByText('Easy').className).toContain('bg-green-100');
  });

  it('applies hard variant', () => {
    render(<Badge variant="hard">Hard</Badge>);
    expect(screen.getByText('Hard').className).toContain('bg-red-100');
  });
});
