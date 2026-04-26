import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrisma } from "./fixtures/mockPrisma";
import { createRouter } from "../src/router";

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

  // ─── Envelope ─────────────────────────────────────────────────────────────
  it("GET list returns { data, meta } by default (envelope: true)", async () => {
    const res = await handle("GET", "user", null, {}, new URLSearchParams());
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("data");
    expect(res.data).toHaveProperty("meta");
    expect(res.headers).toBeUndefined();
  });

  it("GET list returns plain array when envelope: false", async () => {
    const { handle: flatHandle } = createRouter(prisma as any, { envelope: false });
    const res = await flatHandle("GET", "user", null, {}, new URLSearchParams());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).not.toHaveProperty("meta");
  });

  it("sets X-Total-Count header when envelope: false", async () => {
    const { handle: flatHandle } = createRouter(prisma as any, { envelope: false });
    const res = await flatHandle("GET", "user", null, {}, new URLSearchParams());
    expect(res.headers?.["X-Total-Count"]).toBeDefined();
    expect(Number(res.headers?.["X-Total-Count"])).toBeGreaterThanOrEqual(0);
  });

  it("GET by id is not affected by envelope: false", async () => {
    const { handle: flatHandle } = createRouter(prisma as any, { envelope: false });
    const res = await flatHandle("GET", "user", "1", {}, new URLSearchParams());
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("id");
  });

  // ─── Cursor Pagination ────────────────────────────────────────────────────
  describe("cursor pagination", () => {
    it("returns nextCursor and hasMore instead of page/total in meta", async () => {
      const { handle: cursorHandle } = createRouter(prisma as any, { paginationMode: "cursor" });
      
      // Mock findMany to return 20 items (simulating hasMore = true)
      const mockData = Array.from({ length: 20 }).map((_, i) => ({ id: i + 1, name: `User ${i}` }));
      prisma.user.findMany.mockResolvedValueOnce(mockData);

      const res = await cursorHandle("GET", "user", null, {}, new URLSearchParams("limit=20"));
      expect(res.status).toBe(200);
      expect(res.data.meta).not.toHaveProperty("total");
      expect(res.data.meta).not.toHaveProperty("page");
      expect(res.data.meta).toHaveProperty("hasMore", true);
      expect(res.data.meta).toHaveProperty("nextCursor");
      expect(typeof res.data.meta.nextCursor).toBe("string");
      
      // Verify count is NOT called
      expect(prisma.user.count).not.toHaveBeenCalled();
    });

    it("hasMore is false and nextCursor is null when items returned < limit", async () => {
      const { handle: cursorHandle } = createRouter(prisma as any, { paginationMode: "cursor" });
      
      // Return 15 items when limit is 20
      const mockData = Array.from({ length: 15 }).map((_, i) => ({ id: i + 1, name: `User ${i}` }));
      prisma.user.findMany.mockResolvedValueOnce(mockData);

      const res = await cursorHandle("GET", "user", null, {}, new URLSearchParams("limit=20"));
      expect(res.data.meta).toHaveProperty("hasMore", false);
      expect(res.data.meta).toHaveProperty("nextCursor", null);
    });

    it("uses headers when envelope is false", async () => {
      const { handle: cursorHandle } = createRouter(prisma as any, { paginationMode: "cursor", envelope: false });
      
      const mockData = Array.from({ length: 20 }).map((_, i) => ({ id: i + 1, name: `User ${i}` }));
      prisma.user.findMany.mockResolvedValueOnce(mockData);

      const res = await cursorHandle("GET", "user", null, {}, new URLSearchParams("limit=20"));
      expect(res.headers?.["X-Has-More"]).toBe("true");
      expect(res.headers?.["X-Next-Cursor"]).toBeDefined();
      expect(res.headers?.["X-Total-Count"]).toBeUndefined();
    });

    it("falls back gracefully if cursor record does not exist (P2025)", async () => {
      const { handle: cursorHandle } = createRouter(prisma as any, { paginationMode: "cursor" });
      
      // Simulate Prisma error P2025 (Record not found)
      prisma.user.findMany.mockRejectedValueOnce({ code: "P2025", message: "Record not found" });

      const res = await cursorHandle("GET", "user", null, {}, new URLSearchParams("cursor=eyJpZCI6OTk5fQ=="));
      
      // It should gracefully return an empty array and hasMore: false, not a 404 or 500 error
      expect(res.status).toBe(200);
      expect(res.data.data).toEqual([]);
      expect(res.data.meta).toEqual({ hasMore: false, nextCursor: null });
    });
    
    it("can override paginationMode via search params", async () => {
      const res = await handle("GET", "user", null, {}, new URLSearchParams("paginationMode=cursor&limit=10"));
      expect(res.data.meta).toHaveProperty("hasMore");
      expect(res.data.meta).not.toHaveProperty("total");
    });
  });

  // ─── Aggregation ─────────────────────────────────────────────────────────
  describe("aggregation endpoints", () => {
    it("GET /aggregate maps to delegate.aggregate", async () => {
      prisma.user.aggregate.mockResolvedValueOnce({ _all: 42 });
      const res = await handle("GET", "user", "aggregate", {}, new URLSearchParams("_count=*&_sum=salary"));
      expect(res.status).toBe(200);
      expect(prisma.user.aggregate).toHaveBeenCalledWith(expect.objectContaining({
        _count: { _all: true },
        _sum: { salary: true }
      }));
    });

    it("GET /groupBy maps to delegate.groupBy", async () => {
      prisma.user.groupBy.mockResolvedValueOnce([{ departmentId: 1, _sum: { salary: 100 } }]);
      const res = await handle("GET", "user", "groupBy", {}, new URLSearchParams("by=departmentId&_sum=salary"));
      expect(res.status).toBe(200);
      expect(prisma.user.groupBy).toHaveBeenCalledWith(expect.objectContaining({
        by: ["departmentId"],
        _sum: { salary: true }
      }));
    });

    it("returns 400 if /groupBy lacks 'by' param", async () => {
      const res = await handle("GET", "user", "groupBy", {}, new URLSearchParams("_sum=salary"));
      expect(res.status).toBe(400);
    });

    it("blocks aggregation if features.aggregation is false", async () => {
      const { handle: noAggHandle } = createRouter(prisma as any, { features: { aggregation: false } });
      const res = await noAggHandle("GET", "user", "aggregate", {}, new URLSearchParams());
      expect(res.status).toBe(403);
    });
  });

  // ─── Complexity ─────────────────────────────────────────────────────────
  describe("complexity scoring", () => {
    it("allows query under maxScore", async () => {
      const { handle: compHandle } = createRouter(prisma as any, { 
        complexity: { maxScore: 100, rules: { perInclude: 10, perLimit100: 5 } } 
      });
      const res = await compHandle("GET", "user", null, {}, new URLSearchParams("include=posts&limit=50"));
      expect(res.status).toBe(200);
    });

    it("blocks query over maxScore with 429", async () => {
      const { handle: compHandle } = createRouter(prisma as any, { 
        maxLimit: 1000,
        complexity: { maxScore: 50, rules: { perInclude: 20, perLimit100: 10 } } 
      });
      // score: 3 includes (60) + limit=500 (50) = 110 > 50
      const res = await compHandle("GET", "user", null, {}, new URLSearchParams("include=posts,comments,tags&limit=500"));
      expect(res.status).toBe(429);
      expect(res.data.error).toBe("Query too complex");
      expect(res.data.score).toBe(110);
    });
  });
});
