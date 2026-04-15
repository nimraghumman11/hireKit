"""AI output quality checks — inclusive language, uniqueness, completeness."""
import json
import pytest


BANNED_TERMS = ["ninja", "rockstar", "guru", "wizard", "he ", "she ", "his ", "her "]


def test_job_description_uses_inclusive_language(generated_kit_fixture):
    jd_text = json.dumps(generated_kit_fixture["jobDescription"]).lower()
    for term in BANNED_TERMS:
        assert term not in jd_text, f"Found banned/non-inclusive term: '{term}'"


def test_behavioral_questions_are_unique(generated_kit_fixture):
    questions = [q["question"] for q in generated_kit_fixture["behavioralQuestions"]]
    assert len(questions) == len(set(questions)), "Duplicate behavioral questions found"


def test_technical_questions_are_unique(generated_kit_fixture):
    questions = [q["question"] for q in generated_kit_fixture["technicalQuestions"]]
    assert len(questions) == len(set(questions)), "Duplicate technical questions found"


def test_minimum_question_counts(generated_kit_fixture):
    assert len(generated_kit_fixture["behavioralQuestions"]) >= 3, "Need at least 3 behavioral questions"
    assert len(generated_kit_fixture["technicalQuestions"]) >= 3, "Need at least 3 technical questions"


def test_difficulty_values_are_valid(generated_kit_fixture):
    valid = {"easy", "medium", "hard"}
    for q in generated_kit_fixture["technicalQuestions"]:
        assert q["difficulty"] in valid, f"Invalid difficulty '{q['difficulty']}'"


def test_scorecard_weights_are_positive(generated_kit_fixture):
    for item in generated_kit_fixture["scorecard"]:
        assert item["weight"] > 0, f"Scorecard weight for '{item['competency']}' must be positive"
