import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InterviewKit } from '@/types/kit.types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { cn } from '@/utils/cn';
import { useDeleteKit, useDuplicateKit } from '@/hooks/useKits';
import { useExportPdf } from '@/hooks/useExport';

interface KitCardProps {
  kit: InterviewKit;
}

const statusVariant = {
  draft: 'slate',
  generating: 'warning',
  generated: 'success',
  failed: 'danger',
} as const;

export default function KitCard({ kit }: KitCardProps) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: deleteKit, isPending: deleting } = useDeleteKit();
  const { mutate: duplicateKit, isPending: duplicating } = useDuplicateKit();
  const { mutate: exportPdf, isPending: exporting } = useExportPdf(kit.id);

  const totalQuestions =
    (kit.behavioralQuestions?.length ?? 0) + (kit.technicalQuestions?.length ?? 0);

  return (
    <>
      <article
        className={cn(
          'group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm',
          'backdrop-blur-sm transition-all duration-300 dark:border-slate-700/80 dark:bg-slate-900/80',
          'hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-indigo-950/10 dark:hover:border-violet-500/30',
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 opacity-90 transition-opacity group-hover:opacity-100"
          aria-hidden
        />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-serif text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {kit.roleTitle}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <svg className="h-3.5 w-3.5 shrink-0 text-violet-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatRelativeTime(kit.createdAt)}
            </p>
          </div>
          <Badge variant={statusVariant[kit.status] as 'slate' | 'warning' | 'success' | 'danger'}>
            {kit.status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800 ring-1 ring-inset ring-violet-600/15 dark:bg-violet-950/50 dark:text-violet-200 dark:ring-violet-500/25">
            {kit.department}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
              'bg-indigo-50 text-indigo-800 ring-indigo-600/15 dark:bg-indigo-950/50 dark:text-indigo-200 dark:ring-indigo-500/25',
            )}
          >
            {kit.experienceLevel}
          </span>
          {totalQuestions > 0 && (
            <Badge variant="slate">{totalQuestions} questions</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700/80">
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              kit.status === 'generated'
                ? navigate(`/kits/${kit.id}/results`)
                : navigate(`/kits/${kit.id}`)
            }
            className="flex-1 justify-center border-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-900/15 hover:from-violet-500 hover:to-indigo-500"
          >
            View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => duplicateKit(kit.id)}
            loading={duplicating}
            aria-label="Duplicate kit"
            className="shrink-0 border-slate-200/90 bg-white/90 dark:border-slate-600 dark:bg-slate-800/80"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Button>
          {kit.status === 'generated' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => exportPdf()}
              loading={exporting}
              aria-label="Export PDF"
              className="shrink-0 border-slate-200/90 bg-white/90 dark:border-slate-600 dark:bg-slate-800/80"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete kit"
            className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </article>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteKit(kit.id);
          setConfirmDelete(false);
        }}
        title="Delete interview kit"
        description={`Are you sure you want to delete "${kit.roleTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        dangerous
        loading={deleting}
      />
    </>
  );
}
