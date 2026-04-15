import { useState } from 'react';
import type { BehavioralQuestion } from '@/types/kit.types';
import Badge from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface Props {
  questions: BehavioralQuestion[];
}

function BehavioralQuestionCard({ q }: { q: BehavioralQuestion }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge variant="indigo">{q.competency}</Badge>
        </div>
        <p className="text-slate-900 font-medium leading-snug">{q.question}</p>

        <button
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex items-center gap-1.5 mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          {expanded ? 'Hide' : 'Show'} evaluation guide
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

          {q.followUps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Follow-up Questions
              </h4>
              <ul className="space-y-1">
                {q.followUps.map((f, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-slate-400 shrink-0">→</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Scoring Guide
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(['1', '3', '5'] as const).map((score) => (
                <div key={score} className="rounded-lg border border-slate-200 p-2 bg-white">
                  <div className="text-xs font-bold text-slate-500 mb-1">Score {score}</div>
                  <p className="text-xs text-slate-600">{q.scoringGuide[score]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BehavioralQuestionsTab({ questions }: Props) {
  if (questions.length === 0) {
    return <p className="text-slate-500 text-sm">No behavioral questions generated.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{questions.length} questions</p>
      {questions.map((q) => (
        <BehavioralQuestionCard key={q.id} q={q} />
      ))}
    </div>
  );
}
