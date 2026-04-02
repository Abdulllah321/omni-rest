import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrisma } from "./fixtures/mockPrisma";
import { honoAdapter } from "../src/adapters/hono";

// ─── Minimal Hono app mock ────────────────────────────────────────────────────

function makeHonoApp() {
  const routes: Array<{ method: string; path: string; handler: Function }> = [];

  const app = {
    get:    (path: string, h: Function) => routes.push({ method: "GET",    path, handler: h }),
    post:   (path: string, h: Function) => routes.push({ method: "POST",   path, handler: h }),
    put:    (path: string, h: Function) => routes.push({ method: "PUT",    path, handler: h }),
    patch:  (path: string, h: Function) => routes.push({ method: "PATCH",  path, handler: h }),
    delete: (path: string, h: Function) => routes.push({ method: "DELETE", path, handler: h }),
    all:    (path: string, h: Function) => routes.push({ method: "ALL",    path, handler: h }),
    _routes: routes,
  };

  return app;
}

// Build a mock Hono context
function makeContext(
  method: string,
  model: string,
  id?: string,
  body: any = {},
  query: Record<string, string> = {}
) {
  const responses: any[] = [];

  const c: any = {
    req: {
      method,
      param: (key: string) => (key === "model" ? model : key === "id" ? id : undefined),
      query: () => query,
      json: () => Promise.resolve(body),
    },
    json: vi.fn((data: any, status = 200) => {
      const r = { data, status, headers: new Map() };
      responses.push(r);
      return r;
    }),
    _responses: responses,
  };

  return c;
}

// Find and invoke the ALL route handler
async function invokeAll(app: ReturnType<typeof makeHonoApp>, c: any) {
  const route = app._routes.find((r) => r.method === "ALL");
  if (!route) throw new Error("ALL route not registered");
  return route.handler(c);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("honoAdapter", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let app: ReturnType<typeof makeHonoApp>;

  beforeEach(() => {
    prisma = createMockPrisma();
    app = makeHonoApp();
    honoAdapter(app, prisma as any);
  });

  it("registers routes on the app", () => {
    expect(app._routes.length).toBeGreaterThan(0);
  });

  it("GET list returns 200 with data and meta", async () => {
    const c = makeContext("GET", "user");
    await invokeAll(app, c);
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.any(Array) }),
      200
    );
  });

  it("GET by id returns 200", async () => {
    const c = makeContext("GET", "user", "1");
    await invokeAll(app, c);
    expect(c.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 200);
  });

  it("POST returns 201", async () => {
    const c = makeContext("POST", "user", undefined, { name: "Alice" });
    await invokeAll(app, c);
    expect(c.json).toHaveBeenCalledWith(expect.anything(), 201);
  });

  it("PUT returns 200", async () => {
    const c = makeContext("PUT", "user", "1", { name: "Updated" });
    await invokeAll(app, c);
    expect(c.json).toHaveBeenCalledWith(expect.anything(), 200);
  });

  it("DELETE returns 204 (no body)", async () => {
    const c = makeContext("DELETE", "user", "1");
    const result = await invokeAll(app, c);
    // 204 returns a bare Response, not c.json
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(204);
  });

  it("unknown model returns 404", async () => {
    const c = makeContext("GET", "unknownmodel");
    await invokeAll(app, c);
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("not found") }),
      404
    );
  });

  it("guard blocks with 403", async () => {
    const guardedApp = makeHonoApp();
    honoAdapter(guardedApp, prisma as any, {
      guards: { user: { DELETE: () => "Not allowed" } },
    });
    const c = makeContext("DELETE", "user", "1");
    const route = guardedApp._routes.find((r) => r.method === "ALL")!;
    await route.handler(c);
    expect(c.json).toHaveBeenCalledWith({ error: "Not allowed" }, 403);
  });

  it("respects prefix option", () => {
    const prefixedApp = makeHonoApp();
    honoAdapter(prefixedApp, prisma as any, { prefix: "/api" });
    const allRoute = prefixedApp._routes.find((r) => r.method === "ALL");
    expect(allRoute?.path).toBe("/api/:model/:id?");
  });

  it("passes query params as URLSearchParams", async () => {
    const c = makeContext("GET", "user", undefined, {}, { limit: "5" });
    await invokeAll(app, c);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });
});
