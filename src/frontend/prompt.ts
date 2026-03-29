import * as readline from "readline";
import type { ModelMeta, FieldMeta } from "../types";
import type { ModelConfig } from "./types";

// ─── Flags interface ──────────────────────────────────────────────────────────

export interface BuildConfigFlags {
  autopilot?: boolean;
  noBulk?: boolean;
  steps?: "auto" | "always" | "never";
  modelsFilter?: string[];
}

// ─── shouldUseMultiStep ───────────────────────────────────────────────────────

/**
 * Determines whether a model's form should use multi-step wizard mode.
 *
 * Rules (Requirements 16.1, 16.2, 16.3):
 *  - "always"           → true  (regardless of field count)
 *  - "never"            → false (regardless of field count)
 *  - "auto" / undefined → true  only when fieldCount > 6
 */
export function shouldUseMultiStep(
  fieldCount: number,
  stepsFlag?: "auto" | "always" | "never"
): boolean {
  if (stepsFlag === "always") return true;
  if (stepsFlag === "never") return false;
  // "auto" or undefined
  return fieldCount > 6;
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function scalarFields(model: ModelMeta): FieldMeta[] {
  return model.fields.filter((f) => !f.isRelation);
}

function relationalFields(model: ModelMeta): FieldMeta[] {
  return model.fields.filter((f) => f.isRelation);
}

/**
 * Returns fields that should be included in forms (excludes auto-generated fields).
 * Excludes: id fields, fields with @default(), and @updatedAt fields.
 */
function formEditableFields(model: ModelMeta): FieldMeta[] {
  return model.fields.filter(
    (f) => !f.isRelation && !f.isId && !f.hasDefaultValue && !f.isUpdatedAt
  );
}

// ─── Autopilot config ─────────────────────────────────────────────────────────

function buildAutopilotConfig(
  models: ModelMeta[],
  flags: BuildConfigFlags
): ModelConfig[] {
  return models.map((model) => {
    const scalars = scalarFields(model).map((f) => f.name);
    const editableFields = formEditableFields(model).map((f) => f.name);
    const relations = relationalFields(model).map((f) => f.name);
    const fieldCount = model.fields.length;

    return {
      model,
      tableFields: scalars,
      formFields: editableFields,  // Use editable fields for forms
      relationalFields: relations,
      bulkDelete: !flags.noBulk,
      canExport: true,
      multiStep: shouldUseMultiStep(fieldCount, flags.steps),
    };
  });
}

// ─── Interactive helpers ──────────────────────────────────────────────────────

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

/**
 * Presents a numbered list and returns the indices the user selected.
 * Input format: "1,3,5" or "1 3 5" or "all" (selects everything).
 */
async function multiSelect(
  rl: readline.Interface,
  prompt: string,
  items: string[]
): Promise<number[]> {
  console.log(prompt);
  items.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
  const answer = await ask(rl, "  Enter numbers (comma/space separated, or 'all'): ");
  const trimmed = answer.trim().toLowerCase();
  if (trimmed === "all" || trimmed === "") {
    return items.map((_, i) => i);
  }
  return trimmed
    .split(/[\s,]+/)
    .map((s) => parseInt(s, 10) - 1)
    .filter((i) => i >= 0 && i < items.length);
}

async function yesNo(
  rl: readline.Interface,
  prompt: string,
  defaultYes = true
): Promise<boolean> {
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  const answer = await ask(rl, `${prompt} ${hint}: `);
  const trimmed = answer.trim().toLowerCase();
  if (trimmed === "") return defaultYes;
  return trimmed === "y" || trimmed === "yes";
}

// ─── Interactive config ───────────────────────────────────────────────────────

async function buildInteractiveConfig(
  models: ModelMeta[],
  flags: BuildConfigFlags
): Promise<ModelConfig[]> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Step 1: which models to generate
    const modelIndices = await multiSelect(
      rl,
      "\nWhich models do you want to generate? (default: all)",
      models.map((m) => m.name)
    );
    const selectedModels = modelIndices.map((i) => models[i]);

    const configs: ModelConfig[] = [];

    for (const model of selectedModels) {
      console.log(`\n── Configuring ${model.name} ──`);

      const scalars = scalarFields(model);
      const editableFields = formEditableFields(model);
      const relations = relationalFields(model);

      // Relational fields as searchable-select
      let selectedRelations: string[] = relations.map((f) => f.name);
      if (relations.length > 0) {
        const relIndices = await multiSelect(
          rl,
          `  Relational fields for ${model.name} (searchable-select dropdowns):`,
          relations.map((f) => f.name)
        );
        selectedRelations = relIndices.map((i) => relations[i].name);
      }

      // Scalar fields for table
      const tableIndices = await multiSelect(
        rl,
        `  Scalar fields to show in the table for ${model.name}:`,
        scalars.map((f) => f.name)
      );
      const tableFields = tableIndices.map((i) => scalars[i].name);

      // Editable fields for form (excludes auto-generated)
      const formIndices = await multiSelect(
        rl,
        `  Fields to include in the form for ${model.name}:`,
        editableFields.map((f) => f.name)
      );
      const formFields = formIndices.map((i) => editableFields[i].name);

      // Bulk delete — CLI flag overrides prompt
      const bulkDelete = flags.noBulk
        ? false
        : await yesNo(rl, `  Enable bulk delete for ${model.name}?`);

      // Export — prompt answer
      const canExport = await yesNo(rl, `  Enable CSV/JSON export for ${model.name}?`);

      // Multi-step: if steps flag is set, use it; otherwise prompt only when auto
      let multiStep: boolean;
      if (flags.steps === "always") {
        multiStep = true;
      } else if (flags.steps === "never") {
        multiStep = false;
      } else {
        // auto / undefined — suggest based on field count, let user confirm
        const suggested = formFields.length > 6;
        multiStep = await yesNo(
          rl,
          `  Enable multi-step form for ${model.name}?`,
          suggested
        );
      }

      configs.push({
        model,
        tableFields,
        formFields,
        relationalFields: selectedRelations,
        bulkDelete,
        canExport,
        multiStep,
      });
    }

    return configs;
  } finally {
    rl.close();
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Builds per-model configuration either from autopilot defaults or interactive prompts.
 *
 * Requirements: 6.1–6.8, 7.1–7.7
 */
export async function buildConfig(
  models: ModelMeta[],
  flags: BuildConfigFlags
): Promise<ModelConfig[]> {
  // Apply models filter if provided
  const filtered =
    flags.modelsFilter && flags.modelsFilter.length > 0
      ? models.filter((m) => flags.modelsFilter!.includes(m.name))
      : models;

  if (flags.autopilot) {
    return buildAutopilotConfig(filtered, flags);
  }

  return buildInteractiveConfig(filtered, flags);
}
