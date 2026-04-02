'use strict';

var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/introspect.ts
function getModels(prisma) {
  let raw;
  if (prisma?._runtimeDataModel?.models) {
    const modelsObj = prisma._runtimeDataModel.models;
    raw = Object.entries(modelsObj).map(([name, model]) => ({
      name,
      ...model,
      fields: (model.fields || []).map((f) => ({
        ...f,
        relationName: f.kind === "object" ? f.name : void 0
      }))
    }));
  }
  if (!raw) {
    try {
      const prismaModule = __require("@prisma/client");
      const dmmfModels = prismaModule?.Prisma?.dmmf?.datamodel?.models;
      if (dmmfModels) {
        raw = dmmfModels;
      }
    } catch {
    }
  }
  if (!raw) {
    throw new Error(
      "[omni-rest] Could not find Prisma DMMF. Ensure Prisma client is generated and you're passing a PrismaClient instance to omni-rest."
    );
  }
  if (!Array.isArray(raw)) {
    throw new Error(
      `[omni-rest] Expected models to be an array, got ${typeof raw}. Debug: prisma._runtimeDataModel.models=${!!prisma?._runtimeDataModel?.models}, raw value=${JSON.stringify(raw).slice(0, 100)}`
    );
  }
  return raw.map((model) => {
    const fields = model.fields.map((f) => ({
      name: f.name,
      type: f.type,
      isId: f.isId,
      isRequired: f.isRequired,
      isList: f.isList,
      isRelation: !!f.relationName,
      hasDefaultValue: !!f.hasDefaultValue || !!f.default,
      isUpdatedAt: !!f.isUpdatedAt
    }));
    const idField = model.fields.find((f) => f.isId)?.name ?? "id";
    return {
      name: model.name,
      routeName: toRouteName(model.name),
      fields,
      idField
    };
  });
}
function toRouteName(modelName) {
  return modelName.toLowerCase();
}
function buildModelMap(models, allowList) {
  const filtered = allowList ? models.filter((m) => allowList.includes(m.routeName)) : models;
  return Object.fromEntries(filtered.map((m) => [m.routeName, m]));
}
function detectSoftDeleteField(fields, explicitField) {
  if (explicitField) {
    const f = fields.find((f2) => f2.name === explicitField);
    if (!f) return null;
    const value = f.type === "Boolean" ? false : /* @__PURE__ */ new Date();
    return { field: explicitField, value };
  }
  const deletedAt = fields.find((f) => f.name === "deletedAt" && f.type === "DateTime");
  if (deletedAt) return { field: "deletedAt", value: /* @__PURE__ */ new Date() };
  const isActive = fields.find((f) => f.name === "isActive" && f.type === "Boolean");
  if (isActive) return { field: "isActive", value: false };
  return null;
}
function getDelegate(prisma, meta) {
  const key = meta.name.charAt(0).toLowerCase() + meta.name.slice(1);
  const delegate = prisma[key];
  if (!delegate) {
    throw new Error(
      `Could not find Prisma delegate for model "${meta.name}". Expected prisma.${key} to exist.`
    );
  }
  return delegate;
}

// src/query-builder.ts
var FILTER_OPERATORS = {
  _gte: "gte",
  _lte: "lte",
  _gt: "gt",
  _lt: "lt",
  _contains: "contains",
  _icontains: "contains",
  // case-insensitive version (mode: insensitive)
  _startsWith: "startsWith",
  _endsWith: "endsWith",
  _in: "in",
  _notIn: "notIn",
  _not: "not"
};
var RESERVED_KEYS = /* @__PURE__ */ new Set([
  "page",
  "limit",
  "sort",
  "include",
  "select",
  "fields",
  "search"
]);
function buildQuery(searchParams, defaultLimit = 20, maxLimit = 100, modelFields) {
  const where = {};
  const orderBy = {};
  let include = {};
  let select = null;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const rawLimit = parseInt(searchParams.get("limit") ?? String(defaultLimit));
  const take = Math.min(rawLimit, maxLimit);
  const skip = (page - 1) * take;
  const sortParam = searchParams.get("sort");
  if (sortParam) {
    for (const part of sortParam.split(",")) {
      const [field, dir] = part.trim().split(":");
      if (!field) continue;
      const direction = dir === "desc" ? "desc" : "asc";
      if (field.startsWith("_count.")) {
        const relation = field.slice("_count.".length);
        if (relation) {
          orderBy[relation] = { _count: direction };
        }
      } else {
        orderBy[field] = direction;
      }
    }
  }
  const includeParam = searchParams.get("include");
  if (includeParam) {
    for (const rel of includeParam.split(",")) {
      if (rel.trim()) include[rel.trim()] = true;
    }
  }
  const selectParam = searchParams.get("select") ?? searchParams.get("fields");
  if (selectParam) {
    select = {};
    for (const field of selectParam.split(",")) {
      if (field.trim()) select[field.trim()] = true;
    }
  }
  const searchValue = searchParams.get("search");
  if (searchValue && modelFields) {
    const stringFields = modelFields.filter(
      (f) => f.type === "String" && !f.isRelation
    );
    if (stringFields.length > 0) {
      const orClauses = stringFields.map((f) => ({
        [f.name]: { contains: searchValue, mode: "insensitive" }
      }));
      where["OR"] = orClauses;
    }
  }
  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_KEYS.has(key)) continue;
    const dotIndex = key.indexOf(".");
    if (dotIndex > 0 && key.indexOf(".", dotIndex + 1) === -1 && modelFields) {
      const relationName = key.slice(0, dotIndex);
      const fieldPart = key.slice(dotIndex + 1);
      const relationMeta = modelFields.find(
        (f) => f.name === relationName && f.isRelation
      );
      if (relationMeta) {
        const sortedOps2 = Object.keys(FILTER_OPERATORS).sort(
          (a, b) => b.length - a.length
        );
        let fieldName = fieldPart;
        let fieldFilter;
        let opMatched = false;
        for (const suffix of sortedOps2) {
          if (fieldPart.endsWith(suffix)) {
            fieldName = fieldPart.slice(0, -suffix.length);
            const prismaOp = FILTER_OPERATORS[suffix];
            let parsedValue = value;
            if (prismaOp === "in" || prismaOp === "notIn") {
              parsedValue = value.split(",").map((v) => v.trim());
            } else if (!isNaN(Number(parsedValue)) && typeof parsedValue === "string") {
              parsedValue = Number(parsedValue);
            }
            const extra = suffix === "_icontains" ? { mode: "insensitive" } : {};
            fieldFilter = { [prismaOp]: parsedValue, ...extra };
            opMatched = true;
            break;
          }
        }
        if (!opMatched) {
          let parsedValue = value;
          if (value === "true") parsedValue = true;
          else if (value === "false") parsedValue = false;
          else if (!isNaN(Number(value)) && value !== "") parsedValue = Number(value);
          fieldFilter = parsedValue;
        }
        const nested = { [fieldName]: fieldFilter };
        where[relationName] = relationMeta.isList ? { some: nested } : nested;
        continue;
      }
    }
    let matched = false;
    const sortedOps = Object.keys(FILTER_OPERATORS).sort(
      (a, b) => b.length - a.length
    );
    for (const suffix of sortedOps) {
      if (key.endsWith(suffix)) {
        const field = key.slice(0, -suffix.length);
        const prismaOp = FILTER_OPERATORS[suffix];
        let parsedValue = value;
        if (prismaOp === "in" || prismaOp === "notIn") {
          parsedValue = value.split(",").map((v) => v.trim());
        }
        if (!isNaN(Number(parsedValue)) && typeof parsedValue === "string") {
          parsedValue = Number(parsedValue);
        }
        const extra = suffix === "_icontains" ? { mode: "insensitive" } : {};
        where[field] = { [prismaOp]: parsedValue, ...extra };
        matched = true;
        break;
      }
    }
    if (!matched) {
      let parsedValue = value;
      if (value === "true") parsedValue = true;
      else if (value === "false") parsedValue = false;
      else if (!isNaN(Number(value)) && value !== "") {
        parsedValue = Number(value);
      }
      where[key] = parsedValue;
    }
  }
  return { where, orderBy, skip, take, include, select };
}

// src/middleware-helpers.ts
async function runGuard(guards, model, method, ctx) {
  const modelGuards = guards[model];
  if (!modelGuards) return null;
  const fn = modelGuards[method];
  if (!fn) return null;
  return fn({ ...ctx, method });
}
async function runHook(hook, ctx) {
  if (!hook) return;
  try {
    await hook(ctx);
  } catch (e) {
    console.error("[omni-rest] Hook error:", e);
  }
}

// src/router.ts
function createRouter(prisma, options = {}) {
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
    rateLimit
  } = options;
  const models = getModels(prisma);
  const modelMap = buildModelMap(models, allow);
  async function handle(method, modelName, id, body, searchParams, operation) {
    const meta = modelMap[modelName.toLowerCase()];
    if (!meta) {
      return {
        status: 404,
        data: {
          error: `Model "${modelName}" not found or not exposed.`,
          available: Object.keys(modelMap)
        }
      };
    }
    if (rateLimit) {
      const rateLimitError = await rateLimit({ model: meta.name, method, id });
      if (rateLimitError) {
        return { status: 429, data: { error: rateLimitError } };
      }
    }
    const guardError = await runGuard(guards, meta.routeName, method, {
      id,
      body
    });
    if (guardError) {
      return { status: 403, data: { error: guardError } };
    }
    await runHook(beforeOperation, { model: meta.name, method, id, body });
    let result;
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
    } catch (e) {
      return handlePrismaError(e);
    }
    await runHook(afterOperation, {
      model: meta.name,
      method,
      id,
      body,
      result: result.data
    });
    return result;
  }
  return { handle, modelMap, models };
}
async function executeOperation(prisma, meta, method, id, body, searchParams, defaultLimit, maxLimit, operation, softDelete = false, softDeleteField, envelope = true, fg) {
  const delegate = getDelegate(prisma, meta);
  const { where, orderBy, skip, take, include, select } = buildQuery(
    searchParams,
    defaultLimit,
    maxLimit,
    meta.fields
  );
  const includeArg = Object.keys(include).length > 0 ? include : void 0;
  const selectArg = select && Object.keys(select).length > 0 ? select : void 0;
  const projection = selectArg ? { select: selectArg } : includeArg ? { include: includeArg } : {};
  const safeBody = sanitizeBody(body, fg);
  if (method === "POST" && id === "bulk") {
    if (!Array.isArray(body) || body.length === 0) {
      return { status: 400, data: { error: "Request body must be a non-empty array" } };
    }
    const result = await delegate.createMany({ data: body });
    return { status: 201, data: { count: result.count } };
  }
  if (method === "PUT" && id === "bulk") {
    const { where: bulkWhere, data: bulkData } = body || {};
    if (!bulkWhere || !bulkData) {
      return { status: 400, data: { error: "Body must contain { where, data }" } };
    }
    const result = await delegate.updateMany({ where: bulkWhere, data: bulkData });
    return { status: 200, data: { count: result.count } };
  }
  if (method === "DELETE" && id === "bulk") {
    const { where: bulkWhere } = body || {};
    if (!bulkWhere) {
      return { status: 400, data: { error: "Body must contain { where }" } };
    }
    const result = await delegate.deleteMany({ where: bulkWhere });
    return { status: 200, data: { count: result.count } };
  }
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
          ...projection
        });
      })
    );
    return { status: 200, data: { updated: results.length, records: results } };
  }
  if (method === "DELETE" && operation === "bulk-delete") {
    if (!Array.isArray(body) || body.length === 0) {
      return { status: 400, data: { error: "Request body must be a non-empty array of IDs" } };
    }
    const ids = body.map(
      (item) => typeof item === "object" ? item[meta.idField] : item
    );
    const result = await delegate.deleteMany({
      where: { [meta.idField]: { in: ids.map(coerceId) } }
    });
    return { status: 200, data: { deleted: result.count } };
  }
  if (method === "GET" && !id) {
    const softDeleteInfo = softDelete ? detectSoftDeleteField(meta.fields, softDeleteField) : null;
    const listWhere = softDeleteInfo ? { ...where, [softDeleteInfo.field]: softDeleteInfo.field === "isActive" ? true : null } : where;
    const [data, total] = await prisma.$transaction([
      delegate.findMany({ where: listWhere, orderBy, skip, take, ...projection }),
      delegate.count({ where: listWhere })
    ]);
    const safeData = data.map((r) => stripResponse(r, fg));
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
          totalPages: Math.ceil(total / take)
        }
      }
    };
  }
  if (method === "GET" && id) {
    const record = await delegate.findUnique({
      where: { [meta.idField]: coerceId(id) },
      ...projection
    });
    if (!record) {
      return { status: 404, data: { error: `${meta.name} with id "${id}" not found.` } };
    }
    return { status: 200, data: stripResponse(record, fg) };
  }
  if (method === "POST" && !id) {
    const record = await delegate.create({ data: safeBody });
    return { status: 201, data: stripResponse(record, fg) };
  }
  if ((method === "PUT" || method === "PATCH") && id) {
    const record = await delegate.update({
      where: { [meta.idField]: coerceId(id) },
      data: safeBody
    });
    return { status: 200, data: stripResponse(record, fg) };
  }
  if (method === "DELETE" && id) {
    const softDeleteInfo = softDelete ? detectSoftDeleteField(meta.fields, softDeleteField) : null;
    if (softDeleteInfo) {
      const record = await delegate.update({
        where: { [meta.idField]: coerceId(id) },
        data: { [softDeleteInfo.field]: softDeleteInfo.value }
      });
      return { status: 200, data: record };
    }
    await delegate.delete({ where: { [meta.idField]: coerceId(id) } });
    return { status: 204, data: null };
  }
  return { status: 405, data: { error: `Method ${method} not allowed.` } };
}
function stripResponse(record, fg) {
  if (!fg || !record || typeof record !== "object") return record;
  const blocked = /* @__PURE__ */ new Set([...fg.hidden ?? [], ...fg.writeOnly ?? []]);
  if (blocked.size === 0) return record;
  const out = {};
  for (const [k, v] of Object.entries(record)) {
    if (!blocked.has(k)) out[k] = v;
  }
  return out;
}
function sanitizeBody(body, fg) {
  if (!fg || !body || typeof body !== "object" || Array.isArray(body)) return body;
  const readOnly = new Set(fg.readOnly ?? []);
  if (readOnly.size === 0) return body;
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    if (!readOnly.has(k)) out[k] = v;
  }
  return out;
}
function coerceId(id) {
  const n = Number(id);
  return isNaN(n) ? id : n;
}
function handlePrismaError(e) {
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

// src/adapters/fastify.ts
function fastifyAdapter(fastify, prisma, options = {}) {
  const { handle } = createRouter(prisma, options);
  const prefix = options.prefix ?? "/api";
  async function routeHandler(request, reply) {
    const { model, id } = request.params;
    const body = request.body ?? {};
    const query = request.query ?? {};
    const searchParams = new URLSearchParams(
      Object.entries(query).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")
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
  async function bulkHandler(request, reply, operation) {
    const { model } = request.params;
    const body = request.body ?? [];
    const query = request.query ?? {};
    const searchParams = new URLSearchParams(
      Object.entries(query).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")
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
  fastify.get(`${prefix}/:model`, routeHandler);
  fastify.post(`${prefix}/:model`, routeHandler);
  fastify.get(`${prefix}/:model/:id`, routeHandler);
  fastify.put(`${prefix}/:model/:id`, routeHandler);
  fastify.patch(`${prefix}/:model/:id`, routeHandler);
  fastify.delete(`${prefix}/:model/:id`, routeHandler);
  fastify.patch(`${prefix}/:model/bulk/update`, async (request, reply) => {
    await bulkHandler(request, reply, "bulk-update");
  });
  fastify.delete(`${prefix}/:model/bulk/delete`, async (request, reply) => {
    await bulkHandler(request, reply, "bulk-delete");
  });
}

exports.fastifyAdapter = fastifyAdapter;
//# sourceMappingURL=fastify.js.map
//# sourceMappingURL=fastify.js.map