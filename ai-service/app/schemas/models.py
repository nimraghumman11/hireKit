from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class PlainRoleInput(BaseModel):
    description: str = Field(..., min_length=20)


class RoleInput(BaseModel):
    roleTitle: str = Field(..., min_length=2)
    department: str
    experienceLevel: str
    workMode: str = "remote"
    teamSize: Optional[str] = None
    responsibilities: list[str] = Field(default_factory=list)
    requiredSkills: list[str] = Field(default_factory=list)
    niceToHaveSkills: list[str] = []
    focusAreas: list[str] = Field(default_factory=list)
    additionalNotes: Optional[str] = None


class JobDescription(BaseModel):
    # Rich structured sections (new)
    aboutTheRole: Optional[str] = None
    whyJoinUs: Optional[str] = None
    requiredQualifications: list[str] = []
    preferredQualifications: list[str] = []
    whatYoullBring: Optional[str] = None
    compensationAndBenefits: Optional[str] = None
    # Core fields (always present)
    summary: str = ""
    responsibilities: list[str] = []
    requiredSkills: list[str] = []
    niceToHaveSkills: list[str] = []
    workMode: str = "remote"
    salaryRange: Optional[str] = None


class ScoringGuide(BaseModel):
    field_1: str = Field(alias="1")
    field_3: str = Field(alias="3")
    field_5: str = Field(alias="5")

    class Config:
        populate_by_name = True


class BehavioralQuestion(BaseModel):
    id: str
    question: str
    competency: str
    evalCriteria: str
    followUps: list[str]
    scoringGuide: ScoringGuide


class TechnicalQuestion(BaseModel):
    id: str
    question: str
    difficulty: str  # easy | medium | hard
    topic: str
    evalCriteria: str
    sampleAnswer: str
    redFlags: list[str]


class ScorecardItem(BaseModel):
    competency: str
    weight: float
    score: Optional[float] = None
    notes: str = ""


class ProficiencyLevels(BaseModel):
    novice: str
    intermediate: str
    advanced: str
    expert: str


class RubricItem(BaseModel):
    skill: str
    proficiencyLevels: ProficiencyLevels


class LanguageIssue(BaseModel):
    term: str
    suggestion: str
    severity: str   # "warning" | "error"
    source: str     # "jobDescription" | "behavioralQuestions" | "technicalQuestions" | "rubric"


class InterviewKit(BaseModel):
    roleTitle: str
    department: str
    experienceLevel: str
    jobDescription: JobDescription
    behavioralQuestions: list[BehavioralQuestion]
    technicalQuestions: list[TechnicalQuestion]
    scorecard: list[ScorecardItem]
    rubric: list[RubricItem]
    languageIssues: list[LanguageIssue] = []


class KitStatusResponse(BaseModel):
    status: str


class ExportRequest(BaseModel):
    kitId: str
    kitData: dict


class ExportResponse(BaseModel):
    url: str
