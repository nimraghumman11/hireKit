export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'director';
export type LanguageIssueSeverity = 'warning' | 'error';
export type LanguageIssueSource = 'jobDescription' | 'behavioralQuestions' | 'technicalQuestions' | 'rubric';

export interface LanguageIssue {
  term: string;
  suggestion: string;
  severity: LanguageIssueSeverity;
  source: LanguageIssueSource;
}
export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type KitStatus = 'draft' | 'generating' | 'generated' | 'failed';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface JobDescription {
  // Rich structured sections (from improved prompts)
  aboutTheRole?: string;
  whyJoinUs?: string;
  requiredQualifications?: string[];
  preferredQualifications?: string[];
  whatYoullBring?: string;
  compensationAndBenefits?: string;
  // Core fields
  summary: string;
  responsibilities: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  salaryRange?: string;
  workMode: WorkMode;
}

export interface ScoringGuide {
  '1': string;
  '3': string;
  '5': string;
}

export interface BehavioralQuestion {
  id: string;
  question: string;
  competency: string;
  evalCriteria: string;
  followUps: string[];
  scoringGuide: ScoringGuide;
}

export interface TechnicalQuestion {
  id: string;
  question: string;
  difficulty: Difficulty;
  topic: string;
  evalCriteria: string;
  sampleAnswer: string;
  redFlags: string[];
}

export interface ScorecardItem {
  competency: string;
  weight: number;
  score: number;
  notes: string;
}

export interface RubricItem {
  skill: string;
  proficiencyLevels: {
    novice: string;
    intermediate: string;
    advanced: string;
    expert: string;
  };
}

export interface InterviewKit {
  id: string;
  roleTitle: string;
  department: string;
  experienceLevel: ExperienceLevel;
  workMode: WorkMode;
  teamSize?: string;
  status: KitStatus;
  jobDescription: JobDescription;
  behavioralQuestions: BehavioralQuestion[];
  technicalQuestions: TechnicalQuestion[];
  scorecard: ScorecardItem[];
  rubric: RubricItem[];
  languageIssues: LanguageIssue[];
  pdfUrl?: string;
  docxUrl?: string;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KitGeneratePayload {
  description: string;
}

export interface KitStatusResponse {
  status: KitStatus;
}

export interface RegenerateSectionResponse {
  section: string;
  data: unknown;
  kit: InterviewKit;
}

export interface ShareTokenResponse {
  shareToken: string;
}
