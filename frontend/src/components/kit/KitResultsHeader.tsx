import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface Props {
  onNewRole: () => void;
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
  onShare: () => void;
  exporting: boolean;
  exportingDocx: boolean;
  sharing: boolean;
}

export default function KitResultsHeader({
  onNewRole,
  onDownloadPdf,
  onDownloadDocx,
  onShare,
  exporting,
  exportingDocx,
  sharing,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/20">
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2l1.09 3.26L16 5l-2.18 2.09L14.18 10 12 8.9 9.82 10l.36-2.91L8 5l2.91-.74L12 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate font-sans text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Interview Kit
            </p>
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:block">
              Inclusive interview kit generator
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* New role — hidden on mobile */}
          <Button variant="secondary" size="sm" onClick={onNewRole} className="hidden sm:inline-flex">
            ← New role
          </Button>

          {/* Share link */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onShare}
            loading={sharing}
            disabled={sharing}
            title="Copy shareable link"
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            }
          >
            <span className="hidden sm:inline">{sharing ? 'Copying…' : 'Share'}</span>
          </Button>

          {/* DOCX download */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onDownloadDocx}
            loading={exportingDocx}
            disabled={exportingDocx}
            title="Download as Word document"
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            <span className="hidden sm:inline">{exportingDocx ? 'Exporting…' : 'DOCX'}</span>
          </Button>

          {/* PDF download */}
          <Button
            size="sm"
            onClick={onDownloadPdf}
            loading={exporting}
            disabled={exporting}
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-cyan-500"
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
          >
            {exporting ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>
      </div>
    </header>
  );
}
