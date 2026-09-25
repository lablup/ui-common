/**
 * Rules for every ui-common component stylesheet (CONTRIBUTING, "Styling").
 *
 * - The whole sheet sits inside `@layer ui-common`, so Astryx's layers lose
 *   to it and the app's `components` layer and unlayered rules beat it.
 * - Every class selector is a `uic-` BEM name. Astryx's own classes are
 *   not restyled from here.
 * - Every `var()` names an Astryx token or a `--uic-` property of ui-common's
 *   own. No 0.1 `--token-*` name, and no colour literal: a colour comes from
 *   the theme.
 * - No focus styling. Astryx primitives draw focus; a second indicator here
 *   is the shape of the 0.1 contrast defect (issue #7).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS_DIR = __dirname;
const ROOT = join(COMPONENTS_DIR, "..", "..");

const ASTRYX_TOKENS = new Set(
  [
    ...readFileSync(
      join(ROOT, "node_modules/@astryxdesign/core/dist/theme/tokens.stylex.js"),
      "utf8",
    ).matchAll(/"(--[a-z0-9-]+)":/g),
  ].map((m) => m[1] ?? ""),
);

function cssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...cssFiles(path));
    else if (entry.name.endsWith(".css")) out.push(path);
  }
  return out.sort();
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

const FILES = cssFiles(COMPONENTS_DIR).map((path) => ({
  name: relative(COMPONENTS_DIR, path),
  css: withoutComments(readFileSync(path, "utf8")),
}));

describe("component stylesheets", () => {
  it("finds them", () => {
    expect(FILES.length).toBeGreaterThan(10);
  });

  it.each(FILES)("$name sits wholly inside @layer ui-common", ({ css }) => {
    expect(css.trim()).toMatch(/^@layer ui-common\s*\{[\s\S]*\}$/);
    expect(css.match(/@layer\b/g)).toHaveLength(1);
  });

  it.each(FILES)("$name uses uic- BEM class names only", ({ css }) => {
    const classes = [...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1] ?? "");
    const foreign = classes.filter((c) => !c.startsWith("uic-"));
    expect(foreign).toEqual([]);
  });

  it.each(FILES)("$name reads Astryx tokens and --uic- properties only", ({ css }) => {
    const names = [...css.matchAll(/var\(\s*(--[A-Za-z0-9-]+)/g)].map(
      (m) => m[1] ?? "",
    );
    const unknown = names.filter(
      (n) => !ASTRYX_TOKENS.has(n) && !n.startsWith("--uic-"),
    );
    expect(unknown).toEqual([]);
  });

  it.each(FILES)("$name declares no colour literal", ({ css }) => {
    const literals = [
      ...css.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab)\(/g),
    ].map((m) => m[0]);
    expect(literals).toEqual([]);
  });

  it.each(FILES)("$name leaves focus to Astryx", ({ css }) => {
    expect(css).not.toMatch(/:focus/);
    expect(css).not.toMatch(/\boutline\s*:/);
  });
});

describe("StatCard value sizing", () => {
  const css = FILES.find((f) => f.name === join("StatCard", "StatCard.css"))?.css ?? "";

  /** The declarations of one rule, by exact selector. */
  function ruleBody(selector: string): string {
    const match = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      (m) => (m[1] ?? "").trim() === selector,
    );
    if (match === undefined) throw new Error(`no rule for "${selector}"`);
    return match[2] ?? "";
  }

  // A stat value is a numeric display. Sizing it from a heading token hands
  // the number to the consumer's heading ladder, a decision about prose.
  it("sizes the value from the font-size ladder, not a heading token", () => {
    const body = ruleBody(".uic-stat-card__value");
    expect(body).toMatch(/font-size:\s*var\(--font-size-2xl\)/);
    expect(body).not.toMatch(/--text-heading/);
  });
});
