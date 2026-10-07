/**
 * The `ui-common` bin: output rewriting, the agents block, the upgrade
 * registry, upstream Astryx codemods, and the maintainer command's guard
 * rails. The bin is run as a child process where the behaviour under test is
 * the process boundary (exit codes, stdout vs stderr, cwd).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import jscodeshift from "jscodeshift";
import { afterEach, describe, expect, it } from "vitest";

import {
  findBlock,
  injectBlock,
  MARKER_END,
  MARKER_START,
  transformBlock,
} from "../../cli/agents.mjs";
import { rewriteRun } from "../../cli/passthrough.mjs";
import {
  exclusionNotes,
  rewriteCommands,
  rewriteSpecifiers,
} from "../../cli/rewrite.mjs";
import { coerce, compare, nextBreaking } from "../../cli/semver.mjs";
import { keptClassRename, MOVED, REMOVED } from "../../codemods/0.2/map.mjs";
import {
  LEGACY_CLASSES,
  astryxCustomProperties,
  describeClass,
} from "../../codemods/0.2/scan.mjs";
import { registeredVersions, stepsBetween } from "../../codemods/registry.mjs";
import { toAstryxSpecifiers, upstreamStep } from "../../codemods/upstream.mjs";

// The CLI package (packages/cli) and the repository root, which is the
// @lablup/ui-common package the CLI works for.
const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const root = resolve(cliRoot, "../..");
const bin = join(cliRoot, "bin/ui-common.mjs");

const temps: string[] = [];
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function tempProject() {
  const dir = mkdtempSync(join(tmpdir(), "uic-cli-"));
  temps.push(dir);
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "consumer", private: true })}\n`,
  );
  return dir;
}
function run(args: string[], cwd = root) {
  const result = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8" });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("output rewriting", { timeout: 60_000 }, () => {
  it("maps Astryx specifiers onto ui-common's mirror", () => {
    expect(
      rewriteSpecifiers('import { Button } from "@astryxdesign/core/Button";'),
    ).toBe('import { Button } from "@lablup/ui-common/Button";');
    expect(rewriteSpecifiers("from '@astryxdesign/core'")).toBe(
      "from '@lablup/ui-common'",
    );
    expect(rewriteSpecifiers('"@astryxdesign/lab"')).toBe('"@lablup/ui-common/lab"');
    expect(rewriteSpecifiers("@astryxdesign/lab/lab.css")).toBe(
      "@lablup/ui-common/lab/lab.css",
    );
    expect(rewriteSpecifiers("`@astryxdesign/theme-neutral/built`")).toBe(
      "`@lablup/ui-common/theme/neutral/built`",
    );
    expect(rewriteSpecifiers("@astryxdesign/core/theme/tokens.stylex")).toBe(
      "@lablup/ui-common/theme/tokens.stylex",
    );
    // Not mirrored: left alone.
    expect(rewriteSpecifiers("@astryxdesign/charts")).toBe("@astryxdesign/charts");
    expect(rewriteSpecifiers("@astryxdesign/core-extra")).toBe(
      "@astryxdesign/core-extra",
    );
  });

  it("rewrites CLI invocations but not layer or class names", () => {
    expect(
      rewriteCommands("run `pnpm exec astryx component Button`", "pnpm exec ui-common"),
    ).toBe("run `pnpm exec ui-common component Button`");
    expect(rewriteCommands("npx @astryxdesign/cli docs tokens", "npx ui-common")).toBe(
      "npx ui-common docs tokens",
    );
    expect(rewriteCommands("command: astryx component Button")).toBe(
      "command: ui-common component Button",
    );
    const untouched =
      "@layer astryx-base; .astryx-badge {} @astryxdesign/core/astryx.css astryx is great";
    expect(rewriteCommands(untouched)).toBe(untouched);
  });

  it("annotates names ui-common hides", () => {
    expect(exclusionNotes("see @lablup/ui-common/Dialog")[0]).toMatch(
      /Use Modal .*not Dialog/,
    );
    // Dialog is matched as a whole word: AlertDialog is its own exclusion,
    // and DialogHeader is re-exported by Modal.
    const notes = exclusionNotes("AlertDialog and DialogHeader");
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatch(/Use AlertModal .*not AlertDialog/);
    expect(exclusionNotes("DialogHeader")).toEqual([]);
    expect(exclusionNotes("nothing", ["component", "Dialog"])).toHaveLength(1);
  });

  it("says ui-common's forks come from ui-common, under Astryx's name", () => {
    const [note] = exclusionNotes("nothing", ["component", "ComplexSelector"]);
    expect(note).toMatch(
      /^Note: ComplexSelector \(@lablup\/ui-common\/ComplexSelector\) comes from ui-common: .*same API/,
    );
    expect(note).toContain("hasClear");
    expect(note).not.toMatch(/does not export|Use ComplexSelector/);
    const lab = exclusionNotes(
      "import { Drawer, TourStep } from '@lablup/ui-common/lab'",
    );
    expect(lab).toHaveLength(2);
    expect(lab[0]).toMatch(
      /^Note: Drawer \(@lablup\/ui-common\/lab\) comes from ui-common/,
    );
    expect(lab[1]).toMatch(
      /^Note: Tour \(@lablup\/ui-common\/lab\) comes from ui-common/,
    );
    expect(exclusionNotes("Selector and Tourniquet")).toEqual([]);
  });

  it("keeps --json output valid and puts notes on stderr", () => {
    const stdout = JSON.stringify({
      type: "component",
      data: {
        import: "import { Dialog } from '@astryxdesign/core/Dialog';",
        command: "astryx docs x",
      },
    });
    const out = rewriteRun(
      { stdout, stderr: "" },
      {
        args: ["component", "Dialog", "--json"],
        cwd: root,
        invocation: "pnpm exec ui-common",
      },
    );
    const parsed = JSON.parse(out.stdout);
    expect(parsed.data.import).toBe(
      "import { Dialog } from '@lablup/ui-common/Dialog';",
    );
    expect(parsed.data.command).toBe("ui-common docs x");
    expect(out.stderr).toMatch(/not Dialog/);
  });

  it("passes a real command through, rewritten, with its exit code", () => {
    const ok = run(["component", "Button", "--json"]);
    expect(ok.code).toBe(0);
    const text = JSON.stringify(JSON.parse(ok.stdout));
    expect(text).not.toContain("@astryxdesign/core");
    expect(text).toContain("@lablup/ui-common/Button");

    const missing = run(["component", "NoSuchComponentAnywhere"]);
    const direct = spawnSync(
      process.execPath,
      [
        join(root, "node_modules/@astryxdesign/cli/clients/cli/bin/astryx.mjs"),
        "component",
        "NoSuchComponentAnywhere",
      ],
      { cwd: root },
    );
    expect(missing.code).toBe(direct.status);
    expect(missing.code).not.toBe(0);
  });

  it("prints its version and help", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const cliPkg = JSON.parse(readFileSync(join(cliRoot, "package.json"), "utf8"));
    // Lockstep: the CLI is released at the version of the ui-common it serves.
    expect(cliPkg.version).toBe(pkg.version);
    expect(run(["--version"]).stdout.trim()).toBe(pkg.version);
    const help = run(["--help"]);
    expect(help.code).toBe(0);
    for (const command of ["agents", "upgrade", "sync-astryx"])
      expect(help.stdout).toContain(command);
    expect(run(["upgrade", "--help"]).stdout).toContain("--dry-run");
  });
});

describe("agents", { timeout: 60_000 }, () => {
  const astryxBlock = [
    "<!-- ASTRYX:START -->",
    "Astryx v0.6.2 · 90+ components",
    "CLI: run every command as `pnpm exec astryx <cmd>` (shown below as `astryx ...`).",
    "",
    "SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:",
    '  import "@astryxdesign/core/reset.css";',
    '  import "@astryxdesign/core/astryx.css";',
    "",
    "RULES:",
    "- Custom styling: else the xstyle prop / StyleX tokens (@astryxdesign/core/theme/tokens.stylex).",
    "- Frame first: read `astryx docs layout`.",
    "",
    "MORE CLI:",
    "  upgrade --apply    run after any Astryx or integration dependency bump",
    "",
    "INTEGRATIONS:",
    "- `@lablup/ui-common`: Use Modal, not Dialog.",
    "<!-- ASTRYX:END -->",
  ].join("\n");

  it("rewrites the Astryx block into a ui-common block", () => {
    const block = transformBlock(astryxBlock, {
      version: "0.2.0",
      astryxVersion: "0.6.2",
      invocation: "pnpm exec ui-common",
      componentCount: 164,
    });
    expect(block.startsWith(MARKER_START)).toBe(true);
    expect(block.endsWith(MARKER_END)).toBe(true);
    expect(block).not.toContain("ASTRYX:");
    expect(block).not.toContain("@astryxdesign/core");
    expect(block).toContain(
      "@lablup/ui-common v0.2.0 · Astryx v0.6.2 · 164 components",
    );
    expect(block).toContain(
      "`pnpm exec ui-common <cmd>` (shown below as `ui-common ...`)",
    );
    expect(block).toContain("@lablup/ui-common/theme/tokens.stylex");
    expect(block).toContain("read `ui-common docs layout`");
    expect(block).toContain(
      "@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;",
    );
    expect(block).toContain('@import "@lablup/ui-common/theme/lablup/theme.css";');
    expect(block).toContain("Use Modal (@lablup/ui-common/Modal), not Dialog");
    // A fork keeps Astryx's name: no "use X, not X" line, and not listed as
    // one of ui-common's own components.
    expect(block).toContain(
      "- ComplexSelector (@lablup/ui-common/ComplexSelector) comes from ui-common: its own copy of Astryx's, same API and import path.",
    );
    expect(block).toContain("- Drawer (@lablup/ui-common/lab) comes from ui-common");
    expect(block).toContain("- Tour (@lablup/ui-common/lab) comes from ui-common");
    expect(block).not.toMatch(/Use (ComplexSelector|Drawer|Tour) /);
    expect(block).not.toMatch(/ui-common's own components: [^\n]*\bComplexSelector\b/);
    expect(block).toContain("uiCommonMessages");
    // The integration line ui-common contributes is restated, not duplicated.
    expect(block).not.toContain("INTEGRATIONS:");
  });

  it("injects between markers and keeps the rest of the file", () => {
    const block = `${MARKER_START}\nnew\n${MARKER_END}`;
    expect(injectBlock(null, block)).toBe(`${block}\n`);
    expect(injectBlock("# Title\n\nmine\n", block)).toBe(
      `# Title\n\nmine\n\n${block}\n`,
    );
    const existing = `# Title\n\n${MARKER_START}\nold\n${MARKER_END}\n\nafter\n`;
    expect(injectBlock(existing, block)).toBe(`# Title\n\n${block}\n\nafter\n`);
    expect(() => findBlock(`${MARKER_START}\n${MARKER_START}\n${MARKER_END}`)).toThrow(
      /more than one/,
    );
    expect(() => findBlock(`${MARKER_START}\nno end`)).toThrow(/without/);
  });

  it("--write, then --check passes; an edit makes --check fail", () => {
    const dir = tempProject();
    writeFileSync(join(dir, "AGENTS.md"), "# Agents\n\nProject rules stay.\n");
    const write = run(["agents", "--write", "AGENTS.md"], dir);
    expect(write.code, write.stderr).toBe(0);
    const written = readFileSync(join(dir, "AGENTS.md"), "utf8");
    expect(written.startsWith("# Agents\n\nProject rules stay.\n")).toBe(true);
    expect(written).toContain(MARKER_START);
    expect(written).toContain("CLI: run every command as `npx ui-common <cmd>`");

    expect(run(["agents", "--check"], dir).code).toBe(0);
    expect(run(["agents", "--write", "AGENTS.md"], dir).stdout).toContain(
      "already up to date",
    );

    writeFileSync(
      join(dir, "AGENTS.md"),
      written.replace("UI-COMMON (", "UI-COMMON edited ("),
    );
    const stale = run(["agents", "--check"], dir);
    expect(stale.code).toBe(1);
    expect(stale.stderr).toContain("stale");

    const empty = tempProject();
    expect(run(["agents", "--check"], empty).code).toBe(1);
    expect(run(["agents", "--bogus"], empty).code).toBe(2);
  });

  it("prints the block to stdout without writing anything", () => {
    const dir = tempProject();
    const printed = run(["agents"], dir);
    expect(printed.code).toBe(0);
    expect(printed.stdout.trim().startsWith(MARKER_START)).toBe(true);
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(false);
  });
});

describe("upgrade registry", () => {
  it("orders versions with prerelease precedence", () => {
    expect(compare("0.1.0-alpha.19", "0.2.0-alpha.0")).toBeLessThan(0);
    expect(compare("0.2.0-alpha.0", "0.2.0")).toBeLessThan(0);
    expect(compare("0.2.0-alpha.10", "0.2.0-alpha.9")).toBeGreaterThan(0);
    expect(coerce("^0.1.0-alpha.7")).toBe("0.1.0-alpha.7");
    expect(coerce(">=0.1.0-alpha.0 <0.2.0")).toBe("0.1.0-alpha.0");
    expect(coerce("0.1")).toBe("0.1.0");
    expect(coerce("workspace:*")).toBeNull();
    expect(nextBreaking("0.2.0-alpha.0")).toBe("0.2.0-alpha.1");
    expect(nextBreaking("0.2.3")).toBe("0.3.0");
  });

  it("selects the 0.1 -> 0.2 step for every 0.1 prerelease", async () => {
    expect(registeredVersions()).toContain("0.2.0-alpha.0");
    expect(await stepsBetween("0.1.0-alpha.7", "0.2.0-alpha.0")).toHaveLength(1);
    expect(await stepsBetween("0.2.0-alpha.0", "0.2.0-alpha.3")).toHaveLength(0);
    // 0.1.0 -> 0.2.0 crosses the 0.1 -> 0.2 step and every upstream
    // (sync-astryx) step recorded under a 0.2 prerelease since.
    const versions = (await stepsBetween("0.1.0", "0.2.0")).map((s) => s.version);
    expect(versions[0]).toBe("0.2.0-alpha.0");
    expect(versions).toEqual(
      registeredVersions().filter(
        (v) => compare(v, "0.1.0") > 0 && compare(v, "0.2.0") <= 0,
      ),
    );
  });

  it("registers the Astryx 0.6.5 codemods under 0.2.0-alpha.16", async () => {
    expect(registeredVersions()).toContain("0.2.0-alpha.16");
    expect(await stepsBetween("0.2.0-alpha.15", "0.2.0-alpha.16")).toHaveLength(1);
    expect(await stepsBetween("0.2.0-alpha.16", "0.2.0")).toHaveLength(0);
  });

  it("maps every removed export onto something the installed Astryx exports", () => {
    const declarations = (subpath: string) => {
      const file =
        subpath === "lab"
          ? join(root, "node_modules/@astryxdesign/lab/dist/index.d.ts")
          : join(root, "node_modules/@astryxdesign/core/dist", subpath, "index.d.ts");
      return readFileSync(file, "utf8");
    };
    for (const [name, entry] of REMOVED) {
      const exported = declarations(entry.subpath);
      expect(exported, `${name} -> ${entry.subpath}`).toMatch(
        new RegExp(`\\b${entry.to}\\b`),
      );
      for (const [type, to] of Object.entries(entry.types)) {
        if (to)
          expect(exported, `${type} -> ${entry.subpath}.${to}`).toMatch(
            new RegExp(`\\b${to}\\b`),
          );
      }
      for (const [alternate, subpath] of Object.entries(entry.alternates)) {
        expect(declarations(subpath)).toMatch(new RegExp(`\\b${alternate}\\b`));
      }
    }
    // Moved exports resolve at their new home.
    const barrel = readFileSync(join(root, "src/index.ts"), "utf8");
    for (const [name] of MOVED)
      expect(barrel, name).toMatch(new RegExp(`\\b${name}\\b`));
  });

  it("follows the map's class renames for kept components", () => {
    expect(keptClassRename("page-header__title")).toEqual({
      to: "uic-page-header__title",
    });
    expect(keptClassRename("error-state__action-btn--primary")).toEqual({
      to: "uic-error-state__action--primary",
    });
    expect(keptClassRename("skeleton--circle")).toEqual({
      to: "uic-skeleton-shape--circle",
    });
    expect(keptClassRename("skeleton__shimmer")).toEqual({ to: null });
    expect(keptClassRename("button--primary")).toBeNull();
    expect(keptClassRename("uic-page-header")).toBeNull();
    expect(describeClass("page-header__title")).toBe(
      ".page-header__title → .uic-page-header__title (PageHeader)",
    );
    expect(describeClass("badge--primary")).toBe(".badge--primary (Badge): gone");
  });

  it("knows the 0.1 class names and Astryx's custom properties", () => {
    expect(LEGACY_CLASSES.get("button--primary")).toBe("Button");
    expect(LEGACY_CLASSES.get("drawer__content")).toBe("Drawer");
    const props = astryxCustomProperties();
    expect(props.has("--color-border")).toBe(true);
    expect(props.has("--token-colorPrimary")).toBe(false);
  });
});

describe("upstream Astryx codemods", () => {
  it("swaps specifiers both ways", () => {
    const text =
      'import a from "@lablup/ui-common/hooks"; import "@lablup/ui-common/lab/lab.css"; import "@lablup/ui-common/theme/neutral/built"; import "@lablup/ui-common";';
    const swapped = toAstryxSpecifiers(text);
    expect(swapped).toBe(
      'import a from "@astryxdesign/core/hooks"; import "@astryxdesign/lab/lab.css"; import "@astryxdesign/theme-neutral/built"; import "@astryxdesign/core";',
    );
    expect(rewriteSpecifiers(swapped)).toBe(text);
  });

  it("runs a real Astryx codemod on ui-common specifiers", async () => {
    const step = await upstreamStep({
      astryx: { from: "0.5.4", to: "0.6.0" },
      codemods: [
        { id: "move-ime-helper-import", version: "0.6.0" },
        { id: "no-such-codemod", version: "0.6.0" },
      ],
    });
    expect(step.transforms).toHaveLength(1);
    expect(step.notes?.[0]).toContain("no-such-codemod");
    const j = jscodeshift.withParser("tsx");
    const source =
      'import { isImeKeyEvent, useClipboard } from "@lablup/ui-common/hooks";\n';
    const out = step.transforms[0]!.run(
      { path: "a.tsx", source },
      { jscodeshift: j },
      {},
    );
    expect(out).toContain("@lablup/ui-common/utils");
    expect(out).toContain('"@lablup/ui-common/hooks"');
    expect(out).not.toContain("@astryxdesign");
    expect(
      step.transforms[0]!.run(
        { path: "b.tsx", source: "const a = 1;\n" },
        { jscodeshift: j },
        {},
      ),
    ).toBeUndefined();
  });

  it("skips Astryx's project-level codemods with a note instead of running them per file", async () => {
    const step = await upstreamStep({
      astryx: { from: "0.6.2", to: "0.6.5" },
      codemods: [
        { id: "migrate-theme-catalog-to-descriptors", version: "0.6.4" },
        { id: "migrate-native-picker-to-presentation", version: "0.6.4" },
      ],
    });
    expect(step.transforms.map((t) => t.id)).toEqual([
      "astryx:migrate-native-picker-to-presentation",
    ]);
    expect(step.notes?.join("\n")).toContain("migrate-theme-catalog-to-descriptors");
  });

  it("moves the consumer's pins, lab canary and core override on an upstream step", async () => {
    const step = await upstreamStep({
      astryx: { from: "0.6.2", to: "0.6.5" },
      lab: { from: "0.6.2-canary.c9fb1ad", to: "0.6.5-canary.8701623" },
      codemods: [],
    });
    const dir = tempProject();
    const yaml = join(dir, "pnpm-workspace.yaml");
    writeFileSync(
      yaml,
      'overrides:\n  "@astryxdesign/lab>@astryxdesign/core": "0.6.2"\n',
    );
    const notes: string[] = [];
    const edits = new Map<string, string>();
    const ctx = {
      to: "0.2.0-alpha.16",
      projectDir: dir,
      note: (m: string) => notes.push(m),
      editFile: (
        path: string,
        edit: (current: string | null) => string | undefined,
      ) => {
        const next = edit(existsSync(path) ? readFileSync(path, "utf8") : null);
        if (next != null) edits.set(path, next);
      },
    };
    const text = `${JSON.stringify(
      {
        name: "consumer",
        dependencies: {
          "@astryxdesign/lab": "0.6.2-canary.c9fb1ad",
          "@lablup/ui-common": "0.2.0-alpha.15",
        },
        devDependencies: { "@lablup/ui-common-cli": "0.2.0-alpha.15" },
      },
      null,
      2,
    )}\n`;
    const pkg = JSON.parse(step.packageJson!(text, ctx)!);
    expect(pkg.dependencies["@lablup/ui-common"]).toBe("0.2.0-alpha.16");
    expect(pkg.devDependencies["@lablup/ui-common-cli"]).toBe("0.2.0-alpha.16");
    expect(pkg.dependencies["@astryxdesign/lab"]).toBe("0.6.5-canary.8701623");
    const corePin = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
      .dependencies["@astryxdesign/core"];
    expect(edits.get(yaml)).toContain(
      `"@astryxdesign/lab>@astryxdesign/core": "${corePin}"`,
    );
    expect(notes.join("\n")).toContain("0.6.5-canary.8701623");

    // No lab, a caret range: only the ui-common pins move, nothing else is touched.
    const plain = `${JSON.stringify({
      name: "app",
      dependencies: { "@lablup/ui-common": "^0.2.0-alpha.15" },
    })}\n`;
    edits.clear();
    const after = JSON.parse(step.packageJson!(plain, ctx)!);
    expect(after.dependencies["@lablup/ui-common"]).toBe("^0.2.0-alpha.16");
    expect(edits.size).toBe(0);
    expect(step.packageJson!(JSON.stringify({ name: "x" }), ctx)).toBeUndefined();

    // pnpm catalog references are left alone: the versions live in the catalog.
    const catalog = `${JSON.stringify({
      name: "app",
      dependencies: {
        "@astryxdesign/lab": "catalog:",
        "@lablup/ui-common": "catalog:",
      },
      devDependencies: { "@lablup/ui-common-cli": "catalog:" },
    })}\n`;
    notes.length = 0;
    const kept = step.packageJson!(catalog, ctx);
    expect(JSON.parse(kept ?? catalog)).toEqual(JSON.parse(catalog));
    expect(notes.join("\n")).toContain("not a version, so it was left alone");
  });

  it("swaps module specifiers only, never comments or other strings", async () => {
    const step = await upstreamStep({
      astryx: { from: "0.5.4", to: "0.6.0" },
      codemods: [{ id: "move-ime-helper-import", version: "0.6.0" }],
    });
    const j = jscodeshift.withParser("tsx");
    const source = [
      'import { isImeKeyEvent } from "@lablup/ui-common/hooks";',
      "// Built on @lablup/ui-common, which wraps @astryxdesign/core.",
      'const lazy = () => import("@lablup/ui-common/Button");',
      'export const note = "see @astryxdesign/core/hooks and @lablup/ui-common/hooks";',
      "",
    ].join("\n");
    const out = step.transforms[0]!.run(
      { path: "a.tsx", source },
      { jscodeshift: j },
      {},
    ) as string;
    expect(out).toContain("@lablup/ui-common/utils");
    expect(out).toContain(
      "// Built on @lablup/ui-common, which wraps @astryxdesign/core.",
    );
    expect(out).toContain(
      'export const note = "see @astryxdesign/core/hooks and @lablup/ui-common/hooks";',
    );
    expect(out).toContain('import("@lablup/ui-common/Button")');
  });
});

describe("sync-astryx", { timeout: 60_000 }, () => {
  it("refuses to run outside the ui-common repository", () => {
    const dir = tempProject();
    const result = run(["sync-astryx", "0.6.2", "--dry-run"], dir);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("inside the @lablup/ui-common repository");
  });

  it("rejects a missing or malformed version", () => {
    expect(run(["sync-astryx"]).code).toBe(2);
    expect(run(["sync-astryx", "next"]).code).toBe(2);
    expect(run(["sync-astryx", "0.6.2", "--lab", "canary"]).code).toBe(2);
  });

  it("dry-runs against the pinned version without touching the tree", () => {
    const before = execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
    });
    const pkg = readFileSync(join(root, "package.json"), "utf8");
    const pinned = JSON.parse(pkg).dependencies["@astryxdesign/core"];
    const result = run(["sync-astryx", pinned, "--dry-run"]);
    expect(result.code, result.stderr).toBe(0);
    expect(result.stdout).toContain(`Astryx ${pinned} → ${pinned}`);
    expect(result.stdout).toContain("astryx upgrade --from");
    expect(result.stdout).toContain("Nothing would be recorded");
    expect(readFileSync(join(root, "package.json"), "utf8")).toBe(pkg);
    expect(
      execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }),
    ).toBe(before);
  });
});
