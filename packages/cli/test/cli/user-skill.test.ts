/**
 * `ui-common init --user`: the computer-level agent skill, written in place
 * of the one `astryx init --user` writes. Every test runs against a
 * throwaway home folder.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { importAstryxInternal } from "../../cli/paths.mjs";
import {
  initUserCommand,
  removeUserSkill,
  renderUserSkill,
  USER_SKILL_SOURCE,
  writeUserSkill,
} from "../../cli/user-skill.mjs";

const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const bin = join(cliRoot, "bin/ui-common.mjs");
const SOURCE = readFileSync(USER_SKILL_SOURCE, "utf8");

const temps: string[] = [];
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function tempHome(...folders: string[]) {
  const home = mkdtempSync(join(tmpdir(), "uic-home-"));
  temps.push(home);
  for (const f of folders) mkdirSync(join(home, f), { recursive: true });
  return home;
}
const skillFile = (home: string) => join(home, ".agents/skills/ui-common/SKILL.md");
const claudeLink = (home: string) => join(home, ".claude/skills/ui-common");

describe("the ui-common skill text", () => {
  const body = SOURCE.slice(SOURCE.indexOf("\n---\n", 4) + 5);

  it("has frontmatter naming it, with a quoted one-sentence description", () => {
    expect(SOURCE).toMatch(/^---\nname: ui-common\ndescription: "[^"\n]+"\n---\n/);
  });

  it("is short and names no version", () => {
    expect(body.split("\n").filter((l) => l.trim()).length).toBeLessThanOrEqual(15);
    expect(SOURCE).not.toMatch(/\b\d+\.\d+\.\d+\b/);
  });

  it("runs ui-common, never astryx, and names only stable commands", () => {
    const commands = [...body.matchAll(/`ui-common (\w+)/g)].map((m) => m[1]);
    expect(new Set(commands)).toEqual(
      new Set(["search", "component", "docs", "build", "template", "agents"]),
    );
    expect(body).not.toMatch(/`astryx \w/);
  });

  it("imports @lablup/ui-common and mentions @astryxdesign/* only to forbid it", () => {
    expect(body).toContain("`@lablup/ui-common`");
    const astryx = [...body.matchAll(/@astryxdesign\/[\w*-]+/g)];
    expect(astryx.map((m) => m[0])).toEqual(["@astryxdesign/*"]);
    expect(body).toContain("never import `@astryxdesign/*`");
  });

  it("keeps Astryx's workflow and self-check lines, in ui-common terms", async () => {
    const { WORKFLOW_TITLE, WORKFLOW_STEPS, SELF_CHECK_CSS } =
      await importAstryxInternal("foundation/agent-docs/agent-doc-state.mjs");
    expect(body).toContain(WORKFLOW_TITLE);
    for (const step of WORKFLOW_STEPS as string[]) {
      expect(body).toContain(step.replaceAll("`astryx ", "`ui-common "));
    }
    expect(body).toContain(SELF_CHECK_CSS);
  });

  it("renders with a hash line after the frontmatter", () => {
    const rendered = renderUserSkill();
    expect(rendered).toMatch(/\n---\n<!-- ui-common-managed sha256:[0-9a-f]{64} -->\n/);
    expect(rendered.replace(/<!-- ui-common-managed[^\n]*\n/, "")).toBe(SOURCE);
  });
});

describe("ui-common init --user", () => {
  it("writes the skill and links it into ~/.claude/skills", async () => {
    const home = tempHome();
    const rows = await writeUserSkill({ home });
    expect(readFileSync(skillFile(home), "utf8")).toBe(renderUserSkill());
    expect(lstatSync(claudeLink(home)).isSymbolicLink()).toBe(true);
    expect(readlinkSync(claudeLink(home))).toBe("../../.agents/skills/ui-common");
    expect(readFileSync(join(claudeLink(home), "SKILL.md"), "utf8")).toBe(
      renderUserSkill(),
    );
    expect(rows.map((r) => r.action)).toEqual(["written", "linked"]);
    // Other agents' folders are linked only when the agent is installed.
    expect(existsSync(join(home, ".kiro"))).toBe(false);
  });

  it("links the agents that are installed, and copies for one that skips links", async () => {
    const home = tempHome(".kiro", ".continue");
    await writeUserSkill({ home });
    expect(lstatSync(join(home, ".kiro/skills/ui-common")).isSymbolicLink()).toBe(true);
    const copy = join(home, ".continue/skills/ui-common");
    expect(lstatSync(copy).isDirectory()).toBe(true);
    expect(readFileSync(join(copy, "SKILL.md"), "utf8")).toBe(renderUserSkill());
  });

  it("is idempotent, and refreshes a file an older release wrote", async () => {
    const home = tempHome();
    await writeUserSkill({ home });
    const again = await writeUserSkill({ home });
    expect(again.every((r) => r.action === "unchanged")).toBe(true);

    const older = SOURCE.replace("Start with", "Begin with");
    writeFileSync(skillFile(home), renderUserSkill(older));
    const refreshed = await writeUserSkill({ home });
    expect(refreshed[0]!.action).toBe("written");
    expect(readFileSync(skillFile(home), "utf8")).toBe(renderUserSkill());
  });

  it("never touches an edited file, a foreign one, or a foreign link target", async () => {
    const home = tempHome();
    await writeUserSkill({ home });
    const edited = `${readFileSync(skillFile(home), "utf8")}\nMy own line.\n`;
    writeFileSync(skillFile(home), edited);
    expect((await writeUserSkill({ home }))[0]).toMatchObject({
      action: "kept",
      reason: "edited",
    });
    expect((await removeUserSkill({ home }))[0]).toMatchObject({ action: "kept" });
    expect(readFileSync(skillFile(home), "utf8")).toBe(edited);
    expect(lstatSync(claudeLink(home)).isSymbolicLink()).toBe(true);

    const other = tempHome(".claude/skills/ui-common");
    writeFileSync(join(other, ".claude/skills/ui-common/notes.md"), "mine\n");
    const rows = await writeUserSkill({ home: other });
    expect(rows[1]).toMatchObject({ action: "kept", reason: "foreign" });
    expect(readFileSync(join(other, ".claude/skills/ui-common/notes.md"), "utf8")).toBe(
      "mine\n",
    );

    const foreign = tempHome(".agents/skills/ui-common");
    writeFileSync(skillFile(foreign), "---\nname: ui-common\n---\nhand-written\n");
    expect((await writeUserSkill({ home: foreign }))[0]).toMatchObject({
      action: "kept",
      reason: "foreign",
    });
  });

  it("--remove-agents removes the file, its links and its copies, and only those", async () => {
    const home = tempHome(".continue", ".kiro/skills/astryx");
    await writeUserSkill({ home });
    const rows = await removeUserSkill({ home });
    expect(rows.map((r) => r.action)).toEqual([
      "removed",
      "removed",
      "removed",
      "removed",
    ]);
    expect(existsSync(skillFile(home))).toBe(false);
    expect(existsSync(claudeLink(home))).toBe(false);
    expect(existsSync(join(home, ".continue/skills/ui-common"))).toBe(false);
    expect(existsSync(join(home, ".kiro/skills/astryx"))).toBe(true);
    expect((await removeUserSkill({ home }))[0]!.action).toBe("absent");
  });

  it("points at Astryx's skill when that one is installed too", async () => {
    const home = tempHome(".agents/skills/astryx");
    writeFileSync(join(home, ".agents/skills/astryx/SKILL.md"), "astryx\n");
    const lines: string[] = [];
    const code = await initUserCommand(["--user"], { home, out: (s) => lines.push(s) });
    expect(code).toBe(0);
    expect(lines.join("")).toContain("Wrote ~/.agents/skills/ui-common/SKILL.md");
    expect(lines.join("")).toContain("ui-common astryx init --user --remove-agents");
    // Astryx's own skill is the person's to remove.
    expect(readFileSync(join(home, ".agents/skills/astryx/SKILL.md"), "utf8")).toBe(
      "astryx\n",
    );
  });

  it("is what the bin runs for `init --user`, instead of Astryx's", () => {
    const home = tempHome();
    const result = spawnSync(process.execPath, [bin, "init", "--user"], {
      cwd: home,
      encoding: "utf8",
      env: { ...process.env, HOME: home, USERPROFILE: home },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(skillFile(home))).toBe(true);
    expect(existsSync(join(home, ".agents/skills/astryx"))).toBe(false);
    const bad = spawnSync(
      process.execPath,
      [bin, "init", "--user", "--agent", "claude"],
      {
        cwd: home,
        encoding: "utf8",
        env: { ...process.env, HOME: home, USERPROFILE: home },
      },
    );
    expect(bad.status).toBe(2);
  });
});
