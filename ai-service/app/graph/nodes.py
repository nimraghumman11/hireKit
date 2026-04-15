"""LangGraph node functions — one per graph node."""
from __future__ import annotations
import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from app.graph.state import KitState
from app.retrieval.retriever import get_retriever
from app.tools.tools import (
    parse_plain_description,
    generate_job_description,
    generate_behavioral_questions,
    generate_technical_questions,
    generate_scorecard,
    generate_rubric,
    run_inclusive_language_check,
    JD_PROMPT,
    BEHAVIORAL_PROMPT,
    TECHNICAL_PROMPT,
    SCORECARD_PROMPT,
    RUBRIC_PROMPT,
    _strip_fences,
)
from app.tools.llm import get_llm

logger = logging.getLogger(__name__)


def parse_role_node(state: KitState) -> KitState:
    """Convert plain language description into structured role_input."""
    description = state.get("plain_description", "")
    if not description:
        return state  # role_input already set directly, skip parsing
    try:
        logger.info("Parsing plain description into structured role input")
        role_input = parse_plain_description(description)
        return {**state, "role_input": role_input}
    except Exception as exc:
        logger.error("parse_role_node failed: %s", exc)
        return {**state, "error": f"Failed to parse role description: {exc}"}


def validate_input_node(state: KitState) -> KitState:
    role_input = state.get("role_input", {})
    errors: list[str] = []

    if not role_input.get("roleTitle"):
        errors.append("roleTitle is required")
    if not role_input.get("department"):
        errors.append("department is required")
    if not role_input.get("experienceLevel"):
        errors.append("experienceLevel is required")
    if len(role_input.get("responsibilities", [])) < 3:
        errors.append("at least 3 responsibilities required")
    if not role_input.get("requiredSkills"):
        errors.append("requiredSkills must not be empty")

    return {**state, "validation_errors": errors, "error": "; ".join(errors) if errors else None}


def rag_retrieval_node(state: KitState) -> KitState:
    if state.get("validation_errors"):
        return state
    role_input = state["role_input"]
    query = f"{role_input.get('experienceLevel')} {role_input.get('roleTitle')} {role_input.get('department')}"
    context = get_retriever().search(query)
    logger.info("RAG retrieved %d chars of context", len(context))
    return {**state, "rag_context": context}


async def parallel_generation_node(state: KitState) -> KitState:
    """Run JD, behavioral, technical, scorecard, and rubric generation concurrently.

    Each section chain is tagged with ``section:<name>`` so that
    LangGraph's ``astream_events`` can attribute individual LLM token
    chunks to the correct section in the streaming endpoint.
    """
    if state.get("error"):
        return state

    role_input = state["role_input"]
    rag_context = state.get("rag_context", "")

    required_skills  = role_input.get("requiredSkills", [])
    nice_to_have     = role_input.get("niceToHaveSkills", [])
    focus_areas      = ", ".join(role_input.get("focusAreas", ["technical_depth", "problem_solving", "collaboration"]))
    responsibilities = "\n".join(f"- {r}" for r in role_input.get("responsibilities", []))
    ctx              = rag_context or "No additional context available."
    level            = role_input["experienceLevel"]

    section_configs = [
        ("jobDescription", JD_PROMPT, {
            "role_title":              role_input["roleTitle"],
            "department":              role_input["department"],
            "experience_level":        level,
            "work_mode":               role_input.get("workMode", "remote"),
            "responsibilities":        responsibilities,
            "required_skills":         ", ".join(required_skills),
            "nice_to_have_skills":     ", ".join(nice_to_have),
            "additional_notes":        role_input.get("additionalNotes") or "Not provided",
            "required_skills_list":    json.dumps(required_skills),
            "nice_to_have_skills_list": json.dumps(nice_to_have),
            "rag_context":             ctx,
        }, 0.4),
        ("behavioralQuestions", BEHAVIORAL_PROMPT, {
            "role_title":       role_input["roleTitle"],
            "experience_level": level,
            "focus_areas":      focus_areas,
            "responsibilities": responsibilities,
            "rag_context":      ctx,
            "count_guide": (
                "- junior: 5-6 questions\n- mid: 6-8 questions\n"
                "- senior: 8-10 questions\n- lead / principal / director: 10-12 questions"
            ),
        }, 0.6),
        ("technicalQuestions", TECHNICAL_PROMPT, {
            "role_title":       role_input["roleTitle"],
            "experience_level": level,
            "required_skills":  ", ".join(required_skills),
            "responsibilities": responsibilities,
            "rag_context":      ctx,
            "count_guide": (
                "- junior: 5-6 questions\n- mid: 7-9 questions\n"
                "- senior: 10-12 questions\n- lead / principal: 12-14 questions"
            ),
        }, 0.4),
        ("scorecard", SCORECARD_PROMPT, {
            "role_title":       role_input["roleTitle"],
            "department":       role_input.get("department", "Engineering"),
            "experience_level": level,
            "focus_areas":      focus_areas,
            "required_skills":  ", ".join(required_skills),
        }, 0.2),
        ("rubric", RUBRIC_PROMPT, {
            "skills":           ", ".join(required_skills),
            "experience_level": level,
        }, 0.2),
    ]

    async def _stream_section(section_name: str, prompt, variables: dict, temperature: float):
        """Stream one section via astream(), collecting the full JSON response.

        Tagging the chain with ``section:<name>`` causes LangGraph's
        astream_events to attach that tag to every on_chat_model_stream event
        emitted while this chain runs, making section attribution trivial.
        """
        llm = get_llm(temperature)
        chain = (prompt | llm).with_config({
            "run_name": f"section_{section_name}",
            "tags": [f"section:{section_name}"],
        })
        accumulated = ""
        async for chunk in chain.astream(variables):
            token = chunk.content if hasattr(chunk, "content") else ""
            accumulated += token
        return section_name, json.loads(_strip_fences(accumulated))

    results_list = await asyncio.gather(
        *[_stream_section(name, prompt, variables, temp)
          for name, prompt, variables, temp in section_configs],
        return_exceptions=True,
    )

    errors: list[str] = []
    section_map: dict = {}
    for r in results_list:
        if isinstance(r, Exception):
            errors.append(str(r))
            logger.error("parallel_generation_node section failed: %s", r)
        else:
            section_name, data = r
            section_map[section_name] = data
            logger.info("parallel_generation_node: %s done", section_name)

    if errors:
        return {**state, "error": "; ".join(errors)}

    return {
        **state,
        "job_description":      section_map.get("jobDescription"),
        "behavioral_questions": section_map.get("behavioralQuestions"),
        "technical_questions":  section_map.get("technicalQuestions"),
        "scorecard":            section_map.get("scorecard"),
        "rubric":               section_map.get("rubric"),
    }


def language_check_node(state: KitState) -> KitState:
    """Run inclusive-language checks on all sections concurrently."""
    if state.get("error") or not state.get("job_description"):
        return {**state, "language_issues": []}
    try:
        import json

        sections = {
            "jobDescription":      state.get("job_description", {}),
            "behavioralQuestions": state.get("behavioral_questions", []),
            "technicalQuestions":  state.get("technical_questions", []),
            "rubric":              state.get("rubric", []),
        }

        def check_section(source: str, content) -> list[dict]:
            if not content:
                return []
            issues = run_inclusive_language_check(json.dumps(content), source)
            logger.info("language_check_node: %d issue(s) in %s", len(issues), source)
            return issues

        all_issues: list[dict] = []
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {executor.submit(check_section, src, content): src
                       for src, content in sections.items()}
            for future in as_completed(futures):
                try:
                    all_issues.extend(future.result())
                except Exception as exc:
                    logger.warning("language_check section failed (non-fatal): %s", exc)

        return {**state, "language_issues": all_issues}
    except Exception as exc:
        logger.warning("language_check_node failed (non-fatal): %s", exc)
        return {**state, "language_issues": []}


def assemble_kit_node(state: KitState) -> KitState:
    if state.get("error"):
        return {**state, "final_kit": None}

    role_input = state["role_input"]
    final_kit = {
        "roleTitle": role_input["roleTitle"],
        "department": role_input["department"],
        "experienceLevel": role_input["experienceLevel"],
        "jobDescription": state.get("job_description"),
        "behavioralQuestions": state.get("behavioral_questions", []),
        "technicalQuestions": state.get("technical_questions", []),
        "scorecard": state.get("scorecard", []),
        "rubric": state.get("rubric", []),
        "languageIssues": state.get("language_issues", []),
    }
    return {**state, "final_kit": final_kit}
