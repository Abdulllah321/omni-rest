import { PrismaClient } from '@prisma/client';
import { P as PrismaRestOptions } from '../types-jvppYvku.js';

/**
 * Next.js App Router adapter for omni-rest.
 *
 * @example
 * ```ts
 * // app/api/[...prismaRest]/route.ts
 * import { PrismaClient } from "@prisma/client";
 * import { nextjsAdapter } from "omni-rest/nextjs";
 *
 * const prisma = new PrismaClient();
 * const handler = nextjsAdapter(prisma, {
 *   allow: ["department", "category"],
 * });
 *
 * export const GET = handler;
 * export const POST = handler;
 * export const PUT = handler;
 * export const PATCH = handler;
 * export const DELETE = handler;
 * ```
 *
 * This covers:
 *   GET    /api/department
 *   POST   /api/department
 *   GET    /api/department/5
 *   PUT    /api/department/5
 *   PATCH  /api/department/5
 *   DELETE /api/department/5
 *   PATCH  /api/department/bulk/update
 *   DELETE /api/department/bulk/delete
 */
declare function nextjsAdapter(prisma: PrismaClient, options?: PrismaRestOptions): (req: Request, context: {
    params: {
        prismaRest: string[];
    };
}) => Promise<Response>;

export { nextjsAdapter };
