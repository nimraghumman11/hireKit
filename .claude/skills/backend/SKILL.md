# Backend Agent — SKILL.md

## Domain
`interview-kit/backend/` — NestJS REST API providing authentication, kit CRUD,
AI service proxy, export, and SSE streaming to the frontend.

## Stack
- **Runtime:** Node.js 20, NestJS 10, TypeScript
- **ORM:** Prisma 5 + PostgreSQL
- **Auth:** JWT (access token) via `@nestjs/jwt` + Passport
- **HTTP Client:** `@nestjs/axios` (AxiosModule) for AI service calls
- **Rate limiting:** `@nestjs/throttler` — two named limiters: `global` + `generation`
- **Validation:** `class-validator` + `class-transformer` via global `ValidationPipe`
- **API Docs:** Swagger (`@nestjs/swagger`) at `/api/docs`
- **Cache:** Redis (`@nestjs/cache-manager`) for session / rate limit state

## Directory Layout
```
backend/src/
  main.ts                        # Bootstrap, global pipes/guards/interceptors
  app.module.ts                  # Root module — imports all feature modules
  auth/
    auth.controller.ts           # POST /auth/login, /auth/register, /auth/me
    auth.service.ts              # JWT sign/verify, bcrypt password hashing
    auth.module.ts
    jwt.strategy.ts              # Passport JWT strategy
    dto/                         # LoginDto, RegisterDto
  interview-kit/
    interview-kit.controller.ts  # All kit endpoints + SSE generate-stream
    interview-kit.service.ts     # Business logic, DB ops, AI proxy
    interview-kit.module.ts
    dto/                         # CreateInterviewKitDto, QueryInterviewKitDto, etc.
  ai/
    ai.service.ts                # HTTP calls to ai-service (generate, stream, export)
  users/
    users.service.ts             # User CRUD
  prisma/
    prisma.service.ts            # PrismaClient singleton
  common/
    guards/jwt-auth.guard.ts     # JwtAuthGuard (applied globally on controllers)
    interceptors/response.interceptor.ts  # Wraps all responses in {data, error, meta}
    filters/                     # Global exception filters
    pipes/                       # Global validation pipe
```

## API Routes
All routes require `Authorization: Bearer <jwt>` unless noted.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Returns JWT |
| GET | `/auth/me` | Current user profile |
| POST | `/interview-kit/generate` | Generate kit (async, returns kitId immediately) |
| POST | `/interview-kit/generate-stream` | **SSE streaming generation** |
| GET | `/interview-kit` | List kits (paginated, filterable) |
| GET | `/interview-kit/:id` | Get kit by ID |
| GET | `/interview-kit/:id/status` | Poll generation status |
| PATCH | `/interview-kit/:id` | Inline-edit sections |
| PUT | `/interview-kit/:id/scorecard` | Save scorecard scores |
| POST | `/interview-kit/:id/regenerate/:section` | Regenerate single section |
| POST | `/interview-kit/:id/share` | Get/create share token |
| POST | `/interview-kit/:id/export/pdf` | Trigger PDF export |
| POST | `/interview-kit/:id/export/docx` | Trigger DOCX export |
| POST | `/interview-kit/:id/duplicate` | Duplicate a kit |
| DELETE | `/interview-kit/:id` | Soft-delete |
| GET | `/public/kit/:token` | Public shared kit (no auth) |

## Response Envelope
Every non-SSE response is wrapped by `ResponseInterceptor`:
```json
{
  "data": { ... },
  "error": null,
  "meta": { "timestamp": "...", "requestId": "..." }
}
```
**SSE responses bypass the interceptor** — detected via `Content-Type: text/event-stream`.

## SSE Streaming Pattern
The `generate-stream` endpoint **must** use raw `@Res()` to control the response directly:
```typescript
@Post('generate-stream')
async generateStream(@Body() dto, @Request() req, @Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  await this.kitService.generateStream(dto, req.user.id, res);
}
```
The service proxies **all** SSE event types from the AI service:
`created` | `progress` | `section_start` | `token` | `section_done` | `complete` | `error`

## Auth Pattern
```typescript
// Every protected controller:
@UseGuards(JwtAuthGuard)
@Controller('interview-kit')
export class InterviewKitController { ... }

// Access user in handler:
generate(@Body() dto, @Request() req: AuthRequest) {
  return this.kitService.generate(dto, req.user.id);
}
```

## Rate Limiting
Two named throttlers are configured in `AppModule`:
- `global` — applies to all routes
- `generation` — stricter limit (20 req / 1 hour) on generate/export endpoints

To skip all throttlers on polling/read endpoints:
```typescript
const SKIP_ALL_THROTTLERS = { global: true, generation: true } as const;
@SkipThrottle(SKIP_ALL_THROTTLERS)
```

## Prisma Patterns
```typescript
// Always use the PrismaService singleton
constructor(private readonly prisma: PrismaService) {}

// Soft-delete pattern (never hard-delete kits)
await this.prisma.interviewKit.update({ where: { id }, data: { deletedAt: new Date() } });

// Always filter out soft-deleted records
const kit = await this.prisma.interviewKit.findFirst({ where: { id, deletedAt: null } });
```

## AI Service Client
```typescript
// ai/ai.service.ts
async streamGenerateKit(dto): Promise<IncomingMessage> {
  const response = await this.httpService.axiosRef.post(
    `${this.baseUrl}/generate-kit/stream`,
    { description: dto.description },
    { responseType: 'stream', timeout: this.TIMEOUT_MS },
  );
  return response.data;
}
```

## DTO Validation
All request bodies must have a corresponding DTO with `class-validator` decorators:
```typescript
export class CreateInterviewKitDto {
  @IsString()
  @MinLength(40)
  @MaxLength(12000)
  description: string;
}
```

## Error Handling
- Throw NestJS exceptions — the global filter maps them to the envelope format
- `NotFoundException` → 404, `ForbiddenException` → 403, `BadRequestException` → 400
- Always include `{ error: 'ERROR_CODE', message: 'Human readable' }` in the body

## Environment Variables Required
```
DATABASE_URL=postgresql://user:pass@localhost:5432/interview_kit
JWT_SECRET=
AI_SERVICE_BASE_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379
```

## Naming Conventions
- TypeScript / NestJS: `camelCase` variables, `PascalCase` classes/DTOs
- Database columns: `snake_case` (Prisma maps automatically)
- API routes: `kebab-case`
- DTO files: `<name>.dto.ts`

## Rules
1. Never return raw Prisma entities — always `mapKit()` before sending to client.
2. All endpoints touching kits must verify `kit.userId === req.user.id` (or throw 403).
3. Soft-delete only — never run `prisma.interviewKit.delete()`.
4. SSE endpoints must set `Content-Type: text/event-stream` before writing any data.
5. All HTTP calls to the AI service go through `AiService` — never call `fetch`/`axios` directly in the controller.
6. Do not modify files outside `backend/`.
