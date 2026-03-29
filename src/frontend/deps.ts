import * as fs from "fs";
import * as path from "path";

const BASE_PACKAGES = [
  "@tanstack/react-query",
  "@tanstack/react-table",
  "react-hook-form",
  "zod",
  "@hookform/resolvers",
];

const FRAMEWORK_PACKAGES: Record<string, string[]> = {
  nextjs: ["next"],
  "vite-react": ["react-router-dom"],
};

/**
 * Checks that required packages are present in the frontend project's package.json.
 *
 * Returns an array of missing package names. If package.json cannot be read,
 * all required packages are returned as missing.
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
export function checkDependencies(
  frontendDir: string,
  framework: "nextjs" | "vite-react" | "react"
): string[] {
  const required = [
    ...BASE_PACKAGES,
    ...(FRAMEWORK_PACKAGES[framework] ?? []),
  ];

  const pkgPath = path.join(frontendDir, "package.json");
  let installed: Set<string>;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const deps = Object.keys(pkg.dependencies ?? {});
    const devDeps = Object.keys(pkg.devDependencies ?? {});
    installed = new Set([...deps, ...devDeps]);
  } catch {
    // package.json missing or unreadable — treat all as missing
    return required;
  }

  return required.filter((pkg) => !installed.has(pkg));
}
