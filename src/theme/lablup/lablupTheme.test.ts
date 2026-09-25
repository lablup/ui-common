/**
 * Lablup brand theme guards.
 *
 * The brand values have one source: `lablupTheme.ts`. The built artifacts are
 * compiled from it (`pnpm run theme:check` catches staleness), and the status
 * hues were carried over from the 0.1 stylesheets. These tests pin the carry
 * over, so a later edit to either side is a deliberate visual change.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { lablupTheme as builtTheme } from "./built/lablup.js";
import { LABLUP_ACCENT, LABLUP_INFO_TOKEN, lablupTheme } from "./lablupTheme";

const STYLES = join(__dirname, "..", "..", "styles");

function tokenValue(file: string, name: string): string {
  const css = readFileSync(join(STYLES, file), "utf8");
  const match = css.match(new RegExp(`--token-${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`${file} declares no --token-${name}`);
  return match[1].trim().toLowerCase();
}

/** The `light-dark(a, b)` pair a built theme resolves a token to. */
function pair(value: unknown): [string, string] {
  const match = String(value).match(/^light-dark\(([^,]+),\s*([^)]+)\)$/);
  if (!match?.[1] || !match[2])
    throw new Error(`not a light-dark pair: ${String(value)}`);
  return [match[1].trim().toLowerCase(), match[2].trim().toLowerCase()];
}

describe("lablup theme", () => {
  it("is named lablup and seeds the brand accent", () => {
    expect(lablupTheme.name).toBe("lablup");
    expect(LABLUP_ACCENT).toEqual(["#FF7A00", "#DC6B03"]);
  });

  it("the built artifact is the same theme, pre-built", () => {
    expect(builtTheme.name).toBe("lablup");
    expect((builtTheme as { __built?: boolean }).__built).toBe(true);
  });

  it.each([
    ["--color-error", "colorError"],
    ["--color-success", "colorSuccess"],
    ["--color-warning", "colorWarning"],
  ])("%s carries the 0.1 light and dark %s", (token, legacy) => {
    const tokens = builtTheme.tokens as Record<string, string>;
    expect(pair(tokens[token])).toEqual([
      tokenValue("base.css", legacy),
      tokenValue("themes/orange-dark.css", legacy),
    ]);
  });

  it("declares the info hue as a theme-local token", () => {
    const local = (builtTheme as { localTokens?: Record<string, string> }).localTokens;
    expect(pair(local?.[LABLUP_INFO_TOKEN])).toEqual([
      tokenValue("base.css", "colorInfo"),
      tokenValue("themes/orange-dark.css", "colorInfo"),
    ]);
  });

  it("names the 0.1 font family without loading it", () => {
    const tokens = builtTheme.tokens as Record<string, string>;
    expect(tokens["--font-family-body"]).toContain('"Ubuntu Sans"');
    const css = readFileSync(join(__dirname, "built", "theme.css"), "utf8");
    expect(css).not.toMatch(/@font-face/);
  });
});
