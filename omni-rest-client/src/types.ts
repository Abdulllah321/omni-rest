// ─── Model metadata (mirrors omni-rest ModelMeta / FieldMeta, no Prisma dep) ──

export interface FieldMeta {
  name: string;
  type: string;
  isId: boolean;
  isRequired: boolean;
  isList: boolean;
  isRelation: boolean;
  hasDefaultValue: boolean;
  isUpdatedAt: boolean;
}

export interface ModelMeta {
  name: string;
  routeName: string;
  fields: FieldMeta[];
  idField: string;
}

// ─── Config file format (written by `omni-rest generate:config`) ──────────────

export interface OmniRestConfig {
  version: string;
  generatedAt: string;
  models: ModelMeta[];
  zodSchemas: string;
}

// ─── Generator types ──────────────────────────────────────────────────────────

export interface GeneratorConfig {
  configPath: string;
  frontendDir: string;
  framework: "nextjs" | "vite-react" | "react";
  baseUrl: string;
  outputDir: string;
  autopilot: boolean;
  models: ModelConfig[];
  staleTime: number;
  gcTime: number;
  noOptimistic: boolean;
  steps: "auto" | "always" | "never";
  generatePages?: boolean;
  generateMenu?: boolean;
  routeGroup?: string;
}

export interface ModelConfig {
  model: ModelMeta;
  tableFields: string[];
  formFields: string[];
  relationalFields: string[];
  bulkDelete: boolean;
  canExport: boolean;
  multiStep: boolean;
}

export interface FileResult {
  path: string;
  status: "created" | "overwritten" | "skipped" | "error";
  error?: Error;
}

export interface CandidateFrontend {
  dir: string;
  score: number;
  signals: string[];
}
