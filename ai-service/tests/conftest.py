import pytest


@pytest.fixture
def role_input_fixture():
    return {
        "roleTitle": "Senior Frontend Engineer",
        "department": "Engineering",
        "experienceLevel": "senior",
        "workMode": "remote",
        "teamSize": "6-15",
        "responsibilities": [
            "Lead frontend architecture decisions",
            "Mentor junior engineers",
            "Collaborate with design and product",
        ],
        "requiredSkills": ["TypeScript", "React", "CSS"],
        "niceToHaveSkills": ["GraphQL", "AWS"],
        "focusAreas": ["technical", "communication", "leadership"],
        "additionalNotes": None,
    }


@pytest.fixture
def generated_kit_fixture():
    return {
        "roleTitle": "Senior Frontend Engineer",
        "department": "Engineering",
        "experienceLevel": "senior",
        "jobDescription": {
            "summary": "We seek an experienced frontend engineer.",
            "responsibilities": ["Lead architecture", "Mentor team", "Review code"],
            "requiredSkills": ["TypeScript", "React"],
            "niceToHaveSkills": ["GraphQL"],
            "workMode": "remote",
            "salaryRange": "$140k–$180k",
        },
        "behavioralQuestions": [
            {
                "id": "bq-1",
                "question": "Tell me about a time you led a major refactor.",
                "competency": "Technical Leadership",
                "evalCriteria": "Look for systematic approach.",
                "followUps": ["How did you handle resistance?"],
                "scoringGuide": {"1": "No structure", "3": "Good process", "5": "Clear impact"},
            },
            {
                "id": "bq-2",
                "question": "Describe a conflict you resolved in a team.",
                "competency": "Communication",
                "evalCriteria": "Look for empathy and resolution.",
                "followUps": ["What would you do differently?"],
                "scoringGuide": {"1": "Avoided conflict", "3": "Partial resolution", "5": "Win-win outcome"},
            },
            {
                "id": "bq-3",
                "question": "Tell me about a project that failed.",
                "competency": "Resilience",
                "evalCriteria": "Look for learning mindset.",
                "followUps": [],
                "scoringGuide": {"1": "No reflection", "3": "Some learning", "5": "Deep insight"},
            },
        ],
        "technicalQuestions": [
            {
                "id": "tq-1",
                "question": "Explain React reconciliation.",
                "difficulty": "medium",
                "topic": "React",
                "evalCriteria": "Explain virtual DOM diffing.",
                "sampleAnswer": "React compares virtual DOM trees.",
                "redFlags": ["Confuses with re-rendering"],
            },
            {
                "id": "tq-2",
                "question": "What is the difference between useMemo and useCallback?",
                "difficulty": "medium",
                "topic": "React Hooks",
                "evalCriteria": "Understand memoization.",
                "sampleAnswer": "useMemo returns a value, useCallback returns a function.",
                "redFlags": [],
            },
            {
                "id": "tq-3",
                "question": "How do you optimise a slow React app?",
                "difficulty": "hard",
                "topic": "Performance",
                "evalCriteria": "Profiling, code splitting, lazy loading.",
                "sampleAnswer": "Use React.memo, lazy(), Suspense, and profile with DevTools.",
                "redFlags": ["Suggests rewriting without profiling first"],
            },
        ],
        "scorecard": [
            {"competency": "Technical Skills", "weight": 0.4, "score": None, "notes": ""},
            {"competency": "Communication", "weight": 0.3, "score": None, "notes": ""},
            {"competency": "Culture Fit", "weight": 0.3, "score": None, "notes": ""},
        ],
        "rubric": [
            {
                "skill": "React",
                "proficiencyLevels": {
                    "novice": "Can build basic components.",
                    "intermediate": "Understands hooks.",
                    "advanced": "Designs scalable architecture.",
                    "expert": "Contributes to the ecosystem.",
                },
            }
        ],
    }
