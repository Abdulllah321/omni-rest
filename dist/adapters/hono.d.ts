import { PrismaClient } from '@prisma/client';
import { P as PrismaRestOptions } from '../types-s-sMlBeU.js';

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
declare function honoAdapter(app: any, prisma: PrismaClient, options?: PrismaRestOptions): void;

export { honoAdapter };
