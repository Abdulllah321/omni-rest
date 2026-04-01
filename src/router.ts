import { PrismaClient } from "@prisma/client";
import { getModels, buildModelMap, getDelegate, detectSoftDeleteField } from "./introspect";
import { buildQuery } from "./query-builder";
import { runGuard, runHook } from "./middleware-helpers";
import type {
  PrismaRestOptions,
  HandlerResult,
  RouterInstance,
  ModelMeta,
  FieldGuardConfig,
  RateLimitFn,
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
    softDelete = false,
    softDeleteField,
    envelope = true,
    fieldGuards = {},
    rateLimit,
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

    // ── 2. Rate limit check ────────────────────────────────────────────────
    if (rateLimit) {
      const rateLimitError = await rateLimit({ model: meta.name, method, id });
      if (rateLimitError) {
        return { status: 429, data: { error: rateLimitError } };
      }
    }

    // ── 3. Guard check ─────────────────────────────────────────────────────
    const guardError = await runGuard(guards, meta.routeName, method, {
      id,
      body,
    });
    if (guardError) {
      return { status: 403, data: { error: guardError } };
    }

    // ── 4. Before hook ─────────────────────────────────────────────────────
    await runHook(beforeOperation, { model: meta.name, method, id, body });

    // ── 5. Execute operation ───────────────────────────────────────────────
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
        operation,
        softDelete,
        softDeleteField,
        envelope,
        fieldGuards[meta.routeName]
      );
    } catch (e: any) {
      return handlePrismaError(e);
    }

    // ── 6. After hook ──────────────────────────────────────────────────────
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
  operation?: string,
  softDelete = false,
  softDeleteField?: string,
  envelope = true,
  fg?: FieldGuardConfig
): Promise<HandlerResult> {
  const delegate = getDelegate(prisma, meta);
  const { where, orderBy, skip, take, include, select } = buildQuery(
    searchParams,
    defaultLimit,
    maxLimit,
    meta.fields
  );

  // Build include/select args (mutually exclusive in Prisma)
  const includeArg = Object.keys(include).length > 0 ? include : undefined;
  const selectArg = select && Object.keys(select).length > 0 ? select : undefined;
  const projection = selectArg ? { select: selectArg } : includeArg ? { include: includeArg } : {};

  // Sanitize write body — strip readOnly fields before passing to Prisma
  const safeBody = sanitizeBody(body, fg);

  // ── POST /model/bulk — createMany ──────────────────────────────────────────
  if (method === "POST" && id === "bulk") {
    if (!Array.isArray(body) || body.length === 0) {
      return { status: 400, data: { error: "Request body must be a non-empty array" } };
    }
    const result = await delegate.createMany({ data: body });
    return { status: 201, data: { count: result.count } };
  }

  // ── PUT /model/bulk — updateMany ───────────────────────────────────────────
  if (method === "PUT" && id === "bulk") {
    const { where: bulkWhere, data: bulkData } = body || {};
    if (!bulkWhere || !bulkData) {
      return { status: 400, data: { error: "Body must contain { where, data }" } };
    }
    const result = await delegate.updateMany({ where: bulkWhere, data: bulkData });
    return { status: 200, data: { count: result.count } };
  }

  // ── DELETE /model/bulk — deleteMany ───────────────────────────────────────
  if (method === "DELETE" && id === "bulk") {
    const { where: bulkWhere } = body || {};
    if (!bulkWhere) {
      return { status: 400, data: { error: "Body must contain { where }" } };
    }
    const result = await delegate.deleteMany({ where: bulkWhere });
    return { status: 200, data: { count: result.count } };
  }

  // ── PATCH /model/bulk/update (legacy per-ID array) ─────────────────────────
  if (method === "PATCH" && operation === "bulk-update") {
    if (!Array.isArray(body) || body.length === 0) {
      return { status: 400, data: { error: "Request body must be a non-empty array of update records" } };
    }
    for (const item of body) {
      if (!item[meta.idField]) {
        return { status: 400, data: { error: `Each record must have an ${meta.idField} field` } };
      }
    }
    const results = await Promise.all(
      body.map((item) => {
        const itemId = item[meta.idField];
        const updateData = { ...item };
        delete updateData[meta.idField];
        return delegate.update({
          where: { [meta.idField]: coerceId(itemId) },
          data: updateData,
          ...projection,
        });
      })
    );
    return { status: 200, data: { updated: results.length, records: results } };
  }

  // ── DELETE /model/bulk/delete (legacy ID array) ────────────────────────────
  if (method === "DELETE" && operation === "bulk-delete") {
    if (!Array.isArray(body) || body.length === 0) {
      return { status: 400, data: { error: "Request body must be a non-empty array of IDs" } };
    }
    const ids = body.map((item: any) =>
      typeof item === "object" ? item[meta.idField] : item
    );
    const result = await delegate.deleteMany({
      where: { [meta.idField]: { in: ids.map(coerceId) } },
    });
    return { status: 200, data: { deleted: result.count } };
  }

  // ── GET /model ─────────────────────────────────────────────────────────────
  if (method === "GET" && !id) {
    const softDeleteInfo = softDelete
      ? detectSoftDeleteField(meta.fields, softDeleteField)
      : null;
    const listWhere = softDeleteInfo
      ? { ...where, [softDeleteInfo.field]: softDeleteInfo.field === "isActive" ? true : null }
      : where;

    const [data, total] = await (prisma as any).$transaction([
      delegate.findMany({ where: listWhere, orderBy, skip, take, ...projection }),
      delegate.count({ where: listWhere }),
    ]);

    const safeData = (data as any[]).map((r: any) => stripResponse(r, fg));

    if (!envelope) {
      return { status: 200, data: safeData, headers: { "X-Total-Count": String(total) } };
    }

    return {
      status: 200,
      data: {
        data: safeData,
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
    return { status: 200, data: stripResponse(record, fg) };
  }

  // ── POST /model ────────────────────────────────────────────────────────────
  if (method === "POST" && !id) {
    const record = await delegate.create({ data: safeBody });
    return { status: 201, data: stripResponse(record, fg) };
  }

  // ── PUT /model/:id ─────────────────────────────────────────────────────────
  if ((method === "PUT" || method === "PATCH") && id) {
    const record = await delegate.update({
      where: { [meta.idField]: coerceId(id) },
      data: safeBody,
    });
    return { status: 200, data: stripResponse(record, fg) };
  }

  // ── DELETE /model/:id ──────────────────────────────────────────────────────
  if (method === "DELETE" && id) {
    const softDeleteInfo = softDelete
      ? detectSoftDeleteField(meta.fields, softDeleteField)
      : null;

    if (softDeleteInfo) {
      const record = await delegate.update({
        where: { [meta.idField]: coerceId(id) },
        data: { [softDeleteInfo.field]: softDeleteInfo.value },
      });
      return { status: 200, data: record };
    }

    await delegate.delete({ where: { [meta.idField]: coerceId(id) } });
    return { status: 204, data: null };
  }

  return { status: 405, data: { error: `Method ${method} not allowed.` } };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strips hidden and writeOnly fields from a response record.
 */
function stripResponse(record: any, fg?: FieldGuardConfig): any {
  if (!fg || !record || typeof record !== "object") return record;
  const blocked = new Set([...(fg.hidden ?? []), ...(fg.writeOnly ?? [])]);
  if (blocked.size === 0) return record;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(record)) {
    if (!blocked.has(k)) out[k] = v;
  }
  return out;
}

/**
 * Strips readOnly fields from a write body before passing to Prisma.
 */
function sanitizeBody(body: any, fg?: FieldGuardConfig): any {
  if (!fg || !body || typeof body !== "object" || Array.isArray(body)) return body;
  const readOnly = new Set(fg.readOnly ?? []);
  if (readOnly.size === 0) return body;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!readOnly.has(k)) out[k] = v;
  }
  return out;
}

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
    return { status: 409, data: { error: `Unique constraint failed on: ${fields}` } };
  }
  if (code === "P2003") {
    return { status: 400, data: { error: "Foreign key constraint failed." } };
  }
  if (code === "P2014") {
    return { status: 400, data: { error: "Relation violation." } };
  }

  return { status: 500, data: { error: e?.message ?? "Internal server error." } };
}
