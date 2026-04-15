# AI Service Agent — SKILL.md

## Domain
`interview-kit/ai-service/` — FastAPI application powering LLM generation, RAG retrieval,
LangGraph orchestration, and export (PDF/DOCX).

## Stack
- **Runtime:** Python 3.11, FastAPI, Uvicorn
- **LLM:** LangChain (ChatOpenAI / ChatAnthropic via `app/tools/llm.py`)
- **Orchestration:** LangGraph `StateGraph` (`app/graph/`)
- **RAG:** FAISS vector store + HuggingFace / OpenAI embeddings (`app/retrieval/`)
- **Streaming:** `chain.astream()` + `asyncio.Queue` + FastAPI `StreamingResponse`
- **Exports:** `reportlab` (PDF), `python-docx` (DOCX) in `app/export/`
- **Config:** `config.py` → `get_settings()` reads `.env`

## Directory Layout
```
ai-service/
  main.py                     # FastAPI app, all HTTP endpoints
  config.py                   # Pydantic settings (env vars)
  app/
    graph/
      graph.py                # get_workflow() — compiles StateGraph
      nodes.py                # One function per LangGraph node
      state.py                # GraphState TypedDict
    tools/
      llm.py                  # get_llm(temperature) factory
      tools.py                # LangChain tools + prompt templates
    retrieval/
      retriever.py            # get_retriever() singleton, .search(query)
      loader.py               # Loads FAISS knowledge base from disk
      embedder.py             # Embedding model factory
    schemas/
      models.py               # Pydantic I/O models (PlainRoleInput, RoleInput, InterviewKit…)
    export/
      pdf_generator.py        # generate_pdf(kit_data, kit_id) → url
      docx_generator.py       # generate_docx(kit_data, kit_id) → url
```

## Key API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness probe |
| POST | `/generate-kit` | Full kit, blocking (legacy) |
| POST | `/generate-kit/stream` | **Token-by-token SSE streaming** |
| POST | `/export/pdf` | PDF export |
| POST | `/export/docx` | DOCX export |
| POST | `/regenerate/job-description` | Regenerate single section |
| POST | `/regenerate/behavioral-questions` | Regenerate single section |
| POST | `/regenerate/technical-questions` | Regenerate single section |
| POST | `/regenerate/scorecard` | Regenerate single section |
| POST | `/regenerate/rubric` | Regenerate single section |

## LangGraph Pipeline (6 nodes)
```
parse_role → validate → rag → parallel_gen → language_check → assemble
```
- Node names must stay in sync with `NODE_TO_STEP` in `frontend/src/hooks/useKitGenerate.ts`
- Progress events emitted: `{ node, label, step, total }` where `total=6`

## Streaming Architecture (CRITICAL)
The streaming endpoint **must** use async APIs — never `chain.stream()` inside threads
when already in an asyncio event loop. The correct pattern:

```python
# ✅ CORRECT — async throughout
async def _stream_section(name, prompt, variables, temperature):
    await token_queue.put(("section_start", name, None))
    async for chunk in (prompt | get_llm(temperature)).astream(variables):
        token = chunk.content if hasattr(chunk, "content") else ""
        if token:
            await token_queue.put(("token", name, token))
    section_results[name] = json.loads(_strip_fences(accumulated))
    await token_queue.put(("section_done", name, None))

tasks = [asyncio.create_task(_stream_section(...)) for ...]

# ❌ WRONG — sync chain.stream() in nested ThreadPoolExecutor hangs
executor.submit(lambda: list(chain.stream(vars)))
```

Blocking operations (FAISS, sync LangChain `invoke`) use:
```python
result = await loop.run_in_executor(None, blocking_fn, *args)
```

## SSE Event Protocol
Events are `text/event-stream` separated by `\n\n`:
```
event: progress
data: {"node":"parse_role","label":"Parsing role description","step":1,"total":6}

event: section_start
data: {"section":"jobDescription"}

event: token
data: {"section":"jobDescription","chunk":"Senior Software"}

event: section_done
data: {"section":"jobDescription"}

event: complete
data: {"kit":{...full InterviewKit object...}}

event: error
data: {"message":"...error description..."}
```

## Prompt Templates
All prompts live in `app/tools/tools.py` as module-level `ChatPromptTemplate` objects:
`JD_PROMPT`, `BEHAVIORAL_PROMPT`, `TECHNICAL_PROMPT`, `SCORECARD_PROMPT`, `RUBRIC_PROMPT`

The shared canonical prompts are in `.claude/skills/shared/prompt_library.md`.
**Never write inline prompts — use or extend the module-level templates.**

## RAG Retriever
- Singleton via `get_retriever()` — call once, reuse
- `.search(query: str) → str` — synchronous, must be called via `run_in_executor`
- Knowledge base: FAISS index of industry role templates loaded at startup
- Pre-warmed in `lifespan()` to avoid cold-start latency on first request

## LLM Factory
```python
from app.tools.llm import get_llm
llm = get_llm(temperature=0.4)   # returns ChatOpenAI or ChatAnthropic
```
Model is configured via `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` env vars.

## JSON Output Rules
- All LLM outputs must be valid JSON matching `kit.schema.json`
- Use `_strip_fences(text)` to remove markdown code fences before `json.loads()`
- If parsing fails, log the error and raise — never silently return partial data

## Environment Variables Required
```
OPENAI_API_KEY=        # or ANTHROPIC_API_KEY
AI_SERVICE_BASE_URL=http://localhost:8000
PDF_STORAGE_PATH=./data/pdfs
FAISS_INDEX_PATH=./data/faiss_index
```

## Naming Conventions
- Python: `snake_case` for all functions, variables, file names
- Pydantic models: `PascalCase`
- SSE event names: `snake_case` (e.g., `section_start`, `section_done`)
- JSON output keys: `camelCase` (matches frontend TypeScript types)

## Rules
1. Never add a new LangGraph node without updating `NODE_TO_STEP` in the frontend hook.
2. All new LLM tools must return structured JSON — validate against `kit.schema.json`.
3. Blocking I/O (file reads, FAISS, sync LangChain) → always `run_in_executor`.
4. Streaming LLM calls → always `astream()` with `asyncio.create_task()`.
5. Never hardcode API keys or model names — read from `config.py → get_settings()`.
6. All generated content must pass inclusive language check before returning to client.
7. Do not modify files outside `ai-service/`.
