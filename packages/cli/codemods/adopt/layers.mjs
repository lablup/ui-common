/**
 * The cascade-layer order statement.
 *
 * ui-common's styles live in `@layer ui-common`, between Astryx's
 * `astryx-theme` and the app's `components`. A direct-Astryx app declares
 * Astryx's order without it, and a layer's place is fixed by the first
 * statement that names it, so every copy of the statement gains `ui-common`.
 * A stylesheet that loads Astryx's sheets without declaring an order gets the
 * statement first, and an `index.html` gets it as its first `<style>`, where it
 * precedes every stylesheet the bundle injects in dev and in a build.
 */
import { LAYER_ORDER } from "../../cli/agents.mjs";
import { sassPreludeEnd } from "../0.2/stylesheets.mjs";

export { LAYER_ORDER };

/** `@layer a, b, c;` with at least two names. */
export const LAYER_STATEMENT =
  /@layer\s+([A-Za-z_][\w-]*(?:\s*,\s*[A-Za-z_][\w-]*)+)\s*;/g;

/** Blank `/* … *\/` and `<!-- … -->` bodies, keeping offsets. */
export function blankComments(/** @type {string} */ text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));
}

/**
 * Every order statement in `text`, outside comments.
 *
 * @param {string} text
 * @returns {Array<{index: number, length: number, names: string[]}>}
 */
export function layerStatements(text) {
  const scannable = blankComments(text);
  return [...scannable.matchAll(new RegExp(LAYER_STATEMENT.source, "g"))].map((m) => ({
    index: m.index ?? 0,
    length: m[0].length,
    names: m[1].split(",").map((n) => n.trim()),
  }));
}

/**
 * `names` with `ui-common` in its place, or null when the statement is not an
 * Astryx order (it names neither `astryx-base` nor `astryx-theme`) or already
 * has it.
 *
 * @param {string[]} names
 */
export function withUiCommonLayer(names) {
  if (names.includes("ui-common")) return null;
  const after = names.lastIndexOf("astryx-theme");
  const base = names.lastIndexOf("astryx-base");
  if (after === -1 && base === -1) return null;
  const at = (after !== -1 ? after : base) + 1;
  return [...names.slice(0, at), "ui-common", ...names.slice(at)];
}

/**
 * Add `ui-common` to every Astryx order statement in `text`.
 *
 * @param {string} text
 * @returns {{text: string, fixed: number}}
 */
export function addUiCommonLayer(text) {
  let fixed = 0;
  let out = text;
  for (const s of layerStatements(text).reverse()) {
    const next = withUiCommonLayer(s.names);
    if (!next) continue;
    out = `${out.slice(0, s.index)}@layer ${next.join(", ")};${out.slice(s.index + s.length)}`;
    fixed++;
  }
  return { text: out, fixed };
}

const LOADS_ASTRYX =
  /@import\s+(?:url\(\s*)?["']?@lablup\/ui-common\/(?:reset|astryx)\.css/;

/**
 * A stylesheet that imports ui-common's Astryx sheets but declares no order
 * before them gets `statement` first (after `@charset`, or in SCSS after the
 * `@use` / `@forward` prelude Sass requires on top).
 *
 * @param {string} text
 * @param {string} path
 * @param {string} statement
 * @returns {string | null}
 */
export function ensureLayerStatement(text, path, statement = LAYER_ORDER) {
  const scannable = blankComments(text);
  const load = LOADS_ASTRYX.exec(scannable);
  if (!load) return null;
  const first = layerStatements(text)[0];
  if (first && first.index < load.index) return null;
  if (path.endsWith(".scss") || path.endsWith(".sass")) {
    const at = sassPreludeEnd(text);
    if (at > 0)
      return `${text.slice(0, at)}\n\n${statement}\n\n${text.slice(at).replace(/^[ \t]*\r?\n+/, "")}`;
  }
  const charset = /^@charset\s+"[^"]*";[ \t]*\r?\n?/.exec(text);
  if (charset)
    return `${charset[0].replace(/\s*$/, "")}\n${statement}\n${text.slice(charset[0].length)}`;
  return `${statement}\n\n${text}`;
}

/**
 * An app's `index.html` with `statement` as its first `<style>`, before every
 * `<link rel="stylesheet">` and every other `<style>`; null when it declares an
 * order already or is not a module-script entry page.
 *
 * @param {string} html
 * @param {string} statement
 */
export function ensureHtmlLayerStatement(html, statement = LAYER_ORDER) {
  const scannable = blankComments(html);
  if (!/<script\b[^>]*type\s*=\s*["']module["']/i.test(scannable)) return null;
  if (layerStatements(html).length > 0) return null;
  const head = /<head\b[^>]*>/i.exec(scannable);
  if (!head) return null;
  let at = (head.index ?? 0) + head[0].length;
  const charset = /<meta\s+charset\s*=\s*["']?[\w-]+["']?\s*\/?>/i.exec(
    scannable.slice(at),
  );
  if (charset && (charset.index ?? 0) < 400)
    at += (charset.index ?? 0) + charset[0].length;
  const indent = /\n([ \t]*)\S/.exec(html.slice(at))?.[1] ?? "    ";
  return `${html.slice(0, at)}\n${indent}<style>${statement}</style>${html.slice(at)}`;
}
