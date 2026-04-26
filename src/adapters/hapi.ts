import { PassThrough } from "stream";
import { PrismaClient } from "@prisma/client";
import { createRouter } from "../router";
import { formatSseEvent, formatSseHeartbeat } from "../subscriptions";
import type { PrismaRestOptions } from "../types";

export interface HapiAdapterOptions extends PrismaRestOptions {
  prisma: PrismaClient;
  prefix?: string;
}

/**
 * Hapi plugin adapter for omni-rest.
 * Registers dynamic REST endpoints directly on the Hapi server instance.
 *
 * @example
 * ```ts
 * import Hapi from "@hapi/hapi";
 * import { PrismaClient } from "@prisma/client";
 * import { hapiAdapter } from "omni-rest/hapi";
 *
 * const prisma = new PrismaClient();
 * const server = Hapi.server({ port: 3000 });
 *
 * await server.register({
 *   plugin: hapiAdapter,
 *   options: {
 *     prisma,
 *     prefix: "/api",
 *     allow: ["product", "category"],
 *   }
 * });
 * ```
 */
export const hapiAdapter = {
  name: "omni-rest",
  version: "1.0.0",
  register: async (server: any, options: HapiAdapterOptions) => {
    if (!options.prisma) {
      throw new Error("[omni-rest/hapi] You must provide the prisma client inside options.prisma");
    }

    const { prisma, prefix = "", ...restOptions } = options;
    const { handle, modelMap, subscriptionBus } = createRouter(prisma, restOptions);
    const heartbeatMs = options.subscription?.heartbeatInterval ?? 30_000;
    const guards = (options.guards ?? {}) as Record<string, any>;
    const fieldGuards = (options.fieldGuards ?? {}) as Record<string, any>;

    const getSearchParams = (request: any): URLSearchParams => {
      const urlParams = new URLSearchParams();
      for (const [key, value] of Object.entries((request.query as Record<string, string>) || {})) {
        if (Array.isArray(value)) {
          value.forEach(v => urlParams.append(key, v));
        } else {
          urlParams.append(key, value);
        }
      }
      return urlParams;
    };

    const handler = async (request: any, h: any) => {
      try {
        const { status, data } = await handle(
          request.method.toUpperCase(),
          request.params.model,
          request.params.id ?? null,
          request.payload ?? {},
          getSearchParams(request)
        );

        if (status === 204) {
          return h.response().code(204);
        }
        return h.response(data).code(status);
      } catch (e: any) {
        return h.response({ error: e.message }).code(500);
      }
    };

    const bulkUpdateHandler = async (request: any, h: any) => {
      try {
        const { status, data } = await handle(
          "PATCH",
          request.params.model,
          null,
          request.payload ?? [],
          getSearchParams(request),
          "bulk-update"
        );
        if (status === 204) return h.response().code(204);
        return h.response(data).code(status);
      } catch (e: any) {
        return h.response({ error: e.message }).code(500);
      }
    };

    const bulkDeleteHandler = async (request: any, h: any) => {
      try {
        const { status, data } = await handle(
          "DELETE",
          request.params.model,
          null,
          request.payload ?? [],
          getSearchParams(request),
          "bulk-delete"
        );
        if (status === 204) return h.response().code(204);
        return h.response(data).code(status);
      } catch (e: any) {
        return h.response({ error: e.message }).code(500);
      }
    };

    // ── SSE: GET /prefix/{model}/subscribe ──────────────────────────────
    // Registered before the generic {model}/{id} route.
    server.route({
      method: "GET",
      path: `${prefix}/{model}/subscribe`,
      handler: async (request: any, h: any) => {
        const modelName: string = request.params.model;
        const meta = modelMap[modelName.toLowerCase()];

        if (!meta) {
          return h.response({ error: `Model "${modelName}" not found or not exposed.` }).code(404);
        }

        const guardError = await subscriptionBus.checkGuard(guards, meta.routeName, { body: {} });
        if (guardError) {
          return h.response({ error: guardError }).code(403);
        }

        const passThrough = new PassThrough();
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

        request.raw.req.on("close", cleanup);
        request.raw.req.on("error", cleanup);

        return h
          .response(passThrough)
          .type("text/event-stream")
          .header("Cache-Control", "no-cache")
          .header("X-Accel-Buffering", "no")
          .code(200);
      },
    });

    // Bulk Operations
    server.route({
      method: "PATCH",
      path: `${prefix}/{model}/bulk/update`,
      handler: bulkUpdateHandler,
    });
    server.route({
      method: "DELETE",
      path: `${prefix}/{model}/bulk/delete`,
      handler: bulkDeleteHandler,
    });

    // Collection endpoints
    server.route({
      method: ["GET", "POST"],
      path: `${prefix}/{model}`,
      handler,
    });

    // Item endpoints
    server.route({
      method: ["GET", "PUT", "PATCH", "DELETE"],
      path: `${prefix}/{model}/{id}`,
      handler,
    });
  },
};
