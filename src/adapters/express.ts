import { PrismaClient } from "@prisma/client";
import { createRouter } from "../router";
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
  const { handle } = createRouter(prisma, options);

  // PATCH + DELETE /model/bulk/update and /model/bulk/delete
  router.patch("/:model/bulk/update", async (req: any, res: any) => {
    try {
      const { status, data } = await handle(
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
      if (status === 204) {
        return res.sendStatus(204);
      }
      return res.status(status).json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  router.delete("/:model/bulk/delete", async (req: any, res: any) => {
    try {
      const { status, data } = await handle(
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
      if (status === 204) {
        return res.sendStatus(204);
      }
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
      const { status, data } = await handle(
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

      if (status === 204) {
        return res.sendStatus(204);
      }

      return res.status(status).json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return router;
}