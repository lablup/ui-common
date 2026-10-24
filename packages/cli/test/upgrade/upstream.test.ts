/**
 * Astryx's own codemods run through `ui-common upgrade` (codemods/upstream.mjs):
 * a stylesheet an Astryx codemod lists reaches its postcss path and comes
 * back as CSS, so the driver must not re-parse that output as a script (#67).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import jscodeshift from "jscodeshift";
import { afterEach, describe, expect, it } from "vitest";

import { swapModuleSpecifiers, toAstryxSpecifiers } from "../../codemods/upstream.mjs";
import { checkOutput, runUpgrade } from "../../cli/upgrade.mjs";

const temps: string[] = [];
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const quiet = { log: () => {}, warn: () => {} };

/** A consumer on 0.2.0-alpha.18 with an entry stylesheet and one component. */
function consumer(css: string) {
  const dir = mkdtempSync(join(tmpdir(), "uic-upstream-"));
  temps.push(dir);
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify(
      {
        name: "consumer",
        private: true,
        dependencies: { "@lablup/ui-common": "0.2.0-alpha.18", react: "^19.2.0" },
        devDependencies: { "@lablup/ui-common-cli": "0.2.0-alpha.18" },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(join(dir, "src", "index.css"), css);
  writeFileSync(
    join(dir, "src", "App.tsx"),
    'import { Button } from "@lablup/ui-common";\n\nexport const App = () => <Button label="Go" />;\n',
  );
  return dir;
}

// The 0.2.0-alpha.19 step carries Astryx 0.7.0's codemods; among them
// migrate-deprecated-theme-surface, which lists `.css` and rewrites a
// stylesheet through postcss.
const FROM = "0.2.0-alpha.18";
const TO = "0.2.0-alpha.19";

describe("Astryx codemods over a stylesheet", () => {
  it("applies the postcss output of an Astryx codemod to a .css file", async () => {
    const dir = consumer(
      [
        "/* entry stylesheet */",
        "@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;",
        '@import "@lablup/ui-common/reset.css";',
        '@import "@lablup/ui-common/astryx.css";',
        "",
        ".astryx-button.primary.sm:hover { color: red; }",
        ".astryx-heading.level-2 { margin: 0; }",
        "",
      ].join("\n"),
    );
    const result = await runUpgrade({
      cwd: dir,
      paths: ["src"],
      from: FROM,
      to: TO,
      ...quiet,
    });
    expect(result.errors).toEqual([]);
    expect(result.code).toBe(0);
    const css = readFileSync(join(dir, "src", "index.css"), "utf8");
    expect(css).toContain(
      '.astryx-button:is([data-variant="primary"]):is([data-size="sm"]):hover { color: red; }',
    );
    expect(css).toContain('.astryx-heading:is([data-level="2"]) { margin: 0; }');
    // The @layer statement is a CSS at-rule, not a decorator.
    expect(css).toContain(
      "@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;",
    );
    // Specifiers were swapped to Astryx's for the codemod and swapped back.
    expect(css).toContain('@import "@lablup/ui-common/reset.css";');
    expect(css).not.toContain("@astryxdesign");
    const changed = result.changed.find((c) => c.file === "src/index.css");
    expect(changed?.transforms).toEqual(["astryx:migrate-deprecated-theme-surface"]);
  });

  it("leaves a stylesheet the codemod has nothing to do in alone", async () => {
    const dir = consumer(
      '@import "@lablup/ui-common/reset.css";\n\n.app { padding: 0; }\n',
    );
    const result = await runUpgrade({
      cwd: dir,
      paths: ["src"],
      from: FROM,
      to: TO,
      ...quiet,
    });
    expect(result.errors).toEqual([]);
    expect(result.changed.map((c) => c.file)).not.toContain("src/index.css");
  });
});

describe("checkOutput", () => {
  const j = jscodeshift.withParser("tsx");

  it("re-parses a script's output as a script", () => {
    expect(checkOutput("src/A.tsx", "export const a = 1;\n", j)).toBeNull();
    expect(checkOutput("src/A.tsx", "export const = ;\n", j)).toMatch(
      /^produced unparseable output, not applied: /,
    );
  });

  it("parses a .css output with postcss, not as a script", () => {
    const css = "@layer base;\n.a { color: red; }\n";
    expect(
      checkOutput("src/index.css", css, jscodeshift.withParser("babel")),
    ).toBeNull();
    expect(checkOutput("src/index.css", ".a { color: red;\n", j)).toMatch(
      /^produced unparseable output, not applied: /,
    );
  });

  it("accepts Sass and Less as written: nothing here parses them", () => {
    expect(checkOutput("src/a.scss", "@use 'x';\n.a { .b { c: d } }\n", j)).toBeNull();
    expect(checkOutput("src/a.less", ".a { .b(); }\n", j)).toBeNull();
  });
});

describe("swapModuleSpecifiers", () => {
  const j = jscodeshift.withParser("babel");

  it("swaps a stylesheet as a whole, by its extension", () => {
    // Parses as a script (an expression statement and a labelled block), so
    // the parse attempt alone would swap nothing in it.
    const css = 'body { margin: 0 }\n/* @import "@lablup/ui-common/reset.css" */\n';
    expect(swapModuleSpecifiers(j, css, toAstryxSpecifiers, "src/index.css")).toBe(
      'body { margin: 0 }\n/* @import "@astryxdesign/core/reset.css" */\n',
    );
  });

  it("swaps only the module specifiers of a script", () => {
    const source =
      'import { Button } from "@lablup/ui-common/Button";\nconst note = "@lablup/ui-common";\n';
    expect(swapModuleSpecifiers(j, source, toAstryxSpecifiers, "src/A.tsx")).toBe(
      'import { Button } from "@astryxdesign/core/Button";\nconst note = "@lablup/ui-common";\n',
    );
  });
});
