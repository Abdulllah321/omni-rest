import { PrismaClient } from "@prisma/client";
import { createRouter } from "../router";
import type { PrismaRestOptions } from "../types";

/**
 * Hono adapter for omni-rest.
 * Works on Cloudflare Workers, Bun, Deno, and Node.js.
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { PrismaClient } from "@prisma/client";
 * import { honoAdapter } from "omni-rest/hono";
 *
 * const app = new Hono();
 * const prisma = new PrismaClient();
 *
 * honoAdapter(app, prisma, {
 *   prefix: "/api",
 *   allow: ["department", "category"],
 * });
 *
 * export default app;
 * ```
 */
export function honoAdapter(
  app: any,
  prisma: PrismaClient,
  options: PrismaRestOptions = {}
): void {
  const { handle } = createRouter(prisma, options);
  const prefix = options.prefix ?? "";

  // Helper: build URLSearchParams from Hono's query object
  function toSearchParams(query: Record<string, string | string[]>): URLSearchParams {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (Array.isArray(v)) {
        v.forEach((val) => params.append(k, val));
      } else {
        params.set(k, v);
      }
    }
    return params;
  }

  // ── POST /prefix/:model/bulk — createMany ──────────────────────────────────
  app.post(`${prefix}/:model/bulk`, async (c: any) => {
    try {
      const body = await c.req.json().catch(() => []);
      const { status, data, headers } = await handle(
        "POST", c.req.param("model"), "bulk", body,
        toSearchParams(c.req.query())
      );
      const res = c.json(data, status);
      if (headers) Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // ── PUT /prefix/:model/bulk — updateMany ───────────────────────────────────
  app.put(`${prefix}/:model/bulk`, async (c: any) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const { status, data, headers } = await handle(
        "PUT", c.req.param("model"), "bulk", body,
        toSearchParams(c.req.query())
      );
      const res = c.json(data, status);
      if (headers) Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // ── DELETE /prefix/:model/bulk — deleteMany ────────────────────────────────
  app.delete(`${prefix}/:model/bulk`, async (c: any) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const { status, data, headers } = await handle(
        "DELETE", c.req.param("model"), "bulk", body,
        toSearchParams(c.req.query())
      );
      const res = c.json(data, status);
      if (headers) Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // ── All other CRUD routes ──────────────────────────────────────────────────
  app.all(`${prefix}/:model/:id?`, async (c: any) => {
    try {
      const method = c.req.method.toUpperCase();
      const model = c.req.param("model");
      const id = c.req.param("id") ?? null;

      let body: any = {};
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        body = await c.req.json().catch(() => ({}));
      }

      const { status, data, headers } = await handle(
        method, model, id, body,
        toSearchParams(c.req.query())
      );

      if (status === 204) {
        return new Response(null, { status: 204 });
      }

      const res = c.json(data, status);
      if (headers) Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });
}
