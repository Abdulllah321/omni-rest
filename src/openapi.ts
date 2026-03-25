import { getModels } from "./introspect";
import type { ModelMeta, FieldMeta } from "./types";

/**
 * Maps Prisma scalar types → OpenAPI schema types
 */
const PRISMA_TO_OAS: Record<string, { type: string; format?: string }> = {
  String: { type: "string" },
  Int: { type: "integer", format: "int32" },
  Float: { type: "number", format: "float" },
  Decimal: { type: "number" },
  Boolean: { type: "boolean" },
  DateTime: { type: "string", format: "date-time" },
  Json: { type: "object" },
  BigInt: { type: "integer", format: "int64" },
};

function fieldToOasSchema(field: FieldMeta): any {
  if (field.isRelation) return null;
  const base = PRISMA_TO_OAS[field.type] ?? { type: "string" };
  if (field.isList) return { type: "array", items: base };
  return base;
}

function buildModelSchema(meta: ModelMeta, forCreate = false): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const field of meta.fields) {
    if (field.isRelation) continue;
    if (forCreate && field.isId) continue; // id is auto on create

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
    ...(required.length > 0 ? { required } : {}),
  };
}

/**
 * Generates a full OpenAPI 3.0 specification object for all exposed models.
 *
 * @example
 * ```ts
 * import { generateOpenApiSpec } from "omni-rest";
 * const spec = generateOpenApiSpec(prisma, { title: "My API", version: "1.0.0", basePath: "/api" });
 * fs.writeFileSync("openapi.json", JSON.stringify(spec, null, 2));
 * ```
 */
export function generateOpenApiSpec(
  prisma: any,
  options: {
    title?: string;
    version?: string;
    basePath?: string;
    allow?: string[];
    servers?: { url: string; description?: string }[];
  } = {}
): object {
  const {
    title = "omni-rest API",
    version = "1.0.0",
    basePath = "/api",
    allow,
    servers = [{ url: "http://localhost:3000" }],
  } = options;

  const models = getModels(prisma).filter(
    (m) => !allow || allow.includes(m.routeName)
  );

  const paths: Record<string, any> = {};
  const schemas: Record<string, any> = {};

  for (const meta of models) {
    const name = meta.name;
    const route = meta.routeName;

    // ── Schemas ──────────────────────────────────────────────────────────────
    schemas[name] = buildModelSchema(meta, false);
    schemas[`${name}Create`] = buildModelSchema(meta, true);
    schemas[`${name}Update`] = {
      ...buildModelSchema(meta, true),
      required: [], // all optional for PATCH
    };

    // ── Collection path /api/:model ───────────────────────────────────────────
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
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: `Create ${name}`,
        tags: [name],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${name}Create` },
            },
          },
        },
        responses: {
          201: {
            description: `Created ${name}`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${name}` },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" },
        },
      },
    };

    // ── Resource path /api/:model/:id ─────────────────────────────────────────
    paths[`${basePath}/${route}/{id}`] = {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: `${name} ID`,
        },
      ],
      get: {
        summary: `Get ${name} by ID`,
        tags: [name],
        responses: {
          200: {
            description: `${name} record`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${name}` },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        summary: `Update ${name}`,
        tags: [name],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${name}Create` },
            },
          },
        },
        responses: {
          200: {
            description: `Updated ${name}`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${name}` },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        summary: `Partially update ${name}`,
        tags: [name],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${name}Update` },
            },
          },
        },
        responses: {
          200: {
            description: `Updated ${name}`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${name}` },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        summary: `Delete ${name}`,
        tags: [name],
        responses: {
          204: { description: "Deleted successfully" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    };

    // ── Bulk operations paths ──────────────────────────────────────────────────
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
                items: { $ref: `#/components/schemas/${name}Update` },
              },
            },
          },
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
                      items: { $ref: `#/components/schemas/${name}` },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
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
                items: { type: "string" },
              },
            },
          },
        },
        responses: {
          200: {
            description: `Bulk delete result`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deleted: { type: "integer" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
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
            totalPages: { type: "integer" },
          },
        },
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
        },
      },
      responses: {
        NotFound: {
          description: "Record not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        BadRequest: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Conflict: {
          description: "Unique constraint violation",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    tags: models.map((m) => ({ name: m.name })),
  };
}

function buildListParameters() {
  return [
    { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
    { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Items per page" },
    { name: "sort", in: "query", schema: { type: "string" }, description: "e.g. createdAt:desc" },
    { name: "include", in: "query", schema: { type: "string" }, description: "Comma-separated relations" },
    { name: "select", in: "query", schema: { type: "string" }, description: "Comma-separated fields" },
  ];
}