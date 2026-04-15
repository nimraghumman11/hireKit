# GenAI Interview Kit

A monorepo that lets hiring managers describe a role and receive a complete,
AI-generated interview kit: job description, behavioral and technical questions,
scorecard, skills rubric, and a downloadable PDF/DOCX package.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [AI Pipeline](#ai-pipeline)
7. [API Reference](#api-reference)
8. [Running the Project](#running-the-project)
9. [Environment Variables](#environment-variables)
10. [Testing](#testing)

---

## What It Does

1. A hiring manager logs in and describes a role in plain language.
2. The backend forwards the request to the AI service.
3. The AI service runs a LangGraph pipeline: parses the role, retrieves context
   from a FAISS vector store (RAG), generates all kit sections in parallel, runs
   a language/bias check, and assembles the final kit.
4. The structured kit is saved to PostgreSQL and returned to the frontend.
5. The hiring manager reviews the kit, regenerates individual sections if needed,
   and exports to PDF or DOCX.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Browser / Client                                │
│                         React + Vite  (port 5173)                            │
│                                                                              │
│   ┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐  │
│   │  Auth Pages │   │  Dashboard   │   │  Kit Builder │   │ Results/    │  │
│   │  Login /    │   │  Kit list,   │   │  Role form,  │   │ Export      │  │
│   │  Register   │   │  history     │   │  generation  │   │ PDF / DOCX  │  │
│   └──────┬──────┘   └──────┬───────┘   └──────┬───────┘   └──────┬──────┘  │
└──────────┼─────────────────┼──────────────────┼─────────────────┼──────────┘
           │  JWT Bearer     │                  │                  │
           ▼                 ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Backend  —  NestJS  (port 3000)                      │
│                                                                              │
│   ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────┐  ┌────────┐  │
│   │  /auth   │  │  /users   │  │/interview-   │  │  /ai     │  │/export │  │
│   │  JWT +   │  │  Profile  │  │kits  CRUD,   │  │  Proxy   │  │PDF/    │  │
│   │  bcrypt  │  │  mgmt     │  │  share token │  │  to AI   │  │DOCX    │  │
│   └──────────┘  └───────────┘  └──────┬───────┘  └────┬─────┘  └────────┘  │
│                                        │               │                     │
│   ┌──────────────────────────────────────────────────────────────────────┐   │
│   │  Prisma ORM   │  Redis Cache (5-min TTL)  │  Rate Limiter (60/min)  │   │
│   └────────┬──────────────────────────────────────────────────────────┘─┘   │
└────────────┼─────────────────────────────────────────────────────────────────┘
             │                              │ HTTP
             ▼                              ▼
┌────────────────────┐       ┌──────────────────────────────────────────────────┐
│   PostgreSQL 16    │       │          AI Service  —  FastAPI  (port 8000)      │
│   (port 5433)      │       │                                                  │
│                    │       │  POST /generate-kit  (main endpoint)             │
│  users             │       │  POST /regenerate/*  (per-section)               │
│  interview_kits    │       │  POST /export/pdf                                │
│  ai_logs           │       │  POST /export/docx                               │
└────────────────────┘       │  GET  /health                                    │
                             │                                                  │
                             │  ┌────────────────────────────────────────────┐  │
                             │  │          LangGraph Workflow Pipeline        │  │
                             │  │                                            │  │
                             │  │  plain text                                │  │
                             │  │      │                                     │  │
                             │  │      ▼                                     │  │
                             │  │  [parse_role]  — LLM extracts structured   │  │
                             │  │      │           role fields               │  │
                             │  │      ▼                                     │  │
                             │  │  [validate]    — Pydantic schema check     │  │
                             │  │      │                                     │  │
                             │  │      ▼                                     │  │
                             │  │  [rag]         — FAISS vector search,      │  │
                             │  │      │           injects industry context  │  │
                             │  │      ▼                                     │  │
                             │  │  [parallel_gen]— Generates all sections    │  │
                             │  │      │           concurrently:             │  │
                             │  │      │             • Job Description       │  │
                             │  │      │             • Behavioral Questions  │  │
                             │  │      │             • Technical Questions   │  │
                             │  │      │             • Scorecard             │  │
                             │  │      │             • Skills Rubric         │  │
                             │  │      ▼                                     │  │
                             │  │  [language_check]— Bias / inclusion audit  │  │
                             │  │      │                                     │  │
                             │  │      ▼                                     │  │
                             │  │  [assemble]    — Final JSON kit            │  │
                             │  └────────────────────────────────────────────┘  │
                             │                                                  │
                             │  FAISS Index (persisted volume: ai_data)         │
                             │  PDF/DOCX files (served via /static/pdfs)        │
                             └──────────────────────────────────────────────────┘
```

**Data flow summary**

```
Browser → Backend (JWT auth) → AI Service (LangGraph) → LLM API
                                     │
                              FAISS vector store (RAG)
                                     │
                         Structured JSON kit returned
                                     │
Backend saves to PostgreSQL ←────────┘
                │
        Redis caches response (5 min)
                │
Frontend displays kit + export options
```

---

## Tech Stack

| Layer      | Technology                                                        |
|------------|-------------------------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query    |
| Backend    | NestJS 10, TypeScript, Prisma 5, JWT / Passport, Redis            |
| AI Service | FastAPI, LangChain, LangGraph, FAISS, OpenAI / Anthropic API      |
| Database   | PostgreSQL 16                                                     |
| Cache      | Redis 7                                                           |
| Container  | Docker + Docker Compose                                           |
| Testing    | Vitest (frontend), Jest (backend), Pytest (AI service)            |

---

## Project Structure

```
interview-kit/
├── frontend/               # React SPA
│   └── src/
│       ├── components/     # Shared UI components
│       ├── pages/          # Route-level pages
│       ├── hooks/          # Custom React hooks
│       ├── services/       # Axios API calls
│       ├── store/          # Zustand global state
│       └── types/          # TypeScript interfaces
│
├── backend/                # NestJS REST API
│   └── src/
│       ├── auth/           # JWT login / register
│       ├── users/          # User profile
│       ├── interview-kit/  # Kit CRUD + share tokens
│       ├── ai/             # Proxy to AI service
│       ├── export/         # PDF / DOCX download
│       ├── prisma/         # Prisma service wrapper
│       └── common/         # Guards, pipes, envelopes
│   └── prisma/
│       └── schema.prisma   # DB schema (source of truth)
│
├── ai-service/             # FastAPI + LangGraph
│   ├── main.py             # App entry point + all routes
│   ├── config.py           # Settings (env vars)
│   └── app/
│       ├── graph/          # LangGraph workflow + nodes
│       ├── chains/         # LangChain prompt chains
│       ├── tools/          # Generation tool functions
│       ├── retrieval/      # FAISS RAG retriever
│       ├── export/         # PDF + DOCX generators
│       └── schemas/        # Pydantic models
│
├── .claude/
│   ├── skills/             # SKILL.md files for each agent
│   │   └── shared/
│   │       └── kit.schema.json # Shared InterviewKit JSON schema
│   └── subagents/          # Subagent system prompt files
├── e2e/                    # End-to-end tests
├── docker-compose.yml      # Production-style Compose file
├── docker-compose.dev.yml  # Dev override (live-reload mounts)
├── .env.example            # Template for environment variables
└── CLAUDE.md               # Agent instructions
```

---

## Database Schema

```
users
  id            UUID  PK
  name          TEXT
  email         TEXT  UNIQUE
  password      TEXT  (bcrypt)
  role          TEXT  default "hiring_manager"
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

interview_kits
  id              UUID  PK
  user_id         UUID  FK → users
  role_title      TEXT
  department      TEXT
  experience_level TEXT
  work_mode       TEXT
  team_size       TEXT
  generated_output JSONB   ← full InterviewKit JSON
  pdf_url         TEXT
  docx_url        TEXT
  share_token     TEXT  UNIQUE
  status          TEXT  ("draft" | "complete")
  deleted_at      TIMESTAMP  (soft delete)
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

ai_logs
  id               UUID  PK
  kit_id           UUID  FK → interview_kits
  user_id          UUID  FK → users
  request_payload  JSONB
  response_payload JSONB
  status           TEXT
  duration_ms      INT
  created_at       TIMESTAMP
```

---

## AI Pipeline

The LangGraph workflow runs as a directed acyclic graph:

```
parse_role → validate → rag → parallel_gen → language_check → assemble → END
```

| Node             | Responsibility                                                       |
|------------------|----------------------------------------------------------------------|
| `parse_role`     | LLM extracts structured fields (title, department, level) from free text |
| `validate`       | Pydantic schema validation; rejects malformed input early            |
| `rag`            | FAISS similarity search injects industry-specific context            |
| `parallel_gen`   | Generates all 5 kit sections concurrently via LangChain chains       |
| `language_check` | Bias and inclusion audit on all generated text                       |
| `assemble`       | Merges sections into the final `InterviewKit` JSON                   |

Individual sections can also be regenerated independently via:
- `POST /regenerate/job-description`
- `POST /regenerate/behavioral-questions`
- `POST /regenerate/technical-questions`
- `POST /regenerate/scorecard`
- `POST /regenerate/rubric`

---

## API Reference

All backend responses use the envelope:

```json
{ "data": ..., "error": null, "meta": {} }
```

### Auth

| Method | Route               | Description         |
|--------|---------------------|---------------------|
| POST   | `/auth/register`    | Create account      |
| POST   | `/auth/login`       | Get JWT token       |

### Interview Kits

| Method | Route                          | Description               |
|--------|--------------------------------|---------------------------|
| POST   | `/interview-kits`              | Create + generate kit     |
| GET    | `/interview-kits`              | List my kits              |
| GET    | `/interview-kits/:id`          | Get single kit            |
| PATCH  | `/interview-kits/:id`          | Update kit                |
| DELETE | `/interview-kits/:id`          | Soft-delete kit           |
| POST   | `/interview-kits/:id/share`    | Generate share token      |
| GET    | `/interview-kits/share/:token` | Public shared kit (no auth)|

### Export

| Method | Route              | Description              |
|--------|--------------------|--------------------------|
| POST   | `/export/pdf/:id`  | Generate and return PDF  |
| POST   | `/export/docx/:id` | Generate and return DOCX |

### AI Service (internal, port 8000)

| Method | Route                              | Description              |
|--------|------------------------------------|--------------------------|
| POST   | `/generate-kit`                    | Full kit generation      |
| POST   | `/regenerate/job-description`      | Regenerate JD only       |
| POST   | `/regenerate/behavioral-questions` | Regenerate behavioral Qs |
| POST   | `/regenerate/technical-questions`  | Regenerate technical Qs  |
| POST   | `/regenerate/scorecard`            | Regenerate scorecard     |
| POST   | `/regenerate/rubric`               | Regenerate rubric        |
| POST   | `/export/pdf`                      | PDF file generation      |
| POST   | `/export/docx`                     | DOCX file generation     |
| GET    | `/health`                          | Health check             |

---

## Running the Project

### Prerequisites

- Docker Desktop (running)
- An OpenAI or Anthropic API key

### Option 1 — Docker Compose (recommended)

```bash
# 1. Copy and fill in your environment variables
cp .env.example .env
# Edit .env — set OPENAI_API_KEY or ANTHROPIC_API_KEY at minimum

# 2. Start all services (postgres, redis, backend, ai-service, frontend)
docker compose up --build

# Services will be available at:
#   Frontend  → http://localhost:5173
#   Backend   → http://localhost:3000
#   AI Service→ http://localhost:8000
#   Postgres  → localhost:5433  (use pgAdmin or psql)
```

On first boot the backend automatically runs Prisma migrations.

### Option 2 — Run each service locally (development)

**Postgres + Redis via Docker (required)**

```bash
docker compose up postgres redis -d
```

**Backend**

```bash
cd backend
npm install
# Make sure DATABASE_URL in .env points to localhost:5433
npx prisma migrate deploy
npm run start:dev          # http://localhost:3000
```

**AI Service**

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

### Option 3 — Dev Compose with live-reload

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This mounts source files into containers so code changes are picked up without
rebuilding images. Note: on Windows, volume mounts can be slow for large
`node_modules` — Option 2 is usually faster for active development.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values below.

| Variable             | Description                                         | Required |
|----------------------|-----------------------------------------------------|----------|
| `DATABASE_URL`       | PostgreSQL connection string (localhost for local)  | Yes      |
| `POSTGRES_USER`      | Postgres username (used by Docker Compose)          | Yes      |
| `POSTGRES_PASSWORD`  | Postgres password                                   | Yes      |
| `POSTGRES_DB`        | Postgres database name                              | Yes      |
| `JWT_SECRET`         | Secret for signing JWTs (min 32 chars)             | Yes      |
| `OPENAI_API_KEY`     | OpenAI API key (use this or Anthropic)              | Either   |
| `ANTHROPIC_API_KEY`  | Anthropic API key (use this or OpenAI)              | Either   |
| `AI_SERVICE_URL`     | URL backend uses to reach AI service                | Yes      |
| `REDIS_URL`          | Redis connection URL                                | Yes      |
| `PDF_STORAGE_PATH`   | Directory where PDFs are written                    | Yes      |
| `AI_SERVICE_BASE_URL`| Public base URL of AI service (for file links)      | Yes      |
| `VITE_API_URL`       | Backend URL used by the frontend                    | Yes      |

---

## Testing

The project has three layers of automated testing: frontend unit tests, backend unit tests, and full end-to-end (E2E) browser tests.

---

### Layer 1 — Frontend Unit Tests (Vitest + React Testing Library)

**Location:** `frontend/src/**/*.test.tsx` / `*.test.ts`  
**Tool:** [Vitest](https://vitest.dev/) + [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)

Tests cover individual React components and utility functions in isolation.

| Test file | What is covered |
|---|---|
| `components/ui/Button.test.tsx` | Variants, disabled state, click handlers |
| `components/ui/Input.test.tsx` | Value binding, validation states |
| `components/ui/Badge.test.tsx` | Color variants, label rendering |
| `components/ui/Modal.test.tsx` | Open/close behavior, portal rendering |
| `components/ui/TagInput.test.tsx` | Tag add/remove, Enter key handling |
| `components/ui/StepIndicator.test.tsx` | Active/completed step display |
| `components/kit/KitCard.test.tsx` | Kit title, tags, action buttons |
| `components/kit/ScorecardTab.test.tsx` | Scorecard criteria rendering |
| `pages/auth/LoginPage.test.tsx` | Form render, validation messages |
| `pages/CreateKitPage.test.tsx` | 4-step wizard step transitions |
| `utils/formatDate.test.ts` | Date formatting edge cases |
| `utils/formatRelativeTime.test.ts` | Relative time output (e.g. "2h ago") |

**Run commands:**

```bash
cd frontend
npm test                   # single run
npm run test:watch         # watch mode (re-runs on file change)
npm run test:coverage      # with V8 coverage report
```

---

### Layer 2 — Backend Unit Tests (Jest + NestJS Testing)

**Location:** `backend/src/**/*.spec.ts`  
**Tool:** [Jest](https://jestjs.io/) + NestJS `TestingModule`

Services are tested in isolation using mock providers — no real database or HTTP calls.

| Test file | What is covered |
|---|---|
| `auth/auth.service.spec.ts` | Register (success, duplicate email), Login (valid credentials, wrong email, wrong password), JWT token issuance, bcrypt password comparison |
| `interview-kit/interview-kit.service.spec.ts` | Kit creation, retrieval, update, soft-delete |

**Run commands:**

```bash
cd backend
npm test                   # unit tests only
npm run test:e2e           # integration tests (requires running PostgreSQL)
npm run test:cov           # with coverage report
```

---

### Layer 3 — End-to-End Tests (Playwright)

**Location:** `e2e/tests/*.spec.ts`  
**Tool:** [Playwright Test](https://playwright.dev/) v1.43  
**Config:** `e2e/playwright.config.ts` — targets `http://localhost:5173`, runs on Desktop Chrome

E2E tests drive a real browser against the running application, covering complete user flows from login to kit creation.

| Test file | Scenarios covered |
|---|---|
| `auth.spec.ts` | User registration, login with valid credentials, login error on wrong password, unauthenticated redirect to `/login` |
| `dashboard.spec.ts` | Dashboard loads with page title, "New Kit" button navigates to `/kits/new`, search input filters kit list |
| `create-kit.spec.ts` | Full 4-step kit wizard (Role Details → Responsibilities → Skills → Focus Areas), form validation prevents advancing with empty required fields |

**Run commands:**

```bash
cd e2e

# Requires all services to be running first (see Running the Project)
npm test                   # headless Chrome
npm run test:headed        # visible browser window (useful for debugging)
npm run test:report        # open the last HTML test report
```

**Passing credentials via environment variables (for CI or existing accounts):**

```bash
E2E_EMAIL=your@email.com E2E_PASSWORD=YourPass123 npm test
```

**Playwright config highlights:**

| Setting | Value |
|---|---|
| Base URL | `http://localhost:5173` (override with `BASE_URL` env var) |
| Browser | Desktop Chrome (Chromium) |
| Timeout per test | 120 seconds |
| Retries on CI | 2 |
| Screenshots | On failure only |
| Traces | On first retry |
| HTML report output | `e2e/playwright-report/` |

---

### AI Service Tests (Pytest)

**Location:** `ai-service/tests/`  
**Tool:** [Pytest](https://docs.pytest.org/)

```bash
cd ai-service
pytest tests/
```

---

### Test Summary

| Layer | Tool | Location | Command |
|---|---|---|---|
| Frontend unit | Vitest + RTL | `frontend/src/**/*.test.tsx` | `cd frontend && npm test` |
| Backend unit | Jest + NestJS | `backend/src/**/*.spec.ts` | `cd backend && npm test` |
| AI service | Pytest | `ai-service/tests/` | `cd ai-service && pytest tests/` |
| E2E browser | Playwright | `e2e/tests/*.spec.ts` | `cd e2e && npm test` |

---

## Rate Limits

The backend enforces two throttle tiers globally:

| Tier         | Limit      | Window  |
|--------------|------------|---------|
| global       | 60 requests| 1 minute|
| generation   | 20 requests| 1 hour  |

The `generation` tier applies to kit creation and AI regeneration endpoints.
