import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils/render';
import Modal from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={vi.fn()}><p>Content</p></Modal>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(<Modal open={true} onClose={vi.fn()}><p>Content</p></Modal>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Confirm Delete"><p>Body</p></Modal>);
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test"><p>Body</p></Modal>);
    // Click the backdrop (aria-hidden overlay)
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test"><p>Body</p></Modal>);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
