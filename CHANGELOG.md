# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2026-03-31

### Added
- **`?search=` global search** — new query parameter that performs a case-insensitive OR search across all `String` fields of a model
  ```
  GET /api/department?search=eng
  → WHERE name LIKE '%eng%' OR code LIKE '%eng%' OR description LIKE '%eng%'
  ```
  - Graceful no-op when the model has no `String` fields
  - Composes with all other filters (`?search=eng&isActive=true`)
- **`?fields=` alias for `?select=`** — both params now produce identical field selection; `?select=` takes precedence when both are provided

### Changed
- `buildQuery` now accepts an optional `modelFields?: FieldMeta[]` parameter to enable search field introspection
- `router.ts` passes `meta.fields` into `buildQuery` automatically

## [0.4.0] - 2026-03-29

### Added
- **`omni-rest-client` package** — standalone frontend code generator with zero Prisma dependency
  - New `npx omni-rest-client generate:frontend` CLI reads `omni-rest.config.json` and generates all frontend code without needing Prisma, `schema.prisma`, or a DB connection
  - Ships its own `base-components/` (data-table, form-generator) so it's fully self-contained
- **`generate:config` command** — new backend CLI command that serializes Prisma DMMF + Zod schemas into a portable `omni-rest.config.json` file
  ```bash
  npx omni-rest generate:config
  ```
- **`generateConfig()` API** — exported from `omni-rest` for programmatic use
- **Generic hook types** — generated hooks no longer import from `@prisma/client`; use `Record<string, any>` instead, making them usable in any project without Prisma installed
- **Zod schemas embedded in config** — `omni-rest.config.json` includes the full `schemas.generated.ts` source; the client CLI writes it automatically so the frontend never needs to run `npx omni-rest generate`

### Changed
- **Frontend generation is now a two-package workflow** — backend generates config, client generates UI (both CLIs stay lightweight)
- `generate:frontend` in the backend CLI is now marked legacy; prefer the new split workflow

### Architecture
```
Backend (omni-rest)                    Client (omni-rest-client)
─────────────────────────────          ──────────────────────────────────
npx omni-rest generate:config    →     npx omni-rest-client generate:frontend
  writes omni-rest.config.json           reads omni-rest.config.json
  (models + zod schemas)                 writes hooks, components, pages
  No frontend knowledge needed           No Prisma knowledge needed
```

## [0.3.2] - 2026-03-29

### Added
- **QueryClientProvider setup** — Auto-generates `components/providers.tsx` for Next.js App Router projects with proper React Query configuration

### Fixed
- **Component placement** — Components, hooks, and lib files now generate in root directory (or `src/`) for Next.js App Router projects, not inside `app/` directory
- **Import paths** — Fixed generated component imports to use correct relative paths (`../../hooks/` instead of `../hooks/`)
- **DataTable import** — Changed from named import to default import (`import DataTable from "../data-table"`)
- **Schema imports** — Updated to use `${Model}CreateSchema` instead of `${Model}Schema` in generated forms
- **Test suite** — Updated all tests to match the actual directory structure and behavior

## [0.3.1] - 2026-03-28

### Fixed
- **Next.js middleware conflict** — Renamed `src/middleware.ts` to `src/middleware-helpers.ts` to prevent Next.js from detecting it as a middleware file when workspace root is incorrectly inferred

## [0.3.0] - 2026-03-28

### Added
- **`generate:frontend` command** — scaffolds a complete React data layer from your Prisma schema
  - TanStack Query hooks (`useUsers`, `useUser`, `useCreateUser`, `useUpdateUser`, `useDeleteUser`, `useBulkDeleteUsers`) with optimistic updates
  - TanStack Table column definitions typed as `ColumnDef<Model>[]` with camelCase → Title Case headers
  - DataTable wrapper components wired to hooks, bulk delete, and CSV/JSON export
  - FormGenerator wrapper components with Zod validation and relational searchable-select dropdowns
  - Shared `DataTable` and `FormGenerator` base components copied into the user's project once
- **Auto-detection** — framework (`nextjs` / `vite-react` / `react`), frontend directory (scored candidate scanning), and API base URL (`.env.local` / `.env`)
- **Interactive mode** — per-model prompts for field selection, relations, bulk delete, export, and multi-step forms
- **Autopilot mode** (`--autopilot`) — no prompts, all models, sensible defaults; CI-friendly
- **Multi-step forms** — auto-enabled when a model has >6 fields; configurable via `--steps auto|always|never`
- **Dependency validation** — warns about missing `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `zod`, `@hookform/resolvers` before writing files
- **Idempotent output** — re-running regenerates hooks and columns; base components are skipped if already present
- **Colour-coded summary** — ✓ created, ⚠ overwritten, ℹ skipped, ✗ error per file
- **Next.js App Router support** — generates pages in `app/(route-group)/[model]/page.tsx` with route groups
- **Menu data generation** — creates `lib/menu-data.ts` with TypeScript interfaces for sidebar navigation
- `frontend-next/` base components now included in the published package

### Flags added
`--schema`, `--frontend-dir`, `--out`, `--models`, `--autopilot`, `--no-bulk`, `--no-optimistic`, `--no-pages`, `--no-menu`, `--route-group`, `--stale-time`, `--gc-time`, `--steps`

## [0.2.0] - 2025-10-15

### Added
- **Bulk Operations** - Added `PATCH /api/:model/bulk/update` and `DELETE /api/:model/bulk/delete` endpoints
- **Bulk Update** - Update multiple records in a single request with array of updates
- **Bulk Delete** - Delete multiple records by ID array
- **OpenAPI Documentation** - Added bulk operation endpoint documentation to OpenAPI specs
- **Configuration Guide** - Comprehensive docs for guards, hooks, and pagination settings
- **Contributing Guide** - Guidelines for contributors including development setup
- **QUICKSTART Guide** - 5-minute getting started guide

### Changed
- **DMMF Introspection** - Updated to work with Prisma v5 `_runtimeDataModel` property
- **Router Signature** - Added `operation?: string` parameter to support bulk operations
- **Express Adapter** - Enhanced to handle bulk operation routes efficiently

### Fixed
- Fixed DMMF model introspection for Prisma v5 compatibility
- Fixed TypeScript type definitions for extended router signature

### Improved
- Better error messages for validation failures
- Enhanced OpenAPI spec generation with request/response examples
- Improved documentation structure with separate guides

## [0.1.0] - 2025-12-10

### Added
- Initial release of omni-rest
- **Auto-generated CRUD APIs** - Automatically generate REST endpoints from Prisma schema
- **Multiple Framework Support** - Express.js, Next.js App Router, and Fastify adapters
- **Advanced Queries** - Filtering, sorting, and pagination with query parameters
- **Authorization Guards** - Control access per model and operation
- **Audit Hooks** - Before/after operation hooks for logging and side effects
- **OpenAPI Documentation** - Auto-generated Swagger UI endpoint documentation
- **Type Safety** - Full TypeScript support with generated types
- **CLI Tools** - Command-line utilities for schema introspection and validation
- **Query Builder** - Sophisticated query parameter parsing for complex filters
- **Comprehensive Examples** - Express and Next.js example applications with Prisma
- **MIT License** - Open source with permissive licensing

### Features
- 8 endpoints per model: LIST, CREATE, READ, UPDATE, PATCH, DELETE, BULK_UPDATE, BULK_DELETE
- Filter operators: eq, ne, lt, lte, gt, gte, in, nin, contains, startsWith, endsWith
- Pagination with limit and offset
- Model allow-listing for security
- Request/response validation with Zod
- Built-in Swagger UI for API exploration

---

## Unreleased

### Planned
- GraphQL schema export
- Real-time subscriptions via WebSocket
- Webhook event system
- Rate limiting middleware
- Additional framework support (Koa, Nest.js, Hapi)
- Built-in caching layer (Redis support)
- API versioning system
- Database migration helpers
- Role-based access control (RBAC)
