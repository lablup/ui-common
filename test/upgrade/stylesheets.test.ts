/**
 * The base.css rewrite in stylesheets, checked by compiling the output: Sass
 * rejects a rule placed above `@use`, and CSS ignores a `@layer` statement
 * placed above `@charset`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { compileString } from "sass";
import { describe, expect, it } from "vitest";

import { transformStylesheet } from "../../codemods/0.2/stylesheets.mjs";

const ctx = { flags: { packages: new Map() } };
const LAYER =
  "@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;";

function rewrite(path: string, source: string) {
  const out = transformStylesheet({ path, source }, undefined, ctx);
  if (out == null) throw new Error("the codemod left the file alone");
  return out as string;
}

/** `@lablup/ui-common/*.css` imports compile to plain CSS imports. */
const compile = (scss: string) => compileString(scss, { syntax: "scss" }).css;

describe("stylesheet entry rewrite", () => {
  it("puts the layer order after the leading @use and @forward rules in SCSS", () => {
    const out = rewrite(
      "src/index.scss",
      `// theme entry
@use "sass:math";
@forward "sass:color";
$pad: 2px;
@import "@lablup/ui-common/styles/base.css";

.a { width: math.div(10px, 2); padding: $pad; }
`,
    );
    expect(out.startsWith('// theme entry\n@use "sass:math";')).toBe(true);
    expect(out.indexOf(LAYER)).toBeGreaterThan(out.indexOf('@forward "sass:color";'));
    expect(out.indexOf(LAYER)).toBeLessThan(
      out.indexOf('@import "@lablup/ui-common/reset.css";'),
    );
    const css = compile(out);
    expect(css).toContain(LAYER.replace(/;$/, ""));
    expect(css).toContain("width: 5px");
    expect(css).toContain("padding: 2px");
  });

  it("treats a multi-line `@use … with (…)` as one rule", () => {
    const out = rewrite(
      "src/index.scss",
      `@use "./tokens" as t with (
  $radius: 4px,
  $gap: 8px
);
@import "@lablup/ui-common/styles/base.css";
`,
    );
    expect(out).toContain(`  $gap: 8px\n);\n\n${LAYER}\n`);
  });

  it("keeps the layer order first in SCSS with no module rules", () => {
    const out = rewrite(
      "src/index.scss",
      `@import "@lablup/ui-common/styles/base.css";\n.c { color: red; }\n`,
    );
    expect(out.startsWith(LAYER)).toBe(true);
    expect(compile(out)).toContain("color: red");
  });

  it("leaves the adapter fixture's SCSS entry compiling", () => {
    const expected = join(
      dirname(fileURLToPath(import.meta.url)),
      "fixtures/adapter/expected/src/index.scss",
    );
    expect(compile(readFileSync(expected, "utf8"))).toContain("margin: 4px");
  });

  it("keeps @charset first in CSS", () => {
    const out = rewrite(
      "src/index.css",
      `@charset "utf-8";\n@import "@lablup/ui-common/styles/base.css";\n.d { color: red; }\n`,
    );
    expect(out.startsWith(`@charset "utf-8";\n${LAYER}`)).toBe(true);
  });
});
