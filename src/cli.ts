#!/usr/bin/env node
/**
 * prisma-rest CLI
 *
 * Usage:
 *   npx prisma-rest generate:zod       → generates src/schemas.generated.ts
 *   npx prisma-rest generate:openapi   → generates openapi.json
 *   npx prisma-rest generate           → generates both
 */

import fs from "fs";
import path from "path";
import { generateZodSchemas } from "./zod-generator";
import { generateOpenApiSpec } from "./openapi";

const args = process.argv.slice(2);
const command = args[0] ?? "generate";
const cwd = process.cwd();

const COLORS = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
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

function run() {
  console.log(COLORS.bold("\n  prisma-rest generator\n"));

  if (command === "generate:zod" || command === "generate") {
    try {
      console.log(COLORS.cyan("  → Generating Zod schemas from Prisma DMMF..."));
      const code = generateZodSchemas();
      write("src/schemas.generated.ts", code);
    } catch (e: any) {
      console.error(COLORS.red(`  ✗ Zod generation failed: ${e.message}`));
    }
  }

  if (command === "generate:openapi" || command === "generate") {
    try {
      console.log(COLORS.cyan("  → Generating OpenAPI spec from Prisma DMMF..."));
      const spec = generateOpenApiSpec({
        title: getPackageName(),
        version: getPackageVersion(),
      });
      write("openapi.json", JSON.stringify(spec, null, 2));
    } catch (e: any) {
      console.error(COLORS.red(`  ✗ OpenAPI generation failed: ${e.message}`));
    }
  }

  if (!["generate", "generate:zod", "generate:openapi"].includes(command)) {
    console.log(`
  Usage:
    npx prisma-rest generate            Generate both Zod schemas and OpenAPI spec
    npx prisma-rest generate:zod        Generate Zod schemas only
    npx prisma-rest generate:openapi    Generate OpenAPI spec only
    `);
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

run();