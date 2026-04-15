from __future__ import annotations
from typing import TypedDict, Optional


class KitState(TypedDict, total=False):
    plain_description: str
    role_input: dict
    validation_errors: list[str]
    rag_context: str
    job_description: Optional[dict]
    behavioral_questions: Optional[list[dict]]
    technical_questions: Optional[list[dict]]
    scorecard: Optional[list[dict]]
    rubric: Optional[list[dict]]
    language_issues: Optional[list[dict]]
    error: Optional[str]
    final_kit: Optional[dict]
