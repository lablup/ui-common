/**
 * Run Astryx's own codemods on a ui-common consumer.
 *
 * Astryx codemods match `@astryxdesign/*` import specifiers; a ui-common
 * consumer imports the same modules as `@lablup/ui-common/*`. So each
 * transform sees the file with the module specifiers swapped to Astryx's, and
 * its output's module specifiers are swapped back. Only specifiers are
 * swapped (imports, re-exports, `import()`, `require()`): a comment or string
 * that names either package is left as written. A file the transform does not
 * change is left alone.
 *
 * `codemods/<ui-common version>/upstream.json` (written by
 * `ui-common sync-astryx`) names the Astryx version range and codemod ids.
 */
import { importAstryxInternal } from "../cli/paths.mjs";
import { rewriteSpecifiers } from "../cli/rewrite.mjs";

const DEFAULT_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"];

/**
 * `@lablup/ui-common/…` -> the `@astryxdesign/…` specifier Astryx's codemods
 * look for. The inverse is rewriteSpecifiers.
 *
 * @param {string} text
 */
export function toAstryxSpecifiers(text) {
  return text
    .replace(/@lablup\/ui-common\/lab(?=[/"'`\s),;:]|$)/g, "@astryxdesign/lab")
    .replace(
      /@lablup\/ui-common\/theme\/neutral(?=[/"'`\s),;:]|$)/g,
      "@astryxdesign/theme-neutral",
    )
    .replace(/@lablup\/ui-common(?=[/"'`\s),;:]|$)/g, "@astryxdesign/core");
}

/**
 * Apply `swap` to the module specifier strings of a script and nothing else.
 * A source jscodeshift cannot parse (a stylesheet an Astryx codemod targets)
 * is swapped as a whole.
 *
 * @param {any} j
 * @param {string} source
 * @param {(text: string) => string} swap
 */
export function swapModuleSpecifiers(j, source, swap) {
  let root;
  try {
    root = j(source);
  } catch {
    return swap(source);
  }
  /** @type {Array<{start: number, end: number}>} */
  const ranges = [];
  const add = (/** @type {any} */ node) => {
    const isString =
      node?.type === "StringLiteral" ||
      (node?.type === "Literal" && typeof node.value === "string");
    if (isString && typeof node.start === "number" && typeof node.end === "number")
      ranges.push({ start: node.start, end: node.end });
  };
  root.find(j.ImportDeclaration).forEach((/** @type {any} */ p) => add(p.node.source));
  root
    .find(j.ExportNamedDeclaration)
    .forEach((/** @type {any} */ p) => add(p.node.source));
  root
    .find(j.ExportAllDeclaration)
    .forEach((/** @type {any} */ p) => add(p.node.source));
  root.find(j.CallExpression).forEach((/** @type {any} */ p) => {
    const callee = p.node.callee;
    const isImport = callee.type === "Import";
    const isRequire = callee.type === "Identifier" && callee.name === "require";
    if (isImport || isRequire) add(p.node.arguments[0]);
  });
  if (j.ImportExpression)
    root.find(j.ImportExpression).forEach((/** @type {any} */ p) => add(p.node.source));
  if (j.TSImportType)
    root.find(j.TSImportType).forEach((/** @type {any} */ p) => {
      add(p.node.argument?.literal ?? p.node.argument);
    });
  let out = source;
  for (const { start, end } of ranges.sort((a, b) => b.start - a.start)) {
    out = `${out.slice(0, start)}${swap(out.slice(start, end))}${out.slice(end)}`;
  }
  return out;
}

/**
 * @typedef {{astryx: {from: string, to: string}, codemods: Array<{id: string, version: string, title?: string}>}} UpstreamManifest
 */

/**
 * @param {{name: string, transform: Function, meta: {title: string, fileExtensions?: string[], codemodType?: string}}} entry
 * @param {string} version Astryx version the codemod belongs to
 * @returns {import('./registry.mjs').Transform}
 */
export function wrapAstryxTransform(entry, version) {
  const extensions = entry.meta.fileExtensions ?? DEFAULT_EXTENSIONS;
  return {
    id: `astryx:${entry.name}`,
    title: `Astryx ${version}: ${entry.meta.title}`,
    extensions,
    parse: extensions.some((e) => DEFAULT_EXTENSIONS.includes(e)),
    run(file, api) {
      const j = api.jscodeshift;
      const swapped = swapModuleSpecifiers(j, file.source, toAstryxSpecifiers);
      const out = entry.transform(
        { path: file.path, source: swapped },
        { jscodeshift: j, stats: () => {}, report: () => {} },
      );
      if (out == null || out === swapped) return undefined;
      return swapModuleSpecifiers(j, out, rewriteSpecifiers);
    },
  };
}

/**
 * @param {UpstreamManifest} manifest
 * @returns {Promise<import('./registry.mjs').Step>}
 */
export async function upstreamStep(manifest) {
  const { getTransformsBetween } = await importAstryxInternal(
    "assets/codemods/registry.mjs",
  );
  const groups = await getTransformsBetween(manifest.astryx.from, manifest.astryx.to);
  /** @type {Map<string, {entry: any, version: string}>} */
  const byName = new Map();
  for (const group of groups) {
    for (const entry of group.transforms)
      byName.set(entry.name, { entry, version: group.version });
  }
  const notes = [];
  /** @type {import('./registry.mjs').Transform[]} */
  const transforms = [];
  for (const codemod of manifest.codemods) {
    const found = byName.get(codemod.id);
    if (!found) {
      notes.push(
        `Astryx codemod "${codemod.id}" (${codemod.version}) is not in the installed @astryxdesign/cli; run it by hand if you use what it migrates.`,
      );
      continue;
    }
    if (found.entry.meta?.codemodType === "config") {
      notes.push(
        `Astryx codemod "${codemod.id}" edits astryx.config.*; run \`ui-common astryx upgrade\` if you keep one.`,
      );
      continue;
    }
    transforms.push(wrapAstryxTransform(found.entry, found.version));
  }
  return {
    title: `Astryx ${manifest.astryx.from} → ${manifest.astryx.to} codemods`,
    transforms,
    notes,
  };
}
