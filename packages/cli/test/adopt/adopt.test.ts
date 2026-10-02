/**
 * `ui-common adopt --from astryx` against fixture projects that use Astryx
 * directly: an app (Vite, StyleX, lab, theme-neutral, a local Astryx patch,
 * Storybook, an ASTRYX agent block), a pnpm workspace with a library and an
 * app, and an npm app on lab.
 *
 * Each fixture is copied to a temp dir, adopted, and compared file by file
 * with `expected/` (report and package.json included). Regenerate after an
 * intended change with `UPDATE_FIXTURES=1 pnpm vitest run packages/cli/test/adopt`,
 * then read the diff.
 */
import { spawnSync } from "node:child_process";
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
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import jscodeshift from "jscodeshift";
import { afterEach, describe, expect, it } from "vitest";

import { runAdopt } from "../../cli/adopt.mjs";
import { transformDialogs } from "../../codemods/adopt/dialog.mjs";
import {
  addUiCommonLayer,
  ensureHtmlLayerStatement,
  ensureLayerStatement,
  LAYER_ORDER,
  withUiCommonLayer,
} from "../../codemods/adopt/layers.mjs";
import {
  exportsHas,
  findSpecifiers,
  mapSpecifier,
  rewriteSpecifiers,
} from "../../codemods/adopt/specifiers.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, "fixtures");
const UPDATE = process.env.UPDATE_FIXTURES === "1";
const VERSION = "0.2.0";
const bin = resolve(here, "../../bin/ui-common.mjs");
const exportsMap = JSON.parse(
  readFileSync(resolve(here, "../../../../package.json"), "utf8"),
).exports as Record<string, unknown>;

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

function copyFixture(name: string) {
  const dir = mkdtempSync(join(tmpdir(), `uic-adopt-${name}-`));
  temps.push(dir);
  cpSync(join(FIXTURES, name, "input"), dir, { recursive: true });
  return dir;
}

function snapshot(dir: string) {
  return new Map(tree(dir).map((f) => [f, readFileSync(join(dir, f), "utf8")]));
}

const quiet = { log: () => {}, warn: () => {} };

const cases = readdirSync(FIXTURES).filter((name) =>
  existsSync(join(FIXTURES, name, "input")),
);

describe("ui-common adopt --from astryx", () => {
  it.each(cases)("%s", async (name) => {
    const dir = copyFixture(name);
    const result = await runAdopt({ cwd: dir, version: VERSION, ...quiet });
    expect(result.code, JSON.stringify(result.errors)).toBe(0);

    const expectedDir = join(FIXTURES, name, "expected");
    if (UPDATE) {
      rmSync(expectedDir, { recursive: true, force: true });
      for (const file of tree(dir)) {
        mkdirSync(dirname(join(expectedDir, file)), { recursive: true });
        writeFileSync(join(expectedDir, file), readFileSync(join(dir, file), "utf8"));
      }
    }
    expect(tree(dir)).toEqual(tree(expectedDir));
    for (const file of tree(dir)) {
      expect(readFileSync(join(dir, file), "utf8"), file).toBe(
        readFileSync(join(expectedDir, file), "utf8"),
      );
    }
  });

  it.each(cases)("%s: a second run changes nothing", async (name) => {
    const dir = copyFixture(name);
    await runAdopt({ cwd: dir, version: VERSION, ...quiet });
    const before = snapshot(dir);
    const again = await runAdopt({ cwd: dir, version: VERSION, ...quiet });
    expect(again.code).toBe(0);
    expect(again.changed).toEqual([]);
    for (const [file, text] of before) {
      if (file.endsWith(".md") && file.includes("adopt-report")) continue;
      expect(readFileSync(join(dir, file), "utf8"), file).toBe(text);
    }
  });

  it("--check writes nothing, fails while work is left, and passes after adopting", async () => {
    const dir = copyFixture("workspace");
    const before = snapshot(dir);
    const lines: string[] = [];
    const first = await runAdopt({
      cwd: dir,
      version: VERSION,
      check: true,
      log: () => {},
      warn: (l: string) => lines.push(l),
    });
    expect(first.code).toBe(1);
    expect(snapshot(dir)).toEqual(before);
    expect(lines.join("\n")).toContain("would change packages/web/src/main.tsx");

    await runAdopt({ cwd: dir, version: VERSION, ...quiet });
    const after = await runAdopt({ cwd: dir, version: VERSION, check: true, ...quiet });
    expect(after.code).toBe(0);
  });

  it("--check fails on an Astryx import adopt cannot move", async () => {
    const dir = copyFixture("app");
    await runAdopt({ cwd: dir, version: VERSION, ...quiet });
    const check = await runAdopt({ cwd: dir, version: VERSION, check: true, ...quiet });
    expect(check.code).toBe(1);
    expect(check.changed).toEqual([]);
    expect(check.left?.map((l) => `${l.file}:${l.line}`)).toEqual([
      "src/ConfirmDelete.tsx:2",
    ]);
  });

  it("--dry-run writes nothing and prints the report", async () => {
    const dir = copyFixture("app");
    const before = snapshot(dir);
    const lines: string[] = [];
    const result = await runAdopt({
      cwd: dir,
      version: VERSION,
      dryRun: true,
      log: (l: string) => lines.push(l),
      warn: () => {},
    });
    expect(result.code).toBe(0);
    expect(snapshot(dir)).toEqual(before);
    const printed = lines.join("\n");
    expect(printed).toContain("~ src/App.tsx");
    expect(printed).toContain("# ui-common adopt report");
    expect(printed).toContain("dry run: nothing was written");
  });

  it("leaves a file it did not write as the report alone", async () => {
    const dir = copyFixture("npm-lab");
    writeFileSync(join(dir, "ui-common-adopt-report.md"), "# Notes of mine\n");
    const result = await runAdopt({ cwd: dir, version: VERSION, ...quiet });
    expect(result.code).toBe(2);
    expect(readFileSync(join(dir, "ui-common-adopt-report.md"), "utf8")).toBe(
      "# Notes of mine\n",
    );
  });

  it("raises an Astryx version move as an action, with the codemod command", async () => {
    const dir = copyFixture("npm-lab");
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    pkg.dependencies["@astryxdesign/core"] = "^0.5.4";
    writeFileSync(join(dir, "package.json"), JSON.stringify(pkg, null, 2));
    const result = await runAdopt({ cwd: dir, version: VERSION, ...quiet });
    expect(result.report).toContain("## Action required");
    expect(result.report).toContain("Astryx moves from 0.5.4 to 0.6.2");
    expect(result.report).toContain("ui-common astryx upgrade --from 0.5.4");
  });

  it("--ignore and paths narrow what is rewritten", async () => {
    const dir = copyFixture("app");
    await runAdopt({
      cwd: dir,
      version: VERSION,
      ignore: ["src/legacy.cjs"],
      paths: ["src"],
      ...quiet,
    });
    expect(readFileSync(join(dir, "src/legacy.cjs"), "utf8")).toContain(
      "@astryxdesign/core/Text",
    );
    expect(readFileSync(join(dir, ".storybook/preview.ts"), "utf8")).toContain(
      "@astryxdesign/core",
    );
    expect(readFileSync(join(dir, "src/main.tsx"), "utf8")).not.toContain(
      "@astryxdesign/",
    );
  });

  it("leaves generated files alone and says so", async () => {
    const dir = copyFixture("npm-lab");
    writeFileSync(
      join(dir, "src/built-theme.js"),
      '/**\n * @generated by `astryx theme build`\n */\nimport { defineTheme } from "@astryxdesign/core/theme";\n',
    );
    const result = await runAdopt({ cwd: dir, version: VERSION, ...quiet });
    expect(readFileSync(join(dir, "src/built-theme.js"), "utf8")).toContain(
      "@astryxdesign/core/theme",
    );
    expect(result.report).toContain("generated file");
  });
});

describe("the command line", { timeout: 60_000 }, () => {
  const run = (args: string[], cwd: string) => {
    const r = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8" });
    return { code: r.status, stdout: r.stdout, stderr: r.stderr };
  };

  it("needs --from astryx", () => {
    const dir = copyFixture("npm-lab");
    expect(run(["adopt"], dir).code).toBe(2);
    expect(run(["adopt", "--from", "0.1"], dir).code).toBe(2);
    expect(run(["adopt", "--from", "astryx", "--check", "--dry-run"], dir).code).toBe(
      2,
    );
    expect(run(["adopt", "--bogus"], dir).code).toBe(2);
  });

  it("`upgrade --from astryx` is adopt", () => {
    const dir = copyFixture("npm-lab");
    const check = run(["upgrade", "--from", "astryx", "--check"], dir);
    expect(check.code).toBe(1);
    expect(check.stderr).toContain("ui-common adopt --check");
    expect(run(["upgrade", "--from=astryx"], dir).code).toBe(0);
    expect(run(["adopt", "--from", "astryx", "--check"], dir).code).toBe(0);
  });
});

describe("specifiers", () => {
  it("maps every kind of Astryx specifier onto ui-common's mirror", () => {
    const to = (spec: string) => {
      const m = mapSpecifier(spec, exportsMap);
      return m && "to" in m ? m.to : m && "left" in m ? "LEFT" : null;
    };
    expect(to("@astryxdesign/core")).toBe("@lablup/ui-common");
    expect(to("@astryxdesign/core/Button")).toBe("@lablup/ui-common/Button");
    expect(to("@astryxdesign/core/Table/utils")).toBe("@lablup/ui-common/Table/utils");
    expect(to("@astryxdesign/core/reset.css")).toBe("@lablup/ui-common/reset.css");
    expect(to("@astryxdesign/core/astryx.css")).toBe("@lablup/ui-common/astryx.css");
    expect(to("@astryxdesign/core/theme/tokens.stylex")).toBe(
      "@lablup/ui-common/theme/tokens.stylex",
    );
    expect(to("@astryxdesign/core/locales/ko-KR.json")).toBe(
      "@lablup/ui-common/locales/ko-KR.json",
    );
    expect(to("@astryxdesign/lab")).toBe("@lablup/ui-common/lab");
    expect(to("@astryxdesign/lab/lab.css")).toBe("@lablup/ui-common/lab/lab.css");
    expect(to("@astryxdesign/theme-neutral")).toBe("@lablup/ui-common/theme/neutral");
    expect(to("@astryxdesign/theme-neutral/built")).toBe(
      "@lablup/ui-common/theme/neutral/built",
    );
    expect(to("@astryxdesign/theme-neutral/theme.css")).toBe(
      "@lablup/ui-common/theme/neutral/theme.css",
    );
    expect(to("@astryxdesign/core/Dialog")).toBe("LEFT");
    expect(to("@astryxdesign/core/AlertDialog")).toBe("LEFT");
    expect(to("@astryxdesign/core/docs.mjs")).toBe("LEFT");
    expect(to("@astryxdesign/core/package.json")).toBe("LEFT");
    expect(to("@astryxdesign/core/NoSuchThing")).toBe("LEFT");
    expect(to("@astryxdesign/cli/authoring")).toBeNull();
    expect(exportsHas({ "./locales/*.json": "" }, "./locales/a/b.json")).toBe(false);
  });

  it("touches module positions only", () => {
    const source = [
      `import { Button } from '@astryxdesign/core';`,
      `import "@astryxdesign/core/astryx.css";`,
      `export * from "@astryxdesign/core/Text";`,
      `const lazy = () => import( '@astryxdesign/core/Table' );`,
      `type T = typeof import("@astryxdesign/core/Toast");`,
      `const r = require("@astryxdesign/lab");`,
      `const u = import.meta.resolve("@astryxdesign/core/astryx.css");`,
      `vi.mock("@astryxdesign/core/Toast");`,
      `jest.requireActual<typeof import("@astryxdesign/core/Badge")>("@astryxdesign/core/Badge");`,
      `const names = ["@astryxdesign/core", '@astryxdesign/lab'];`,
      `declare module "@astryxdesign/core/Text" {}`,
      `import { parseDoc } from "@astryxdesign/cli/authoring";`,
      "// `@astryxdesign/core/src/Banner.tsx` in prose",
    ].join("\n");
    const out = rewriteSpecifiers(source, "script", exportsMap).text.split("\n");
    expect(out[0]).toBe(`import { Button } from '@lablup/ui-common';`);
    expect(out[1]).toBe(`import "@lablup/ui-common/astryx.css";`);
    expect(out[2]).toBe(`export * from "@lablup/ui-common/Text";`);
    expect(out[3]).toBe(`const lazy = () => import( '@lablup/ui-common/Table' );`);
    expect(out[4]).toBe(`type T = typeof import("@lablup/ui-common/Toast");`);
    expect(out[5]).toBe(`const r = require("@lablup/ui-common/lab");`);
    expect(out[6]).toBe(
      `const u = import.meta.resolve("@lablup/ui-common/astryx.css");`,
    );
    expect(out[7]).toBe(`vi.mock("@lablup/ui-common/Toast");`);
    expect(out[8]).toBe(
      `jest.requireActual<typeof import("@lablup/ui-common/Badge")>("@lablup/ui-common/Badge");`,
    );
    expect(out.slice(9)).toEqual(source.split("\n").slice(9));
    expect(findSpecifiers(source, "script")).toHaveLength(11);
  });

  it("rewrites stylesheet imports, quoted or in url()", () => {
    const css = `@import "@astryxdesign/core/reset.css";\n@import url(@astryxdesign/lab/lab.css) layer(astryx-base);\n@use '@astryxdesign/theme-neutral/theme.css';\n`;
    expect(rewriteSpecifiers(css, "style", exportsMap).text).toBe(
      `@import "@lablup/ui-common/reset.css";\n@import url(@lablup/ui-common/lab/lab.css) layer(astryx-base);\n@use '@lablup/ui-common/theme/neutral/theme.css';\n`,
    );
  });
});

describe("the layer-order statement", () => {
  it("adds ui-common after astryx-theme, and nowhere else", () => {
    expect(
      withUiCommonLayer(["reset", "astryx-base", "astryx-theme", "components"]),
    ).toEqual(["reset", "astryx-base", "astryx-theme", "ui-common", "components"]);
    expect(withUiCommonLayer(["astryx-base", "app"])).toEqual([
      "astryx-base",
      "ui-common",
      "app",
    ]);
    expect(withUiCommonLayer(["a", "b"])).toBeNull();
    expect(withUiCommonLayer(["astryx-theme", "ui-common"])).toBeNull();
    const text =
      "/* @layer a, astryx-theme; */\n@layer base, astryx-theme;\n@layer x, y;\n";
    expect(addUiCommonLayer(text).text).toBe(
      "/* @layer a, astryx-theme; */\n@layer base, astryx-theme, ui-common;\n@layer x, y;\n",
    );
  });

  it("puts a statement first where Astryx's sheets load without one", () => {
    expect(
      ensureLayerStatement('@import "@lablup/ui-common/astryx.css";\n', "a.css"),
    ).toBe(`${LAYER_ORDER}\n\n@import "@lablup/ui-common/astryx.css";\n`);
    expect(
      ensureLayerStatement(
        `${LAYER_ORDER}\n@import "@lablup/ui-common/astryx.css";\n`,
        "a.css",
      ),
    ).toBeNull();
    expect(ensureLayerStatement("a { color: red }\n", "a.css")).toBeNull();
    expect(
      ensureLayerStatement(
        '@use "sass:math";\n@import "@lablup/ui-common/reset.css";\n',
        "a.scss",
      ),
    ).toBe(
      `@use "sass:math";\n\n${LAYER_ORDER}\n\n@import "@lablup/ui-common/reset.css";\n`,
    );
  });

  it("gives index.html the statement as its first <style>", () => {
    const html =
      '<html>\n  <head>\n    <meta charset="utf-8" />\n    <link rel="stylesheet" href="/a.css" />\n  </head>\n  <body><script type="module" src="/m.ts"></script></body>\n</html>\n';
    const out = ensureHtmlLayerStatement(html);
    expect(out).toContain(
      `<meta charset="utf-8" />\n    <style>${LAYER_ORDER}</style>\n    <link`,
    );
    expect(ensureHtmlLayerStatement(out ?? "")).toBeNull();
    expect(
      ensureHtmlLayerStatement("<html><head></head><body></body></html>"),
    ).toBeNull();
  });
});

describe("Dialog → Modal", () => {
  const j = jscodeshift.withParser("tsx");
  const run = (source: string) => transformDialogs({ source, path: "x.tsx" }, j);

  it("splits names with no ui-common counterpart off a root import", () => {
    const out = run(
      `import { Button, useImperativeDialog, AlertDialog } from "@astryxdesign/core";\n<AlertDialog />;\n`,
    );
    expect(out.text).toContain(
      `import { Button, AlertModal } from "@astryxdesign/core";`,
    );
    expect(out.text).toContain(
      `import { useImperativeDialog } from "@astryxdesign/core/Dialog";`,
    );
    expect(out.text).toContain("<AlertModal />");
  });

  it("keeps a module's own names: shadowed locals, properties, its re-exports", () => {
    const out = run(
      [
        `import { Dialog } from "@astryxdesign/core/Dialog";`,
        `const ui = { Dialog, other: theme.Dialog };`,
        `function f(Dialog: string) { return Dialog; }`,
        `export { Dialog };`,
        `<Dialog.Header />;`,
      ].join("\n"),
    );
    expect(out.text).toContain(`import { Modal } from "@lablup/ui-common/Modal";`);
    expect(out.text).toContain("const ui = { Dialog: Modal, other: theme.Dialog };");
    expect(out.text).toContain("function f(Dialog: string) { return Dialog; }");
    expect(out.text).toContain("export { Modal as Dialog };");
    expect(out.text).toContain("<Modal.Header />;");
  });

  it("leaves a module without Dialog imports alone", () => {
    expect(
      run(`import { Button } from "@astryxdesign/core";\nconst Dialog = 1;\n`).text,
    ).toBeNull();
    expect(run(`import { Modal } from "@lablup/ui-common/Modal";\n`).text).toBeNull();
  });
});
