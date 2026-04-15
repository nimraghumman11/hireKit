import { cn } from '@/utils/cn';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full',
};

export default function PageWrapper({ children, className, maxWidth = 'xl' }: PageWrapperProps) {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950',
        className,
      )}
    >
      <div className={cn('mx-auto px-6 py-8', maxWidthClasses[maxWidth])}>
        {children}
      </div>
    </main>
  );
}
