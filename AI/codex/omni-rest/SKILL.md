---
name: omni-rest-repo-guide
description: Repository-specific operating guide for omni-rest. Use when Codex is working in this repo or needs the project architecture, command flow, test map, or generator conventions. Also use when preparing portable instructions for other IDE agents.
---

# Omni Rest Repo Guide

Read [AI/PROJECT_INTELLIGENCE.md](../../../AI/PROJECT_INTELLIGENCE.md) first.
For cross-project API work, also read [AI/PORTABLE_API_PLAYBOOK.md](../../../AI/PORTABLE_API_PLAYBOOK.md).

## Use This Skill For

- Understanding the runtime router and Prisma integration.
- Editing adapters, generators, CLI behavior, or tests.
- Explaining the repo structure to another agent.
- Preparing portable instructions for other tools.

## Working Order

1. Inspect the canonical project guide.
2. Inspect the relevant source module.
3. Make the smallest change that fits the request.
4. Verify with targeted tests or typecheck if behavior changed.

## Important Boundaries

- `src/router.ts` owns request handling.
- `src/query-builder.ts` owns query parsing.
- `src/introspect.ts` owns model discovery and delegates.
- `src/frontend/` owns frontend generation.
- `omni-rest-client/` is a separate package boundary.

## Source Of Truth

- Prefer code over README text.
- Preserve existing exports and generated output shapes.
- Do not rename package entrypoints without a specific request.
