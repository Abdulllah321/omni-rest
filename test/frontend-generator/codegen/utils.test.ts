import { describe, it, expect } from "vitest";
import { camelToTitle, fieldTypeMap, chunkFields } from "../../../src/frontend/codegen/utils";
import type { FieldMeta } from "../../../src/types";

// ─── camelToTitle ─────────────────────────────────────────────────────────────

describe("camelToTitle", () => {
  it("converts a simple camelCase name", () => {
    expect(camelToTitle("firstName")).toBe("First Name");
  });

  it("converts userId", () => {
    expect(camelToTitle("userId")).toBe("User Id");
  });

  it("converts createdAt", () => {
    expect(camelToTitle("createdAt")).toBe("Created At");
  });

  it("handles a single lowercase word", () => {
    expect(camelToTitle("name")).toBe("Name");
  });

  it("handles a single uppercase word (already title)", () => {
    expect(camelToTitle("Name")).toBe("Name");
  });

  it("produces no leading or trailing spaces", () => {
    const result = camelToTitle("someFieldName");
    expect(result).toBe(result.trim());
  });

  it("handles consecutive uppercase letters (acronym-like)", () => {
    // "userID" → "User I D" — each uppercase letter gets a space
    const result = camelToTitle("userID");
    expect(result.startsWith("User")).toBe(true);
    expect(result).toBe(result.trim());
  });

  it("handles a multi-word camelCase string", () => {
    expect(camelToTitle("updatedAt")).toBe("Updated At");
  });
});

// ─── fieldTypeMap ─────────────────────────────────────────────────────────────

function makeField(overrides: Partial<FieldMeta>): FieldMeta {
  return {
    name: "field",
    type: "String",
    isId: false,
    isRequired: true,
    isList: false,
    isRelation: false,
    ...overrides,
  };
}

describe("fieldTypeMap", () => {
  it("maps String → text", () => {
    expect(fieldTypeMap(makeField({ type: "String" }))).toBe("text");
  });

  it("maps Int → number", () => {
    expect(fieldTypeMap(makeField({ type: "Int" }))).toBe("number");
  });

  it("maps Float → number", () => {
    expect(fieldTypeMap(makeField({ type: "Float" }))).toBe("number");
  });

  it("maps Decimal → number", () => {
    expect(fieldTypeMap(makeField({ type: "Decimal" }))).toBe("number");
  });

  it("maps Boolean → switch", () => {
    expect(fieldTypeMap(makeField({ type: "Boolean" }))).toBe("switch");
  });

  it("maps DateTime → date", () => {
    expect(fieldTypeMap(makeField({ type: "DateTime" }))).toBe("date");
  });

  it("maps Json → textarea", () => {
    expect(fieldTypeMap(makeField({ type: "Json" }))).toBe("textarea");
  });

  it("maps an enum type (uppercase, non-scalar) → select", () => {
    expect(fieldTypeMap(makeField({ type: "Role" }))).toBe("select");
    expect(fieldTypeMap(makeField({ type: "Status" }))).toBe("select");
  });

  it("maps a relational field → searchable-select regardless of type", () => {
    expect(fieldTypeMap(makeField({ type: "User", isRelation: true }))).toBe("searchable-select");
    expect(fieldTypeMap(makeField({ type: "String", isRelation: true }))).toBe("searchable-select");
  });

  it("falls back to text for unknown lowercase types", () => {
    expect(fieldTypeMap(makeField({ type: "unknown" }))).toBe("text");
  });

  const validTypes = ["text", "number", "switch", "date", "textarea", "select", "searchable-select"];

  it("always returns a valid FormGenerator field type", () => {
    const types = ["String", "Int", "Float", "Decimal", "Boolean", "DateTime", "Json", "Role", "Status"];
    for (const type of types) {
      expect(validTypes).toContain(fieldTypeMap(makeField({ type })));
    }
    // relational
    expect(validTypes).toContain(fieldTypeMap(makeField({ type: "User", isRelation: true })));
  });
});

// ─── chunkFields ──────────────────────────────────────────────────────────────

describe("chunkFields", () => {
  it("returns empty array for empty input", () => {
    expect(chunkFields([])).toEqual([]);
  });

  it("puts all fields in one chunk when count <= maxPerStep", () => {
    expect(chunkFields(["a", "b", "c"], 4)).toEqual([["a", "b", "c"]]);
  });

  it("splits exactly at maxPerStep boundary", () => {
    expect(chunkFields(["a", "b", "c", "d"], 4)).toEqual([["a", "b", "c", "d"]]);
  });

  it("creates two chunks when fields exceed maxPerStep", () => {
    expect(chunkFields(["a", "b", "c", "d", "e"], 4)).toEqual([
      ["a", "b", "c", "d"],
      ["e"],
    ]);
  });

  it("uses default maxPerStep of 4", () => {
    const result = chunkFields(["a", "b", "c", "d", "e"]);
    expect(result).toEqual([["a", "b", "c", "d"], ["e"]]);
  });

  it("produces ceil(n / maxPerStep) chunks", () => {
    const fields = ["a", "b", "c", "d", "e", "f", "g"];
    const result = chunkFields(fields, 3);
    expect(result.length).toBe(Math.ceil(fields.length / 3)); // 3
  });

  it("all fields appear exactly once across all chunks", () => {
    const fields = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
    const result = chunkFields(fields, 4);
    const flat = result.flat();
    expect(flat).toEqual(fields);
  });

  it("each chunk has at most maxPerStep items", () => {
    const fields = Array.from({ length: 10 }, (_, i) => `f${i}`);
    const maxPerStep = 3;
    const result = chunkFields(fields, maxPerStep);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(maxPerStep);
    }
  });

  it("handles maxPerStep of 1", () => {
    expect(chunkFields(["a", "b", "c"], 1)).toEqual([["a"], ["b"], ["c"]]);
  });
});
