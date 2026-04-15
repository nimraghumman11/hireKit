"""FastAPI application entry point."""
from __future__ import annotations
import asyncio
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from functools import partial
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.schemas.models import PlainRoleInput, RoleInput, InterviewKit, ExportRequest, ExportResponse
from app.graph.graph import get_workflow
from app.export.pdf_generator import generate_pdf
from app.export.docx_generator import generate_docx
from config import get_settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


async def _run_sync(fn, *args, **kwargs):
    """Run a blocking function in the default thread-pool so it doesn't freeze the event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(fn, *args, **kwargs))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm tiktoken cache so the first request doesn't hit openaipublic.blob.core.windows.net
    logger.info("Pre-warming tiktoken encoder cache...")
    try:
        import tiktoken
        tiktoken.get_encoding("cl100k_base")
        logger.info("tiktoken ready.")
    except Exception as exc:
        logger.warning("tiktoken pre-warm failed (non-fatal): %s", exc)

    # Pre-warm FAISS index
    logger.info("Pre-warming FAISS retriever...")
    try:
        from app.retrieval.retriever import get_retriever
        await _run_sync(get_retriever()._build)
        logger.info("FAISS retriever ready.")
    except Exception as exc:
        logger.warning("FAISS pre-warm failed (non-fatal): %s", exc)

    # Pre-compile LangGraph workflow
    logger.info("Pre-compiling LangGraph workflow...")
    try:
        get_workflow()
        logger.info("LangGraph workflow ready.")
    except Exception as exc:
        logger.warning("Workflow pre-compile failed (non-fatal): %s", exc)

    yield


app = FastAPI(
    title="Interview Kit AI Service",
    description="LangGraph-powered interview kit generation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_settings = get_settings()
_pdf_dir = Path(_settings.pdf_storage_path)
_pdf_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static/pdfs", StaticFiles(directory=str(_pdf_dir)), name="pdfs")


# ── Helpers ────────────────────────────────────────────────────────────────

def _rag_context(role_input: dict) -> str:
    """Retrieve RAG context for a role — synchronous, call via _run_sync."""
    from app.retrieval.retriever import get_retriever
    query = f"{role_input.get('experienceLevel', '')} {role_input.get('roleTitle', '')} {role_input.get('department', '')}"
    t = time.time()
    ctx = get_retriever().search(query)
    logger.info("RAG retrieval: %.1fs, %d chars", time.time() - t, len(ctx))
    return ctx


# ── Core endpoints ─────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/generate-kit/stream")
async def generate_kit_stream(plain_input: PlainRoleInput):
    """Token-by-token streaming kit generation via Server-Sent Events.

    Delegates entirely to LangGraph's ``astream_events`` (v2) API.
    Each section chain inside ``parallel_generation_node`` is tagged with
    ``section:<name>``, so individual LLM token chunks can be attributed to
    the correct section without any manual queue or extra asyncio plumbing.

    Event types emitted (in order):
      progress      — pipeline milestone  { node, label, step, total }
      section_start — an LLM section began  { section }
      token         — one LLM token chunk   { section, chunk }
      section_done  — section finished      { section }
      complete      — full assembled kit    { kit }
      error         — failure              { message }
    """
    TOTAL = 6
    NODE_LABELS: dict[str, tuple[str, int]] = {
        "parse_role":     ("Parsing role description",    1),
        "validate":       ("Validating role details",     2),
        "rag":            ("Retrieving industry context", 3),
        "parallel_gen":   ("Generating all sections",     4),
        "language_check": ("Checking inclusive language", 5),
        "assemble":       ("Assembling your kit",         6),
    }

    def _prog(node: str, label: str, step: int) -> str:
        return f"event: progress\ndata: {json.dumps({'node': node, 'label': label, 'step': step, 'total': TOTAL})}\n\n"

    def _section_from_tags(tags: list) -> str | None:
        """Extract section name from a tag like 'section:jobDescription'."""
        return next((t.split(":", 1)[1] for t in tags if t.startswith("section:")), None)

    async def event_generator():
        workflow = get_workflow()
        emitted_sections: set[str] = set()   # section_start already sent
        done_sections: set[str] = set()       # section_done already sent

        try:
            async for event in workflow.astream_events(
                {"plain_description": plain_input.description, "role_input": {}},
                version="v2",
            ):
                kind     = event["event"]
                name     = event.get("name", "")
                metadata = event.get("metadata", {})
                tags     = event.get("tags", [])
                node     = metadata.get("langgraph_node", "")

                # ── Node start → progress milestone ───────────────────────
                if kind == "on_chain_start" and name in NODE_LABELS:
                    label, step = NODE_LABELS[name]
                    yield _prog(name, label, step)

                # ── LLM starts inside parallel_gen → section_start ────────
                elif kind == "on_chat_model_start":
                    section = _section_from_tags(tags)
                    if section and section not in emitted_sections:
                        emitted_sections.add(section)
                        yield f"event: section_start\ndata: {json.dumps({'section': section})}\n\n"

                # ── LLM token chunk → token event ─────────────────────────
                elif kind == "on_chat_model_stream":
                    section = _section_from_tags(tags)
                    chunk = event["data"].get("chunk")
                    token = chunk.content if chunk and hasattr(chunk, "content") else ""
                    if token and section:
                        yield f"event: token\ndata: {json.dumps({'section': section, 'chunk': token})}\n\n"

                # ── Chain end ─────────────────────────────────────────────
                elif kind == "on_chain_end":
                    section = _section_from_tags(tags)

                    # Section chain finished (run_name = "section_<name>")
                    if section and section not in done_sections and name.startswith("section_"):
                        done_sections.add(section)
                        yield f"event: section_done\ndata: {json.dumps({'section': section})}\n\n"

                    # Validate node returned an error → abort early
                    if name == "validate":
                        output = event["data"].get("output") or {}
                        if output.get("error"):
                            yield f"event: error\ndata: {json.dumps({'message': output['error']})}\n\n"
                            return

                    # Entire LangGraph run finished → emit final kit
                    if name == "LangGraph":
                        output = event["data"].get("output") or {}
                        kit = output.get("final_kit")
                        if kit:
                            yield f"event: complete\ndata: {json.dumps({'kit': kit})}\n\n"
                        else:
                            msg = output.get("error") or "Kit generation failed"
                            yield f"event: error\ndata: {json.dumps({'message': msg})}\n\n"
                        return

        except Exception as exc:
            logger.error("astream_events error: %s", exc)
            yield f"event: error\ndata: {json.dumps({'message': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/generate-kit", response_model=InterviewKit)
async def generate_kit(plain_input: PlainRoleInput):
    """Accept a plain language role description and return a complete interview kit."""
    t = time.time()
    logger.info("Generating kit from plain description (%d chars)", len(plain_input.description))
    workflow = get_workflow()
    # Use ainvoke — parallel_generation_node is async so ainvoke is required
    result = await workflow.ainvoke(
        {"plain_description": plain_input.description, "role_input": {}},
    )
    logger.info("Kit generation complete: %.1fs", time.time() - t)

    if result.get("error") or not result.get("final_kit"):
        raise HTTPException(status_code=422, detail=result.get("error") or "Kit generation failed")

    return result["final_kit"]


@app.post("/export/pdf", response_model=ExportResponse)
async def export_pdf(req: ExportRequest):
    try:
        url = await _run_sync(generate_pdf, req.kitData, req.kitId)
        return {"url": url}
    except Exception as exc:
        logger.error("PDF export failed: %s", exc)
        raise HTTPException(status_code=500, detail="PDF generation failed")


@app.post("/export/docx", response_model=ExportResponse)
async def export_docx(req: ExportRequest):
    try:
        url = await _run_sync(generate_docx, req.kitData, req.kitId)
        return {"url": url}
    except Exception as exc:
        logger.error("DOCX export failed: %s", exc)
        raise HTTPException(status_code=500, detail="DOCX generation failed")


# ── Legacy direct-tool endpoints ───────────────────────────────────────────

@app.post("/generate-job-description")
async def generate_jd(role_input: RoleInput):
    from app.tools.tools import generate_job_description
    rd = role_input.model_dump()
    context = await _run_sync(_rag_context, rd)
    return await _run_sync(generate_job_description, rd, context)


@app.post("/generate-questions")
async def generate_questions(role_input: RoleInput):
    from app.tools.tools import generate_behavioral_questions, generate_technical_questions
    rd = role_input.model_dump()
    context = await _run_sync(_rag_context, rd)
    behavioral, technical = await asyncio.gather(
        _run_sync(generate_behavioral_questions, rd, context),
        _run_sync(generate_technical_questions, rd, context),
    )
    return {"behavioral": behavioral, "technical": technical}


# ── Per-section regeneration endpoints ────────────────────────────────────

class RegenerateRequest(BaseModel):
    kitId: str
    roleInput: dict


@app.post("/regenerate/job-description")
async def regenerate_jd(req: RegenerateRequest):
    from app.tools.tools import generate_job_description
    t = time.time()
    context = await _run_sync(_rag_context, req.roleInput)
    result = await _run_sync(generate_job_description, req.roleInput, context)
    logger.info("regenerate/job-description: %.1fs", time.time() - t)
    return result


@app.post("/regenerate/behavioral-questions")
async def regenerate_behavioral(req: RegenerateRequest):
    from app.tools.tools import generate_behavioral_questions_fast
    t = time.time()
    # 3 questions × 2 parallel batches = 6 total, ~10s target
    batch_a, batch_b = await asyncio.gather(
        _run_sync(generate_behavioral_questions_fast, req.roleInput, 3),
        _run_sync(generate_behavioral_questions_fast, req.roleInput, 3),
    )
    result = list(batch_a)
    for i, q in enumerate(batch_b, start=len(batch_a) + 1):
        q["id"] = f"bq-{i}"
        result.append(q)
    logger.info("regenerate/behavioral-questions: %.1fs (%d questions)", time.time() - t, len(result))
    return result


@app.post("/regenerate/technical-questions")
async def regenerate_technical(req: RegenerateRequest):
    from app.tools.tools import generate_technical_questions_fast
    t = time.time()
    # 3 questions × 2 parallel batches = 6 total, ~10s target
    batch_a, batch_b = await asyncio.gather(
        _run_sync(generate_technical_questions_fast, req.roleInput, 3),
        _run_sync(generate_technical_questions_fast, req.roleInput, 3),
    )
    result = list(batch_a)
    for i, q in enumerate(batch_b, start=len(batch_a) + 1):
        q["id"] = f"tq-{i}"
        result.append(q)
    logger.info("regenerate/technical-questions: %.1fs (%d questions)", time.time() - t, len(result))
    return result


@app.post("/regenerate/scorecard")
async def regenerate_scorecard(req: RegenerateRequest):
    from app.tools.tools import generate_scorecard
    t = time.time()
    result = await _run_sync(generate_scorecard, req.roleInput)
    logger.info("regenerate/scorecard: %.1fs", time.time() - t)
    return result


@app.post("/regenerate/rubric")
async def regenerate_rubric(req: RegenerateRequest):
    from app.tools.tools import generate_rubric
    t = time.time()
    result = await _run_sync(generate_rubric, req.roleInput)
    logger.info("regenerate/rubric: %.1fs", time.time() - t)
    return result
