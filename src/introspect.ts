import { Prisma } from "@prisma/client";
import type { ModelMeta, FieldMeta } from "./types";

/**
 * Reads Prisma's DMMF (Data Model Meta Format) at runtime
 * and returns structured metadata for every model in your schema.
 *
 * No file reading. No code generation. Pure runtime introspection.
 */
export function getModels(prisma?: any): ModelMeta[] {
  let raw: any[] | undefined;

  // Try to get from PrismaClient instance first (new v5 format)
  if (prisma?._runtimeDataModel?.models) {
    const modelsObj = prisma._runtimeDataModel.models;
    // Convert object to array, adding name from key
    raw = Object.entries(modelsObj).map(([name, model]: [string, any]) => ({
      name,
      ...model,
      fields: (model.fields || []).map((f: any) => ({
        ...f,
        relationName: f.kind === "object" ? f.name : undefined,
      })),
    }));
  }

  // Fallback to DMMF from @prisma/client module
  if (!raw) {
    const dmmfModels =
      (Prisma as any)?.dmmf?.datamodel?.models ||
      (require("@prisma/client")?.Prisma as any)?.dmmf?.datamodel?.models;

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

  return raw.map((model: any) => {
    const fields: FieldMeta[] = model.fields.map((f: any) => ({
      name: f.name,
      type: f.type,
      isId: f.isId,
      isRequired: f.isRequired,
      isList: f.isList,
      isRelation: !!f.relationName,
    }));

    const idField =
      model.fields.find((f: any) => f.isId)?.name ?? "id";

    return {
      name: model.name,
      routeName: toRouteName(model.name),
      fields,
      idField,
    };
  });
}

/**
 * Converts a Prisma model name to a URL-safe route segment.
 * "UserProfile" → "userprofile"
 * "OrderItem"   → "orderitem"
 */
export function toRouteName(modelName: string): string {
  return modelName.toLowerCase();
}

/**
 * Returns a map of routeName → ModelMeta for O(1) lookups.
 */
export function buildModelMap(
  models: ModelMeta[],
  allowList?: string[]
): Record<string, ModelMeta> {
  const filtered = allowList
    ? models.filter((m) => allowList.includes(m.routeName))
    : models;

  return Object.fromEntries(filtered.map((m) => [m.routeName, m]));
}

/**
 * Gets the Prisma client delegate for a model.
 * prisma["userProfile"] or prisma["user"] — handles camelCase.
 */
export function getDelegate(prisma: any, meta: ModelMeta): any {
  // Prisma client properties are camelCase of model name
  // "UserProfile" → "userProfile"
  const key =
    meta.name.charAt(0).toLowerCase() + meta.name.slice(1);
  const delegate = prisma[key];

  if (!delegate) {
    throw new Error(
      `Could not find Prisma delegate for model "${meta.name}". ` +
        `Expected prisma.${key} to exist.`
    );
  }

  return delegate;
}