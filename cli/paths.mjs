/**
 * Where things live, resolved from this package rather than from the working
 * directory. A consumer depends on @lablup/ui-common only, so under pnpm's
 * isolated layout @astryxdesign/* is reachable from here and not from the
 * consumer's own directory.
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Root of the installed @lablup/ui-common package. */
export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const require = createRequire(join(PACKAGE_ROOT, "package.json"));

/** @param {string} file */
export function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** @returns {{name: string, version: string, dependencies?: Record<string,string>, peerDependencies?: Record<string,string>, devDependencies?: Record<string,string>}} */
export function ownPackageJson() {
  return readJson(join(PACKAGE_ROOT, "package.json"));
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
 * The directory of a dependency of ui-common, or null. Resolution goes through
 * the package's main entry, because not every Astryx package exports its
 * package.json.
 *
 * @param {string} name
 */
export function dependencyDir(name) {
  try {
    return packageDirOf(require.resolve(name), name);
  } catch {
    return null;
  }
}

/** Root of the exact-pinned @astryxdesign/cli. */
export function astryxCliRoot() {
  const dir = dependencyDir("@astryxdesign/cli");
  if (!dir) {
    throw new Error(
      "@astryxdesign/cli is not installed next to @lablup/ui-common. Reinstall @lablup/ui-common.",
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

/** Version of an installed dependency of ui-common, or null. */
export function dependencyVersion(name) {
  const dir = dependencyDir(name);
  return dir ? readJson(join(dir, "package.json")).version : null;
}

/** `exports.exclude.json`: Astryx subpaths ui-common hides, with replacements. */
export function excludedExports() {
  const file = join(PACKAGE_ROOT, "exports.exclude.json");
  if (!existsSync(file)) return [];
  return /** @type {Array<{name: string, exports?: string[], replacedBy: string|null, reason: string}>} */ (
    readJson(file)
  );
}

/** `exports.customs.json`: ui-common's own exports. */
export function customExports() {
  const file = join(PACKAGE_ROOT, "exports.customs.json");
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
