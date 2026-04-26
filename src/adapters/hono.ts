import { PrismaClient } from "@prisma/client";
import { createRouter } from "../router";
import { formatSseEvent, formatSseHeartbeat } from "../subscriptions";
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
  const { handle, modelMap, subscriptionBus } = createRouter(prisma, options);
  const prefix = options.prefix ?? "";
  const heartbeatMs = options.subscription?.heartbeatInterval ?? 30_000;
  const guards = (options.guards ?? {}) as Record<string, any>;
  const fieldGuards = (options.fieldGuards ?? {}) as Record<string, any>;

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

  // ── SSE: GET /prefix/:model/subscribe ───────────────────────────────
  //
  // @warning This route uses Node.js streaming APIs and is intended for
  // Node.js/Bun/Deno deployments only. Cloudflare Workers and similar
  // edge runtimes cannot maintain long-lived SSE connections because they
  // impose a maximum response duration at the platform level.
  app.get(`${prefix}/:model/subscribe`, async (c: any) => {
    const modelName: string = c.req.param("model");
    const meta = modelMap[modelName.toLowerCase()];

    if (!meta) {
      return c.json({ error: `Model "${modelName}" not found or not exposed.` }, 404);
    }

    const guardError = await subscriptionBus.checkGuard(guards, meta.routeName, { body: {} });
    if (guardError) {
      return c.json({ error: guardError }, 403);
    }

    const fg = fieldGuards[meta.routeName];
    const encoder = new TextEncoder();

    let controllerRef: ReadableStreamDefaultController | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let unsubscribeFn: (() => void) | null = null;

    const readable = new ReadableStream({
      start(controller) {
        controllerRef = controller;

        subscriptionBus.subscribe(
          meta,
          (event) => {
            try { controller.enqueue(encoder.encode(formatSseEvent(event))); } catch { /* stream closed */ }
          },
          fg
        ).then((unsub) => {
          unsubscribeFn = unsub;
          heartbeatTimer = setInterval(() => {
            try { controller.enqueue(encoder.encode(formatSseHeartbeat())); } catch { /* stream closed */ }
          }, heartbeatMs);
        });
      },
      cancel() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (unsubscribeFn) unsubscribeFn();
        controllerRef = null;
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  });

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
