/**
 * omni-rest
 * Auto-generate REST APIs from your Prisma schema.
 *
 * Inspired by PostgREST — but for Prisma, TypeScript, and any Node.js framework.
 */

// ─── Core ─────────────────────────────────────────────────────────────────────
export { createRouter } from "./router";
export { getModels, buildModelMap, getDelegate, toRouteName } from "./introspect";
export { buildQuery } from "./query-builder";
export { runGuard, runHook } from "./middleware";

// ─── Zod + Validation ────────────────────────────────────────────────────────
export { generateZodSchemas, buildRuntimeSchemas } from "./zod-generator";
export { validateBody, withValidation } from "./validate";

// ─── OpenAPI ──────────────────────────────────────────────────────────────────
export { generateOpenApiSpec } from "./openapi";

// ─── Adapters ─────────────────────────────────────────────────────────────────
export { expressAdapter } from "./adapters/express";
export { nextjsAdapter } from "./adapters/nextjs";
export { fastifyAdapter } from "./adapters/fastify";
export { koaAdapter } from "./adapters/koa";
export { hapiAdapter } from "./adapters/hapi";
export { nestjsController } from "./adapters/nestjs";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  PrismaRestOptions,
  ModelMeta,
  FieldMeta,
  ParsedQuery,
  HandlerResult,
  RouterInstance,
  GuardFn,
  GuardMap,
  HookFn,
  HookContext,
} from "./types";