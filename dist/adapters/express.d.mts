import { PrismaClient } from '@prisma/client';
import { P as PrismaRestOptions } from '../types-CShjjCHN.mjs';

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
declare function expressAdapter(prisma: PrismaClient, options?: PrismaRestOptions): any;

export { expressAdapter };
