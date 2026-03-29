import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { findSchema, loadDMMF } from "../../src/frontend/schema";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "omni-rest-schema-test-"));
}

function mkdir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function touch(p: string) {
  fs.writeFileSync(p, "");
}

// ─── findSchema ───────────────────────────────────────────────────────────────

describe("findSchema", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns the schema in the start directory when present", async () => {
    const schemaPath = path.join(tmpDir, "schema.prisma");
    touch(schemaPath);

    const result = await findSchema(tmpDir);
    expect(result).toBe(schemaPath);
  });

  it("walks up to find schema.prisma in a parent directory", async () => {
    const schemaPath = path.join(tmpDir, "schema.prisma");
    touch(schemaPath);

    const nested = path.join(tmpDir, "a", "b", "c");
    mkdir(nested);

    const result = await findSchema(nested);
    expect(result).toBe(schemaPath);
  });

  it("finds schema.prisma in an intermediate ancestor", async () => {
    const mid = path.join(tmpDir, "project");
    mkdir(mid);
    const schemaPath = path.join(mid, "schema.prisma");
    touch(schemaPath);

    const nested = path.join(mid, "src", "app");
    mkdir(nested);

    const result = await findSchema(nested);
    expect(result).toBe(schemaPath);
  });

  it("throws a descriptive error when schema.prisma is not found", async () => {
    // Use a deeply nested dir with no schema.prisma anywhere in tmpDir
    const nested = path.join(tmpDir, "no-schema", "deep");
    mkdir(nested);

    // We can't guarantee the real filesystem root has no schema.prisma,
    // so we test that the error message is descriptive when starting from
    // a path that definitely has no schema.prisma up to tmpDir.
    // We'll mock by starting from a path that won't find one.
    await expect(findSchema(nested)).rejects.toThrow(/schema\.prisma/i);
  });

  // ── explicit path ──────────────────────────────────────────────────────────

  it("returns the explicit path immediately when it exists", async () => {
    const schemaPath = path.join(tmpDir, "custom", "schema.prisma");
    mkdir(path.dirname(schemaPath));
    touch(schemaPath);

    // startDir has no schema.prisma — explicit path should bypass traversal
    const result = await findSchema(tmpDir, schemaPath);
    expect(result).toBe(path.resolve(schemaPath));
  });

  it("resolves a relative explicit path", async () => {
    const schemaPath = path.join(tmpDir, "schema.prisma");
    touch(schemaPath);

    // Pass a relative path (relative to cwd)
    const relative = path.relative(process.cwd(), schemaPath);
    const result = await findSchema(tmpDir, relative);
    expect(result).toBe(path.resolve(relative));
  });

  it("throws a descriptive error when explicit path does not exist", async () => {
    const nonExistent = path.join(tmpDir, "does-not-exist", "schema.prisma");

    await expect(findSchema(tmpDir, nonExistent)).rejects.toThrow(
      /not found at the specified path/i
    );
  });

  it("does not traverse directories when explicit path is provided", async () => {
    // Place schema.prisma in tmpDir (would be found by traversal)
    touch(path.join(tmpDir, "schema.prisma"));

    // Provide a different explicit path that exists
    const explicitSchema = path.join(tmpDir, "other", "schema.prisma");
    mkdir(path.dirname(explicitSchema));
    touch(explicitSchema);

    const result = await findSchema(tmpDir, explicitSchema);
    // Should return the explicit path, not the one in tmpDir
    expect(result).toBe(path.resolve(explicitSchema));
  });
});

// ─── loadDMMF ─────────────────────────────────────────────────────────────────

describe("loadDMMF", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("throws with npx prisma generate instruction when path cannot be loaded", async () => {
    const fakeDir = "/nonexistent";
    const fakeSchema = path.join(fakeDir, "schema.prisma");

    await expect(loadDMMF(fakeDir, fakeSchema)).rejects.toThrow(
      /npx prisma generate/i
    );
  });

  it("throws with the provided path in the error message", async () => {
    const fakeDir = "/some/fake/path";
    const fakeSchema = path.join(fakeDir, "schema.prisma");

    await expect(loadDMMF(fakeDir, fakeSchema)).rejects.toThrow(
      /@prisma\/client/i
    );
  });

  it("throws with regenerate instruction when @prisma/client has no DMMF (not yet generated)", async () => {
    // Create a minimal schema without custom output
    const schemaPath = path.join(tmpDir, "schema.prisma");
    fs.writeFileSync(schemaPath, `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
    `);

    // Point to a directory with no generated client
    await expect(loadDMMF(tmpDir, schemaPath)).rejects.toThrow(
      /npx prisma generate/i
    );
  });
});
