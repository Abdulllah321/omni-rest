import * as fs from "fs";
import * as path from "path";
import type { CandidateFrontend } from "./types";

const EXCLUDED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "out"]);

/**
 * Reads and parses a package.json at the given directory.
 * Returns null if the file doesn't exist or can't be parsed.
 */
function readPackageJson(dir: string): Record<string, unknown> | null {
  const pkgPath = path.join(dir, "package.json");
  try {
    const content = fs.readFileSync(pkgPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Scores a single directory based on the presence of framework config files
 * and react in package.json. Returns a CandidateFrontend or null if score is 0.
 */
function scoreDir(dir: string, cwd: string): CandidateFrontend | null {
  let score = 0;
  const signals: string[] = [];

  // Check for next.config.js / next.config.ts
  if (
    fs.existsSync(path.join(dir, "next.config.js")) ||
    fs.existsSync(path.join(dir, "next.config.ts"))
  ) {
    score += 10;
    const file = fs.existsSync(path.join(dir, "next.config.js"))
      ? "next.config.js"
      : "next.config.ts";
    signals.push(`${file} found`);
  }

  // Check for vite.config.ts / vite.config.js
  if (
    fs.existsSync(path.join(dir, "vite.config.ts")) ||
    fs.existsSync(path.join(dir, "vite.config.js"))
  ) {
    score += 10;
    const file = fs.existsSync(path.join(dir, "vite.config.ts"))
      ? "vite.config.ts"
      : "vite.config.js";
    signals.push(`${file} found`);
  }

  // Check package.json for react dependency
  const pkg = readPackageJson(dir);
  if (pkg) {
    const deps = (pkg.dependencies as Record<string, string> | undefined) ?? {};
    const devDeps = (pkg.devDependencies as Record<string, string> | undefined) ?? {};

    if ("react" in deps) {
      score += 5;
      signals.push("react in dependencies");
    } else if ("react" in devDeps) {
      score += 3;
      signals.push("react in devDependencies");
    }
  }

  // Bonus for current working directory
  if (path.resolve(dir) === path.resolve(cwd)) {
    score += 2;
    signals.push("current working directory");
  }

  if (score === 0) return null;

  return {
    dir: path.resolve(dir),
    score,
    signals,
  };
}

/**
 * Recursively walks up to `maxDepth` levels deep from `rootDir`,
 * excluding directories in EXCLUDED_DIRS, and collects scored candidates.
 */
function walk(
  dir: string,
  cwd: string,
  currentDepth: number,
  maxDepth: number,
  results: Map<string, CandidateFrontend>
): void {
  const absDir = path.resolve(dir);

  // Score this directory
  const candidate = scoreDir(absDir, cwd);
  if (candidate && !results.has(absDir)) {
    results.set(absDir, candidate);
  }

  if (currentDepth >= maxDepth) return;

  // Recurse into subdirectories
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    walk(path.join(absDir, entry.name), cwd, currentDepth + 1, maxDepth, results);
  }
}

/**
 * Walks up to 3 levels deep from `dir`, scores each candidate directory,
 * and returns CandidateFrontend[] sorted descending by score (score 0 excluded).
 */
export function scoreCandidates(dir: string): CandidateFrontend[] {
  const cwd = process.cwd();
  const results = new Map<string, CandidateFrontend>();

  walk(dir, cwd, 0, 3, results);

  return Array.from(results.values()).sort((a, b) => b.score - a.score);
}

/**
 * Public API: scans for frontend directories starting from `dir`.
 * Returns CandidateFrontend[] sorted descending by score.
 */
export async function scanForFrontendDir(dir: string): Promise<CandidateFrontend[]> {
  return scoreCandidates(dir);
}
