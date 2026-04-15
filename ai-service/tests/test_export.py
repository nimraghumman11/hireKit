"""PDF export: core Helvetica fonts are Latin-1 only; content must be sanitized."""
import os

import pytest

from config import get_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_generate_pdf_accepts_unicode_in_kit_text(tmp_path, monkeypatch):
    """Previously failed with FPDFUnicodeEncodingException on bullets / em dashes in layout."""
    monkeypatch.setenv("PDF_STORAGE_PATH", str(tmp_path))
    get_settings.cache_clear()

    from app.export.pdf_generator import generate_pdf

    kit = {
        "roleTitle": "Role — with em dash",
        "department": "Eng",
        "experienceLevel": "mid",
        "jobDescription": {
            "summary": "Summary with smart quotes “like this”",
            "responsibilities": ["Do things • with bullet in text"],
            "requiredSkills": ["Python"],
            "niceToHaveSkills": [],
            "workMode": "remote",
            "salaryRange": None,
        },
        "behavioralQuestions": [
            {
                "id": "1",
                "question": "Tell us about • leadership",
                "competency": "Leadership",
                "evalCriteria": "Clear examples",
                "followUps": ["Follow-up one"],
                "scoringGuide": {"1": "Weak", "3": "OK", "5": "Strong"},
            }
        ],
        "technicalQuestions": [
            {
                "id": "1",
                "question": "System design?",
                "difficulty": "medium",
                "topic": "Architecture",
                "evalCriteria": "Sound reasoning",
                "sampleAnswer": "Use caching",
                "redFlags": ["No tradeoffs"],
            }
        ],
        "scorecard": [{"competency": "Communication", "weight": 1.0, "score": None, "notes": ""}],
        "rubric": [
            {
                "skill": "Python",
                "proficiencyLevels": {
                    "novice": "Basic",
                    "intermediate": "Solid",
                    "advanced": "Expert",
                    "expert": "Principal",
                },
            }
        ],
    }

    url = generate_pdf(kit, "unicode-test-kit")
    assert url.endswith("/static/pdfs/kits/unicode-test-kit/interview-kit.pdf")
    pdf_file = tmp_path / "kits" / "unicode-test-kit" / "interview-kit.pdf"
    assert pdf_file.is_file()
    assert pdf_file.stat().st_size > 100
