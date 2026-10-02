/**
 * `@astryxdesign/*` module specifiers → their `@lablup/ui-common` mirror.
 *
 * Only specifiers in a module position are touched: `from "…"`, a bare
 * `import "…"`, `import("…")` (and `typeof import("…")`), `require("…")`,
 * `require.resolve("…")`, `import.meta.resolve("…")`, `vi.mock("…")` and its
 * jest/vitest siblings, and CSS/Sass `@import` / `@use` / `@forward`. A
 * package name in any other string (a list of package names in a script, a
 * `declare module "…"` augmentation, which must name the real module) is
 * left alone. `@astryxdesign/cli` is tooling, not UI, and stays.
 */
import { lineAt, lineTextAt } from "../../cli/project.mjs";

export const UIC = "@lablup/ui-common";

/** Astryx packages ui-common mirrors; the rest of `@astryxdesign/*` is not UI. */
export const MIRRORED_PACKAGES = [
  "@astryxdesign/core",
  "@astryxdesign/lab",
  "@astryxdesign/theme-neutral",
];

const SPEC = String.raw`(@astryxdesign\/[A-Za-z0-9._-]+(?:\/[^'"\s)]*)?)`;

/**
 * Script positions, each its own pattern so that one inside another
 * (`vi.importActual<typeof import("…")>("…")`) is found too. Group 1: the
 * lead-in; 2: the quote; 3: the specifier.
 */
export const SCRIPT_SPECIFIERS = [
  String.raw`\bfrom\s*`,
  String.raw`\bimport\s*`,
  String.raw`\bimport\s*\(\s*`,
  String.raw`\brequire(?:\.resolve)?\s*\(\s*`,
  String.raw`\bimport\.meta\.resolve\s*\(\s*`,
  String.raw`\b(?:vi|jest)\.(?:mock|doMock|unmock|doUnmock|requireActual|importActual|importMock|requireMock)\s*(?:<[^<>]*(?:<[^<>]*>[^<>]*)*>)?\s*\(\s*`,
].map((lead) => new RegExp(String.raw`(${lead})(['"])${SPEC}\2`, "g"));

/** Stylesheet positions: `@import "…"`, `@import url(…)`, Sass `@use` / `@forward`. */
export const STYLE_SPECIFIERS = [
  new RegExp(
    String.raw`(@(?:import|use|forward)\s+(?:url\(\s*)?)(['"]?)${SPEC}\2`,
    "g",
  ),
];

/**
 * Each specifier in a module position: where it starts and what it says.
 *
 * @param {string} text
 * @param {"script" | "style"} kind
 * @returns {Array<{spec: string, index: number}>} by position, no duplicates
 */
function locate(text, kind) {
  /** @type {Map<number, string>} */
  const found = new Map();
  for (const pattern of kind === "style" ? STYLE_SPECIFIERS : SCRIPT_SPECIFIERS) {
    for (const m of text.matchAll(new RegExp(pattern.source, "g"))) {
      found.set((m.index ?? 0) + m[1].length + m[2].length, m[3]);
    }
  }
  return [...found.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, spec]) => ({ spec, index }));
}

/**
 * Whether a subpath exists in an `exports` map, wildcards included
 * (`./locales/*.json` covers `./locales/ko-KR.json`).
 *
 * @param {Record<string, unknown>} exportsMap
 * @param {string} subpath "./X"
 */
export function exportsHas(exportsMap, subpath) {
  if (subpath in exportsMap) return true;
  for (const key of Object.keys(exportsMap)) {
    const star = key.indexOf("*");
    if (star === -1) continue;
    const head = key.slice(0, star);
    const tail = key.slice(star + 1);
    if (
      subpath.length > head.length + tail.length &&
      subpath.startsWith(head) &&
      subpath.endsWith(tail) &&
      !subpath.slice(head.length, subpath.length - tail.length).includes("/")
    )
      return true;
  }
  return false;
}

/** The core subpaths ui-common hides, with what replaces them (exports.exclude.json). */
export const HIDDEN_SUBPATHS = {
  Dialog: { replacement: "Modal", subpath: "Modal" },
  AlertDialog: { replacement: "AlertModal", subpath: "AlertModal" },
};

/**
 * Where an `@astryxdesign/*` specifier goes.
 *
 * @param {string} spec
 * @param {Record<string, unknown>} exportsMap the target ui-common's `exports`
 * @returns {{to: string, row: string} | {left: string} | null} null: not ui-common's business
 */
export function mapSpecifier(spec, exportsMap) {
  const m = /^(@astryxdesign\/[^/]+)(?:\/(.*))?$/.exec(spec);
  if (!m) return null;
  const [, pkg, sub = ""] = m;
  if (!MIRRORED_PACKAGES.includes(pkg)) {
    if (pkg === "@astryxdesign/cli") return null;
    return { left: `${pkg} is not part of ${UIC}; nothing mirrors it.` };
  }
  const via = (/** @type {string} */ target, /** @type {string} */ row) =>
    exportsHas(exportsMap, `./${target}`)
      ? { to: `${UIC}/${target}`, row }
      : { left: `${UIC} has no \`./${target}\` export to mirror ${spec}.` };
  if (sub === "package.json")
    return {
      left: `${spec} is Astryx's own manifest; read it from Astryx, or drop it.`,
    };

  if (pkg === "@astryxdesign/core") {
    if (sub === "") return { to: UIC, row: "core (root)" };
    const head = sub.split("/")[0];
    const hidden = HIDDEN_SUBPATHS[/** @type {keyof typeof HIDDEN_SUBPATHS} */ (head)];
    if (hidden) {
      return {
        left: `${UIC} hides ${head}: import ${hidden.replacement} from ${UIC}/${hidden.subpath} (adopt renames named imports; this one it could not).`,
      };
    }
    if (/\.css$/.test(sub)) return via(sub, "core stylesheets");
    if (sub === "theme/tokens.stylex") return via(sub, "core/theme/tokens.stylex");
    if (/^locales\//.test(sub)) return via(sub, "core/locales/*.json");
    return via(sub, "core/<X>");
  }
  if (pkg === "@astryxdesign/lab") {
    if (sub === "") return { to: `${UIC}/lab`, row: "lab" };
    return via(`lab/${sub}`, /\.css$/.test(sub) ? "lab/lab.css" : "lab/<X>");
  }
  // @astryxdesign/theme-neutral
  if (sub === "") return via("theme/neutral", "theme-neutral");
  return via(
    `theme/neutral/${sub}`,
    /\.css$/.test(sub) ? "theme-neutral/theme.css" : "theme-neutral/<X>",
  );
}

/**
 * Every `@astryxdesign/*` specifier in a module position, with its line.
 *
 * @param {string} text
 * @param {"script" | "style"} kind
 */
export function findSpecifiers(text, kind) {
  return locate(text, kind).map(({ spec, index }) => ({
    spec,
    index,
    line: lineAt(text, index),
    text: lineTextAt(text, index),
  }));
}

/**
 * Rewrite every mappable specifier in `text`.
 *
 * `keep(spec, index)` may veto one rewrite (a root import that still names a
 * hidden Dialog export).
 *
 * @param {string} text
 * @param {"script" | "style"} kind
 * @param {Record<string, unknown>} exportsMap
 * @param {(spec: string, index: number) => string | null} [keep] a reason to keep it, or null
 * @returns {{text: string, rows: Record<string, number>, left: Array<{spec: string, line: number, text: string, reason: string}>}}
 */
export function rewriteSpecifiers(text, kind, exportsMap, keep) {
  /** @type {Record<string, number>} */
  const rows = {};
  /** @type {Array<{spec: string, line: number, text: string, reason: string}>} */
  const left = [];
  /** @type {Array<{at: number, spec: string, to: string}>} */
  const edits = [];
  for (const { spec, index: at } of locate(text, kind)) {
    const mapped = mapSpecifier(spec, exportsMap);
    if (!mapped) continue;
    if ("left" in mapped) {
      left.push({
        spec,
        line: lineAt(text, at),
        text: lineTextAt(text, at),
        reason: mapped.left,
      });
      continue;
    }
    const veto = keep?.(spec, at);
    if (veto) {
      left.push({
        spec,
        line: lineAt(text, at),
        text: lineTextAt(text, at),
        reason: veto,
      });
      continue;
    }
    rows[mapped.row] = (rows[mapped.row] ?? 0) + 1;
    edits.push({ at, spec, to: mapped.to });
  }
  let out = text;
  for (const e of edits.reverse())
    out = out.slice(0, e.at) + e.to + out.slice(e.at + e.spec.length);
  return { text: out, rows, left };
}

/**
 * The names an import or export statement takes from a module, from the
 * statement's text: `{ A, B as C, type D }` → A, B, D.
 *
 * @param {string} text the whole file
 * @param {number} at index of the specifier
 * @returns {string[] | null} null for a statement with no named clause
 */
export function importedNamesAt(text, at) {
  const before = text.slice(Math.max(0, at - 4000), at);
  const start = Math.max(before.lastIndexOf("import"), before.lastIndexOf("export"));
  if (start === -1) return null;
  const clause = /\{([^}]*)\}\s*from\s*['"]?$/.exec(before.slice(start));
  if (!clause) return null;
  return clause[1]
    .split(",")
    .map((s) =>
      s
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")
        .trim()
        .replace(/^type\s+/, ""),
    )
    .filter(Boolean)
    .map((s) => s.split(/\s+as\s+/)[0].trim());
}
