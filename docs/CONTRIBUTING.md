# Contributing to omni-rest

We love contributions! This guide covers everything — from first-time contributors to advanced feature work.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Contribution Areas](#contribution-areas)
  - [🟢 Good First Issues](#-good-first-issues)
  - [🟡 Intermediate](#-intermediate-features)
  - [🔴 Advanced](#-advanced-features)
  - [📦 New Adapters](#-new-adapters)
  - [🧪 Testing & Quality](#-testing--quality)
  - [📄 Docs & DX](#-docs--dx)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)
- [Code of Conduct](#code-of-conduct)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Git
- A Prisma project (for integration testing)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/omni-rest.git
cd omni-rest

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start watching for changes
npm run dev
```

### Project Structure

```
omni-rest/
├── src/
│   ├── adapters/          # Framework adapters (Express, Next.js, Fastify)
│   ├── cli.ts             # CLI — npx omni-rest generate
│   ├── index.ts           # Main exports
│   ├── introspect.ts      # Prisma DMMF introspection
│   ├── middleware.ts      # Guard + hook runner
│   ├── openapi.ts         # OpenAPI 3.0 spec generation
│   ├── query-builder.ts   # URL params → Prisma query
│   ├── router.ts          # Core CRUD handler (framework-agnostic)
│   ├── types.ts           # TypeScript type definitions
│   ├── validate.ts        # Zod-based request validation
│   └── zod-generator.ts   # Auto-generates Zod schemas from DMMF
├── test/
│   └── fixtures/
│       └── mockPrisma.ts  # Mock client + DMMF for tests
├── examples/
│   ├── express-app/       # Full Express example
│   └── nextjs-app/        # Full Next.js App Router example
└── docs/                  # Extended documentation
```

### Where to Start Per Feature Type

| You want to work on... | Start in |
|---|---|
| Filtering, sorting, search | `src/query-builder.ts` |
| New CRUD operations | `src/router.ts` |
| Request/response transforms | `src/middleware.ts` |
| New framework support | `src/adapters/` |
| Schema/type generation | `src/zod-generator.ts` + `src/openapi.ts` |
| CLI commands | `src/cli.ts` |
| Types | `src/types.ts` |

---

## Development Workflow

### Making Changes

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make changes in src/

# 3. Write tests in test/

# 4. Build and test
npm run build && npm test

# 5. Test in a real app
npm link
cd my-test-app && npm link omni-rest

# 6. Commit
git commit -m "feat: add bulk update support"
```

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add ?search= global search param
fix: coerce numeric IDs on findUnique
docs: add cursor pagination example
test: add guard async rejection tests
refactor: split query-builder into filters/pagination
chore: bump tsup to 8.1
```

### Code Style

- Strict TypeScript — no `any` unless documented
- `camelCase` for functions/variables, `PascalCase` for types/interfaces
- JSDoc on every exported function
- Functions under 50 lines — split into helpers if larger
- `async/await` everywhere — no callbacks or `.then()` chains

```typescript
/**
 * Parses URLSearchParams into a Prisma-compatible query object.
 * @param searchParams - URL search parameters from the request
 * @param defaultLimit - Default page size (default: 20)
 * @param maxLimit - Maximum allowed page size (default: 100)
 */
export function buildQuery(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): ParsedQuery {
  // implementation
}
```

### Running Tests

```bash
npm test                              # run all
npm run test:watch                    # watch mode
npm test -- query-builder.test.ts     # single file
npm test -- --coverage                # with coverage
```

---

## Contribution Areas

---

## 🟢 Good First Issues

These are self-contained, well-scoped, and a great way to learn the codebase.

---

### #1 — `?search=` Global Search ✅ Implemented

**File:** `src/query-builder.ts`

Add a `?search=` param that queries all `String` fields of a model using OR.

```
GET /api/department?search=eng
→ WHERE name LIKE '%eng%' OR code LIKE '%eng%' OR description LIKE '%eng%'
```

**Implementation:**
- `search` and `fields` added to `RESERVED_KEYS`
- `buildQuery` accepts an optional `modelFields?: FieldMeta[]` parameter
- Filters to non-relation `String` fields and builds `where: { OR: [...] }` with `mode: "insensitive"`
- `router.ts` passes `meta.fields` into `buildQuery`

**Tests:** exact match, partial match, multi-field OR, no string fields (no-op), combined with other filters, `search` not treated as a filter field.

---

### #2 — Soft Delete Support ✅ Implemented

**Files:** `src/router.ts`, `src/introspect.ts`, `src/types.ts`

If a model has `deletedAt: DateTime?` or `isActive: Boolean`, `DELETE` should update that field instead of destroying the record.

```ts
omniRest(prisma, {
  softDelete: true,               // global
  softDeleteField: "deletedAt",  // optional — auto-detected if omitted
})
```

**Auto-detection priority (when `softDeleteField` is omitted):**
1. Field named `deletedAt` with type `DateTime` → set to `new Date()`
2. Field named `isActive` with type `Boolean` → set to `false`
3. No matching field → falls back to hard delete

**GET list** automatically excludes soft-deleted records (`deletedAt: null` / `isActive: true`) when `softDelete: true`.

**Tests:** soft delete updates field, isActive variant, GET list exclusion, fallback to hard delete when field absent, hard delete when option is false.

---

### #3 — `?fields=` Alias for `?select=` ✅ Implemented

**File:** `src/query-builder.ts`

PostgREST uses `?select=`, REST users often expect `?fields=`. One-liner alias in `buildQuery`:

```ts
const selectParam = searchParams.get("select") ?? searchParams.get("fields");
```

Both `select` and `fields` are now in `RESERVED_KEYS`.

**Tests:** both params produce identical output, `?select=` takes precedence when both provided.

---

### #4 — Sort by Relation Count ✅ Implemented

**File:** `src/query-builder.ts`

Support `?sort=_count.posts:desc` — sort by how many related records exist.

```
?sort=_count.posts:desc
→ orderBy: { posts: { _count: "desc" } }
```

The sort parser detects the `_count.` prefix, extracts the relation name, and builds the nested `orderBy` object. Composes with regular sort fields. `ParsedQuery.orderBy` widened to `Record<string, any>` in `src/types.ts`.

**Tests:** `_count.relation:asc`, `_count.relation:desc`, mixed with regular fields, bare `_count` (no dot) treated as regular field, direction defaults to `asc`.

---

### #5 — Response Envelope Option ✅ Implemented

**Files:** `src/router.ts`, `src/types.ts`

Let users disable the `{ data, meta }` wrapper for list endpoints:

```ts
omniRest(prisma, { envelope: false })
// Returns: [...records]   instead of   { data: [...], meta: {...} }
// Sets X-Total-Count header with the total record count
```

`envelope?: boolean` added to `PrismaRestOptions` (default `true`). `HandlerResult` extended with optional `headers?: Record<string, string>` so adapters can forward the `X-Total-Count` header. Single-record GET is unaffected.

**Tests:** envelope on returns `{ data, meta }`, envelope off returns plain array, `X-Total-Count` header set, GET by id unaffected.

---

## 🟡 Intermediate Features

Require understanding of at least two source files. Good for contributors who've done one PR already.

---

### #6 — Nested Relation Filtering ✅ Implemented

**File:** `src/query-builder.ts`

Support dot-notation filters to query through relations:

```
?employees.isActive=true
→ where: { employees: { some: { isActive: true } } }   (isList relation)

?customer.city=Karachi
→ where: { customer: { city: "Karachi" } }              (singular relation)

?author.name_contains=john
→ where: { author: { name: { contains: "john" } } }
```

Dot keys are detected before regular operator matching. `modelFields` determines `isList` → `some: {}` vs direct nesting. Unknown relations and deeply nested keys (two dots) fall through to regular filter handling (documented in code comment).

**Tests:** list relation `some`, singular direct nesting, operator suffix inside dot notation, combined with regular filters, unknown relation graceful fallthrough, no modelFields fallthrough, two-dot deep nesting fallthrough.

---

### #7 — Bulk Operations

**File:** `src/router.ts`, `src/adapters/*.ts`

New endpoint pattern under `/bulk`:

```
POST   /api/department/bulk    → createMany
PUT    /api/department/bulk    → updateMany (body: { where, data })
DELETE /api/department/bulk    → deleteMany (body: { where })
```

Maps to Prisma's `createMany`, `updateMany`, `deleteMany`. Return `{ count: N }`.

**Tests needed:** bulk create returns count, bulk update applies where, bulk delete guard test.

---

### #8 — Field-Level Permissions ✅ Implemented

**Files:** `src/router.ts`, `src/types.ts`

Strip sensitive fields from responses and write bodies:

```ts
omniRest(prisma, {
  fieldGuards: {
    user: {
      hidden:    ["salt"],              // never in any response
      readOnly:  ["id", "createdAt"],  // stripped from POST/PUT body before Prisma
      writeOnly: ["password"],         // never in GET responses
    }
  }
})
```

`FieldGuardConfig` and `FieldGuardMap` types added to `src/types.ts`. `stripResponse()` removes `hidden` + `writeOnly` fields from all responses. `sanitizeBody()` removes `readOnly` fields from write bodies. Works on single records, list responses, and `envelope: false` mode.

**Tests:** hidden absent from GET single/list/POST response, writeOnly absent from GET/PUT response, readOnly stripped from POST/PUT body, unguarded fields unaffected, no fieldGuards = no change, envelope:false still strips.

---

### #9 — Rate Limiting Hook ✅ Implemented

**Files:** `src/router.ts`, `src/types.ts`

An optional `rateLimit` function in options, called before every request (after model resolution, before guards):

```ts
omniRest(prisma, {
  rateLimit: async ({ model, method, id }) => {
    const count = await redis.incr(`${model}:${method}`);
    if (count > 100) return "Rate limit exceeded";
    return null; // allow
  }
})
```

Returns error string → 429 response. Returns null → request proceeds. Async supported. Not called for 404 model routes. `RateLimitFn` type exported from `omni-rest`.

**Tests:** 429 on string return, pass on null, async support, runs before guard, not called for unknown model, context contains model/method/id, guard still runs when rate limit allows.

---

### #10 — Hono Adapter ✅ Implemented

**File:** `src/adapters/hono.ts`

Hono works on Cloudflare Workers, Bun, Deno, and Node.

```ts
import { Hono } from "hono";
import { honoAdapter } from "omni-rest/hono";

const app = new Hono();
honoAdapter(app, prisma, { prefix: "/api", allow: ["department"] });

export default app;
```

Uses `c.req.param()`, `c.req.query()`, `c.req.json()`, `c.json()`. Registers `app.all("/:model/:id?")` plus `POST/PUT/DELETE /:model/bulk` routes. `hono` added as optional peer dep and export in `package.json`.

**Tests:** GET list, GET by id, POST, PUT, DELETE 204, unknown model 404, guard 403, prefix option, query params forwarded.

---

### #11 — Koa Adapter

**File:** `src/adapters/koa.ts` (new)

```ts
import Koa from "koa";
import Router from "@koa/router";
import { koaAdapter } from "omni-rest/koa";

const app = new Koa();
koaAdapter(app, prisma, { allow: ["department"] });
```

Uses `ctx.params`, `ctx.query`, `ctx.request.body`, `ctx.body`, `ctx.status`. Add `koa` and `@koa/router` as optional peer deps.

---

### #12 — Global Error Handler Middleware (Express) ✅ Implemented

**File:** `src/adapters/express.ts`

A drop-in Express error handler that maps Prisma error codes to clean JSON:

```ts
app.use("/api", expressAdapter(prisma));
app.use("/custom", myCustomRoutes);
app.use(omniRestErrorHandler()); // catches P2002, P2025 etc.
```

Maps: `P2025 → 404`, `P2002 → 409 (with field name)`, `P2003 → 400`, `P2014 → 400`, unknown Prisma codes `→ 500`, non-Prisma errors pass through to `next()`. Also updated `expressAdapter` to forward `HandlerResult.headers` to the response.

**Tests:** all Prisma code mappings, non-Prisma passthrough, middleware arity check.

---

## 🔴 Advanced Features

These require designing a new subsystem. Open a discussion issue first before implementing.

---

### #13 — Cursor-Based Pagination

**File:** `src/query-builder.ts`, `src/router.ts`, `src/types.ts`

Alongside offset pagination, add cursor mode — much faster on large tables:

```
GET /api/user?cursor=eyJpZCI6MTV9&limit=20
→ Response includes nextCursor token for the next page
```

```ts
// Response shape in cursor mode:
{
  data: [...],
  nextCursor: "eyJpZCI6MzV9",  // base64 encoded { id: 35 }
  hasMore: true
}
```

Cursor is base64 JSON of `{ [idField]: lastId }`. Use `prisma.findMany({ cursor: ..., skip: 1 })`.

**Design first** — open a discussion about response shape before implementing.

---

### #14 — Aggregation Endpoints

**File:** `src/router.ts`, `src/types.ts`

```
GET /api/department/aggregate?_count=*&_sum=salary&_avg=salary&_min=salary&_max=salary
GET /api/department/groupBy?by=city&_count=*
```

Maps to Prisma's `aggregate()` and `groupBy()`. These are new route patterns — add alongside existing collection/resource routes.

**Design first** — URL schema needs discussion. See PostgREST's aggregation design for reference.

---

### #15 — Query Complexity Limiting

**File:** `src/middleware.ts`, `src/query-builder.ts`

Score each query before execution. Reject if above threshold:

```ts
omniRest(prisma, {
  complexity: {
    maxScore: 100,
    rules: {
      perInclude: 10,       // each ?include= relation adds 10
      perFilter: 2,         // each filter adds 2
      perLimit100: 5,       // every 100 records in limit adds 5
    }
  }
})
```

Returns `429 Query too complex` with score breakdown if exceeded.

---

### #16 — Server-Sent Events Subscriptions

**File:** `src/adapters/express.ts`, new `src/subscriptions.ts`

```
GET /api/department/subscribe   → SSE stream of changes
```

Streams `create`, `update`, `delete` events to connected clients. Use Prisma's `$on("query")` events + polling fallback.

```ts
// Client receives:
data: {"event":"create","model":"Department","data":{"id":5,"name":"Engineering"}}
data: {"event":"update","model":"Department","data":{"id":5,"name":"Eng Updated"}}
```

This is the most complex feature on the list — requires connection lifecycle, heartbeat, reconnect handling.

---

### #17 — Auto-generated TypeScript Client SDK

**New sub-package:** `omni-rest-client`

Reads the OpenAPI spec (or DMMF directly) and generates a fully-typed fetch client:

```ts
import { createClient } from "omni-rest-client";

const api = createClient("http://localhost:3000/api");

const { data, meta } = await api.department.findMany({ where: { isActive: true } });
const dept = await api.department.findById(5);
await api.department.create({ name: "Engineering" });
await api.department.update(5, { name: "Eng" });
await api.department.delete(5);
```

Fully typed from DMMF — `api.department.create()` knows which fields are required.

---

### #18 — Plugin Architecture

**File:** `src/types.ts`, `src/router.ts`, `src/middleware.ts`

A formal plugin system that lets third parties extend omni-rest without forking:

```ts
omniRest(prisma, {
  plugins: [
    auditLogPlugin({ storage: prisma }),
    cachePlugin({ ttl: 60, store: redisClient }),
    rateLimitPlugin({ max: 100, window: "1m" }),
  ]
})
```

Each plugin is an object with optional lifecycle methods:

```ts
interface OmniRestPlugin {
  name: string;
  beforeOperation?: HookFn;
  afterOperation?: HookFn;
  onError?: (error: any, ctx: HookContext) => HandlerResult | null;
  transformResponse?: (data: any, ctx: HookContext) => any;
  transformBody?: (body: any, ctx: HookContext) => any;
}
```

**Design first** — this is the most architecturally significant feature. Needs RFC discussion.

---

## 📦 New Adapters

Every new adapter follows the same contract — map the framework's request/response to `handle()`:

```ts
const { status, data } = await handle(method, modelName, id, body, searchParams);
```

| Adapter | Issue | Difficulty |
|---|---|---|
| Hono | #10 | Intermediate |
| Koa | #11 | Intermediate |
| NestJS | future | Advanced |
| Elysia (Bun) | future | Intermediate |
| SvelteKit | future | Intermediate |
| SolidStart | future | Intermediate |

---

## 🧪 Testing & Quality

- **Minimum 80% coverage** before any PR merges
- Every new feature needs tests in `test/`
- Use `mockPrisma` and `mockDMMF` from `test/fixtures/` — never spin up a real DB in unit tests
- Integration tests (real DB) go in `test/integration/` and are opt-in

```bash
npm test -- --coverage     # check coverage
npm test -- --reporter=verbose  # detailed output
```

---

## 📄 Docs & DX

Documentation contributions are equally valuable:

- Fix typos, unclear explanations → always welcome, no issue needed
- Add a framework example → create issue first, link to example app
- Add a recipe (auth, audit log, etc.) → `docs/recipes/` folder
- Improve CLI help text → `src/cli.ts`
- Add JSDoc to exported functions → always welcome

---

## Submitting Changes

### Before Opening a PR

```bash
npm run build       # must pass
npm test            # must pass
npm run typecheck   # must pass
```

### PR Template

```markdown
## What does this PR do?
Brief description

## Type of Change
- [ ] Bug fix
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation
- [ ] New adapter

## Related Issue
Closes #<number>

## How was it tested?
- Unit tests added in test/
- Tested with example app (Express / Next.js)
- Manual test steps: ...

## Checklist
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Types check (`npm run typecheck`)
- [ ] JSDoc added for new exports
- [ ] README updated if user-facing change
- [ ] CHANGELOG.md entry added
```

### Review Criteria

| | What we check |
|---|---|
| ✅ Code Quality | Follows style guide, strict TypeScript |
| ✅ Tests | New functionality is tested |
| ✅ Docs | README + JSDoc updated |
| ✅ Performance | No regressions, no N+1 query patterns |
| ✅ Compat | Works on Node 18+, Prisma 4+ and 5+ |
| ✅ Size | Bundle size impact checked (`npm run build`) |

---

## Reporting Bugs

```markdown
**Describe the bug**
Clear description of what went wrong.

**To Reproduce**
1. Schema: model Department { ... }
2. Config: omniRest(prisma, { allow: ["department"] })
3. Request: GET /api/department?name_contains=eng
4. Result: ...

**Expected behavior**
What should have happened.

**Environment**
- Node: 20.x
- Prisma: 5.x
- omni-rest: 0.x
- Framework: Express / Next.js / Fastify
- OS: Ubuntu / macOS / Windows

**Minimal reproduction**
Link to repo or paste minimal code
```

---

## Release Process

Only maintainers publish, but here's the full flow:

```bash
# 1. Update version
npm version patch   # or minor / major

# 2. Update CHANGELOG.md

# 3. Tag and push — GitHub Actions does the rest
git tag v0.1.1
git push origin v0.1.1
```

GitHub Actions runs: typecheck → test → build → npm publish

---

## Code of Conduct

Be respectful and constructive. Disagreements on design are welcome — personal attacks are not.

---

## Questions?

- **GitHub Discussions** — design questions, architecture ideas
- **GitHub Issues** — bugs and feature requests
- **PR comments** — implementation feedback

---

Thank you for contributing to omni-rest! 🚀