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
    /** Max allowed page size. Defaults to 100. */
    maxLimit?: number;
    /** Prefix path (used by some adapters). e.g. "/api/master" */
    prefix?: string;
}
interface ParsedQuery {
    where: Record<string, any>;
    orderBy: Record<string, "asc" | "desc">;
    skip: number;
    take: number;
    include: Record<string, boolean>;
    select: Record<string, boolean> | null;
}
interface HandlerResult {
    status: number;
    data: any;
}
interface RouterInstance {
    handle: (method: string, modelName: string, id: string | null, body: any, searchParams: URLSearchParams, operation?: string) => Promise<HandlerResult>;
    modelMap: Record<string, ModelMeta>;
    models: ModelMeta[];
}

export type { FieldMeta as F, GuardMap as G, HookFn as H, ModelMeta as M, PrismaRestOptions as P, RouterInstance as R, ParsedQuery as a, HookContext as b, GuardFn as c, HandlerResult as d };
