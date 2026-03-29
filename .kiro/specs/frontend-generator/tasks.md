# Implementation Plan: frontend-generator

## Overview

Implement the `generate:frontend` CLI command as a new module tree under `src/frontend/`, orchestrated by `src/frontend-generator.ts` and wired into the existing `src/cli.ts`. Each stage is a pure function or thin async wrapper, making every piece independently testable.

## Tasks

- [x] 1. Scaffold module structure and shared types
  - Create `src/frontend/` directory with empty index barrel
  - Define `GeneratorConfig`, `ModelConfig`, `FileResult`, and `CandidateFrontend` interfaces in `src/frontend/types.ts`
  - _Requirements: 1.1, 5.3, 5.4, 5.5_

- [x] 2. Implement schema discovery (`src/frontend/schema.ts`)
  - [x] 2.1 Implement `findSchema(startDir, explicitPath?)` — walks up from `startDir` until `schema.prisma` is found or root is reached; returns explicit path immediately when provided
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [ ]* 2.2 Write property test for `findSchema` — Property 1: nearest ancestor found; Property 2: explicit path bypasses traversal
    - **Property 1: Schema discovery finds nearest ancestor**
    - **Property 2: --schema flag bypasses traversal**
    - **Validates: Requirements 2.1, 2.4**
  - [x] 2.3 Implement `loadDMMF(prismaClientPath)` — loads `@prisma/client` from user's `node_modules`, returns model list via `getModels`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]* 2.4 Write property test for `loadDMMF` — Property 6: DMMF enumeration is complete
    - **Property 6: DMMF enumeration is complete**
    - **Validates: Requirements 5.3, 5.4, 5.5**

- [x] 3. Implement frontend directory scanning (`src/frontend/scan.ts`)
  - [x] 3.1 Implement `scoreCandidates(dir)` — walks up to 3 levels deep, excludes `node_modules/.git/dist/build/.next/out`, scores each candidate per the scoring table, returns `CandidateFrontend[]` sorted descending
    - _Requirements: 18.3, 18.4, 18.5, 18.6, 18.7_
  - [ ]* 3.2 Write property test for `scanForFrontendDir` — Property 20: candidate scoring is consistent with criteria
    - **Property 20: Candidate frontend scoring is consistent with criteria**
    - **Validates: Requirements 18.3, 18.5, 18.6**

- [x] 4. Implement framework detection and env resolution (`src/frontend/detect.ts`)
  - [x] 4.1 Implement `detectFramework(frontendDir)` — checks for `next.config.*`, `vite.config.*`, then `package.json` react dep; returns `"nextjs" | "vite-react" | "react"`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 4.2 Write property test for `detectFramework` — Property 3: framework detection is deterministic from directory contents
    - **Property 3: Framework detection is deterministic from directory contents**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  - [x] 4.3 Implement `resolveBaseUrl(frontendDir)` — reads `.env.local` then `.env`, returns first matching `NEXT_PUBLIC_API_URL` / `VITE_API_URL`, defaults to `"/api"`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 4.4 Write property test for `resolveBaseUrl` — Property 5: base URL resolution follows priority order
    - **Property 5: Base URL resolution follows priority order**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  - [x] 4.5 Implement `resolveOutputDir(frontendDir, framework, outFlag?)` — applies the three-rule precedence: flag → `app/` for nextjs → `src/`
    - _Requirements: 13.1, 13.2, 13.3_
  - [ ]* 4.6 Write property test for `resolveOutputDir` — Property 16: output directory resolution follows flag and framework rules
    - **Property 16: Output directory resolution follows flag and framework rules**
    - **Validates: Requirements 13.1, 13.2, 13.3**

- [x] 5. Implement dependency checking (`src/frontend/deps.ts`)
  - [x] 5.1 Implement `checkDependencies(frontendDir, framework)` — reads `package.json`, returns list of missing required packages
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  - [ ]* 5.2 Write property test for `checkDependencies` — Property 17: dependency check identifies exactly the missing packages
    - **Property 17: Dependency check identifies exactly the missing packages**
    - **Validates: Requirements 14.1, 14.4, 14.5**

- [x] 6. Implement interactive and autopilot config building (`src/frontend/prompt.ts`)
  - [x] 6.1 Implement `buildConfig(models, flags)` — in autopilot mode returns defaults (all fields, bulk delete, export, multi-step when >6 fields); in interactive mode prompts per-model using `readline`/`@inquirer/prompts` or similar
    - _Requirements: 6.1–6.8, 7.1–7.7_
  - [x] 6.2 Implement `shouldUseMultiStep(fieldCount, stepsFlag)` — pure function returning boolean per the three-rule logic
    - _Requirements: 16.1, 16.2, 16.3_
  - [ ]* 6.3 Write property test for `shouldUseMultiStep` — Property 18: multi-step decision follows flag and field count
    - **Property 18: Multi-step decision follows flag and field count**
    - **Validates: Requirements 16.1, 16.2, 16.3**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement codegen utilities (`src/frontend/codegen/utils.ts`)
  - [x] 8.1 Implement `camelToTitle(name)` — converts camelCase to Title Case with spaces
    - _Requirements: 9.4_
  - [ ]* 8.2 Write property test for `camelToTitle` — Property 11: camelCase field names produce Title Case headers
    - **Property 11: camelCase field names produce Title Case headers**
    - **Validates: Requirements 9.4**
  - [x] 8.3 Implement `fieldTypeMap(field)` — maps DMMF field to FormGenerator field type string
    - _Requirements: 11.5_
  - [ ]* 8.4 Write property test for `fieldTypeMap` — Property 13: DMMF field type maps to a valid FormGenerator field type
    - **Property 13: DMMF field type maps to a valid FormGenerator field type**
    - **Validates: Requirements 11.5**
  - [x] 8.5 Implement `chunkFields(fields, maxPerStep)` — splits field list into steps of at most `maxPerStep`
    - _Requirements: 16.4_
  - [ ]* 8.6 Write property test for `chunkFields` — Property 19: field distribution respects maximum step size
    - **Property 19: Field distribution respects maximum step size**
    - **Validates: Requirements 16.4**

- [x] 9. Implement hook file codegen (`src/frontend/codegen/hook.ts`)
  - [x] 9.1 Implement `generateHookFile(config, modelConfig)` — returns TypeScript string with all six (or seven with bulk) exported hooks, optimistic update callbacks when enabled, correct `staleTime`/`gcTime`, imports from `@prisma/client`
    - _Requirements: 8.1–8.10, 17.2_
  - [ ]* 9.2 Write property test for hook exports — Property 9: hook file exports all required functions
    - **Property 9: Hook file exports all required functions**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**
  - [ ]* 9.3 Write property test for optimistic callbacks — Property 10: optimistic update callbacks are present when enabled
    - **Property 10: Optimistic update callbacks are present when enabled**
    - **Validates: Requirements 8.8**
  - [ ]* 9.4 Write property test for import sources — Property 21 (hook side): types imported from `@prisma/client`
    - **Property 21: Generated files import from canonical sources**
    - **Validates: Requirements 17.2**

- [x] 10. Implement columns file codegen (`src/frontend/codegen/columns.ts`)
  - [x] 10.1 Implement `generateColumnsFile(config, modelConfig)` — returns TypeScript string with `ColumnDef<[Model]>[]`, one entry per selected field plus `actions` column
    - _Requirements: 9.1–9.5_
  - [ ]* 10.2 Write property test for columns count — Property 12: columns file contains one column per selected field
    - **Property 12: Columns file contains one column per selected field**
    - **Validates: Requirements 9.2, 9.3, 9.5**

- [x] 11. Implement table file codegen (`src/frontend/codegen/table.ts`)
  - [x] 11.1 Implement `generateTableFile(config, modelConfig)` — returns TSX string importing `DataTable`, columns, and hooks; adds `'use client'` when framework is `nextjs`
    - _Requirements: 10.1–10.8, 3.5, 3.7_
  - [ ]* 11.2 Write property test for `'use client'` directive — Property 4: directive matches framework
    - **Property 4: 'use client' directive matches framework**
    - **Validates: Requirements 3.5, 3.7**

- [x] 12. Implement form file codegen (`src/frontend/codegen/form.ts`)
  - [x] 12.1 Implement `generateFormFile(config, modelConfig)` — returns TSX string importing `FormGenerator`, Zod schema from `src/schemas.generated.ts`, hooks; builds `fields` array; adds multi-step `steps` prop when enabled; adds `'use client'` for nextjs
    - _Requirements: 11.1–11.8, 17.1_
  - [ ]* 12.2 Write property test for form fields count — Property 14: form file contains one field entry per selected field
    - **Property 14: Form file contains one field entry per selected field**
    - **Validates: Requirements 11.5, 11.6**
  - [ ]* 12.3 Write property test for import sources — Property 21 (form side): Zod schemas imported from `src/schemas.generated.ts`
    - **Property 21: Generated files import from canonical sources**
    - **Validates: Requirements 17.1**

- [x] 13. Implement file output and base component copying (`src/frontend/output.ts`)
  - [x] 13.1 Implement `writeFile(destPath, content)` — creates intermediate dirs, writes file, returns `FileResult` with `"created"` or `"overwritten"` status
    - _Requirements: 13.4, 13.5, 15.1, 15.3_
  - [x] 13.2 Implement `copyBaseComponents(outputDir, packageRoot)` — copies `data-table.tsx` and `form-generator.tsx` from `frontend-next/`; skips and reports when destination already exists
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - [ ]* 13.3 Write property test for copy idempotence — Property 15: base component copy is idempotent
    - **Property 15: Base component copy is idempotent**
    - **Validates: Requirements 12.3**
  - [x] 13.4 Implement `printSummary(results)` — prints per-file status lines with colour indicators and a final count summary
    - _Requirements: 15.1, 15.2, 15.4_

- [x] 14. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement `generateAll` orchestrator (`src/frontend-generator.ts`)
  - [x] 15.1 Implement `generateAll(config)` — iterates `config.models`, calls all four codegen functions per model, calls `copyBaseComponents`, collects `FileResult[]`, calls `printSummary`
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 15.1, 15.2_
  - [ ]* 15.2 Write property test for `--models` filter — Property 7: filter restricts generation output
    - **Property 7: --models filter restricts generation output**
    - **Validates: Requirements 5.6, 7.2**
  - [ ]* 15.3 Write property test for autopilot field inclusion — Property 8: autopilot includes all fields
    - **Property 8: Autopilot includes all fields**
    - **Validates: Requirements 7.3, 7.4**
  - [x] 15.4 Implement `run(argv)` — top-level async entry point: parses flags, calls scan/detect/schema/deps/prompt pipeline, calls `generateAll`
    - _Requirements: 1.1, 2.4, 2.5, 18.1, 18.2, 18.8–18.16_

- [x] 16. Wire `generate:frontend` into `src/cli.ts`
  - Add `generate:frontend` branch to the command dispatcher in `src/cli.ts`
  - Add `generate:frontend` to the help/usage text printed for unknown commands and `--help`
  - Add `COLORS.yellow` helper for non-fatal warnings
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 17. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check` (install: `npm install --save-dev fast-check`)
- Each property test references the design document property number and the requirement clause it validates
- Checkpoints ensure incremental validation before wiring stages together
