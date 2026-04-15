import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import type { GenerationStep, SectionPreview } from '@/hooks/useKitGenerate';

interface GeneratingOverlayProps {
  steps: GenerationStep[];
  previews: SectionPreview[];
}

/** Cleans up raw LLM JSON tokens into readable preview text. */
function toReadablePreview(raw: string): string {
  return raw
    .replace(/\\n/g, ' ')
    .replace(/[{}\[\]"]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function SectionCard({ preview }: { preview: SectionPreview }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as tokens arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [preview.tokens]);

  const readable = toReadablePreview(preview.tokens);

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all duration-300',
        preview.done
          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
          : 'border-indigo-200 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30',
      )}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="shrink-0">
          {preview.done ? (
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </span>
        <span
          className={cn(
            'text-xs font-semibold',
            preview.done
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-indigo-700 dark:text-indigo-300',
          )}
        >
          {preview.label}
        </span>
        {preview.done && (
          <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Done
          </span>
        )}
      </div>

      {/* Live token stream */}
      {readable && (
        <div
          ref={scrollRef}
          className="max-h-16 overflow-hidden text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-mono"
        >
          {readable}
          {!preview.done && (
            <span className="inline-block w-1.5 h-3 ml-0.5 bg-indigo-500 align-middle animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
}

export default function GeneratingOverlay({ steps, previews }: GeneratingOverlayProps) {
  const activePreviews = previews.filter((p) => p.tokens.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Generating your kit</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tokens streaming live — like watching the AI think
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Pipeline steps */}
          <ul className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {step.status === 'done' ? (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.status === 'active' ? (
                    <svg className="w-4 h-4 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600 block" />
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    step.status === 'done'   && 'text-slate-400 dark:text-slate-500 line-through',
                    step.status === 'active' && 'text-slate-900 dark:text-white font-medium',
                    step.status === 'idle'   && 'text-slate-400 dark:text-slate-500',
                  )}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ul>

          {/* Live section previews — shown once tokens start arriving */}
          {activePreviews.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Live output
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {activePreviews.map((p) => (
                  <SectionCard key={p.section} preview={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
