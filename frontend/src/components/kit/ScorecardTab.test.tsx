import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/render';
import ScorecardTab from './ScorecardTab';
import { kitFixture } from '@/test/fixtures/kit.fixture';

vi.mock('@/hooks/useKits', () => ({
  useUpdateScorecard: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('ScorecardTab', () => {
  it('renders all competency rows', () => {
    render(<ScorecardTab kitId="kit-1" scorecard={kitFixture.scorecard} />);
    kitFixture.scorecard.forEach((item) => {
      expect(screen.getByText(item.competency)).toBeInTheDocument();
    });
  });

  it('renders save button', () => {
    render(<ScorecardTab kitId="kit-1" scorecard={kitFixture.scorecard} />);
    expect(screen.getByRole('button', { name: 'Save Scorecard' })).toBeInTheDocument();
  });

  it('renders score buttons 1-5 for each row', () => {
    render(<ScorecardTab kitId="kit-1" scorecard={kitFixture.scorecard} />);
    const scoreButtons = screen.getAllByLabelText(/^Score [1-5] for/);
    expect(scoreButtons.length).toBe(kitFixture.scorecard.length * 5);
  });
});
