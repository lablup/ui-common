/**
 * Run Astryx's own codemods on a ui-common consumer.
 *
 * Astryx codemods match `@astryxdesign/*` import specifiers; a ui-common
 * consumer imports the same modules as `@lablup/ui-common/*`. So each
 * transform sees the file with the specifiers swapped to Astryx's, and its
 * output is swapped back. Text the transform did not touch round-trips
 * unchanged, and a file it does not change is left alone.
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
      const swapped = toAstryxSpecifiers(file.source);
      const out = entry.transform(
        { path: file.path, source: swapped },
        { jscodeshift: api.jscodeshift, stats: () => {}, report: () => {} },
      );
      if (out == null || out === swapped) return undefined;
      return rewriteSpecifiers(out);
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
