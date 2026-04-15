"""Load and chunk source documents for RAG indexing."""
from __future__ import annotations
import json
import logging
from pathlib import Path

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

logger = logging.getLogger(__name__)

# Packaged text sources + manifest (``manifest.json``). Used when present and non-empty.
DEFAULT_DOCS_DIR = Path(__file__).resolve().parent / "docs"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# ──────────────────────────────────────────────────────────────
# Rich seed documents — covers all common role types, seniority
# levels, interview frameworks, and competency patterns.
# ──────────────────────────────────────────────────────────────
SEED_DOCUMENTS = [

    # ── Engineering roles ─────────────────────────────────────
    Document(
        page_content=(
            "Senior Software Engineer responsibilities: "
            "Designs and implements scalable backend and distributed systems. "
            "Leads architectural discussions and drives technical decisions. "
            "Mentors junior and mid-level engineers through code reviews and pairing. "
            "Collaborates with Product and Design to refine requirements and estimate scope. "
            "Owns reliability and performance of critical services end-to-end. "
            "Writes clear technical documentation and ADRs."
        ),
        metadata={"source": "seed", "role_type": "engineering", "seniority": "senior"},
    ),
    Document(
        page_content=(
            "Mid-level Software Engineer competencies: "
            "Independently builds and ships features across a known stack. "
            "Identifies and fixes bugs without significant guidance. "
            "Understands common design patterns and can reason about trade-offs. "
            "Communicates progress and blockers proactively. "
            "Participates in on-call and incident response. "
            "Grows in scope from individual tickets to small features."
        ),
        metadata={"source": "seed", "role_type": "engineering", "seniority": "mid"},
    ),
    Document(
        page_content=(
            "Junior Software Engineer competencies: "
            "Writes clean, readable code following established patterns. "
            "Completes well-scoped tickets with moderate guidance. "
            "Asks for help early and communicates blockers. "
            "Learns quickly from code reviews and feedback. "
            "Understands version control, basic CI/CD, and testing fundamentals. "
            "Growing from tutorials to production code."
        ),
        metadata={"source": "seed", "role_type": "engineering", "seniority": "junior"},
    ),
    Document(
        page_content=(
            "Engineering Lead / Staff Engineer responsibilities: "
            "Sets technical direction for one or more product areas. "
            "Drives cross-team architectural decisions and standards. "
            "Partners with Product and Engineering leadership on roadmap. "
            "Identifies and eliminates systemic engineering bottlenecks. "
            "Grows engineering culture through documentation, tooling, and mentorship. "
            "Balances long-term technical investment with near-term delivery."
        ),
        metadata={"source": "seed", "role_type": "engineering", "seniority": "lead"},
    ),
    Document(
        page_content=(
            "Backend Engineer technical skills: "
            "API design (REST, GraphQL, gRPC). "
            "Database design and query optimization (PostgreSQL, MySQL, MongoDB). "
            "Caching strategies (Redis, Memcached). "
            "Message queues and event-driven architecture (Kafka, RabbitMQ, SQS). "
            "Authentication and authorization (JWT, OAuth2, RBAC). "
            "Containerization and orchestration (Docker, Kubernetes). "
            "Observability: logging, metrics, distributed tracing."
        ),
        metadata={"source": "seed", "role_type": "backend", "type": "technical"},
    ),
    Document(
        page_content=(
            "Frontend Engineer technical competencies: "
            "React component lifecycle, hooks, context, and performance patterns (memo, useMemo, useCallback). "
            "TypeScript generics, type narrowing, and strict mode. "
            "CSS layout (flexbox, grid), responsive design, and design systems. "
            "Web performance: Core Web Vitals, lazy loading, code splitting, bundle analysis. "
            "Accessibility: WCAG 2.1, ARIA roles, keyboard navigation, screen reader testing. "
            "State management: Zustand, Redux Toolkit, React Query, Jotai. "
            "Testing: React Testing Library, Jest, Playwright end-to-end."
        ),
        metadata={"source": "seed", "role_type": "frontend", "type": "technical"},
    ),
    Document(
        page_content=(
            "Full-Stack Engineer responsibilities: "
            "Designs and implements features across the entire product stack — backend APIs, database schema, and frontend UI. "
            "Owns features end-to-end from design review to production deploy. "
            "Makes pragmatic technology choices that balance speed and maintainability. "
            "Fluent in both server-side (Node.js, Python, or Go) and client-side (React, Vue) development. "
            "Collaborates closely with designers and product managers."
        ),
        metadata={"source": "seed", "role_type": "fullstack", "seniority": "mid"},
    ),
    Document(
        page_content=(
            "DevOps / Site Reliability Engineer responsibilities: "
            "Designs and maintains CI/CD pipelines for fast, safe deployments. "
            "Manages Kubernetes clusters, auto-scaling, and infrastructure-as-code (Terraform, Pulumi). "
            "Sets SLOs, SLIs, and error budgets; drives down MTTR through observability (Datadog, Grafana, Prometheus). "
            "Improves developer experience through platform tooling and golden paths. "
            "Leads incident response, post-mortems, and reliability improvements. "
            "Secures infrastructure through secrets management, network policy, and vulnerability scanning."
        ),
        metadata={"source": "seed", "role_type": "devops_sre", "seniority": "mid"},
    ),
    Document(
        page_content=(
            "Data Engineer responsibilities: "
            "Designs and maintains scalable data pipelines (batch and streaming) using dbt, Airflow, Spark, or Flink. "
            "Models data in warehouses (Snowflake, BigQuery, Redshift) for analytical consumption. "
            "Partners with Data Scientists and Analysts to ship high-quality, reliable datasets. "
            "Implements data quality checks, lineage tracking, and documentation. "
            "Optimizes pipeline performance and cost at scale."
        ),
        metadata={"source": "seed", "role_type": "data_engineering", "seniority": "mid"},
    ),
    Document(
        page_content=(
            "Machine Learning Engineer / Data Scientist technical skills: "
            "Python data science stack: NumPy, Pandas, Scikit-learn, PyTorch, TensorFlow. "
            "Feature engineering, model selection, hyperparameter tuning, cross-validation. "
            "Model serving and MLOps: MLflow, Kubeflow, SageMaker, or Vertex AI. "
            "Statistical analysis, A/B testing, and experiment design. "
            "SQL for analytical queries and data extraction. "
            "Ability to communicate model performance and limitations to non-technical stakeholders."
        ),
        metadata={"source": "seed", "role_type": "ml_ds", "type": "technical"},
    ),

    # ── Security ───────────────────────────────────────────────
    Document(
        page_content=(
            "Security Engineer responsibilities: "
            "Performs threat modeling and secure code reviews across the engineering org. "
            "Leads penetration testing, vulnerability assessments, and red team exercises. "
            "Designs and enforces security controls in cloud infrastructure (IAM, network segmentation, secrets management). "
            "Responds to security incidents and drives post-mortem improvements. "
            "Partners with engineering teams to build security into the SDLC (shift-left). "
            "Maintains compliance posture (SOC 2, ISO 27001, GDPR)."
        ),
        metadata={"source": "seed", "role_type": "security", "seniority": "mid"},
    ),

    # ── Product & Design ──────────────────────────────────────
    Document(
        page_content=(
            "Product Manager responsibilities: "
            "Defines and owns the product roadmap aligned to company strategy and user needs. "
            "Leads discovery: user research, competitive analysis, and problem definition. "
            "Writes clear PRDs, user stories, and acceptance criteria. "
            "Prioritizes ruthlessly across a backlog of competing opportunities. "
            "Partners with Engineering, Design, and Data to ship high-quality features. "
            "Tracks key product metrics and iterates based on data and qualitative feedback."
        ),
        metadata={"source": "seed", "role_type": "product", "seniority": "mid"},
    ),
    Document(
        page_content=(
            "UX / Product Designer responsibilities: "
            "Leads end-to-end design process: research, ideation, wireframing, prototyping, usability testing. "
            "Creates high-fidelity designs and interaction specs in Figma. "
            "Develops and maintains design system components. "
            "Advocates for user needs in cross-functional product discussions. "
            "Collaborates with Engineering to ensure implementation quality. "
            "Facilitates design critiques and iterates based on feedback."
        ),
        metadata={"source": "seed", "role_type": "design", "seniority": "mid"},
    ),

    # ── Leadership ─────────────────────────────────────────────
    Document(
        page_content=(
            "Engineering Manager responsibilities: "
            "Manages a team of 4-10 engineers: hiring, onboarding, performance management, and growth. "
            "Ensures team delivery against roadmap commitments with high quality and predictability. "
            "Removes blockers and shields the team from organizational noise. "
            "Conducts regular 1:1s focused on career development and well-being. "
            "Drives engineering culture: psychological safety, blameless post-mortems, continuous improvement. "
            "Partners with Product and Design leadership to align on priorities."
        ),
        metadata={"source": "seed", "role_type": "management", "seniority": "manager"},
    ),

    # ── Behavioral interview frameworks ───────────────────────
    Document(
        page_content=(
            "Behavioral interview — STAR method: "
            "Situation: Set the scene and give the necessary context. "
            "Task: Describe your responsibility or challenge in that situation. "
            "Action: Explain the specific steps YOU took, not the team. "
            "Result: Share the measurable or qualitative outcome. "
            "Strong answers are specific, own the individual's contribution, and reflect on learning. "
            "Weak answers are vague, use 'we' without clarity on personal role, or lack a result."
        ),
        metadata={"source": "seed", "type": "behavioral", "framework": "STAR"},
    ),
    Document(
        page_content=(
            "Behavioral interview — competency probes for leadership: "
            "Tell me about a time you had to align people with conflicting priorities. "
            "Describe a situation where you had to make a decision with incomplete information. "
            "Give an example of when you influenced a decision you didn't have authority over. "
            "Tell me about a time you had to deliver difficult feedback. "
            "Describe a time you changed your mind based on new evidence. "
            "What is the most ambitious project you have driven from idea to production?"
        ),
        metadata={"source": "seed", "type": "behavioral", "competency": "leadership"},
    ),
    Document(
        page_content=(
            "Behavioral interview — competency probes for collaboration and communication: "
            "Tell me about a time you had a significant disagreement with a colleague. How did you resolve it? "
            "Describe a project where you worked closely with a non-technical stakeholder. "
            "Give an example of a time you had to communicate a complex technical concept to a non-engineer. "
            "Tell me about a time you received critical feedback. How did you respond? "
            "Describe a situation where team dynamics impacted project delivery."
        ),
        metadata={"source": "seed", "type": "behavioral", "competency": "collaboration"},
    ),
    Document(
        page_content=(
            "Behavioral interview — competency probes for problem-solving and execution: "
            "Tell me about a complex technical problem you solved from first principles. "
            "Describe a time you had to debug a critical production issue under pressure. "
            "Tell me about a project that failed. What caused it, and what did you learn? "
            "Give an example of a time you significantly improved a process or system. "
            "Describe a situation where you had to prioritize ruthlessly under time pressure. "
            "Tell me about the most technically challenging thing you have built."
        ),
        metadata={"source": "seed", "type": "behavioral", "competency": "problem_solving"},
    ),
    Document(
        page_content=(
            "Behavioral interview — follow-up probing techniques: "
            "If an answer is vague: 'Can you walk me through the specific steps you personally took?' "
            "If 'we' is overused: 'What was your specific role in that outcome?' "
            "Stress-testing: 'What would you do differently today?' "
            "Scaling check: 'How would this approach have changed if the team or system was 10x larger?' "
            "Depth probe: 'What was the hardest part of that decision, and what alternatives did you consider?' "
            "Reflection probe: 'What did this experience teach you that you have applied since?'"
        ),
        metadata={"source": "seed", "type": "behavioral", "framework": "follow_up"},
    ),

    # ── Technical interview frameworks ────────────────────────
    Document(
        page_content=(
            "System design interview framework: "
            "Step 1 — Clarify requirements: functional, non-functional (scale, latency, availability). "
            "Step 2 — Estimate scale: DAU, QPS, storage, bandwidth. "
            "Step 3 — High-level design: core components, data flow, APIs. "
            "Step 4 — Deep dive: database schema, caching layer, sharding, replication. "
            "Step 5 — Address bottlenecks: single points of failure, scaling strategies. "
            "Red flags: jumping to implementation without clarifying requirements, ignoring failure modes, no consideration for scale."
        ),
        metadata={"source": "seed", "type": "technical", "framework": "system_design"},
    ),
    Document(
        page_content=(
            "API design best practices for technical interviews: "
            "RESTful conventions: proper HTTP methods (GET/POST/PUT/PATCH/DELETE), meaningful resource naming. "
            "Versioning strategies: URL versioning (/v1/), header versioning. "
            "Pagination: cursor-based vs. offset-based trade-offs. "
            "Error handling: consistent error envelope, meaningful status codes. "
            "Authentication: JWT vs. session tokens, OAuth2 flows. "
            "Rate limiting, idempotency keys for mutating operations, and API documentation (OpenAPI/Swagger)."
        ),
        metadata={"source": "seed", "type": "technical", "topic": "api_design"},
    ),
    Document(
        page_content=(
            "Database interview topics: "
            "ACID properties and when to trade them off. "
            "Indexing strategies: B-tree vs. hash, composite indexes, partial indexes, covering indexes. "
            "Query optimization: EXPLAIN, avoiding N+1, index scans vs. seq scans. "
            "Normalization vs. denormalization trade-offs. "
            "Transactions and isolation levels (READ COMMITTED, REPEATABLE READ, SERIALIZABLE). "
            "Sharding, replication (primary-replica, multi-region), connection pooling. "
            "When to use a relational vs. document vs. time-series vs. graph database."
        ),
        metadata={"source": "seed", "type": "technical", "topic": "databases"},
    ),
    Document(
        page_content=(
            "Distributed systems and reliability concepts: "
            "CAP theorem — consistency vs. availability vs. partition tolerance trade-offs. "
            "Eventual consistency, conflict resolution (last-write-wins, CRDTs). "
            "Service discovery, load balancing, circuit breakers, retries with exponential backoff. "
            "Idempotency and at-least-once vs. exactly-once delivery. "
            "Observability: the three pillars — logs, metrics, and distributed traces. "
            "SLOs, SLIs, error budgets — how to balance reliability and feature velocity."
        ),
        metadata={"source": "seed", "type": "technical", "topic": "distributed_systems"},
    ),

    # ── Inclusive language and DEI ────────────────────────────
    Document(
        page_content=(
            "Inclusive job description language guidelines: "
            "Avoid gendered terms: 'chairman' → 'chair', 'manpower' → 'workforce', 'he/she' → 'they'. "
            "Avoid exclusionary role labels: 'rockstar', 'ninja', 'guru', 'wizard', 'unicorn'. "
            "Avoid age-biased terms: 'digital native', 'recent graduate preferred', 'young and hungry'. "
            "Avoid ableist language: 'crazy fast', 'insane deadline', 'blind spot'. "
            "Replace culture-exclusive idioms: 'hit the ground running' → 'ramp up quickly'. "
            "Focus on skills and behaviours, not personality archetypes or cultural fit buzzwords."
        ),
        metadata={"source": "seed", "type": "inclusive_language"},
    ),
    Document(
        page_content=(
            "Bias-free qualification writing for job postings: "
            "Avoid 'must be a culture fit' — define culture through values and behaviors instead. "
            "Challenge '10+ years' requirements — specify the depth of experience needed, not tenure. "
            "Separate must-have from nice-to-have qualifications clearly. "
            "Avoid requirements that correlate with socioeconomic background (e.g., unpaid internships, elite universities). "
            "Use 'equivalent experience' to welcome non-traditional career paths. "
            "Research shows that women apply to jobs only when they meet ~100% of requirements vs. ~60% for men — keep must-haves to genuine essentials."
        ),
        metadata={"source": "seed", "type": "inclusive_language", "topic": "qualifications"},
    ),

    # ── Competency frameworks ─────────────────────────────────
    Document(
        page_content=(
            "Engineering competency framework — levels: "
            "L1 Junior: Completes well-scoped tasks with guidance. Writes tests. Communicates blockers. "
            "L2 Mid: Ships features independently. Reviews others' code. Estimates accurately. "
            "L3 Senior: Designs systems. Mentors L1-L2. Influences team processes. "
            "L4 Staff/Lead: Sets technical direction. Solves cross-team problems. Grows engineers. "
            "L5 Principal: Org-wide technical strategy. Industry-recognized expertise. Drives culture."
        ),
        metadata={"source": "seed", "type": "competency_framework"},
    ),
    Document(
        page_content=(
            "Scoring rubric calibration guide: "
            "Score 1 (Poor): Candidate cannot demonstrate the competency. Answers are vague, hypothetical, or self-contradictory. "
            "Score 2 (Below expectations): Shows awareness but cannot give concrete examples or explain reasoning. "
            "Score 3 (Meets expectations): Provides a relevant example with clear actions and reasonable outcomes. Meets the bar for the level. "
            "Score 4 (Exceeds expectations): Example shows depth, ownership, and measurable impact. Demonstrates more than required for the role. "
            "Score 5 (Exceptional): Rare — candidate's answer would be exemplary even at the next level up. Shows mastery, reflection, and transferability."
        ),
        metadata={"source": "seed", "type": "scoring_guide"},
    ),

    # ── Salary benchmarks ─────────────────────────────────────
    Document(
        page_content=(
            "Software engineering salary benchmarks (US market, 2024): "
            "Junior SWE: $80,000–$120,000 base. "
            "Mid SWE: $120,000–$160,000 base. "
            "Senior SWE: $160,000–$220,000 base. "
            "Staff / Lead SWE: $200,000–$280,000 base. "
            "Principal / Director Eng: $250,000–$400,000+ base. "
            "Total compensation (base + equity + bonus) often 1.3x–2x base at growth-stage and public companies. "
            "Remote-first companies typically use national or tiered geo rates."
        ),
        metadata={"source": "seed", "type": "salary_benchmarks", "market": "US"},
    ),
    Document(
        page_content=(
            "Product and design salary benchmarks (US market, 2024): "
            "Junior PM / Associate PM: $90,000–$130,000. "
            "Product Manager: $130,000–$180,000. "
            "Senior PM: $170,000–$230,000. "
            "Principal PM / GPM: $220,000–$300,000+. "
            "Junior UX Designer: $70,000–$100,000. "
            "Product Designer: $100,000–$150,000. "
            "Senior Product Designer: $150,000–$200,000. "
            "Head of Design: $180,000–$260,000."
        ),
        metadata={"source": "seed", "type": "salary_benchmarks", "market": "US", "domain": "product_design"},
    ),
]


def _default_docs_path() -> Path:
    try:
        from config import get_settings

        override = (get_settings().rag_docs_dir or "").strip()
        if override:
            return Path(override)
    except Exception:
        pass
    return DEFAULT_DOCS_DIR


def _load_manifest(path: Path) -> dict[str, dict[str, object]]:
    manifest_file = path / "manifest.json"
    if not manifest_file.is_file():
        return {}
    try:
        raw = json.loads(manifest_file.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            return {}
        out: dict[str, dict[str, object]] = {}
        for k, v in raw.items():
            if isinstance(v, dict):
                out[str(k)] = dict(v)
        return out
    except Exception as exc:
        logger.warning("Invalid manifest.json in %s: %s", path, exc)
        return {}


def _load_from_directory(path: Path) -> list[Document]:
    """Load ``*.txt`` from ``path``; metadata from ``manifest.json`` when listed."""
    if not path.is_dir():
        return []
    manifest = _load_manifest(path)
    documents: list[Document] = []
    for txt_file in sorted(path.glob("*.txt")):
        try:
            content = txt_file.read_text(encoding="utf-8").strip()
            if not content:
                logger.warning("Skipping empty file: %s", txt_file.name)
                continue
            meta = dict(manifest.get(txt_file.name, {}))
            if not meta:
                meta = {"source": "file", "file": txt_file.name}
            else:
                meta.setdefault("file", txt_file.name)
            documents.append(Document(page_content=content, metadata=meta))
        except Exception as exc:
            logger.warning("Failed to load %s: %s", txt_file, exc)
    return documents


def load_documents(docs_dir: str | None = None) -> list[Document]:
    """Load RAG seed documents.

    Prefer ``*.txt`` files under the resolved directory (default: package
    :data:`DEFAULT_DOCS_DIR` or :envvar:`RAG_DOCS_DIR`). Metadata is read from
    ``manifest.json`` when present; otherwise each file gets minimal metadata.

    If the directory is missing, empty, or unreadable, falls back to in-memory
    :data:`SEED_DOCUMENTS` (kept in sync as a backup).
    """
    resolved = Path(docs_dir) if docs_dir else _default_docs_path()
    if resolved.exists():
        loaded = _load_from_directory(resolved)
        if loaded:
            logger.info("Loaded %d documents for RAG indexing from %s", len(loaded), resolved)
            return loaded

    logger.info(
        "Using in-memory SEED_DOCUMENTS fallback (%d documents) for RAG indexing",
        len(SEED_DOCUMENTS),
    )
    return list(SEED_DOCUMENTS)


def chunk_documents(documents: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
    )
    return splitter.split_documents(documents)
