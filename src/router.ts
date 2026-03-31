import { PrismaClient } from "@prisma/client";
import { getModels, buildModelMap, getDelegate } from "./introspect";
import { buildQuery } from "./query-builder";
import { runGuard, runHook } from "./middleware-helpers";
import type {
  PrismaRestOptions,
  HandlerResult,
  RouterInstance,
  ModelMeta,
} from "./types";

/**
 * Creates a framework-agnostic CRUD router powered by Prisma DMMF.
 *
 * All adapters (Express, Next.js, Fastify) use this under the hood.
 */
export function createRouter(
  prisma: PrismaClient,
  options: PrismaRestOptions = {}
): RouterInstance {
  const {
    allow,
    guards = {},
    beforeOperation,
    afterOperation,
    defaultLimit = 20,
    maxLimit = 100,
  } = options;

  // Introspect schema once at startup
  const models = getModels(prisma);
  const modelMap = buildModelMap(models, allow);

  async function handle(
    method: string,
    modelName: string,
    id: string | null,
    body: any,
    searchParams: URLSearchParams,
    operation?: string
  ): Promise<HandlerResult> {
    // ── 1. Resolve model ───────────────────────────────────────────────────
    const meta = modelMap[modelName.toLowerCase()];
    if (!meta) {
      return {
        status: 404,
        data: {
          error: `Model "${modelName}" not found or not exposed.`,
          available: Object.keys(modelMap),
        },
      };
    }

    // ── 2. Guard check ─────────────────────────────────────────────────────
    const guardError = await runGuard(guards, meta.routeName, method, {
      id,
      body,
    });
    if (guardError) {
      return { status: 403, data: { error: guardError } };
    }

    // ── 3. Before hook ─────────────────────────────────────────────────────
    await runHook(beforeOperation, { model: meta.name, method, id, body });

    // ── 4. Execute operation ───────────────────────────────────────────────
    let result: HandlerResult;

    try {
      result = await executeOperation(
        prisma,
        meta,
        method,
        id,
        body,
        searchParams,
        defaultLimit,
        maxLimit,
        operation
      );
    } catch (e: any) {
      return handlePrismaError(e);
    }

    // ── 5. After hook ──────────────────────────────────────────────────────
    await runHook(afterOperation, {
      model: meta.name,
      method,
      id,
      body,
      result: result.data,
    });

    return result;
  }

  return { handle, modelMap, models };
}

// ─── Operation executor ────────────────────────────────────────────────────────

async function executeOperation(
  prisma: PrismaClient,
  meta: ModelMeta,
  method: string,
  id: string | null,
  body: any,
  searchParams: URLSearchParams,
  defaultLimit: number,
  maxLimit: number,
  operation?: string
): Promise<HandlerResult> {
  const delegate = getDelegate(prisma, meta);
  const { where, orderBy, skip, take, include, select } = buildQuery(
    searchParams,
    defaultLimit,
    maxLimit,
    meta.fields
  );

  // Build include/select args (mutually exclusive in Prisma)
  const includeArg =
    Object.keys(include).length > 0 ? include : undefined;
  const selectArg =
    select && Object.keys(select).length > 0 ? select : undefined;
  const projection = selectArg ? { select: selectArg } : includeArg ? { include: includeArg } : {};

  // ── PATCH /model/bulk/update ────────────────────────────────────────────────
  if (method === "PATCH" && operation === "bulk-update") {
    if (!Array.isArray(body) || body.length === 0) {
      return {
        status: 400,
        data: { error: "Request body must be a non-empty array of update records" },
      };
    }

    // Validate that each item has an id
    for (const item of body) {
      if (!item[meta.idField]) {
        return {
          status: 400,
          data: { error: `Each record must have an ${meta.idField} field` },
        };
      }
    }

    // Execute updates in parallel
    const results = await Promise.all(
      body.map((item) => {
        const id = item[meta.idField];
        const updateData = { ...item };
        delete updateData[meta.idField]; // Remove id from update data

        return delegate.update({
          where: { [meta.idField]: coerceId(id) },
          data: updateData,
          ...projection,
        });
      })
    );

    return {
      status: 200,
      data: {
        updated: results.length,
        records: results,
      },
    };
  }

  // ── DELETE /model/bulk/delete ──────────────────────────────────────────────
  if (method === "DELETE" && operation === "bulk-delete") {
    if (!Array.isArray(body) || body.length === 0) {
      return {
        status: 400,
        data: { error: "Request body must be a non-empty array of IDs" },
      };
    }

    // Handle both array of IDs and array of objects with id field
    const ids = body.map((item: any) =>
      typeof item === "object" ? item[meta.idField] : item
    );

    // Use deleteMany with a where clause
    const result = await delegate.deleteMany({
      where: {
        [meta.idField]: { in: ids.map(coerceId) },
      },
    });

    return {
      status: 200,
      data: {
        deleted: result.count,
      },
    };
  }

  // ── GET /model ─────────────────────────────────────────────────────────────
  if (method === "GET" && !id) {
    const [data, total] = await (prisma as any).$transaction([
      delegate.findMany({ where, orderBy, skip, take, ...projection }),
      delegate.count({ where }),
    ]);

    return {
      status: 200,
      data: {
        data,
        meta: {
          total,
          page: Math.floor(skip / take) + 1,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      },
    };
  }

  // ── GET /model/:id ─────────────────────────────────────────────────────────
  if (method === "GET" && id) {
    const record = await delegate.findUnique({
      where: { [meta.idField]: coerceId(id) },
      ...projection,
    });

    if (!record) {
      return { status: 404, data: { error: `${meta.name} with id "${id}" not found.` } };
    }

    return { status: 200, data: record };
  }

  // ── POST /model ────────────────────────────────────────────────────────────
  if (method === "POST" && !id) {
    const record = await delegate.create({ data: body });
    return { status: 201, data: record };
  }

  // ── PUT /model/:id ─────────────────────────────────────────────────────────
  if ((method === "PUT" || method === "PATCH") && id) {
    const record = await delegate.update({
      where: { [meta.idField]: coerceId(id) },
      data: body,
    });
    return { status: 200, data: record };
  }

  // ── DELETE /model/:id ──────────────────────────────────────────────────────
  if (method === "DELETE" && id) {
    await delegate.delete({
      where: { [meta.idField]: coerceId(id) },
    });
    return { status: 204, data: null };
  }

  return { status: 405, data: { error: `Method ${method} not allowed.` } };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Coerces an ID string to number when possible (common with Int PKs).
 */
function coerceId(id: string): string | number {
  const n = Number(id);
  return isNaN(n) ? id : n;
}

/**
 * Maps Prisma error codes to meaningful HTTP responses.
 */
function handlePrismaError(e: any): HandlerResult {
  const code = e?.code;

  if (code === "P2025") {
    return { status: 404, data: { error: "Record not found." } };
  }
  if (code === "P2002") {
    const fields = e?.meta?.target ?? "unknown fields";
    return {
      status: 409,
      data: { error: `Unique constraint failed on: ${fields}` },
    };
  }
  if (code === "P2003") {
    return { status: 400, data: { error: "Foreign key constraint failed." } };
  }
  if (code === "P2014") {
    return { status: 400, data: { error: "Relation violation." } };
  }

  return { status: 500, data: { error: e?.message ?? "Internal server error." } };
}