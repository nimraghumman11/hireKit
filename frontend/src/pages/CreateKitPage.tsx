import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/layout/Header';
import PageWrapper from '@/components/layout/PageWrapper';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Button from '@/components/ui/Button';
import GeneratingOverlay from '@/components/kit/GeneratingOverlay';
import { useKitGenerate } from '@/hooks/useKitGenerate';
import { cn } from '@/utils/cn';

const schema = z.object({
  description: z
    .string()
    .trim()
    .min(40, 'Add a bit more detail about the role (at least 40 characters).')
    .max(12000, 'Please keep your description under 12,000 characters.'),
});

type FormValues = z.infer<typeof schema>;

const inputClass = cn(
  'w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm',
  'placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20',
  'dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500',
);

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300';
const req = <span className="text-red-500">*</span>;

export default function CreateKitPage() {
  const { generate, isGenerating, steps, isPending, previews } = useKitGenerate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: '' },
  });

  const onSubmit = (values: FormValues) => {
    generate({ description: values.description.trim() });
  };

  const busy = isGenerating || isPending;

  return (
    <>
      <Header title="New interview kit" actions={<ThemeToggle />} />
      <PageWrapper
        maxWidth="md"
        className="bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950"
      >
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
            <span aria-hidden>✨</span>
            AI-powered interview kit generator
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Describe the role in plain language —{' '}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
              we’ll build the kit.
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Paste notes, bullets, or a rough draft. We’ll produce a polished job description, scorecard,
            behavioral and technical questions, and a skills rubric — with inclusive, industry-aligned
            language.
          </p>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-indigo-950/5 backdrop-blur dark:border-slate-700/80 dark:bg-slate-800/90 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            <div>
              <label htmlFor="description" className={labelClass}>
                Role description {req}
              </label>
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                Include title, level, team, stack, work arrangement, and must-haves if you know them — or
                whatever you have today. The more context, the better the kit.
              </p>
              <textarea
                id="description"
                rows={14}
                autoComplete="off"
                spellCheck
                placeholder={
                  'Example:\n\n' +
                  'We need a backend engineer for our payments team — mid or senior. They’ll design APIs, ' +
                  'work with Postgres and Redis, partner with product on reliability, and help on-call ' +
                  'sometimes. Remote in EU time zones. Python experience strongly preferred; Go is a plus.'
                }
                className={cn(inputClass, 'resize-y min-h-[220px] leading-relaxed')}
                disabled={busy}
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-violet-500 hover:via-indigo-400 hover:to-sky-400 disabled:opacity-60"
              >
                Generate interview kit
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </div>
          </form>
        </div>
      </PageWrapper>

      {isGenerating && <GeneratingOverlay steps={steps} previews={previews} />}
    </>
  );
}
