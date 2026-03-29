import { describe, it, expect } from "vitest";
import { generateColumnsFile } from "../../../src/frontend/codegen/columns";
import { camelToTitle } from "../../../src/frontend/codegen/utils";
import type { GeneratorConfig, ModelConfig } from "../../../src/frontend/types";
import type { ModelMeta } from "../../../src/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeModel(name: string): ModelMeta {
  return { name, routeName: name.toLowerCase(), fields: [], idField: "id" };
}

function makeConfig(overrides: Partial<GeneratorConfig> = {}): GeneratorConfig {
  return {
    frontendDir: "/app",
    schemaPath: "/app/prisma/schema.prisma",
    framework: "nextjs",
    baseUrl: "/api",
    outputDir: "/app/src",
    autopilot: false,
    models: [],
    staleTime: 30000,
    gcTime: 300000,
    noOptimistic: false,
    steps: "auto",
    ...overrides,
  };
}

function makeModelConfig(
  name: string,
  tableFields: string[] = [],
  overrides: Partial<ModelConfig> = {}
): ModelConfig {
  return {
    model: makeModel(name),
    tableFields,
    formFields: [],
    relationalFields: [],
    bulkDelete: true,
    canExport: false,
    multiStep: false,
    ...overrides,
  };
}

// ─── Column count ─────────────────────────────────────────────────────────────

describe("generateColumnsFile — column count", () => {
  it("produces one column per selected tableField", () => {
    const fields = ["id", "name", "email"];
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", fields));
    for (const f of fields) {
      expect(out).toContain(`accessorKey: "${f}"`);
    }
    const accessorCount = (out.match(/accessorKey:/g) ?? []).length;
    expect(accessorCount).toBe(fields.length);
  });

  it("produces exactly one column for a single field", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", ["id"]));
    const accessorCount = (out.match(/accessorKey:/g) ?? []).length;
    expect(accessorCount).toBe(1);
  });

  it("produces zero accessor columns when tableFields is empty", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", []));
    const accessorCount = (out.match(/accessorKey:/g) ?? []).length;
    expect(accessorCount).toBe(0);
  });
});

// ─── Actions column ───────────────────────────────────────────────────────────

describe("generateColumnsFile — actions column", () => {
  it("always includes an actions column", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", ["id", "name"]));
    expect(out).toContain(`id: "actions"`);
  });

  it("includes actions column even when tableFields is empty", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", []));
    expect(out).toContain(`id: "actions"`);
  });

  it("actions column has an 'Actions' header", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", []));
    expect(out).toContain(`header: "Actions"`);
  });

  it("actions column includes edit and delete buttons", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", []));
    expect(out).toContain("Edit");
    expect(out).toContain("Delete");
  });

  it("actions column uses cell renderer with row parameter", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", []));
    expect(out).toContain("cell:");
    expect(out).toContain("row");
  });
});

// ─── Header labels ────────────────────────────────────────────────────────────

describe("generateColumnsFile — header labels", () => {
  it("converts camelCase field names to Title Case headers", () => {
    const out = generateColumnsFile(
      makeConfig(),
      makeModelConfig("User", ["firstName", "lastName"])
    );
    expect(out).toContain(`header: "${camelToTitle("firstName")}"`);
    expect(out).toContain(`header: "${camelToTitle("lastName")}"`);
  });

  it("uses camelToTitle for single-word fields", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", ["email"]));
    expect(out).toContain(`header: "Email"`);
  });

  it("uses camelToTitle for multi-word camelCase fields", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", ["createdAt"]));
    expect(out).toContain(`header: "Created At"`);
  });
});

// ─── TypeScript types ─────────────────────────────────────────────────────────

describe("generateColumnsFile — TypeScript types", () => {
  it("imports ColumnDef from @tanstack/react-table", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", []));
    expect(out).toContain(`from "@tanstack/react-table"`);
    expect(out).toContain("ColumnDef");
  });

  it("imports the model type from @prisma/client", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", []));
    expect(out).toContain(`from "@prisma/client"`);
    expect(out).toContain("User");
  });

  it("uses import type syntax for both imports", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("Post", []));
    const importTypeCount = (out.match(/^import type/gm) ?? []).length;
    expect(importTypeCount).toBe(2);
  });

  it("types the column array as ColumnDef<[Model]>[]", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", []));
    expect(out).toContain("ColumnDef<User>[]");
  });

  it("names the exported variable [model]Columns (camelCase)", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("User", []));
    expect(out).toContain("export const userColumns");
  });

  it("uses the correct model name for a different model", () => {
    const out = generateColumnsFile(makeConfig(), makeModelConfig("BlogPost", []));
    expect(out).toContain("ColumnDef<BlogPost>[]");
    expect(out).toContain("export const blogPostColumns");
  });
});
