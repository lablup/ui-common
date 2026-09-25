/**
 * The 0.1 -> 0.2 codemods' view of `migration/0.1-to-0.2.json`, the one
 * machine-readable account of what 0.2 removed, renamed and restyled. The
 * codemods read their data from it and from nowhere else; this module only
 * reshapes it into lookups.
 */
import { join } from "node:path";

import { ownPackageJson, PACKAGE_ROOT, readJson } from "../../cli/paths.mjs";

export const UIC = "@lablup/ui-common";
export const MIGRATION_FILE = join(PACKAGE_ROOT, "migration", "0.1-to-0.2.json");

/**
 * @typedef {object} PropRename
 * @property {string} from
 * @property {string} to
 * @property {string} [kind] children-to-prop | signature-change | value-map
 * @property {string} [onlyWhen]
 * @property {string} [value]
 * @property {string} [note]
 *
 * @typedef {object} RemovedSpec
 * @property {string} name
 * @property {Array<{specifier: string, names: string[]}>} oldImports
 * @property {{specifier: string, names: Record<string, string>}} replacement
 * @property {Array<{specifier: string, names: Record<string, string>, when: string}>} alternatives
 * @property {PropRename[]} propRenames
 * @property {Record<string, Record<string, string|number|null>>} valueMaps
 * @property {Array<{from: string, to: string, kind?: string}>} [columnRenames]
 * @property {Record<string, string>} [requiresPackages]
 * @property {Record<string, {whenState: string[], value: unknown}>} [defaultsToMaterialize]
 * @property {string[]} manual
 */

/** @type {{removedComponents: RemovedSpec[], keptComponents: Array<{name: string, specifiers: string[], classRenames: Record<string, string>, notes: string[]}>, movedExports?: Array<{name: string, from: string, to: string, note: string}>, shapeClassRenames: Record<string, string|null>, stylesheets: Array<{specifier: string, replaceWith: null | {layerOrder: string, imports: string[]}, note?: string}>}} */
export const migration = readJson(MIGRATION_FILE);

/** `@lablup/ui-common/Badge` -> `Badge`; the root -> "". @param {string} specifier */
export function subpathOf(specifier) {
  return specifier === UIC ? "" : specifier.slice(UIC.length + 1);
}

/**
 * @typedef {object} Removed
 * @property {string} name 0.1 component
 * @property {string} to Astryx component
 * @property {string} subpath where `to` lives under @lablup/ui-common
 * @property {Record<string, string|null>} types 0.1 type -> Astryx type, or null
 * @property {Record<string, string>} alternates alternative component -> subpath
 * @property {Record<string, string>} requiresPackages
 * @property {RemovedSpec} spec the raw entry
 */

/** @type {Map<string, Removed>} */
export const REMOVED = new Map();
/** @type {Map<string, {component: string, to: string|null}>} */
export const REMOVED_TYPES = new Map();

for (const spec of migration.removedComponents) {
  const names = spec.replacement.names;
  /** @type {Record<string, string|null>} */
  const types = {};
  for (const imp of spec.oldImports) {
    for (const name of imp.names) {
      if (name === spec.name || name === "default") continue;
      types[name] = names[name] ?? null;
    }
  }
  /** @type {Record<string, string>} */
  const alternates = {};
  for (const alt of spec.alternatives ?? []) {
    const component = alt.names[spec.name];
    if (component) alternates[component] = subpathOf(alt.specifier);
  }
  REMOVED.set(spec.name, {
    name: spec.name,
    to: names[spec.name],
    subpath: subpathOf(spec.replacement.specifier),
    types,
    alternates,
    requiresPackages: spec.requiresPackages ?? {},
    spec,
  });
  for (const [type, to] of Object.entries(types)) {
    REMOVED_TYPES.set(type, { component: spec.name, to });
  }
}

/** Exports that stay but move to another subpath. */
export const MOVED = new Map((migration.movedExports ?? []).map((m) => [m.name, m]));

const baseEntry = migration.stylesheets.find((s) => s.specifier.endsWith("/base.css"));
const themesEntry = migration.stylesheets.find((s) => s.specifier.includes("/themes/"));
if (!baseEntry?.replaceWith) {
  throw new Error(`${MIGRATION_FILE}: no styles/base.css entry with replaceWith.`);
}

export const STYLESHEETS = {
  base: baseEntry.specifier,
  layerOrder: baseEntry.replaceWith.layerOrder,
  imports: baseEntry.replaceWith.imports,
  /** The dropped theme sheets: the `*` in the specifier matches one path segment. */
  dropped: new RegExp(
    `^${(themesEntry?.specifier ?? "@lablup/ui-common/styles/themes/*.css")
      .replace(/[.+?^${}()|[\]\\/]/g, "\\$&")
      .replace("*", "[^/]+")}$`,
  ),
  /** What the codemod writes beside a script that imported base.css. */
  entryFile: "ui-common-entry.css",
};

export const LAB_PACKAGE = "@astryxdesign/lab";
export const LAB_CSS = `${UIC}/lab/lab.css`;

/** The StyleX peer range ui-common itself declares. */
export function stylexPeer() {
  return {
    name: "@stylexjs/stylex",
    range: ownPackageJson().peerDependencies?.["@stylexjs/stylex"] ?? "^0.19.0",
  };
}

/**
 * The first `manual` note of a removed component that mentions `word`.
 *
 * @param {Removed} removed
 * @param {string} word a prop name or value
 */
export function manualNote(removed, word) {
  const pattern = new RegExp(
    `(^|[^\\w-])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\w-]|$)`,
  );
  return removed.spec.manual.find((m) => pattern.test(m)) ?? null;
}

/**
 * Where a kept component's 0.1 class name went, by `classRenameRule`:
 * an explicit key wins, else `.<block>`, `.<block>__x` and `.<block>--x`
 * move to the renamed block with the same suffix. `shapeClassRenames` covers
 * the base skeleton shape the composites share.
 *
 * @param {string} name a 0.1 class name
 * @returns {{to: string | null} | null} null when no kept component owned it
 */
export function keptClassRename(name) {
  /** @type {Record<string, string|null>} */
  const explicit = { ...migration.shapeClassRenames };
  /** @type {Array<[string, string]>} */
  const blocks = [];
  for (const kept of migration.keptComponents) {
    for (const [from, to] of Object.entries(kept.classRenames)) {
      explicit[from] = to;
      blocks.push([from, to]);
    }
  }
  if (name in explicit) return { to: explicit[name] };
  let best = null;
  for (const [block, to] of blocks) {
    if (
      name === block ||
      name.startsWith(`${block}__`) ||
      name.startsWith(`${block}--`)
    ) {
      if (!best || block.length > best[0].length) best = [block, to];
    }
  }
  if (!best) return null;
  return { to: `${best[1]}${name.slice(best[0].length)}` };
}
