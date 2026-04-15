# GenAI Interview Kit — Architecture Diagrams

---

## 1. System Overview

```mermaid
graph TB
    subgraph Browser["🌐 Browser — React SPA (port 5173)"]
        direction TB
        P1[Auth Pages\nLogin / Register]
        P2[Dashboard\nKit list & history]
        P3[Create Kit Page\nRole input form]
        P4[Results Page\nKit viewer & tabs]
        P5[Export / Share\nPDF · DOCX · Link]

        ST[Zustand Store\nauth · kit state]
        RQ[React Query\nserver state & caching]
        P1 & P2 & P3 & P4 & P5 --> ST
        P1 & P2 & P3 & P4 & P5 --> RQ
    end

    subgraph Backend["⚙️ Backend — NestJS (port 3000)"]
        direction TB
        BAuth[Auth Module\nJWT · bcrypt]
        BUsers[Users Module\nprofile CRUD]
        BKits[InterviewKit Module\nCRUD · share token]
        BAI[AI Module\nproxy to AI service]
        BExport[Export Module\nPDF · DOCX links]
        BPrisma[Prisma ORM]
        BCache[Redis Cache\n5-min TTL]
        BThrottle[Rate Limiter\n60/min global\n20/hr generation]

        BAuth & BUsers & BKits & BAI & BExport --> BPrisma
        BKits & BAI --> BCache
        BAuth & BKits & BAI --> BThrottle
    end

    subgraph AIService["🤖 AI Service — FastAPI (port 8000)"]
        direction TB
        AGW[POST /generate-kit]
        AREG[POST /regenerate/*\n5 section endpoints]
        AEXP[POST /export/pdf\nPOST /export/docx]

        subgraph LG["LangGraph Workflow"]
            N1[parse_role\nLLM extracts structured fields]
            N2[validate\nPydantic schema check]
            N3[rag\nFAISS vector search]
            N4[parallel_gen\nAll 5 sections concurrently]
            N5[language_check\nBias · inclusion audit]
            N6[assemble\nFinal JSON kit]
            N1 --> N2 --> N3 --> N4 --> N5 --> N6
        end

        AGW --> LG
        AREG --> N4
    end

    subgraph Data["🗄️ Data Layer"]
        PG[(PostgreSQL 16\nport 5433\nusers · interview_kits · ai_logs)]
        RD[(Redis 7\nport 6379\nresponse cache)]
        FAISS[(FAISS Index\nvector store\nai_data volume)]
        FILES[(PDF · DOCX files\nai_data volume)]
    end

    subgraph External["☁️ External APIs"]
        LLM[OpenAI API\nor Anthropic API]
    end

    RQ -- "HTTP + JWT Bearer" --> BAuth
    RQ -- "HTTP + JWT Bearer" --> BKits
    RQ -- "HTTP + JWT Bearer" --> BAI
    RQ -- "HTTP + JWT Bearer" --> BExport

    BAI -- "HTTP" --> AGW
    BAI -- "HTTP" --> AREG
    BExport -- "HTTP" --> AEXP

    BPrisma -- "SQL" --> PG
    BCache -- "TCP" --> RD

    LG -- "Embeddings + Completion" --> LLM
    N3 -- "similarity search" --> FAISS
    AEXP -- "write file" --> FILES
```

---

## 2. Request Flow — Kit Generation

```mermaid
sequenceDiagram
    actor HM as Hiring Manager
    participant FE as React Frontend
    participant BE as NestJS Backend
    participant AI as FastAPI AI Service
    participant LG as LangGraph Pipeline
    participant LLM as LLM API
    participant FAISS as FAISS Index
    participant PG as PostgreSQL

    HM->>FE: Describe role in plain text
    FE->>BE: POST /interview-kits\n{ description } + JWT

    BE->>BE: Validate JWT · check rate limit
    BE->>AI: POST /generate-kit\n{ description }

    AI->>LG: Invoke workflow

    LG->>LLM: parse_role — extract structured fields
    LLM-->>LG: { roleTitle, department, level, ... }

    LG->>LG: validate — Pydantic schema check

    LG->>FAISS: rag — similarity search
    FAISS-->>LG: industry context chunks

    par parallel_gen — all sections at once
        LG->>LLM: generate Job Description
        LG->>LLM: generate Behavioral Questions
        LG->>LLM: generate Technical Questions
        LG->>LLM: generate Scorecard
        LG->>LLM: generate Skills Rubric
    end
    LLM-->>LG: all 5 sections returned

    LG->>LLM: language_check — bias audit
    LLM-->>LG: reviewed / cleaned content

    LG->>LG: assemble — merge into InterviewKit JSON
    LG-->>AI: InterviewKit JSON

    AI-->>BE: InterviewKit JSON
    BE->>PG: INSERT interview_kits row
    BE->>PG: INSERT ai_logs row
    PG-->>BE: saved

    BE-->>FE: { data: InterviewKit, error: null, meta: {} }
    FE->>HM: Display results with tabs
```

---

## 3. Database Entity Relationship

```mermaid
erDiagram
    USERS {
        uuid id PK
        string name
        string email UK
        string password
        string role
        timestamp created_at
        timestamp updated_at
    }

    INTERVIEW_KITS {
        uuid id PK
        uuid user_id FK
        string role_title
        string department
        string experience_level
        string work_mode
        string team_size
        jsonb generated_output
        string pdf_url
        string docx_url
        string share_token UK
        string status
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }

    AI_LOGS {
        uuid id PK
        uuid kit_id FK
        uuid user_id FK
        jsonb request_payload
        jsonb response_payload
        string status
        int duration_ms
        timestamp created_at
    }

    USERS ||--o{ INTERVIEW_KITS : "creates"
    USERS ||--o{ AI_LOGS : "triggers"
    INTERVIEW_KITS ||--o{ AI_LOGS : "logged in"
```

---

## 4. LangGraph AI Pipeline (detailed)

```mermaid
flowchart TD
    IN([Plain text role description])

    subgraph WF["LangGraph StateGraph — KitState"]
        A[parse_role\nLLM prompt: extract title · dept · level\nwork_mode · team_size · requirements]
        B{validate\nPydantic RoleInput schema}
        C[rag\nFAISS search query:\nexperienceLevel + roleTitle + department\nreturns industry context chunks]

        subgraph PG["parallel_gen — concurrent LangChain chains"]
            D1[Job Description chain]
            D2[Behavioral Questions chain\n6 questions · STAR format]
            D3[Technical Questions chain\n6 questions · difficulty levels]
            D4[Scorecard chain\nweighted criteria]
            D5[Skills Rubric chain\n1–4 scale per skill]
        end

        E[language_check\nBias audit · inclusive language\nreplace flagged terms]
        F[assemble\nMerge all sections\ninto InterviewKit JSON]
        ERR([Error state])
    end

    OUT([InterviewKit JSON\nmatches kit.schema.json])

    IN --> A
    A --> B
    B -- valid --> C
    B -- invalid --> ERR
    C --> PG
    D1 & D2 & D3 & D4 & D5 --> E
    E --> F
    F --> OUT
```

---

## 5. Docker Compose Infrastructure

```mermaid
graph LR
    subgraph Host["Windows Host"]
        Browser["Browser\nlocalhost:5173"]
        Dev["Developer\nlocalhost:3000\nlocalhost:8000"]
    end

    subgraph Compose["Docker Compose Network"]
        FE_C["frontend\nnginx:80\nserves Vite build"]
        BE_C["backend\nNestJS:3000\nPrisma migrations on start"]
        AI_C["ai-service\nFastAPI:8000\nuvicorn"]
        PG_C["postgres:5432\n→ host:5433\nvolume: postgres_data"]
        RD_C["redis:6379\nvolume: redis_data"]
        VOL["ai_data volume\nFAISS index\nPDF · DOCX files"]
    end

    subgraph Ext["External"]
        LLMAPI["OpenAI / Anthropic\nAPI"]
    end

    Browser -- "5173:80" --> FE_C
    Dev -- "3000:3000" --> BE_C
    Dev -- "8000:8000" --> AI_C

    FE_C -- "depends_on" --> BE_C
    BE_C -- "depends_on (healthy)" --> PG_C
    BE_C -- "depends_on (healthy)" --> RD_C
    BE_C -- "http://ai-service:8000" --> AI_C

    BE_C -- "SQL" --> PG_C
    BE_C -- "TCP" --> RD_C
    AI_C -- "read/write" --> VOL
    AI_C -- "HTTPS" --> LLMAPI
```

---

## 6. Frontend Component Tree

```mermaid
graph TD
    App[App.tsx\nRouter + QueryClientProvider]

    App --> AuthRoute[ProtectedRoute\nredirects if no JWT]
    App --> PublicRoute[Public routes]

    PublicRoute --> LoginPage[LoginPage\nreact-hook-form · JWT]
    PublicRoute --> RegisterPage[RegisterPage]
    PublicRoute --> SharedKitPage[SharedKitPage\nno-auth view via share token]
    PublicRoute --> NotFoundPage[NotFoundPage]

    AuthRoute --> DashboardPage[DashboardPage\nkit list + search]
    AuthRoute --> CreateKitPage[CreateKitPage\nrole description form]
    AuthRoute --> KitDetailPage[KitDetailPage\nresults + tabs]

    DashboardPage --> KitCard[KitCard\nstatus · date · actions]

    KitDetailPage --> KitResultsHeader[KitResultsHeader\ntitle · export buttons]
    KitDetailPage --> JobDescriptionTab[JobDescriptionTab]
    KitDetailPage --> BehavioralQuestionsTab[BehavioralQuestionsTab]
    KitDetailPage --> TechnicalQuestionsTab[TechnicalQuestionsTab]
    KitDetailPage --> ScorecardTab[ScorecardTab]
    KitDetailPage --> RubricTab[RubricTab]
    KitDetailPage --> LanguageIssuesBanner[LanguageIssuesBanner\nshown if bias detected]
    KitDetailPage --> GeneratingOverlay[GeneratingOverlay\nloading state during gen]
```

---

> **Tip:** These diagrams render in GitHub, VS Code (Markdown Preview), Obsidian,
> Notion, and any editor with a Mermaid plugin. You can also paste any diagram
> block into [mermaid.live](https://mermaid.live) to view and export it as SVG or PNG.
