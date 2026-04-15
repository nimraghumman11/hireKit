"""LangGraph StateGraph — wires all nodes together."""
from __future__ import annotations
from langgraph.graph import StateGraph, END
from app.graph.state import KitState
from app.graph.nodes import (
    parse_role_node,
    validate_input_node,
    rag_retrieval_node,
    parallel_generation_node,
    language_check_node,
    assemble_kit_node,
)


def build_workflow():
    workflow = StateGraph(KitState)

    workflow.add_node("parse_role", parse_role_node)
    workflow.add_node("validate", validate_input_node)
    workflow.add_node("rag", rag_retrieval_node)
    workflow.add_node("parallel_gen", parallel_generation_node)
    workflow.add_node("language_check", language_check_node)
    workflow.add_node("assemble", assemble_kit_node)

    # Pipeline: parse → validate → rag → ALL sections in parallel → language check (parallel) → assemble
    workflow.set_entry_point("parse_role")
    workflow.add_edge("parse_role", "validate")
    workflow.add_edge("validate", "rag")
    workflow.add_edge("rag", "parallel_gen")
    workflow.add_edge("parallel_gen", "language_check")
    workflow.add_edge("language_check", "assemble")
    workflow.add_edge("assemble", END)

    return workflow.compile()


# Singleton compiled workflow
_compiled_workflow = None


def get_workflow():
    global _compiled_workflow
    if _compiled_workflow is None:
        _compiled_workflow = build_workflow()
    return _compiled_workflow
