# Omni Rest Agent Guide

Read [AI/PROJECT_INTELLIGENCE.md](AI/PROJECT_INTELLIGENCE.md) before making changes.
Read [AI/PORTABLE_API_PLAYBOOK.md](AI/PORTABLE_API_PLAYBOOK.md) for cross-project API work.

## Operating Rules

- Trust source files over narrative docs when they conflict.
- Keep edits scoped to the requested change.
- Preserve public exports and package entrypoints unless a breaking change is requested.
- Run or update tests when behavior changes.
- Do not overwrite user changes outside the task.

## Useful Files

- [package.json](package.json)
- [src/router.ts](src/router.ts)
- [src/query-builder.ts](src/query-builder.ts)
- [src/introspect.ts](src/introspect.ts)
- [src/cli.ts](src/cli.ts)
- [src/frontend/index.ts](src/frontend/index.ts)

## Common Checks

- `npm test`
- `npm run typecheck`
- `npm run build`
