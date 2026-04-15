# Shared Schema Types

## Purpose
Single source of truth for all data shapes used across frontend, backend, and AI service.
Every agent must use these types — do not invent local types that diverge from this file.

---

## TypeScript Types (Frontend + Backend)

```typescript
// types/kit.types.ts

export type ExperienceLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | 'director';

export type QuestionType = 'scenario' | 'conceptual' | 'applied';

export type Difficulty = 'junior' | 'mid' | 'senior' | 'staff';

export interface RoleInput {
  jobTitle: string;
  department: string;
  experienceLevel: ExperienceLevel;
  responsibilities: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  teamInfo?: string;
  focusAreas?: string[];
}

export interface BehavioralQuestion {
  question: string;
  competency: string;
  intent: string;
  evalCriteria: string;
  scoringGuide: Record<'1' | '2' | '3' | '4' | '5', string>;
}

export interface TechnicalQuestion {
  question: string;
  skill: string;
  difficulty: Difficulty;
  type: QuestionType;
  expectedAnswer: string;
  evalCriteria: string;
  followUps: string[];
}

export interface ScorecardItem {
  competency: string;
  weight: number; // all weights must sum to 100
  description: string;
  levels: Record<'1' | '2' | '3' | '4' | '5', string>;
}

export interface SkillRubricItem {
  skill: string;
  novice: string;
  developing: string;
  proficient: string;
  expert: string;
}

export interface JobDescription {
  summary: string;
  responsibilities: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  whatWeOffer: string[];
}

export interface InterviewKit {
  kitId: string;
  userId: string;
  roleTitle: string;
  department: string;
  experienceLevel: ExperienceLevel;
  jobDescription: JobDescription;
  behavioralQuestions: BehavioralQuestion[];
  technicalQuestions: TechnicalQuestion[];
  scorecard: ScorecardItem[];
  skillsRubric: SkillRubricItem[];
  pdfUrl?: string;
  docxUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: {
    page?: number;
    total?: number;
    limit?: number;
  };
}

export interface GenerateKitRequest {
  roleInput: RoleInput;
}

export interface GenerateKitResponse {
  kit: InterviewKit;
}
```

---

## Pydantic Models (AI Service — Python)

```python
# models/kit.py
from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum

class ExperienceLevel(str, Enum):
    intern = "intern"
    junior = "junior"
    mid = "mid"
    senior = "senior"
    staff = "staff"
    principal = "principal"
    director = "director"

class RoleInput(BaseModel):
    job_title: str
    department: str
    experience_level: ExperienceLevel
    responsibilities: list[str]
    required_skills: list[str]
    nice_to_have_skills: list[str] = []
    team_info: Optional[str] = None
    focus_areas: list[str] = []

class ScoringGuide(BaseModel):
    one: str = Field(alias="1")
    two: str = Field(alias="2")
    three: str = Field(alias="3")
    four: str = Field(alias="4")
    five: str = Field(alias="5")

class BehavioralQuestion(BaseModel):
    question: str
    competency: str
    intent: str
    eval_criteria: str
    scoring_guide: dict[str, str]

class TechnicalQuestion(BaseModel):
    question: str
    skill: str
    difficulty: str
    type: Literal["scenario", "conceptual", "applied"]
    expected_answer: str
    eval_criteria: str
    follow_ups: list[str] = []

class ScorecardItem(BaseModel):
    competency: str
    weight: int
    description: str
    levels: dict[str, str]

class SkillRubricItem(BaseModel):
    skill: str
    novice: str
    developing: str
    proficient: str
    expert: str

class JobDescription(BaseModel):
    summary: str
    responsibilities: list[str]
    required_qualifications: list[str]
    preferred_qualifications: list[str]
    what_we_offer: list[str]

class InterviewKitOutput(BaseModel):
    job_description: JobDescription
    behavioral_questions: list[BehavioralQuestion]
    technical_questions: list[TechnicalQuestion]
    scorecard: list[ScorecardItem]
    skills_rubric: list[SkillRubricItem]
```

---

## Prisma Schema (Backend DB)

```prisma
// schema.prisma

model User {
  id           String         @id @default(uuid())
  name         String
  email        String         @unique
  password     String
  role         String         @default("hiring_manager")
  createdAt    DateTime       @default(now())
  interviewKits InterviewKit[]
}

model InterviewKit {
  id               String   @id @default(uuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  roleTitle        String
  department       String
  experienceLevel  String
  roleInput        Json
  generatedOutput  Json
  pdfUrl           String?
  docxUrl          String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  aiLogs           AILog[]
}

model RoleTemplate {
  id             String   @id @default(uuid())
  title          String
  seniorityLevel String
  department     String
  content        Json
  createdAt      DateTime @default(now())
}

model AILog {
  id              String       @id @default(uuid())
  kitId           String
  kit             InterviewKit @relation(fields: [kitId], references: [id])
  requestPayload  Json
  responsePayload Json?
  status          String
  durationMs      Int?
  createdAt       DateTime     @default(now())
}
```

---

## Validation Rules
- `scorecard` weights must sum to exactly 100
- `behavioralQuestions` minimum 5, maximum 10
- `technicalQuestions` minimum 5, maximum 10
- `skillsRubric` must cover all items in `requiredSkills`
- `experienceLevel` must be one of the enum values
- All string fields: trim whitespace, reject empty strings
