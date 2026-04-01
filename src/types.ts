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
}

// ─── Query ───────────────────────────────────────────────────────────────────

export interface ParsedQuery {
  where: Record<string, any>;
  orderBy: Record<string, any>;
  skip: number;
  take: number;
  include: Record<string, boolean>;
  select: Record<string, boolean> | null;
}

// ─── Handler Result ──────────────────────────────────────────────────────────

export interface HandlerResult {
  status: number;
  data: any;
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
}