import { PrismaClient } from '@prisma/client';

/** Formats a single SSE event line. */
declare function formatSseEvent(event: SseEvent): string;
/** Formats a heartbeat comment that keeps the TCP connection alive through proxies. */
declare function formatSseHeartbeat(): string;
type Listener = (event: SseEvent) => void;
/**
 * SubscriptionBus manages one shared Prisma poll interval per model.
 *
 * Key performance properties:
 *  - Zero DB activity for any model that has no active subscribers.
 *  - When the first client subscribes to model X, one interval is started.
 *  - Additional clients for the same model share that single interval (fan-out).
 *  - When the last client disconnects, the interval is immediately cleared.
 *
 * This ensures CRUD routes for un-subscribed tables incur no extra overhead.
 */
declare class SubscriptionBus {
    private prisma;
    private options;
    private buses;
    constructor(prisma: PrismaClient, options?: SubscriptionOptions);
    /**
     * Applies the GET guard for the model.
     * Returns an error string if the subscriber should be rejected, null if allowed.
     */
    checkGuard(guards: GuardMap, modelRouteName: string, ctx: {
        id?: string | null;
        body?: any;
    }): Promise<string | null>;
    private initBus;
    /**
     * Subscribes a listener to events for the given model.
     *
     * If no bus exists for this model yet, one is created (starting the DB poll).
     * If a bus already exists, the listener is simply added to its fan-out set.
     *
     * Returns an unsubscribe function. Call it when the client disconnects — if
     * this was the last listener the poll interval is immediately cleared.
     */
    subscribe(meta: ModelMeta, listener: Listener, fg?: FieldGuardConfig): Promise<() => void>;
    /**
     * Returns the number of active listeners across all model buses.
     * Useful for diagnostics / metrics.
     */
    get activeSubscriberCount(): number;
    /**
     * Returns a list of model route names that currently have active subscribers.
     */
    get activeModels(): string[];
}

interface FieldMeta {
    name: string;
    type: string;
    isId: boolean;
    isRequired: boolean;
    isList: boolean;
    isRelation: boolean;
    hasDefaultValue: boolean;
    isUpdatedAt: boolean;
}
interface ModelMeta {
    name: string;
    routeName: string;
    fields: FieldMeta[];
    idField: string;
}
type GuardFn = (ctx: {
    id?: string | null;
    body?: any;
    method: string;
}) => string | null | Promise<string | null>;
type GuardMap = {
    [modelName: string]: {
        GET?: GuardFn;
        POST?: GuardFn;
        PUT?: GuardFn;
        PATCH?: GuardFn;
        DELETE?: GuardFn;
    };
};
interface HookContext {
    model: string;
    method: string;
    id?: string | null;
    body?: any;
    result?: any;
}
type HookFn = (ctx: HookContext) => void | Promise<void>;
interface PrismaRestOptions {
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
interface FeaturesConfig {
    /**
     * Enable /aggregate and /groupBy endpoints.
     * Defaults to true.
     */
    aggregation?: boolean;
}
interface ComplexityRules {
    /** Cost per relation included in ?include= */
    perInclude?: number;
    /** Cost per top-level filter key */
    perFilter?: number;
    /** Cost per sort field */
    perSort?: number;
    /** Cost per 100 limit */
    perLimit100?: number;
}
interface ComplexityOptions {
    /** Maximum allowed score before returning 429 */
    maxScore: number;
    /** Rules for computing query score */
    rules: ComplexityRules;
}
type RateLimitFn = (ctx: {
    model: string;
    method: string;
    id?: string | null;
}) => string | null | Promise<string | null>;
interface FieldGuardConfig {
    /** Fields never included in any response. */
    hidden?: string[];
    /** Fields stripped from POST/PUT/PATCH bodies before reaching Prisma. */
    readOnly?: string[];
    /** Fields included in write bodies but never returned in GET responses. */
    writeOnly?: string[];
}
type FieldGuardMap = {
    [modelRouteName: string]: FieldGuardConfig;
};
interface ParsedQuery {
    where: Record<string, any>;
    orderBy: Record<string, any>;
    skip: number;
    take: number;
    cursor?: Record<string, any>;
    paginationMode: "offset" | "cursor";
    include: Record<string, boolean>;
    select: Record<string, boolean> | null;
}
/** A single event emitted over an SSE subscription stream. */
interface SseEvent {
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
interface SubscriptionOptions {
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
interface HandlerResult {
    status: number;
    data: any;
    headers?: Record<string, string>;
}
interface RouterInstance {
    handle: (method: string, modelName: string, id: string | null, body: any, searchParams: URLSearchParams, operation?: string) => Promise<HandlerResult>;
    modelMap: Record<string, ModelMeta>;
    models: ModelMeta[];
    /** Shared subscription bus — adapters attach SSE routes against this. */
    subscriptionBus: SubscriptionBus;
}

export { type FieldMeta as F, type GuardMap as G, type HookFn as H, type ModelMeta as M, type PrismaRestOptions as P, type RouterInstance as R, type SseEvent as S, type ParsedQuery as a, type HookContext as b, type GuardFn as c, type HandlerResult as d, SubscriptionBus as e, type SubscriptionOptions as f, formatSseEvent as g, formatSseHeartbeat as h };
