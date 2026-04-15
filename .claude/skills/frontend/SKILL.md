# Frontend Agent — SKILL.md

## Domain
`interview-kit/frontend/` — React SPA providing the hiring manager UI:
create kit, live streaming generation overlay, results viewer, dashboard, and export.

## Stack
- **Framework:** React 18 + TypeScript (strict)
- **Build:** Vite 5
- **Styling:** Tailwind CSS v3 (JIT) + custom `cn()` utility
- **State:** Zustand (`authStore`, `uiStore`) for global; React state for local
- **Server state:** TanStack React Query v5 (`useKits`, `useKitGenerate`)
- **Routing:** React Router v6 (`BrowserRouter`, `<Routes>`, `<Navigate>`)
- **Forms:** React Hook Form + Zod (`zodResolver`)
- **HTTP:** `fetch` API (SSE streaming) + Axios via service layer for REST
- **Testing:** Vitest + React Testing Library

## Directory Layout
```
frontend/src/
  main.tsx                     # React root, QueryClientProvider, BrowserRouter
  App.tsx                      # Route definitions
  pages/
    auth/                      # LoginPage, RegisterPage
    CreateKitPage.tsx          # Description form + streaming overlay trigger
    DashboardPage.tsx          # Kit list, search, filters
    KitDetailPage.tsx          # Full kit view — edit inline, export, share
    ResultsPage.tsx            # Post-generation results redirect target
    SharedKitPage.tsx          # Public read-only kit view (no auth)
    NotFoundPage.tsx
  components/
    layout/
      Header.tsx               # Top nav bar
      PageWrapper.tsx          # Centred content container with max-width
    ui/
      Button.tsx               # Variants: primary, secondary, ghost, danger
      ThemeToggle.tsx          # Dark/light mode switch
      Toast.tsx                # Notification toasts driven by uiStore
      Modal.tsx
      Spinner.tsx
    kit/
      GeneratingOverlay.tsx    # Live SSE streaming overlay with SectionCard
      SectionCard.tsx          # Per-section token stream display
      KitCard.tsx              # Dashboard list card
      ScorecardEditor.tsx      # Inline scorecard scoring
  hooks/
    useAuth.ts                 # Login/logout/register mutations
    useKits.ts                 # React Query list + single kit queries
    useKitGenerate.ts          # SSE streaming hook (core generation logic)
    useExport.ts               # PDF/DOCX export mutations
    useDebounce.ts             # Search input debounce
  services/
    api.ts                     # Axios instance with JWT interceptor
    auth.service.ts            # Auth REST calls
    kit.service.ts             # Kit REST calls (non-streaming)
  store/
    authStore.ts               # Zustand: token, user, login/logout
    uiStore.ts                 # Zustand: toasts, modals, theme
  utils/
    cn.ts                      # clsx + tailwind-merge helper
  types/                       # Shared TypeScript types (mirrors schema_types.md)
```

## Routing Structure
```
/                   → redirect to /dashboard (if authed) or /login
/login              → LoginPage
/register           → RegisterPage
/dashboard          → DashboardPage (protected)
/kits/new           → CreateKitPage (protected)
/kits/:id           → KitDetailPage (protected)
/kits/:id/results   → ResultsPage (protected, navigated to after generation)
/shared/:token      → SharedKitPage (public, no auth)
```

## SSE Streaming (useKitGenerate)
The generate hook uses `fetch()` with a `ReadableStream` reader — NOT `EventSource`
(which only supports GET and cannot send Authorization headers).

```typescript
// Event types to handle:
'created'       → save kitId from { kitId }
'progress'      → advance step indicator from { node, label, step, total }
'section_start' → add SectionPreview card from { section }
'token'         → append chunk to preview.tokens from { section, chunk }
'section_done'  → mark preview as done from { section }
'complete'      → invalidate queries, navigate to /kits/:id/results
'error'         → show toast, set isGenerating=false

// NODE_TO_STEP mapping (must match ai-service LangGraph nodes):
{ parse_role: 0, validate: 1, rag: 2, parallel_gen: 3, language_check: 4, assemble: 5 }
```

## React Query Keys
```typescript
// useKits.ts
export const KIT_KEYS = {
  all: ['kits'] as const,
  list: (params) => ['kits', 'list', params] as const,
  detail: (id: string) => ['kits', id] as const,
};
```
Always use `queryClient.invalidateQueries({ queryKey: KIT_KEYS.all })` after mutations.

## Zustand Stores
```typescript
// authStore.ts
interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// uiStore.ts
interface UiState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}
```

## Component Patterns
```typescript
// Always use cn() for conditional class merging
import { cn } from '@/utils/cn';
<div className={cn('base-class', condition && 'conditional-class', props.className)} />

// Form pattern with React Hook Form + Zod
const schema = z.object({ description: z.string().min(40).max(12000) });
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});

// Disable form controls during generation
const busy = isGenerating || isPending;
<Button disabled={busy}>Generate</Button>
```

## API Service Layer
```typescript
// services/api.ts — Axios with auto-injected JWT
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// For SSE streaming — use fetch() directly, not Axios:
const response = await fetch(`${import.meta.env.VITE_API_URL}/interview-kit/generate-stream`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ description }),
});
```

## Tailwind Design System
The app uses a premium HR SaaS aesthetic:
- **Primary gradient:** `from-violet-600 via-indigo-500 to-sky-500`
- **Card style:** `rounded-2xl border border-white/60 bg-white/90 shadow-xl backdrop-blur`
- **Dark mode:** `dark:bg-slate-800/90 dark:border-slate-700/80`
- **Input style:** `rounded-xl border border-slate-200/90 bg-white focus:ring-violet-500/20`
- **Font:** serif for headings (`font-serif`), default sans for body

Always support both light and dark modes — every Tailwind class needs a `dark:` variant.

## Environment Variables
```
VITE_API_URL=http://localhost:3000   # NestJS backend base URL
```

## Naming Conventions
- Components: `PascalCase` (`KitCard.tsx`, `GeneratingOverlay.tsx`)
- Hooks: `camelCase` prefixed with `use` (`useKitGenerate.ts`)
- Stores: `camelCase` with `Store` suffix (`authStore.ts`)
- Types: `PascalCase` interfaces, `camelCase` properties
- CSS classes: Tailwind utility classes, composed with `cn()`

## Rules
1. Never call the AI service directly from the frontend — always go through the backend.
2. All forms must use React Hook Form + Zod validation — no uncontrolled inputs.
3. Every component that renders user-generated content must handle `null`/`undefined` gracefully.
4. All interactive elements must be keyboard-accessible and have appropriate ARIA labels.
5. Use `React Query` for all server state — no manual `useState` + `useEffect` fetch patterns.
6. Dark mode support is mandatory on every new component.
7. Do not modify files outside `frontend/`.
