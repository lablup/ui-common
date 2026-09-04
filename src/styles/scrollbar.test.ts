/**
 * Scrollbar sizing guard.
 *
 * `styles/base.css` sizes the scrollbar from `--token-scrollbarSize` so one
 * value serves every palette. Nothing else in `pnpm verify` reads a selector,
 * so a theme family or a component can declare
 * `[data-theme="x"] ::-webkit-scrollbar { width: 17px }` and win everywhere:
 * that selector outranks the global rule on specificity, which means the
 * global rule cannot correct it and the literal has to be removed instead.
 * The source product shipped exactly that, and paid for it on a 200px sidebar
 * rail where the bar took 8.5% of the width.
 *
 * The rule these tests enforce is not "no width in a scrollbar rule". Hiding a
 * bar is legitimate (`Tabs.css` does it with `display: none`), and so is
 * scoping the shared size to one surface. What is not legitimate is a second
 * source of truth for the size, so a `width` or `height` here has to resolve
 * through `--token-scrollbarSize`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const STYLES_DIR = __dirname;
const THEMES_DIR = join(STYLES_DIR, "themes");
const COMPONENTS_DIR = join(STYLES_DIR, "..", "components");
const BASE_CSS = readFileSync(join(STYLES_DIR, "base.css"), "utf8");

/** Comments blanked out, so prose about a `width` is not read as one. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "));
}

/** Declarations of every rule whose selector ends at `::-webkit-scrollbar`. */
function scrollbarBoxRules(source: string): string[] {
  return [...withoutComments(source).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((match) =>
      (match[1] ?? "")
        .split(",")
        .some((part) => /::-webkit-scrollbar\s*$/.test(part.trim())),
    )
    .map((match) => match[2] ?? "");
}

/** A `width`/`height` that does not resolve through the shared size token. */
function unsharedSizes(block: string): string[] {
  const out: string[] = [];
  for (const declaration of block.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    if (property !== "width" && property !== "height") continue;
    const value = declaration.slice(colon + 1);
    if (!value.includes("--token-scrollbarSize")) out.push(declaration.trim());
  }
  return out;
}

function cssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...cssFiles(path));
    else if (entry.name.endsWith(".css")) out.push(path);
  }
  return out;
}

const THEME_FILES = readdirSync(THEMES_DIR)
  .filter((name) => name.endsWith(".css"))
  .sort();

describe("scrollbar sizing", () => {
  it("declares the size tokens in base.css", () => {
    expect(BASE_CSS).toMatch(/--token-scrollbarSize:\s*0\.5rem/);
    expect(BASE_CSS).toMatch(/--token-scrollbarRadius:\s*0\.25rem/);
  });

  it("sizes the global scrollbar from the shared token", () => {
    const blocks = scrollbarBoxRules(BASE_CSS);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatch(/width:\s*var\(--token-scrollbarSize/);
    expect(blocks[0]).toMatch(/height:\s*var\(--token-scrollbarSize/);
  });

  // Firefox has no ::-webkit pseudo-elements, so without these it shows the OS
  // default bar in every palette no matter what the rules above say.
  it("themes the Firefox scrollbar at the root", () => {
    expect(BASE_CSS).toMatch(/scrollbar-width:\s*thin/);
    expect(BASE_CSS).toMatch(/scrollbar-color:\s*var\(--token-colorBorder/);
  });

  it("finds the theme stylesheets", () => {
    expect(THEME_FILES.length).toBeGreaterThan(0);
  });

  it.each(THEME_FILES)("themes/%s never resizes the scrollbar", (name) => {
    const offenders = scrollbarBoxRules(
      readFileSync(join(THEMES_DIR, name), "utf8"),
    ).flatMap(unsharedSizes);
    expect(
      offenders,
      `themes/${name} sizes the scrollbar itself. A theme selector outranks the ` +
        `global rule, so this cannot be corrected from base.css; size it from ` +
        `var(--token-scrollbarSize) or drop the declaration`,
    ).toEqual([]);
  });

  it("no component stylesheet resizes the scrollbar", () => {
    const offenders: string[] = [];
    for (const file of cssFiles(COMPONENTS_DIR)) {
      for (const block of scrollbarBoxRules(readFileSync(file, "utf8"))) {
        for (const declaration of unsharedSizes(block)) {
          offenders.push(`${file}: ${declaration}`);
        }
      }
    }
    expect(
      offenders,
      "a component may hide its bar or scope the shared size, but a second " +
        "literal size is a second source of truth",
    ).toEqual([]);
  });
});
