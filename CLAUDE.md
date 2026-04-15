# GenAI Interview Kit — CLAUDE.md

## Project Overview
A monorepo system that lets hiring managers describe a role and receive a complete,
AI-generated interview kit: job description, behavioral + technical questions,
scorecard, skills rubric, and a downloadable PDF/DOCX package.

## Monorepo Structure
```
interview-kit/
  frontend/          # React + TypeScript + Tailwind + React Query
  backend/           # NestJS + Prisma + PostgreSQL + JWT
  ai-service/        # FastAPI + LangChain + LangGraph + FAISS
  .claude/skills/    # SKILL.md files for each agent domain
  .claude/subagents/ # Subagent system prompt files
  CLAUDE.md          # This file — read by every agent before acting
```

## Non-Negotiable Rules (All Agents)
1. Read your domain `SKILL.md` under `.claude/skills/<domain>/` before writing any code.
2. Never modify files outside your assigned domain folder.
3. All API responses must use the envelope: { data, error, meta }.
4. All AI tool outputs must return structured JSON matching /shared/kit.schema.json.
5. Write tests alongside every feature — no untested code ships.
6. Use inclusive, bias-free language in all generated content.
7. Never hardcode secrets — use environment variables via .env.

## Naming Conventions
- Database columns: snake_case
- TypeScript / JavaScript: camelCase
- Python: snake_case
- React components: PascalCase
- API routes: kebab-case

## Git Commit Format
<type>(<scope>): <short description>
Types: feat | fix | refactor | test | docs | chore
Example: feat(ai): add RAG retrieval node to LangGraph workflow

## Environment Variables
DATABASE_URL=
JWT_SECRET=
AI_SERVICE_URL=
OPENAI_API_KEY= (or ANTHROPIC_API_KEY)
PDF_STORAGE_PATH=./data/pdfs
AI_SERVICE_BASE_URL=http://localhost:8000
REDIS_URL=

## Agent Build Order
1. Backend agent  — auth + DB + CRUD APIs
2. AI agent       — RAG + LangChain tools + LangGraph workflow
3. Frontend agent — forms + dashboard + results page
4. Testing agent  — unit + API + e2e + AI validation

## Shared JSON Schema
All agents must respect `.claude/skills/shared/kit.schema.json` as the single
source of truth for the InterviewKit data structure.
