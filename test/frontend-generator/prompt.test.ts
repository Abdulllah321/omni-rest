import { describe, it, expect } from "vitest";
import { shouldUseMultiStep, buildConfig } from "../../src/frontend/prompt";
import type { ModelMeta } from "../../src/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeModel(name: string, scalarCount: number, relCount = 0): ModelMeta {
  const fields = [
    // always include an id field
    { 
      name: "id", 
      type: "String", 
      isId: true, 
      isRequired: true, 
      isList: false, 
      isRelation: false,
      hasDefaultValue: true,  // id typically has @default
      isUpdatedAt: false,
    },
    ...Array.from({ length: scalarCount - 1 }, (_, i) => ({
      name: `field${i + 1}`,
      type: "String",
      isId: false,
      isRequired: true,
      isList: false,
      isRelation: false,
      hasDefaultValue: false,
      isUpdatedAt: false,
    })),
    ...Array.from({ length: relCount }, (_, i) => ({
      name: `rel${i + 1}`,
      type: "RelatedModel",
      isId: false,
      isRequired: false,
      isList: false,
      isRelation: true,
      hasDefaultValue: false,
      isUpdatedAt: false,
    })),
  ];

  return {
    name,
    routeName: name.toLowerCase(),
    fields,
    idField: "id",
  };
}

// ─── shouldUseMultiStep ───────────────────────────────────────────────────────

describe("shouldUseMultiStep", () => {
  describe('stepsFlag = "always"', () => {
    it("returns true regardless of field count (0 fields)", () => {
      expect(shouldUseMultiStep(0, "always")).toBe(true);
    });

    it("returns true regardless of field count (3 fields)", () => {
      expect(shouldUseMultiStep(3, "always")).toBe(true);
    });

    it("returns true regardless of field count (10 fields)", () => {
      expect(shouldUseMultiStep(10, "always")).toBe(true);
    });
  });

  describe('stepsFlag = "never"', () => {
    it("returns false regardless of field count (0 fields)", () => {
      expect(shouldUseMultiStep(0, "never")).toBe(false);
    });

    it("returns false regardless of field count (3 fields)", () => {
      expect(shouldUseMultiStep(3, "never")).toBe(false);
    });

    it("returns false regardless of field count (10 fields)", () => {
      expect(shouldUseMultiStep(10, "never")).toBe(false);
    });
  });

  describe('stepsFlag = "auto"', () => {
    it("returns false when fieldCount <= 6", () => {
      expect(shouldUseMultiStep(6, "auto")).toBe(false);
    });

    it("returns true when fieldCount > 6", () => {
      expect(shouldUseMultiStep(7, "auto")).toBe(true);
    });

    it("returns false for 1 field", () => {
      expect(shouldUseMultiStep(1, "auto")).toBe(false);
    });

    it("returns true for 20 fields", () => {
      expect(shouldUseMultiStep(20, "auto")).toBe(true);
    });
  });

  describe("stepsFlag = undefined (defaults to auto behaviour)", () => {
    it("returns false when fieldCount <= 6", () => {
      expect(shouldUseMultiStep(6)).toBe(false);
    });

    it("returns true when fieldCount > 6", () => {
      expect(shouldUseMultiStep(7)).toBe(true);
    });

    it("returns false for 0 fields", () => {
      expect(shouldUseMultiStep(0)).toBe(false);
    });
  });

  describe("boundary at exactly 6 fields", () => {
    it("returns false at exactly 6 (auto)", () => {
      expect(shouldUseMultiStep(6, "auto")).toBe(false);
    });

    it("returns true at exactly 7 (auto)", () => {
      expect(shouldUseMultiStep(7, "auto")).toBe(true);
    });

    it("returns true at exactly 6 when always", () => {
      expect(shouldUseMultiStep(6, "always")).toBe(true);
    });

    it("returns false at exactly 7 when never", () => {
      expect(shouldUseMultiStep(7, "never")).toBe(false);
    });
  });
});

// ─── buildConfig (autopilot mode) ────────────────────────────────────────────

describe("buildConfig (autopilot mode)", () => {
  it("returns one ModelConfig per model", async () => {
    const models = [makeModel("User", 3), makeModel("Post", 4)];
    const result = await buildConfig(models, { autopilot: true });
    expect(result).toHaveLength(2);
    expect(result[0].model.name).toBe("User");
    expect(result[1].model.name).toBe("Post");
  });

  it("includes all scalar fields in tableFields", async () => {
    const model = makeModel("User", 4); // id + 3 scalar fields
    const [config] = await buildConfig([model], { autopilot: true });
    const scalarNames = model.fields.filter((f) => !f.isRelation).map((f) => f.name);
    expect(config.tableFields).toEqual(scalarNames);
  });

  it("includes editable fields in formFields (excludes id, @default, @updatedAt)", async () => {
    const model = makeModel("User", 4);
    const [config] = await buildConfig([model], { autopilot: true });
    // formFields should exclude id and any fields with @default or @updatedAt
    const editableNames = model.fields
      .filter((f) => !f.isRelation && !f.isId && !f.hasDefaultValue && !f.isUpdatedAt)
      .map((f) => f.name);
    expect(config.formFields).toEqual(editableNames);
  });

  it("includes all relational fields in relationalFields", async () => {
    const model = makeModel("Post", 3, 2); // 3 scalars + 2 relations
    const [config] = await buildConfig([model], { autopilot: true });
    const relNames = model.fields.filter((f) => f.isRelation).map((f) => f.name);
    expect(config.relationalFields).toEqual(relNames);
  });

  it("enables bulkDelete by default", async () => {
    const [config] = await buildConfig([makeModel("User", 3)], { autopilot: true });
    expect(config.bulkDelete).toBe(true);
  });

  it("disables bulkDelete when noBulk flag is set", async () => {
    const [config] = await buildConfig([makeModel("User", 3)], {
      autopilot: true,
      noBulk: true,
    });
    expect(config.bulkDelete).toBe(false);
  });

  it("enables canExport", async () => {
    const [config] = await buildConfig([makeModel("User", 3)], { autopilot: true });
    expect(config.canExport).toBe(true);
  });

  it("sets multiStep=false when model has <= 6 fields (auto)", async () => {
    const model = makeModel("User", 6); // exactly 6 fields
    const [config] = await buildConfig([model], { autopilot: true });
    expect(config.multiStep).toBe(false);
  });

  it("sets multiStep=true when model has > 6 fields (auto)", async () => {
    const model = makeModel("BigModel", 7); // 7 fields
    const [config] = await buildConfig([model], { autopilot: true });
    expect(config.multiStep).toBe(true);
  });

  it("sets multiStep=true for all models when steps=always", async () => {
    const models = [makeModel("Small", 2), makeModel("Big", 10)];
    const result = await buildConfig(models, { autopilot: true, steps: "always" });
    expect(result.every((c) => c.multiStep)).toBe(true);
  });

  it("sets multiStep=false for all models when steps=never", async () => {
    const models = [makeModel("Small", 2), makeModel("Big", 10)];
    const result = await buildConfig(models, { autopilot: true, steps: "never" });
    expect(result.every((c) => !c.multiStep)).toBe(true);
  });

  it("filters models by modelsFilter", async () => {
    const models = [makeModel("User", 3), makeModel("Post", 3), makeModel("Comment", 3)];
    const result = await buildConfig(models, {
      autopilot: true,
      modelsFilter: ["User", "Comment"],
    });
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.model.name)).toEqual(["User", "Comment"]);
  });

  it("returns empty array when modelsFilter matches nothing", async () => {
    const models = [makeModel("User", 3)];
    const result = await buildConfig(models, {
      autopilot: true,
      modelsFilter: ["NonExistent"],
    });
    expect(result).toHaveLength(0);
  });

  it("handles model with no relational fields", async () => {
    const model = makeModel("Tag", 3, 0);
    const [config] = await buildConfig([model], { autopilot: true });
    expect(config.relationalFields).toEqual([]);
  });

  it("handles model with only relational fields (no scalars beyond id)", async () => {
    const model = makeModel("Junction", 1, 2); // just id + 2 relations
    const [config] = await buildConfig([model], { autopilot: true });
    expect(config.tableFields).toEqual(["id"]);
    // formFields should be empty since id is excluded from forms
    expect(config.formFields).toEqual([]);
    expect(config.relationalFields).toHaveLength(2);
  });
});
