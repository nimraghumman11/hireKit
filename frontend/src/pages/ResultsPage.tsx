import { useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import JobDescriptionTab from '@/components/kit/JobDescriptionTab';
import KitQuestionsTab from '@/components/kit/KitQuestionsTab';
import ScorecardTab from '@/components/kit/ScorecardTab';
import RubricTab from '@/components/kit/RubricTab';
import KitResultsHeader from '@/components/kit/KitResultsHeader';
import LanguageIssuesBanner from '@/components/kit/LanguageIssuesBanner';
import { useKit, useUpdateKitSections, useRegenerateSection, useShareKit } from '@/hooks/useKits';
import { useExportPdf, useExportDocx } from '@/hooks/useExport';
import type { JobDescription } from '@/types/kit.types';

const TABS = [
  { id: 'jd', label: 'Job Description' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'questions', label: 'Questions' },
  { id: 'rubric', label: 'Rubric' },
];

function RegenerateButton({
  section,
  label,
  onRegenerate,
  isLoading,
}: {
  section: string;
  label: string;
  onRegenerate: (section: string) => void;
  isLoading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onRegenerate(section)}
      disabled={isLoading}
      title={`Regenerate ${label}`}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <svg
        className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {isLoading ? 'Regenerating…' : `Regenerate ${label}`}
    </button>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: kit, isLoading, isError } = useKit(id ?? '');
  const { mutate: exportPdf, isPending: exporting } = useExportPdf(id ?? '');
  const { mutate: exportDocx, isPending: exportingDocx } = useExportDocx(id ?? '');
  const { mutate: share, isPending: sharing } = useShareKit(id ?? '');
  const { mutate: saveEdits, isPending: saving } = useUpdateKitSections();
  const { mutate: regenerate, isPending: regenerating, variables: regenSection } = useRegenerateSection(id ?? '');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !kit) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-500 dark:text-slate-400">Failed to load interview kit.</p>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const handleSaveJd = (updates: { jobDescription: JobDescription }) => {
    saveEdits({ id: kit.id, updates: updates as Partial<import('@/types/kit.types').InterviewKit> });
  };

  const handleRegenerate = (section: string) => {
    regenerate(section);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-100/90 dark:bg-slate-950">
      <KitResultsHeader
        onNewRole={() => navigate('/kits/new')}
        onDownloadPdf={() => exportPdf()}
        onDownloadDocx={() => exportDocx()}
        onShare={() => share()}
        exporting={exporting}
        exportingDocx={exportingDocx}
        sharing={sharing}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <LanguageIssuesBanner issues={kit.languageIssues ?? []} />

          <Tabs defaultTab="jd" tabs={TABS} variant="pills">
            <TabPanel id="jd">
              <div className="flex justify-end mb-3">
                <RegenerateButton
                  section="job-description"
                  label="JD"
                  onRegenerate={handleRegenerate}
                  isLoading={regenerating && regenSection === 'job-description'}
                />
              </div>
              <JobDescriptionTab
                kit={kit}
                onSave={handleSaveJd}
                saving={saving}
              />
            </TabPanel>

            <TabPanel id="scorecard">
              <div className="flex justify-end mb-3">
                <RegenerateButton
                  section="scorecard"
                  label="scorecard"
                  onRegenerate={handleRegenerate}
                  isLoading={regenerating && regenSection === 'scorecard'}
                />
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900/40 sm:p-8">
                <ScorecardTab kitId={kit.id} scorecard={kit.scorecard} />
              </div>
            </TabPanel>

            <TabPanel id="questions">
              <div className="flex justify-end gap-2 mb-3">
                <RegenerateButton
                  section="behavioral-questions"
                  label="behavioral"
                  onRegenerate={handleRegenerate}
                  isLoading={regenerating && regenSection === 'behavioral-questions'}
                />
                <RegenerateButton
                  section="technical-questions"
                  label="technical"
                  onRegenerate={handleRegenerate}
                  isLoading={regenerating && regenSection === 'technical-questions'}
                />
              </div>
              <KitQuestionsTab
                behavioralQuestions={kit.behavioralQuestions}
                technicalQuestions={kit.technicalQuestions}
              />
            </TabPanel>

            <TabPanel id="rubric">
              <div className="flex justify-end mb-3">
                <RegenerateButton
                  section="rubric"
                  label="rubric"
                  onRegenerate={handleRegenerate}
                  isLoading={regenerating && regenSection === 'rubric'}
                />
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900/40 sm:p-8">
                <RubricTab rubric={kit.rubric} />
              </div>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
