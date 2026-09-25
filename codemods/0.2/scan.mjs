/**
 * 0.1 -> 0.2 report-only scans. Nothing here edits a file: each finding is
 * something the codemods cannot migrate and a person has to look at.
 *
 * - CSS selectors on 0.1 class names (Astryx renders none of them).
 * - DOM hooks on those classes in scripts (querySelector, closest, classList).
 * - Tests querying them.
 * - `vi.mock` / `jest.mock` of @lablup/ui-common.
 * - Custom properties the project declares that Astryx declares too.
 * - Hard-coded 0.1 stylesheet paths the codemods did not rewrite.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

import { dependencyDir } from "../../cli/paths.mjs";
import { keptClassRename } from "./map.mjs";

const legacy = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "legacy-classes.json"),
    "utf8",
  ),
);

/** @type {Map<string, string>} class -> 0.1 component */
export const LEGACY_CLASSES = new Map();
for (const [component, classes] of Object.entries(legacy.components)) {
  for (const c of /** @type {string[]} */ (classes)) LEGACY_CLASSES.set(c, component);
}

/**
 * A class 0.1 rendered: every class its stylesheets declared, plus anything
 * under a kept component's renamed BEM block.
 *
 * @param {string} name
 */
export function isLegacyClass(name) {
  return LEGACY_CLASSES.has(name) || keptClassRename(name) !== null;
}

/**
 * Where a 0.1 class went: a kept component's class was renamed (the map's
 * classRenames), a removed component's is gone.
 *
 * @param {string} name
 */
export function describeClass(name) {
  const owner = LEGACY_CLASSES.get(name);
  const renamed = keptClassRename(name);
  if (renamed?.to) return `.${name} → .${renamed.to}${owner ? ` (${owner})` : ""}`;
  return `.${name} (${owner ?? "0.1"}): gone`;
}

const COLLISION_PREFIXES = /^--(color|radius|spacing|font|shadow)-/;

/** @type {Set<string> | null} */
let astryxProperties = null;

/**
 * Custom properties Astryx declares, read from the installed stylesheets so
 * the list follows the pinned version.
 */
export function astryxCustomProperties() {
  if (astryxProperties) return astryxProperties;
  const names = new Set();
  const sheets = [];
  const core = dependencyDir("@astryxdesign/core");
  if (core) sheets.push(join(core, "dist/astryx.css"));
  const neutral = dependencyDir("@astryxdesign/theme-neutral");
  if (neutral) sheets.push(join(neutral, "dist/theme.css"));
  for (const sheet of sheets) {
    let text;
    try {
      text = readFileSync(sheet, "utf8");
    } catch {
      continue;
    }
    for (const match of text.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) {
      if (COLLISION_PREFIXES.test(match[1])) names.add(match[1]);
    }
  }
  astryxProperties = names;
  return names;
}

/** @param {string} path */
export function isTestFile(path) {
  return (
    /(\.|\/)(test|spec)\.[cm]?[jt]sx?$/.test(path) ||
    /(^|\/)(__tests__|e2e|tests?)\//.test(path)
  );
}

/** @param {string} text @param {number} index */
function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

/** @param {string} selector */
function classesIn(selector) {
  const found = new Set();
  try {
    selectorParser((s) => {
      s.walkClasses((node) => {
        found.add(node.value);
      });
    }).processSync(selector);
  } catch {
    for (const m of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) found.add(m[1]);
  }
  return [...found];
}

/**
 * @typedef {{category: string, file: string, line: number, text: string, detail?: string}} Finding
 */

/**
 * @param {string} file relative path
 * @param {string} source
 * @returns {Finding[]}
 */
function scanStylesheet(file, source) {
  /** @type {Finding[]} */
  const findings = [];
  const properties = astryxCustomProperties();
  if (file.endsWith(".css")) {
    let root;
    try {
      root = postcss.parse(source, { from: file });
    } catch {
      return findings;
    }
    root.walkRules((rule) => {
      if (
        rule.parent?.type === "atrule" &&
        /keyframes$/.test(/** @type {any} */ (rule.parent).name)
      )
        return;
      const hits = classesIn(rule.selector).filter(isLegacyClass);
      if (hits.length > 0) {
        findings.push({
          category: "css-selector",
          file,
          line: rule.source?.start?.line ?? 0,
          text: rule.selector.replace(/\s+/g, " "),
          detail: hits.map(describeClass).join(", "),
        });
      }
    });
    root.walkDecls((decl) => {
      if (properties.has(decl.prop)) {
        const rule = /** @type {any} */ (decl.parent);
        findings.push({
          category: "custom-property",
          file,
          line: decl.source?.start?.line ?? 0,
          text: `${rule?.selector ?? `@${rule?.name ?? ""}`} { ${decl.prop}: ${decl.value} }`,
          detail: decl.prop,
        });
      }
    });
    return findings;
  }
  // Sass / Less: line-level.
  source.split("\n").forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, "");
    const declaration = /^\s*(--[A-Za-z0-9_-]+)\s*:/.exec(code);
    if (declaration && properties.has(declaration[1])) {
      findings.push({
        category: "custom-property",
        file,
        line: i + 1,
        text: line.trim(),
        detail: declaration[1],
      });
      return;
    }
    if (!/[{,]\s*$/.test(code)) return;
    const hits = [...code.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)]
      .map((m) => m[1])
      .filter(isLegacyClass);
    if (hits.length > 0) {
      findings.push({
        category: "css-selector",
        file,
        line: i + 1,
        text: code.trim().replace(/\s*[{,]$/, ""),
        detail: [...new Set(hits)].map(describeClass).join(", "),
      });
    }
  });
  return findings;
}

const SELECTOR_CALL =
  /\b(querySelector(?:All)?|closest|matches|webkitMatchesSelector)\(\s*(["'`])((?:(?!\2)[^\\]|\\.)*)\2/g;
const CLASS_CALL =
  /\b(classList\.(?:contains|add|remove|toggle|replace)|getElementsByClassName|toHaveClass)\(\s*(["'`])((?:(?!\2)[^\\]|\\.)*)\2/g;

/**
 * @param {string} file relative path
 * @param {string} source
 * @returns {Finding[]}
 */
function scanScript(file, source) {
  /** @type {Finding[]} */
  const findings = [];
  const test = isTestFile(file);
  const lines = source.split("\n");
  const record = (/** @type {RegExpMatchArray} */ m, /** @type {string[]} */ hits) => {
    const line = lineAt(source, m.index ?? 0);
    findings.push({
      category: test ? "test-query" : "dom-hook",
      file,
      line,
      text: (lines[line - 1] ?? "").trim(),
      detail: [...new Set(hits)].map(describeClass).join(", "),
    });
  };
  for (const m of source.matchAll(SELECTOR_CALL)) {
    const hits = classesIn(m[3]).filter(isLegacyClass);
    if (hits.length > 0) record(m, hits);
  }
  for (const m of source.matchAll(CLASS_CALL)) {
    const hits = m[3].split(/\s+/).filter(isLegacyClass);
    if (hits.length > 0) record(m, hits);
  }
  for (const m of source.matchAll(
    /\b(vi|jest)\.(mock|doMock|unmock)\(\s*(["'`])(@lablup\/ui-common[^"'`]*)\3/g,
  )) {
    const line = lineAt(source, m.index ?? 0);
    findings.push({
      category: "module-mock",
      file,
      line,
      text: (lines[line - 1] ?? "").trim(),
      detail: m[4],
    });
  }
  const properties = astryxCustomProperties();
  for (const m of source.matchAll(/(["'`])(--[A-Za-z0-9_-]+)\1/g)) {
    if (!properties.has(m[2])) continue;
    const line = lineAt(source, m.index ?? 0);
    const text = (lines[line - 1] ?? "").trim();
    // Declarations (setProperty, style objects), not reads through var().
    if (!/setProperty\(|["'`]\s*:/.test(text)) continue;
    findings.push({ category: "custom-property", file, line, text, detail: m[2] });
  }
  return findings;
}

/**
 * @param {string} file relative path
 * @param {string} source final content
 * @returns {Finding[]}
 */
export function scanFile(file, source) {
  /** @type {Finding[]} */
  const findings = [];
  if (/\.(css|scss|sass|less)$/.test(file))
    findings.push(...scanStylesheet(file, source));
  else findings.push(...scanScript(file, source));

  source.split("\n").forEach((line, i) => {
    if (/@lablup\/ui-common\/styles\//.test(line)) {
      findings.push({
        category: "stylesheet-path",
        file,
        line: i + 1,
        text: line.trim(),
        detail: "0.1 stylesheet path: deprecated in 0.2, removed in 0.3",
      });
    }
  });
  return findings;
}

export const CATEGORIES = {
  "css-selector": {
    title: "CSS selectors on 0.1 class names",
    help: "A removed component's classes are gone: Astryx renders its own. Restyle through the component's props, the theme, or your `components` layer. A kept component's classes were renamed to `uic-` names (shown as →), but its markup was rebuilt on Astryx, so check the selector still means what it did. Generic names (`.button`, `.select`) may be your own classes: skip those.",
  },
  "dom-hook": {
    title: "DOM hooks on 0.1 class names",
    help: "Scripts that find 0.1 markup by class stop matching. Use a ref, a data-testid, or the Astryx component's own API.",
  },
  "test-query": {
    title: "Tests querying 0.1 class names",
    help: "Query by role, label or data-testid instead.",
  },
  "module-mock": {
    title: "Module mocks of @lablup/ui-common",
    help: "A mock of the root barrel now stands in for all of Astryx too, and mocked names such as Button, Badge or Select no longer match what the code imports (Astryx's, from their own subpaths). Re-check every mock factory.",
  },
  "custom-property": {
    title: "Custom properties that collide with Astryx tokens",
    help: "Astryx declares the same name. Whichever rule wins the cascade now restyles both your CSS and Astryx's components. Rename yours, or set it through a theme (`defineTheme`) on purpose.",
  },
  "stylesheet-path": {
    title: "0.1 stylesheet paths left in place",
    help: "Scripts, configs or tests that name `@lablup/ui-common/styles/*` directly. base.css and the orange themes are deprecated in 0.2 and removed in 0.3; the Lablup theme replaces them.",
  },
};
