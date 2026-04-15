import { cn } from '@/utils/cn';

interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className={cn('flex items-center gap-0', className)}>
      {steps.map((step, index) => {
        const isDone = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  isDone && 'bg-indigo-600 text-white',
                  isActive && 'bg-indigo-600 text-white ring-4 ring-indigo-100',
                  !isDone && !isActive && 'bg-slate-200 text-slate-500',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  isActive ? 'text-indigo-600' : isDone ? 'text-slate-600' : 'text-slate-400',
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mb-5',
                  index < currentStep ? 'bg-indigo-600' : 'bg-slate-200',
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
