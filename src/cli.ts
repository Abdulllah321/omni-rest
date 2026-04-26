#!/usr/bin/env node
/**
 * omni-rest CLI
 *
 * Usage:
 *   npx omni-rest generate:zod       → generates src/schemas.generated.ts
 *   npx omni-rest generate:openapi   → generates openapi.json
 *   npx omni-rest generate           → generates both
 */

import fs from "fs";
import path from "path";
import { generateZodSchemas } from "./zod-generator";
import { generateOpenApiSpec } from "./openapi";
import { generateConfig } from "./config-generator";
import { run as runFrontendGenerator } from "./frontend-generator";
import { installSkillPack, printSkillPackSummary } from "./skill-installer";

const args = process.argv.slice(2);
const command = args[0] ?? "generate";
const remainingArgs = args.slice(1);
const cwd = process.cwd();

const COLORS = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

function write(filePath: string, content: string) {
  const abs = path.resolve(cwd, filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf-8");
  console.log(COLORS.green(`  ✓ Written: ${filePath}`));
}

/**
 * Instantiates a PrismaClient from the user's project.
 * Handles both:
 *  - Standard Prisma (client in node_modules/@prisma/client or node_modules/.prisma/client)
 *  - Prisma 7+ with custom output path in schema.prisma generator block
 */
function createPrismaClient(): any {
  // 1. Try to find a custom output path from schema.prisma
  const customClient = tryLoadFromSchemaOutput();
  if (customClient) return customClient;

  // 2. Try the standard .prisma/client path (Prisma 7 default output)
  const standardPrismaClient = tryLoadFromStandardOutput();
  if (standardPrismaClient) return standardPrismaClient;

  // 3. Fall back to resolving @prisma/client and extracting/instantiating (Prisma <7)
  try {
    const clientPath = require.resolve("@prisma/client", { paths: [cwd] });

    // Try text-based extraction first (no require needed)
    const textResult = extractRuntimeDataModelFromFile(clientPath);
    if (textResult) return textResult;

    // Last resort: actually instantiate (requires DB connection)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(clientPath);
    const PrismaClient = mod.PrismaClient ?? mod.default?.PrismaClient;
    if (!PrismaClient) throw new Error("PrismaClient not found in @prisma/client");
    return new PrismaClient();
  } catch {
    throw new Error(
      "[omni-rest] Could not load @prisma/client from your project. " +
        "Run `npx prisma generate` first, then try again."
    );
  }
}

/**
 * Reads schema.prisma to find a custom `output` in the generator block,
 * then extracts runtimeDataModel from the generated file as plain text.
 * Returns a fake prisma-like object with _runtimeDataModel populated.
 */
function tryLoadFromSchemaOutput(): any | null {
  const schemaPaths = [
    path.resolve(cwd, "prisma/schema.prisma"),
    path.resolve(cwd, "schema.prisma"),
  ];

  for (const schemaPath of schemaPaths) {
    if (!fs.existsSync(schemaPath)) continue;
    try {
      const schema = fs.readFileSync(schemaPath, "utf-8");
      const match = schema.match(/output\s*=\s*["']([^"']+)["']/);
      if (!match) continue;

      const outputDir = path.resolve(path.dirname(schemaPath), match[1]);
      const indexPath = path.join(outputDir, "index.js");
      const result = extractRuntimeDataModelFromFile(indexPath);
      if (result) return result;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Tries to extract runtimeDataModel by reading the generated Prisma client
 * source as plain text and regex-extracting the embedded JSON.
 * Works for Prisma 7+ default output (node_modules/.prisma/client/index.js)
 * and any custom output path. No require() needed — no DB connection needed.
 */
function tryLoadFromStandardOutput(): any | null {
  const candidates = [
    path.resolve(cwd, "node_modules/.prisma/client/index.js"),
    path.resolve(cwd, "node_modules/@prisma/client/index.js"),
  ];

  for (const clientPath of candidates) {
    const result = extractRuntimeDataModelFromFile(clientPath);
    if (result) return result;
  }
  return null;
}

/**
 * Reads a generated Prisma client JS file as text and extracts
 * the runtimeDataModel JSON via regex — no require() needed.
 */
function extractRuntimeDataModelFromFile(filePath: string): any | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const src = fs.readFileSync(filePath, "utf-8");

    // Prisma 7: config.runtimeDataModel = JSON.parse("...")
    const match = src.match(/config\.runtimeDataModel\s*=\s*JSON\.parse\("((?:[^"\\]|\\.)*)"\)/);
    if (match) {
      const json = match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      const runtimeDataModel = JSON.parse(json);
      if (runtimeDataModel?.models) {
        return { _runtimeDataModel: runtimeDataModel, $disconnect: async () => {} };
      }
    }

    // Older Prisma: runtimeDataModel = { models: { ... } } inline object
    const match2 = src.match(/runtimeDataModel\s*=\s*(\{[\s\S]*?"models"\s*:\s*\{[\s\S]*?\}\s*\})/);
    if (match2) {
      try {
        const runtimeDataModel = JSON.parse(match2[1]);
        if (runtimeDataModel?.models) {
          return { _runtimeDataModel: runtimeDataModel, $disconnect: async () => {} };
        }
      } catch { /* not valid JSON, skip */ }
    }
  } catch {
    // ignore read errors
  }
  return null;
}

function getDummyUrl(provider: string): string {
  switch (provider) {
    case "mysql":       return "mysql://root:root@localhost:3306/dummy";
    case "sqlite":      return "file:./dummy.db";
    case "sqlserver":   return "sqlserver://localhost:1433;database=dummy;user=sa;password=dummy";
    case "mongodb":     return "mongodb://localhost:27017/dummy";
    case "cockroachdb": return "postgresql://root@localhost:26257/dummy";
    default:            return "postgresql://postgres:postgres@localhost:5432/dummy";
  }
}

const USAGE = `
  Usage:
    npx omni-rest generate            Generate both Zod schemas and OpenAPI spec
    npx omni-rest generate:zod        Generate Zod schemas only
    npx omni-rest generate:openapi    Generate OpenAPI spec only
    npx omni-rest generate:config     Generate omni-rest.config.json for omni-rest-client
    npx omni-rest generate:frontend   Scaffold frontend components from Prisma schema (legacy)
    npx omni-rest install:skills      Install the portable AI instruction pack into a project
`;

async function run() {
  console.log(COLORS.bold("\n  omni-rest generator\n"));

  if (command === "generate:frontend") {
    try {
      await runFrontendGenerator(remainingArgs);
    } catch (e: any) {
      console.error(COLORS.red(`  ✗ ${e.message}`));
      process.exit(1);
    }
    return;
  }

  if (command === "install:skills") {
    const targetArg = readArg(remainingArgs, "--target");
    const overwrite = remainingArgs.includes("--overwrite");
    const targetDir = targetArg ? path.resolve(cwd, targetArg) : cwd;

    try {
      const results = installSkillPack(targetDir, { overwrite });
      printSkillPackSummary(results);
    } catch (e: any) {
      console.error(COLORS.red(`  x ${e.message}`));
      process.exit(1);
    }
    return;
  }

  if (!["generate", "generate:zod", "generate:openapi", "generate:config"].includes(command)) {
    console.log(USAGE);
    console.log(COLORS.bold("\n  Done!\n"));
    return;
  }

  let prisma: any;
  try {
    prisma = createPrismaClient();
  } catch (e: any) {
    console.error(COLORS.red(`  ✗ ${e.message}`));
    console.log(COLORS.bold("\n  Done!\n"));
    return;
  }

  try {
    if (command === "generate:zod" || command === "generate") {
      try {
        console.log(COLORS.cyan("  → Generating Zod schemas from Prisma DMMF..."));
        const code = generateZodSchemas(prisma);
        write("src/schemas.generated.ts", code);
      } catch (e: any) {
        console.error(COLORS.red(`  ✗ Zod generation failed: ${e.message}`));
      }
    }

    if (command === "generate:openapi" || command === "generate") {
      try {
        console.log(COLORS.cyan("  → Generating OpenAPI spec from Prisma DMMF..."));
        const spec = generateOpenApiSpec(prisma, {
          title: getPackageName(),
          version: getPackageVersion(),
        });
        write("openapi.json", JSON.stringify(spec, null, 2));
      } catch (e: any) {
        console.error(COLORS.red(`  ✗ OpenAPI generation failed: ${e.message}`));
      }
    }

    if (command === "generate:config") {
      try {
        console.log(COLORS.cyan("  → Generating omni-rest.config.json..."));
        const config = generateConfig(prisma);
        write("omni-rest.config.json", JSON.stringify(config, null, 2));
        console.log(COLORS.green("  ✓ Share omni-rest.config.json with your frontend and run: npx omni-rest-client generate:frontend"));
      } catch (e: any) {
        console.error(COLORS.red(`  ✗ Config generation failed: ${e.message}`));
      }
    }
  } finally {
    // Always disconnect the Prisma client when done
    await prisma.$disconnect();
  }

  console.log(COLORS.bold("\n  Done!\n"));
}

function getPackageName(): string {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(cwd, "package.json"), "utf-8")
    );
    return pkg.name ?? "My API";
  } catch {
    return "My API";
  }
}

function getPackageVersion(): string {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(cwd, "package.json"), "utf-8")
    );
    return pkg.version ?? "1.0.0";
  } catch {
    return "1.0.0";
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

function readArg(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}
