import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils/render';
import KitCard from './KitCard';
import { kitFixture, draftKitFixture } from '@/test/fixtures/kit.fixture';

vi.mock('@/hooks/useKits', () => ({
  useDeleteKit: () => ({ mutate: vi.fn(), isPending: false }),
  useDuplicateKit: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useExport', () => ({
  useExportPdf: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('KitCard', () => {
  it('renders role title', () => {
    render(<KitCard kit={kitFixture} />);
    expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<KitCard kit={kitFixture} />);
    expect(screen.getByText('generated')).toBeInTheDocument();
  });

  it('renders department and level badges', () => {
    render(<KitCard kit={kitFixture} />);
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('senior')).toBeInTheDocument();
  });

  it('shows export button only for generated kits', () => {
    render(<KitCard kit={kitFixture} />);
    expect(screen.getByLabelText('Export PDF')).toBeInTheDocument();
  });

  it('does not show export button for draft kits', () => {
    render(<KitCard kit={draftKitFixture} />);
    expect(screen.queryByLabelText('Export PDF')).not.toBeInTheDocument();
  });

  it('opens confirm dialog on delete click', () => {
    render(<KitCard kit={kitFixture} />);
    fireEvent.click(screen.getByLabelText('Delete kit'));
    expect(screen.getByText('Delete interview kit')).toBeInTheDocument();
  });
});
