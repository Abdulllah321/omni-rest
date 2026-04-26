import fs from "fs";
import path from "path";
import type { FileResult } from "./frontend/types";

export interface SkillPackItem {
  source: string;
  destination: string;
}

export interface SkillInstallOptions {
  packageRoot?: string;
  overwrite?: boolean;
}

export interface SkillInstallResult extends FileResult {
  source: string;
  destination: string;
}

const SKILL_PACK: SkillPackItem[] = [
  { source: "AI/PROJECT_INTELLIGENCE.md", destination: "AI/PROJECT_INTELLIGENCE.md" },
  { source: "AI/PORTABLE_API_PLAYBOOK.md", destination: "AI/PORTABLE_API_PLAYBOOK.md" },
  { source: "AGENTS.md", destination: "AGENTS.md" },
  { source: "CLAUDE.md", destination: "CLAUDE.md" },
  { source: ".cursor/rules/omni-rest.mdc", destination: ".cursor/rules/omni-rest.mdc" },
  { source: ".kiro/agent-guide.md", destination: ".kiro/agent-guide.md" },
  { source: "ai/codex/omni-rest/SKILL.md", destination: "ai/codex/omni-rest/SKILL.md" },
];

export function getSkillPack(packageRoot = resolvePackageRoot()): SkillPackItem[] {
  return SKILL_PACK.map((item) => ({
    source: path.resolve(packageRoot, item.source),
    destination: item.destination,
  }));
}

export function installSkillPack(
  targetDir: string,
  options: SkillInstallOptions = {}
): SkillInstallResult[] {
  const packageRoot = path.resolve(options.packageRoot ?? resolvePackageRoot());
  const targetRoot = path.resolve(targetDir);
  const results: SkillInstallResult[] = [];

  for (const item of getSkillPack(packageRoot)) {
    const destPath = path.join(targetRoot, item.destination);

    try {
      if (!fs.existsSync(item.source)) {
        results.push({
          source: item.source,
          destination: destPath,
          path: destPath,
          status: "error",
          error: new Error(`Missing template file: ${item.source}`),
        });
        continue;
      }

      const existed = fs.existsSync(destPath);

      if (existed && !options.overwrite) {
        results.push({
          source: item.source,
          destination: destPath,
          path: destPath,
          status: "skipped",
        });
        continue;
      }

      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(item.source, destPath);

      results.push({
        source: item.source,
        destination: destPath,
        path: destPath,
        status: existed ? "overwritten" : "created",
      });
    } catch (error) {
      results.push({
        source: item.source,
        destination: destPath,
        path: destPath,
        status: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  return results;
}

export function printSkillPackSummary(results: SkillInstallResult[]): void {
  const GREEN = "\x1b[32m";
  const YELLOW = "\x1b[33m";
  const BLUE = "\x1b[34m";
  const RED = "\x1b[31m";
  const RESET = "\x1b[0m";

  for (const result of results) {
    switch (result.status) {
      case "created":
        console.log(`${GREEN}+${RESET} installed  ${result.destination}`);
        break;
      case "overwritten":
        console.log(`${YELLOW}!${RESET} updated    ${result.destination}`);
        break;
      case "skipped":
        console.log(`${BLUE}i${RESET} skipped    ${result.destination}`);
        break;
      case "error":
        console.log(
          `${RED}x${RESET} failed     ${result.destination}${result.error ? ` - ${result.error.message}` : ""}`
        );
        break;
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const overwritten = results.filter((r) => r.status === "overwritten").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  console.log(
    `\nInstalled ${created} files (${overwritten} updated, ${skipped} skipped, ${errors} errors)`
  );
}

function resolvePackageRoot(): string {
  return path.resolve(__dirname, "..");
}
