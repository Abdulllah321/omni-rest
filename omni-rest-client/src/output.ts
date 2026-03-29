import * as fs from "fs";
import * as path from "path";
import type { FileResult } from "./types";

const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE   = "\x1b[34m";
const RED    = "\x1b[31m";
const RESET  = "\x1b[0m";

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

const BASE_COMPONENTS: Array<{ src: string; dest: string }> = [
  { src: "base-components/data-table.tsx",     dest: "components/data-table.tsx" },
  { src: "base-components/form-generator.tsx", dest: "components/form-generator.tsx" },
  { src: "base-components/lib/utils.ts",       dest: "lib/utils.ts" },
];

const UI_COMPONENTS = [
  "alert-dialog", "badge", "button", "calendar", "card", "checkbox",
  "command", "dialog", "dropdown-menu", "form", "input-group", "input",
  "label", "pagination", "popover", "progress", "scroll-area", "select",
  "separator", "switch", "textarea", "tooltip",
];

/**
 * Copies shared base components + all UI components from the omni-rest-client package root.
 * Skips files that already exist so user customisations are preserved.
 */
export async function copyBaseComponents(outputDir: string, packageRoot: string): Promise<FileResult[]> {
  const results: FileResult[] = [];

  // data-table, form-generator, lib/utils
  for (const { src, dest } of BASE_COMPONENTS) {
    results.push(await copyOne(path.join(packageRoot, src), path.join(outputDir, dest)));
  }

  // ui/* components
  for (const name of UI_COMPONENTS) {
    const src  = path.join(packageRoot, "base-components", "ui", `${name}.tsx`);
    const dest = path.join(outputDir, "components", "ui", `${name}.tsx`);
    results.push(await copyOne(src, dest));
  }

  return results;
}

async function copyOne(srcPath: string, destPath: string): Promise<FileResult> {
  if (fs.existsSync(destPath)) return { path: destPath, status: "skipped" };
  try {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
    return { path: destPath, status: "created" };
  } catch (err) {
    return { path: destPath, status: "error", error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export function printSummary(results: FileResult[]): void {
  for (const r of results) {
    switch (r.status) {
      case "created":     console.log(`${GREEN}✓${RESET} created     ${r.path}`); break;
      case "overwritten": console.log(`${YELLOW}⚠${RESET} overwritten ${r.path}`); break;
      case "skipped":     console.log(`${BLUE}ℹ${RESET} skipped     ${r.path}`); break;
      case "error":       console.log(`${RED}✗${RESET} error       ${r.path}${r.error ? ` — ${r.error.message}` : ""}`); break;
    }
  }
  const created     = results.filter(r => r.status === "created").length;
  const overwritten = results.filter(r => r.status === "overwritten").length;
  const skipped     = results.filter(r => r.status === "skipped").length;
  const errors      = results.filter(r => r.status === "error").length;
  console.log(`\nGenerated ${created} files (${overwritten} overwritten, ${skipped} skipped, ${errors} errors)`);
}
