import { PrismaClient } from '@prisma/client';
import { P as PrismaRestOptions, R as RouterInstance, M as ModelMeta, a as ParsedQuery, G as GuardMap, H as HookFn, b as HookContext } from './types-CzjpYtyN.mjs';
export { F as FieldMeta, c as GuardFn, d as HandlerResult } from './types-CzjpYtyN.mjs';
export { expressAdapter } from './adapters/express.mjs';
export { nextjsAdapter } from './adapters/nextjs.mjs';
export { fastifyAdapter } from './adapters/fastify.mjs';

/**
 * Creates a framework-agnostic CRUD router powered by Prisma DMMF.
 *
 * All adapters (Express, Next.js, Fastify) use this under the hood.
 */
declare function createRouter(prisma: PrismaClient, options?: PrismaRestOptions): RouterInstance;

/**
 * Reads Prisma's DMMF (Data Model Meta Format) at runtime
 * and returns structured metadata for every model in your schema.
 *
 * No file reading. No code generation. Pure runtime introspection.
 */
declare function getModels(prisma?: any): ModelMeta[];
/**
 * Converts a Prisma model name to a URL-safe route segment.
 * "UserProfile" → "userprofile"
 * "OrderItem"   → "orderitem"
 */
declare function toRouteName(modelName: string): string;
/**
 * Returns a map of routeName → ModelMeta for O(1) lookups.
 */
declare function buildModelMap(models: ModelMeta[], allowList?: string[]): Record<string, ModelMeta>;
/**
 * Gets the Prisma client delegate for a model.
 * prisma["userProfile"] or prisma["user"] — handles camelCase.
 */
declare function getDelegate(prisma: any, meta: ModelMeta): any;

/**
 * Parses URLSearchParams into a full Prisma query object.
 *
 * Supports:
 *   Filtering  → ?name=John  ?age_gte=18  ?status_in=a,b
 *   Sorting    → ?sort=createdAt:desc  or  ?sort=name:asc
 *   Pagination → ?page=2&limit=10
 *   Relations  → ?include=posts,profile
 *   Fields     → ?select=id,name,email
 */
declare function buildQuery(searchParams: URLSearchParams, defaultLimit?: number, maxLimit?: number): ParsedQuery;

/**
 * Runs the guard for the given model+method combo.
 * Returns an error string if blocked, null if allowed.
 */
declare function runGuard(guards: GuardMap, model: string, method: string, ctx: {
    id?: string | null;
    body?: any;
}): Promise<string | null>;
/**
 * Runs a lifecycle hook (beforeOperation / afterOperation).
 * Silently swallows errors so hooks never crash the main flow.
 */
declare function runHook(hook: HookFn | undefined, ctx: HookContext): Promise<void>;

/**
 * Generates a complete Zod schema file for ALL models in your Prisma schema.
 *
 * @example
 * ```ts
 * import { generateZodSchemas } from "omni-rest";
 * const code = generateZodSchemas();
 * fs.writeFileSync("src/schemas.ts", code);
 * ```
 */
declare function generateZodSchemas(): string;
/**
 * Returns Zod schema OBJECTS at runtime (not source code).
 * Useful for request validation in middleware.
 *
 * Requires "zod" to be installed in the host project.
 */
declare function buildRuntimeSchemas(): Record<string, {
    create: any;
    update: any;
}>;

/**
 * Validates a request body against the auto-generated Zod schema for a model.
 *
 * Returns null if valid, or an error message string if invalid.
 *
 * @param modelRouteName  e.g. "department"
 * @param method          HTTP method — POST uses createSchema, PUT/PATCH uses updateSchema
 * @param body            Request body object
 */
declare function validateBody(modelRouteName: string, method: string, body: any): string | null;
/**
 * Creates a guard function that validates the request body automatically.
 * Plug this into the guards option to get free validation.
 *
 * @example
 * ```ts
 * import { withValidation } from "omni-rest";
 *
 * expressAdapter(prisma, {
 *   guards: withValidation(),  // validates ALL models
 * });
 * ```
 */
declare function withValidation(overrides?: PrismaRestOptions["guards"]): GuardMap;

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
declare function generateOpenApiSpec(prisma: any, options?: {
    title?: string;
    version?: string;
    basePath?: string;
    allow?: string[];
    servers?: {
        url: string;
        description?: string;
    }[];
}): object;

export { GuardMap, HookContext, HookFn, ModelMeta, ParsedQuery, PrismaRestOptions, RouterInstance, buildModelMap, buildQuery, buildRuntimeSchemas, createRouter, generateOpenApiSpec, generateZodSchemas, getDelegate, getModels, runGuard, runHook, toRouteName, validateBody, withValidation };
