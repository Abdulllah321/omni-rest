import { describe, it, expect } from "vitest";
import { generateTableFile } from "../../../src/frontend/codegen/table";
import type { GeneratorConfig, ModelConfig } from "../../../src/frontend/types";
import type { ModelMeta } from "../../../src/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeModel(name: string, routeName?: string): ModelMeta {
  return {
    name,
    routeName: routeName ?? name.toLowerCase(),
    fields: [],
    idField: "id",
  };
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
  overrides: Partial<ModelConfig> = {}
): ModelConfig {
  return {
    model: makeModel(name),
    tableFields: ["id", "name"],
    formFields: [],
    relationalFields: [],
    bulkDelete: false,
    canExport: false,
    multiStep: false,
    ...overrides,
  };
}

// ─── 'use client' directive ───────────────────────────────────────────────────

describe("generateTableFile — 'use client' directive", () => {
  it("includes 'use client' as the first line for nextjs", () => {
    const out = generateTableFile(makeConfig({ framework: "nextjs" }), makeModelConfig("User"));
    const firstLine = out.split("\n")[0];
    expect(firstLine).toBe("'use client'");
  });

  it("does NOT include 'use client' for vite-react", () => {
    const out = generateTableFile(makeConfig({ framework: "vite-react" }), makeModelConfig("User"));
    expect(out).not.toContain("'use client'");
  });

  it("does NOT include 'use client' for react", () => {
    const out = generateTableFile(makeConfig({ framework: "react" }), makeModelConfig("User"));
    expect(out).not.toContain("'use client'");
  });
});

// ─── DataTable import ─────────────────────────────────────────────────────────

describe("generateTableFile — DataTable import", () => {
  it("imports DataTable from ../data-table", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain(`import DataTable from "../data-table"`);
  });

  it("uses DataTable in the JSX return", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("<DataTable");
  });
});

// ─── Columns import ───────────────────────────────────────────────────────────

describe("generateTableFile — columns import", () => {
  it("imports the columns variable from ./[Model]Columns", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain(`import { userColumns } from "./UserColumns"`);
  });

  it("passes the columns variable to DataTable", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("columns={userColumns}");
  });

  it("uses the correct columns variable name for a different model", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("BlogPost"));
    expect(out).toContain(`import { blogPostColumns } from "./BlogPostColumns"`);
    expect(out).toContain("columns={blogPostColumns}");
  });
});

// ─── Hook imports ─────────────────────────────────────────────────────────────

describe("generateTableFile — hook imports", () => {
  it("imports use[Model]s from ../../hooks/use[Model]", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain(`from "../../hooks/useUser"`);
    expect(out).toContain("useUsers");
  });

  it("imports useDelete[Model] from ../../hooks/use[Model]", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("useDeleteUser");
  });

  it("calls use[Model]s hook and passes data to DataTable", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("useUsers()");
    expect(out).toContain("data?.data ?? []");
  });

  it("calls useDelete[Model] and wires to onRowDelete", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("useDeleteUser()");
    expect(out).toContain("onRowDelete=");
    expect(out).toContain("userDelete.mutate(row.id)");
  });
});

// ─── bulkDelete wiring ────────────────────────────────────────────────────────

describe("generateTableFile — bulkDelete", () => {
  it("imports useBulkDelete[Model]s when bulkDelete is true", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User", { bulkDelete: true }));
    expect(out).toContain("useBulkDeleteUsers");
  });

  it("wires useBulkDelete[Model]s to onMultiDelete when bulkDelete is true", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User", { bulkDelete: true }));
    expect(out).toContain("onMultiDelete=");
    expect(out).toContain("userBulkDelete.mutate");
  });

  it("does NOT import useBulkDelete[Model]s when bulkDelete is false", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User", { bulkDelete: false }));
    expect(out).not.toContain("useBulkDeleteUsers");
  });

  it("does NOT include onMultiDelete when bulkDelete is false", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User", { bulkDelete: false }));
    expect(out).not.toContain("onMultiDelete");
  });
});

// ─── canExport prop ───────────────────────────────────────────────────────────

describe("generateTableFile — canExport", () => {
  it("passes canExport={true} to DataTable when canExport is true", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User", { canExport: true }));
    expect(out).toContain("canExport={true}");
  });

  it("does NOT include canExport prop when canExport is false", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User", { canExport: false }));
    expect(out).not.toContain("canExport");
  });
});

// ─── Component structure ──────────────────────────────────────────────────────

describe("generateTableFile — component structure", () => {
  it("exports a function named [Model]Table", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("export function UserTable()");
  });

  it("uses the correct component name for a different model", () => {
    const out = generateTableFile(makeConfig(), makeModelConfig("Product"));
    expect(out).toContain("export function ProductTable()");
  });
});
