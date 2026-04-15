import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useUiStore } from '@/store/uiStore';
import { useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/kits/new',
    label: 'New Kit',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { sidebarOpen } = useUiStore();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-xl shadow-slate-900/40 transition-all duration-300',
        sidebarOpen ? 'w-56' : 'w-16',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/50 ring-1 ring-white/10">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        {sidebarOpen && (
          <span className="text-white font-semibold text-sm truncate font-sans">
            Interview Kit
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="px-2 py-4 border-t border-white/5">
        {sidebarOpen && user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-slate-300 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          aria-label="Sign out"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {sidebarOpen && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
