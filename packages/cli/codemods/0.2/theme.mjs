/**
 * 0.1 -> 0.2 theming. 0.1 themed the page by stylesheet and attribute
 * (`styles/themes/orange-dark.css`, `html[data-theme="orange-dark"]`); 0.2
 * themes it with `<Theme theme={lablupTheme} mode=…>`, which owns
 * `html[data-theme]` and sets it to `light` or `dark` itself.
 *
 * - scanTheme reports what fights that: scripts that write `data-theme`,
 *   0.1 theme names, and selectors on any other `data-theme` value.
 * - ensureTheme wraps the app's root render in `<Theme>` when no module uses
 *   one and the root render is unambiguous (`createRoot(…).render(<App />)`);
 *   otherwise the report opens with the step.
 */
import { relative, sep } from "node:path";

import selectorParser from "postcss-selector-parser";

import { UIC } from "./map.mjs";
import { isTestFile } from "./scan.mjs";
import { findEntryScript } from "./stylesheets.mjs";

const MODES = new Set(["light", "dark"]);
export const THEME_IMPORT = { name: "Theme", source: UIC };
export const LABLUP_THEME_IMPORT = {
  name: "lablupTheme",
  source: `${UIC}/theme/lablup/built`,
};

const SCRIPT_ADVICE =
  '`<Theme>` sets `html[data-theme]` to "light" or "dark" itself: pass the mode as `<Theme theme={lablupTheme} mode="light" | "dark" | "system">` instead of writing the attribute.';
const SELECTOR_ADVICE =
  '`<Theme>` only ever sets `html[data-theme]` to "light" or "dark": select on `html[data-theme="dark"]` (or "light"), and put brand colours in the theme.';

/** @param {string} text @param {number} index */
function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

/**
 * @param {string} file relative path
 * @param {string} source
 * @returns {Array<{category: string, file: string, line: number, text: string, detail: string}>}
 */
export function scanTheme(file, source) {
  const findings = [];
  const lines = source.split("\n");
  /** @param {number} index @param {string} detail */
  const add = (index, detail) => {
    const line = lineAt(source, index);
    if (findings.some((f) => f.line === line)) return;
    findings.push({
      category: "theme",
      file,
      line,
      text: (lines[line - 1] ?? "").trim(),
      detail,
    });
  };

  if (/\.(css|scss|sass|less)$/.test(file)) {
    // Comments out, keeping offsets, so a line number still points at the rule.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
      .replace(/(^|[^:])\/\/[^\n]*/g, (c, head) =>
        file.endsWith(".css") ? c : `${head}${" ".repeat(c.length - head.length)}`,
      );
    // One finding per value and file: a theme sheet repeats its selector on
    // every rule.
    /** @type {Map<string, {index: number, count: number, detail: string}>} */
    const seen = new Map();
    for (const m of code.matchAll(
      /\[\s*data-theme\s*([~|^$*]?=)\s*(["']?)([^\]"']*)\2\s*\]/g,
    )) {
      if (m[1] === "=" && MODES.has(m[3])) continue;
      let ok = false;
      try {
        selectorParser((s) => {
          s.walkAttributes((a) => {
            if (a.attribute === "data-theme") ok = true;
          });
        }).processSync(m[0]);
      } catch {
        ok = true;
      }
      if (!ok) continue;
      const key = `${m[1]}${m[3]}`;
      const known = seen.get(key);
      if (known) known.count++;
      else
        seen.set(key, {
          index: m.index ?? 0,
          count: 1,
          detail: `data-theme ${m[1]} "${m[3]}"`,
        });
    }
    for (const { index, count, detail } of seen.values()) {
      add(
        index,
        `${detail}${count > 1 ? ` (${count} selectors in this file)` : ""}: ${SELECTOR_ADVICE}`,
      );
    }
    return findings;
  }

  const writes = [
    /\bdataset\s*(?:\.\s*theme|\[\s*["'`]theme["'`]\s*\])\s*=(?!=)\s*([^;\n]*)/g,
    /\bsetAttribute\(\s*["'`]data-theme["'`]\s*,\s*([^)\n]*)/g,
  ];
  for (const pattern of writes) {
    for (const m of source.matchAll(pattern)) {
      const value = m[1].trim();
      const literal = /^(["'`])([\w-]*)\1$/.exec(value);
      if (literal && MODES.has(literal[2])) continue;
      add(
        m.index ?? 0,
        `writes data-theme ${literal ? `"${literal[2]}"` : "from an expression"}. ${SCRIPT_ADVICE}`,
      );
    }
  }
  for (const m of source.matchAll(/(["'`])(orange-(?:light|dark))\1/g)) {
    add(m.index ?? 0, `0.1 theme name "${m[2]}". ${SCRIPT_ADVICE}`);
  }
  return findings;
}

/**
 * Whether a module imports `Theme` from ui-common (or Astryx).
 *
 * @param {string} source
 */
function usesTheme(source) {
  return /import\s*\{[^}]*\bTheme\b[^}]*\}\s*from\s*["'](@lablup\/ui-common|@astryxdesign\/core)[^"']*["']/.test(
    source,
  );
}

/**
 * The `root.render(<X />)` calls of a module: `createRoot(el).render(…)`,
 * `ReactDOM.createRoot(el).render(…)`, or `.render(…)` on a variable
 * initialised with one of those.
 *
 * @param {any} j
 * @param {any} root
 */
function rootRenders(j, root) {
  /** @param {any} node */
  const isCreateRoot = (node) => {
    if (node?.type !== "CallExpression") return false;
    const callee = node.callee;
    const name =
      callee.type === "Identifier"
        ? callee.name
        : callee.type === "MemberExpression" && callee.property.type === "Identifier"
          ? callee.property.name
          : null;
    return name === "createRoot";
  };
  const roots = new Set();
  root.find(j.VariableDeclarator).forEach((/** @type {any} */ p) => {
    if (p.node.id.type === "Identifier" && isCreateRoot(p.node.init))
      roots.add(p.node.id.name);
  });
  const calls = [];
  root.find(j.CallExpression).forEach((/** @type {any} */ p) => {
    const callee = p.node.callee;
    if (
      callee.type !== "MemberExpression" ||
      callee.property.type !== "Identifier" ||
      callee.property.name !== "render"
    )
      return;
    const object = callee.object;
    if (
      isCreateRoot(object) ||
      (object.type === "Identifier" && roots.has(object.name))
    )
      calls.push(p);
  });
  return calls;
}

/**
 * @param {any} el
 */
function isStrictMode(el) {
  const name = el.openingElement.name;
  return (
    (name.type === "JSXIdentifier" && name.name === "StrictMode") ||
    (name.type === "JSXMemberExpression" && name.property.name === "StrictMode")
  );
}

/**
 * Wrap the app's root render in `<Theme theme={lablupTheme}>`, once, when
 * no module of the project uses `<Theme>` and exactly one module renders a
 * root with a JSX element. Anything less clear-cut goes to the report.
 *
 * @param {any} ctx
 * @param {{jscodeshift: any}} api
 */
export function ensureTheme(ctx, api) {
  const pkg = ctx.pkg ?? {};
  if (pkg.peerDependencies?.[UIC] != null) return;
  if (!["dependencies", "devDependencies"].some((f) => pkg[f]?.[UIC] != null)) return;
  const rel = (/** @type {string} */ f) =>
    relative(ctx.projectDir, f).split(sep).join("/");
  // Tests render roots of their own; they are not the app's.
  const scripts = ctx
    .projectFiles()
    .filter(
      (/** @type {string} */ f) => /\.[cm]?[jt]sx?$/.test(f) && !isTestFile(rel(f)),
    );
  /** @type {Array<{file: string, text: string}>} */
  const candidates = [];
  for (const file of scripts) {
    const text = ctx.current(file);
    if (!text) continue;
    if (usesTheme(text)) return;
    if (/\bcreateRoot\b/.test(text) && /\.render\s*\(/.test(text))
      candidates.push({ file, text });
  }
  const how = `\`<Theme theme={lablupTheme}>\` (\`import { Theme } from "${THEME_IMPORT.source}"\`, \`import { lablupTheme } from "${LABLUP_THEME_IMPORT.source}"\`)`;
  const manual = (/** @type {string} */ why) =>
    ctx.alert(
      `**Wrap the app in ${how}.** ${why} Without it Astryx components get no theme; pass \`mode\` ("light" | "dark" | "system", the default) where the app switches colour schemes.`,
    );
  // Several roots (a second page, a verification harness): the one the
  // entry index.html loads is the app's.
  const entry = findEntryScript(ctx.projectDir, pkg)?.file;
  /** @type {string[]} */
  const others = [];
  if (candidates.length > 1 && entry && candidates.some((c) => c.file === entry)) {
    others.push(...candidates.filter((c) => c.file !== entry).map((c) => rel(c.file)));
    candidates.splice(
      0,
      candidates.length,
      ...candidates.filter((c) => c.file === entry),
    );
  }
  if (candidates.length !== 1) {
    manual(
      candidates.length === 0
        ? "No module uses `<Theme>`, and the upgrade found no `createRoot(…).render(…)` to wrap."
        : `No module uses \`<Theme>\`, and ${candidates.length} modules render a root (${candidates.map((c) => rel(c.file)).join(", ")}), so the upgrade did not pick one.`,
    );
    return;
  }
  const [{ file, text }] = candidates;
  const j = api.jscodeshift.withParser(/\.[cm]?tsx?$/.test(file) ? "tsx" : "babel");
  const root = j(text);
  const renders = rootRenders(j, root);
  const arg = renders.length === 1 ? renders[0].node.arguments[0] : null;
  if (!arg || arg.type !== "JSXElement") {
    manual(
      `${rel(file)} renders a root, but not as a single \`render(<App />)\` the upgrade can wrap safely.`,
    );
    return;
  }
  const bound = new Set();
  root.find(j.Identifier).forEach((/** @type {any} */ p) => bound.add(p.node.name));
  root.find(j.JSXIdentifier).forEach((/** @type {any} */ p) => bound.add(p.node.name));
  if (bound.has(THEME_IMPORT.name) || bound.has(LABLUP_THEME_IMPORT.name)) {
    manual(
      `${rel(file)} already uses the name Theme or lablupTheme for something else.`,
    );
    return;
  }

  // Edit the text at the parsed positions, so the rest of the file keeps
  // its formatting.
  const q = text.includes("from '") && !text.includes('from "') ? "'" : '"';
  /** @type {Array<[number, number, string]>} */
  const edits = [];
  /** @param {number} at */
  const indentAt = (at) =>
    /^[ \t]*/.exec(text.slice(text.lastIndexOf("\n", at - 1) + 1))?.[0] ?? "";
  /** @param {string} block @param {string} pad */
  const indent = (block, pad) =>
    block
      .split("\n")
      .map((l) => (l.trim() === "" ? l : `${pad}${l}`))
      .join("\n");
  if (isStrictMode(arg) && arg.closingElement) {
    const open = arg.openingElement.end;
    const close = arg.closingElement.start;
    const inner = text.slice(open, close);
    const first = inner.split("\n").find((l) => l.trim() !== "") ?? "";
    const pad = /^[ \t]*/.exec(first)?.[0] ?? "";
    const body = inner
      .trim()
      .split("\n")
      .map((l, i) => (i === 0 ? l : l.replace(new RegExp(`^${pad}`), "")))
      .join("\n");
    edits.push([
      open,
      close,
      `\n${pad}<Theme theme={lablupTheme}>\n${indent(body, `${pad}  `)}\n${pad}</Theme>\n${indentAt(close)}`,
    ]);
  } else {
    const pad = indentAt(arg.start);
    const body = text.slice(arg.start, arg.end);
    edits.push([
      arg.start,
      arg.end,
      `<Theme theme={lablupTheme}>\n${indent(body, `${pad}  `)}\n${pad}</Theme>`,
    ]);
  }
  const imports = root.find(j.ImportDeclaration).nodes();
  const after = imports.length > 0 ? imports[imports.length - 1].end : 0;
  const lines = [
    `import { ${THEME_IMPORT.name} } from ${q}${THEME_IMPORT.source}${q};`,
    `import { ${LABLUP_THEME_IMPORT.name} } from ${q}${LABLUP_THEME_IMPORT.source}${q};`,
  ];
  edits.push([
    after,
    after,
    after === 0 ? `${lines.join("\n")}\n` : `\n${lines.join("\n")}`,
  ]);
  let out = text;
  for (const [from, to, insert] of edits.sort((a, b) => b[0] - a[0]))
    out = `${out.slice(0, from)}${insert}${out.slice(to)}`;
  ctx.editFile(file, () => out, "theme");
  ctx.notice(
    `No module used \`<Theme>\`, so the upgrade wrapped the root render in ${rel(file)}${entry === file ? "" : " (not the entry index.html loads: check it is the app's root)"} in \`<Theme theme={lablupTheme}>\`.${others.length > 0 ? ` ${others.join(", ")} also render${others.length === 1 ? "s" : ""} a root; wrap ${others.length === 1 ? "it" : "them"} too if ${others.length === 1 ? "it renders" : "they render"} ui-common components.` : ""} Its mode defaults to "system"; pass \`mode="light" | "dark"\` where the app switches colour schemes (see "0.1 theme switches and theme selectors").`,
  );
}
