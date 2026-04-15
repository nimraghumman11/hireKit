import { useFormContext } from 'react-hook-form';
import type { KitFormValues } from '@/types/create-kit-form.types';

export default function ResponsibilitiesForm() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<KitFormValues>();

  const value = watch('responsibilitiesRaw') ?? '';
  const charCount = value.length;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end mb-1.5">
        <label htmlFor="responsibilities" className="block text-sm font-medium text-slate-700">
          Key Responsibilities <span className="text-red-500">*</span>
        </label>
        <span className="text-xs text-slate-400">{charCount}/2000</span>
      </div>
      <textarea
        id="responsibilities"
        rows={10}
        maxLength={2000}
        placeholder={"- Lead the frontend architecture decisions\n- Mentor junior engineers\n- Collaborate with design and product teams"}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
        aria-invalid={!!errors.responsibilitiesRaw}
        {...register('responsibilitiesRaw')}
      />
      {errors.responsibilitiesRaw && (
        <p className="text-xs text-red-600" role="alert">
          {errors.responsibilitiesRaw.message}
        </p>
      )}
      <p className="text-xs text-slate-400">
        Enter each responsibility on a new line. Minimum 3 responsibilities.
      </p>
    </div>
  );
}
