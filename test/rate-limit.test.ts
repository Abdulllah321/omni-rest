import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrisma } from "./fixtures/mockPrisma";
import { createRouter } from "../src/router";

describe("rateLimit option", () => {
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it("returns 429 when rateLimit fn returns a string", async () => {
    const { handle } = createRouter(prisma as any, {
      rateLimit: () => "Too many requests. Slow down.",
    });
    const res = await handle("GET", "user", null, {}, new URLSearchParams());
    expect(res.status).toBe(429);
    expect(res.data.error).toBe("Too many requests. Slow down.");
  });

  it("allows request when rateLimit fn returns null", async () => {
    const { handle } = createRouter(prisma as any, {
      rateLimit: () => null,
    });
    const res = await handle("GET", "user", null, {}, new URLSearchParams());
    expect(res.status).toBe(200);
  });

  it("supports async rateLimit function", async () => {
    const { handle } = createRouter(prisma as any, {
      rateLimit: async () => {
        await Promise.resolve();
        return "Rate limit exceeded";
      },
    });
    const res = await handle("GET", "user", null, {}, new URLSearchParams());
    expect(res.status).toBe(429);
    expect(res.data.error).toBe("Rate limit exceeded");
  });

  it("rateLimit runs before guard — guard not called when rate limited", async () => {
    const guard = vi.fn().mockReturnValue(null);
    const { handle } = createRouter(prisma as any, {
      rateLimit: () => "Rate limited",
      guards: { user: { GET: guard } },
    });
    await handle("GET", "user", null, {}, new URLSearchParams());
    expect(guard).not.toHaveBeenCalled();
  });

  it("rateLimit not called for unknown model (404 returned first)", async () => {
    const rateLimitFn = vi.fn().mockReturnValue(null);
    const { handle } = createRouter(prisma as any, { rateLimit: rateLimitFn });
    const res = await handle("GET", "unknownmodel", null, {}, new URLSearchParams());
    expect(res.status).toBe(404);
    expect(rateLimitFn).not.toHaveBeenCalled();
  });

  it("passes model name and method to rateLimit context", async () => {
    const rateLimitFn = vi.fn().mockReturnValue(null);
    const { handle } = createRouter(prisma as any, { rateLimit: rateLimitFn });
    await handle("POST", "user", null, { name: "Test" }, new URLSearchParams());
    expect(rateLimitFn).toHaveBeenCalledWith(
      expect.objectContaining({ model: "User", method: "POST" })
    );
  });

  it("passes id to rateLimit context for single-record operations", async () => {
    const rateLimitFn = vi.fn().mockReturnValue(null);
    const { handle } = createRouter(prisma as any, { rateLimit: rateLimitFn });
    await handle("GET", "user", "42", {}, new URLSearchParams());
    expect(rateLimitFn).toHaveBeenCalledWith(
      expect.objectContaining({ id: "42" })
    );
  });

  it("guard still runs and blocks when rateLimit allows", async () => {
    const { handle } = createRouter(prisma as any, {
      rateLimit: () => null,
      guards: { user: { DELETE: () => "Cannot delete" } },
    });
    const res = await handle("DELETE", "user", "1", {}, new URLSearchParams());
    expect(res.status).toBe(403);
    expect(res.data.error).toBe("Cannot delete");
  });
});
