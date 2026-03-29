import * as fs from "fs";
import * as path from "path";

type Framework = "nextjs" | "vite-react" | "react";

/**
 * Detects project structure details
 */
export interface ProjectStructure {
  usesSrc: boolean;           // Has src/ directory
  usesAppRouter: boolean;     // Next.js App Router (app/ directory)
  usesPagesRouter: boolean;   // Next.js Pages Router (pages/ directory)
  basePath: string;           // Base path for generated files ("src" or ".")
  appPath: string | null;     // Path to app/ directory if exists
}

/**
 * Detects the project structure (src/, app/, pages/)
 */
export function detectProjectStructure(frontendDir: string): ProjectStructure {
  const hasSrc = fs.existsSync(path.join(frontendDir, "src"));
  const hasApp = fs.existsSync(path.join(frontendDir, "app"));
  const hasSrcApp = fs.existsSync(path.join(frontendDir, "src", "app"));
  const hasPages = fs.existsSync(path.join(frontendDir, "pages"));
  const hasSrcPages = fs.existsSync(path.join(frontendDir, "src", "pages"));

  const usesAppRouter = hasApp || hasSrcApp;
  const usesPagesRouter = hasPages || hasSrcPages;
  const basePath = hasSrc ? "src" : ".";
  
  let appPath: string | null = null;
  if (hasSrcApp) {
    appPath = path.join(frontendDir, "src", "app");
  } else if (hasApp) {
    appPath = path.join(frontendDir, "app");
  }

  return {
    usesSrc: hasSrc,
    usesAppRouter,
    usesPagesRouter,
    basePath,
    appPath,
  };
}

/**
 * Detects the frontend framework used in the given directory.
 *
 * Priority:
 *  1. next.config.js or next.config.ts → "nextjs"
 *  2. vite.config.ts or vite.config.js (no next config) → "vite-react"
 *  3. package.json with react in dependencies/devDependencies → "react"
 *  4. Fallback: prints warning and returns "react"
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function detectFramework(frontendDir: string): Framework {
  const hasNextConfig =
    fs.existsSync(path.join(frontendDir, "next.config.js")) ||
    fs.existsSync(path.join(frontendDir, "next.config.ts"));

  if (hasNextConfig) return "nextjs";

  const hasViteConfig =
    fs.existsSync(path.join(frontendDir, "vite.config.ts")) ||
    fs.existsSync(path.join(frontendDir, "vite.config.js"));

  if (hasViteConfig) return "vite-react";

  // Check package.json for react dependency
  const pkgPath = path.join(frontendDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const deps = pkg.dependencies ?? {};
      const devDeps = pkg.devDependencies ?? {};
      if ("react" in deps || "react" in devDeps) {
        return "react";
      }
    } catch {
      // ignore parse errors
    }
  }

  console.warn(
    `[omni-rest] Warning: Could not detect frontend framework in "${frontendDir}". Defaulting to "react".`
  );
  return "react";
}

/**
 * Parses a simple .env file and returns a map of key → value.
 * Handles KEY=VALUE and KEY="VALUE" formats. Ignores comments and blank lines.
 */
function parseEnvFile(filePath: string): Map<string, string> {
  const result = new Map<string, string>();
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return result;
  }

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result.set(key, value);
  }
  return result;
}

/**
 * Resolves the API base URL from environment files.
 *
 * Priority:
 *  1. .env.local → NEXT_PUBLIC_API_URL
 *  2. .env → NEXT_PUBLIC_API_URL or VITE_API_URL
 *  3. Fallback: "/api"
 *
 * Does NOT modify any env file.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function resolveBaseUrl(frontendDir: string): string {
  // 1. Check .env.local for NEXT_PUBLIC_API_URL
  const envLocal = parseEnvFile(path.join(frontendDir, ".env.local"));
  if (envLocal.has("NEXT_PUBLIC_API_URL")) {
    return envLocal.get("NEXT_PUBLIC_API_URL")!;
  }

  // 2. Check .env for NEXT_PUBLIC_API_URL or VITE_API_URL
  const env = parseEnvFile(path.join(frontendDir, ".env"));
  if (env.has("NEXT_PUBLIC_API_URL")) {
    return env.get("NEXT_PUBLIC_API_URL")!;
  }
  if (env.has("VITE_API_URL")) {
    return env.get("VITE_API_URL")!;
  }

  // 3. Default
  return "/api";
}

/**
 * Resolves the output directory for generated files.
 *
 * Rules (in priority order):
 *  1. If outFlag is provided → path.resolve(frontendDir, outFlag)
 *  2. If src/ exists → frontendDir/src/
 *  3. Otherwise → frontendDir/ (root)
 *
 * Note: For Next.js App Router, components/hooks/lib go in root or src/,
 * while pages are generated separately in app/ directory.
 *
 * Requirements: 13.1, 13.2, 13.3
 */
export function resolveOutputDir(
  frontendDir: string,
  framework: Framework,
  outFlag?: string
): string {
  if (outFlag) {
    return path.resolve(frontendDir, outFlag);
  }

  const structure = detectProjectStructure(frontendDir);
  
  // Use detected base path (src or root)
  if (structure.usesSrc) {
    return path.resolve(frontendDir, "src");
  }

  // Default to root directory
  return frontendDir;
}
