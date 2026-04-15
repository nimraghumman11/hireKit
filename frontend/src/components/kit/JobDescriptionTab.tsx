import { useState } from 'react';
import type { InterviewKit, JobDescription } from '@/types/kit.types';
import { formatExperienceLevel, formatWorkMode } from '@/utils/levelLabel';
import Button from '@/components/ui/Button';

interface Props {
  kit: InterviewKit;
  onSave?: (updates: { jobDescription: JobDescription }) => void;
  saving?: boolean;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 border-l-4 border-indigo-500 pl-3 text-base font-bold text-indigo-900 dark:border-cyan-400 dark:text-indigo-100">
      {children}
    </h3>
  );
}

function MetaChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="max-w-[12rem] truncate font-semibold text-slate-800 dark:text-slate-100 sm:max-w-none">{value}</span>
    </div>
  );
}

function EditableText({
  value,
  onChange,
  editing,
  multiline = false,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  multiline?: boolean;
  className?: string;
}) {
  if (!editing) {
    return <span className={className}>{value}</span>;
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-indigo-300 bg-indigo-50 p-2 text-sm leading-relaxed text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        rows={4}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-1 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
    />
  );
}

function EditableBulletList({
  items,
  onChange,
  editing,
  bulletColor = 'bg-indigo-500',
}: {
  items: string[];
  onChange: (items: string[]) => void;
  editing: boolean;
  bulletColor?: string;
}) {
  if (!editing) {
    return (
      <ul className="space-y-3">
        {items.map((r, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${bulletColor}`} aria-hidden />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="flex-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-1 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
      >
        + Add item
      </button>
    </div>
  );
}

const COMMITMENT_COPY =
  "We're committed to inclusive hiring. We welcome candidates from every background and evaluate fairly based on skills, experience, and potential aligned with this role.";

export default function JobDescriptionTab({ kit, onSave, saving }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<JobDescription>({ ...kit.jobDescription });

  const jd = editing ? draft : kit.jobDescription;

  const update = (field: keyof JobDescription, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave?.({ jobDescription: draft });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft({ ...kit.jobDescription });
    setEditing(false);
  };

  // "About the role" uses aboutTheRole if present, falls back to summary
  const aboutText = jd.aboutTheRole || jd.summary || '';
  const aboutParagraphs = aboutText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900/40">
      {/* Gradient hero */}
      <div className="rounded-t-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-teal-500 px-6 py-8 sm:px-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">Job description</p>
        <h2 className="font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">{kit.roleTitle}</h2>
      </div>

      {/* Metadata chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4 dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          <MetaChip
            label="Department"
            value={kit.department}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <MetaChip
            label="Level"
            value={formatExperienceLevel(kit.experienceLevel)}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetaChip
            label="Work model"
            value={formatWorkMode(jd.workMode)}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
        {/* Edit toggle */}
        {onSave && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      <div className="space-y-8 px-6 py-8 sm:px-10">

        {/* About the role */}
        <section>
          <SectionHeading>About the role</SectionHeading>
          {editing ? (
            <EditableText
              value={jd.aboutTheRole ?? jd.summary ?? ''}
              onChange={(v) => update('aboutTheRole', v)}
              editing
              multiline
              className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
            />
          ) : (
            <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {aboutParagraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
        </section>

        {/* Why join us */}
        {(jd.whyJoinUs || editing) && (
          <section>
            <SectionHeading>Why join us</SectionHeading>
            <EditableText
              value={jd.whyJoinUs ?? ''}
              onChange={(v) => update('whyJoinUs', v)}
              editing={editing}
              multiline
              className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
            />
          </section>
        )}

        {/* Responsibilities */}
        <section>
          <SectionHeading>What you&apos;ll do</SectionHeading>
          <EditableBulletList
            items={jd.responsibilities}
            onChange={(items) => update('responsibilities', items)}
            editing={editing}
            bulletColor="bg-indigo-500"
          />
        </section>

        {/* Qualifications */}
        <section>
          <SectionHeading>What we&apos;re looking for</SectionHeading>
          <div className="space-y-6">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Required qualifications</h4>
              <EditableBulletList
                items={jd.requiredQualifications?.length ? jd.requiredQualifications : jd.requiredSkills}
                onChange={(items) => update('requiredQualifications', items)}
                editing={editing}
                bulletColor="bg-indigo-500"
              />
            </div>
            {((jd.preferredQualifications?.length || jd.niceToHaveSkills?.length) || editing) && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Preferred qualifications</h4>
                <EditableBulletList
                  items={jd.preferredQualifications?.length ? jd.preferredQualifications : (jd.niceToHaveSkills ?? [])}
                  onChange={(items) => update('preferredQualifications', items)}
                  editing={editing}
                  bulletColor="bg-teal-500"
                />
              </div>
            )}
          </div>
        </section>

        {/* What you'll bring */}
        {(jd.whatYoullBring || editing) && (
          <section>
            <SectionHeading>What you&apos;ll bring</SectionHeading>
            <EditableText
              value={jd.whatYoullBring ?? ''}
              onChange={(v) => update('whatYoullBring', v)}
              editing={editing}
              multiline
              className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
            />
          </section>
        )}

        {/* Our commitment */}
        <section>
          <SectionHeading>Our commitment</SectionHeading>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{COMMITMENT_COPY}</p>
        </section>

        {/* Compensation */}
        <section>
          <SectionHeading>Compensation &amp; benefits</SectionHeading>
          {editing ? (
            <EditableText
              value={jd.compensationAndBenefits ?? jd.salaryRange ?? ''}
              onChange={(v) => update('compensationAndBenefits', v)}
              editing
              multiline
              className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
            />
          ) : (
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {jd.compensationAndBenefits ||
                (jd.salaryRange
                  ? `Compensation: ${jd.salaryRange}. Additional benefits may include health coverage, time off, and learning stipends—details are shared with shortlisted candidates.`
                  : 'Compensation and benefits are competitive for the role and region; specifics are shared with shortlisted candidates.')}
            </p>
          )}
        </section>

        {/* Edit action bar */}
        {editing && (
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-700">
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              Save changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
