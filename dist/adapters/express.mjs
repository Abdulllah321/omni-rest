import { Prisma } from '@prisma/client';

var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
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
    const dmmfModels = Prisma?.dmmf?.datamodel?.models || __require("@prisma/client")?.Prisma?.dmmf?.datamodel?.models;
    if (dmmfModels) {
      raw = dmmfModels;
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
      isRelation: !!f.relationName
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
  "select"
]);
function buildQuery(searchParams, defaultLimit = 20, maxLimit = 100) {
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
      if (field) {
        orderBy[field] = dir === "desc" ? "desc" : "asc";
      }
    }
  }
  const includeParam = searchParams.get("include");
  if (includeParam) {
    for (const rel of includeParam.split(",")) {
      if (rel.trim()) include[rel.trim()] = true;
    }
  }
  const selectParam = searchParams.get("select");
  if (selectParam) {
    select = {};
    for (const field of selectParam.split(",")) {
      if (field.trim()) select[field.trim()] = true;
    }
  }
  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_KEYS.has(key)) continue;
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

// src/middleware.ts
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
    maxLimit = 100
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
        operation
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
async function executeOperation(prisma, meta, method, id, body, searchParams, defaultLimit, maxLimit, operation) {
  const delegate = getDelegate(prisma, meta);
  const { where, orderBy, skip, take, include, select } = buildQuery(
    searchParams,
    defaultLimit,
    maxLimit
  );
  const includeArg = Object.keys(include).length > 0 ? include : void 0;
  const selectArg = select && Object.keys(select).length > 0 ? select : void 0;
  const projection = selectArg ? { select: selectArg } : includeArg ? { include: includeArg } : {};
  if (method === "PATCH" && operation === "bulk-update") {
    if (!Array.isArray(body) || body.length === 0) {
      return {
        status: 400,
        data: { error: "Request body must be a non-empty array of update records" }
      };
    }
    for (const item of body) {
      if (!item[meta.idField]) {
        return {
          status: 400,
          data: { error: `Each record must have an ${meta.idField} field` }
        };
      }
    }
    const results = await Promise.all(
      body.map((item) => {
        const id2 = item[meta.idField];
        const updateData = { ...item };
        delete updateData[meta.idField];
        return delegate.update({
          where: { [meta.idField]: coerceId(id2) },
          data: updateData,
          ...projection
        });
      })
    );
    return {
      status: 200,
      data: {
        updated: results.length,
        records: results
      }
    };
  }
  if (method === "DELETE" && operation === "bulk-delete") {
    if (!Array.isArray(body) || body.length === 0) {
      return {
        status: 400,
        data: { error: "Request body must be a non-empty array of IDs" }
      };
    }
    const ids = body.map(
      (item) => typeof item === "object" ? item[meta.idField] : item
    );
    const result = await delegate.deleteMany({
      where: {
        [meta.idField]: { in: ids.map(coerceId) }
      }
    });
    return {
      status: 200,
      data: {
        deleted: result.count
      }
    };
  }
  if (method === "GET" && !id) {
    const [data, total] = await prisma.$transaction([
      delegate.findMany({ where, orderBy, skip, take, ...projection }),
      delegate.count({ where })
    ]);
    return {
      status: 200,
      data: {
        data,
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
    return { status: 200, data: record };
  }
  if (method === "POST" && !id) {
    const record = await delegate.create({ data: body });
    return { status: 201, data: record };
  }
  if ((method === "PUT" || method === "PATCH") && id) {
    const record = await delegate.update({
      where: { [meta.idField]: coerceId(id) },
      data: body
    });
    return { status: 200, data: record };
  }
  if (method === "DELETE" && id) {
    await delegate.delete({
      where: { [meta.idField]: coerceId(id) }
    });
    return { status: 204, data: null };
  }
  return { status: 405, data: { error: `Method ${method} not allowed.` } };
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
    return {
      status: 409,
      data: { error: `Unique constraint failed on: ${fields}` }
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

// src/adapters/express.ts
function expressAdapter(prisma, options = {}) {
  const { Router } = __require("express");
  const router = Router();
  const { handle } = createRouter(prisma, options);
  router.patch("/:model/bulk/update", async (req, res) => {
    try {
      const { status, data } = await handle(
        "PATCH",
        req.params.model,
        null,
        req.body ?? [],
        new URLSearchParams(
          Object.entries(req.query).map(([k, v]) => `${k}=${v}`).join("&")
        ),
        "bulk-update"
      );
      if (status === 204) {
        return res.sendStatus(204);
      }
      return res.status(status).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
  router.delete("/:model/bulk/delete", async (req, res) => {
    try {
      const { status, data } = await handle(
        "DELETE",
        req.params.model,
        null,
        req.body ?? [],
        new URLSearchParams(
          Object.entries(req.query).map(([k, v]) => `${k}=${v}`).join("&")
        ),
        "bulk-delete"
      );
      if (status === 204) {
        return res.sendStatus(204);
      }
      return res.status(status).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
  router.route("/:model").get(handler).post(handler);
  router.route("/:model/:id").get(handler).put(handler).patch(handler).delete(handler);
  async function handler(req, res) {
    try {
      const { status, data } = await handle(
        req.method,
        req.params.model,
        req.params.id ?? null,
        req.body ?? {},
        new URLSearchParams(
          Object.entries(req.query).map(([k, v]) => `${k}=${v}`).join("&")
        )
      );
      if (status === 204) {
        return res.sendStatus(204);
      }
      return res.status(status).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  return router;
}

export { expressAdapter };
//# sourceMappingURL=express.mjs.map
//# sourceMappingURL=express.mjs.map