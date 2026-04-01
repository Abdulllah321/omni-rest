import { PrismaClient } from '@prisma/client';
import { P as PrismaRestOptions } from '../types-CLcDS1BU.js';

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
declare function fastifyAdapter(fastify: any, prisma: PrismaClient, options?: PrismaRestOptions): void;

export { fastifyAdapter };
