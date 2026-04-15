import { useUiStore } from '@/store/uiStore';

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, actions }: HeaderProps) {
  const { toggleSidebar } = useUiStore();

  return (
    <header className="h-14 flex items-center gap-4 px-6 shrink-0 border-b border-slate-200/80 bg-white/75 backdrop-blur-md shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-900/75">
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {title && (
        <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
      )}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
