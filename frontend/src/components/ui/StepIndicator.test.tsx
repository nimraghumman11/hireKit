import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/render';
import StepIndicator from './StepIndicator';

const steps = [
  { label: 'Role Details' },
  { label: 'Responsibilities' },
  { label: 'Skills' },
  { label: 'Focus Areas' },
];

describe('StepIndicator', () => {
  it('renders all step labels', () => {
    render(<StepIndicator steps={steps} currentStep={0} />);
    steps.forEach((s) => {
      expect(screen.getByText(s.label)).toBeInTheDocument();
    });
  });

  it('marks current step as active', () => {
    render(<StepIndicator steps={steps} currentStep={1} />);
    const active = screen.getByText('Responsibilities').closest('div')?.parentElement;
    expect(active?.querySelector('[aria-current="step"]')).toBeInTheDocument();
  });

  it('shows checkmark for completed steps', () => {
    render(<StepIndicator steps={steps} currentStep={2} />);
    // First two steps should have check SVGs
    const svgPaths = document.querySelectorAll('path[d*="M5 13l4 4L19 7"]');
    expect(svgPaths.length).toBe(2);
  });
});
