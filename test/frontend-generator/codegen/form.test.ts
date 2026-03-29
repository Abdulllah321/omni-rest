import { describe, it, expect } from "vitest";
import { generateFormFile } from "../../../src/frontend/codegen/form";
import type { GeneratorConfig, ModelConfig } from "../../../src/frontend/types";
import type { ModelMeta, FieldMeta } from "../../../src/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeField(
  name: string,
  type: string,
  isRelation = false
): FieldMeta {
  return { name, type, isId: false, isRequired: true, isList: false, isRelation };
}

function makeModel(
  name: string,
  fields: FieldMeta[] = []
): ModelMeta {
  return {
    name,
    routeName: name.toLowerCase(),
    fields,
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
    model: makeModel(name, [
      makeField("id", "String"),
      makeField("name", "String"),
      makeField("email", "String"),
    ]),
    tableFields: ["id", "name", "email"],
    formFields: ["name", "email"],
    relationalFields: [],
    bulkDelete: false,
    canExport: false,
    multiStep: false,
    ...overrides,
  };
}

// ─── 'use client' directive ───────────────────────────────────────────────────

describe("generateFormFile — 'use client' directive", () => {
  it("includes 'use client' as the first line for nextjs", () => {
    const out = generateFormFile(makeConfig({ framework: "nextjs" }), makeModelConfig("User"));
    const firstLine = out.split("\n")[0];
    expect(firstLine).toBe("'use client'");
  });

  it("does NOT include 'use client' for vite-react", () => {
    const out = generateFormFile(makeConfig({ framework: "vite-react" }), makeModelConfig("User"));
    expect(out).not.toContain("'use client'");
  });

  it("does NOT include 'use client' for react", () => {
    const out = generateFormFile(makeConfig({ framework: "react" }), makeModelConfig("User"));
    expect(out).not.toContain("'use client'");
  });
});

// ─── FormGenerator import ─────────────────────────────────────────────────────

describe("generateFormFile — FormGenerator import", () => {
  it("imports FormGenerator from ../form-generator", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain(`import { FormGenerator } from "../form-generator"`);
  });

  it("uses FormGenerator in the JSX return", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("<FormGenerator");
  });
});

// ─── Zod schema import ────────────────────────────────────────────────────────

describe("generateFormFile — Zod schema import", () => {
  it("imports the Zod schema from ../../schemas.generated", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain(`from "../../schemas.generated"`);
  });

  it("imports the model-specific CreateSchema by name", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("UserCreateSchema");
  });

  it("imports the correct schema name for a different model", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("Post"));
    expect(out).toContain("PostCreateSchema");
  });

  it("does NOT define Zod schemas inline", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).not.toMatch(/z\.object\(/);
    expect(out).not.toMatch(/z\.string\(/);
  });

  it("passes the schema to FormGenerator", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("schema={UserCreateSchema}");
  });
});

// ─── Hook imports ─────────────────────────────────────────────────────────────

describe("generateFormFile — hook imports", () => {
  it("imports useCreate[Model] from ../../hooks/use[Model]", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("useCreateUser");
    expect(out).toContain(`from "../../hooks/useUser"`);
  });

  it("imports useUpdate[Model] from ../../hooks/use[Model]", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("useUpdateUser");
    expect(out).toContain(`from "../../hooks/useUser"`);
  });

  it("both hooks are imported in a single import statement", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("useCreateUser, useUpdateUser");
  });

  it("uses the correct hook names for a different model", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("BlogPost"));
    expect(out).toContain("useCreateBlogPost");
    expect(out).toContain("useUpdateBlogPost");
    expect(out).toContain(`from "../../hooks/useBlogPost"`);
  });
});

// ─── fields array ─────────────────────────────────────────────────────────────

describe("generateFormFile — fields array", () => {
  it("has one entry per formField", () => {
    const formFields = ["name", "email", "age"];
    const model = makeModel("User", [
      makeField("name", "String"),
      makeField("email", "String"),
      makeField("age", "Int"),
    ]);
    const mc: ModelConfig = {
      ...makeModelConfig("User"),
      model,
      formFields,
    };
    const out = generateFormFile(makeConfig(), mc);
    // Count name: entries in the fields array
    const nameEntries = (out.match(/name: "/g) ?? []).length;
    expect(nameEntries).toBe(formFields.length);
  });

  it("includes the field name for each formField", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain(`name: "name"`);
    expect(out).toContain(`name: "email"`);
  });

  it("includes a label derived from camelCase for each field", () => {
    const model = makeModel("User", [makeField("firstName", "String")]);
    const mc: ModelConfig = {
      ...makeModelConfig("User"),
      model,
      formFields: ["firstName"],
    };
    const out = generateFormFile(makeConfig(), mc);
    expect(out).toContain(`label: "First Name"`);
  });

  it("maps String fields to text type", () => {
    const model = makeModel("User", [makeField("name", "String")]);
    const mc: ModelConfig = {
      ...makeModelConfig("User"),
      model,
      formFields: ["name"],
    };
    const out = generateFormFile(makeConfig(), mc);
    expect(out).toContain(`type: "text"`);
  });

  it("maps Boolean fields to switch type", () => {
    const model = makeModel("User", [makeField("active", "Boolean")]);
    const mc: ModelConfig = {
      ...makeModelConfig("User"),
      model,
      formFields: ["active"],
    };
    const out = generateFormFile(makeConfig(), mc);
    expect(out).toContain(`type: "switch"`);
  });

  it("maps DateTime fields to date type", () => {
    const model = makeModel("User", [makeField("createdAt", "DateTime")]);
    const mc: ModelConfig = {
      ...makeModelConfig("User"),
      model,
      formFields: ["createdAt"],
    };
    const out = generateFormFile(makeConfig(), mc);
    expect(out).toContain(`type: "date"`);
  });

  it("maps Int fields to number type", () => {
    const model = makeModel("User", [makeField("age", "Int")]);
    const mc: ModelConfig = {
      ...makeModelConfig("User"),
      model,
      formFields: ["age"],
    };
    const out = generateFormFile(makeConfig(), mc);
    expect(out).toContain(`type: "number"`);
  });
});

// ─── Relational fields (searchable-select) ────────────────────────────────────

describe("generateFormFile — relational fields", () => {
  it("adds a searchable-select entry for each relational field", () => {
    const model = makeModel("Post", [
      makeField("title", "String"),
      makeField("authorId", "User", true), // relational field, type = related model name
    ]);
    const mc: ModelConfig = {
      ...makeModelConfig("Post"),
      model,
      formFields: ["title"],
      relationalFields: ["authorId"],
    };
    const out = generateFormFile(makeConfig(), mc);
    expect(out).toContain(`type: "searchable-select"`);
    expect(out).toContain(`name: "authorId"`);
  });

  it("imports use[RelatedModel]s hook for each relational field", () => {
    const model = makeModel("Post", [
      makeField("title", "String"),
      makeField("authorId", "User", true),
    ]);
    const mc: ModelConfig = {
      ...makeModelConfig("Post"),
      model,
      formFields: ["title"],
      relationalFields: ["authorId"],
    };
    const out = generateFormFile(makeConfig(), mc);
    expect(out).toContain("useUsers");
    expect(out).toContain(`from "../../hooks/useUser"`);
  });

  it("does NOT add searchable-select when relationalFields is empty", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).not.toContain(`type: "searchable-select"`);
  });

  it("imports hooks for multiple relational fields", () => {
    const model = makeModel("Comment", [
      makeField("body", "String"),
      makeField("authorId", "User", true),
      makeField("postId", "Post", true),
    ]);
    const mc: ModelConfig = {
      ...makeModelConfig("Comment"),
      model,
      formFields: ["body"],
      relationalFields: ["authorId", "postId"],
    };
    const out = generateFormFile(makeConfig(), mc);
    expect(out).toContain("useUsers");
    expect(out).toContain("usePosts");
  });
});

// ─── Multi-step form ──────────────────────────────────────────────────────────

describe("generateFormFile — multiStep", () => {
  it("passes a steps prop to FormGenerator when multiStep is true", () => {
    const model = makeModel("User", [
      makeField("name", "String"),
      makeField("email", "String"),
      makeField("age", "Int"),
      makeField("bio", "String"),
      makeField("phone", "String"),
    ]);
    const mc: ModelConfig = {
      ...makeModelConfig("User"),
      model,
      formFields: ["name", "email", "age", "bio", "phone"],
      multiStep: true,
    };
    const out = generateFormFile(makeConfig(), mc);
    expect(out).toContain("steps={steps}");
    expect(out).toContain("const steps = [");
  });

  it("does NOT pass a steps prop when multiStep is false", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).not.toContain("steps={steps}");
    expect(out).not.toContain("const steps = [");
  });

  it("groups fields into chunks of at most 4 per step", () => {
    const model = makeModel("User", [
      makeField("f1", "String"),
      makeField("f2", "String"),
      makeField("f3", "String"),
      makeField("f4", "String"),
      makeField("f5", "String"),
      makeField("f6", "String"),
    ]);
    const mc: ModelConfig = {
      ...makeModelConfig("User"),
      model,
      formFields: ["f1", "f2", "f3", "f4", "f5", "f6"],
      multiStep: true,
    };
    const out = generateFormFile(makeConfig(), mc);
    // 6 fields → 2 steps (4 + 2)
    const stepTitleCount = (out.match(/title: "Step /g) ?? []).length;
    expect(stepTitleCount).toBe(2);
  });
});

// ─── Component structure ──────────────────────────────────────────────────────

describe("generateFormFile — component structure", () => {
  it("exports a function named [Model]Form", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("export function UserForm(");
  });

  it("uses the correct component name for a different model", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("Product"));
    expect(out).toContain("export function ProductForm(");
  });

  it("wires create and update hooks to onSubmit", () => {
    const out = generateFormFile(makeConfig(), makeModelConfig("User"));
    expect(out).toContain("createUser");
    expect(out).toContain("updateUser");
    expect(out).toContain("onSubmit=");
  });
});
