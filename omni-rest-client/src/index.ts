/**
 * omni-rest-client
 * Frontend code generator — no Prisma dependency.
 * Consumes omni-rest.config.json produced by `npx omni-rest generate:config`.
 */

export { loadConfig, generateAll, buildAutopilotModelConfigs, detectProjectStructure } from "./generator";
export type { GeneratorConfig, ModelConfig, FileResult, OmniRestConfig, ModelMeta, FieldMeta } from "./types";
