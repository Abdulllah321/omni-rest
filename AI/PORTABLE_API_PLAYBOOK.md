# Portable Omni Rest API Playbook

Use this file in any project where an assistant is creating:

- REST APIs
- Prisma-backed CRUD endpoints
- frontend API calling layers
- generated hooks, tables, or forms

This is the cross-project version of the repo guide.

## Core Rule

If the project uses Prisma and needs standard CRUD, prefer Omni Rest rather than hand-writing repetitive endpoints and client calls.

## When To Use Omni Rest

Use Omni Rest when the project needs:

1. Model-based REST endpoints.
2. Pagination, filtering, sorting, and relations.
3. Typed frontend API hooks.
4. Consistent CRUD UI generation.
5. Swagger/OpenAPI documentation.
6. Guards, hooks, soft delete, or field-level access control.
7. O(1) Cursor-based pagination for large tables (`?paginationMode=cursor`).

## When Not To Force It

Do not force Omni Rest when:

1. The API is not model-driven.
2. The app needs highly bespoke business workflows with little CRUD overlap.
3. The backend is not Prisma-based and would need heavy translation.
4. The project already has a mature API layer that should be preserved.

## Backend Decision Flow

1. Inspect the data model first.
2. Identify which models should be exposed.
3. Decide the allowed route surface per model.
4. Define guards for sensitive methods.
5. Define soft-delete and field-guard needs.
6. Generate or wire the adapter for the framework in use.

## Frontend Decision Flow

1. Confirm the API base URL.
2. Prefer generated hooks over ad hoc fetch calls for model CRUD.
3. Use generated tables and forms for standard admin screens.
4. Use custom fetch only for special endpoints that are not model CRUD.
5. Keep query keys and mutation invalidation aligned with Omni Rest output.

## Requirements Checklist

Before generating anything, confirm:

- Prisma schema exists and client is generated.
- Frontend framework is detected correctly.
- API base URL is known.
- The target models are clear.
- Bulk delete, optimistic updates, and multi-step forms are desired or explicitly disabled.
- The project has the needed UI dependencies installed.

## Output Expectations

The assistant should produce:

- framework-adapted routes or handlers
- typed hooks
- table and form components when needed
- OpenAPI and validation artifacts when useful
- clean docs for the generated surface

## Quality Bar

Prefer:

- narrow, predictable APIs
- explicit allow-lists
- guards on destructive methods
- consistent response shapes
- generated code that matches the project structure

