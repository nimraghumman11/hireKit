# Testing Agent — SKILL.md

## Domain
Cross-cutting test coverage for `interview-kit/` — unit, integration, API, and E2E tests
across frontend, backend, and AI service.

## Stack
| Layer | Tool |
|-------|------|
| Frontend unit/component | Vitest + React Testing Library |
| Backend unit | Jest + NestJS testing utilities |
| Backend integration/API | Jest + Supertest + real PostgreSQL (test DB) |
| E2E | Playwright |
| AI output validation | Python `pytest` + Pydantic model validation |

## Directory Layout
```
frontend/src/test/           # Vitest setup, shared fixtures
frontend/src/pages/*.test.tsx
frontend/src/hooks/*.test.ts
frontend/src/components/**/*.test.tsx

backend/src/**/*.spec.ts     # Jest unit + integration tests alongside source
backend/test/                # Supertest API integration tests

ai-service/tests/            # pytest unit tests for tools/nodes/retriever

e2e/
  playwright.config.ts
  tests/                     # Full user journey E2E tests
  fixtures/                  # Auth state, test kit data
```

## Frontend Testing (Vitest + RTL)

### Setup
```typescript
// vitest.config.ts
export default defineConfig({
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
});

// src/test/setup.ts
import '@testing-library/jest-dom';
```

### Component Test Pattern
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

test('shows validation error when description is too short', async () => {
  renderWithProviders(<CreateKitPage />);
  fireEvent.click(screen.getByRole('button', { name: /generate/i }));
  await waitFor(() => {
    expect(screen.getByText(/at least 40 characters/i)).toBeInTheDocument();
  });
});
```

### Hook Test Pattern
```typescript
import { renderHook, act } from '@testing-library/react';
import { useKitGenerate } from '@/hooks/useKitGenerate';

test('sets isGenerating=true when generate is called', async () => {
  // Mock fetch with a ReadableStream of SSE events
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    body: new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode('event: created\ndata: {"kitId":"test-id"}\n\n'));
      controller.close();
    }}),
  });

  const { result } = renderHook(() => useKitGenerate(), { wrapper: Providers });
  await act(async () => { result.current.generate({ description: 'a'.repeat(50) }); });
  expect(result.current.isGenerating).toBe(true);
});
```

### What to Test (Frontend)
- Form validation: min/max length, required fields, error messages rendered
- Auth flow: login redirects, protected route guards, logout clears store
- SSE hook: each event type (`created`, `progress`, `section_start`, `token`, `section_done`, `complete`, `error`)
- Dashboard: kit list renders, pagination, search/filter
- GeneratingOverlay: steps update, SectionCard shows tokens, done state

## Backend Testing (Jest + Supertest)

### Unit Test Pattern
```typescript
// interview-kit.service.spec.ts
describe('InterviewKitService', () => {
  let service: InterviewKitService;
  let prisma: DeepMockProxy<PrismaService>;
  let aiService: jest.Mocked<AiService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InterviewKitService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: AiService, useValue: { generateKit: jest.fn(), streamGenerateKit: jest.fn() } },
      ],
    }).compile();

    service = module.get(InterviewKitService);
    prisma = module.get(PrismaService);
    aiService = module.get(AiService);
  });

  it('throws ForbiddenException when userId does not match', async () => {
    prisma.interviewKit.findFirst.mockResolvedValue({ ...kitFixture, userId: 'other-user' });
    await expect(service.findById('kit-id', 'current-user')).rejects.toThrow(ForbiddenException);
  });
});
```

### API Integration Test Pattern (Supertest)
```typescript
// Uses a real PostgreSQL test database — never mock the DB
describe('POST /interview-kit/generate-stream (SSE)', () => {
  it('returns text/event-stream content type', async () => {
    const res = await request(app.getHttpServer())
      .post('/interview-kit/generate-stream')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'a'.repeat(50) })
      .expect(200);

    expect(res.headers['content-type']).toContain('text/event-stream');
  });
});
```

**CRITICAL: Never mock the database in integration tests.**
The team was burned by mock/prod divergence in a prior migration — real DB only for integration.

### What to Test (Backend)
- Auth: register, login, JWT validation, expired token rejection
- Kit CRUD: create, read, list pagination, soft-delete, duplicate
- Authorization: user can only access their own kits
- SSE endpoint: correct headers, `created` event with kitId, proxies all event types
- Rate limiting: generation endpoint blocked after limit exceeded
- Validation: DTO constraints enforced

## AI Service Testing (pytest)

### Pattern
```python
# tests/test_tools.py
import pytest
from app.tools.tools import parse_plain_description, run_inclusive_language_check

def test_parse_plain_description_returns_required_fields():
    result = parse_plain_description(
        "We need a senior backend engineer for our payments team. "
        "Python, PostgreSQL, Redis. Remote EU. Must have 5+ years experience."
    )
    assert result["roleTitle"]
    assert result["department"]
    assert result["experienceLevel"] in ["junior", "mid", "senior", "staff", "principal"]
    assert len(result.get("responsibilities", [])) >= 3

def test_inclusive_language_check_flags_biased_words():
    issues = run_inclusive_language_check("We need a rockstar ninja developer.", "jobDescription")
    flagged_words = [i["original"].lower() for i in issues]
    assert any("rockstar" in w or "ninja" in w for w in flagged_words)

def test_strip_fences_removes_markdown():
    from app.tools.tools import _strip_fences
    assert _strip_fences('```json\n{"key": "val"}\n```') == '{"key": "val"}'
```

### Kit Schema Validation
```python
from app.schemas.models import InterviewKit
import pytest

def test_generated_kit_matches_schema(sample_kit_dict):
    kit = InterviewKit(**sample_kit_dict)  # raises ValidationError if invalid
    assert kit.roleTitle
    assert len(kit.behavioralQuestions) >= 5
    assert len(kit.technicalQuestions) >= 5
    assert sum(item.weight for item in kit.scorecard) == 100
```

## E2E Testing (Playwright)

### Pattern
```typescript
// e2e/tests/generate-kit.spec.ts
import { test, expect } from '@playwright/test';

test('user can generate a kit end-to-end', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL('/dashboard');

  await page.click('text=New interview kit');
  await page.fill('textarea[id=description]',
    'We need a senior Python backend engineer for our payments team. ' +
    'Experience with PostgreSQL, Redis, and REST APIs required. Remote in EU.'
  );
  await page.click('button:has-text("Generate interview kit")');

  // Overlay appears
  await expect(page.locator('text=Generating your kit')).toBeVisible();

  // Wait for navigation to results (long timeout for LLM generation)
  await page.waitForURL(/\/kits\/.+\/results/, { timeout: 120_000 });
  await expect(page.locator('h1')).toContainText(/engineer|engineer/i);
});
```

## Test Data / Fixtures
```typescript
// frontend/src/test/fixtures/kit.fixture.ts
export const kitFixture = {
  id: 'test-kit-id',
  roleTitle: 'Senior Backend Engineer',
  department: 'Engineering',
  experienceLevel: 'senior',
  status: 'generated',
  // ...
};
```

## Running Tests
```bash
# Frontend
cd frontend && npm test              # Vitest watch mode
cd frontend && npm run test:ci       # Single run + coverage

# Backend
cd backend && npm test               # Jest watch
cd backend && npm run test:e2e       # Supertest integration

# AI Service
cd ai-service && pytest              # All tests
cd ai-service && pytest tests/test_tools.py -v

# E2E
cd e2e && npx playwright test
cd e2e && npx playwright test --headed   # With browser UI
```

## Rules
1. Integration tests must use a real PostgreSQL test database — never mock Prisma.
2. Every new endpoint needs at least one happy-path + one auth/validation failure test.
3. AI output tests must validate against Pydantic models — assert schema compliance, not just non-null.
4. E2E tests must be deterministic — use fixed test accounts seeded in the test DB, not random data.
5. Do not modify source files when writing tests — tests live alongside or in dedicated test directories.
6. Test files must clean up after themselves (delete created kits, users, etc.) in `afterEach`/`afterAll`.
