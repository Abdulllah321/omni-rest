import { PrismaClient } from "@prisma/client";
import { createRouter } from "../router";
import type { PrismaRestOptions } from "../types";

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
export function nextjsAdapter(
  prisma: PrismaClient,
  options: PrismaRestOptions = {}
) {
  const { handle } = createRouter(prisma, options);

  return async function handler(
    req: Request,
    context: { params: { prismaRest: string[] } }
  ): Promise<Response> {
    const segments = context.params.prismaRest ?? [];
    const [modelName, ...pathSegments] = segments;

    if (!modelName) {
      return Response.json(
        { error: "No model specified in path." },
        { status: 400 }
      );
    }

    const url = new URL(req.url);

    let body: any = {};
    if (req.method !== "GET" && req.method !== "DELETE") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    // Detect bulk operations
    let operation: string | undefined;
    let id: string | null = null;

    if (pathSegments[0] === "bulk" && pathSegments[1] === "update") {
      operation = "bulk-update";
    } else if (pathSegments[0] === "bulk" && pathSegments[1] === "delete") {
      operation = "bulk-delete";
    } else {
      id = pathSegments[0] ?? null;
    }

    const { status, data } = await handle(
      req.method,
      modelName,
      id,
      body,
      url.searchParams,
      operation
    );

    if (status === 204) {
      return new Response(null, { status: 204 });
    }

    return Response.json(data, { status });
  };
}