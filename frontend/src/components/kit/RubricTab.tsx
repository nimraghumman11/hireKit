import { useState } from 'react';
import type { RubricItem } from '@/types/kit.types';
import { cn } from '@/utils/cn';

interface Props {
  rubric: RubricItem[];
}

const LEVELS = [
  { key: 'novice', label: 'Novice', color: 'text-red-600 bg-red-50' },
  { key: 'intermediate', label: 'Intermediate', color: 'text-amber-600 bg-amber-50' },
  { key: 'advanced', label: 'Advanced', color: 'text-blue-600 bg-blue-50' },
  { key: 'expert', label: 'Expert', color: 'text-emerald-600 bg-emerald-50' },
] as const;

function RubricRow({ item }: { item: RubricItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-900">{item.skill}</span>
        <svg
          className={cn('w-4 h-4 text-slate-400 transition-transform', expanded && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4">
          {LEVELS.map(({ key, label, color }) => (
            <div key={key} className="p-4 border-r last:border-0 border-slate-100">
              <span className={cn('inline-block text-xs font-semibold px-2 py-0.5 rounded mb-2', color)}>
                {label}
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.proficiencyLevels[key]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RubricTab({ rubric }: Props) {
  if (rubric.length === 0) {
    return <p className="text-slate-500 text-sm">No rubric generated.</p>;
  }

  return (
    <div className="space-y-3">
      {rubric.map((item, i) => (
        <RubricRow key={i} item={item} />
      ))}
    </div>
  );
}
