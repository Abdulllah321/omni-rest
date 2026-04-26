'use strict';

var stream = require('stream');

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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
    throw new Error("[omni-rest] Could not find Prisma DMMF. Ensure Prisma client is generated and you're passing a PrismaClient instance to omni-rest.");
  }
  if (!Array.isArray(raw)) {
    throw new Error(`[omni-rest] Expected models to be an array, got ${typeof raw}. Debug: prisma._runtimeDataModel.models=${!!prisma?._runtimeDataModel?.models}, raw value=${JSON.stringify(raw).slice(0, 100)}`);
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
__name(getModels, "getModels");
function toRouteName(modelName) {
  return modelName.toLowerCase();
}
__name(toRouteName, "toRouteName");
function buildModelMap(models, allowList) {
  const filtered = allowList ? models.filter((m) => allowList.includes(m.routeName)) : models;
  return Object.fromEntries(filtered.map((m) => [
    m.routeName,
    m
  ]));
}
__name(buildModelMap, "buildModelMap");
function detectSoftDeleteField(fields, explicitField) {
  if (explicitField) {
    const f = fields.find((f2) => f2.name === explicitField);
    if (!f) return null;
    const value = f.type === "Boolean" ? false : /* @__PURE__ */ new Date();
    return {
      field: explicitField,
      value
    };
  }
  const deletedAt = fields.find((f) => f.name === "deletedAt" && f.type === "DateTime");
  if (deletedAt) return {
    field: "deletedAt",
    value: /* @__PURE__ */ new Date()
  };
  const isActive = fields.find((f) => f.name === "isActive" && f.type === "Boolean");
  if (isActive) return {
    field: "isActive",
    value: false
  };
  return null;
}
__name(detectSoftDeleteField, "detectSoftDeleteField");
function getDelegate(prisma, meta) {
  const key = meta.name.charAt(0).toLowerCase() + meta.name.slice(1);
  const delegate = prisma[key];
  if (!delegate) {
    throw new Error(`Could not find Prisma delegate for model "${meta.name}". Expected prisma.${key} to exist.`);
  }
  return delegate;
}
__name(getDelegate, "getDelegate");

// src/query-builder.ts
var FILTER_OPERATORS = {
  _gte: "gte",
  _lte: "lte",
  _gt: "gt",
  _lt: "lt",
  _contains: "contains",
  _icontains: "contains",
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
function buildQuery(searchParams, defaultLimit = 20, maxLimit = 100, modelFields, defaultPaginationMode = "offset") {
  const where = {};
  const orderBy = {};
  let include = {};
  let select = null;
  let parsedCursor;
  const paginationMode = searchParams.get("paginationMode") || defaultPaginationMode;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const rawLimit = parseInt(searchParams.get("limit") ?? String(defaultLimit));
  const take = Math.min(rawLimit, maxLimit);
  if (paginationMode === "cursor") {
    const cursorParam = searchParams.get("cursor");
    if (cursorParam) {
      try {
        parsedCursor = JSON.parse(Buffer.from(cursorParam, "base64").toString("utf-8"));
      } catch {
      }
    }
  }
  const skip = paginationMode === "cursor" && parsedCursor ? 1 : (page - 1) * take;
  const sortParam = searchParams.get("sort");
  if (sortParam) {
    for (const part of sortParam.split(",")) {
      const [field, dir] = part.trim().split(":");
      if (!field) continue;
      const direction = dir === "desc" ? "desc" : "asc";
      if (field.startsWith("_count.")) {
        const relation = field.slice("_count.".length);
        if (relation) {
          orderBy[relation] = {
            _count: direction
          };
        }
      } else {
        orderBy[field] = direction;
      }
    }
  }
  if (paginationMode === "cursor" && Object.keys(orderBy).length === 0 && modelFields) {
    const idField = modelFields.find((f) => f.isId)?.name ?? "id";
    orderBy[idField] = "asc";
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
    const stringFields = modelFields.filter((f) => f.type === "String" && !f.isRelation);
    if (stringFields.length > 0) {
      const orClauses = stringFields.map((f) => ({
        [f.name]: {
          contains: searchValue,
          mode: "insensitive"
        }
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
      const relationMeta = modelFields.find((f) => f.name === relationName && f.isRelation);
      if (relationMeta) {
        const sortedOps2 = Object.keys(FILTER_OPERATORS).sort((a, b) => b.length - a.length);
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
            const extra = suffix === "_icontains" ? {
              mode: "insensitive"
            } : {};
            fieldFilter = {
              [prismaOp]: parsedValue,
              ...extra
            };
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
        const nested = {
          [fieldName]: fieldFilter
        };
        where[relationName] = relationMeta.isList ? {
          some: nested
        } : nested;
        continue;
      }
    }
    let matched = false;
    const sortedOps = Object.keys(FILTER_OPERATORS).sort((a, b) => b.length - a.length);
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
        const extra = suffix === "_icontains" ? {
          mode: "insensitive"
        } : {};
        where[field] = {
          [prismaOp]: parsedValue,
          ...extra
        };
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
  return {
    where,
    orderBy,
    skip,
    take,
    cursor: parsedCursor,
    paginationMode,
    include,
    select
  };
}
__name(buildQuery, "buildQuery");

// src/middleware-helpers.ts
async function runGuard(guards, model, method, ctx) {
  const modelGuards = guards[model];
  if (!modelGuards) return null;
  const fn = modelGuards[method];
  if (!fn) return null;
  return fn({
    ...ctx,
    method
  });
}
__name(runGuard, "runGuard");
async function runHook(hook, ctx) {
  if (!hook) return;
  try {
    await hook(ctx);
  } catch (e) {
    console.error("[omni-rest] Hook error:", e);
  }
}
__name(runHook, "runHook");

// src/complexity.ts
function scoreQuery(parsedQuery, rules) {
  let score = 0;
  if (rules.perInclude && parsedQuery.include) {
    score += Object.keys(parsedQuery.include).length * rules.perInclude;
  }
  if (rules.perFilter && parsedQuery.where) {
    const filterCount = Object.keys(parsedQuery.where).filter((k) => k !== "OR" && k !== "AND" && k !== "NOT").length;
    score += filterCount * rules.perFilter;
  }
  if (rules.perSort && parsedQuery.orderBy) {
    score += Object.keys(parsedQuery.orderBy).length * rules.perSort;
  }
  if (rules.perLimit100 && parsedQuery.take) {
    score += Math.ceil(parsedQuery.take / 100) * rules.perLimit100;
  }
  return score;
}
__name(scoreQuery, "scoreQuery");

// src/subscriptions.ts
function formatSseEvent(event) {
  return `data: ${JSON.stringify(event)}

`;
}
__name(formatSseEvent, "formatSseEvent");
function formatSseHeartbeat() {
  return ": heartbeat\n\n";
}
__name(formatSseHeartbeat, "formatSseHeartbeat");
var _SubscriptionBus = class _SubscriptionBus {
  constructor(prisma, options = {}) {
    __publicField(this, "prisma");
    __publicField(this, "options");
    __publicField(this, "buses", /* @__PURE__ */ new Map());
    this.prisma = prisma;
    this.options = options;
  }
  // ── Per-connection guard check ──────────────────────────────────────────────
  /**
  * Applies the GET guard for the model.
  * Returns an error string if the subscriber should be rejected, null if allowed.
  */
  async checkGuard(guards, modelRouteName, ctx) {
    return runGuard(guards, modelRouteName, "GET", ctx);
  }
  // ── Bus lifecycle ───────────────────────────────────────────────────────────
  async initBus(meta, fg) {
    const delegate = getDelegate(this.prisma, meta);
    const pollMs = this.options.pollInterval ?? 1e3;
    const hasCreatedAt = meta.fields.some((f) => f.name === "createdAt");
    const hasUpdatedAt = meta.fields.some((f) => f.name === "updatedAt");
    let initialIds = [];
    try {
      const rows = await delegate.findMany({
        select: {
          [meta.idField]: true
        }
      });
      initialIds = rows.map((r) => r[meta.idField]);
    } catch {
    }
    const bus = {
      interval: null,
      listeners: /* @__PURE__ */ new Set(),
      watermark: /* @__PURE__ */ new Date(),
      knownIds: new Set(initialIds),
      hasCreatedAt,
      hasUpdatedAt
    };
    bus.interval = setInterval(async () => {
      if (bus.listeners.size === 0) return;
      const tick = /* @__PURE__ */ new Date();
      try {
        if (bus.hasCreatedAt && bus.hasUpdatedAt) {
          const [created, updated] = await Promise.all([
            // New records: createdAt after the last watermark
            delegate.findMany({
              where: {
                createdAt: {
                  gt: bus.watermark
                }
              }
            }),
            // Changed records: updatedAt after watermark but created before it
            delegate.findMany({
              where: {
                updatedAt: {
                  gt: bus.watermark
                },
                createdAt: {
                  lte: bus.watermark
                }
              }
            })
          ]);
          for (const record of created) {
            bus.knownIds.add(record[meta.idField]);
            const event = {
              event: "create",
              model: meta.name,
              record: stripFieldGuard(record, fg)
            };
            bus.listeners.forEach((l) => l(event));
          }
          for (const record of updated) {
            const event = {
              event: "update",
              model: meta.name,
              record: stripFieldGuard(record, fg)
            };
            bus.listeners.forEach((l) => l(event));
          }
        } else if (bus.hasUpdatedAt) {
          const updated = await delegate.findMany({
            where: {
              updatedAt: {
                gt: bus.watermark
              }
            }
          });
          for (const record of updated) {
            const event = {
              event: "update",
              model: meta.name,
              record: stripFieldGuard(record, fg)
            };
            bus.listeners.forEach((l) => l(event));
          }
        }
        const currentRows = await delegate.findMany({
          select: {
            [meta.idField]: true
          }
        });
        const currentIds = new Set(currentRows.map((r) => r[meta.idField]));
        for (const id of bus.knownIds) {
          if (!currentIds.has(id)) {
            bus.knownIds.delete(id);
            const event = {
              event: "delete",
              model: meta.name,
              id
            };
            bus.listeners.forEach((l) => l(event));
          }
        }
        for (const id of currentIds) {
          if (!bus.knownIds.has(id)) {
            bus.knownIds.add(id);
            if (!bus.hasCreatedAt) {
              const row = await delegate.findUnique({
                where: {
                  [meta.idField]: id
                }
              }).catch(() => null);
              if (row) {
                const event = {
                  event: "create",
                  model: meta.name,
                  record: stripFieldGuard(row, fg)
                };
                bus.listeners.forEach((l) => l(event));
              }
            }
          }
        }
        bus.watermark = tick;
      } catch {
      }
    }, pollMs);
    return bus;
  }
  // ── Public API ──────────────────────────────────────────────────────────────
  /**
  * Subscribes a listener to events for the given model.
  *
  * If no bus exists for this model yet, one is created (starting the DB poll).
  * If a bus already exists, the listener is simply added to its fan-out set.
  *
  * Returns an unsubscribe function. Call it when the client disconnects — if
  * this was the last listener the poll interval is immediately cleared.
  */
  async subscribe(meta, listener, fg) {
    let bus = this.buses.get(meta.routeName);
    if (!bus) {
      bus = await this.initBus(meta, fg);
      this.buses.set(meta.routeName, bus);
    }
    bus.listeners.add(listener);
    return () => {
      if (!bus) return;
      bus.listeners.delete(listener);
      if (bus.listeners.size === 0) {
        clearInterval(bus.interval);
        this.buses.delete(meta.routeName);
      }
    };
  }
  /**
  * Returns the number of active listeners across all model buses.
  * Useful for diagnostics / metrics.
  */
  get activeSubscriberCount() {
    let total = 0;
    for (const bus of this.buses.values()) {
      total += bus.listeners.size;
    }
    return total;
  }
  /**
  * Returns a list of model route names that currently have active subscribers.
  */
  get activeModels() {
    return [
      ...this.buses.keys()
    ];
  }
};
__name(_SubscriptionBus, "SubscriptionBus");
var SubscriptionBus = _SubscriptionBus;
function stripFieldGuard(record, fg) {
  if (!fg || !record || typeof record !== "object") return record;
  const blocked = /* @__PURE__ */ new Set([
    ...fg.hidden ?? [],
    ...fg.writeOnly ?? []
  ]);
  if (blocked.size === 0) return record;
  const out = {};
  for (const [k, v] of Object.entries(record)) {
    if (!blocked.has(k)) out[k] = v;
  }
  return out;
}
__name(stripFieldGuard, "stripFieldGuard");

// src/router.ts
function createRouter(prisma, options = {}) {
  const { allow, guards = {}, beforeOperation, afterOperation, defaultLimit = 20, maxLimit = 100, softDelete = false, softDeleteField, envelope = true, fieldGuards = {}, rateLimit, subscription = {}, paginationMode = "offset", features = {
    aggregation: true
  }, complexity } = options;
  const models = getModels(prisma);
  const modelMap = buildModelMap(models, allow);
  const subscriptionBus = new SubscriptionBus(prisma, subscription);
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
      const rateLimitError = await rateLimit({
        model: meta.name,
        method,
        id
      });
      if (rateLimitError) {
        return {
          status: 429,
          data: {
            error: rateLimitError
          }
        };
      }
    }
    const guardError = await runGuard(guards, meta.routeName, method, {
      id,
      body
    });
    if (guardError) {
      return {
        status: 403,
        data: {
          error: guardError
        }
      };
    }
    await runHook(beforeOperation, {
      model: meta.name,
      method,
      id,
      body
    });
    let result;
    try {
      result = await executeOperation(prisma, meta, method, id, body, searchParams, defaultLimit, maxLimit, operation, softDelete, softDeleteField, envelope, fieldGuards[meta.routeName], paginationMode, features, complexity);
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
  __name(handle, "handle");
  return {
    handle,
    modelMap,
    models,
    subscriptionBus
  };
}
__name(createRouter, "createRouter");
async function executeOperation(prisma, meta, method, id, body, searchParams, defaultLimit, maxLimit, operation, softDelete = false, softDeleteField, envelope = true, fg, defaultPaginationMode = "offset", features, complexity) {
  const delegate = getDelegate(prisma, meta);
  const { where, orderBy, skip, take, cursor, paginationMode, include, select } = buildQuery(searchParams, defaultLimit, maxLimit, meta.fields, defaultPaginationMode);
  if (complexity) {
    const score = scoreQuery({
      where,
      orderBy,
      take,
      include}, complexity.rules);
    if (score > complexity.maxScore) {
      return {
        status: 429,
        data: {
          error: "Query too complex",
          score,
          maxScore: complexity.maxScore
        }
      };
    }
  }
  const includeArg = Object.keys(include).length > 0 ? include : void 0;
  const selectArg = select && Object.keys(select).length > 0 ? select : void 0;
  const projection = selectArg ? {
    select: selectArg
  } : includeArg ? {
    include: includeArg
  } : {};
  const safeBody = sanitizeBody(body, fg);
  const parseAgg = /* @__PURE__ */ __name((val) => {
    if (!val) return void 0;
    if (val === "*") return {
      _all: true
    };
    const res = {};
    val.split(",").forEach((f) => res[f.trim()] = true);
    return res;
  }, "parseAgg");
  if (method === "GET" && id === "aggregate") {
    if (features?.aggregation === false) {
      return {
        status: 403,
        data: {
          error: "Aggregation endpoints are disabled."
        }
      };
    }
    const result = await delegate.aggregate({
      where,
      _count: parseAgg(searchParams.get("_count")),
      _sum: parseAgg(searchParams.get("_sum")),
      _avg: parseAgg(searchParams.get("_avg")),
      _min: parseAgg(searchParams.get("_min")),
      _max: parseAgg(searchParams.get("_max"))
    });
    return {
      status: 200,
      data: result
    };
  }
  if (method === "GET" && id === "groupBy") {
    if (features?.aggregation === false) {
      return {
        status: 403,
        data: {
          error: "Aggregation endpoints are disabled."
        }
      };
    }
    const byRaw = searchParams.get("by");
    if (!byRaw) {
      return {
        status: 400,
        data: {
          error: "groupBy requires a 'by' query parameter."
        }
      };
    }
    const result = await delegate.groupBy({
      by: byRaw.split(",").map((f) => f.trim()),
      where,
      orderBy: Object.keys(orderBy).length > 0 ? orderBy : void 0,
      take: take !== defaultLimit ? take : void 0,
      skip: skip > 0 ? skip : void 0,
      _count: parseAgg(searchParams.get("_count")),
      _sum: parseAgg(searchParams.get("_sum")),
      _avg: parseAgg(searchParams.get("_avg")),
      _min: parseAgg(searchParams.get("_min")),
      _max: parseAgg(searchParams.get("_max"))
    });
    return {
      status: 200,
      data: result
    };
  }
  if (method === "POST" && id === "bulk") {
    if (!Array.isArray(body) || body.length === 0) {
      return {
        status: 400,
        data: {
          error: "Request body must be a non-empty array"
        }
      };
    }
    const result = await delegate.createMany({
      data: body
    });
    return {
      status: 201,
      data: {
        count: result.count
      }
    };
  }
  if (method === "PUT" && id === "bulk") {
    const { where: bulkWhere, data: bulkData } = body || {};
    if (!bulkWhere || !bulkData) {
      return {
        status: 400,
        data: {
          error: "Body must contain { where, data }"
        }
      };
    }
    const result = await delegate.updateMany({
      where: bulkWhere,
      data: bulkData
    });
    return {
      status: 200,
      data: {
        count: result.count
      }
    };
  }
  if (method === "DELETE" && id === "bulk") {
    const { where: bulkWhere } = body || {};
    if (!bulkWhere) {
      return {
        status: 400,
        data: {
          error: "Body must contain { where }"
        }
      };
    }
    const result = await delegate.deleteMany({
      where: bulkWhere
    });
    return {
      status: 200,
      data: {
        count: result.count
      }
    };
  }
  if (method === "PATCH" && operation === "bulk-update") {
    if (!Array.isArray(body) || body.length === 0) {
      return {
        status: 400,
        data: {
          error: "Request body must be a non-empty array of update records"
        }
      };
    }
    for (const item of body) {
      if (!item[meta.idField]) {
        return {
          status: 400,
          data: {
            error: `Each record must have an ${meta.idField} field`
          }
        };
      }
    }
    const results = await Promise.all(body.map((item) => {
      const itemId = item[meta.idField];
      const updateData = {
        ...item
      };
      delete updateData[meta.idField];
      return delegate.update({
        where: {
          [meta.idField]: coerceId(itemId)
        },
        data: updateData,
        ...projection
      });
    }));
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
        data: {
          error: "Request body must be a non-empty array of IDs"
        }
      };
    }
    const ids = body.map((item) => typeof item === "object" ? item[meta.idField] : item);
    const result = await delegate.deleteMany({
      where: {
        [meta.idField]: {
          in: ids.map(coerceId)
        }
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
    const softDeleteInfo = softDelete ? detectSoftDeleteField(meta.fields, softDeleteField) : null;
    const listWhere = softDeleteInfo ? {
      ...where,
      [softDeleteInfo.field]: softDeleteInfo.field === "isActive" ? true : null
    } : where;
    let data;
    let total;
    let nextCursor = null;
    let hasMore = false;
    if (paginationMode === "cursor") {
      try {
        data = await delegate.findMany({
          where: listWhere,
          orderBy,
          skip,
          take,
          cursor: cursor ? cursor : void 0,
          ...projection
        });
        hasMore = data.length === take;
        if (hasMore && data.length > 0) {
          const lastRecord = data[data.length - 1];
          nextCursor = Buffer.from(JSON.stringify({
            [meta.idField]: lastRecord[meta.idField]
          })).toString("base64");
        }
      } catch (err) {
        if (err?.code === "P2025") {
          data = [];
          hasMore = false;
        } else {
          throw err;
        }
      }
    } else {
      const [dataResult, totalResult] = await prisma.$transaction([
        delegate.findMany({
          where: listWhere,
          orderBy,
          skip,
          take,
          ...projection
        }),
        delegate.count({
          where: listWhere
        })
      ]);
      data = dataResult;
      total = totalResult;
    }
    const safeData = data.map((r) => stripResponse(r, fg));
    if (!envelope) {
      const headers = {};
      if (paginationMode === "offset" && total !== void 0) {
        headers["X-Total-Count"] = String(total);
      } else if (paginationMode === "cursor") {
        headers["X-Has-More"] = String(hasMore);
        if (nextCursor) headers["X-Next-Cursor"] = nextCursor;
      }
      return {
        status: 200,
        data: safeData,
        headers
      };
    }
    const metaBlock = paginationMode === "cursor" ? {
      nextCursor,
      hasMore
    } : {
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      totalPages: Math.ceil((total ?? 0) / take)
    };
    return {
      status: 200,
      data: {
        data: safeData,
        meta: metaBlock
      }
    };
  }
  if (method === "GET" && id) {
    const record = await delegate.findUnique({
      where: {
        [meta.idField]: coerceId(id)
      },
      ...projection
    });
    if (!record) {
      return {
        status: 404,
        data: {
          error: `${meta.name} with id "${id}" not found.`
        }
      };
    }
    return {
      status: 200,
      data: stripResponse(record, fg)
    };
  }
  if (method === "POST" && !id) {
    const record = await delegate.create({
      data: safeBody
    });
    return {
      status: 201,
      data: stripResponse(record, fg)
    };
  }
  if ((method === "PUT" || method === "PATCH") && id) {
    const record = await delegate.update({
      where: {
        [meta.idField]: coerceId(id)
      },
      data: safeBody
    });
    return {
      status: 200,
      data: stripResponse(record, fg)
    };
  }
  if (method === "DELETE" && id) {
    const softDeleteInfo = softDelete ? detectSoftDeleteField(meta.fields, softDeleteField) : null;
    if (softDeleteInfo) {
      const record = await delegate.update({
        where: {
          [meta.idField]: coerceId(id)
        },
        data: {
          [softDeleteInfo.field]: softDeleteInfo.value
        }
      });
      return {
        status: 200,
        data: record
      };
    }
    await delegate.delete({
      where: {
        [meta.idField]: coerceId(id)
      }
    });
    return {
      status: 204,
      data: null
    };
  }
  return {
    status: 405,
    data: {
      error: `Method ${method} not allowed.`
    }
  };
}
__name(executeOperation, "executeOperation");
function stripResponse(record, fg) {
  if (!fg || !record || typeof record !== "object") return record;
  const blocked = /* @__PURE__ */ new Set([
    ...fg.hidden ?? [],
    ...fg.writeOnly ?? []
  ]);
  if (blocked.size === 0) return record;
  const out = {};
  for (const [k, v] of Object.entries(record)) {
    if (!blocked.has(k)) out[k] = v;
  }
  return out;
}
__name(stripResponse, "stripResponse");
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
__name(sanitizeBody, "sanitizeBody");
function coerceId(id) {
  const n = Number(id);
  return isNaN(n) ? id : n;
}
__name(coerceId, "coerceId");
function handlePrismaError(e) {
  const code = e?.code;
  if (code === "P2025") {
    return {
      status: 404,
      data: {
        error: "Record not found."
      }
    };
  }
  if (code === "P2002") {
    const fields = e?.meta?.target ?? "unknown fields";
    return {
      status: 409,
      data: {
        error: `Unique constraint failed on: ${fields}`
      }
    };
  }
  if (code === "P2003") {
    return {
      status: 400,
      data: {
        error: "Foreign key constraint failed."
      }
    };
  }
  if (code === "P2014") {
    return {
      status: 400,
      data: {
        error: "Relation violation."
      }
    };
  }
  return {
    status: 500,
    data: {
      error: e?.message ?? "Internal server error."
    }
  };
}
__name(handlePrismaError, "handlePrismaError");

// src/adapters/koa.ts
function koaAdapter(router, prisma, options = {}) {
  const { handle, modelMap, subscriptionBus } = createRouter(prisma, options);
  const heartbeatMs = options.subscription?.heartbeatInterval ?? 3e4;
  const guards = options.guards ?? {};
  const fieldGuards = options.fieldGuards ?? {};
  const getSearchParams = /* @__PURE__ */ __name((ctx) => {
    return new URLSearchParams(Object.entries(ctx.query).map(([k, v]) => `${k}=${v}`).join("&"));
  }, "getSearchParams");
  router.get("/:model/subscribe", async (ctx) => {
    const modelName = ctx.params.model;
    const meta = modelMap[modelName.toLowerCase()];
    if (!meta) {
      ctx.status = 404;
      ctx.body = {
        error: `Model "${modelName}" not found or not exposed.`
      };
      return;
    }
    const guardError = await subscriptionBus.checkGuard(guards, meta.routeName, {
      body: {}
    });
    if (guardError) {
      ctx.status = 403;
      ctx.body = {
        error: guardError
      };
      return;
    }
    ctx.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    });
    ctx.status = 200;
    const passThrough = new stream.PassThrough();
    ctx.body = passThrough;
    const fg = fieldGuards[meta.routeName];
    const unsubscribe = await subscriptionBus.subscribe(meta, (event) => {
      passThrough.write(formatSseEvent(event));
    }, fg);
    const heartbeat = setInterval(() => {
      passThrough.write(formatSseHeartbeat());
    }, heartbeatMs);
    const cleanup = /* @__PURE__ */ __name(() => {
      clearInterval(heartbeat);
      unsubscribe();
      passThrough.end();
    }, "cleanup");
    ctx.req.on("close", cleanup);
    ctx.req.on("error", cleanup);
  });
  const koaHandler = /* @__PURE__ */ __name(async (ctx) => {
    try {
      const { status, data } = await handle(ctx.method, ctx.params.model, ctx.params.id ?? null, ctx.request.body ?? {}, getSearchParams(ctx));
      ctx.status = status;
      if (status !== 204) {
        ctx.body = data;
      }
    } catch (e) {
      ctx.status = 500;
      ctx.body = {
        error: e.message
      };
    }
  }, "koaHandler");
  router.patch("/:model/bulk/update", async (ctx) => {
    try {
      const { status, data } = await handle("PATCH", ctx.params.model, null, ctx.request.body ?? [], getSearchParams(ctx), "bulk-update");
      ctx.status = status;
      if (status !== 204) {
        ctx.body = data;
      }
    } catch (e) {
      ctx.status = 500;
      ctx.body = {
        error: e.message
      };
    }
  });
  router.delete("/:model/bulk/delete", async (ctx) => {
    try {
      const { status, data } = await handle("DELETE", ctx.params.model, null, ctx.request.body ?? [], getSearchParams(ctx), "bulk-delete");
      ctx.status = status;
      if (status !== 204) {
        ctx.body = data;
      }
    } catch (e) {
      ctx.status = 500;
      ctx.body = {
        error: e.message
      };
    }
  });
  router.get("/:model", koaHandler);
  router.post("/:model", koaHandler);
  router.get("/:model/:id", koaHandler);
  router.put("/:model/:id", koaHandler);
  router.patch("/:model/:id", koaHandler);
  router.delete("/:model/:id", koaHandler);
  return router;
}
__name(koaAdapter, "koaAdapter");

exports.koaAdapter = koaAdapter;
//# sourceMappingURL=koa.js.map
//# sourceMappingURL=koa.js.map