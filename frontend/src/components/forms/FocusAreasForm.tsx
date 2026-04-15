import { useFormContext, Controller } from 'react-hook-form';
import { cn } from '@/utils/cn';
import type { KitFormValues } from '@/types/create-kit-form.types';

const FOCUS_AREAS = [
  { value: 'technical', label: 'Technical Skills', icon: '⚙️' },
  { value: 'communication', label: 'Communication', icon: '💬' },
  { value: 'leadership', label: 'Leadership', icon: '🎯' },
  { value: 'problem_solving', label: 'Problem Solving', icon: '🔍' },
  { value: 'culture_fit', label: 'Culture Fit', icon: '🤝' },
  { value: 'domain_knowledge', label: 'Domain Knowledge', icon: '📚' },
];

export default function FocusAreasForm() {
  const { control, register, formState: { errors } } = useFormContext<KitFormValues>();

  return (
    <div className="space-y-6">
      <div>
        <p className="block text-sm font-medium text-slate-700 mb-3">
          Interview Focus Areas <span className="text-red-500">*</span>
        </p>
        <Controller
          name="focusAreas"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FOCUS_AREAS.map((area) => {
                const isSelected = field.value.includes(area.value);
                return (
                  <label
                    key={area.value}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([...field.value, area.value]);
                        } else {
                          field.onChange(field.value.filter((v: string) => v !== area.value));
                        }
                      }}
                    />
                    <span className="text-lg" aria-hidden="true">{area.icon}</span>
                    <span className="text-sm font-medium">{area.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        />
        {errors.focusAreas && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {errors.focusAreas.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="additionalNotes" className="block text-sm font-medium text-slate-700 mb-1.5">
          Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="additionalNotes"
          rows={3}
          placeholder="Any specific areas to probe, red flags to watch for, or context about the team?"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          {...register('additionalNotes')}
        />
      </div>
    </div>
  );
}
