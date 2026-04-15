"""Tests for the LangGraph workflow nodes."""
import pytest
from unittest.mock import patch


def test_validate_input_node_passes_valid_input(role_input_fixture):
    from app.graph.nodes import validate_input_node
    state = {"role_input": role_input_fixture}
    result = validate_input_node(state)
    assert result["validation_errors"] == []
    assert result.get("error") is None


def test_validate_input_node_catches_missing_fields():
    from app.graph.nodes import validate_input_node
    state = {"role_input": {}}
    result = validate_input_node(state)
    assert len(result["validation_errors"]) > 0


def test_assemble_kit_node_merges_state(role_input_fixture):
    from app.graph.nodes import assemble_kit_node
    state = {
        "role_input": role_input_fixture,
        "error": None,
        "job_description": {"summary": "Test JD", "responsibilities": [], "requiredSkills": [], "niceToHaveSkills": [], "workMode": "remote"},
        "behavioral_questions": [{"id": "bq-1", "question": "Q?", "competency": "C", "evalCriteria": "E", "followUps": [], "scoringGuide": {"1": "a", "3": "b", "5": "c"}}],
        "technical_questions": [],
        "scorecard": [{"competency": "Technical", "weight": 1.0, "score": None, "notes": ""}],
        "rubric": [],
    }
    result = assemble_kit_node(state)
    kit = result["final_kit"]
    assert kit is not None
    assert kit["roleTitle"] == role_input_fixture["roleTitle"]
    assert kit["jobDescription"]["summary"] == "Test JD"


def test_assemble_kit_node_returns_none_on_error(role_input_fixture):
    from app.graph.nodes import assemble_kit_node
    state = {"role_input": role_input_fixture, "error": "something went wrong"}
    result = assemble_kit_node(state)
    assert result["final_kit"] is None


def test_rag_retrieval_node_skips_on_validation_errors(role_input_fixture):
    from app.graph.nodes import rag_retrieval_node
    state = {"role_input": role_input_fixture, "validation_errors": ["roleTitle is required"]}
    result = rag_retrieval_node(state)
    assert "rag_context" not in result or result.get("rag_context") is None
