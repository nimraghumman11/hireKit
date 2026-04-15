import { useFormContext } from 'react-hook-form';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { KitFormValues } from '@/types/create-kit-form.types';

const DEPARTMENTS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Finance', label: 'Finance' },
  { value: 'HR', label: 'HR' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Customer Success', label: 'Customer Success' },
];

const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
  { value: 'director', label: 'Director' },
];

const WORK_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

export default function RoleDetailsForm() {
  const { register, formState: { errors } } = useFormContext<KitFormValues>();

  return (
    <div className="space-y-5">
      <Input
        label="Job Title"
        placeholder="e.g. Senior Frontend Engineer"
        required
        error={errors.roleTitle?.message}
        {...register('roleTitle')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Department"
          options={DEPARTMENTS}
          placeholder="Select department"
          required
          error={errors.department?.message}
          {...register('department')}
        />
        <Select
          label="Experience Level"
          options={EXPERIENCE_LEVELS}
          placeholder="Select level"
          required
          error={errors.experienceLevel?.message}
          {...register('experienceLevel')}
        />
      </div>
      <Select
        label="Work Mode"
        options={WORK_MODES}
        placeholder="Select work mode"
        required
        error={errors.workMode?.message}
        {...register('workMode')}
      />
    </div>
  );
}
