import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { useKit } from '@/hooks/useKits';
import { formatDateFull } from '@/utils/formatDate';
import LanguageIssuesBanner from '@/components/kit/LanguageIssuesBanner';

export default function KitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: kit, isLoading, isError } = useKit(id ?? '');

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !kit) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Interview kit not found.</p>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isReady = kit.status === 'generated';

  return (
    <>
      <Header
        title={kit.roleTitle}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/dashboard')} size="sm">
              ← Dashboard
            </Button>
            {isReady && (
              <Button size="sm" onClick={() => navigate(`/kits/${kit.id}/results`)}>
                View Full Kit
              </Button>
            )}
          </>
        }
      />
      <PageWrapper maxWidth="md">
        <LanguageIssuesBanner issues={kit.languageIssues ?? []} />
        <Card>
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl text-slate-900">{kit.roleTitle}</h2>
                <p className="text-sm text-slate-500 mt-1">{formatDateFull(kit.createdAt)}</p>
              </div>
              <Badge
                variant={
                  kit.status === 'generated'
                    ? 'success'
                    : kit.status === 'generating'
                    ? 'warning'
                    : kit.status === 'failed'
                    ? 'danger'
                    : 'slate'
                }
                className="text-sm px-3 py-1"
              >
                {kit.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Department</p>
                <p className="text-sm font-medium text-slate-700">{kit.department}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Level</p>
                <p className="text-sm font-medium text-slate-700 capitalize">{kit.experienceLevel}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Work Mode</p>
                <p className="text-sm font-medium text-slate-700 capitalize">{kit.workMode}</p>
              </div>
            </div>

            {kit.status === 'generating' && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <Spinner size="sm" className="text-amber-500" />
                <p className="text-sm text-amber-700">AI is generating your interview kit…</p>
              </div>
            )}

            {kit.status === 'failed' && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">Generation failed. Please try creating a new kit.</p>
              </div>
            )}

            {isReady && (
              <Button
                className="w-full justify-center"
                onClick={() => navigate(`/kits/${kit.id}/results`)}
                size="lg"
              >
                Open Interview Kit
              </Button>
            )}
          </div>
        </Card>
      </PageWrapper>
    </>
  );
}
