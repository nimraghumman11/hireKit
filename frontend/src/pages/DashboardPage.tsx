import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import KitCard from '@/components/kit/KitCard';
import { useKits } from '@/hooks/useKits';
import { useDebounce } from '@/hooks/useDebounce';

const DEPARTMENTS = [
  { value: '', label: 'All departments' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Finance', label: 'Finance' },
  { value: 'HR', label: 'HR' },
];

const LEVELS = [
  { value: '', label: 'All levels' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
  { value: 'director', label: 'Director' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Role title A-Z' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');

  const debouncedSearch = useDebounce(search, 300);

  const { data: kits = [], isLoading, isError } = useKits({
    search: debouncedSearch || undefined,
    department: department || undefined,
    level: level || undefined,
    sort,
  });

  const sorted = useMemo(() => {
    const copy = [...kits];
    if (sort === 'oldest') return copy.reverse();
    if (sort === 'title') return copy.sort((a, b) => a.roleTitle.localeCompare(b.roleTitle));
    return copy;
  }, [kits, sort]);

  return (
    <>
      <Header
        title="Dashboard"
        actions={
          <Button
            onClick={() => navigate('/kits/new')}
            size="sm"
            className="border-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 text-white shadow-md shadow-indigo-500/25 hover:from-violet-500 hover:via-indigo-400 hover:to-sky-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Kit
          </Button>
        }
      />
      <PageWrapper
        maxWidth="2xl"
        className="relative bg-gradient-to-br from-slate-50 via-violet-50/40 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30"
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-600/10" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-600/10" />
        </div>

        <div className="relative mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Your interview kits
          </p>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Search and filter saved roles, then open a kit to review questions, scorecard, and exports.
          </p>
        </div>

        {/* Filters — one row; narrow viewports scroll horizontally */}
        <div className="relative mb-10 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-lg shadow-indigo-950/5 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/70 sm:p-5">
          <div className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
            <div className="min-w-[min(100%,240px)] flex-1">
              <Input
                placeholder="Search by role title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-200/90 bg-white/90 dark:border-slate-600 dark:bg-slate-900/80"
                leftAddon={
                  <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                aria-label="Search kits"
              />
            </div>
            {/* Select root is `w-full`; fixed-width wrappers keep all controls on one line */}
            <div className="w-[11.5rem] shrink-0">
              <Select
                options={DEPARTMENTS}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                aria-label="Filter by department"
                className="w-full border-slate-200/90 bg-white/90 dark:border-slate-600 dark:bg-slate-900/80"
              />
            </div>
            <div className="w-[9.5rem] shrink-0">
              <Select
                options={LEVELS}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                aria-label="Filter by level"
                className="w-full border-slate-200/90 bg-white/90 dark:border-slate-600 dark:bg-slate-900/80"
              />
            </div>
            <div className="w-[10.5rem] shrink-0">
              <Select
                options={SORT_OPTIONS}
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                aria-label="Sort kits"
                className="w-full border-slate-200/90 bg-white/90 dark:border-slate-600 dark:bg-slate-900/80"
              />
            </div>
          </div>
        </div>

        {/* States */}
        {isLoading && (
          <div className="relative flex items-center justify-center py-28">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <div className="relative rounded-2xl border border-red-200/80 bg-red-50/80 px-6 py-16 text-center dark:border-red-900/50 dark:bg-red-950/30">
            <p className="font-medium text-red-800 dark:text-red-300">Failed to load kits.</p>
            <p className="mt-1 text-sm text-red-600/90 dark:text-red-400/90">Please refresh the page.</p>
          </div>
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <div className="relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-white/50 px-6 py-20 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 shadow-inner dark:from-violet-950/80 dark:to-indigo-950/80">
              <svg className="h-9 w-9 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="font-serif text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
              No interview kits yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {search || department || level
                ? 'No kits match your filters — try adjusting search or filters.'
                : 'Describe a role in plain language and we’ll generate a full kit: JD, questions, scorecard, and rubric.'}
            </p>
            {!search && !department && !level && (
              <Button
                onClick={() => navigate('/kits/new')}
                className="mt-8 border-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/20 hover:from-violet-500 hover:via-indigo-400 hover:to-sky-400"
              >
                Create your first kit
              </Button>
            )}
          </div>
        )}

        {!isLoading && !isError && sorted.length > 0 && (
          <>
            <div className="relative mb-5 flex items-baseline justify-between gap-4">
              <div>
                <p className="font-serif text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {sorted.length} kit{sorted.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ready to open, duplicate, or export</p>
              </div>
            </div>
            <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((kit) => (
                <KitCard key={kit.id} kit={kit} />
              ))}
            </div>
          </>
        )}
      </PageWrapper>
    </>
  );
}
