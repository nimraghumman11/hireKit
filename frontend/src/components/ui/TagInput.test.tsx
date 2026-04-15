import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils/render';
import TagInput from './TagInput';

describe('TagInput', () => {
  it('renders existing tags', () => {
    render(<TagInput tags={['React', 'TypeScript']} onChange={vi.fn()} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('adds a tag on Enter', () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} label="Skills" />);
    const input = screen.getByLabelText('Skills');
    fireEvent.change(input, { target: { value: 'Node.js' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Node.js']);
  });

  it('removes a tag on × click', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['React']} onChange={onChange} label="Skills" />);
    fireEvent.click(screen.getByLabelText('Remove React'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('does not add duplicate tags', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['React']} onChange={onChange} label="Skills" />);
    const input = screen.getByLabelText('Skills');
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
