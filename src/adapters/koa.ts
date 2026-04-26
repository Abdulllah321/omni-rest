import { PassThrough } from "stream";
import { PrismaClient } from "@prisma/client";
import { createRouter } from "../router";
import { formatSseEvent, formatSseHeartbeat } from "../subscriptions";
import type { PrismaRestOptions } from "../types";

/**
 * Koa adapter for omni-rest.
 * Allows using omni-rest within a Koa application using @koa/router.
 *
 * @example
 * ```ts
 * import Koa from "koa";
 * import bodyParser from "koa-bodyparser";
 * import Router from "@koa/router";
 * import { PrismaClient } from "@prisma/client";
 * import { koaAdapter } from "omni-rest/koa";
 *
 * const app = new Koa();
 * const router = new Router({ prefix: "/api" });
 * const prisma = new PrismaClient();
 *
 * app.use(bodyParser());
 * koaAdapter(router, prisma, {
 *   allow: ["product", "category"],
 * });
 *
 * app.use(router.routes());
 * ```
 */
export function koaAdapter(
  router: any,
  prisma: PrismaClient,
  options: PrismaRestOptions = {}
) {
  const { handle, modelMap, subscriptionBus } = createRouter(prisma, options);
  const heartbeatMs = options.subscription?.heartbeatInterval ?? 30_000;
  const guards = (options.guards ?? {}) as Record<string, any>;
  const fieldGuards = (options.fieldGuards ?? {}) as Record<string, any>;

  // Helper to extract query as URLSearchParams
  const getSearchParams = (ctx: any): URLSearchParams => {
    return new URLSearchParams(
      Object.entries(ctx.query as Record<string, string>)
        .map(([k, v]) => `${k}=${v}`)
        .join("&")
    );
  };

  // ── SSE: GET /:model/subscribe ────────────────────────────────────────
  // Must be registered BEFORE /:model/:id.
  router.get("/:model/subscribe", async (ctx: any) => {
    const modelName: string = ctx.params.model;
    const meta = modelMap[modelName.toLowerCase()];

    if (!meta) {
      ctx.status = 404;
      ctx.body = { error: `Model "${modelName}" not found or not exposed.` };
      return;
    }

    const guardError = await subscriptionBus.checkGuard(guards, meta.routeName, { body: {} });
    if (guardError) {
      ctx.status = 403;
      ctx.body = { error: guardError };
      return;
    }

    ctx.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });
    ctx.status = 200;

    const passThrough = new PassThrough();
    ctx.body = passThrough;

    const fg = fieldGuards[meta.routeName];

    const unsubscribe = await subscriptionBus.subscribe(
      meta,
      (event) => { passThrough.write(formatSseEvent(event)); },
      fg
    );

    const heartbeat = setInterval(() => { passThrough.write(formatSseHeartbeat()); }, heartbeatMs);

    const cleanup = () => {
      clearInterval(heartbeat);
      unsubscribe();
      passThrough.end();
    };

    ctx.req.on("close", cleanup);
    ctx.req.on("error", cleanup);
  });

  // Internal Koa handler
  const koaHandler = async (ctx: any) => {
    try {
      const { status, data } = await handle(
        ctx.method,
        ctx.params.model,
        ctx.params.id ?? null,
        (ctx.request as any).body ?? {},
        getSearchParams(ctx)
      );

      ctx.status = status;
      if (status !== 204) {
        ctx.body = data;
      }
    } catch (e: any) {
      ctx.status = 500;
      ctx.body = { error: e.message };
    }
  };

  // Bulk Operations
  router.patch("/:model/bulk/update", async (ctx: any) => {
    try {
      const { status, data } = await handle(
        "PATCH",
        ctx.params.model,
        null,
        (ctx.request as any).body ?? [],
        getSearchParams(ctx),
        "bulk-update"
      );

      ctx.status = status;
      if (status !== 204) {
        ctx.body = data;
      }
    } catch (e: any) {
      ctx.status = 500;
      ctx.body = { error: e.message };
    }
  });

  router.delete("/:model/bulk/delete", async (ctx: any) => {
    try {
      const { status, data } = await handle(
        "DELETE",
        ctx.params.model,
        null,
        (ctx.request as any).body ?? [],
        getSearchParams(ctx),
        "bulk-delete"
      );

      ctx.status = status;
      if (status !== 204) {
        ctx.body = data;
      }
    } catch (e: any) {
      ctx.status = 500;
      ctx.body = { error: e.message };
    }
  });

  // GET + POST /model
  router.get("/:model", koaHandler);
  router.post("/:model", koaHandler);

  // GET + PUT + PATCH + DELETE /model/:id
  router.get("/:model/:id", koaHandler);
  router.put("/:model/:id", koaHandler);
  router.patch("/:model/:id", koaHandler);
  router.delete("/:model/:id", koaHandler);

  return router;
}
