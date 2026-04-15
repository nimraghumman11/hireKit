import { useState } from 'react';
import type { LanguageIssue, LanguageIssueSource } from '@/types/kit.types';

interface Props {
  issues: LanguageIssue[];
}

const SOURCE_LABELS: Record<LanguageIssueSource, string> = {
  jobDescription:      'Job Description',
  behavioralQuestions: 'Behavioral Questions',
  technicalQuestions:  'Technical Questions',
  rubric:              'Skills Rubric',
};

export default function LanguageIssuesBanner({ issues }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (!issues || issues.length === 0 || dismissed) return null;

  const errors   = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const sorted   = [...errors, ...warnings];
  const hasErrors = errors.length > 0;

  return (
    <div
      className={`rounded-lg border mb-6 ${
        hasErrors
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      }`}
      role="alert"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2 text-left flex-1"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className={`text-lg ${hasErrors ? 'text-red-500' : 'text-amber-500'}`}>
            {hasErrors ? '✕' : '⚠'}
          </span>
          <span className={`font-semibold text-sm ${hasErrors ? 'text-red-800' : 'text-amber-800'}`}>
            Inclusive Language Review — {issues.length} issue{issues.length !== 1 ? 's' : ''} found
          </span>
          <span className={`ml-1 text-xs ${hasErrors ? 'text-red-500' : 'text-amber-500'}`}>
            {expanded ? '▲' : '▼'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={`text-xs px-2 py-1 rounded ${
            hasErrors
              ? 'text-red-600 hover:bg-red-100'
              : 'text-amber-600 hover:bg-amber-100'
          }`}
          aria-label="Dismiss language issues banner"
        >
          Dismiss
        </button>
      </div>

      {/* Issue list */}
      {expanded && (
        <ul className="px-4 pb-4 space-y-2">
          {sorted.map((issue, idx) => (
            <li
              key={idx}
              className={`flex flex-col sm:flex-row sm:items-start gap-1 text-sm rounded px-3 py-2 ${
                issue.severity === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <span
                className={`uppercase text-xs font-bold tracking-wide shrink-0 ${
                  issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'
                }`}
              >
                [{issue.severity}]
              </span>
              <span className="flex-1">
                <span className="font-medium">"{issue.term}"</span>
                <span className="mx-1">→</span>
                <span>{issue.suggestion}</span>
                <span className="ml-2 text-xs opacity-70">
                  ({SOURCE_LABELS[issue.source] ?? issue.source})
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
