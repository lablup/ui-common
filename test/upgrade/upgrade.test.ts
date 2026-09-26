/**
 * The 0.1 -> 0.2 codemods against fixture projects that reproduce the
 * patterns real consumers use: root-barrel imports, subpath imports behind a
 * re-exporting barrel, adapter modules with aliased imports, a stylesheet
 * entry, and a library that takes ui-common as a peer.
 *
 * Each fixture is copied to a temp dir, upgraded, and compared file by file
 * with `expected/` (report and package.json included). Regenerate after an
 * intended change with `UPDATE_FIXTURES=1 pnpm vitest run test/upgrade`, then
 * read the diff.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { runUpgrade } from "../../cli/upgrade.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, "fixtures");
const UPDATE = process.env.UPDATE_FIXTURES === "1";
const TO = "0.2.0-alpha.0";

const temps: string[] = [];
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function tree(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(relative(dir, full));
    }
  };
  walk(dir);
  return out.sort();
}

/** The installed version appears in the report header; keep fixtures stable across releases. */
function normalize(file: string, text: string) {
  return file.endsWith(".md")
    ? text.replace(
        /installed @lablup\/ui-common [^)]+\)/,
        "installed @lablup/ui-common <version>)",
      )
    : text;
}

function copyFixture(name: string) {
  const dir = mkdtempSync(join(tmpdir(), `uic-upgrade-${name}-`));
  temps.push(dir);
  cpSync(join(FIXTURES, name, "input"), dir, { recursive: true });
  return dir;
}

const quiet = { log: () => {}, warn: () => {} };

const cases = readdirSync(FIXTURES).filter((name) =>
  existsSync(join(FIXTURES, name, "input")),
);

describe("ui-common upgrade 0.1 -> 0.2", () => {
  it.each(cases)("%s", async (name) => {
    const dir = copyFixture(name);
    const result = await runUpgrade({ cwd: dir, paths: ["src"], to: TO, ...quiet });
    expect(result.code, JSON.stringify(result.errors)).toBe(0);

    const expectedDir = join(FIXTURES, name, "expected");
    if (UPDATE) {
      rmSync(expectedDir, { recursive: true, force: true });
      for (const file of tree(dir)) {
        mkdirSync(dirname(join(expectedDir, file)), { recursive: true });
        writeFileSync(
          join(expectedDir, file),
          normalize(file, readFileSync(join(dir, file), "utf8")),
        );
      }
    }
    expect(tree(dir)).toEqual(tree(expectedDir));
    for (const file of tree(dir)) {
      expect(normalize(file, readFileSync(join(dir, file), "utf8")), file).toBe(
        readFileSync(join(expectedDir, file), "utf8"),
      );
    }
  });

  it.each(cases)("%s: a second run changes nothing", async (name) => {
    const dir = copyFixture(name);
    await runUpgrade({ cwd: dir, paths: ["src"], to: TO, ...quiet });
    const before = new Map(
      tree(dir).map((f) => [f, readFileSync(join(dir, f), "utf8")]),
    );
    const again = await runUpgrade({
      cwd: dir,
      paths: ["src"],
      from: "0.1.0",
      to: TO,
      ...quiet,
    });
    expect(again.code).toBe(0);
    for (const [file, text] of before) {
      if (file.endsWith(".md")) continue;
      expect(readFileSync(join(dir, file), "utf8"), file).toBe(text);
    }
  });

  it("--dry-run writes nothing and prints the report", async () => {
    const dir = copyFixture("root-barrel");
    const before = new Map(
      tree(dir).map((f) => [f, readFileSync(join(dir, f), "utf8")]),
    );
    const lines: string[] = [];
    const result = await runUpgrade({
      cwd: dir,
      paths: ["src"],
      to: TO,
      dryRun: true,
      log: (l: string) => lines.push(l),
      warn: () => {},
    });
    expect(result.code).toBe(0);
    for (const [file, text] of before)
      expect(readFileSync(join(dir, file), "utf8"), file).toBe(text);
    expect(tree(dir)).toEqual([...before.keys()].sort());
    expect(lines.some((l) => l.includes("~ src/pages/ModelsPage.tsx"))).toBe(true);
    const printed = lines.join("\n");
    expect(printed).toContain("# ui-common upgrade report");
    expect(printed).toContain("dry run: nothing was written");
  });

  it("--dry-run with an explicit --report writes the report there, and only it", async () => {
    const dir = copyFixture("root-barrel");
    const before = tree(dir);
    const result = await runUpgrade({
      cwd: dir,
      paths: ["src"],
      to: TO,
      dryRun: true,
      report: "reports/dry.md",
      ...quiet,
    });
    expect(result.code).toBe(0);
    expect(tree(dir)).toEqual([...before, "reports/dry.md"].sort());
    expect(readFileSync(join(dir, "reports/dry.md"), "utf8")).toContain("dry run");
  });

  describe("points lab's core peer at ui-common's core when it adds lab", () => {
    const own = JSON.parse(readFileSync(join(here, "../../package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    const pin = own.dependencies["@astryxdesign/core"];

    it("npm: an overrides entry in package.json", async () => {
      const dir = copyFixture("adapter");
      writeFileSync(join(dir, "package-lock.json"), "{}\n");
      const result = await runUpgrade({ cwd: dir, paths: ["src"], to: TO, ...quiet });
      expect(result.code, JSON.stringify(result.errors)).toBe(0);
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
      expect(pkg.dependencies["@astryxdesign/lab"]).toBeTruthy();
      expect(pkg.overrides).toEqual({
        "@astryxdesign/lab": { "@astryxdesign/core": pin },
      });
    });

    it("pnpm: an overrides entry in pnpm-workspace.yaml, created when missing", async () => {
      const dir = copyFixture("adapter");
      writeFileSync(join(dir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
      const result = await runUpgrade({ cwd: dir, paths: ["src"], to: TO, ...quiet });
      expect(result.code, JSON.stringify(result.errors)).toBe(0);
      expect(readFileSync(join(dir, "pnpm-workspace.yaml"), "utf8")).toBe(
        `overrides:\n  "@astryxdesign/lab>@astryxdesign/core": "${pin}"\n`,
      );
      expect(
        JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).overrides,
      ).toBeUndefined();
    });

    it("pnpm: the workspace root's pnpm-workspace.yaml, above the project", async () => {
      const workspace = mkdtempSync(join(tmpdir(), "uic-upgrade-ws-"));
      temps.push(workspace);
      writeFileSync(join(workspace, "pnpm-workspace.yaml"), "packages:\n  - app\n");
      cpSync(join(FIXTURES, "adapter", "input"), join(workspace, "app"), {
        recursive: true,
      });
      const dir = join(workspace, "app");
      const result = await runUpgrade({ cwd: dir, paths: ["src"], to: TO, ...quiet });
      expect(result.code, JSON.stringify(result.errors)).toBe(0);
      expect(readFileSync(join(workspace, "pnpm-workspace.yaml"), "utf8")).toBe(
        `packages:\n  - app\n\noverrides:\n  "@astryxdesign/lab>@astryxdesign/core": "${pin}"\n`,
      );
      expect(existsSync(join(dir, "pnpm-workspace.yaml"))).toBe(false);
    });

    it("a dry run shows the edit and writes nothing", async () => {
      const dir = copyFixture("adapter");
      writeFileSync(join(dir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
      const lines: string[] = [];
      await runUpgrade({
        cwd: dir,
        paths: ["src"],
        to: TO,
        dryRun: true,
        diff: true,
        log: (l: string) => lines.push(l),
        warn: () => {},
      });
      expect(existsSync(join(dir, "pnpm-workspace.yaml"))).toBe(false);
      expect(lines.join("\n")).toContain(
        `+  "@astryxdesign/lab>@astryxdesign/core": "${pin}"`,
      );
    });
  });

  describe("never overwrites a file this run did not produce", () => {
    const own = "/* the project's own entry */\n@import './brand.css';\n";

    it.each([
      ["outside the scanned paths", ["src/main.tsx"]],
      ["inside the scanned paths", ["src"]],
    ])("an existing ui-common-entry.css %s", async (_label, paths) => {
      const dir = copyFixture("adapter");
      writeFileSync(join(dir, "src/ui-common-entry.css"), own);
      const result = await runUpgrade({ cwd: dir, paths, to: TO, ...quiet });
      expect(result.code, JSON.stringify(result.errors)).toBe(0);
      expect(readFileSync(join(dir, "src/ui-common-entry.css"), "utf8")).toBe(own);
      // The script imports a fresh entry beside it instead, and the report says so.
      const main = readFileSync(join(dir, "src/main.tsx"), "utf8");
      expect(main).toContain('import "./ui-common-entry-2.css";');
      expect(main).not.toContain('import "./ui-common-entry.css";');
      expect(readFileSync(join(dir, "src/ui-common-entry-2.css"), "utf8")).toContain(
        '@import "@lablup/ui-common/reset.css";',
      );
      expect(readFileSync(join(dir, "ui-common-upgrade-report.md"), "utf8")).toContain(
        "src/ui-common-entry.css exists already",
      );
    });

    it("reuses an existing entry that already holds the 0.2 stylesheet set", async () => {
      const dir = copyFixture("adapter");
      const main = join(dir, "src/main.tsx");
      const original = readFileSync(main, "utf8");
      const first = await runUpgrade({ cwd: dir, paths: [main], to: TO, ...quiet });
      expect(first.code).toBe(0);
      const entry = readFileSync(join(dir, "src/ui-common-entry.css"), "utf8");
      // A second script still importing base.css, beside the first one's entry.
      writeFileSync(main, original);
      const again = await runUpgrade({
        cwd: dir,
        paths: ["src/main.tsx"],
        from: "0.1.0",
        to: TO,
        ...quiet,
      });
      expect(again.code).toBe(0);
      expect(readFileSync(join(dir, "src/main.tsx"), "utf8")).toContain(
        'import "./ui-common-entry.css";',
      );
      expect(readFileSync(join(dir, "src/ui-common-entry.css"), "utf8")).toBe(entry);
      expect(existsSync(join(dir, "src/ui-common-entry-2.css"))).toBe(false);
    });

    it("refuses to overwrite a report path that holds something else", async () => {
      const dir = copyFixture("css-entry");
      writeFileSync(join(dir, "NOTES.md"), "# my notes\n");
      const result = await runUpgrade({
        cwd: dir,
        paths: ["src"],
        to: TO,
        report: "NOTES.md",
        ...quiet,
      });
      expect(result.code).toBe(2);
      expect(readFileSync(join(dir, "NOTES.md"), "utf8")).toBe("# my notes\n");
    });
  });

  it("reads --from from package.json", async () => {
    // css-entry declares "@lablup/ui-common": "0.1.0-alpha.23".
    const dir = copyFixture("css-entry");
    const result = await runUpgrade({ cwd: dir, paths: ["src"], to: TO, ...quiet });
    expect(result.code).toBe(0);
    expect(result.report).toContain("`ui-common upgrade` 0.1.0-alpha.23 → " + TO);
    expect(result.changed?.length).toBeGreaterThan(0);

    // Once package.json declares the target, there is nothing to do.
    const upgraded = mkdtempSync(join(tmpdir(), "uic-upgrade-declared-"));
    temps.push(upgraded);
    cpSync(join(FIXTURES, "css-entry", "input"), upgraded, { recursive: true });
    const pkg = JSON.parse(readFileSync(join(upgraded, "package.json"), "utf8"));
    pkg.dependencies["@lablup/ui-common"] = `^${TO}`;
    writeFileSync(join(upgraded, "package.json"), JSON.stringify(pkg));
    const lines: string[] = [];
    const none = await runUpgrade({
      cwd: upgraded,
      paths: ["src"],
      to: TO,
      log: (l: string) => lines.push(l),
      warn: () => {},
    });
    expect(none.code).toBe(0);
    expect(none.changed).toBeUndefined();
    expect(lines.join("\n")).toContain(`${TO} → ${TO} is not an upgrade`);
  });

  it("refuses a non-upgrade and a --from that is not a version", async () => {
    const dir = copyFixture("css-entry");
    const same = await runUpgrade({
      cwd: dir,
      paths: ["src"],
      from: TO,
      to: TO,
      ...quiet,
    });
    expect(same.code).toBe(0);
    expect(same.changed).toBeUndefined();
    const bad = await runUpgrade({
      cwd: dir,
      paths: ["src"],
      from: "latest",
      to: TO,
      ...quiet,
    });
    expect(bad.code).toBe(2);
  });
});
