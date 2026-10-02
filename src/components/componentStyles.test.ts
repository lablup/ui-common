/**
 * Rules for every ui-common component stylesheet (CONTRIBUTING, "Styling").
 *
 * - The whole sheet sits inside `@layer ui-common`, so Astryx's layers lose
 *   to it and the app's `components` layer and unlayered rules beat it.
 * - Every class selector is a `uic-` BEM name. Astryx's own classes are
 *   not restyled from here.
 * - Every `var()` names an Astryx token, a theme token Astryx lacks (read
 *   with a fallback), or a knob of the component, `--<component>-<property>`.
 *   No 0.1 `--token-*` name, and no colour literal: a colour comes from the
 *   theme.
 * - No knob collides with a custom property Astryx core, lab or the neutral
 *   theme declares or reads, or with a WebUI name.
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

/**
 * Theme tokens Astryx has no token for, in Astryx's naming. The Backend.AI
 * WebUI theme declares all three (`--color-info` the Lablup theme too); a
 * component reads them only with an Astryx fallback.
 */
const THEME_EXTENSION_TOKENS = new Set([
  "--color-info",
  "--color-text-description",
  "--color-warning-border-hover",
]);

/** Every custom property Astryx core, lab or the neutral theme declares or reads. */
const ASTRYX_NAMES = new Set(
  [
    "node_modules/@astryxdesign/core/dist/astryx.css",
    "node_modules/@astryxdesign/lab/dist/lab.css",
    "node_modules/@astryxdesign/theme-neutral/dist/theme.css",
    "node_modules/@astryxdesign/core/dist/theme/tokens.stylex.js",
  ].flatMap((file) =>
    [...readFileSync(join(ROOT, file), "utf8").matchAll(/(--[A-Za-z_][\w-]*)/g)].map(
      (m) => m[1] ?? "",
    ),
  ),
);

/**
 * Astryx component variables a ui-common sheet sets on purpose, to tune the
 * Astryx primitive it wraps. Any other Astryx name here is a collision.
 */
const ASTRYX_VARIABLES_SET = new Set([
  "--container-padding-block-start",
  "--container-padding-block-end",
]);

/** `UnitGrid` -> `unit-grid`. */
const kebab = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

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

  it.each(FILES)(
    "$name reads Astryx tokens, theme tokens and its own knobs only",
    ({ name, css }) => {
      const own = `--${kebab(name.split(/[\\/]/)[0] ?? "")}-`;
      const names = [...css.matchAll(/var\(\s*(--[A-Za-z0-9-]+)/g)].map(
        (m) => m[1] ?? "",
      );
      const unknown = names.filter(
        (n) =>
          !ASTRYX_TOKENS.has(n) && !THEME_EXTENSION_TOKENS.has(n) && !n.startsWith(own),
      );
      expect(unknown).toEqual([]);
    },
  );

  it.each(FILES)(
    "$name reads a theme token Astryx lacks only with a fallback",
    ({ css }) => {
      const bare = [...css.matchAll(/var\(\s*(--[A-Za-z0-9-]+)\s*\)/g)]
        .map((m) => m[1] ?? "")
        .filter((n) => THEME_EXTENSION_TOKENS.has(n));
      expect(bare).toEqual([]);
    },
  );

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

describe("component custom properties", () => {
  /** Every custom property a component sheet or module names, by component. */
  const knobs = new Map<string, string>();
  function collect(dir: string, component: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        collect(path, component);
        continue;
      }
      if (
        !/\.(css|tsx?)$/.test(entry.name) ||
        /\.(test|stories)\.tsx?$/.test(entry.name)
      ) {
        continue;
      }
      const source = withoutComments(readFileSync(path, "utf8"));
      for (const m of source.matchAll(
        /(?<![\w-])(--[a-z][a-z0-9-]*[a-z0-9])(?![\w-])/g,
      )) {
        const n = m[1] ?? "";
        if (ASTRYX_TOKENS.has(n) || THEME_EXTENSION_TOKENS.has(n)) continue;
        if (ASTRYX_VARIABLES_SET.has(n)) continue;
        knobs.set(n, component);
      }
    }
  }
  for (const entry of readdirSync(COMPONENTS_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) collect(join(COMPONENTS_DIR, entry.name), entry.name);
  }
  const all = [...knobs.entries()].map(([n, component]) => ({ n, component }));

  it("finds them", () => {
    expect(all.map((k) => k.n)).toEqual(
      expect.arrayContaining([
        "--modal-z",
        "--data-grid-max-height",
        "--digit-pop-in-index",
      ]),
    );
  });

  it.each(all)(
    "$n is named --<component>-<property> after $component",
    ({ n, component }) => {
      expect(n.startsWith(`--${kebab(component)}-`)).toBe(true);
    },
  );

  it.each(all)("$n collides with no Astryx or WebUI name", ({ n }) => {
    expect(ASTRYX_NAMES.has(n)).toBe(false);
    expect(n).not.toMatch(
      /^--(uic|bai|token|astryx|color|spacing|radius|font|text|x)-/,
    );
  });

  it("the collision check sees Astryx's component variables", () => {
    for (const n of [
      "--dialog-dir-x",
      "--table-sticky-background",
      "--spinner-color",
    ]) {
      expect(ASTRYX_NAMES.has(n)).toBe(true);
    }
  });
});
