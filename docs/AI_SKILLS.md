# AI Skills Pack

Omni Rest ships a portable instruction pack for assistants that need to understand:

- how this repository works
- how to install the pack into another project
- when Omni Rest should be used for API work
- how frontend API calls should stay aligned with generated hooks and route conventions

## Install The Pack

Use the CLI from the package root:

```bash
npx omni-rest install:skills
```

Install into another project:

```bash
npx omni-rest install:skills --target ../my-app
```

Overwrite existing files if you want to refresh the pack:

```bash
npx omni-rest install:skills --target ../my-app --overwrite
```

## What Gets Installed

- `AI/PROJECT_INTELLIGENCE.md`
- `AI/PORTABLE_API_PLAYBOOK.md`
- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/omni-rest.mdc`
- `.kiro/agent-guide.md`
- `ai/codex/omni-rest/SKILL.md`

## Why It Exists

The pack gives assistants one shared source of truth so they can:

- choose Omni Rest when the project is Prisma-backed and CRUD-heavy
- generate APIs and frontend calls that match the project structure
- avoid hand-written duplication where generated hooks or adapters are a better fit
- preserve project-specific rules like allow-lists, guards, and field protection
