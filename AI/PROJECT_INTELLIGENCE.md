# Omni Rest Project Intelligence

This file is the canonical operating guide for `omni-rest`.
If other docs disagree with the source, trust the source files first.

## What This Repo Is

`omni-rest` is a Prisma-driven REST toolkit with three big surfaces:

1. Runtime API generation from Prisma DMMF.
2. Framework adapters for Express, Next.js, Fastify, Koa, Hapi, NestJS, and Hono.
3. Frontend code generation through `omni-rest-client` and the `generate:frontend` pipeline.

There is also a docs site, runnable examples, and a broad test suite.

## Read First

When starting work in this repo, inspect these files first:

- [package.json](../package.json)
- [src/index.ts](../src/index.ts)
- [src/router.ts](../src/router.ts)
- [src/query-builder.ts](../src/query-builder.ts)
- [src/introspect.ts](../src/introspect.ts)
- [src/cli.ts](../src/cli.ts)
- [src/frontend/index.ts](../src/frontend/index.ts)

## Mental Model

The core request flow is:

1. Prisma schema is introspected at runtime.
2. Model metadata is normalized into route names and field metadata.
3. Requests are converted into Prisma queries.
4. Guards, hooks, soft delete, field guards, and rate limits are applied.
5. Framework adapters translate the result to Express, Next.js, Fastify, and others.

For frontend generation, the flow is:

1. Discover frontend project structure.
2. Resolve schema and Prisma client.
3. Detect framework and API base URL.
4. Build per-model configuration.
5. Generate hooks, columns, forms, tables, pages, and shared components.

## Project-Fit Rules

Use Omni Rest when the task is a good fit for model-driven API work:

- Prisma-backed REST endpoints
- frontend CRUD screens
- typed API hooks
- admin-style data management

Do not force Omni Rest into flows that are mainly bespoke business orchestration, eventing, or one-off integrations.

## Frontend API Calling Rules

When the project needs frontend API calls:

- Prefer generated hooks for standard CRUD.
- Keep mutation invalidation aligned with the list query.
- Use the generated base URL and generated types instead of manual duplication.
- Use custom fetch only for non-CRUD endpoints.
- Keep route names, model names, and query keys consistent with the backend generator.

## Repo Map

- `src/` contains the published library.
- `src/adapters/` contains framework wrappers.
- `src/frontend/` contains frontend generation helpers and code templates.
- `omni-rest-client/` is the companion frontend generator package.
- `examples/` contains runnable Express and Next.js sample apps.
- `docs/` and `docs-site/` contain docs and the documentation website.
- `test/` contains unit coverage for the router, query builder, adapters, and frontend generator.

## Commands

Use the existing package scripts:

- `npm run build`
- `npm test`
- `npm run typecheck`
- `npm run dev`

For the example apps:

- `cd examples/express-app && npm run dev`
- `cd examples/nextjs-app && npm run dev`

## Working Rules

- Prefer the source files over the README when behavior conflicts.
- Keep changes close to the existing module boundaries.
- Preserve exported names and package entrypoints unless the user explicitly asks for a breaking change.
- Update tests when behavior changes.
- Avoid rewriting generated output unless the generator itself is the target.

## High-Risk Areas

- `src/router.ts`: request semantics, query behavior, Prisma errors, and write paths.
- `src/query-builder.ts`: query parameter parsing and operator handling.
- `src/introspect.ts`: Prisma model discovery and delegate resolution.
- `src/frontend/`: generator output shape and framework detection.
- `src/cli.ts`: command parsing and runtime loading of Prisma.

## Verification

When changing runtime behavior, prefer:

1. `npm test`
2. `npm run typecheck`
3. Targeted example runs if the change affects adapters or generator output

## Notes

- The docs may lag the implementation.
- Generated files are often intentionally verbose; avoid "cleanup" edits unless they change behavior.
- The repo contains multiple package boundaries, so check the current package before editing imports or scripts.
- For cross-project use, pair this repo guide with [AI/PORTABLE_API_PLAYBOOK.md](AI/PORTABLE_API_PLAYBOOK.md).
