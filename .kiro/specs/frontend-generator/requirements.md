# Requirements Document

## Introduction

The `generate:frontend` command extends the omni-rest CLI to scaffold a production-ready frontend for every Prisma model in a user's project. Given a Prisma schema, the command generates TanStack Query hooks, DataTable components, FormGenerator components, and TanStack Table column definitions — all wired together and ready to drop into a Next.js or Vite/React application. The generator supports two modes: Interactive (guided prompts per model) and Autopilot (no prompts, sensible defaults). It auto-detects the target framework, resolves the API base URL from environment files, and copies the shared `DataTable` and `FormGenerator` base components into the user's project.

---

## Glossary

- **CLI**: The omni-rest command-line tool (`src/cli.ts`) invoked via `npx omni-rest`.
- **Generator**: The `generate:frontend` sub-command and all logic it orchestrates.
- **Prisma_Schema**: The `schema.prisma` file that defines the user's data models.
- **DMMF**: Prisma's Data Model Meta Format — the runtime introspection object used to enumerate models and fields.
- **Model**: A single Prisma model (e.g. `User`, `Post`) as returned by DMMF introspection.
- **Scalar_Field**: A non-relational field on a Model (e.g. `String`, `Int`, `Boolean`, `DateTime`).
- **Relational_Field**: A field whose `kind` is `"object"` in DMMF, representing a `@relation` foreign key or relation.
- **Hook_File**: The generated `use[Model].ts` file containing TanStack Query hooks for a Model.
- **Table_File**: The generated `[Model]Table.tsx` file containing the DataTable component for a Model.
- **Form_File**: The generated `[Model]Form.tsx` file containing the FormGenerator component for a Model.
- **Columns_File**: The generated `[Model]Columns.tsx` file containing TanStack Table column definitions for a Model.
- **Base_Components**: The `DataTable` and `FormGenerator` source files located in `frontend-next/` within the omni-rest package, copied into the user's project once.
- **Framework**: The frontend framework detected in the user's project — one of `nextjs`, `vite-react`, or `react`.
- **Interactive_Mode**: Generator mode where the CLI prompts the user for per-model configuration choices.
- **Autopilot_Mode**: Generator mode activated by `--autopilot` where all prompts are skipped and defaults are applied.
- **Output_Dir**: The directory into which generated files are written, defaulting to `src/` and overridable via `--out`.
- **Base_URL**: The API base URL read from environment files or defaulting to `/api`.
- **staleTime**: TanStack Query cache freshness duration in milliseconds.
- **gcTime**: TanStack Query garbage-collection duration in milliseconds.
- **Multi_Step_Form**: A FormGenerator form split into multiple wizard steps, auto-enabled when a Model has more than 6 fields.
- **Searchable_Select**: A combobox-style dropdown that fetches and filters related model records, used for Relational_Fields in forms.
- **Optimistic_Update**: A TanStack Query pattern where the UI is updated immediately before the server confirms the mutation.
- **Frontend_Dir**: The resolved directory of the user's frontend project, used as the root for framework detection, env file reading, dependency checking, and output directory resolution.
- **Candidate_Frontend**: A directory identified during scanning as a potential frontend project, either by the presence of a framework config file or a `package.json` that lists `react` as a dependency.

---

## Requirements

### Requirement 1: CLI Command Registration

**User Story:** As a developer, I want a `generate:frontend` command available in the omni-rest CLI, so that I can scaffold frontend components without leaving my terminal.

#### Acceptance Criteria

1. THE CLI SHALL register `generate:frontend` as a valid command alongside the existing `generate`, `generate:zod`, and `generate:openapi` commands.
2. WHEN the user runs `npx omni-rest generate:frontend --help`, THE CLI SHALL print a usage summary listing all supported flags and their defaults.
3. WHEN the user runs `npx omni-rest` with an unrecognised command, THE CLI SHALL print the usage summary that includes `generate:frontend`.

---

### Requirement 2: Prisma Schema Discovery

**User Story:** As a developer, I want the generator to find my `schema.prisma` automatically, so that I don't have to specify its path in simple projects.

#### Acceptance Criteria

1. WHEN `--schema <path>` is not provided, THE Generator SHALL walk up the directory tree from the current working directory until it finds a file named `schema.prisma` or reaches the filesystem root.
2. WHEN a `schema.prisma` file is found, THE Generator SHALL use that file's directory as the Prisma project root for DMMF introspection.
3. IF no `schema.prisma` file is found after traversing to the filesystem root, THEN THE Generator SHALL print a descriptive error message and exit with a non-zero code.
4. WHEN `--schema <path>` is provided, THE Generator SHALL use the specified path and SHALL NOT perform directory traversal.
5. IF the path supplied via `--schema` does not exist or is not readable, THEN THE Generator SHALL print a descriptive error message and exit with a non-zero code.

---

### Requirement 3: Framework Detection

**User Story:** As a developer, I want the generator to detect my frontend framework automatically, so that generated files use the correct imports and directives without manual configuration.

#### Acceptance Criteria

1. WHEN `next.config.js` or `next.config.ts` is present in `Frontend_Dir`, THE Generator SHALL set Framework to `nextjs`.
2. WHEN `vite.config.ts` or `vite.config.js` is present in `Frontend_Dir` and no Next.js config is found, THE Generator SHALL set Framework to `vite-react`.
3. WHEN neither Next.js nor Vite config files are found in `Frontend_Dir` but `react` is listed as a dependency in `Frontend_Dir/package.json`, THE Generator SHALL set Framework to `react`.
4. IF Framework cannot be determined from any of the above checks, THEN THE Generator SHALL print a warning and default Framework to `react`.
5. WHEN Framework is `nextjs`, THE Generator SHALL prepend `'use client'` to every generated `.tsx` file.
6. WHEN Framework is `nextjs`, THE Generator SHALL use `next/link` for navigation links in generated components.
7. WHEN Framework is `vite-react` or `react`, THE Generator SHALL NOT include `'use client'` directives in generated files.
8. WHEN Framework is `vite-react`, THE Generator SHALL use `react-router-dom` `Link` for navigation links in generated components.

---

### Requirement 4: API Base URL Resolution

**User Story:** As a developer, I want the generator to read my API base URL from environment files, so that generated hooks point to the correct endpoint without manual editing.

#### Acceptance Criteria

1. WHEN `Frontend_Dir/.env.local` exists and contains `NEXT_PUBLIC_API_URL`, THE Generator SHALL use that value as Base_URL.
2. WHEN `Frontend_Dir/.env.local` is absent or does not contain `NEXT_PUBLIC_API_URL`, THE Generator SHALL check `Frontend_Dir/.env` for `NEXT_PUBLIC_API_URL` or `VITE_API_URL`.
3. IF no matching environment variable is found in any checked file, THEN THE Generator SHALL use `/api` as Base_URL.
4. THE Generator SHALL NOT modify any environment file during generation.

---

### Requirement 5: Model Introspection

**User Story:** As a developer, I want the generator to enumerate all models and their fields from my Prisma schema, so that generated files accurately reflect my data model.

#### Acceptance Criteria

1. THE Generator SHALL load the user's `@prisma/client` from the project's `node_modules` to obtain the DMMF.
2. IF `@prisma/client` cannot be loaded, THEN THE Generator SHALL print an error instructing the user to run `npx prisma generate` and exit with a non-zero code.
3. THE Generator SHALL enumerate all Models defined in the DMMF, including their Scalar_Fields and Relational_Fields.
4. THE Generator SHALL identify the primary key field (`isId: true`) for each Model.
5. THE Generator SHALL identify all Relational_Fields (fields with `kind === "object"`) for each Model and record the related Model name.
6. WHEN `--models <names>` is provided, THE Generator SHALL restrict generation to the comma-separated list of Model names and SHALL skip all other Models.
7. IF a name supplied via `--models` does not match any Model in the schema, THEN THE Generator SHALL print a warning for that name and continue with the remaining valid names.

---

### Requirement 6: Interactive Mode

**User Story:** As a developer, I want to be guided through per-model configuration choices, so that I can customise which fields and features are included in each generated file.

#### Acceptance Criteria

1. WHEN `--autopilot` is not set, THE Generator SHALL run in Interactive_Mode.
2. WHEN in Interactive_Mode, THE Generator SHALL present a multi-select prompt listing all discovered Models and ask the user which ones to generate.
3. WHEN in Interactive_Mode, THE Generator SHALL present a prompt for each selected Model asking which Relational_Fields to render as Searchable_Select dropdowns.
4. WHEN in Interactive_Mode, THE Generator SHALL present a prompt for each selected Model asking which Scalar_Fields to include in the Table_File.
5. WHEN in Interactive_Mode, THE Generator SHALL present a prompt for each selected Model asking which Scalar_Fields to include in the Form_File.
6. WHEN in Interactive_Mode, THE Generator SHALL ask whether to enable bulk delete for each selected Model.
7. WHEN in Interactive_Mode, THE Generator SHALL ask whether to enable CSV/JSON export for each selected Model.
8. WHEN in Interactive_Mode, THE Generator SHALL respect all CLI flags as overrides that take precedence over prompt answers.

---

### Requirement 7: Autopilot Mode

**User Story:** As a developer, I want to generate all frontend files with no prompts, so that I can use the generator in CI pipelines or rapid prototyping workflows.

#### Acceptance Criteria

1. WHEN `--autopilot` is set, THE Generator SHALL run in Autopilot_Mode and SHALL NOT display any interactive prompts.
2. WHEN in Autopilot_Mode, THE Generator SHALL generate files for all Models unless `--models` restricts the set.
3. WHEN in Autopilot_Mode, THE Generator SHALL include all Scalar_Fields in both the Table_File and Form_File for each Model.
4. WHEN in Autopilot_Mode, THE Generator SHALL render all Relational_Fields as Searchable_Select dropdowns in the Form_File.
5. WHEN in Autopilot_Mode, THE Generator SHALL enable bulk delete for every Model.
6. WHEN in Autopilot_Mode, THE Generator SHALL enable CSV/JSON export for every Model.
7. WHEN in Autopilot_Mode and a Model has more than 6 fields, THE Generator SHALL enable Multi_Step_Form for that Model.

---

### Requirement 8: Hook File Generation

**User Story:** As a developer, I want a TanStack Query hook file generated for each model, so that I have a consistent, typed data-fetching layer without writing boilerplate.

#### Acceptance Criteria

1. THE Generator SHALL produce one Hook_File per selected Model, named `use[Model].ts`, in the `hooks/` subdirectory of Output_Dir.
2. THE Hook_File SHALL export a `use[Model]s` function that calls `useQuery` to fetch a paginated list of records from `{Base_URL}/{routeName}`.
3. THE Hook_File SHALL export a `use[Model]` function that calls `useQuery` to fetch a single record by ID from `{Base_URL}/{routeName}/{id}`.
4. THE Hook_File SHALL export a `useCreate[Model]` function that calls `useMutation` to POST a new record to `{Base_URL}/{routeName}`.
5. THE Hook_File SHALL export a `useUpdate[Model]` function that calls `useMutation` to PATCH an existing record at `{Base_URL}/{routeName}/{id}`.
6. THE Hook_File SHALL export a `useDelete[Model]` function that calls `useMutation` to DELETE a record at `{Base_URL}/{routeName}/{id}`.
7. THE Hook_File SHALL export a `useBulkDelete[Model]s` function that calls `useMutation` to DELETE multiple records, unless `--no-bulk` is set.
8. WHEN `--no-optimistic` is not set, THE Hook_File SHALL implement Optimistic_Update patterns in `useCreate[Model]`, `useUpdate[Model]`, `useDelete[Model]`, and `useBulkDelete[Model]s`.
9. THE Hook_File SHALL set `staleTime` to the value of `--stale-time` (default `30000`) and `gcTime` to the value of `--gc-time` (default `300000`) in all `useQuery` calls.
10. THE Hook_File SHALL use TypeScript and SHALL import types from `@prisma/client` for input and output shapes.

---

### Requirement 9: Columns File Generation

**User Story:** As a developer, I want a TanStack Table column definitions file generated for each model, so that the data table has typed, correctly labelled columns without manual setup.

#### Acceptance Criteria

1. THE Generator SHALL produce one Columns_File per selected Model, named `[Model]Columns.tsx`, in the `components/[model]/` subdirectory of Output_Dir.
2. THE Columns_File SHALL define a `[model]Columns` array typed as `ColumnDef<[Model]>[]`.
3. THE Columns_File SHALL include one column definition for each Scalar_Field selected for the table.
4. THE Columns_File SHALL use human-readable header labels derived from the field name (camelCase converted to Title Case).
5. THE Columns_File SHALL include an `actions` column with edit and delete button cells.

---

### Requirement 10: Table File Generation

**User Story:** As a developer, I want a DataTable component generated for each model, so that I have a fully wired, paginated, searchable table ready to embed in a page.

#### Acceptance Criteria

1. THE Generator SHALL produce one Table_File per selected Model, named `[Model]Table.tsx`, in the `components/[model]/` subdirectory of Output_Dir.
2. THE Table_File SHALL import and use the `DataTable` Base_Component.
3. THE Table_File SHALL import the Columns_File for the same Model.
4. THE Table_File SHALL import and call the `use[Model]s` hook from the Hook_File.
5. THE Table_File SHALL import and call the `useDelete[Model]` hook and wire it to the `onRowDelete` prop of `DataTable`.
6. WHEN bulk delete is enabled for the Model, THE Table_File SHALL import and call `useBulkDelete[Model]s` and wire it to the `onMultiDelete` prop of `DataTable`.
7. WHEN export is enabled for the Model, THE Table_File SHALL pass `canExport={true}` to `DataTable`.
8. WHEN Framework is `nextjs`, THE Table_File SHALL include the `'use client'` directive as the first line.

---

### Requirement 11: Form File Generation

**User Story:** As a developer, I want a FormGenerator component generated for each model, so that I have a create/edit form with Zod validation and relational dropdowns ready to use.

#### Acceptance Criteria

1. THE Generator SHALL produce one Form_File per selected Model, named `[Model]Form.tsx`, in the `components/[model]/` subdirectory of Output_Dir.
2. THE Form_File SHALL import and use the `FormGenerator` Base_Component.
3. THE Form_File SHALL import the Zod schema for the Model from `src/schemas.generated.ts`.
4. THE Form_File SHALL import and call `useCreate[Model]` and `useUpdate[Model]` hooks from the Hook_File.
5. THE Form_File SHALL include a `fields` array passed to `FormGenerator` covering all Scalar_Fields selected for the form.
6. WHEN a Relational_Field is selected for inclusion, THE Form_File SHALL render it as a `searchable-select` field type, importing the corresponding `use[RelatedModel]s` hook to populate options.
7. WHEN Multi_Step_Form is enabled for the Model, THE Form_File SHALL pass a `steps` prop to `FormGenerator` grouping fields across steps.
8. WHEN Framework is `nextjs`, THE Form_File SHALL include the `'use client'` directive as the first line.

---

### Requirement 12: Base Component Copying

**User Story:** As a developer, I want the shared DataTable and FormGenerator components copied into my project, so that the generated files have their dependencies available locally.

#### Acceptance Criteria

1. THE Generator SHALL copy `frontend-next/data-table.tsx` from the omni-rest package into `{Output_Dir}/components/data-table.tsx` in the user's project.
2. THE Generator SHALL copy `frontend-next/form-generator.tsx` from the omni-rest package into `{Output_Dir}/components/form-generator.tsx` in the user's project.
3. IF a Base_Component file already exists at the destination, THE Generator SHALL skip copying it and print an informational message.
4. THE Generator SHALL create any intermediate directories required for the destination path.

---

### Requirement 13: Output Directory Resolution

**User Story:** As a developer, I want control over where generated files are written, so that the output fits my project's directory structure.

#### Acceptance Criteria

1. WHEN `--out <dir>` is not provided, THE Generator SHALL write all files under `src/` relative to `Frontend_Dir`.
2. WHEN `--out <dir>` is provided, THE Generator SHALL write all files under the specified directory, resolved relative to `Frontend_Dir`.
3. WHEN Framework is `nextjs` and `Frontend_Dir/src/` does not exist but `Frontend_Dir/app/` does, THE Generator SHALL default Output_Dir to `Frontend_Dir/app/` when `--out` is not provided.
4. THE Generator SHALL create all necessary intermediate directories before writing any file.
5. IF a generated file already exists at its destination path, THE Generator SHALL overwrite it and print a warning indicating the file was overwritten.

---

### Requirement 14: Dependency Validation

**User Story:** As a developer, I want the generator to warn me about missing dependencies before writing files, so that I can install them and avoid broken generated code.

#### Acceptance Criteria

1. BEFORE writing any file, THE Generator SHALL check that `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `zod`, and `@hookform/resolvers` are listed in `Frontend_Dir/package.json` dependencies or devDependencies.
2. IF any required dependency is missing, THEN THE Generator SHALL print a warning listing the missing packages and the install command to run.
3. THE Generator SHALL continue and write files even when dependency warnings are present.
4. WHEN Framework is `nextjs`, THE Generator SHALL additionally check for `next` in `Frontend_Dir/package.json`.
5. WHEN Framework is `vite-react`, THE Generator SHALL additionally check for `react-router-dom` in `Frontend_Dir/package.json`.

---

### Requirement 15: Generation Summary and Logging

**User Story:** As a developer, I want clear console output during and after generation, so that I know exactly which files were created, skipped, or overwritten.

#### Acceptance Criteria

1. THE Generator SHALL print a summary line for each file written, indicating the relative path and whether it was created or overwritten.
2. THE Generator SHALL print a final summary showing the total count of files written, skipped, and warned.
3. WHEN an error occurs writing a specific file, THE Generator SHALL print the error and continue generating remaining files rather than aborting.
4. THE Generator SHALL use distinct visual indicators (e.g. colour or prefix symbols) to differentiate created, overwritten, skipped, and error lines in console output.

---

### Requirement 16: Multi-Step Form Control

**User Story:** As a developer, I want control over when multi-step forms are used, so that I can enforce or suppress wizard-style forms regardless of field count.

#### Acceptance Criteria

1. WHEN `--steps auto` is set or `--steps` is not provided, THE Generator SHALL enable Multi_Step_Form for a Model only when that Model has more than 6 fields.
2. WHEN `--steps always` is set, THE Generator SHALL enable Multi_Step_Form for every selected Model regardless of field count.
3. WHEN `--steps never` is set, THE Generator SHALL disable Multi_Step_Form for every selected Model regardless of field count.
4. WHEN Multi_Step_Form is enabled, THE Generator SHALL distribute fields evenly across steps with a maximum of 4 fields per step.

---

### Requirement 17: Round-Trip Schema Consistency

**User Story:** As a developer, I want the generated Zod schemas and TypeScript types to stay consistent with the Prisma schema, so that forms and hooks remain type-safe after schema changes.

#### Acceptance Criteria

1. THE Form_File SHALL import Zod schemas exclusively from `src/schemas.generated.ts` and SHALL NOT define inline Zod schemas.
2. THE Hook_File SHALL import TypeScript input/output types from `@prisma/client` and SHALL NOT redefine model types inline.
3. WHEN the user re-runs `npx omni-rest generate:frontend` after a schema change, THE Generator SHALL regenerate all Hook_Files and Columns_Files to reflect the updated DMMF.

---

### Requirement 18: Frontend Directory Discovery and Confirmation

**User Story:** As a developer, I want the generator to locate my frontend project directory automatically and confirm it with me, so that generated files are always written to the correct location regardless of my project structure.

#### Acceptance Criteria

1. WHEN `--frontend-dir <path>` is provided, THE Generator SHALL set `Frontend_Dir` to the specified path, skip all scanning and confirmation prompts, and proceed directly to framework detection.
2. IF the path supplied via `--frontend-dir` does not exist or is not a directory, THEN THE Generator SHALL print a descriptive error message and exit with a non-zero code.
3. WHEN `--frontend-dir` is not provided, THE Generator SHALL scan the directory tree starting from the current working directory up to 3 levels deep to collect all Candidate_Frontend directories.
4. WHEN scanning, THE Generator SHALL exclude `node_modules`, `.git`, `dist`, `build`, `.next`, and `out` directories from traversal.
5. THE Generator SHALL identify a directory as a Candidate_Frontend if it contains `next.config.js`, `next.config.ts`, `vite.config.ts`, or `vite.config.js` — OR if it contains a `package.json` that lists `react` as a direct dependency or devDependency.
6. THE Generator SHALL assign each Candidate_Frontend a score: directories containing `next.config.*` or `vite.config.*` SHALL receive a higher score than directories identified solely by `package.json` + `react`.
7. THE Generator SHALL present Candidate_Frontend directories to the user sorted by score descending.
8. WHEN the current working directory itself contains `next.config.js`, `next.config.ts`, `vite.config.ts`, or `vite.config.js`, THE Generator SHALL confirm with the user that the current working directory is the intended `Frontend_Dir` before proceeding.
9. WHEN exactly one Candidate_Frontend is found and it is not the current working directory, THE Generator SHALL display it and ask the user to confirm it as `Frontend_Dir` before proceeding.
10. WHEN multiple Candidate_Frontend directories are found, THE Generator SHALL present them as a numbered list and prompt the user to select one as `Frontend_Dir`.
11. IF no Candidate_Frontend is found, THEN THE Generator SHALL print a descriptive error message explaining the scan criteria and exit with a non-zero code.
12. WHEN `--autopilot` is set and exactly one Candidate_Frontend is found, THE Generator SHALL use it as `Frontend_Dir` without prompting.
13. WHEN `--autopilot` is set and multiple Candidate_Frontend directories are found, THE Generator SHALL print all candidates and exit with a non-zero code instructing the user to specify `--frontend-dir`.
14. WHEN `--autopilot` is set and no Candidate_Frontend is found, THE Generator SHALL print a descriptive error message and exit with a non-zero code.
15. AFTER resolving `Frontend_Dir`, THE Generator SHALL scan for a backend directory by looking for a `schema.prisma` file or a mounted omni-rest adapter within the directory tree, and SHALL display the identified backend directory and its inferred API base URL to the user so they can confirm the configuration is correct.
16. WHEN `--autopilot` is set, THE Generator SHALL skip the backend directory confirmation display described in criterion 15.
