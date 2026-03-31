import { describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "./fixtures/mockPrisma";
import { createRouter } from "../src/router";
import { detectSoftDeleteField } from "../src/introspect";
import type { FieldMeta } from "../src/types";

// ─── detectSoftDeleteField unit tests ────────────────────────────────────────

const makeField = (name: string, type: string): FieldMeta => ({
  name, type, isId: false, isRequired: false,
  isList: false, isRelation: false, hasDefaultValue: false, isUpdatedAt: false,
});

describe("detectSoftDeleteField", () => {
  it("auto-detects deletedAt DateTime field", () => {
    const result = detectSoftDeleteField([makeField("deletedAt", "DateTime")]);
    expect(result).toEqual({ field: "deletedAt", value: expect.any(Date) });
  });

  it("auto-detects isActive Boolean field", () => {
    const result = detectSoftDeleteField([makeField("isActive", "Boolean")]);
    expect(result).toEqual({ field: "isActive", value: false });
  });

  it("prefers deletedAt over isActive when both present", () => {
    const fields = [makeField("deletedAt", "DateTime"), makeField("isActive", "Boolean")];
    expect(detectSoftDeleteField(fields)?.field).toBe("deletedAt");
  });

  it("returns null when no soft-delete field exists", () => {
    expect(detectSoftDeleteField([makeField("name", "String")])).toBeNull();
  });

  it("uses explicit softDeleteField when provided", () => {
    const fields = [makeField("archivedAt", "DateTime")];
    const result = detectSoftDeleteField(fields, "archivedAt");
    expect(result).toEqual({ field: "archivedAt", value: expect.any(Date) });
  });

  it("returns null when explicit field does not exist on model", () => {
    expect(detectSoftDeleteField([makeField("name", "String")], "deletedAt")).toBeNull();
  });

  it("infers Boolean value for explicit Boolean field", () => {
    const result = detectSoftDeleteField([makeField("active", "Boolean")], "active");
    expect(result?.value).toBe(false);
  });
});

// ─── Soft delete via router ───────────────────────────────────────────────────

describe("soft delete — deletedAt model (Post)", () => {
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("DELETE calls update with deletedAt instead of delete", async () => {
    const { handle } = createRouter(prisma as any, { softDelete: true });
    const res = await handle("DELETE", "post", "1", {}, new URLSearchParams());
    expect(prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      })
    );
    expect(prisma.post.delete).not.toHaveBeenCalled();
  });

  it("DELETE returns 200 with the updated record", async () => {
    const { handle } = createRouter(prisma as any, { softDelete: true });
    const res = await handle("DELETE", "post", "1", {}, new URLSearchParams());
    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
  });

  it("GET list excludes soft-deleted records (deletedAt: null)", async () => {
    const { handle } = createRouter(prisma as any, { softDelete: true });
    await handle("GET", "post", null, {}, new URLSearchParams());
    const [[findManyCall]] = prisma.$transaction.mock.calls;
    // $transaction receives an array of promises — check findMany was called with deletedAt: null
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) })
    );
  });
});

describe("soft delete — isActive model (Product)", () => {
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("DELETE calls update with isActive: false instead of delete", async () => {
    const { handle } = createRouter(prisma as any, { softDelete: true });
    await handle("DELETE", "product", "1", {}, new URLSearchParams());
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { isActive: false },
      })
    );
    expect(prisma.product.delete).not.toHaveBeenCalled();
  });

  it("GET list filters to isActive: true", async () => {
    const { handle } = createRouter(prisma as any, { softDelete: true });
    await handle("GET", "product", null, {}, new URLSearchParams());
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
    );
  });
});

describe("soft delete — model without soft-delete field (Department)", () => {
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("falls back to hard delete when no soft-delete field exists", async () => {
    const { handle } = createRouter(prisma as any, { softDelete: true });
    const res = await handle("DELETE", "department", "1", {}, new URLSearchParams());
    expect(prisma.department.delete).toHaveBeenCalled();
    expect(prisma.department.update).not.toHaveBeenCalled();
    expect(res.status).toBe(204);
  });
});

describe("soft delete disabled (default)", () => {
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("DELETE uses hard delete when softDelete is false", async () => {
    const { handle } = createRouter(prisma as any);
    const res = await handle("DELETE", "post", "1", {}, new URLSearchParams());
    expect(prisma.post.delete).toHaveBeenCalled();
    expect(prisma.post.update).not.toHaveBeenCalled();
    expect(res.status).toBe(204);
  });

  it("GET list does not filter by deletedAt when softDelete is false", async () => {
    const { handle } = createRouter(prisma as any);
    await handle("GET", "post", null, {}, new URLSearchParams());
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.not.objectContaining({ deletedAt: null }) })
    );
  });
});
