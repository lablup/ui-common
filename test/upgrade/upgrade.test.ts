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

  it("--dry-run writes only the report", async () => {
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
    expect(tree(dir)).toEqual([...before.keys(), "ui-common-upgrade-report.md"].sort());
    expect(lines.some((l) => l.includes("~ src/pages/ModelsPage.tsx"))).toBe(true);
    expect(readFileSync(join(dir, "ui-common-upgrade-report.md"), "utf8")).toContain(
      "dry run",
    );
  });

  it("reads --from from package.json and refuses a non-upgrade", async () => {
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
