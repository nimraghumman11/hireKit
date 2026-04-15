import { useState } from 'react';
import type { TechnicalQuestion } from '@/types/kit.types';
import Badge from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface Props {
  questions: TechnicalQuestion[];
}

const difficultyVariant: Record<string, 'easy' | 'medium' | 'hard'> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
};

function TechnicalQuestionCard({ q }: { q: TechnicalQuestion }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={difficultyVariant[q.difficulty] ?? 'default'}>{q.difficulty}</Badge>
          <Badge variant="slate">{q.topic}</Badge>
        </div>
        <p className="text-slate-900 font-medium leading-snug">{q.question}</p>

        <button
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex items-center gap-1.5 mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          {expanded ? 'Hide' : 'Show'} answer guide
          <svg
            className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Evaluation Criteria
            </h4>
            <p className="text-sm text-slate-700">{q.evalCriteria}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Sample Answer
            </h4>
            <p className="text-sm text-slate-700 font-mono leading-relaxed">{q.sampleAnswer}</p>
          </div>
          {q.redFlags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1.5">
                Red Flags
              </h4>
              <ul className="space-y-1">
                {q.redFlags.map((f, i) => (
                  <li key={i} className="text-sm text-red-700 flex gap-2">
                    <span className="shrink-0">⚠</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TechnicalQuestionsTab({ questions }: Props) {
  if (questions.length === 0) {
    return <p className="text-slate-500 text-sm">No technical questions generated.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{questions.length} questions</p>
      {questions.map((q) => (
        <TechnicalQuestionCard key={q.id} q={q} />
      ))}
    </div>
  );
}
