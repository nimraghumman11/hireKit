/**
 * Shape for legacy form components under `components/forms/` (if used).
 * The live create flow is a single plain-language field in `CreateKitPage.tsx`.
 */
export type KitFormValues = {
  roleTitle: string;
  department: string;
  experienceLevel: string;
  workMode: string;
  teamSize?: string;
  responsibilitiesRaw: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  focusAreas: string[];
  additionalNotes?: string;
  numBehavioralQuestions?: number;
  numTechnicalQuestions?: number;
};
