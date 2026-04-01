# GitHub Issues — omni-rest

Copy-paste these directly into GitHub Issues.
Each issue includes the **exact moment to raise it** in your release roadmap.

---

## 🗺️ When to Raise Which Issue

```
v0.1.0 — Initial publish (done)
  └── Raise: #1, #2, #3 immediately after publish

v0.1.x — Stabilization (first 2 weeks)
  └── Raise: #4, #5, #12 once v0.1.0 gets first users

v0.2.0 — Core completeness (1 month in)
  └── Raise: #6, #7, #8, #9 after #1–5 are merged

v0.3.0 — Ecosystem expansion (2 months in)
  └── Raise: #10, #11 (new adapters) after v0.2.0

v0.4.0 — Power features (3 months in)
  └── Raise: #13, #14, #15 after adoption grows

v1.0.0 — Production-ready (6 months in)
  └── Raise: #16, #17, #18 as v1.0 milestone items
```

---

---

# BATCH 1 — Raise immediately after v0.1.0 publish

---

## Issue #1 ✅ RESOLVED

**Title:** `feat: add ?search= global search across string fields`

**Labels:** `good first issue`, `enhancement`, `query-builder`

**Status:** Implemented in `src/query-builder.ts`. `buildQuery` now accepts an optional `modelFields` parameter and builds a Prisma `OR` clause across all non-relation `String` fields with `mode: "insensitive"`. `router.ts` passes `meta.fields` automatically. Tests added in `test/query-builder.test.ts`.

---

## Issue #2 ✅ RESOLVED

**Title:** `feat: soft delete support for models with deletedAt or isActive`

**Labels:** `good first issue`, `enhancement`, `router`

**Status:** Implemented across `src/introspect.ts`, `src/router.ts`, and `src/types.ts`. `detectSoftDeleteField()` auto-detects `deletedAt` (DateTime) or `isActive` (Boolean) from DMMF. DELETE performs an update when the field is found; falls back to hard delete otherwise. GET list automatically excludes soft-deleted records. Tests in `test/soft-delete.test.ts`.

---

## Issue #3 ✅ RESOLVED

**Title:** `feat: add ?fields= as alias for ?select=`

**Labels:** `good first issue`, `enhancement`, `query-builder`

**Status:** Implemented in `src/query-builder.ts` as part of the issue #1 batch. `fields` added to `RESERVED_KEYS`; select param resolution is `searchParams.get("select") ?? searchParams.get("fields")`. `?select=` takes precedence when both are provided. Tests in `test/query-builder.test.ts`.

---

---

# BATCH 2 — Raise after v0.1.0 is stable (first 2 weeks)

---

## Issue #4 ✅ RESOLVED

**Title:** `feat: sort by relation count with ?sort=_count.relation:desc`

**Labels:** `good first issue`, `enhancement`, `query-builder`

**Status:** Implemented in `src/query-builder.ts`. The sort parser detects the `_count.` prefix and builds `orderBy: { relation: { _count: dir } }`. Composes with regular sort fields. `ParsedQuery.orderBy` widened to `Record<string, any>` in `src/types.ts` to support nested objects. Tests in `test/query-builder.test.ts`.

---

## Issue #5 ✅ RESOLVED

**Title:** `feat: add envelope option to disable { data, meta } wrapper`

**Labels:** `good first issue`, `enhancement`, `router`

**Status:** Implemented in `src/router.ts` and `src/types.ts`. `envelope?: boolean` added to `PrismaRestOptions` (default `true`). When `false`, GET list returns a plain array and sets `X-Total-Count` header. `HandlerResult` extended with optional `headers` field so adapters can forward them. Tests in `test/router.test.ts`.

---

## Issue #12 ✅ RESOLVED

**Title:** `feat: omniRestErrorHandler() Express middleware for global Prisma error mapping`

**Labels:** `good first issue`, `enhancement`, `adapters`

**Status:** Implemented in `src/adapters/express.ts`. `omniRestErrorHandler()` is a standard 4-argument Express error middleware factory. Maps P2025 → 404, P2002 → 409, P2003 → 400, P2014 → 400, unknown Prisma codes → 500, non-Prisma errors pass through to `next()`. Also updated `expressAdapter` to forward `HandlerResult.headers` (e.g. `X-Total-Count`). Tests in `test/express-error-handler.test.ts`.

---

---

# BATCH 3 — Raise when v0.2.0 is being planned (1 month in)

---

## Issue #6

**Title:** `feat: nested relation filtering with dot-notation params`

**Labels:** `intermediate`, `enhancement`, `query-builder`

**Body:**
```
## Summary
Support filtering parent records by child relation fields using 
dot-notation in query params.

## Motivation
"Show me all departments that have at least one active employee" 
is impossible today without a custom route. Dot-notation filtering 
maps directly to Prisma's nested where syntax.

## Desired Behavior
GET /api/department?employees.isActive=true
→ where: { employees: { some: { isActive: true } } }

GET /api/order?customer.city=Karachi
→ where: { customer: { city: "Karachi" } }

GET /api/post?author.name_contains=john
→ where: { author: { name: { contains: "john" } } }

## Implementation Notes
- File: `src/query-builder.ts`
- Detect dots in key before operator suffix matching
- Split on first dot: left = relation, right = field (+ optional op)
- Need relation type from DMMF to decide some vs direct nesting
  - isList relation → some: { ... }
  - singular relation → direct: { ... }
- ModelMeta with FieldMeta must be passed into buildQuery

## Design Questions (discuss before implementing)
- How to handle deeply nested? (posts.comments.text_contains)
- How to handle none: / every: variants?

## Tests Needed
- List relation with some (isList: true)
- Singular relation with direct nesting
- Relation + operator combo (relation.field_contains)
- Dot param combined with regular filter
- Invalid relation name is ignored gracefully

## Acceptance Criteria
- [ ] dot.notation filters work for list and singular relations
- [ ] Operator suffixes work inside dot notation
- [ ] ModelMeta passed into buildQuery cleanly
- [ ] Tests pass
- [ ] Discussion on deep nesting documented in code comment
```

---

## Issue #7

**Title:** `feat: bulk create, update, delete endpoints`

**Labels:** `intermediate`, `enhancement`, `router`

**Body:**
```
## Summary
Add /bulk endpoint pattern for batch operations, mapping to Prisma's 
createMany, updateMany, deleteMany.

## Motivation
Importing CSV data, seeding databases, and bulk status updates are 
extremely common in management systems. Without bulk endpoints, 
each record requires a separate HTTP round trip.

## Desired Behavior
// Bulk create
POST /api/department/bulk
Body: [{ name: "Engineering" }, { name: "Marketing" }]
Response: { count: 2 }

// Bulk update
PUT /api/department/bulk
Body: { where: { isActive: false }, data: { isActive: true } }
Response: { count: 5 }

// Bulk delete
DELETE /api/department/bulk
Body: { where: { isActive: false } }
Response: { count: 3 }

## Implementation Notes
- Files: `src/router.ts`, `src/adapters/*.ts`
- Add /bulk as a new route pattern in all adapters
- In router.ts, detect id === "bulk" as a special case
- Map to delegate.createMany, delegate.updateMany, delegate.deleteMany
- Guards should still run — pass { id: "bulk", body } to guard fn
- createMany body: array directly
- updateMany/deleteMany body: { where, data? }

## Tests Needed
- Bulk create with valid array returns count
- Bulk update with where + data returns count
- Bulk delete with where returns count
- Guard blocks bulk operation
- Empty array/where handled gracefully

## Acceptance Criteria
- [ ] POST /model/bulk → createMany
- [ ] PUT /model/bulk → updateMany
- [ ] DELETE /model/bulk → deleteMany
- [ ] Guards apply to bulk routes
- [ ] Tests pass
- [ ] README shows bulk usage
```

---

## Issue #8

**Title:** `feat: field-level permissions (hidden, readOnly, writeOnly)`

**Labels:** `intermediate`, `enhancement`, `router`, `security`

**Body:**
```
## Summary
Allow developers to control which fields are readable and writable 
per model, without writing custom Prisma queries.

## Motivation
Every real app has sensitive fields: passwords, internal notes, 
audit timestamps. Currently there is no way to prevent them from 
appearing in responses or being written via the API.

## Desired Behavior
omniRest(prisma, {
  fieldGuards: {
    user: {
      hidden:    ["password", "salt", "internalNote"],  // stripped from all responses
      readOnly:  ["id", "createdAt", "updatedAt"],       // stripped from write bodies
      writeOnly: ["password"],                           // in write bodies only, never in GET
    }
  }
})

// GET /api/user/1 → never includes password, salt, internalNote
// POST /api/user with { name, password } → id/createdAt stripped from body before Prisma
// GET /api/user/1 → password absent even if in DB

## Implementation Notes
- Files: `src/router.ts`, `src/types.ts`
- Add `fieldGuards` to PrismaRestOptions
- In router.ts before returning response: strip `hidden` and `writeOnly` fields
- Before passing body to Prisma: strip `readOnly` fields
- Works on both single records and arrays (list response)
- Should apply recursively to included relations? (discuss)

## Tests Needed
- hidden field absent from GET single
- hidden field absent from GET list
- readOnly field stripped from POST body before Prisma call
- writeOnly absent from GET response
- Fields not in fieldGuards are unaffected
- Included relation fields are also filtered

## Acceptance Criteria
- [ ] hidden fields never appear in any response
- [ ] readOnly fields stripped from write operations
- [ ] writeOnly fields never appear in GET responses
- [ ] Works on list and single responses
- [ ] Tests pass
- [ ] Security implications documented
```

---

## Issue #9

**Title:** `feat: rateLimit hook in PrismaRestOptions`

**Labels:** `intermediate`, `enhancement`, `middleware`, `security`

**Body:**
```
## Summary
Add an optional `rateLimit` function to PrismaRestOptions that can 
block requests and return 429 responses.

## Motivation
Production APIs need rate limiting. Today developers must add rate 
limiting middleware before the omni-rest adapter, which works but 
is disconnected from the model/method context.

## Desired Behavior
import { rateLimit } from "express-rate-limit"; // or any lib

omniRest(prisma, {
  rateLimit: async ({ model, method, ip }) => {
    // return error string to block with 429
    // return null to allow
    const key = `${ip}:${model}:${method}`;
    const count = await cache.incr(key);
    if (count > 100) return "Too many requests. Slow down.";
    return null;
  }
})

Response when blocked:
429 { error: "Too many requests. Slow down." }

## Implementation Notes
- Files: `src/types.ts`, `src/middleware.ts`, `src/router.ts`
- Add `rateLimit?: RateLimitFn` to PrismaRestOptions
- Type: (ctx: { model: string; method: string; id?: string | null }) => string | null | Promise<string | null>
- Run in router.ts before guards, after model resolution
- Return 429 if function returns a string
- IP must come from adapter layer — add to HookContext

## Tests Needed
- Returns 429 when rateLimit fn returns a string
- Request passes when rateLimit fn returns null
- Async rateLimit function works
- rateLimit runs before guard
- rateLimit not called for 404 model routes

## Acceptance Criteria
- [ ] rateLimit option works
- [ ] Returns 429 with the error message
- [ ] Async support
- [ ] Tests pass
- [ ] README shows Redis example
```

---

---

# BATCH 4 — Raise when v0.3.0 is planned (2 months in)

---

## Issue #10

**Title:** `feat: Hono adapter for Cloudflare Workers, Bun, Deno`

**Labels:** `intermediate`, `new adapter`, `enhancement`

**Body:**
```
## Summary
Add a Hono adapter so omni-rest works on Cloudflare Workers, Bun, 
Deno, and any other Hono-compatible runtime.

## Motivation
Hono is one of the fastest growing frameworks in the JS ecosystem.
It runs on edge runtimes where Prisma Accelerate / D1 are popular.
omni-rest should work there too.

## Desired Behavior
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { honoAdapter } from "omni-rest/hono";

const app = new Hono();
const prisma = new PrismaClient();

honoAdapter(app, prisma, {
  prefix: "/api",
  allow: ["department", "category"],
});

export default app;

## Implementation Notes
- New file: `src/adapters/hono.ts`
- Hono route: app.all("/:model/:id?", handler)
- Map: c.req.param("model"), c.req.param("id"), c.req.query()
- Body: await c.req.json()
- Response: c.json(data, status)
- Add "hono" to peerDependencies as optional
- Add "hono" to exports in package.json

## Tests Needed
- GET list returns 200
- POST returns 201
- GET by id returns 200
- Unknown model returns 404
- Guard blocks with 403

## Acceptance Criteria
- [ ] honoAdapter exported from omni-rest/hono
- [ ] All CRUD operations work
- [ ] Works on Cloudflare Workers (test with wrangler dev)
- [ ] Tests pass
- [ ] README shows Cloudflare Workers example
```

---

## Issue #11

**Title:** `feat: Koa adapter`

**Labels:** `intermediate`, `new adapter`, `enhancement`

**Body:**
```
## Summary
Add a Koa adapter as an alternative to Express for Node.js apps.

## Desired Behavior
import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-body";
import { PrismaClient } from "@prisma/client";
import { koaAdapter } from "omni-rest/koa";

const app = new Koa();
const prisma = new PrismaClient();

app.use(bodyParser());
koaAdapter(app, prisma, {
  prefix: "/api",
  allow: ["department", "category"],
});

app.listen(3000);

## Implementation Notes
- New file: `src/adapters/koa.ts`
- Uses ctx.params.model, ctx.params.id
- Uses ctx.query for search params
- Uses ctx.request.body for POST/PUT/PATCH
- Sets ctx.body = data, ctx.status = status
- Requires @koa/router for parameterized routes
- Add "koa" and "@koa/router" as optional peer deps

## Tests Needed
- Same as Hono: GET, POST, GET by id, 404, guard

## Acceptance Criteria
- [ ] koaAdapter exported from omni-rest/koa
- [ ] All CRUD operations work
- [ ] Tests pass
- [ ] README shows Koa example
```

---

---

# BATCH 5 — Raise when planning v0.4.0 or v1.0.0 (3–6 months in)

---

## Issue #13

**Title:** `feat: cursor-based pagination`

**Labels:** `advanced`, `enhancement`, `query-builder`, `needs design`

**Body:**
```
## Summary
Add cursor-based pagination as an alternative to offset pagination.
Cursor pagination is significantly faster on large tables and gives
stable results during concurrent writes.

## Motivation
Offset pagination (LIMIT 20 OFFSET 1000) gets slower as offset grows.
Cursor pagination (WHERE id > lastId LIMIT 20) is O(1) regardless of position.
This is essential for any table with more than ~10k rows.

## Desired Behavior
// First page (no cursor)
GET /api/user?limit=20&paginationMode=cursor
Response: {
  data: [...20 users],
  nextCursor: "eyJpZCI6MjB9",   // base64({ id: 20 })
  hasMore: true
}

// Next page
GET /api/user?limit=20&paginationMode=cursor&cursor=eyJpZCI6MjB9
Response: {
  data: [...next 20 users],
  nextCursor: "eyJpZCI6NDB9",
  hasMore: true
}

// Last page
{ data: [...], nextCursor: null, hasMore: false }

## Implementation Notes
- Files: `src/query-builder.ts`, `src/router.ts`, `src/types.ts`
- Add `paginationMode?: "offset" | "cursor"` to PrismaRestOptions
- Cursor = base64(JSON.stringify({ [idField]: lastId }))
- Prisma call: findMany({ cursor: { id: lastId }, skip: 1, take: limit })
- skip: 1 skips the cursor record itself
- Response shape changes when in cursor mode — no `page` or `total`
- Must be combined with a consistent sort (default: idField asc)

## Open Design Questions
Please discuss before implementing:
1. Should cursor and offset be selectable per-request or per-config?
2. How to handle cursors for composite primary keys?
3. Should total count still be returned (expensive)?
4. What happens when cursor record is deleted?

## Acceptance Criteria
- [ ] ?paginationMode=cursor activates cursor mode
- [ ] nextCursor is returned correctly
- [ ] hasMore: false on last page
- [ ] nextCursor: null on last page
- [ ] Backward compat — default is still offset mode
- [ ] Tests pass
- [ ] Design questions answered in PR description
```

---

## Issue #14

**Title:** `feat: aggregation endpoints (/aggregate and /groupBy)`

**Labels:** `advanced`, `enhancement`, `router`, `needs design`

**Body:**
```
## Summary
Add aggregation endpoints that map to Prisma's aggregate() and 
groupBy() methods, enabling basic analytics without custom routes.

## Motivation
"Total salary by department", "count of active users by city" — 
these analytics queries are needed in every management system but 
require custom routes today.

## Desired Behavior
// Aggregation
GET /api/employee/aggregate?_count=*&_sum=salary&_avg=salary&_min=salary&_max=salary
Response: {
  _count: { _all: 45 },
  _sum: { salary: 2250000 },
  _avg: { salary: 50000 },
  _min: { salary: 30000 },
  _max: { salary: 120000 }
}

// GroupBy
GET /api/employee/groupBy?by=departmentId&_count=*&_sum=salary
Response: [
  { departmentId: 1, _count: { _all: 12 }, _sum: { salary: 600000 } },
  { departmentId: 2, _count: { _all: 8  }, _sum: { salary: 400000 } },
]

// Filters still apply
GET /api/employee/aggregate?_count=*&isActive=true

## Implementation Notes
- File: `src/router.ts`
- Detect "aggregate" and "groupBy" as special id values (like "bulk")
- Parse _count, _sum, _avg, _min, _max from query params
- _count=* → { _all: true }; _count=salary → { salary: true }
- Map to delegate.aggregate() and delegate.groupBy()
- Filters (where) still apply

## Open Design Questions
Please discuss before implementing:
1. Should aggregation be opt-in? (some may want to block analytics)
2. How to handle groupBy having/orderBy?
3. What guards apply? (GET guard or new AGGREGATE guard?)

## Acceptance Criteria
- [ ] /aggregate endpoint works
- [ ] /groupBy endpoint works
- [ ] where filters apply to aggregations
- [ ] Tests pass
- [ ] Design questions answered
```

---

## Issue #15

**Title:** `feat: query complexity scoring and limiting`

**Labels:** `advanced`, `enhancement`, `middleware`, `security`

**Body:**
```
## Summary
Score incoming queries based on complexity and reject those above a 
configurable threshold to protect against abusive queries.

## Motivation
A public API without query limits is a DoS vector. 
?include=posts,comments,tags,reactions&limit=1000 can take seconds 
and exhaust DB connections. Complexity scoring gives developers a 
principled way to limit this.

## Desired Behavior
omniRest(prisma, {
  complexity: {
    maxScore: 100,
    rules: {
      perInclude: 10,     // each ?include= relation: +10
      perFilter: 2,       // each filter param: +2
      perSort: 1,         // each sort field: +1
      perLimit100: 5,     // per 100 records in limit: +5
    }
  }
})

// GET /api/user?include=posts,comments,tags&limit=500&name=John&age_gte=18
// Score: 30 (includes) + 10 (limit) + 4 (filters) = 44 → allowed

// GET /api/user?include=posts,comments,tags,reactions,likes&limit=1000
// Score: 50 (includes) + 50 (limit) = 100 → exactly at limit, allowed

// Score over 100 → 
// 429 { error: "Query too complex", score: 115, maxScore: 100 }

## Implementation Notes
- Files: `src/middleware.ts`, `src/query-builder.ts`, `src/types.ts`
- Add `complexity?: ComplexityOptions` to PrismaRestOptions
- Score is computed AFTER buildQuery but BEFORE Prisma call
- Score calculation in a new scoreQuery(parsedQuery, rules) function
- Return 429 (not 400) — it's a capacity issue, not a client error

## Tests Needed
- Simple query stays under max
- Include-heavy query exceeds max
- Limit-heavy query exceeds max
- Combined query scores correctly
- Score returned in error response

## Acceptance Criteria
- [ ] Complexity scoring works
- [ ] 429 returned with score breakdown
- [ ] Default rules documented
- [ ] Tests pass
- [ ] README shows configuration example
```

---

## Issue #16

**Title:** `feat: Server-Sent Events (SSE) subscription endpoint`

**Labels:** `advanced`, `enhancement`, `real-time`, `needs design`

**Body:**
```
## Summary
Add a /subscribe endpoint that streams create/update/delete events 
to connected clients over Server-Sent Events.

## Motivation
Management system dashboards need live updates. Currently teams 
implement WebSockets from scratch. SSE is simpler, works over HTTP/1.1, 
and is perfect for one-way server→client data streams.

## Desired Behavior
GET /api/department/subscribe   (EventStream)

// Client receives events:
data: {"event":"create","model":"Department","record":{"id":5,"name":"Eng"}}
data: {"event":"update","model":"Department","record":{"id":5,"name":"Engineering"}}
data: {"event":"delete","model":"Department","id":5}

// Heartbeat every 30s to keep connection alive:
: heartbeat

## Implementation Notes
- New file: `src/subscriptions.ts`
- Add to Express adapter first, then others
- Use Prisma $on("query") events for detecting changes
- Polling fallback (interval-based findMany) for Prisma versions without events
- Connection lifecycle: client disconnect must stop polling/subscription
- Guards apply to subscribe endpoint (GET guard)
- Heartbeat interval: 30s default, configurable

## Open Design Questions (must discuss before implementing)
1. Which Prisma versions support $on?
2. How to scope events to a specific record? (subscribe to id=5 only)
3. Should event filtering by field values be supported?
4. How to handle multiple concurrent subscribers efficiently?
5. SSE is Express/Node only — Cloudflare Workers/Hono?

## Acceptance Criteria
- [ ] /model/subscribe opens SSE stream
- [ ] create/update/delete events stream to client
- [ ] Client disconnect stops the subscription
- [ ] Heartbeat keeps connection alive
- [ ] Guard applies to subscribe
- [ ] Tests pass (mock EventSource)
- [ ] Design questions answered in PR
```

---

## Issue #17

**Title:** `feat: auto-generated TypeScript client SDK (omni-rest-client sub-package)`

**Labels:** `advanced`, `new package`, `enhancement`, `needs design`

**Body:**
```
## Summary
A new sub-package `omni-rest-client` that generates a fully-typed 
TypeScript fetch client from the Prisma schema — so frontends get 
the same developer experience as tRPC or Prisma Client itself.

## Motivation
Using omni-rest on the backend but raw fetch() on the frontend loses 
all type safety. This package bridges that gap without requiring tRPC 
or GraphQL.

## Desired Behavior
// Install
npm install omni-rest-client

// Usage — fully typed from your Prisma schema
import { createClient } from "omni-rest-client";

const api = createClient<PrismaClient>("http://localhost:3000/api");

const { data, meta } = await api.department.findMany({
  where: { isActive: true },
  sort: "name:asc",
  page: 1,
  limit: 20,
});

const dept = await api.department.findById(5);
await api.department.create({ name: "Engineering" });
await api.department.update(5, { name: "Eng" });
await api.department.delete(5);

// TypeScript knows the shape of Department from PrismaClient generic!

## Implementation Notes
- New package in packages/omni-rest-client/ (monorepo)
- Uses the generic PrismaClient type parameter to infer model shapes
- Each model gets a ModelClient with: findMany, findById, create, update, delete
- Translates method options to URL params (where → ?field=value etc.)
- No code generation — pure TypeScript generics at compile time
- Works in browser and Node.js

## Open Design Questions
1. Monorepo or separate repo?
2. How to express complex where filters as TypeScript types?
3. Should it generate from OpenAPI spec or directly from Prisma types?

## Acceptance Criteria
- [ ] createClient<PrismaClient>(url) works
- [ ] All CRUD methods work
- [ ] TypeScript knows response types
- [ ] Pagination options typed
- [ ] Tests pass
- [ ] Published as separate npm package
```

---

## Issue #18

**Title:** `feat: plugin architecture for extending omni-rest`

**Labels:** `advanced`, `enhancement`, `needs design`, `breaking-potential`

**Body:**
```
## Summary
A formal plugin system that lets the community build and share 
omni-rest extensions — caching, audit logging, rate limiting, 
multi-tenancy — without forking the core.

## Motivation
Today customization requires using guards and hooks inline in config.
There is no way to package and share that customization. A plugin 
system unlocks a third-party ecosystem.

## Desired Behavior
import { auditLogPlugin } from "omni-rest-audit";
import { cachePlugin } from "omni-rest-cache";
import { rateLimitPlugin } from "omni-rest-rate-limit";

omniRest(prisma, {
  plugins: [
    auditLogPlugin({ storage: prisma, model: "AuditLog" }),
    cachePlugin({ ttl: 60, store: redisClient }),
    rateLimitPlugin({ max: 100, window: "1m" }),
  ]
})

## Plugin Interface
interface OmniRestPlugin {
  name: string;
  version?: string;

  // Lifecycle hooks (same as current options, but composable)
  beforeOperation?: HookFn;
  afterOperation?: HookFn;
  onError?: (error: any, ctx: HookContext) => HandlerResult | null;

  // Transforms (new)
  transformRequest?: (body: any, ctx: HookContext) => any;
  transformResponse?: (data: any, ctx: HookContext) => any;

  // Query modification (new)
  extendWhere?: (where: any, ctx: HookContext) => any;  // multi-tenancy!
}

## Example: Multi-tenancy via extendWhere
const tenantPlugin = (getTenantId) => ({
  name: "tenant",
  extendWhere: (where, { req }) => ({
    ...where,
    tenantId: getTenantId(req),  // automatically scopes ALL queries
  })
});

## Open Design Questions (RFC required before implementation)
1. Plugin execution order (array order? priority field?)
2. Can plugins add new routes?
3. How to handle plugin conflicts (two plugins modify same thing)?
4. Should plugins be able to add new options to PrismaRestOptions?
5. Error in plugin — fail open or fail closed?

## Acceptance Criteria
- [ ] plugins array accepted in options
- [ ] All lifecycle hooks called in order
- [ ] transformResponse applied to all responses
- [ ] extendWhere applied to all queries (multi-tenancy use case works)
- [ ] Plugin error handling documented
- [ ] Tests pass
- [ ] RFC discussion completed before merge
- [ ] Example plugin written in docs/
```

---

---

## Quick Reference — Issue Raise Schedule

| When | Raise These |
|---|---|
| **Day of v0.1.0 publish** | #1 (search), #2 (soft delete), #3 (?fields alias) |
| **Week 2** | #4 (count sort), #5 (envelope), #12 (error handler) |
| **Month 1 — planning v0.2.0** | #6 (nested filter), #7 (bulk ops), #8 (field permissions), #9 (rate limit hook) |
| **Month 2 — planning v0.3.0** | #10 (Hono), #11 (Koa) |
| **Month 3 — growing adoption** | #13 (cursor pagination), #14 (aggregation), #15 (complexity) |
| **Month 6 — v1.0.0 milestone** | #16 (SSE), #17 (client SDK), #18 (plugin system) |