import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { installSkillPack } from "../src/skill-installer";

describe("installSkillPack", () => {
  it("installs the portable AI pack into a target project", () => {
    const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), "omni-rest-skill-"));

    const results = installSkillPack(targetDir, {
      packageRoot: process.cwd(),
    });

    expect(results).toHaveLength(7);
    expect(fs.existsSync(path.join(targetDir, "AI", "PROJECT_INTELLIGENCE.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "AI", "PORTABLE_API_PLAYBOOK.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "AGENTS.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "CLAUDE.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, ".cursor", "rules", "omni-rest.mdc"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, ".kiro", "agent-guide.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "ai", "codex", "omni-rest", "SKILL.md"))).toBe(true);
  });

  it("skips files that already exist unless overwrite is enabled", () => {
    const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), "omni-rest-skill-"));
    const existing = path.join(targetDir, "CLAUDE.md");
    fs.mkdirSync(path.dirname(existing), { recursive: true });
    fs.writeFileSync(existing, "custom");

    const skipped = installSkillPack(targetDir, {
      packageRoot: process.cwd(),
    });

    const skippedEntry = skipped.find((r) => r.destination.endsWith("CLAUDE.md"));
    expect(skippedEntry?.status).toBe("skipped");
    expect(fs.readFileSync(existing, "utf-8")).toBe("custom");

    const overwritten = installSkillPack(targetDir, {
      packageRoot: process.cwd(),
      overwrite: true,
    });

    const overwrittenEntry = overwritten.find((r) => r.destination.endsWith("CLAUDE.md"));
    expect(overwrittenEntry?.status).toBe("overwritten");
    expect(fs.readFileSync(existing, "utf-8")).not.toBe("custom");
  });
});
