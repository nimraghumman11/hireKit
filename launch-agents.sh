#!/bin/bash
# =============================================================================
# GenAI Interview Kit — Claude Code Subagent Launcher
# Usage: ./launch-agents.sh [orchestrator|frontend|backend|ai|testing|all]
# =============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_MD="$PROJECT_ROOT/CLAUDE.md"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${BLUE}[launcher]${NC} $1"; }
success() { echo -e "${GREEN}[done]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }

check_claude_code() {
  if ! command -v claude &> /dev/null; then
    echo "Claude Code not found. Install it from: https://claude.ai/code"
    exit 1
  fi
}

# ─── Individual agent launchers ───────────────────────────────────────────────

launch_orchestrator() {
  log "Launching Orchestrator agent..."
  claude \
    --system-prompt "$(cat "$PROJECT_ROOT/subagents/orchestrator.md")" \
    "Read CLAUDE.md at $CLAUDE_MD, then coordinate all subagents in the correct build order as defined in your instructions."
}

launch_backend() {
  log "Launching Backend agent..."
  claude \
    --system-prompt "$(cat "$PROJECT_ROOT/subagents/backend-agent.md")" \
    "Read CLAUDE.md, then read skills/backend/SKILL.md, then build Phase 1 of the backend as described in your instructions. Work in the backend/ folder."
}

launch_ai() {
  log "Launching AI Service agent..."
  claude \
    --system-prompt "$(cat "$PROJECT_ROOT/subagents/ai-agent.md")" \
    "Read CLAUDE.md, then read skills/ai-service/SKILL.md and skills/shared/prompt_library.md, then build the complete AI service as described in your instructions. Work in the ai-service/ folder."
}

launch_frontend() {
  log "Launching Frontend agent..."
  claude \
    --system-prompt "$(cat "$PROJECT_ROOT/subagents/frontend-agent.md")" \
    "Read CLAUDE.md, then read skills/frontend/SKILL.md, then build the complete React frontend as described in your instructions. Work in the frontend/ folder."
}

launch_testing() {
  log "Launching Testing agent..."
  claude \
    --system-prompt "$(cat "$PROJECT_ROOT/subagents/testing-agent.md")" \
    "Read CLAUDE.md, then read skills/testing/SKILL.md, then write all tests as described in your instructions. Cover all three layers: frontend, backend, and ai-service."
}

# ─── Sequential full build ────────────────────────────────────────────────────

launch_all_sequential() {
  log "Starting full sequential build..."
  log "Phase 1: Backend foundation"
  launch_backend
  success "Backend agent complete"

  log "Phase 2: AI Service"
  launch_ai
  success "AI agent complete"

  log "Phase 3: Frontend"
  launch_frontend
  success "Frontend agent complete"

  log "Phase 4: Tests"
  launch_testing
  success "Testing agent complete"

  success "All agents complete! Run verification steps from orchestrator.md"
}

# ─── Main ─────────────────────────────────────────────────────────────────────

check_claude_code

case "${1:-help}" in
  orchestrator) launch_orchestrator ;;
  backend)      launch_backend ;;
  ai)           launch_ai ;;
  frontend)     launch_frontend ;;
  testing)      launch_testing ;;
  all)          launch_all_sequential ;;
  help|*)
    echo ""
    echo "Usage: ./launch-agents.sh <agent>"
    echo ""
    echo "Agents:"
    echo "  orchestrator  — Coordinates all agents in correct order"
    echo "  backend       — NestJS + Prisma + PostgreSQL + JWT"
    echo "  ai            — FastAPI + LangChain + LangGraph + RAG"
    echo "  frontend      — React + TypeScript + Tailwind + Zustand"
    echo "  testing       — Vitest + Jest + pytest + Playwright"
    echo "  all           — Run all agents in sequence (backend → ai → frontend → testing)"
    echo ""
    echo "Recommended: Start with 'orchestrator' for coordinated build"
    echo "Or run 'all' to build everything in sequence automatically"
    echo ""
    ;;
esac
