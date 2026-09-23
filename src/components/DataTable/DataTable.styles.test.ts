import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENT_CSS = readFileSync(join(__dirname, "DataTable.css"), "utf8");
const STYLES_DIR = join(__dirname, "..", "..", "styles");

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function token(source: string, name: string): string {
  const match = source.match(new RegExp(`--token-${name}:\\s*([^;]+)`));
  if (!match?.[1]) throw new Error(`Missing --token-${name}`);
  return match[1].trim();
}

function color(value: string): Rgba {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex?.[1]) {
    const digits = hex[1];
    return {
      r: Number.parseInt(digits.slice(0, 2), 16),
      g: Number.parseInt(digits.slice(2, 4), 16),
      b: Number.parseInt(digits.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgba = /^rgba?\(([^)]+)\)$/i.exec(value);
  if (!rgba?.[1]) throw new Error(`Unsupported color: ${value}`);
  const values = rgba[1].split(",").map((part) => Number.parseFloat(part.trim()));
  const [r, g, b, a = 1] = values;
  if (r === undefined || g === undefined || b === undefined) {
    throw new Error(`Unsupported color: ${value}`);
  }
  return { r, g, b, a };
}

function composite(foreground: Rgba, background: Rgba): Rgba {
  return {
    r: Math.round(foreground.r * foreground.a + background.r * (1 - foreground.a)),
    g: Math.round(foreground.g * foreground.a + background.g * (1 - foreground.a)),
    b: Math.round(foreground.b * foreground.a + background.b * (1 - foreground.a)),
    a: 1,
  };
}

function luminance(value: Rgba): number {
  const channel = (channelValue: number) => {
    const normalized = channelValue / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(value.r) + 0.7152 * channel(value.g) + 0.0722 * channel(value.b)
  );
}

function contrast(a: Rgba, b: Rgba): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe("DataTable resize grip styles", () => {
  it("keeps declared column widths when the table overflows its local scroll container", () => {
    expect(COMPONENT_CSS).toMatch(
      /\.data-table__table\s*{[\s\S]*width:\s*max-content;/,
    );
    expect(COMPONENT_CSS).toMatch(/\.data-table__table\s*{[\s\S]*min-width:\s*100%;/);
    expect(COMPONENT_CSS).toMatch(/\.data-table\s*{[\s\S]*overflow-x:\s*auto;/);
  });

  it("reserves a token-sized 24px-or-larger target outside header content", () => {
    expect(COMPONENT_CSS).toMatch(
      /\.data-table__cell--resizable\s*{[\s\S]*padding-inline-end/,
    );
    expect(COMPONENT_CSS).toMatch(
      /\.data-table__resize-handle\s*{[\s\S]*width:\s*var\(--token-controlHeightSM,\s*2rem\)/,
    );
    const base = readFileSync(join(STYLES_DIR, "base.css"), "utf8");
    expect(token(base, "controlHeightSM")).toBe("2rem");
  });

  it("uses semantic grip and focus tokens", () => {
    expect(COMPONENT_CSS).toMatch(
      /\.data-table__resize-handle::before\s*{[\s\S]*background-color:\s*var\(--token-colorTextTertiary,\s*#737373\)/,
    );
    expect(COMPONENT_CSS).toMatch(
      /\.data-table__resize-handle:focus-visible\s*{[\s\S]*--token-focusRingColor/,
    );
  });

  it.each([
    ["orange-light", "orange-light.css"],
    ["orange-dark", "orange-dark.css"],
  ])("keeps %s grip contrast at or above 3:1", (_name, file) => {
    const source = readFileSync(join(STYLES_DIR, "themes", file), "utf8");
    const grip = color(token(source, "colorTextTertiary"));
    const layout = color(token(source, "colorBgLayout"));
    const header = composite(color(token(source, "colorFillQuaternary")), layout);

    expect(contrast(grip, header)).toBeGreaterThanOrEqual(3);
  });
});
