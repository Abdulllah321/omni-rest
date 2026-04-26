import { PrismaClient } from "@prisma/client";
import { createRouter } from "../router";
import { formatSseEvent, formatSseHeartbeat } from "../subscriptions";
import type { PrismaRestOptions } from "../types";

/**
 * Fastify adapter for omni-rest.
 *
 * @example
 * ```ts
 * import Fastify from "fastify";
 * import { PrismaClient } from "@prisma/client";
 * import { fastifyAdapter } from "omni-rest/fastify";
 *
 * const app = Fastify();
 * const prisma = new PrismaClient();
 *
 * fastifyAdapter(app, prisma, {
 *   prefix: "/api",
 *   allow: ["department", "category"],
 * });
 *
 * app.listen({ port: 3000 });
 * ```
 */
export function fastifyAdapter(
  fastify: any,
  prisma: PrismaClient,
  options: PrismaRestOptions = {}
) {
  const { handle, modelMap, subscriptionBus } = createRouter(prisma, options);
  const prefix = options.prefix ?? "/api";
  const heartbeatMs = options.subscription?.heartbeatInterval ?? 30_000;
  const guards = (options.guards ?? {}) as Record<string, any>;
  const fieldGuards = (options.fieldGuards ?? {}) as Record<string, any>;

  // ── SSE: GET /prefix/:model/subscribe ─────────────────────────────
  // Must be registered before the generic /:model/:id route.
  fastify.get(`${prefix}/:model/subscribe`, async (request: any, reply: any) => {
    const modelName: string = request.params.model;
    const meta = modelMap[modelName.toLowerCase()];

    if (!meta) {
      return reply.status(404).send({ error: `Model "${modelName}" not found or not exposed.` });
    }

    const guardError = await subscriptionBus.checkGuard(guards, meta.routeName, { body: {} });
    if (guardError) {
      return reply.status(403).send({ error: guardError });
    }

    const raw = reply.raw;
    raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const fg = fieldGuards[meta.routeName];

    const unsubscribe = await subscriptionBus.subscribe(
      meta,
      (event) => { raw.write(formatSseEvent(event)); },
      fg
    );

    const heartbeat = setInterval(() => { raw.write(formatSseHeartbeat()); }, heartbeatMs);

    const cleanup = () => {
      clearInterval(heartbeat);
      unsubscribe();
    };

    raw.on("close", cleanup);
    raw.on("error", cleanup);

    // Keep the Fastify reply open — return a never-resolving promise
    return new Promise<void>(() => { /* closed by client disconnect */ });
  });

  async function routeHandler(request: any, reply: any) {
    const { model, id } = request.params;
    const body = request.body ?? {};
    const query = request.query ?? {};

    const searchParams = new URLSearchParams(
      Object.entries(query as Record<string, string>)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")
    );

    const { status, data } = await handle(
      request.method,
      model,
      id ?? null,
      body,
      searchParams
    );

    if (status === 204) {
      return reply.status(204).send();
    }

    return reply.status(status).send(data);
  }

  async function bulkHandler(request: any, reply: any, operation: string) {
    const { model } = request.params;
    const body = request.body ?? [];
    const query = request.query ?? {};

    const searchParams = new URLSearchParams(
      Object.entries(query as Record<string, string>)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")
    );

    const { status, data } = await handle(
      operation.includes("update") ? "PATCH" : "DELETE",
      model,
      null,
      body,
      searchParams,
      operation
    );

    if (status === 204) {
      return reply.status(204).send();
    }

    return reply.status(status).send(data);
  }

  // Standard CRUD routes
  fastify.get(`${prefix}/:model`, routeHandler);
  fastify.post(`${prefix}/:model`, routeHandler);
  fastify.get(`${prefix}/:model/:id`, routeHandler);
  fastify.put(`${prefix}/:model/:id`, routeHandler);
  fastify.patch(`${prefix}/:model/:id`, routeHandler);
  fastify.delete(`${prefix}/:model/:id`, routeHandler);

  // Bulk operation routes (using closures to capture operation parameter)
  fastify.patch(`${prefix}/:model/bulk/update`, async (request: any, reply: any) => {
    await bulkHandler(request, reply, "bulk-update");
  });
  fastify.delete(`${prefix}/:model/bulk/delete`, async (request: any, reply: any) => {
    await bulkHandler(request, reply, "bulk-delete");
  });
}