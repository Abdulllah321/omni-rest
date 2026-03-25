import { buildRuntimeSchemas } from "./zod-generator";
import type { PrismaRestOptions } from "./types";

let cachedSchemas: ReturnType<typeof buildRuntimeSchemas> | null = null;

function getSchemas() {
  if (!cachedSchemas) {
    cachedSchemas = buildRuntimeSchemas();
  }
  return cachedSchemas;
}

/**
 * Validates a request body against the auto-generated Zod schema for a model.
 *
 * Returns null if valid, or an error message string if invalid.
 *
 * @param modelRouteName  e.g. "department"
 * @param method          HTTP method — POST uses createSchema, PUT/PATCH uses updateSchema
 * @param body            Request body object
 */
export function validateBody(
  modelRouteName: string,
  method: string,
  body: any
): string | null {
  let schemas: ReturnType<typeof buildRuntimeSchemas>;

  try {
    schemas = getSchemas();
  } catch {
    // zod not installed — skip validation silently
    return null;
  }

  const modelSchemas = schemas[modelRouteName];
  if (!modelSchemas) return null;

  const schema =
    method === "POST" ? modelSchemas.create : modelSchemas.update;

  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues
      .map((i: any) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    return `Validation failed — ${issues}`;
  }

  return null;
}

/**
 * Creates a guard function that validates the request body automatically.
 * Plug this into the guards option to get free validation.
 *
 * @example
 * ```ts
 * import { withValidation } from "prisma-rest";
 *
 * expressAdapter(prisma, {
 *   guards: withValidation(),  // validates ALL models
 * });
 * ```
 */
export function withValidation(overrides: PrismaRestOptions["guards"] = {}) {
  const handler = ({ id, body, method }: any) => {
    const modelName = (handler as any).__model;
    const error = validateBody(modelName, method, body);
    return error ?? null;
  };

  return new Proxy(overrides, {
    get(target, modelName: string) {
      if (modelName in target) return target[modelName];

      // Return a guard map for each model that validates on write
      return {
        POST: ({ body }: any) => validateBody(modelName, "POST", body),
        PUT: ({ body }: any) => validateBody(modelName, "PUT", body),
        PATCH: ({ body }: any) => validateBody(modelName, "PATCH", body),
      };
    },
  });
}