import { PrismaClient } from "@prisma/client";
import { createRouter } from "../router";
import type { PrismaRestOptions } from "../types";

/**
 * Fastify adapter for prisma-rest.
 *
 * @example
 * ```ts
 * import Fastify from "fastify";
 * import { PrismaClient } from "@prisma/client";
 * import { fastifyAdapter } from "prisma-rest/fastify";
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
  const { handle } = createRouter(prisma, options);
  const prefix = options.prefix ?? "/api";

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