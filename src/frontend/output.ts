import * as fs from "fs";
import * as path from "path";
import type { FileResult } from "./types";

// ── ANSI colour helpers ───────────────────────────────────────────────────────
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE   = "\x1b[34m";
const RED    = "\x1b[31m";
const RESET  = "\x1b[0m";

// ─────────────────────────────────────────────────────────────────────────────
//  writeFile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Writes `content` to `destPath`, creating intermediate directories as needed.
 * Returns a `FileResult` with:
 *   - `"created"`     — file did not exist before
 *   - `"overwritten"` — file already existed and was replaced
 *   - `"error"`       — write failed (error attached)
 */
export async function writeFile(destPath: string, content: string): Promise<FileResult> {
  let existed = false;
  try {
    existed = fs.existsSync(destPath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, content, "utf8");
    return { path: destPath, status: existed ? "overwritten" : "created" };
  } catch (err) {
    return { path: destPath, status: "error", error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  copyBaseComponents
// ─────────────────────────────────────────────────────────────────────────────

const BASE_COMPONENTS: Array<{ src: string; dest: string }> = [
  { src: "frontend-next/data-table.tsx",    dest: "components/data-table.tsx" },
  { src: "frontend-next/form-generator.tsx", dest: "components/form-generator.tsx" },
];

/**
 * Copies the shared DataTable and FormGenerator source files from `packageRoot`
 * into `{outputDir}/components/`.
 *
 * - If the destination already exists, returns `FileResult` with `"skipped"`.
 * - Creates intermediate directories as needed.
 * - Returns one `FileResult` per file.
 */
export async function copyBaseComponents(outputDir: string, packageRoot: string): Promise<FileResult[]> {
  const results: FileResult[] = [];

  for (const { src, dest } of BASE_COMPONENTS) {
    const srcPath  = path.join(packageRoot, src);
    const destPath = path.join(outputDir, dest);

    if (fs.existsSync(destPath)) {
      results.push({ path: destPath, status: "skipped" });
      continue;
    }

    try {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      results.push({ path: destPath, status: "created" });
    } catch (err) {
      results.push({
        path: destPath,
        status: "error",
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
//  printSummary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prints a per-file status line for each `FileResult`, then a final count
 * summary line.
 *
 * Visual indicators:
 *   created     → green  ✓
 *   overwritten → yellow ⚠
 *   skipped     → blue   ℹ
 *   error       → red    ✗
 */
export function printSummary(results: FileResult[]): void {
  for (const r of results) {
    switch (r.status) {
      case "created":
        console.log(`${GREEN}✓${RESET} created     ${r.path}`);
        break;
      case "overwritten":
        console.log(`${YELLOW}⚠${RESET} overwritten ${r.path}`);
        break;
      case "skipped":
        console.log(`${BLUE}ℹ${RESET} skipped     ${r.path}`);
        break;
      case "error":
        console.log(`${RED}✗${RESET} error       ${r.path}${r.error ? ` — ${r.error.message}` : ""}`);
        break;
    }
  }

  const created     = results.filter(r => r.status === "created").length;
  const overwritten = results.filter(r => r.status === "overwritten").length;
  const skipped     = results.filter(r => r.status === "skipped").length;
  const errors      = results.filter(r => r.status === "error").length;

  console.log(
    `\nGenerated ${created} files (${overwritten} overwritten, ${skipped} skipped, ${errors} errors)`
  );
}
