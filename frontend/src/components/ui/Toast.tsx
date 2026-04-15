import { cn } from '@/utils/cn';
import type { Toast as ToastType } from '@/store/uiStore';
import { useUiStore } from '@/store/uiStore';

interface ToastProps {
  toast: ToastType;
}

const icons = {
  success: (
    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function Toast({ toast }: ToastProps) {
  const { removeToast } = useUiStore();

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm bg-white border rounded-xl shadow-lg px-4 py-3 pointer-events-auto',
        'animate-in slide-in-from-right-5 duration-300',
        toast.variant === 'error' ? 'border-red-200' : 'border-slate-200',
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[toast.variant]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800">{toast.message}</p>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-1 text-xs font-medium text-indigo-600 hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 text-slate-400 hover:text-slate-600"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
