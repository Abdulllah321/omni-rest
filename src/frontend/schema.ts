import * as fs from "fs";
import * as path from "path";
import type { ModelMeta } from "../types";
import { getModels } from "../introspect";

/**
 * Finds the nearest `schema.prisma` file by walking up from `startDir`.
 *
 * - If `explicitPath` is provided, verifies it exists and returns it immediately.
 * - Otherwise walks up the directory tree until `schema.prisma` is found or root is reached.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export async function findSchema(
  startDir: string,
  explicitPath?: string
): Promise<string> {
  if (explicitPath !== undefined) {
    const resolved = path.resolve(explicitPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(
        `[omni-rest] Schema file not found at the specified path: "${resolved}"\n` +
          `Please check that the path is correct and the file is readable.`
      );
    }
    return resolved;
  }

  let current = path.resolve(startDir);

  while (true) {
    // Check both root and prisma/ subdirectory
    const candidates = [
      path.join(current, "prisma", "schema.prisma"),
      path.join(current, "schema.prisma"),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      // Reached filesystem root without finding schema.prisma
      throw new Error(
        `[omni-rest] Could not find "schema.prisma" by walking up from "${startDir}".\n` +
          `Please run this command from within your Prisma project, or specify the path with --schema <path>.`
      );
    }
    current = parent;
  }
}

/**
 * Loads `@prisma/client` from the user's `node_modules` at `prismaClientPath`
 * and returns the list of models via `getModels`.
 *
 * Supports both standard output (node_modules/@prisma/client) and custom
 * output paths defined in schema.prisma generator block.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export async function loadDMMF(
  frontendDir: string,
  schemaPath: string
): Promise<ModelMeta[]> {
  // 1. Try to detect custom output path from schema.prisma
  let clientPath: string | null = null;

  try {
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const outputMatch = schemaContent.match(/output\s*=\s*["']([^"']+)["']/);
    
    if (outputMatch) {
      // Custom output path is relative to schema.prisma location
      const schemaDir = path.dirname(schemaPath);
      const customOutput = path.resolve(schemaDir, outputMatch[1]);
      
      if (fs.existsSync(customOutput)) {
        clientPath = customOutput;
      }
    }
  } catch {
    // Ignore schema read errors, fall back to standard path
  }

  // 2. Fall back to standard @prisma/client location
  if (!clientPath) {
    clientPath = path.join(frontendDir, "node_modules", "@prisma", "client");
  }

  // 3. Try to load the client module
  let prismaClientModule: any;

  try {
    // Use require() to load from the resolved path
    prismaClientModule = require(clientPath);
  } catch (err) {
    throw new Error(
      `[omni-rest] Could not load "@prisma/client" from "${clientPath}".\n` +
        `Please run "npx prisma generate" to generate the Prisma client, then try again.`
    );
  }

  // 4. Extract the Prisma namespace to pass DMMF access to getModels
  const prismaNamespace = prismaClientModule?.Prisma ?? prismaClientModule?.default?.Prisma;

  if (!prismaNamespace?.dmmf?.datamodel?.models) {
    throw new Error(
      `[omni-rest] Could not read DMMF from "@prisma/client" at "${clientPath}".\n` +
        `Please run "npx prisma generate" to regenerate the Prisma client, then try again.`
    );
  }

  // 5. Build a synthetic prisma instance for getModels()
  const dmmfModels: any[] = prismaNamespace.dmmf.datamodel.models;

  // Build a synthetic prisma instance whose _runtimeDataModel mirrors the DMMF
  // so that getModels() picks it up via the first branch.
  const syntheticPrisma = {
    _runtimeDataModel: {
      models: Object.fromEntries(
        dmmfModels.map((m: any) => [
          m.name,
          {
            fields: m.fields,
          },
        ])
      ),
    },
  };

  return getModels(syntheticPrisma);
}
