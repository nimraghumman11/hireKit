"""Validate that generated kit output matches kit.schema.json."""
import json
from pathlib import Path
import jsonschema
import pytest


SCHEMA_PATH = Path(__file__).parent.parent.parent / ".claude" / "skills" / "shared" / "kit.schema.json"


@pytest.fixture
def schema():
    if not SCHEMA_PATH.exists():
        pytest.skip(f"Schema not found at {SCHEMA_PATH}")
    return json.loads(SCHEMA_PATH.read_text())


def test_generated_kit_matches_schema(schema, generated_kit_fixture):
    """Kit fixture must validate against the shared JSON schema."""
    jsonschema.validate(instance=generated_kit_fixture, schema=schema)


def test_behavioral_questions_have_scoring_guide(generated_kit_fixture):
    for q in generated_kit_fixture["behavioralQuestions"]:
        assert "scoringGuide" in q, f"Missing scoringGuide in question {q.get('id')}"
        for key in ("1", "3", "5"):
            assert key in q["scoringGuide"], f"Missing score key '{key}' in {q.get('id')}"


def test_technical_questions_have_required_fields(generated_kit_fixture):
    required = {"id", "question", "difficulty", "topic", "evalCriteria", "sampleAnswer", "redFlags"}
    for q in generated_kit_fixture["technicalQuestions"]:
        missing = required - set(q.keys())
        assert not missing, f"Missing fields in technical question: {missing}"


def test_scorecard_weights_sum_to_one(generated_kit_fixture):
    total = sum(item["weight"] for item in generated_kit_fixture["scorecard"])
    assert abs(total - 1.0) < 0.01, f"Scorecard weights sum to {total}, expected ~1.0"


def test_rubric_has_all_proficiency_levels(generated_kit_fixture):
    levels = {"novice", "intermediate", "advanced", "expert"}
    for item in generated_kit_fixture["rubric"]:
        found = set(item["proficiencyLevels"].keys())
        missing = levels - found
        assert not missing, f"Missing proficiency levels for {item['skill']}: {missing}"
