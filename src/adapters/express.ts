import { PrismaClient } from "@prisma/client";
import { createRouter } from "../router";
import { formatSseEvent, formatSseHeartbeat } from "../subscriptions";
import type { PrismaRestOptions } from "../types";

/**
 * Express adapter for omni-rest.
 *
 * @example
 * ```ts
 * import express from "express";
 * import { PrismaClient } from "@prisma/client";
 * import { expressAdapter } from "omni-rest/express";
 *
 * const app = express();
 * const prisma = new PrismaClient();
 *
 * app.use(express.json());
 * app.use("/api", expressAdapter(prisma, {
 *   allow: ["department", "category", "city"],
 * }));
 *
 * // Auto-generates:
 * // GET    /api/department
 * // POST   /api/department
 * // GET    /api/department/:id
 * // PUT    /api/department/:id
 * // PATCH  /api/department/:id
 * // DELETE /api/department/:id
 * // PATCH  /api/department/bulk/update
 * // DELETE /api/department/bulk/delete
 * ```
 */
export function expressAdapter(
  prisma: PrismaClient,
  options: PrismaRestOptions = {}
) {
  // Lazy require so express stays optional peer dep
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Router } = require("express");
  const router = Router();
  const { handle, modelMap, subscriptionBus } = createRouter(prisma, options);

  const heartbeatMs = options.subscription?.heartbeatInterval ?? 30_000;
  const guards = (options.guards ?? {}) as Record<string, any>;
  const fieldGuards = (options.fieldGuards ?? {}) as Record<string, any>;

  // ── SSE: GET /:model/subscribe ────────────────────────────────────────
  // Registered BEFORE /:model/:id so the literal "subscribe" is not treated as :id.
  router.get("/:model/subscribe", async (req: any, res: any) => {
    const modelName: string = req.params.model;
    const meta = modelMap[modelName.toLowerCase()];

    if (!meta) {
      return res.status(404).json({ error: `Model "${modelName}" not found or not exposed.` });
    }

    // Guard check — re-use existing GET guard
    const guardError = await subscriptionBus.checkGuard(guards, meta.routeName, { body: {} });
    if (guardError) {
      return res.status(403).json({ error: guardError });
    }

    // Open SSE stream
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
    res.flushHeaders();

    const fg = fieldGuards[meta.routeName];

    const unsubscribe = await subscriptionBus.subscribe(
      meta,
      (event) => { res.write(formatSseEvent(event)); },
      fg
    );

    const heartbeat = setInterval(() => { res.write(formatSseHeartbeat()); }, heartbeatMs);

    const cleanup = () => {
      clearInterval(heartbeat);
      unsubscribe();
    };

    req.on("close", cleanup);
    req.on("error", cleanup);
  });

  // PATCH + DELETE /model/bulk/update and /model/bulk/delete
  router.patch("/:model/bulk/update", async (req: any, res: any) => {
    try {
      const { status, data, headers } = await handle(
        "PATCH",
        req.params.model,
        null,
        req.body ?? [],
        new URLSearchParams(
          Object.entries(req.query as Record<string, string>)
            .map(([k, v]) => `${k}=${v}`)
            .join("&")
        ),
        "bulk-update"
      );
      if (headers) Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      if (status === 204) return res.sendStatus(204);
      return res.status(status).json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  router.delete("/:model/bulk/delete", async (req: any, res: any) => {
    try {
      const { status, data, headers } = await handle(
        "DELETE",
        req.params.model,
        null,
        req.body ?? [],
        new URLSearchParams(
          Object.entries(req.query as Record<string, string>)
            .map(([k, v]) => `${k}=${v}`)
            .join("&")
        ),
        "bulk-delete"
      );
      if (headers) Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      if (status === 204) return res.sendStatus(204);
      return res.status(status).json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // GET + POST /model
  router.route("/:model").get(handler).post(handler);

  // GET + PUT + PATCH + DELETE /model/:id
  router
    .route("/:model/:id")
    .get(handler)
    .put(handler)
    .patch(handler)
    .delete(handler);

  async function handler(req: any, res: any) {
    try {
      const { status, data, headers } = await handle(
        req.method,
        req.params.model,
        req.params.id ?? null,
        req.body ?? {},
        new URLSearchParams(
          Object.entries(req.query as Record<string, string>)
            .map(([k, v]) => `${k}=${v}`)
            .join("&")
        )
      );

      if (headers) Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      if (status === 204) return res.sendStatus(204);
      return res.status(status).json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return router;
}

/**
 * Express error-handling middleware that maps Prisma error codes to clean
 * JSON responses. Mount it after all routes to catch Prisma errors from
 * both omni-rest and your own custom routes.
 *
 * @example
 * ```ts
 * import { expressAdapter, omniRestErrorHandler } from "omni-rest/express";
 *
 * app.use("/api", expressAdapter(prisma));
 * app.use("/custom", myCustomRoutes);
 * app.use(omniRestErrorHandler());
 * ```
 */
export function omniRestErrorHandler() {
  // Standard Express 4-argument error middleware
  return function (err: any, _req: any, res: any, next: any) {
    const code = err?.code;

    if (code === "P2025") {
      return res.status(404).json({ error: "Record not found." });
    }
    if (code === "P2002") {
      const fields = err?.meta?.target ?? "unknown fields";
      return res.status(409).json({ error: `Unique constraint failed on: ${fields}` });
    }
    if (code === "P2003") {
      return res.status(400).json({ error: "Foreign key constraint failed." });
    }
    if (code === "P2014") {
      return res.status(400).json({ error: "Relation violation." });
    }

    // Not a known Prisma error — pass through to next error handler
    if (!code) {
      return next(err);
    }

    return res.status(500).json({ error: err?.message ?? "Internal server error." });
  };
}