/**
 * 0.1 -> 0.2 stylesheet entry points.
 *
 * - `@lablup/ui-common/styles/base.css` becomes the layer-order statement plus
 *   Astryx's reset and component sheets, the Lablup theme, ui-common's global
 *   sheet and the deprecated `legacy-tokens.css` bridge.
 *   - In a stylesheet the `@import` is replaced in place, and the `@layer`
 *     statement goes first in the file (in SCSS, after the leading
 *     `@use`/`@forward` rules, which Sass requires above every other rule).
 *   - In a script (`import "@lablup/ui-common/styles/base.css"`) a CSS
 *     `@layer` statement cannot be expressed, so the import is pointed at a
 *     new `ui-common-entry.css` beside the script, which holds all of it.
 * - `styles/themes/orange-{light,dark}.css` imports are dropped: the Lablup
 *   theme covers both colour schemes.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

import postcss from "postcss";

import { TODO_TAG } from "../lib/jsx.mjs";
import { addTodo, printSource } from "../lib/todo.mjs";
import { LAB_CSS, LAB_PACKAGE, STYLESHEETS, UIC } from "./map.mjs";

const { base, layerOrder, imports: replacement, entryFile } = STYLESHEETS;
const DROPPED = STYLESHEETS.dropped;

/**
 * The stylesheets that replace base.css. lab.css joins them when a Drawer was
 * moved to the lab package.
 *
 * @param {{flags?: {packages: Map<string, string>}}} ctx
 * @returns {string[]}
 */
function replacementFor(ctx) {
  return ctx.flags?.packages.has(LAB_PACKAGE) ? [...replacement, LAB_CSS] : replacement;
}

/** @param {{flags?: {packages: Map<string, string>}}} ctx */
export const entryCss = (ctx) => `/*
 * The @lablup/ui-common stylesheet entry, written by \`ui-common upgrade\` in
 * place of the 0.1 styles/base.css import. Keep it first among your
 * stylesheets: the @layer statement fixes the cascade order for everything
 * loaded after it. legacy-tokens.css keeps --token-* reads resolving and is
 * removed in 0.3.
 */
${layerOrder}

${replacementFor(ctx)
  .map((r) => `@import "${r}";`)
  .join("\n")}
`;

/**
 * The URL an `@import` names, and whatever follows it (layer(), media).
 *
 * @param {string} params
 */
function parseImport(params) {
  const match = /^\s*(?:url\(\s*)?(["']?)([^"')\s]+)\1\s*\)?\s*(.*)$/.exec(params);
  if (!match) return null;
  return { url: match[2], rest: match[3].trim() };
}

/** @param {string} text */
function todoComment(text) {
  return postcss.comment({ text: `${TODO_TAG}: ${text}` });
}

/**
 * Plain CSS, through postcss.
 *
 * @param {string} source
 * @param {string} path
 */
function transformCss(source, path, ctx) {
  const urls = replacementFor(ctx);
  const root = postcss.parse(source, { from: path });
  let changed = false;
  let replacedBase = false;
  root.walkAtRules("import", (rule) => {
    const parsed = parseImport(rule.params);
    if (!parsed) return;
    if (DROPPED.test(parsed.url)) {
      const next = rule.next();
      if (next && rule.raws.before !== undefined) next.raws.before = rule.raws.before;
      rule.remove();
      changed = true;
      return;
    }
    if (parsed.url !== base) return;
    if (parsed.rest) {
      const comment = todoComment(
        `this import of styles/base.css carries "${parsed.rest}"; replace it with ${urls.join(", ")} under the same condition, and declare "${layerOrder}" first.`,
      );
      const previous = rule.prev();
      if (previous?.type === "comment" && previous.text === comment.text) return;
      rule.before(comment);
      changed = true;
      return;
    }
    changed = true;
    const nodes = urls.map((url, i) => {
      const node = postcss.atRule({ name: "import", params: `"${url}"` });
      node.raws.before = i === 0 ? (rule.raws.before ?? "") : "\n";
      return node;
    });
    rule.replaceWith(nodes);
    replacedBase = true;
  });

  if (replacedBase) {
    const hasOrder = (root.nodes ?? []).some(
      (n) => n.type === "atrule" && n.name === "layer" && !n.nodes,
    );
    if (hasOrder) {
      root.prepend(
        todoComment(
          `this stylesheet already declares a layer order; it must match "${layerOrder}".`,
        ),
      );
    } else {
      const layer = postcss.atRule({
        name: "layer",
        params: layerOrder.replace(/^@layer\s+|;$/g, ""),
      });
      const first = root.first;
      const afterCharset = first?.type === "atrule" && first.name === "charset";
      if (afterCharset) {
        layer.raws.before = "\n";
        first.after(layer);
        const next = layer.next();
        if (next) next.raws.before = "\n\n";
      } else {
        layer.raws.before = "";
        if (first)
          first.raws.before = `\n\n${(first.raws.before ?? "").replace(/^\n+/, "")}`;
        root.prepend(layer);
      }
    }
  }
  if (!changed) return undefined;
  return root.toString();
}

/**
 * Where the leading run of statements Sass requires first ends: `@charset`,
 * `@use`, `@forward`, and the variable declarations that may configure them,
 * with the comments between them. Returns 0 when there is none. Sass rejects
 * any other rule, a CSS `@layer` statement included, above an `@use`.
 *
 * @param {string} source
 */
function sassPreludeEnd(source) {
  let i = 0;
  let end = 0;
  const skipSpaceAndComments = () => {
    for (;;) {
      const rest = source.slice(i);
      const space = /^\s+/.exec(rest);
      if (space) i += space[0].length;
      else if (rest.startsWith("//")) {
        const nl = source.indexOf("\n", i);
        i = nl === -1 ? source.length : nl + 1;
      } else if (rest.startsWith("/*")) {
        const close = source.indexOf("*/", i + 2);
        i = close === -1 ? source.length : close + 2;
      } else return;
    }
  };
  for (;;) {
    skipSpaceAndComments();
    if (!/^(?:@(?:charset|use|forward)\b|\$[\w-]+\s*:)/.test(source.slice(i))) break;
    // To the `;` that ends the statement, outside strings and parentheses
    // (`@use "x" with ($a: 1, $b: 2);` spans lines).
    let depth = 0;
    /** @type {string | null} */
    let quote = null;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (quote) {
        if (ch === "\\") i++;
        else if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === ";" && depth <= 0) break;
    }
    if (i >= source.length) break;
    i += 1;
    end = i;
  }
  return end;
}

/**
 * Sass and Less: postcss cannot parse them, and the imports in question are
 * single lines, so rewrite the lines. The layer order goes first, or in SCSS
 * right after the `@use`/`@forward` prelude.
 *
 * @param {string} source
 * @param {string} path
 */
function transformPreprocessed(source, path, ctx) {
  const urls = replacementFor(ctx);
  const importLine =
    /^([ \t]*)@import\s+(?:url\()?["']([^"']+)["']\)?\s*;[ \t]*\r?\n?/gm;
  let replacedBase = false;
  const out = source.replace(importLine, (line, indent, url) => {
    if (DROPPED.test(url)) return "";
    if (url !== base) return line;
    replacedBase = true;
    return urls.map((r) => `${indent}@import "${r}";\n`).join("");
  });
  if (out === source) return undefined;
  if (!replacedBase || /^\s*@layer\s+[^{]+;/m.test(out)) return out;
  const at = path.endsWith(".scss") ? sassPreludeEnd(out) : 0;
  if (at === 0) return `${layerOrder}\n\n${out}`;
  return `${out.slice(0, at)}\n\n${layerOrder}\n\n${out.slice(at).replace(/^[ \t]*\r?\n+/, "")}`;
}

export const cssMeta = {
  id: "stylesheet-entry",
  title:
    "Replace styles/base.css with the 0.2 stylesheet set; drop the orange theme sheets",
  extensions: [".css", ".scss", ".sass", ".less"],
};

/**
 * @param {{source: string, path: string}} file
 * @param {unknown} _api
 * @param {{flags?: {packages: Map<string, string>}}} ctx
 */
export function transformStylesheet(file, _api, ctx) {
  if (!file.source.includes("@lablup/ui-common/styles/")) return undefined;
  if (file.path.endsWith(".css")) return transformCss(file.source, file.path, ctx);
  return transformPreprocessed(file.source, file.path, ctx);
}

const STYLESHEET = /\.(css|scss|sass|less)(\?.*)?$/;

/**
 * Whether an import has to come after the stylesheet entry: a stylesheet
 * (the entry's `@layer` statement must be the first one the page sees), a
 * @lablup/ui-common module (its components' styles), or a module of the
 * project's own, which loads both.
 *
 * @param {string} source
 */
function loadsStyles(source) {
  return (
    STYLESHEET.test(source) ||
    source === UIC ||
    source.startsWith(`${UIC}/`) ||
    source.startsWith(".") ||
    source.startsWith("/")
  );
}

/**
 * Put the import of `specifier` before every import that loads styles, or
 * add it there: after the last import that does not, else first. Vite
 * injects stylesheets in import order, and the `@layer` order statement only
 * holds if it comes first.
 *
 * @param {any} j
 * @param {any} root
 * @param {string} specifier
 * @returns {boolean} whether anything moved or was added
 */
export function placeEntryImport(j, root, specifier) {
  const program = root.find(j.Program).get().node;
  const body = program.body;
  const isImport = (/** @type {any} */ n) => n.type === "ImportDeclaration";
  const existing = body.find(
    (/** @type {any} */ n) => isImport(n) && n.source.value === specifier,
  );
  const first = body.find(
    (/** @type {any} */ n) =>
      isImport(n) && n !== existing && loadsStyles(String(n.source.value)),
  );
  if (existing) {
    if (!first || body.indexOf(existing) < body.indexOf(first)) return false;
    body.splice(body.indexOf(existing), 1);
  }
  const decl = existing ?? j.importDeclaration([], j.stringLiteral(specifier));
  if (first) {
    const at = body.indexOf(first);
    // A header comment on the first import stays on top.
    if (at === 0 && first.comments?.length) {
      decl.comments = [...first.comments, ...(decl.comments ?? [])];
      first.comments = [];
    }
    body.splice(at, 0, decl);
    return true;
  }
  let last = -1;
  body.forEach((/** @type {any} */ n, /** @type {number} */ i) => {
    if (isImport(n)) last = i;
  });
  body.splice(last + 1, 0, decl);
  return true;
}

export const jsMeta = {
  id: "script-stylesheet-imports",
  title:
    "Point script imports of styles/base.css at a generated ui-common-entry.css; drop the orange theme imports",
  extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".mts", ".cts"],
};

/**
 * @param {{source: string, path: string}} file
 * @param {{jscodeshift: any}} api
 * @param {{createFile: (path: string, content: string) => string, flags: {packages: Map<string, string>}}} ctx
 */
export function transformScriptImports(file, api, ctx) {
  if (!file.source.includes("@lablup/ui-common/styles/")) return undefined;
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;
  const entrySpecifier = `./${entryFile}`;
  const alreadyImportsEntry =
    root.find(j.ImportDeclaration, { source: { value: entrySpecifier } }).size() > 0;
  /** @type {string[]} */
  const entryImports = [];

  root.find(j.ImportDeclaration).forEach((/** @type {any} */ path) => {
    const source = path.node.source.value;
    if (typeof source !== "string") return;
    if (DROPPED.test(source)) {
      const comments = path.node.comments;
      path.prune();
      if (comments?.length) {
        const program = root.find(j.Program).get().node;
        if (program.body[0])
          program.body[0].comments = [...comments, ...(program.body[0].comments ?? [])];
      }
      changed = true;
      return;
    }
    if (source !== base) return;
    changed = true;
    if (alreadyImportsEntry) {
      path.prune();
      return;
    }
    // createFile never overwrites: it hands back the file it will write,
    // which is a numbered sibling when the project has its own entry there.
    const entry = ctx.createFile(join(dirname(file.path), entryFile), entryCss(ctx));
    path.node.source = j.stringLiteral(`./${basename(entry)}`);
    entryImports.push(`./${basename(entry)}`);
  });
  for (const specifier of entryImports) placeEntryImport(j, root, specifier);

  root.find(j.CallExpression).forEach((/** @type {any} */ path) => {
    const node = path.node;
    if (node.callee.type !== "Import") return;
    const source = node.arguments[0]?.value;
    if (typeof source !== "string" || !source.startsWith("@lablup/ui-common/styles/"))
      return;
    changed = true;
    addTodo(
      j,
      path,
      `${source} is deprecated in 0.2 and removed in 0.3. Switch themes with <Theme theme={…}>, not by swapping stylesheets.`,
    );
  });

  if (!changed) return undefined;
  const out = printSource(j, root, {
    quote: file.source.includes("from '") ? "single" : "double",
  });
  return file.source.endsWith("\n") && !out.endsWith("\n") ? `${out}\n` : out;
}

/** What loading the 0.2 stylesheets looks like, in a script or a stylesheet. */
const WIRED = new RegExp(
  [...replacement, `${UIC}/styles/`, entryFile.replace(/\.css$/, "")]
    .map((r) => r.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"))
    .join("|"),
);

/**
 * The app's entry script: the module script `index.html` loads, else the
 * package's `main`, else the usual `src/main.*` / `src/index.*`.
 *
 * @param {string} projectDir
 * @param {any} pkg
 * @returns {{file: string, how: string} | null}
 */
export function findEntryScript(projectDir, pkg) {
  const html = join(projectDir, "index.html");
  if (existsSync(html)) {
    const text = readFileSync(html, "utf8");
    for (const tag of text.matchAll(/<script\b[^>]*>/gi)) {
      const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag[0])?.[1];
      if (!src || /^[a-z]+:|^\/\//i.test(src)) continue;
      if (!/type\s*=\s*["']module["']/i.test(tag[0]) && !/\.[cm]?[jt]sx?$/.test(src))
        continue;
      const file = src.startsWith("/")
        ? join(projectDir, src.replace(/^\/+/, ""))
        : resolve(projectDir, src);
      if (existsSync(file)) return { file, how: "the module script index.html loads" };
    }
  }
  const main = typeof pkg?.main === "string" ? resolve(projectDir, pkg.main) : null;
  if (
    main &&
    /\.[cm]?[jt]sx?$/.test(main) &&
    existsSync(main) &&
    !relative(projectDir, main)
      .split(sep)
      .some((d) => ["dist", "build", "out"].includes(d))
  )
    return { file: main, how: "package.json main" };
  for (const name of ["main", "index"]) {
    for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
      const file = join(projectDir, "src", `${name}${ext}`);
      if (existsSync(file)) return { file, how: `the conventional entry` };
    }
  }
  return null;
}

/**
 * A 0.1 app that never imported styles/base.css relied on each component
 * loading its own CSS; 0.2 components load none, so after the upgrade
 * nothing would load Astryx's stylesheets or the theme. When no file of the
 * project loads them, write the same ui-common-entry.css the base.css
 * rewrite writes beside the app's entry script and import it there, first.
 * With no entry to be found, the report opens with the manual step.
 * Libraries are left alone: the app that uses them loads the stylesheets.
 *
 * @param {any} ctx
 * @param {{jscodeshift: any}} api
 */
export function wireStylesheets(ctx, api) {
  const pkg = ctx.pkg ?? {};
  if (pkg.peerDependencies?.[UIC] != null) return;
  const declared = ["dependencies", "devDependencies"].some(
    (f) => pkg[f]?.[UIC] != null,
  );
  if (!declared) return;
  for (const file of ctx.projectFiles()) {
    const text = ctx.current(file);
    if (text && WIRED.test(text)) return;
  }
  const rel = (/** @type {string} */ f) =>
    relative(ctx.projectDir, f).split(sep).join("/");
  const entry = findEntryScript(ctx.projectDir, pkg);
  if (!entry) {
    ctx.alert(
      `**Load @lablup/ui-common's stylesheets.** Nothing in this project loads them, and the upgrade found no entry script to import them from (no index.html module script, package.json \`main\`, or \`src/main.*\` / \`src/index.*\`). 0.1 components loaded their own CSS; 0.2 components load none, so the app renders unstyled until its entry stylesheet starts with: \`${[layerOrder, ...replacement.map((r) => `@import "${r}";`)].join(" ")}\``,
    );
    return;
  }
  const j = api.jscodeshift.withParser(
    /\.[cm]?tsx?$/.test(entry.file) ? "tsx" : "babel",
  );
  const cssFile = ctx.createFile(join(dirname(entry.file), entryFile), entryCss(ctx));
  const specifier = `./${basename(cssFile)}`;
  ctx.editFile(
    entry.file,
    (/** @type {string | null} */ current) => {
      if (current == null) return undefined;
      const root = j(current);
      if (!placeEntryImport(j, root, specifier)) return undefined;
      const out = root.toSource({
        quote: current.includes("from '") ? "single" : "double",
      });
      return current.endsWith("\n") && !out.endsWith("\n") ? `${out}\n` : out;
    },
    "stylesheet-entry",
  );
  ctx.notice(
    `No file loaded @lablup/ui-common's stylesheets (0.1 components loaded their own CSS; 0.2's load none), so the upgrade wrote ${rel(cssFile)} and imported it first in ${rel(entry.file)} (${entry.how}). Move the import if your app loads its stylesheets elsewhere.`,
  );
}
