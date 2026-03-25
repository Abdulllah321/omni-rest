import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrisma, mockDMMF } from "./fixtures/mockPrisma";

// Mock @prisma/client before importing router
vi.mock("@prisma/client", () => ({
  Prisma: { dmmf: mockDMMF },
  PrismaClient: vi.fn(),
}));

// Import AFTER mock is set up
const { createRouter } = await import("../src/router");

describe("createRouter", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let handle: ReturnType<typeof createRouter>["handle"];

  beforeEach(() => {
    prisma = createMockPrisma();
    ({ handle } = createRouter(prisma as any));
  });

  // ─── 404 for unknown models ───────────────────────────────────────────────
  it("returns 404 for unknown model", async () => {
    const res = await handle("GET", "unknownmodel", null, {}, new URLSearchParams());
    expect(res.status).toBe(404);
    expect(res.data.error).toContain("not found");
  });

  // ─── GET list ─────────────────────────────────────────────────────────────
  it("GET list returns 200 with data and meta", async () => {
    const res = await handle("GET", "user", null, {}, new URLSearchParams());
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("data");
    expect(res.data).toHaveProperty("meta");
    expect(res.data.meta).toHaveProperty("total");
    expect(res.data.meta).toHaveProperty("page");
    expect(res.data.meta).toHaveProperty("limit");
    expect(res.data.meta).toHaveProperty("totalPages");
  });

  it("calls findMany on the delegate", async () => {
    await handle("GET", "user", null, {}, new URLSearchParams());
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  // ─── GET by id ────────────────────────────────────────────────────────────
  it("GET by id returns 200 for found record", async () => {
    const res = await handle("GET", "user", "1", {}, new URLSearchParams());
    expect(res.status).toBe(200);
    expect(res.data.id).toBe(1);
  });

  it("GET by id returns 404 when record not found", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const res = await handle("GET", "user", "999", {}, new URLSearchParams());
    expect(res.status).toBe(404);
  });

  // ─── POST ─────────────────────────────────────────────────────────────────
  it("POST returns 201 with created record", async () => {
    const res = await handle("POST", "user", null, { name: "Jane" }, new URLSearchParams());
    expect(res.status).toBe(201);
    expect(res.data).toBeDefined();
  });

  it("POST calls create with body", async () => {
    await handle("POST", "user", null, { name: "Jane", email: "j@test.com" }, new URLSearchParams());
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { name: "Jane", email: "j@test.com" },
    });
  });

  // ─── PUT ──────────────────────────────────────────────────────────────────
  it("PUT returns 200 with updated record", async () => {
    const res = await handle("PUT", "user", "1", { name: "Updated" }, new URLSearchParams());
    expect(res.status).toBe(200);
  });

  // ─── PATCH ────────────────────────────────────────────────────────────────
  it("PATCH returns 200 with updated record", async () => {
    const res = await handle("PATCH", "user", "1", { name: "Patched" }, new URLSearchParams());
    expect(res.status).toBe(200);
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  it("DELETE returns 204", async () => {
    const res = await handle("DELETE", "user", "1", {}, new URLSearchParams());
    expect(res.status).toBe(204);
    expect(res.data).toBeNull();
  });

  // ─── Guards ───────────────────────────────────────────────────────────────
  it("guard blocks request with 403", async () => {
    const { handle: guardedHandle } = createRouter(prisma as any, {
      guards: {
        user: {
          DELETE: () => "Cannot delete users",
        },
      },
    });
    const res = await guardedHandle("DELETE", "user", "1", {}, new URLSearchParams());
    expect(res.status).toBe(403);
    expect(res.data.error).toBe("Cannot delete users");
  });

  it("guard allows request when returning null", async () => {
    const { handle: guardedHandle } = createRouter(prisma as any, {
      guards: {
        user: {
          DELETE: () => null,
        },
      },
    });
    const res = await guardedHandle("DELETE", "user", "1", {}, new URLSearchParams());
    expect(res.status).toBe(204);
  });

  // ─── Allow list ───────────────────────────────────────────────────────────
  it("blocks model not in allow list", async () => {
    const { handle: restrictedHandle } = createRouter(prisma as any, {
      allow: ["department"],
    });
    const res = await restrictedHandle("GET", "user", null, {}, new URLSearchParams());
    expect(res.status).toBe(404);
  });

  it("allows model in allow list", async () => {
    const { handle: restrictedHandle } = createRouter(prisma as any, {
      allow: ["department"],
    });
    const res = await restrictedHandle("GET", "department", null, {}, new URLSearchParams());
    expect(res.status).toBe(200);
  });

  // ─── Hooks ────────────────────────────────────────────────────────────────
  it("calls beforeOperation hook", async () => {
    const beforeOperation = vi.fn();
    const { handle: hookedHandle } = createRouter(prisma as any, { beforeOperation });
    await hookedHandle("GET", "user", null, {}, new URLSearchParams());
    expect(beforeOperation).toHaveBeenCalledWith(
      expect.objectContaining({ model: "User", method: "GET" })
    );
  });

  it("calls afterOperation hook with result", async () => {
    const afterOperation = vi.fn();
    const { handle: hookedHandle } = createRouter(prisma as any, { afterOperation });
    await hookedHandle("GET", "user", null, {}, new URLSearchParams());
    expect(afterOperation).toHaveBeenCalledWith(
      expect.objectContaining({ model: "User", method: "GET", result: expect.anything() })
    );
  });
});