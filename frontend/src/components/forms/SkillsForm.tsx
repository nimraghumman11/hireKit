import { useFormContext, Controller } from 'react-hook-form';
import TagInput from '@/components/ui/TagInput';
import type { KitFormValues } from '@/types/create-kit-form.types';

export default function SkillsForm() {
  const { control, formState: { errors } } = useFormContext<KitFormValues>();

  return (
    <div className="space-y-6">
      <Controller
        name="requiredSkills"
        control={control}
        render={({ field }) => (
          <TagInput
            label="Required Skills"
            tags={field.value}
            onChange={field.onChange}
            placeholder="e.g. TypeScript, React, Node.js"
            error={errors.requiredSkills?.message}
          />
        )}
      />
      <Controller
        name="niceToHaveSkills"
        control={control}
        render={({ field }) => (
          <TagInput
            label="Nice-to-Have Skills"
            tags={field.value}
            onChange={field.onChange}
            placeholder="e.g. GraphQL, AWS, Figma"
          />
        )}
      />
    </div>
  );
}
