import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils/render';
import CreateKitPage from './CreateKitPage';

const mockGenerate = vi.fn();

vi.mock('@/hooks/useKitGenerate', () => ({
  useKitGenerate: () => ({
    generate: mockGenerate,
    isGenerating: false,
    steps: [],
    isPending: false,
  }),
}));

describe('CreateKitPage', () => {
  it('renders a single role description field', () => {
    render(<CreateKitPage />);
    expect(screen.getByLabelText(/role description/i)).toBeInTheDocument();
  });

  it('shows validation when description is too short', async () => {
    render(<CreateKitPage />);
    fireEvent.change(screen.getByLabelText(/role description/i), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate interview kit/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 40 characters/i)).toBeInTheDocument();
    });
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('submits trimmed plain-language description', async () => {
    render(<CreateKitPage />);
    const text =
      'We need a senior backend engineer for our API team. They will own Postgres migrations, ' +
      'partner with product, and participate in on-call. Remote US. Python required.';
    fireEvent.change(screen.getByLabelText(/role description/i), {
      target: { value: text },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate interview kit/i }));
    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalledWith({ description: text });
    });
  });
});
