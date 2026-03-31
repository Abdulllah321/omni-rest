'use strict';

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);

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
    softDeleteField
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
        operation,
        softDelete,
        softDeleteField
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
async function executeOperation(prisma, meta, method, id, body, searchParams, defaultLimit, maxLimit, operation, softDelete = false, softDeleteField) {
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
    const softDeleteInfo = softDelete ? detectSoftDeleteField(meta.fields, softDeleteField) : null;
    const listWhere = softDeleteInfo ? { ...where, [softDeleteInfo.field]: softDeleteInfo.field === "isActive" ? true : null } : where;
    const [data, total] = await prisma.$transaction([
      delegate.findMany({ where: listWhere, orderBy, skip, take, ...projection }),
      delegate.count({ where: listWhere })
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
    const softDeleteInfo = softDelete ? detectSoftDeleteField(meta.fields, softDeleteField) : null;
    if (softDeleteInfo) {
      const record = await delegate.update({
        where: { [meta.idField]: coerceId(id) },
        data: { [softDeleteInfo.field]: softDeleteInfo.value }
      });
      return { status: 200, data: record };
    }
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
  const createFields = meta.fields.filter((f) => !f.isRelation && !f.isId && !f.hasDefaultValue && !f.isUpdatedAt).map((f) => {
    const zodExpr = fieldToZod(f);
    if (!zodExpr) return null;
    return `  ${f.name}: ${zodExpr},`;
  }).filter(Boolean).join("\n");
  const updateFields = meta.fields.filter((f) => !f.isRelation && !f.isId && !f.isUpdatedAt).map((f) => {
    const zodExpr = fieldToZod(f);
    if (!zodExpr) return null;
    const optionalZod = zodExpr.includes(".optional()") ? zodExpr : `${zodExpr}.optional()`;
    return `  ${f.name}: ${optionalZod},`;
  }).filter(Boolean).join("\n");
  return `
// \u2500\u2500\u2500 ${name} \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export const ${name}CreateSchema = z.object({
${createFields}
});

export const ${name}UpdateSchema = z.object({
${updateFields}
});

export type ${name}Create = z.infer<typeof ${name}CreateSchema>;
export type ${name}Update = z.infer<typeof ${name}UpdateSchema>;
`.trim();
}
function generateZodSchemas(prisma) {
  const models = getModels(prisma);
  const schemas = models.map(generateModelSchema).join("\n\n");
  return `/**
 * Auto-generated Zod schemas from Prisma schema.
 * Generated by omni-rest \u2014 do not edit manually.
 * Re-run after schema changes.
 */
import { z } from "zod";

${schemas}
`;
}
function buildRuntimeSchemas(prisma) {
  let z;
  try {
    z = __require("zod").z;
  } catch {
    throw new Error(
      "[omni-rest] zod is required for runtime validation. Run: npm install zod"
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
  const models = getModels(prisma);
  const result = {};
  for (const meta of models) {
    const createShape = {};
    const updateShape = {};
    for (const field of meta.fields) {
      if (field.isRelation) continue;
      const factory = ZOD_FACTORIES[field.type] ?? (() => z.any());
      let schema = factory();
      if (!field.isRequired) schema = schema.optional();
      if (field.isList) schema = z.array(schema);
      if (!field.isId && !field.hasDefaultValue && !field.isUpdatedAt) {
        createShape[field.name] = schema;
      }
      if (!field.isId && !field.isUpdatedAt) {
        updateShape[field.name] = schema.optional();
      }
    }
    const createSchema = z.object(createShape);
    const updateSchema = z.object(updateShape);
    result[meta.routeName] = {
      create: createSchema,
      update: updateSchema
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
    title = "omni-rest API",
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

// src/config-generator.ts
function generateConfig(prisma) {
  const models = getModels(prisma);
  const PRISMA_TO_ZOD2 = {
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
  function fieldToZod2(field) {
    if (field.isRelation) return null;
    let zod = PRISMA_TO_ZOD2[field.type] ?? "z.any()";
    if (!field.isRequired) zod = `${zod}.optional()`;
    if (field.isList) zod = `z.array(${zod})`;
    return zod;
  }
  const schemaBlocks = models.map((meta) => {
    const createFields = meta.fields.filter((f) => !f.isRelation && !f.isId && !f.hasDefaultValue && !f.isUpdatedAt).map((f) => {
      const z = fieldToZod2(f);
      return z ? `  ${f.name}: ${z},` : null;
    }).filter(Boolean).join("\n");
    const updateFields = meta.fields.filter((f) => !f.isRelation && !f.isId && !f.isUpdatedAt).map((f) => {
      const z = fieldToZod2(f);
      if (!z) return null;
      const opt = z.includes(".optional()") ? z : `${z}.optional()`;
      return `  ${f.name}: ${opt},`;
    }).filter(Boolean).join("\n");
    return `
// \u2500\u2500\u2500 ${meta.name} \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export const ${meta.name}CreateSchema = z.object({
${createFields}
});

export const ${meta.name}UpdateSchema = z.object({
${updateFields}
});

export type ${meta.name}Create = z.infer<typeof ${meta.name}CreateSchema>;
export type ${meta.name}Update = z.infer<typeof ${meta.name}UpdateSchema>;`.trim();
  });
  const zodSchemas = `/**
 * Auto-generated Zod schemas from Prisma schema.
 * Generated by omni-rest \u2014 do not edit manually.
 */
import { z } from "zod";

${schemaBlocks.join("\n\n")}
`;
  return {
    version: "1",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    models,
    zodSchemas
  };
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

// src/adapters/koa.ts
function koaAdapter(router, prisma, options = {}) {
  const { handle } = createRouter(prisma, options);
  const getSearchParams = (ctx) => {
    return new URLSearchParams(
      Object.entries(ctx.query).map(([k, v]) => `${k}=${v}`).join("&")
    );
  };
  const koaHandler = async (ctx) => {
    try {
      const { status, data } = await handle(
        ctx.method,
        ctx.params.model,
        ctx.params.id ?? null,
        ctx.request.body ?? {},
        getSearchParams(ctx)
      );
      ctx.status = status;
      if (status !== 204) {
        ctx.body = data;
      }
    } catch (e) {
      ctx.status = 500;
      ctx.body = { error: e.message };
    }
  };
  router.patch("/:model/bulk/update", async (ctx) => {
    try {
      const { status, data } = await handle(
        "PATCH",
        ctx.params.model,
        null,
        ctx.request.body ?? [],
        getSearchParams(ctx),
        "bulk-update"
      );
      ctx.status = status;
      if (status !== 204) {
        ctx.body = data;
      }
    } catch (e) {
      ctx.status = 500;
      ctx.body = { error: e.message };
    }
  });
  router.delete("/:model/bulk/delete", async (ctx) => {
    try {
      const { status, data } = await handle(
        "DELETE",
        ctx.params.model,
        null,
        ctx.request.body ?? [],
        getSearchParams(ctx),
        "bulk-delete"
      );
      ctx.status = status;
      if (status !== 204) {
        ctx.body = data;
      }
    } catch (e) {
      ctx.status = 500;
      ctx.body = { error: e.message };
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

// src/adapters/hapi.ts
var hapiAdapter = {
  name: "omni-rest",
  version: "1.0.0",
  register: async (server, options) => {
    if (!options.prisma) {
      throw new Error("[omni-rest/hapi] You must provide the prisma client inside options.prisma");
    }
    const { prisma, prefix = "", ...restOptions } = options;
    const { handle } = createRouter(prisma, restOptions);
    const getSearchParams = (request) => {
      const urlParams = new URLSearchParams();
      for (const [key, value] of Object.entries(request.query || {})) {
        if (Array.isArray(value)) {
          value.forEach((v) => urlParams.append(key, v));
        } else {
          urlParams.append(key, value);
        }
      }
      return urlParams;
    };
    const handler = async (request, h) => {
      try {
        const { status, data } = await handle(
          request.method.toUpperCase(),
          request.params.model,
          request.params.id ?? null,
          request.payload ?? {},
          getSearchParams(request)
        );
        if (status === 204) {
          return h.response().code(204);
        }
        return h.response(data).code(status);
      } catch (e) {
        return h.response({ error: e.message }).code(500);
      }
    };
    const bulkUpdateHandler = async (request, h) => {
      try {
        const { status, data } = await handle(
          "PATCH",
          request.params.model,
          null,
          request.payload ?? [],
          getSearchParams(request),
          "bulk-update"
        );
        if (status === 204) return h.response().code(204);
        return h.response(data).code(status);
      } catch (e) {
        return h.response({ error: e.message }).code(500);
      }
    };
    const bulkDeleteHandler = async (request, h) => {
      try {
        const { status, data } = await handle(
          "DELETE",
          request.params.model,
          null,
          request.payload ?? [],
          getSearchParams(request),
          "bulk-delete"
        );
        if (status === 204) return h.response().code(204);
        return h.response(data).code(status);
      } catch (e) {
        return h.response({ error: e.message }).code(500);
      }
    };
    server.route({
      method: "PATCH",
      path: `${prefix}/{model}/bulk/update`,
      handler: bulkUpdateHandler
    });
    server.route({
      method: "DELETE",
      path: `${prefix}/{model}/bulk/delete`,
      handler: bulkDeleteHandler
    });
    server.route({
      method: ["GET", "POST"],
      path: `${prefix}/{model}`,
      handler
    });
    server.route({
      method: ["GET", "PUT", "PATCH", "DELETE"],
      path: `${prefix}/{model}/{id}`,
      handler
    });
  }
};

// src/adapters/nestjs.ts
function nestjsController(prisma, options = {}, prefix = "api") {
  const { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, Req, Res, HttpStatus } = __require("@nestjs/common");
  const { handle } = createRouter(prisma, options);
  const getSearchParams = (query) => {
    return new URLSearchParams(
      Object.entries(query || {}).map(([k, v]) => `${k}=${v}`).join("&")
    );
  };
  let OmniRestDynamicController = class {
    async bulkUpdate(model, body, query, res) {
      try {
        const { status, data } = await handle("PATCH", model, null, body ?? [], getSearchParams(query), "bulk-update");
        if (status === 204) return res.status(HttpStatus.NO_CONTENT).send();
        return res.status(status).json(data);
      } catch (e) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
      }
    }
    async bulkDelete(model, body, query, res) {
      try {
        const { status, data } = await handle("DELETE", model, null, body ?? [], getSearchParams(query), "bulk-delete");
        if (status === 204) return res.status(HttpStatus.NO_CONTENT).send();
        return res.status(status).json(data);
      } catch (e) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
      }
    }
    async list(model, query, res) {
      return await this._processRequest("GET", model, null, {}, query, res);
    }
    async create(model, body, query, res) {
      return await this._processRequest("POST", model, null, body, query, res);
    }
    async read(model, id, query, res) {
      return await this._processRequest("GET", model, id, {}, query, res);
    }
    async replace(model, id, body, query, res) {
      return await this._processRequest("PUT", model, id, body, query, res);
    }
    async update(model, id, body, query, res) {
      return await this._processRequest("PATCH", model, id, body, query, res);
    }
    async remove(model, id, query, res) {
      return await this._processRequest("DELETE", model, id, {}, query, res);
    }
    async _processRequest(method, model, id, body, query, res) {
      try {
        const { status, data } = await handle(method, model, id, body ?? {}, getSearchParams(query));
        if (status === 204) {
          return res.status(HttpStatus.NO_CONTENT).send();
        }
        return res.status(status).json(data);
      } catch (e) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
      }
    }
  };
  __decorateClass([
    Patch(":model/bulk/update"),
    __decorateParam(0, Param("model")),
    __decorateParam(1, Body()),
    __decorateParam(2, Query()),
    __decorateParam(3, Res())
  ], OmniRestDynamicController.prototype, "bulkUpdate", 1);
  __decorateClass([
    Delete(":model/bulk/delete"),
    __decorateParam(0, Param("model")),
    __decorateParam(1, Body()),
    __decorateParam(2, Query()),
    __decorateParam(3, Res())
  ], OmniRestDynamicController.prototype, "bulkDelete", 1);
  __decorateClass([
    Get(":model"),
    __decorateParam(0, Param("model")),
    __decorateParam(1, Query()),
    __decorateParam(2, Res())
  ], OmniRestDynamicController.prototype, "list", 1);
  __decorateClass([
    Post(":model"),
    __decorateParam(0, Param("model")),
    __decorateParam(1, Body()),
    __decorateParam(2, Query()),
    __decorateParam(3, Res())
  ], OmniRestDynamicController.prototype, "create", 1);
  __decorateClass([
    Get(":model/:id"),
    __decorateParam(0, Param("model")),
    __decorateParam(1, Param("id")),
    __decorateParam(2, Query()),
    __decorateParam(3, Res())
  ], OmniRestDynamicController.prototype, "read", 1);
  __decorateClass([
    Put(":model/:id"),
    __decorateParam(0, Param("model")),
    __decorateParam(1, Param("id")),
    __decorateParam(2, Body()),
    __decorateParam(3, Query()),
    __decorateParam(4, Res())
  ], OmniRestDynamicController.prototype, "replace", 1);
  __decorateClass([
    Patch(":model/:id"),
    __decorateParam(0, Param("model")),
    __decorateParam(1, Param("id")),
    __decorateParam(2, Body()),
    __decorateParam(3, Query()),
    __decorateParam(4, Res())
  ], OmniRestDynamicController.prototype, "update", 1);
  __decorateClass([
    Delete(":model/:id"),
    __decorateParam(0, Param("model")),
    __decorateParam(1, Param("id")),
    __decorateParam(2, Query()),
    __decorateParam(3, Res())
  ], OmniRestDynamicController.prototype, "remove", 1);
  OmniRestDynamicController = __decorateClass([
    Controller(prefix)
  ], OmniRestDynamicController);
  return OmniRestDynamicController;
}

exports.buildModelMap = buildModelMap;
exports.buildQuery = buildQuery;
exports.buildRuntimeSchemas = buildRuntimeSchemas;
exports.createRouter = createRouter;
exports.expressAdapter = expressAdapter;
exports.fastifyAdapter = fastifyAdapter;
exports.generateConfig = generateConfig;
exports.generateOpenApiSpec = generateOpenApiSpec;
exports.generateZodSchemas = generateZodSchemas;
exports.getDelegate = getDelegate;
exports.getModels = getModels;
exports.hapiAdapter = hapiAdapter;
exports.koaAdapter = koaAdapter;
exports.nestjsController = nestjsController;
exports.nextjsAdapter = nextjsAdapter;
exports.runGuard = runGuard;
exports.runHook = runHook;
exports.toRouteName = toRouteName;
exports.validateBody = validateBody;
exports.withValidation = withValidation;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map