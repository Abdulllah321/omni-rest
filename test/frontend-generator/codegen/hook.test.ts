import { describe, it, expect } from "vitest";
import { generateHookFile } from "../../../src/frontend/codegen/hook";
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
    tableFields: [],
    formFields: [],
    relationalFields: [],
    bulkDelete: true,
    canExport: false,
    multiStep: false,
    ...overrides,
  };
}

// ─── All 6 hooks exported ─────────────────────────────────────────────────────

describe("generateHookFile — hook exports", () => {
  it("exports use[Model]s (list hook)", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("export function useUsers(");
  });

  it("exports use[Model] (single hook)", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("export function useUser(");
  });

  it("exports useCreate[Model]", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("export function useCreateUser(");
  });

  it("exports useUpdate[Model]", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("export function useUpdateUser(");
  });

  it("exports useDelete[Model]", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("export function useDeleteUser(");
  });

  it("exports useBulkDelete[Model]s when bulkDelete is true", () => {
    const out = generateHookFile(
      makeConfig(),
      makeModelConfig("User", { bulkDelete: true })
    );
    expect(out).toContain("export function useBulkDeleteUsers(");
  });

  it("does NOT export useBulkDelete[Model]s when bulkDelete is false", () => {
    const out = generateHookFile(
      makeConfig(),
      makeModelConfig("User", { bulkDelete: false })
    );
    expect(out).not.toContain("useBulkDeleteUsers");
  });

  it("exports exactly 5 hooks when bulkDelete is false", () => {
    const out = generateHookFile(
      makeConfig(),
      makeModelConfig("Post", { bulkDelete: false })
    );
    const exportCount = (out.match(/^export function /gm) ?? []).length;
    expect(exportCount).toBe(5);
  });

  it("exports exactly 6 hooks when bulkDelete is true", () => {
    const out = generateHookFile(
      makeConfig(),
      makeModelConfig("Post", { bulkDelete: true })
    );
    const exportCount = (out.match(/^export function /gm) ?? []).length;
    expect(exportCount).toBe(6);
  });
});

// ─── Optimistic callbacks ─────────────────────────────────────────────────────

describe("generateHookFile — optimistic callbacks", () => {
  it("includes onMutate in create mutation when noOptimistic is false", () => {
    const out = generateHookFile(
      makeConfig({ noOptimistic: false }),
      makeModelConfig("User")
    );
    expect(out).toContain("onMutate");
  });

  it("includes onError in create mutation when noOptimistic is false", () => {
    const out = generateHookFile(
      makeConfig({ noOptimistic: false }),
      makeModelConfig("User")
    );
    expect(out).toContain("onError");
  });

  it("includes onSettled in create mutation when noOptimistic is false", () => {
    const out = generateHookFile(
      makeConfig({ noOptimistic: false }),
      makeModelConfig("User")
    );
    expect(out).toContain("onSettled");
  });

  it("does NOT include onMutate when noOptimistic is true", () => {
    const out = generateHookFile(
      makeConfig({ noOptimistic: true }),
      makeModelConfig("User")
    );
    expect(out).not.toContain("onMutate");
  });

  it("does NOT include onError when noOptimistic is true", () => {
    const out = generateHookFile(
      makeConfig({ noOptimistic: true }),
      makeModelConfig("User")
    );
    expect(out).not.toContain("onError");
  });

  it("does NOT include onSettled when noOptimistic is true", () => {
    const out = generateHookFile(
      makeConfig({ noOptimistic: true }),
      makeModelConfig("User")
    );
    expect(out).not.toContain("onSettled");
  });

  it("optimistic callbacks appear in bulkDelete mutation when enabled", () => {
    const out = generateHookFile(
      makeConfig({ noOptimistic: false }),
      makeModelConfig("User", { bulkDelete: true })
    );
    // Count occurrences — should appear in create, update, delete, bulkDelete (4 mutations)
    const onMutateCount = (out.match(/onMutate/g) ?? []).length;
    expect(onMutateCount).toBe(4);
  });
});

// ─── staleTime and gcTime ─────────────────────────────────────────────────────

describe("generateHookFile — staleTime and gcTime", () => {
  it("includes the configured staleTime value", () => {
    const out = generateHookFile(
      makeConfig({ staleTime: 60000 }),
      makeModelConfig("User")
    );
    expect(out).toContain("staleTime: 60000");
  });

  it("includes the configured gcTime value", () => {
    const out = generateHookFile(
      makeConfig({ gcTime: 600000 }),
      makeModelConfig("User")
    );
    expect(out).toContain("gcTime: 600000");
  });

  it("staleTime appears in both useQuery calls", () => {
    const out = generateHookFile(
      makeConfig({ staleTime: 30000 }),
      makeModelConfig("User")
    );
    const count = (out.match(/staleTime: 30000/g) ?? []).length;
    expect(count).toBe(2); // use[Model]s and use[Model]
  });

  it("gcTime appears in both useQuery calls", () => {
    const out = generateHookFile(
      makeConfig({ gcTime: 300000 }),
      makeModelConfig("User")
    );
    const count = (out.match(/gcTime: 300000/g) ?? []).length;
    expect(count).toBe(2);
  });
});

// ─── @prisma/client import ────────────────────────────────────────────────────

describe("generateHookFile — @prisma/client import", () => {
  it("imports types from @prisma/client", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain(`from "@prisma/client"`);
  });

  it("uses import type syntax for @prisma/client", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain(`import type {`);
    expect(out).toContain(`from "@prisma/client"`);
  });

  it("imports the model type by name", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("Post"));
    expect(out).toContain("Post");
    expect(out).toContain(`from "@prisma/client"`);
  });

  it("imports Prisma namespace for input types", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("Prisma");
  });

  it("does NOT define model types inline", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    // Should not have inline interface/type definitions for the model
    expect(out).not.toMatch(/^interface User /m);
    expect(out).not.toMatch(/^type User =/m);
  });
});

// ─── URL and route name ───────────────────────────────────────────────────────

describe("generateHookFile — URL construction", () => {
  it("uses the configured baseUrl", () => {
    const out = generateHookFile(
      makeConfig({ baseUrl: "https://api.example.com" }),
      makeModelConfig("User")
    );
    expect(out).toContain(`"https://api.example.com"`);
  });

  it("uses the model routeName in fetch URLs", () => {
    const out = generateHookFile(
      makeConfig(),
      makeModelConfig("UserProfile", "userprofile")
    );
    expect(out).toContain("userprofile");
  });

  it("uses useQuery for list hook", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("useQuery");
  });

  it("uses useMutation for create hook", () => {
    const out = generateHookFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("useMutation");
  });
});
