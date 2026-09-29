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

import { dependencyDir, targetUiCommonRoot } from "../../cli/paths.mjs";
import { keptClassRename } from "./map.mjs";
import { scanTheme } from "./theme.mjs";

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
  // The Astryx the upgrade moves to: the project may still be on 0.1.
  const root = targetUiCommonRoot();
  const core = dependencyDir("@astryxdesign/core", root);
  if (core) sheets.push(join(core, "dist/astryx.css"));
  const neutral = dependencyDir("@astryxdesign/theme-neutral", root);
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
 * @typedef {{category: string, file: string, line: number, text: string, detail?: string, classes?: string[]}} Finding
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
          classes: hits,
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
        classes: hits,
      });
    }
  });
  return findings;
}

// DOM APIs, and the selector-taking calls of Playwright, Cypress and
// Testing Library's container queries.
const SELECTOR_CALL =
  /(?:\b(querySelector(?:All)?|closest|matches|webkitMatchesSelector|locator|waitForSelector)|(?<![\w$])(\$\$?(?:eval)?)|\bcy\.(get|find))\(\s*(["'`])((?:(?!\4)[^\\]|\\.)*)\4/g;
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
      classes: hits,
    });
  };
  for (const m of source.matchAll(SELECTOR_CALL)) {
    const hits = classesIn(m[5]).filter(isLegacyClass);
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

/** A selector that is one class, with pseudo-classes at most: `.tabs__tab:hover`. */
const DEFINITION = /^\.(-?[_a-zA-Z][\w-]*)(?::{1,2}[\w-]+(?:\([^)]*\))?)*$/;

/**
 * The 0.1 class names the project owns: it defines each in a stylesheet of
 * its own as a rule by itself (`.tabs__tab { … }`) and renders it in its own
 * markup (`className="tabs__tab"`, outside tests). Such a project most likely
 * has its own `.tabs__tab`, so findings on it are listed apart, as lower
 * confidence. A definition alone is not enough: an override of ui-common's
 * class (`.drawer__content { padding: 0 }`) looks the same.
 *
 * @param {Array<[string, string]>} files [relative path, content]
 * @returns {{ownClasses: Set<string>}}
 */
export function prepareScan(files) {
  const defined = new Set();
  /** @param {string} selectors */
  const collect = (selectors) => {
    for (const part of selectors.split(",")) {
      const m = DEFINITION.exec(part.trim());
      if (m && isLegacyClass(m[1])) defined.add(m[1]);
    }
  };
  for (const [file, source] of files) {
    if (file.endsWith(".css")) {
      try {
        postcss
          .parse(source, { from: file })
          .walkRules((rule) => collect(rule.selector));
      } catch {
        // unparseable: nothing defined
      }
    } else if (/\.(scss|sass|less)$/.test(file)) {
      for (const line of source.split("\n")) {
        const m = /^\s*([^{}/@]+?)\s*\{\s*$/.exec(line);
        if (m) collect(m[1]);
      }
    }
  }
  const own = new Set();
  if (defined.size === 0) return { ownClasses: own };
  const escape = (/** @type {string} */ c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|[\\s"'\`])(${[...defined].map(escape).join("|")})(?=[\\s"'\`]|$)`,
    "gm",
  );
  for (const [file, source] of files) {
    if (/\.(css|scss|sass|less)$/.test(file) || isTestFile(file)) continue;
    for (const m of source.matchAll(pattern)) own.add(m[1]);
  }
  return { ownClasses: own };
}

const ORIGIN = {
  "css-selector": "CSS selector",
  "dom-hook": "DOM hook",
  "test-query": "test query",
};

/**
 * @param {string} file relative path
 * @param {string} source final content
 * @param {{ownClasses?: Set<string>}} [context] from prepareScan
 * @returns {Finding[]}
 */
export function scanFile(file, source, context) {
  /** @type {Finding[]} */
  const findings = [];
  if (/\.(css|scss|sass|less)$/.test(file))
    findings.push(...scanStylesheet(file, source));
  else findings.push(...scanScript(file, source));

  findings.push(...scanTheme(file, source));
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
  const own = context?.ownClasses;
  for (const f of findings) {
    if (f.classes && own && f.classes.every((c) => own.has(c))) {
      f.detail = `${/** @type {Record<string, string>} */ (ORIGIN)[f.category]}: ${f.detail}`;
      f.category = "own-class";
    }
    delete f.classes;
  }
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
  theme: {
    title: "0.1 theme switches and theme selectors",
    help: '0.1 switched themes by stylesheet and `html[data-theme="orange-…"]`. In 0.2 `<Theme theme={lablupTheme} mode=…>` owns `html[data-theme]` and sets it to `light` or `dark`, so code that writes another value fights it, and selectors on another value never match.',
  },
  "own-class": {
    title: "0.1 class names your own CSS also defines (lower confidence)",
    help: "The same names as above, but your own stylesheets define each of them as a rule of its own (`.tabs__tab { … }`), so they most likely belong to markup you render, not to ui-common's. Skim them; most need nothing.",
  },
  "local-wrapper": {
    title: "Local wrappers around 0.1 components",
    help: "Your own component renders a 0.1 component and hands its props on, so it now renders the Astryx one. Its call sites pass the wrapper's props, which the upgrade does not rewrite: check the wrapper's props type and what it passes on against the Astryx component. A pure re-export (`export { Button } from …`) is not listed: its call sites were migrated.",
  },
  "stylesheet-path": {
    title: "0.1 stylesheet paths left in place",
    help: "Scripts, configs or tests that name `@lablup/ui-common/styles/*` directly. base.css and the orange themes are deprecated in 0.2 and removed in 0.3; the Lablup theme replaces them.",
  },
};
