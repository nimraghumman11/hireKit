import { createContext, useContext, useState } from 'react';
import { cn } from '@/utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs subcomponent used outside <Tabs>');
  return ctx;
}

interface TabsProps {
  defaultTab: string;
  tabs: Tab[];
  children: React.ReactNode;
  className?: string;
  /** `pills` = rounded segment control (e.g. kit results). Default = underline tabs. */
  variant?: 'line' | 'pills';
}

export default function Tabs({ defaultTab, tabs, children, className, variant = 'line' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const pills = variant === 'pills';
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('flex flex-col', className)}>
        <div
          className={cn(
            'flex gap-1 px-1',
            pills
              ? 'inline-flex w-fit max-w-full flex-wrap rounded-full border border-slate-200/80 bg-slate-100/90 p-1 shadow-inner dark:border-slate-700 dark:bg-slate-800/80'
              : 'border-b border-slate-200 dark:border-slate-700',
          )}
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-all',
                pills
                  ? cn(
                      'rounded-full px-4 py-2.5 sm:px-5',
                      activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                    )
                  : cn(
                      'border-b-2 -mb-px px-4 py-3',
                      activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400',
                    ),
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className={cn(pills ? 'pt-8' : 'pt-6')}>{children}</div>
      </div>
    </TabsContext.Provider>
  );
}

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
}

export function TabPanel({ id, children }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== id) return null;
  return (
    <div id={`tabpanel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`}>
      {children}
    </div>
  );
}
