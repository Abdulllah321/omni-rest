import { PrismaClient } from "@prisma/client";

// ─── Model Meta ──────────────────────────────────────────────────────────────

export interface FieldMeta {
  name: string;
  type: string;
  isId: boolean;
  isRequired: boolean;
  isList: boolean;
  isRelation: boolean;
  hasDefaultValue: boolean;  // Has @default() or @default(autoincrement())
  isUpdatedAt: boolean;      // Has @updatedAt
}

export interface ModelMeta {
  name: string;          // "UserProfile" — original Prisma model name
  routeName: string;     // "userprofile" — used in URL
  fields: FieldMeta[];
  idField: string;       // "id" by default, or custom @id field
}

// ─── Options ─────────────────────────────────────────────────────────────────

export type GuardFn = (ctx: {
  id?: string | null;
  body?: any;
  method: string;
}) => string | null | Promise<string | null>;

export type GuardMap = {
  [modelName: string]: {
    GET?: GuardFn;
    POST?: GuardFn;
    PUT?: GuardFn;
    PATCH?: GuardFn;
    DELETE?: GuardFn;
  };
};

export interface HookContext {
  model: string;
  method: string;
  id?: string | null;
  body?: any;
  result?: any;
}

export type HookFn = (ctx: HookContext) => void | Promise<void>;

export interface PrismaRestOptions {
  /** Whitelist of model route names to expose. Defaults to ALL models. */
  allow?: string[];

  /** Guard functions per model per method. Return error string to block. */
  guards?: GuardMap;

  /** Hook called before every operation */
  beforeOperation?: HookFn;

  /** Hook called after every successful operation */
  afterOperation?: HookFn;

  /** Default page size. Defaults to 20. */
  defaultLimit?: number;

  /**
   * Default pagination mode. Defaults to "offset".
   * Can be overridden per request via `?paginationMode=cursor|offset`.
   */
  paginationMode?: "offset" | "cursor";

  /** Max allowed page size. Defaults to 100. */
  maxLimit?: number;

  /** Prefix path (used by some adapters). e.g. "/api/master" */
  prefix?: string;

  /**
   * Enable soft delete. When true, DELETE sets the soft-delete field instead
   * of destroying the record. Auto-detected from DMMF if the model has a
   * `deletedAt` (DateTime) or `isActive` (Boolean) field.
   */
  softDelete?: boolean;

  /**
   * Field name to use for soft delete. Defaults to auto-detection:
   * "deletedAt" (set to new Date()) or "isActive" (set to false).
   * Explicit value overrides auto-detection.
   */
  softDeleteField?: string;

  /**
   * Wrap list responses in `{ data, meta }`. Defaults to true.
   * When false, returns a plain array and sets X-Total-Count header instead.
   */
  envelope?: boolean;

  /**
   * Field-level access control per model.
   * - hidden:    never returned in any response (passwords, secrets)
   * - readOnly:  stripped from write bodies before Prisma (id, createdAt)
   * - writeOnly: stripped from GET responses (write-only fields like raw passwords)
   */
  fieldGuards?: FieldGuardMap;

  /**
   * Optional rate-limiting function called before every request (after model
   * resolution). Return an error string to block with 429, or null to allow.
   *
   * @example
   * ```ts
   * omniRest(prisma, {
   *   rateLimit: async ({ model, method, id }) => {
   *     const count = await redis.incr(`${model}:${method}`);
   *     if (count > 100) return "Too many requests. Slow down.";
   *     return null;
   *   }
   * })
   * ```
   */
  rateLimit?: RateLimitFn;

  /**
   * Configuration for the SSE subscription engine.
   *
   * When omitted, the engine defaults are used (1 s poll, 30 s heartbeat).
   * The engine itself is **lazy** — no Prisma queries are issued for a model
   * until at least one client connects to `GET /:model/subscribe`.
   */
  subscription?: SubscriptionOptions;

  /**
   * Feature flags to toggle specific endpoints.
   */
  features?: FeaturesConfig;

  /**
   * Complexity limits to protect against abusive queries.
   */
  complexity?: ComplexityOptions;
}

// ─── Features ─────────────────────────────────────────────────────────────────

export interface FeaturesConfig {
  /**
   * Enable /aggregate and /groupBy endpoints.
   * Defaults to true.
   */
  aggregation?: boolean;
}

// ─── Complexity ───────────────────────────────────────────────────────────────

export interface ComplexityRules {
  /** Cost per relation included in ?include= */
  perInclude?: number;
  /** Cost per top-level filter key */
  perFilter?: number;
  /** Cost per sort field */
  perSort?: number;
  /** Cost per 100 limit */
  perLimit100?: number;
}

export interface ComplexityOptions {
  /** Maximum allowed score before returning 429 */
  maxScore: number;
  /** Rules for computing query score */
  rules: ComplexityRules;
}

// ─── Rate Limit ───────────────────────────────────────────────────────────────

export type RateLimitFn = (ctx: {
  model: string;
  method: string;
  id?: string | null;
}) => string | null | Promise<string | null>;

// ─── Field Guards ─────────────────────────────────────────────────────────────

export interface FieldGuardConfig {
  /** Fields never included in any response. */
  hidden?: string[];
  /** Fields stripped from POST/PUT/PATCH bodies before reaching Prisma. */
  readOnly?: string[];
  /** Fields included in write bodies but never returned in GET responses. */
  writeOnly?: string[];
}

export type FieldGuardMap = {
  [modelRouteName: string]: FieldGuardConfig;
};

// ─── Query ───────────────────────────────────────────────────────────────────

export interface ParsedQuery {
  where: Record<string, any>;
  orderBy: Record<string, any>;
  skip: number;
  take: number;
  cursor?: Record<string, any>;
  paginationMode: "offset" | "cursor";
  include: Record<string, boolean>;
  select: Record<string, boolean> | null;
}

// ─── SSE / Subscriptions ─────────────────────────────────────────────────────

/** A single event emitted over an SSE subscription stream. */
export interface SseEvent {
  /** The mutation type that triggered this event. */
  event: "create" | "update" | "delete";
  /** Original Prisma model name (e.g. "Department"). */
  model: string;
  /** Full record for create/update events (respects fieldGuards). */
  record?: any;
  /** Primary-key value for delete events. */
  id?: unknown;
}

/**
 * Tuning options for the SSE subscription engine.
 * Passed via `PrismaRestOptions.subscription`.
 */
export interface SubscriptionOptions {
  /**
   * How often (ms) the engine polls Prisma for changes.
   * Lower values give faster updates but increase DB load.
   * Defaults to 1000 ms.
   */
  pollInterval?: number;

  /**
   * How often (ms) a keepalive heartbeat comment is written to the stream.
   * Prevents proxies from closing idle connections.
   * Defaults to 30_000 ms.
   */
  heartbeatInterval?: number;
}

// ─── Handler Result ──────────────────────────────────────────────────────────

export interface HandlerResult {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export interface RouterInstance {
  handle: (
    method: string,
    modelName: string,
    id: string | null,
    body: any,
    searchParams: URLSearchParams,
    operation?: string
  ) => Promise<HandlerResult>;
  modelMap: Record<string, ModelMeta>;
  models: ModelMeta[];
  /** Shared subscription bus — adapters attach SSE routes against this. */
  subscriptionBus: import("./subscriptions").SubscriptionBus;
}