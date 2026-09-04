/**
 * Token-contract guards.
 *
 * CONTRIBUTING says "Never add a token to a component without adding it to
 * `src/styles/base.css`. A token that only exists in a product's theme file
 * makes the component render correctly there and nowhere else, which is the
 * failure mode this package exists to prevent." Nothing enforced that. The rule
 * holds today, so pinning it here is a ratchet rather than a cleanup.
 *
 * The second guard is narrower and comes from a real defect. `StatCard` sized
 * its value from `--token-fontSizeHeading2`, so the number followed whatever
 * heading ladder the consuming product had chosen. A product with larger
 * headings got a larger stat value it never asked for: one consumer ships the
 * Ant Design v5 scale and rendered the value at 30px against the 24px this
 * package intends. A stat value is a numeric display, not a heading, and the
 * fix was to give it a token that says so.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const STYLES_DIR = __dirname;
const COMPONENTS_DIR = join(STYLES_DIR, "..", "components");
const BASE_CSS = readFileSync(join(STYLES_DIR, "base.css"), "utf8");

/** Comments blanked out, so prose naming a token is not read as a reference. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "));
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

const DECLARED = new Set(
  [...BASE_CSS.matchAll(/(--token-[A-Za-z0-9]+)\s*:/g)].map((m) => m[1] ?? ""),
);

describe("token contract", () => {
  it("declares a substantial token set", () => {
    expect(DECLARED.size).toBeGreaterThan(100);
  });

  it("every token a component reads is declared in styles/base.css", () => {
    const orphans: string[] = [];
    for (const file of cssFiles(COMPONENTS_DIR)) {
      const source = withoutComments(readFileSync(file, "utf8"));
      for (const match of source.matchAll(/var\(\s*(--token-[A-Za-z0-9]+)/g)) {
        const name = match[1] ?? "";
        if (!DECLARED.has(name)) orphans.push(`${file}: ${name}`);
      }
    }
    expect(
      [...new Set(orphans)].sort(),
      "a token declared only in a product's theme file renders correctly there " +
        "and nowhere else (see CONTRIBUTING.md)",
    ).toEqual([]);
  });
});

describe("StatCard value sizing", () => {
  const STAT_CARD_CSS = withoutComments(
    readFileSync(join(COMPONENTS_DIR, "StatCard", "StatCard.css"), "utf8"),
  );

  /** The declarations of one rule, by exact selector. */
  function ruleBody(selector: string): string {
    const match = [...STAT_CARD_CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      (m) => (m[1] ?? "").trim() === selector,
    );
    if (match === undefined) throw new Error(`no rule for "${selector}"`);
    return match[2] ?? "";
  }

  // A stat value is a numeric display. Sizing it from a heading token hands
  // control of the number to the consumer's heading ladder, which is a
  // decision about prose, not about data.
  it("sizes the value from the numeric ladder, not a heading token", () => {
    const body = ruleBody(".stat-card__value");
    expect(body).toMatch(/font-size:\s*var\(--token-fontSizeXXL/);
    expect(body).not.toMatch(/font-size:\s*var\(--token-fontSizeHeading/);
  });

  it("gives the token the fallback base.css declares for it", () => {
    const declared = /--token-fontSizeXXL:\s*([^;}]+)/.exec(BASE_CSS)?.[1]?.trim();
    expect(declared).toBe("1.5rem");
    expect(ruleBody(".stat-card__value")).toMatch(
      /var\(--token-fontSizeXXL,\s*1\.5rem\)/,
    );
  });
});
