import { cn } from '@/utils/cn';

export type BadgeVariant =
  | 'default'
  | 'indigo'
  | 'success'
  | 'warning'
  | 'danger'
  | 'slate'
  | 'easy'
  | 'medium'
  | 'hard';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  hard: 'bg-red-100 text-red-800',
};

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
