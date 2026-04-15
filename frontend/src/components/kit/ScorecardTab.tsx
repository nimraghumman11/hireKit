import { useState } from 'react';
import type { ScorecardItem } from '@/types/kit.types';
import Button from '@/components/ui/Button';
import { useUpdateScorecard } from '@/hooks/useKits';
import { cn } from '@/utils/cn';

interface Props {
  kitId: string;
  scorecard: ScorecardItem[];
  readOnly?: boolean;
}

export default function ScorecardTab({ kitId, scorecard: initialScorecard, readOnly = false }: Props) {
  const [items, setItems] = useState<ScorecardItem[]>(initialScorecard);
  const { mutate: save, isPending } = useUpdateScorecard();

  const updateScore = (index: number, score: number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, score } : item)));
  };

  const updateNotes = (index: number, notes: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, notes } : item)));
  };

  const weightedScore = items.reduce((acc, item) => {
    const score = item.score ?? 0;
    return acc + score * item.weight;
  }, 0);

  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  const overallScore = totalWeight > 0 ? (weightedScore / totalWeight).toFixed(1) : '—';

  const scoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 w-1/3">Competency</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 w-16">Weight</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 w-48">Score (1–5)</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-800">{item.competency}</td>
                <td className="px-4 py-3 text-center text-slate-500">
                  {Math.round(item.weight * 100)}%
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-center">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => !readOnly && updateScore(i, score)}
                        disabled={readOnly}
                        aria-label={`Score ${score} for ${item.competency}`}
                        className={cn(
                          'w-8 h-8 rounded-lg text-sm font-semibold transition-colors',
                          item.score === score
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                          readOnly && 'cursor-default opacity-70',
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={item.notes ?? ''}
                    onChange={(e) => !readOnly && updateNotes(i, e.target.value)}
                    readOnly={readOnly}
                    placeholder={readOnly ? '' : 'Add notes…'}
                    aria-label={`Notes for ${item.competency}`}
                    className="w-full text-sm border-0 bg-transparent outline-none placeholder-slate-300 text-slate-700"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td colSpan={2} className="px-4 py-3 font-semibold text-slate-700">
                Overall Weighted Score
              </td>
              <td className="px-4 py-3 text-center">
                <span className={cn('text-2xl font-bold font-mono', scoreColor(Number(overallScore)))}>
                  {overallScore}
                </span>
                <span className="text-slate-400 text-sm"> / 5</span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button
            onClick={() => save({ id: kitId, scorecard: items })}
            loading={isPending}
          >
            Save Scorecard
          </Button>
        </div>
      )}
    </div>
  );
}
