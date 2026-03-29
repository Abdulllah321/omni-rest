import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { detectFramework, resolveBaseUrl, resolveOutputDir } from "../../src/frontend/detect";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "omni-rest-detect-test-"));
}

function touch(p: string, content = "") {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function writeJson(p: string, obj: unknown) {
  touch(p, JSON.stringify(obj));
}

function mkdir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

// ─── detectFramework ─────────────────────────────────────────────────────────

describe("detectFramework", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("returns 'nextjs' when next.config.js is present", () => {
    touch(path.join(tmpDir, "next.config.js"));
    expect(detectFramework(tmpDir)).toBe("nextjs");
  });

  it("returns 'nextjs' when next.config.ts is present", () => {
    touch(path.join(tmpDir, "next.config.ts"));
    expect(detectFramework(tmpDir)).toBe("nextjs");
  });

  it("returns 'nextjs' when both next.config.js and vite.config.ts are present (next takes priority)", () => {
    touch(path.join(tmpDir, "next.config.js"));
    touch(path.join(tmpDir, "vite.config.ts"));
    expect(detectFramework(tmpDir)).toBe("nextjs");
  });

  it("returns 'vite-react' when vite.config.ts is present and no next config", () => {
    touch(path.join(tmpDir, "vite.config.ts"));
    expect(detectFramework(tmpDir)).toBe("vite-react");
  });

  it("returns 'vite-react' when vite.config.js is present and no next config", () => {
    touch(path.join(tmpDir, "vite.config.js"));
    expect(detectFramework(tmpDir)).toBe("vite-react");
  });

  it("returns 'react' when package.json has react in dependencies", () => {
    writeJson(path.join(tmpDir, "package.json"), {
      dependencies: { react: "^18.0.0" },
    });
    expect(detectFramework(tmpDir)).toBe("react");
  });

  it("returns 'react' when package.json has react in devDependencies", () => {
    writeJson(path.join(tmpDir, "package.json"), {
      devDependencies: { react: "^18.0.0" },
    });
    expect(detectFramework(tmpDir)).toBe("react");
  });

  it("defaults to 'react' and prints warning when nothing is found", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = detectFramework(tmpDir);
    expect(result).toBe("react");
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain("Warning");
  });

  it("defaults to 'react' when package.json exists but has no react", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    writeJson(path.join(tmpDir, "package.json"), {
      dependencies: { express: "^4.0.0" },
    });
    expect(detectFramework(tmpDir)).toBe("react");
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("defaults to 'react' when package.json is malformed", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    touch(path.join(tmpDir, "package.json"), "{ invalid json }");
    expect(detectFramework(tmpDir)).toBe("react");
    expect(warnSpy).toHaveBeenCalledOnce();
  });
});

// ─── resolveBaseUrl ───────────────────────────────────────────────────────────

describe("resolveBaseUrl", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns NEXT_PUBLIC_API_URL from .env.local when present", () => {
    touch(path.join(tmpDir, ".env.local"), "NEXT_PUBLIC_API_URL=https://api.example.com");
    expect(resolveBaseUrl(tmpDir)).toBe("https://api.example.com");
  });

  it(".env.local takes priority over .env", () => {
    touch(path.join(tmpDir, ".env.local"), "NEXT_PUBLIC_API_URL=https://local.example.com");
    touch(path.join(tmpDir, ".env"), "NEXT_PUBLIC_API_URL=https://env.example.com");
    expect(resolveBaseUrl(tmpDir)).toBe("https://local.example.com");
  });

  it("falls back to .env NEXT_PUBLIC_API_URL when .env.local has no match", () => {
    touch(path.join(tmpDir, ".env.local"), "SOME_OTHER_VAR=foo");
    touch(path.join(tmpDir, ".env"), "NEXT_PUBLIC_API_URL=https://env.example.com");
    expect(resolveBaseUrl(tmpDir)).toBe("https://env.example.com");
  });

  it("falls back to .env VITE_API_URL when NEXT_PUBLIC_API_URL is absent", () => {
    touch(path.join(tmpDir, ".env"), "VITE_API_URL=https://vite.example.com");
    expect(resolveBaseUrl(tmpDir)).toBe("https://vite.example.com");
  });

  it("NEXT_PUBLIC_API_URL in .env takes priority over VITE_API_URL in .env", () => {
    touch(
      path.join(tmpDir, ".env"),
      "NEXT_PUBLIC_API_URL=https://next.example.com\nVITE_API_URL=https://vite.example.com"
    );
    expect(resolveBaseUrl(tmpDir)).toBe("https://next.example.com");
  });

  it("returns '/api' when no env files exist", () => {
    expect(resolveBaseUrl(tmpDir)).toBe("/api");
  });

  it("returns '/api' when env files exist but have no matching keys", () => {
    touch(path.join(tmpDir, ".env.local"), "SOME_VAR=foo");
    touch(path.join(tmpDir, ".env"), "OTHER_VAR=bar");
    expect(resolveBaseUrl(tmpDir)).toBe("/api");
  });

  it("handles quoted values in env files", () => {
    touch(path.join(tmpDir, ".env.local"), 'NEXT_PUBLIC_API_URL="https://quoted.example.com"');
    expect(resolveBaseUrl(tmpDir)).toBe("https://quoted.example.com");
  });

  it("handles single-quoted values in env files", () => {
    touch(path.join(tmpDir, ".env"), "VITE_API_URL='https://single.example.com'");
    expect(resolveBaseUrl(tmpDir)).toBe("https://single.example.com");
  });

  it("ignores comment lines in env files", () => {
    touch(
      path.join(tmpDir, ".env"),
      "# This is a comment\nVITE_API_URL=https://real.example.com"
    );
    expect(resolveBaseUrl(tmpDir)).toBe("https://real.example.com");
  });

  it("does not modify any env file", () => {
    const envPath = path.join(tmpDir, ".env");
    const original = "VITE_API_URL=https://original.example.com";
    touch(envPath, original);
    resolveBaseUrl(tmpDir);
    expect(fs.readFileSync(envPath, "utf-8")).toBe(original);
  });
});

// ─── resolveOutputDir ─────────────────────────────────────────────────────────

describe("resolveOutputDir", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns resolved outFlag path when outFlag is provided", () => {
    const result = resolveOutputDir(tmpDir, "nextjs", "custom-out");
    expect(result).toBe(path.resolve(tmpDir, "custom-out"));
  });

  it("outFlag takes priority over framework rules", () => {
    // Even for nextjs with app/ only, outFlag wins
    mkdir(path.join(tmpDir, "app"));
    const result = resolveOutputDir(tmpDir, "nextjs", "my-output");
    expect(result).toBe(path.resolve(tmpDir, "my-output"));
  });

  it("returns root directory for nextjs when app/ exists and src/ does not", () => {
    mkdir(path.join(tmpDir, "app"));
    const result = resolveOutputDir(tmpDir, "nextjs");
    expect(result).toBe(tmpDir);
  });

  it("returns src/ for nextjs when both app/ and src/ exist", () => {
    mkdir(path.join(tmpDir, "app"));
    mkdir(path.join(tmpDir, "src"));
    const result = resolveOutputDir(tmpDir, "nextjs");
    expect(result).toBe(path.resolve(tmpDir, "src"));
  });

  it("returns root directory for nextjs when neither app/ nor src/ exist", () => {
    const result = resolveOutputDir(tmpDir, "nextjs");
    expect(result).toBe(tmpDir);
  });

  it("returns src/ for nextjs when only src/ exists", () => {
    mkdir(path.join(tmpDir, "src"));
    const result = resolveOutputDir(tmpDir, "nextjs");
    expect(result).toBe(path.resolve(tmpDir, "src"));
  });

  it("returns root directory for vite-react when no src/ exists", () => {
    mkdir(path.join(tmpDir, "app"));
    const result = resolveOutputDir(tmpDir, "vite-react");
    expect(result).toBe(tmpDir);
  });

  it("returns root directory for react when no src/ exists", () => {
    mkdir(path.join(tmpDir, "app"));
    const result = resolveOutputDir(tmpDir, "react");
    expect(result).toBe(tmpDir);
  });

  it("resolves outFlag relative to frontendDir", () => {
    const result = resolveOutputDir("/some/frontend", "react", "generated/output");
    expect(result).toBe(path.resolve("/some/frontend", "generated/output"));
  });

  it("resolves absolute outFlag as-is", () => {
    const absPath = path.resolve("/absolute/path");
    const result = resolveOutputDir(tmpDir, "react", absPath);
    expect(result).toBe(absPath);
  });
});
