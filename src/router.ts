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
} from "./types";

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
} = options;

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

```
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

const guardError = await runGuard(guards, meta.routeName, method, {
  id,
  body,
});

if (guardError) {
  return { status: 403, data: { error: guardError } };
}

await runHook(beforeOperation, { model: meta.name, method, id, body });

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

await runHook(afterOperation, {
  model: meta.name,
  method,
  id,
  body,
  result: result.data,
});

return result;
```

}

return { handle, modelMap, models };
}

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

const includeArg = Object.keys(include).length > 0 ? include : undefined;
const selectArg = select && Object.keys(select).length > 0 ? select : undefined;

const projection = selectArg
? { select: selectArg }
: includeArg
? { include: includeArg }
: {};

const safeBody = sanitizeBody(body, fg);

// BULK CREATE
if (method === "POST" && id === "bulk") {
if (!Array.isArray(body) || body.length === 0) {
return {
status: 400,
data: { error: "Request body must be a non-empty array" },
};
}

```
const result = await delegate.createMany({
  data: body,
});

return {
  status: 201,
  data: { count: result.count },
};
```

}

// BULK UPDATE
if (method === "PUT" && id === "bulk") {
const { where, data } = body || {};

```
if (!where || !data) {
  return {
    status: 400,
    data: { error: "Body must contain { where, data }" },
  };
}

const result = await delegate.updateMany({
  where,
  data,
});

return {
  status: 200,
  data: { count: result.count },
};
```

}

// BULK DELETE
if (method === "DELETE" && id === "bulk") {
const { where } = body || {};

```
if (!where) {
  return {
    status: 400,
    data: { error: "Body must contain { where }" },
  };
}

const result = await delegate.deleteMany({
  where,
});

return {
  status: 200,
  data: { count: result.count },
};
```

}

// GET LIST
if (method === "GET" && !id) {

```
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
  return {
    status: 200,
    data: safeData,
    headers: { "X-Total-Count": String(total) },
  };
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
```

}

// GET BY ID
if (method === "GET" && id) {
const record = await delegate.findUnique({
where: { [meta.idField]: coerceId(id) },
...projection,
});

```
if (!record) {
  return { status: 404, data: { error: `${meta.name} with id "${id}" not found.` } };
}

return { status: 200, data: stripResponse(record, fg) };
```

}

// CREATE
if (method === "POST" && !id) {
const record = await delegate.create({ data: safeBody });
return { status: 201, data: stripResponse(record, fg) };
}

// UPDATE
if ((method === "PUT" || method === "PATCH") && id) {
const record = await delegate.update({
where: { [meta.idField]: coerceId(id) },
data: safeBody,
});

```
return { status: 200, data: stripResponse(record, fg) };
```

}

// DELETE
if (method === "DELETE" && id) {

```
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

await delegate.delete({
  where: { [meta.idField]: coerceId(id) },
});

return { status: 204, data: null };
```

}

return { status: 405, data: { error: `Method ${method} not allowed.` } };
}

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

function coerceId(id: string): string | number {
const n = Number(id);
return isNaN(n) ? id : n;
}

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

return {
status: 500,
data: { error: e?.message ?? "Internal server error." },
};
}
