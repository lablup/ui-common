/**
 * Where things live. Two packages are involved, and they are found apart:
 *
 * - The CLI's own package, @lablup/ui-common-cli: the Astryx CLI it pins,
 *   jscodeshift, the codemods and the migration map.
 * - The @lablup/ui-common package the CLI works for: its version, its export
 *   lists (exports.exclude.json, exports.customs.json) and the Astryx packages
 *   it pins (core, theme-neutral, lab). A consumer depends on ui-common, so
 *   under pnpm's isolated layout those are reachable from ui-common's install
 *   location and not from the consumer's own directory.
 *
 * Nothing is resolved from the working directory except the project's own
 * @lablup/ui-common.
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const UI_COMMON = "@lablup/ui-common";

/** Root of the installed @lablup/ui-common-cli package. */
export const CLI_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string} file */
export function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** @returns {{name: string, version: string, dependencies?: Record<string,string>, peerDependencies?: Record<string,string>}} */
export function cliPackageJson() {
  return readJson(join(CLI_ROOT, "package.json"));
}

/**
 * The @lablup/ui-common package root `fromDir` resolves, or null. Its
 * `exports` map lists `./package.json`, so this works from a consumer, from
 * the CLI package (its peer) and, by self-reference, from this repository.
 *
 * @param {string} fromDir
 */
function resolveUiCommonFrom(fromDir) {
  try {
    const req = createRequire(join(fromDir, "package.json"));
    return dirname(req.resolve(`${UI_COMMON}/package.json`));
  } catch {
    return null;
  }
}

/**
 * Root of the @lablup/ui-common a command works on: the project's own install
 * first, so the CLI reads the ui-common the project actually has, then the one
 * beside the CLI (its peer, which a `pnpm dlx` run installs).
 *
 * @param {string} [cwd]
 */
export function uiCommonRoot(cwd = process.cwd()) {
  const project = findProjectDir(cwd);
  const dir =
    (project && resolveUiCommonFrom(project)) ?? resolveUiCommonFrom(CLI_ROOT);
  if (!dir) {
    throw new Error(
      `${UI_COMMON} is not installed. Add it to the project (the CLI is @lablup/ui-common-cli, a devDependency next to it).`,
    );
  }
  return dir;
}

/**
 * Root of the @lablup/ui-common this CLI release ships with: its peer, at the
 * same version. `upgrade` reads its target's pins from here, since the project
 * may still be on the version it is upgrading from. Falls back to the
 * project's when the peer is not reachable from the CLI.
 *
 * @param {string} [cwd]
 */
export function targetUiCommonRoot(cwd = process.cwd()) {
  return resolveUiCommonFrom(CLI_ROOT) ?? uiCommonRoot(cwd);
}

/**
 * package.json of the @lablup/ui-common a command works on (see uiCommonRoot).
 *
 * @param {string} [root]
 * @returns {{name: string, version: string, dependencies?: Record<string,string>, peerDependencies?: Record<string,string>, devDependencies?: Record<string,string>}}
 */
export function uiCommonPackageJson(root = uiCommonRoot()) {
  return readJson(join(root, "package.json"));
}

/** Walk up from a resolved file to the directory holding its package.json. */
function packageDirOf(file, name) {
  let dir = dirname(file);
  for (;;) {
    const pkg = join(dir, "package.json");
    if (existsSync(pkg)) {
      try {
        if (readJson(pkg).name === name) return dir;
      } catch {
        // keep walking
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * The directory of a package as `fromDir` resolves it, or null. Resolution
 * goes through the package's main entry, because not every Astryx package
 * exports its package.json.
 *
 * @param {string} name
 * @param {string} fromDir
 */
function packageDirFrom(name, fromDir) {
  try {
    const req = createRequire(join(fromDir, "package.json"));
    return packageDirOf(req.resolve(name), name);
  } catch {
    return null;
  }
}

/**
 * The directory of a dependency of @lablup/ui-common (an Astryx package it
 * pins), or null.
 *
 * @param {string} name
 * @param {string} [root] the ui-common root to resolve from
 */
export function dependencyDir(name, root) {
  let from = root;
  if (!from) {
    try {
      from = uiCommonRoot();
    } catch {
      return null;
    }
  }
  return packageDirFrom(name, from);
}

/**
 * The directory of a dependency of the CLI package itself, or null.
 *
 * @param {string} name
 */
export function cliDependencyDir(name) {
  return packageDirFrom(name, CLI_ROOT);
}

/** Root of the exact-pinned @astryxdesign/cli. */
export function astryxCliRoot() {
  const dir = cliDependencyDir("@astryxdesign/cli");
  if (!dir) {
    throw new Error(
      "@astryxdesign/cli is not installed next to @lablup/ui-common-cli. Reinstall @lablup/ui-common-cli.",
    );
  }
  return dir;
}

/** The `astryx` bin script of the pinned CLI. */
export function astryxBin() {
  const root = astryxCliRoot();
  const bin = readJson(join(root, "package.json")).bin?.astryx;
  return join(root, bin ?? "clients/cli/bin/astryx.mjs");
}

/**
 * Import a module file from inside the pinned Astryx CLI. These are internals,
 * not the CLI's public API; the pin is exact and `sync-astryx` re-runs the
 * tests that use them on every bump.
 *
 * @param {string} relative path under the CLI root
 */
export async function importAstryxInternal(relative) {
  const file = join(astryxCliRoot(), relative);
  return import(pathToFileURL(file).href);
}

/**
 * Version of an installed dependency of ui-common, or null.
 *
 * @param {string} name
 * @param {string} [root] the ui-common root to resolve from
 */
export function dependencyVersion(name, root) {
  const dir = dependencyDir(name, root);
  return dir ? readJson(join(dir, "package.json")).version : null;
}

/**
 * Version of an installed dependency of the CLI package, or null.
 *
 * @param {string} name
 */
export function cliDependencyVersion(name) {
  const dir = cliDependencyDir(name);
  return dir ? readJson(join(dir, "package.json")).version : null;
}

/** `exports.exclude.json`: Astryx subpaths ui-common hides, with replacements. */
export function excludedExports(root = uiCommonRoot()) {
  const file = join(root, "exports.exclude.json");
  if (!existsSync(file)) return [];
  return /** @type {Array<{name: string, exports?: string[], replacedBy: string|null, reason: string}>} */ (
    readJson(file)
  );
}

/** `exports.customs.json`: ui-common's own exports. */
export function customExports(root = uiCommonRoot()) {
  const file = join(root, "exports.customs.json");
  if (!existsSync(file)) return [];
  return /** @type {Array<{name: string, source: string, subpath?: string, fork?: string, legacy?: object}>} */ (
    readJson(file)
  );
}

/**
 * ui-common's own copies of Astryx components (src/forks/): same names and
 * import paths as Astryx's, which exports.exclude.json hides. `names` are the
 * names a reader may meet it by; `from` is where a consumer imports it.
 *
 * @returns {Array<{name: string, from: string, names: string[], reason: string}>}
 */
export function forkedExports() {
  const exclusions = excludedExports();
  return customExports()
    .filter((c) => c.fork !== undefined)
    .map((c) => {
      const exclusion = exclusions.find((e) => e.replacedBy === c.name);
      return {
        name: c.name,
        from: `@lablup/ui-common/${c.subpath ?? exclusion?.name ?? ""}`,
        names: exclusion?.exports ?? [c.name],
        reason: exclusion?.reason ?? "",
      };
    });
}

/**
 * The exclusions that hide an Astryx name behind a different one. A fork's
 * exclusion is not one: the name stays, now ui-common's.
 */
export function hiddenExports() {
  const forks = new Set(forkedExports().map((f) => f.name));
  return excludedExports().filter(
    (e) => e.replacedBy === null || !forks.has(e.replacedBy),
  );
}

/**
 * The nearest directory at or above `start` holding a package.json.
 *
 * @param {string} start
 */
export function findProjectDir(start) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, "package.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * How this project runs a locally installed bin, from its lockfile.
 *
 * @param {string} projectDir
 */
export function binInvocation(projectDir, bin = "ui-common") {
  let dir = resolve(projectDir);
  for (;;) {
    if (existsSync(join(dir, "pnpm-lock.yaml"))) return `pnpm exec ${bin}`;
    if (existsSync(join(dir, "yarn.lock"))) return `yarn ${bin}`;
    if (existsSync(join(dir, "bun.lock")) || existsSync(join(dir, "bun.lockb"))) {
      return `bunx ${bin}`;
    }
    if (existsSync(join(dir, "package-lock.json"))) return `npx ${bin}`;
    const parent = dirname(dir);
    if (parent === dir) return `npx ${bin}`;
    dir = parent;
  }
}
