import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import JobDescriptionTab from '@/components/kit/JobDescriptionTab';
import KitQuestionsTab from '@/components/kit/KitQuestionsTab';
import ScorecardTab from '@/components/kit/ScorecardTab';
import RubricTab from '@/components/kit/RubricTab';
import LanguageIssuesBanner from '@/components/kit/LanguageIssuesBanner';
import { useSharedKit } from '@/hooks/useKits';

const TABS = [
  { id: 'jd', label: 'Job Description' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'questions', label: 'Questions' },
  { id: 'rubric', label: 'Rubric' },
];

export default function SharedKitPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: kit, isLoading, isError } = useSharedKit(token ?? '');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !kit) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-500 dark:text-slate-400">This link is invalid or has expired.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>Go home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950">
      {/* Minimal public header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l1.09 3.26L16 5l-2.18 2.09L14.18 10 12 8.9 9.82 10l.36-2.91L8 5l2.91-.74L12 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Interview Kit</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Shared view · Read only</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate('/register')}>
            Create my own kit
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <LanguageIssuesBanner issues={kit.languageIssues ?? []} />

        <Tabs defaultTab="jd" tabs={TABS} variant="pills">
          <TabPanel id="jd">
            {/* Read-only — no onSave prop */}
            <JobDescriptionTab kit={kit} />
          </TabPanel>
          <TabPanel id="scorecard">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900/40 sm:p-8">
              <ScorecardTab kitId={kit.id} scorecard={kit.scorecard} readOnly />
            </div>
          </TabPanel>
          <TabPanel id="questions">
            <KitQuestionsTab
              behavioralQuestions={kit.behavioralQuestions}
              technicalQuestions={kit.technicalQuestions}
            />
          </TabPanel>
          <TabPanel id="rubric">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900/40 sm:p-8">
              <RubricTab rubric={kit.rubric} />
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
