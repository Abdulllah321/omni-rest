import { describe, it, expect, vi } from "vitest";
import { mockDMMF } from "./fixtures/mockPrisma";

vi.mock("@prisma/client", () => ({
  Prisma: { dmmf: mockDMMF },
}));

const { getModels, buildModelMap, toRouteName } = await import("../src/introspect");

describe("introspect", () => {
  it("returns all models from DMMF", () => {
    const models = getModels();
    expect(models).toHaveLength(3);
    expect(models.map((m) => m.name)).toEqual(["User", "Department", "Category"]);
  });

  it("sets routeName as lowercase model name", () => {
    const models = getModels();
    expect(models[0].routeName).toBe("user");
    expect(models[1].routeName).toBe("department");
  });

  it("identifies the id field", () => {
    const models = getModels();
    expect(models[0].idField).toBe("id");
  });

  it("marks relation fields correctly", () => {
    const models = getModels();
    const relField = models[0].fields.find((f) => f.isRelation);
    expect(relField).toBeUndefined(); // mock has no relations
  });
});

describe("buildModelMap", () => {
  it("builds a map of routeName → ModelMeta", () => {
    const models = getModels();
    const map = buildModelMap(models);
    expect(map["user"]).toBeDefined();
    expect(map["department"]).toBeDefined();
  });

  it("filters by allow list", () => {
    const models = getModels();
    const map = buildModelMap(models, ["user"]);
    expect(Object.keys(map)).toEqual(["user"]);
  });
});

describe("toRouteName", () => {
  it("lowercases model name", () => {
    expect(toRouteName("UserProfile")).toBe("userprofile");
    expect(toRouteName("OrderItem")).toBe("orderitem");
  });
});