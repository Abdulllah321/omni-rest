import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { checkDependencies } from "../../src/frontend/deps";

const BASE_PACKAGES = [
  "@tanstack/react-query",
  "@tanstack/react-table",
  "react-hook-form",
  "zod",
  "@hookform/resolvers",
];

function writePkg(dir: string, deps: Record<string, string>, devDeps: Record<string, string> = {}) {
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ dependencies: deps, devDependencies: devDeps })
  );
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "deps-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("checkDependencies", () => {
  it("returns empty array when all base deps are present (react framework)", () => {
    const deps = Object.fromEntries(BASE_PACKAGES.map((p) => [p, "1.0.0"]));
    writePkg(tmpDir, deps);
    expect(checkDependencies(tmpDir, "react")).toEqual([]);
  });

  it("returns missing packages when some are absent", () => {
    // Only provide 3 of the 5 base packages
    const present = BASE_PACKAGES.slice(0, 3);
    const missing = BASE_PACKAGES.slice(3);
    writePkg(tmpDir, Object.fromEntries(present.map((p) => [p, "1.0.0"])));
    const result = checkDependencies(tmpDir, "react");
    expect(result).toEqual(expect.arrayContaining(missing));
    expect(result).toHaveLength(missing.length);
  });

  it("finds packages in devDependencies as well", () => {
    const deps = Object.fromEntries(BASE_PACKAGES.slice(0, 3).map((p) => [p, "1.0.0"]));
    const devDeps = Object.fromEntries(BASE_PACKAGES.slice(3).map((p) => [p, "1.0.0"]));
    writePkg(tmpDir, deps, devDeps);
    expect(checkDependencies(tmpDir, "react")).toEqual([]);
  });

  it("checks next when framework is nextjs and reports it missing", () => {
    const deps = Object.fromEntries(BASE_PACKAGES.map((p) => [p, "1.0.0"]));
    writePkg(tmpDir, deps);
    const result = checkDependencies(tmpDir, "nextjs");
    expect(result).toContain("next");
    expect(result).toHaveLength(1);
  });

  it("returns empty when framework is nextjs and next is present", () => {
    const deps = Object.fromEntries([...BASE_PACKAGES, "next"].map((p) => [p, "1.0.0"]));
    writePkg(tmpDir, deps);
    expect(checkDependencies(tmpDir, "nextjs")).toEqual([]);
  });

  it("checks react-router-dom when framework is vite-react and reports it missing", () => {
    const deps = Object.fromEntries(BASE_PACKAGES.map((p) => [p, "1.0.0"]));
    writePkg(tmpDir, deps);
    const result = checkDependencies(tmpDir, "vite-react");
    expect(result).toContain("react-router-dom");
    expect(result).toHaveLength(1);
  });

  it("returns empty when framework is vite-react and react-router-dom is present", () => {
    const deps = Object.fromEntries(
      [...BASE_PACKAGES, "react-router-dom"].map((p) => [p, "1.0.0"])
    );
    writePkg(tmpDir, deps);
    expect(checkDependencies(tmpDir, "vite-react")).toEqual([]);
  });

  it("returns all required packages when package.json is missing", () => {
    // No package.json written
    const result = checkDependencies(tmpDir, "react");
    expect(result).toEqual(expect.arrayContaining(BASE_PACKAGES));
    expect(result).toHaveLength(BASE_PACKAGES.length);
  });

  it("returns all required packages (including framework-specific) when package.json is missing for nextjs", () => {
    const result = checkDependencies(tmpDir, "nextjs");
    expect(result).toContain("next");
    expect(result).toHaveLength(BASE_PACKAGES.length + 1);
  });
});
