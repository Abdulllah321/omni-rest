import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { scoreCandidates, scanForFrontendDir } from "../../src/frontend/scan";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "omni-rest-scan-test-"));
}

function mkdir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function touch(p: string, content = "") {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function writeJson(p: string, obj: unknown) {
  touch(p, JSON.stringify(obj));
}

// ─── scoreCandidates ─────────────────────────────────────────────────────────

describe("scoreCandidates", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds next.config.js and scores +10", () => {
    touch(path.join(tmpDir, "next.config.js"));

    const results = scoreCandidates(tmpDir);
    const candidate = results.find((c) => c.dir === path.resolve(tmpDir));

    expect(candidate).toBeDefined();
    // score is at least 10 (may have +2 cwd bonus if tmpDir happens to be cwd, but unlikely)
    expect(candidate!.score).toBeGreaterThanOrEqual(10);
    expect(candidate!.signals).toContain("next.config.js found");
  });

  it("finds next.config.ts and scores +10", () => {
    touch(path.join(tmpDir, "next.config.ts"));

    const results = scoreCandidates(tmpDir);
    const candidate = results.find((c) => c.dir === path.resolve(tmpDir));

    expect(candidate).toBeDefined();
    expect(candidate!.score).toBeGreaterThanOrEqual(10);
    expect(candidate!.signals).toContain("next.config.ts found");
  });

  it("finds vite.config.ts and scores +10", () => {
    touch(path.join(tmpDir, "vite.config.ts"));

    const results = scoreCandidates(tmpDir);
    const candidate = results.find((c) => c.dir === path.resolve(tmpDir));

    expect(candidate).toBeDefined();
    expect(candidate!.score).toBeGreaterThanOrEqual(10);
    expect(candidate!.signals).toContain("vite.config.ts found");
  });

  it("finds vite.config.js and scores +10", () => {
    touch(path.join(tmpDir, "vite.config.js"));

    const results = scoreCandidates(tmpDir);
    const candidate = results.find((c) => c.dir === path.resolve(tmpDir));

    expect(candidate).toBeDefined();
    expect(candidate!.score).toBeGreaterThanOrEqual(10);
    expect(candidate!.signals).toContain("vite.config.js found");
  });

  it("finds react in package.json dependencies and scores +5", () => {
    writeJson(path.join(tmpDir, "package.json"), {
      dependencies: { react: "^18.0.0" },
    });

    const results = scoreCandidates(tmpDir);
    const candidate = results.find((c) => c.dir === path.resolve(tmpDir));

    expect(candidate).toBeDefined();
    expect(candidate!.score).toBeGreaterThanOrEqual(5);
    expect(candidate!.signals).toContain("react in dependencies");
  });

  it("finds react in package.json devDependencies and scores +3", () => {
    writeJson(path.join(tmpDir, "package.json"), {
      devDependencies: { react: "^18.0.0" },
    });

    const results = scoreCandidates(tmpDir);
    const candidate = results.find((c) => c.dir === path.resolve(tmpDir));

    expect(candidate).toBeDefined();
    expect(candidate!.score).toBeGreaterThanOrEqual(3);
    expect(candidate!.signals).toContain("react in devDependencies");
  });

  it("excludes directories with score 0", () => {
    // tmpDir has no config files or react — score should be 0 (unless it's cwd)
    const emptyDir = path.join(tmpDir, "empty-project");
    mkdir(emptyDir);

    const results = scoreCandidates(emptyDir);
    // All results must have score > 0
    for (const c of results) {
      expect(c.score).toBeGreaterThan(0);
    }
  });

  it("excludes node_modules from traversal", () => {
    // Place a next.config.js inside node_modules — should NOT be found
    const nodeModulesDir = path.join(tmpDir, "node_modules", "some-pkg");
    mkdir(nodeModulesDir);
    touch(path.join(nodeModulesDir, "next.config.js"));

    const results = scoreCandidates(tmpDir);
    const found = results.find((c) => c.dir === path.resolve(nodeModulesDir));
    expect(found).toBeUndefined();
  });

  it("excludes .git from traversal", () => {
    const gitDir = path.join(tmpDir, ".git", "hooks");
    mkdir(gitDir);
    touch(path.join(gitDir, "next.config.js"));

    const results = scoreCandidates(tmpDir);
    const found = results.find((c) => c.dir.includes(".git"));
    expect(found).toBeUndefined();
  });

  it("excludes dist from traversal", () => {
    const distDir = path.join(tmpDir, "dist");
    mkdir(distDir);
    touch(path.join(distDir, "next.config.js"));

    const results = scoreCandidates(tmpDir);
    const found = results.find((c) => c.dir === path.resolve(distDir));
    expect(found).toBeUndefined();
  });

  it("excludes build from traversal", () => {
    const buildDir = path.join(tmpDir, "build");
    mkdir(buildDir);
    touch(path.join(buildDir, "vite.config.ts"));

    const results = scoreCandidates(tmpDir);
    const found = results.find((c) => c.dir === path.resolve(buildDir));
    expect(found).toBeUndefined();
  });

  it("excludes .next from traversal", () => {
    const nextDir = path.join(tmpDir, ".next", "server");
    mkdir(nextDir);
    touch(path.join(nextDir, "next.config.js"));

    const results = scoreCandidates(tmpDir);
    const found = results.find((c) => c.dir.includes(".next"));
    expect(found).toBeUndefined();
  });

  it("excludes out from traversal", () => {
    const outDir = path.join(tmpDir, "out");
    mkdir(outDir);
    touch(path.join(outDir, "vite.config.js"));

    const results = scoreCandidates(tmpDir);
    const found = results.find((c) => c.dir === path.resolve(outDir));
    expect(found).toBeUndefined();
  });

  it("returns results sorted descending by score", () => {
    // High score: next.config.js + react dep = 10 + 5 = 15
    const highDir = path.join(tmpDir, "high");
    mkdir(highDir);
    touch(path.join(highDir, "next.config.js"));
    writeJson(path.join(highDir, "package.json"), {
      dependencies: { react: "^18.0.0" },
    });

    // Low score: only react devDep = 3
    const lowDir = path.join(tmpDir, "low");
    mkdir(lowDir);
    writeJson(path.join(lowDir, "package.json"), {
      devDependencies: { react: "^18.0.0" },
    });

    const results = scoreCandidates(tmpDir);
    // Filter to only our test dirs
    const relevant = results.filter(
      (c) => c.dir === path.resolve(highDir) || c.dir === path.resolve(lowDir)
    );

    expect(relevant.length).toBe(2);
    expect(relevant[0].score).toBeGreaterThanOrEqual(relevant[1].score);
    expect(relevant[0].dir).toBe(path.resolve(highDir));
  });

  it("returns empty array when no candidates found", () => {
    // A completely empty directory with no config files
    const emptyDir = path.join(tmpDir, "truly-empty");
    mkdir(emptyDir);

    const results = scoreCandidates(emptyDir);
    expect(results).toEqual([]);
  });

  it("walks up to 3 levels deep", () => {
    // Place a vite.config.ts 3 levels deep
    const deepDir = path.join(tmpDir, "a", "b", "c");
    mkdir(deepDir);
    touch(path.join(deepDir, "vite.config.ts"));

    const results = scoreCandidates(tmpDir);
    const found = results.find((c) => c.dir === path.resolve(deepDir));
    expect(found).toBeDefined();
  });

  it("does not walk more than 3 levels deep", () => {
    // Place a vite.config.ts 4 levels deep — should NOT be found
    const tooDeepDir = path.join(tmpDir, "a", "b", "c", "d");
    mkdir(tooDeepDir);
    touch(path.join(tooDeepDir, "vite.config.ts"));

    const results = scoreCandidates(tmpDir);
    const found = results.find((c) => c.dir === path.resolve(tooDeepDir));
    expect(found).toBeUndefined();
  });
});

// ─── scanForFrontendDir ───────────────────────────────────────────────────────

describe("scanForFrontendDir", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns a promise resolving to CandidateFrontend[]", async () => {
    touch(path.join(tmpDir, "next.config.js"));

    const results = await scanForFrontendDir(tmpDir);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("dir");
    expect(results[0]).toHaveProperty("score");
    expect(results[0]).toHaveProperty("signals");
  });

  it("returns empty array when no candidates found", async () => {
    const emptyDir = path.join(tmpDir, "empty");
    mkdir(emptyDir);

    const results = await scanForFrontendDir(emptyDir);
    expect(results).toEqual([]);
  });

  it("returns same results as scoreCandidates", async () => {
    touch(path.join(tmpDir, "vite.config.ts"));

    const sync = scoreCandidates(tmpDir);
    const async_ = await scanForFrontendDir(tmpDir);

    expect(async_).toEqual(sync);
  });
});
