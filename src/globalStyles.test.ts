/**
 * Guards for the two package-level stylesheets.
 *
 * `legacy-tokens.css` is the deprecated bridge from the 0.1 `--token-*`
 * contract to Astryx's tokens. Its whole job is that no old name stops
 * resolving, so it has to declare every one of the 122 names `styles/base.css`
 * declares, and each value has to point at something that exists.
 *
 * `ui-common.css` is ui-common's global sheet. It reads Astryx tokens only.
 *
 * Both keep every rule inside `@layer ui-common`, so a consumer's unlayered
 * rules and its later layers still win.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = __dirname;
const ROOT = join(SRC, "..");

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

const BASE_NAMES = new Set(
  [
    ...readFileSync(join(SRC, "styles", "base.css"), "utf8").matchAll(
      /(--token-[A-Za-z0-9]+)\s*:/g,
    ),
  ].map((m) => m[1] ?? ""),
);

/** Every token Astryx declares, read from core's compiled token module. */
const ASTRYX_TOKENS = new Set(
  [
    ...readFileSync(
      join(ROOT, "node_modules/@astryxdesign/core/dist/theme/tokens.stylex.js"),
      "utf8",
    ).matchAll(/"(--[a-z0-9-]+)":/g),
  ].map((m) => m[1] ?? ""),
);

/** Tokens a ui-common theme declares that Astryx does not. */
const UI_COMMON_TOKENS = new Set(["--uic-color-info"]);

/** The body of the single `@layer ui-common { ... }` block, or a failure. */
function layerBody(source: string): string {
  const css = withoutComments(source).trim();
  const match = css.match(/^@layer ui-common\s*\{([\s\S]*)\}$/);
  if (!match?.[1]) throw new Error("expected the whole sheet inside @layer ui-common");
  return match[1];
}

function referencedVars(source: string): string[] {
  return [...withoutComments(source).matchAll(/var\(\s*(--[A-Za-z0-9-]+)/g)].map(
    (m) => m[1] ?? "",
  );
}

describe("legacy-tokens.css", () => {
  const source = readFileSync(join(SRC, "legacy-tokens.css"), "utf8");
  const body = layerBody(source);
  const declared = new Set(
    [...body.matchAll(/(--token-[A-Za-z0-9]+)\s*:/g)].map((m) => m[1] ?? ""),
  );

  it("the 0.1 contract it bridges has 122 names", () => {
    expect(BASE_NAMES.size).toBe(122);
  });

  it("declares every 0.1 name, and nothing else", () => {
    expect([...BASE_NAMES].filter((n) => !declared.has(n))).toEqual([]);
    expect([...declared].filter((n) => !BASE_NAMES.has(n))).toEqual([]);
  });

  it("declares them at :root inside @layer ui-common", () => {
    expect(body.trim()).toMatch(/^:root\s*\{[^{}]*\}$/);
  });

  it("every var() names an Astryx token or another legacy name", () => {
    const unknown = referencedVars(source).filter(
      (name) =>
        !ASTRYX_TOKENS.has(name) && !UI_COMMON_TOKENS.has(name) && !declared.has(name),
    );
    expect(unknown).toEqual([]);
  });

  it("points most names at Astryx rather than restating literals", () => {
    const mapped = [...body.matchAll(/--token-[A-Za-z0-9]+\s*:\s*([^;]+);/g)].filter(
      (m) => /var\(--(?!token-)/.test(m[1] ?? ""),
    );
    expect(mapped.length).toBeGreaterThan(60);
  });
});

describe("ui-common.css", () => {
  const source = readFileSync(join(SRC, "ui-common.css"), "utf8");

  it("keeps every rule inside @layer ui-common", () => {
    expect(() => layerBody(source)).not.toThrow();
  });

  it("reads Astryx tokens only", () => {
    expect(referencedVars(source).filter((name) => !ASTRYX_TOKENS.has(name))).toEqual(
      [],
    );
  });
});
