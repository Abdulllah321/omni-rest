import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { writeFile, copyBaseComponents, printSummary } from "../../src/frontend/output";
import type { FileResult } from "../../src/frontend/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "omni-rest-output-test-"));
}

// ─── writeFile ────────────────────────────────────────────────────────────────

describe("writeFile", () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it("creates a new file and returns status 'created'", async () => {
    const dest = path.join(tmpDir, "hello.txt");
    const result = await writeFile(dest, "hello world");

    expect(result.status).toBe("created");
    expect(result.path).toBe(dest);
    expect(fs.readFileSync(dest, "utf8")).toBe("hello world");
  });

  it("creates intermediate directories automatically", async () => {
    const dest = path.join(tmpDir, "a", "b", "c", "file.ts");
    const result = await writeFile(dest, "content");

    expect(result.status).toBe("created");
    expect(fs.existsSync(dest)).toBe(true);
  });

  it("overwrites an existing file and returns status 'overwritten'", async () => {
    const dest = path.join(tmpDir, "existing.txt");
    fs.writeFileSync(dest, "old content");

    const result = await writeFile(dest, "new content");

    expect(result.status).toBe("overwritten");
    expect(fs.readFileSync(dest, "utf8")).toBe("new content");
  });

  it("returns status 'error' when write fails", async () => {
    // Use a path that cannot be written (directory as file path)
    const dest = path.join(tmpDir, "blocked");
    fs.mkdirSync(dest); // make it a directory so writing a file there fails

    const result = await writeFile(dest, "content");

    expect(result.status).toBe("error");
    expect(result.error).toBeInstanceOf(Error);
  });

  it("returns the correct path in the result", async () => {
    const dest = path.join(tmpDir, "sub", "file.ts");
    const result = await writeFile(dest, "");

    expect(result.path).toBe(dest);
  });
});

// ─── copyBaseComponents ───────────────────────────────────────────────────────

describe("copyBaseComponents", () => {
  let tmpDir: string;
  let outputDir: string;
  let packageRoot: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    outputDir = path.join(tmpDir, "output");
    packageRoot = path.join(tmpDir, "pkg");

    // Create fake source files in packageRoot/frontend-next/
    const frontendNext = path.join(packageRoot, "frontend-next");
    fs.mkdirSync(frontendNext, { recursive: true });
    fs.writeFileSync(path.join(frontendNext, "data-table.tsx"), "// data-table");
    fs.writeFileSync(path.join(frontendNext, "form-generator.tsx"), "// form-generator");
  });

  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it("copies both base components and returns 'created' for each", async () => {
    const results = await copyBaseComponents(outputDir, packageRoot);

    expect(results).toHaveLength(2);
    expect(results.every(r => r.status === "created")).toBe(true);
  });

  it("copies data-table.tsx to {outputDir}/components/data-table.tsx", async () => {
    await copyBaseComponents(outputDir, packageRoot);

    const dest = path.join(outputDir, "components", "data-table.tsx");
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, "utf8")).toBe("// data-table");
  });

  it("copies form-generator.tsx to {outputDir}/components/form-generator.tsx", async () => {
    await copyBaseComponents(outputDir, packageRoot);

    const dest = path.join(outputDir, "components", "form-generator.tsx");
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, "utf8")).toBe("// form-generator");
  });

  it("creates intermediate directories as needed", async () => {
    // outputDir/components does not exist yet
    expect(fs.existsSync(path.join(outputDir, "components"))).toBe(false);

    await copyBaseComponents(outputDir, packageRoot);

    expect(fs.existsSync(path.join(outputDir, "components"))).toBe(true);
  });

  it("skips a file that already exists and returns 'skipped'", async () => {
    // Pre-create the data-table destination
    const dest = path.join(outputDir, "components", "data-table.tsx");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, "// existing");

    const results = await copyBaseComponents(outputDir, packageRoot);

    const dataTableResult = results.find(r => r.path === dest);
    expect(dataTableResult?.status).toBe("skipped");
    // Content should be unchanged
    expect(fs.readFileSync(dest, "utf8")).toBe("// existing");
  });

  it("skips both files when both already exist", async () => {
    const componentsDir = path.join(outputDir, "components");
    fs.mkdirSync(componentsDir, { recursive: true });
    fs.writeFileSync(path.join(componentsDir, "data-table.tsx"), "// dt");
    fs.writeFileSync(path.join(componentsDir, "form-generator.tsx"), "// fg");

    const results = await copyBaseComponents(outputDir, packageRoot);

    expect(results.every(r => r.status === "skipped")).toBe(true);
  });

  it("returns 'error' when source file does not exist", async () => {
    // Remove one source file
    fs.unlinkSync(path.join(packageRoot, "frontend-next", "data-table.tsx"));

    const results = await copyBaseComponents(outputDir, packageRoot);

    const errResult = results.find(r => r.path.endsWith("data-table.tsx"));
    expect(errResult?.status).toBe("error");
    expect(errResult?.error).toBeInstanceOf(Error);
  });
});

// ─── printSummary ─────────────────────────────────────────────────────────────

describe("printSummary", () => {
  beforeEach(() => { vi.spyOn(console, "log").mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); });

  const results: FileResult[] = [
    { path: "src/hooks/useUser.ts",          status: "created" },
    { path: "src/components/UserTable.tsx",  status: "overwritten" },
    { path: "src/components/data-table.tsx", status: "skipped" },
    { path: "src/hooks/useBroken.ts",        status: "error", error: new Error("disk full") },
  ];

  it("prints a line for each result", () => {
    printSummary(results);
    // 4 file lines + 1 summary line = 5 calls
    expect(vi.mocked(console.log)).toHaveBeenCalledTimes(5);
  });

  it("includes ✓ for created files", () => {
    printSummary(results);
    const calls = vi.mocked(console.log).mock.calls.map(c => c[0] as string);
    expect(calls.some(l => l.includes("✓") && l.includes("useUser.ts"))).toBe(true);
  });

  it("includes ⚠ for overwritten files", () => {
    printSummary(results);
    const calls = vi.mocked(console.log).mock.calls.map(c => c[0] as string);
    expect(calls.some(l => l.includes("⚠") && l.includes("UserTable.tsx"))).toBe(true);
  });

  it("includes ℹ for skipped files", () => {
    printSummary(results);
    const calls = vi.mocked(console.log).mock.calls.map(c => c[0] as string);
    expect(calls.some(l => l.includes("ℹ") && l.includes("data-table.tsx"))).toBe(true);
  });

  it("includes ✗ for error files", () => {
    printSummary(results);
    const calls = vi.mocked(console.log).mock.calls.map(c => c[0] as string);
    expect(calls.some(l => l.includes("✗") && l.includes("useBroken.ts"))).toBe(true);
  });

  it("prints the final count summary line", () => {
    printSummary(results);
    const calls = vi.mocked(console.log).mock.calls.map(c => c[0] as string);
    const summary = calls.find(l => l.includes("Generated"));
    expect(summary).toBeDefined();
    expect(summary).toContain("Generated 1 files");
    expect(summary).toContain("1 overwritten");
    expect(summary).toContain("1 skipped");
    expect(summary).toContain("1 errors");
  });

  it("handles empty results array", () => {
    printSummary([]);
    const calls = vi.mocked(console.log).mock.calls.map(c => c[0] as string);
    const summary = calls.find(l => l.includes("Generated"));
    expect(summary).toContain("Generated 0 files");
    expect(summary).toContain("0 overwritten");
    expect(summary).toContain("0 skipped");
    expect(summary).toContain("0 errors");
  });

  it("counts multiple created files correctly", () => {
    const manyCreated: FileResult[] = [
      { path: "a.ts", status: "created" },
      { path: "b.ts", status: "created" },
      { path: "c.ts", status: "created" },
    ];
    printSummary(manyCreated);
    const calls = vi.mocked(console.log).mock.calls.map(c => c[0] as string);
    const summary = calls.find(l => l.includes("Generated"));
    expect(summary).toContain("Generated 3 files");
  });
});
