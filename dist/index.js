'use strict';

var client = require('@prisma/client');

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
    const dmmfModels = client.Prisma?.dmmf?.datamodel?.models || __require("@prisma/client")?.Prisma?.dmmf?.datamodel?.models;
    if (dmmfModels) {
      raw = dmmfModels;
    }
  }
  if (!raw) {
    throw new Error(
      "[prisma-rest] Could not find Prisma DMMF. Ensure Prisma client is generated and you're passing a PrismaClient instance to prisma-rest."
    );
  }
  if (!Array.isArray(raw)) {
    throw new Error(
      `[prisma-rest] Expected models to be an array, got ${typeof raw}. Debug: prisma._runtimeDataModel.models=${!!prisma?._runtimeDataModel?.models}, raw value=${JSON.stringify(raw).slice(0, 100)}`
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
    console.error("[prisma-rest] Hook error:", e);
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

// src/zod-generator.ts
var PRISMA_TO_ZOD = {
  String: "z.string()",
  Int: "z.number().int()",
  Float: "z.number()",
  Decimal: "z.number()",
  Boolean: "z.boolean()",
  DateTime: "z.coerce.date()",
  Json: "z.any()",
  BigInt: "z.bigint()",
  Bytes: "z.any()"
};
function fieldToZod(field) {
  if (field.isRelation) return null;
  let zod = PRISMA_TO_ZOD[field.type] ?? "z.any()";
  if (!field.isRequired) {
    zod = `${zod}.optional()`;
  }
  if (field.isList) {
    zod = `z.array(${zod})`;
  }
  return zod;
}
function generateModelSchema(meta) {
  const name = meta.name;
  const fields = meta.fields.filter((f) => !f.isRelation && !f.isId).map((f) => {
    const zodExpr = fieldToZod(f);
    if (!zodExpr) return null;
    return `  ${f.name}: ${zodExpr},`;
  }).filter(Boolean).join("\n");
  return `
// \u2500\u2500\u2500 ${name} \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export const ${name}CreateSchema = z.object({
${fields}
});

export const ${name}UpdateSchema = ${name}CreateSchema.partial();

export type ${name}Create = z.infer<typeof ${name}CreateSchema>;
export type ${name}Update = z.infer<typeof ${name}UpdateSchema>;
`.trim();
}
function generateZodSchemas() {
  const models = getModels();
  const schemas = models.map(generateModelSchema).join("\n\n");
  return `/**
 * Auto-generated Zod schemas from Prisma schema.
 * Generated by prisma-rest \u2014 do not edit manually.
 * Re-run after schema changes.
 */
import { z } from "zod";

${schemas}
`;
}
function buildRuntimeSchemas() {
  let z;
  try {
    z = __require("zod").z;
  } catch {
    throw new Error(
      "[prisma-rest] zod is required for runtime validation. Run: npm install zod"
    );
  }
  const ZOD_FACTORIES = {
    String: () => z.string(),
    Int: () => z.number().int(),
    Float: () => z.number(),
    Decimal: () => z.number(),
    Boolean: () => z.boolean(),
    DateTime: () => z.coerce.date(),
    Json: () => z.any(),
    BigInt: () => z.bigint(),
    Bytes: () => z.any()
  };
  const models = getModels();
  const result = {};
  for (const meta of models) {
    const shape = {};
    for (const field of meta.fields) {
      if (field.isRelation || field.isId) continue;
      const factory = ZOD_FACTORIES[field.type] ?? (() => z.any());
      let schema = factory();
      if (!field.isRequired) schema = schema.optional();
      if (field.isList) schema = z.array(schema);
      shape[field.name] = schema;
    }
    const createSchema = z.object(shape);
    result[meta.routeName] = {
      create: createSchema,
      update: createSchema.partial()
    };
  }
  return result;
}

// src/validate.ts
var cachedSchemas = null;
function getSchemas() {
  if (!cachedSchemas) {
    cachedSchemas = buildRuntimeSchemas();
  }
  return cachedSchemas;
}
function validateBody(modelRouteName, method, body) {
  let schemas;
  try {
    schemas = getSchemas();
  } catch {
    return null;
  }
  const modelSchemas = schemas[modelRouteName];
  if (!modelSchemas) return null;
  const schema = method === "POST" ? modelSchemas.create : modelSchemas.update;
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    return `Validation failed \u2014 ${issues}`;
  }
  return null;
}
function withValidation(overrides = {}) {
  return new Proxy(overrides, {
    get(target, modelName) {
      if (modelName in target) return target[modelName];
      return {
        POST: ({ body }) => validateBody(modelName, "POST", body),
        PUT: ({ body }) => validateBody(modelName, "PUT", body),
        PATCH: ({ body }) => validateBody(modelName, "PATCH", body)
      };
    }
  });
}

// src/openapi.ts
var PRISMA_TO_OAS = {
  String: { type: "string" },
  Int: { type: "integer", format: "int32" },
  Float: { type: "number", format: "float" },
  Decimal: { type: "number" },
  Boolean: { type: "boolean" },
  DateTime: { type: "string", format: "date-time" },
  Json: { type: "object" },
  BigInt: { type: "integer", format: "int64" }
};
function fieldToOasSchema(field) {
  if (field.isRelation) return null;
  const base = PRISMA_TO_OAS[field.type] ?? { type: "string" };
  if (field.isList) return { type: "array", items: base };
  return base;
}
function buildModelSchema(meta, forCreate = false) {
  const properties = {};
  const required = [];
  for (const field of meta.fields) {
    if (field.isRelation) continue;
    if (forCreate && field.isId) continue;
    const schema = fieldToOasSchema(field);
    if (!schema) continue;
    properties[field.name] = schema;
    if (field.isRequired && !field.isId && forCreate) {
      required.push(field.name);
    }
  }
  return {
    type: "object",
    properties,
    ...required.length > 0 ? { required } : {}
  };
}
function generateOpenApiSpec(prisma, options = {}) {
  const {
    title = "prisma-rest API",
    version = "1.0.0",
    basePath = "/api",
    allow,
    servers = [{ url: "http://localhost:3000" }]
  } = options;
  const models = getModels(prisma).filter(
    (m) => !allow || allow.includes(m.routeName)
  );
  const paths = {};
  const schemas = {};
  for (const meta of models) {
    const name = meta.name;
    const route = meta.routeName;
    schemas[name] = buildModelSchema(meta, false);
    schemas[`${name}Create`] = buildModelSchema(meta, true);
    schemas[`${name}Update`] = {
      ...buildModelSchema(meta, true),
      required: []
      // all optional for PATCH
    };
    paths[`${basePath}/${route}`] = {
      get: {
        summary: `List ${name}s`,
        tags: [name],
        parameters: buildListParameters(),
        responses: {
          200: {
            description: `List of ${name}s`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: `#/components/schemas/${name}` } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: `Create ${name}`,
        tags: [name],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${name}Create` }
            }
          }
        },
        responses: {
          201: {
            description: `Created ${name}`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${name}` }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" }
        }
      }
    };
    paths[`${basePath}/${route}/{id}`] = {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: `${name} ID`
        }
      ],
      get: {
        summary: `Get ${name} by ID`,
        tags: [name],
        responses: {
          200: {
            description: `${name} record`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${name}` }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFound" }
        }
      },
      put: {
        summary: `Update ${name}`,
        tags: [name],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${name}Create` }
            }
          }
        },
        responses: {
          200: {
            description: `Updated ${name}`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${name}` }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFound" }
        }
      },
      patch: {
        summary: `Partially update ${name}`,
        tags: [name],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${name}Update` }
            }
          }
        },
        responses: {
          200: {
            description: `Updated ${name}`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${name}` }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFound" }
        }
      },
      delete: {
        summary: `Delete ${name}`,
        tags: [name],
        responses: {
          204: { description: "Deleted successfully" },
          404: { $ref: "#/components/responses/NotFound" }
        }
      }
    };
    paths[`${basePath}/${route}/bulk/update`] = {
      patch: {
        summary: `Bulk update ${name}s`,
        tags: [name],
        requestBody: {
          required: true,
          description: `Array of ${name} objects with id field to update`,
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: `#/components/schemas/${name}Update` }
              }
            }
          }
        },
        responses: {
          200: {
            description: `Bulk update result`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    updated: { type: "integer" },
                    records: {
                      type: "array",
                      items: { $ref: `#/components/schemas/${name}` }
                    }
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" }
        }
      }
    };
    paths[`${basePath}/${route}/bulk/delete`] = {
      delete: {
        summary: `Bulk delete ${name}s`,
        tags: [name],
        requestBody: {
          required: true,
          description: `Array of IDs to delete`,
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        responses: {
          200: {
            description: `Bulk delete result`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deleted: { type: "integer" }
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/BadRequest" }
        }
      }
    };
  }
  return {
    openapi: "3.0.3",
    info: { title, version },
    servers,
    paths,
    components: {
      schemas: {
        ...schemas,
        PaginationMeta: {
          type: "object",
          properties: {
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            totalPages: { type: "integer" }
          }
        },
        Error: {
          type: "object",
          properties: { error: { type: "string" } }
        }
      },
      responses: {
        NotFound: {
          description: "Record not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" }
            }
          }
        },
        BadRequest: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" }
            }
          }
        },
        Conflict: {
          description: "Unique constraint violation",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" }
            }
          }
        }
      }
    },
    tags: models.map((m) => ({ name: m.name }))
  };
}
function buildListParameters() {
  return [
    { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
    { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page" },
    { name: "sort", in: "query", schema: { type: "string" }, description: "e.g. createdAt:desc" },
    { name: "include", in: "query", schema: { type: "string" }, description: "Comma-separated relations" },
    { name: "select", in: "query", schema: { type: "string" }, description: "Comma-separated fields" }
  ];
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

// src/adapters/nextjs.ts
function nextjsAdapter(prisma, options = {}) {
  const { handle } = createRouter(prisma, options);
  return async function handler(req, context) {
    const segments = context.params.prismaRest ?? [];
    const [modelName, ...pathSegments] = segments;
    if (!modelName) {
      return Response.json(
        { error: "No model specified in path." },
        { status: 400 }
      );
    }
    const url = new URL(req.url);
    let body = {};
    if (req.method !== "GET" && req.method !== "DELETE") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }
    let operation;
    let id = null;
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

exports.buildModelMap = buildModelMap;
exports.buildQuery = buildQuery;
exports.buildRuntimeSchemas = buildRuntimeSchemas;
exports.createRouter = createRouter;
exports.expressAdapter = expressAdapter;
exports.fastifyAdapter = fastifyAdapter;
exports.generateOpenApiSpec = generateOpenApiSpec;
exports.generateZodSchemas = generateZodSchemas;
exports.getDelegate = getDelegate;
exports.getModels = getModels;
exports.nextjsAdapter = nextjsAdapter;
exports.runGuard = runGuard;
exports.runHook = runHook;
exports.toRouteName = toRouteName;
exports.validateBody = validateBody;
exports.withValidation = withValidation;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map