#!/bin/bash
# GenAI Interview Kit — Agent Launcher
# Usage: ./run-agents.sh [orchestrator|backend|ai|frontend|testing|all]

set -e

SKILL_DIR="./skills"
SUBAGENT_DIR="./subagents"

launch_agent() {
  local name=$1
  local subagent_file=$2
  local skill_file=$3
  local task=$4

  echo ""
  echo "=========================================="
  echo "  Launching: $name"
  echo "=========================================="

  # Combine subagent system prompt + skill into one context
  SYSTEM_PROMPT=$(cat "$subagent_file")
  SKILL_CONTENT=$(cat "$skill_file")

  claude \
    --system-prompt "$SYSTEM_PROMPT" \
    --context "$SKILL_CONTENT" \
    -p "$task"
}

case "${1:-help}" in
  orchestrator)
    launch_agent "Orchestrator" \
      "$SUBAGENT_DIR/orchestrator.md" \
      "CLAUDE.md" \
      "Read CLAUDE.md, then plan and delegate tasks to build the interview-kit application from scratch. Start with Phase 1 project setup."
    ;;

  backend)
    launch_agent "Backend Agent" \
      "$SUBAGENT_DIR/backend-agent.md" \
      "$SKILL_DIR/backend/SKILL.md" \
      "${2:-Build the NestJS backend: auth module, interview-kit CRUD, AI bridge, Prisma schema, and Redis caching. Follow the skill file step by step.}"
    ;;

  ai)
    launch_agent "AI Agent" \
      "$SUBAGENT_DIR/ai-agent.md" \
      "$SKILL_DIR/ai-service/SKILL.md" \
      "${2:-Build the FastAPI AI service: RAG pipeline, LangChain tools, LangGraph workflow, and PDF export. Follow the skill file step by step.}"
    ;;

  frontend)
    launch_agent "Frontend Agent" \
      "$SUBAGENT_DIR/frontend-agent.md" \
      "$SKILL_DIR/frontend/SKILL.md" \
      "${2:-Build the React frontend: auth pages, dashboard, create-kit wizard, results page. Follow the skill file step by step.}"
    ;;

  testing)
    launch_agent "Testing Agent" \
      "$SUBAGENT_DIR/testing-agent.md" \
      "$SKILL_DIR/testing/SKILL.md" \
      "${2:-Write all tests: backend unit, backend API, AI schema validation, AI quality checks, frontend components, and Playwright e2e. Follow the skill file.}"
    ;;

  all)
    echo "Running all agents in build order..."
    ./run-agents.sh backend
    ./run-agents.sh ai
    ./run-agents.sh frontend
    ./run-agents.sh testing
    echo ""
    echo "All agents complete."
    ;;

  *)
    echo "Usage: ./run-agents.sh [orchestrator|backend|ai|frontend|testing|all]"
    echo ""
    echo "  orchestrator  — Plans and delegates all work"
    echo "  backend       — Builds NestJS backend"
    echo "  ai            — Builds FastAPI AI service"
    echo "  frontend      — Builds React frontend"
    echo "  testing       — Writes all tests"
    echo "  all           — Runs backend → ai → frontend → testing in order"
    echo ""
    echo "Pass a custom task as second argument:"
    echo "  ./run-agents.sh backend 'Add Redis caching to the kit list endpoint'"
    ;;
esac
