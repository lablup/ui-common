/**
 * Contrast and shape guards for focus indicators (issue #7).
 *
 * Nothing else in `pnpm verify` reads a colour value, so a focus ring at
 * 2.37:1 passed typecheck, lint, format, boundary, build and pack without a
 * complaint. That is how `--token-focusRingColor: #ff7a00` shipped. These
 * tests are the missing gate: they resolve the token contract the same way a
 * browser does, composite alpha over an opaque page, and assert the WCAG 2.2
 * SC 1.4.11 floor of 3:1 for every sheet this package ships.
 *
 * They also pin the two shapes a focus indicator may take, because the defect
 * had two spellings and only one of them contained the word `outline`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const STYLES_DIR = __dirname;
const THEMES_DIR = join(STYLES_DIR, "themes");
const COMPONENTS_DIR = join(__dirname, "..", "components");

/** The 3:1 non-text contrast floor of WCAG 2.2 SC 1.4.11. */
const MIN_RATIO = 3;

/**
 * The surfaces a focus indicator in this package can land on. Every component
 * background is one of these six tokens, so a ring must clear the floor
 * against all of them, not against one representative colour.
 */
const SURFACES = [
  "colorBgContainer",
  "colorBgLayout",
  "colorBgElevated",
  "colorFillTertiary",
  "colorFillSecondary",
  "colorFillQuaternary",
] as const;

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(raw: string): Rgba | null {
  const s = raw.trim();

  const hex = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (hex) {
    const digits = hex[1] ?? "";
    let h = digits;
    if (digits.length === 3 || digits.length === 4) {
      h = digits.replace(/./g, (c) => c + c);
    }
    if (h.length === 6) h += "ff";
    if (h.length !== 8) return null;
    const byte = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { r: byte(0), g: byte(2), b: byte(4), a: byte(6) / 255 };
  }

  const fn = /^rgba?\(([^)]*)\)$/i.exec(s);
  if (!fn) return null;
  const parts = (fn[1] ?? "").split(/[,\s/]+/).filter(Boolean);
  const [rp, gp, bp, ap] = parts;
  if (rp === undefined || gp === undefined || bp === undefined) return null;
  const channel = (p: string) =>
    Math.round(p.endsWith("%") ? (parseFloat(p) * 255) / 100 : parseFloat(p));
  const alpha =
    ap === undefined ? 1 : ap.endsWith("%") ? parseFloat(ap) / 100 : parseFloat(ap);
  return { r: channel(rp), g: channel(gp), b: channel(bp), a: alpha };
}

/** Composite a translucent colour over an opaque page base. */
function over(fg: Rgba, base: Rgba): Rgba {
  const blend = (c: number, b: number) => Math.round(c * fg.a + b * (1 - fg.a));
  return {
    r: blend(fg.r, base.r),
    g: blend(fg.g, base.g),
    b: blend(fg.b, base.b),
    a: 1,
  };
}

/** sRGB relative luminance, WCAG 2.x. */
function luminance(c: Rgba): number {
  const channel = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

function contrast(a: Rgba, b: Rgba): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };

/**
 * Every declared value of every token in a sheet. A token can be declared more
 * than once (media-query variants change alpha), and the worst variant is the
 * one that has to clear the floor.
 */
function readTokens(file: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const m of readFileSync(file, "utf8").matchAll(
    /--token-([A-Za-z0-9]+)\s*:\s*([^;}]+)/g,
  )) {
    const name = m[1];
    const value = m[2];
    if (name === undefined || value === undefined) continue;
    const list = out.get(name) ?? [];
    list.push(value.trim());
    out.set(name, list);
  }
  return out;
}

/** Resolve a token to every colour it can take, following `var()` chains. */
function resolve(
  tokens: Map<string, string[]>,
  name: string,
  seen = new Set<string>(),
): Rgba[] {
  if (seen.has(name)) return [];
  const declared = tokens.get(name);
  if (!declared) return [];
  const next = new Set(seen).add(name);
  const out: Rgba[] = [];
  for (const raw of declared) {
    const ref = /^var\(\s*--token-([A-Za-z0-9]+)\s*(?:,\s*([\s\S]*))?\)$/.exec(
      raw.trim(),
    );
    const referenced = ref?.[1];
    if (referenced !== undefined) {
      out.push(...resolve(tokens, referenced, next));
      const fallback = ref?.[2];
      if (fallback !== undefined) {
        const parsed = parseColor(fallback);
        if (parsed) out.push(parsed);
      }
      continue;
    }
    const direct = parseColor(raw);
    if (direct) out.push(direct);
  }
  return out;
}

/** base.css carries the whole contract; a theme file overrides a subset. */
function sheet(theme: string | null): Map<string, string[]> {
  const merged = readTokens(join(STYLES_DIR, "base.css"));
  if (theme !== null) {
    for (const [key, value] of readTokens(join(THEMES_DIR, `${theme}.css`))) {
      merged.set(key, value);
    }
  }
  return merged;
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

interface RuleBlock {
  selector: string;
  body: string;
}

/** Flat rule blocks, so a selector can be read together with its declarations. */
function ruleBlocks(source: string): RuleBlock[] {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, " ");
  const out: RuleBlock[] = [];
  const stack: { selector: string; start: number }[] = [];
  let segment = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (ch === "{") {
      stack.push({ selector: text.slice(segment, i).trim(), start: i + 1 });
      segment = i + 1;
    } else if (ch === "}") {
      const open = stack.pop();
      if (open !== undefined && !text.slice(open.start, i).includes("{")) {
        out.push({ selector: open.selector, body: text.slice(open.start, i) });
      }
      segment = i + 1;
    }
  }
  return out;
}

const THEME_NAMES = readdirSync(THEMES_DIR)
  .filter((f) => f.endsWith(".css"))
  .map((f) => f.replace(/\.css$/, ""));

describe("--token-focusRingColor contrast", () => {
  const sheets: [string, string | null][] = [
    ["styles/base.css", null],
    ...THEME_NAMES.map((t): [string, string | null] => [`styles/themes/${t}.css`, t]),
  ];

  it.each(sheets)("%s clears 3:1 on every surface", (label, theme) => {
    const tokens = sheet(theme);
    const page = theme !== null && theme.endsWith("-dark") ? BLACK : WHITE;

    const ring = resolve(tokens, "focusRingColor")[0];
    if (ring === undefined) {
      throw new Error(`${label} declares no resolvable --token-focusRingColor`);
    }

    for (const surface of SURFACES) {
      const variants = resolve(tokens, surface);
      expect(
        variants.length,
        `${label} declares no --token-${surface}`,
      ).toBeGreaterThan(0);
      for (const variant of variants) {
        const ratio = contrast(ring, over(variant, page));
        expect(
          Number(ratio.toFixed(2)),
          `${label}: focus ring against --token-${surface} is ${ratio.toFixed(2)}:1, ` +
            `under the WCAG 2.2 SC 1.4.11 floor of ${MIN_RATIO}:1`,
        ).toBeGreaterThanOrEqual(MIN_RATIO);
      }
    }
  });
});

describe("focus indicator shape", () => {
  const files = cssFiles(COMPONENTS_DIR);

  it("finds the component stylesheets", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("never paints an outline from the bare accent", () => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const m of readFileSync(file, "utf8").matchAll(/outline:\s*([^;}]+)/g)) {
        const value = m[1] ?? "";
        if (!value.includes("--token-colorPrimary")) continue;
        if (!value.includes("--token-focusRingColor")) {
          offenders.push(`${file}: outline: ${value.trim()}`);
        }
      }
    }
    expect(offenders, "an outline must resolve through --token-focusRingColor").toEqual(
      [],
    );
  });

  it("never paints a focus border from the bare accent", () => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const { selector, body } of ruleBlocks(readFileSync(file, "utf8"))) {
        if (!selector.includes(":focus")) continue;
        for (const declaration of body.split(";")) {
          const colon = declaration.indexOf(":");
          if (colon === -1) continue;
          const property = declaration.slice(0, colon).trim().toLowerCase();
          const value = declaration.slice(colon + 1);
          const paintsBorderColor =
            property === "border" ||
            property === "border-color" ||
            (property.startsWith("border-") && property.endsWith("-color"));
          if (!paintsBorderColor) continue;
          if (
            /var\(\s*--token-colorPrimary\s*[,)]/.test(value) &&
            !value.includes("color-mix")
          ) {
            offenders.push(`${file}: ${selector} { ${property}:${value.trim()} }`);
          }
        }
      }
    }
    expect(
      offenders,
      "a border-drawn focus ring must use the contrast-corrected accent, " +
        "not the bare --token-colorPrimary",
    ).toEqual([]);
  });

  it("never freezes a colour literal into a focus indicator", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const m of source.matchAll(/--token-focusRingColor\s*,([\s\S]*?)\)\s*;/g)) {
        if (/#[0-9a-f]{3,8}|rgba?\(/i.test(m[1] ?? ""))
          offenders.push(`${file}: ${m[0].trim()}`);
      }
      for (const { selector, body } of ruleBlocks(source)) {
        if (!selector.includes(":focus")) continue;
        for (const m of body.matchAll(/color-mix\(([^;]*)\)/g)) {
          if (/#[0-9a-f]{3,8}/i.test(m[1] ?? "")) {
            offenders.push(`${file}: ${selector} { ${m[0].trim()} }`);
          }
        }
      }
    }
    expect(
      offenders,
      "a fixed literal cannot clear 3:1 against a surface it cannot know, " +
        "so a focus indicator carries no colour literal (see CONTRIBUTING.md)",
    ).toEqual([]);
  });
});
