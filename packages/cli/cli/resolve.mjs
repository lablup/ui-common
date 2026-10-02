/**
 * Resolve a project's own import specifiers to files, the way its bundler
 * would for the common cases: relative paths, and the `paths` / `baseUrl`
 * aliases its tsconfig declares (`@/components/common`). A specifier that
 * resolves neither way and is not an installed package is recorded as an
 * unresolved alias (a Vite `resolve.alias`, say), for the report.
 *
 * Only what `ui-common upgrade` needs: file-to-file resolution inside the
 * project. Packages are never resolved.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { builtinModules } from "node:module";
import { dirname, join, resolve } from "node:path";

const SCRIPT_EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mts",
  ".mjs",
  ".cts",
  ".cjs",
];

/**
 * JSON with comments and trailing commas, as tsconfig allows.
 *
 * @param {string} text
 */
export function parseJsonc(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      const start = i;
      for (i++; i < text.length && text[i] !== '"'; i++) if (text[i] === "\\") i++;
      out += text.slice(start, i + 1);
    } else if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 1;
    } else out += ch;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

/** @param {string} path */
function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * The file an import of `base` (no extension, or a `.js` one standing for a
 * `.ts` source) loads: `base` itself, `base.<ext>`, or `base/index.<ext>`.
 *
 * @param {string} base absolute
 */
export function resolveFile(base) {
  if (isFile(base) && SCRIPT_EXTENSIONS.some((e) => base.endsWith(e))) return base;
  for (const ext of SCRIPT_EXTENSIONS)
    if (isFile(`${base}${ext}`)) return `${base}${ext}`;
  const js = /\.(m|c)?jsx?$/.exec(base);
  if (js) {
    const stem = base.slice(0, js.index);
    for (const ext of SCRIPT_EXTENSIONS)
      if (isFile(`${stem}${ext}`)) return `${stem}${ext}`;
  }
  for (const ext of SCRIPT_EXTENSIONS) {
    const index = join(base, `index${ext}`);
    if (isFile(index)) return index;
  }
  return null;
}

/**
 * `compilerOptions` of a tsconfig, merged over what it extends (relative
 * `extends` only), with `paths` and `baseUrl` made absolute.
 *
 * @param {string} file
 * @param {Set<string>} [seen]
 * @returns {{baseUrl?: string, paths?: Record<string, string[]>, pathsBase?: string}}
 */
function readTsconfig(file, seen = new Set()) {
  if (seen.has(file) || !isFile(file)) return {};
  seen.add(file);
  let json;
  try {
    json = parseJsonc(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
  const dir = dirname(file);
  /** @type {{baseUrl?: string, paths?: Record<string, string[]>, pathsBase?: string}} */
  let merged = {};
  const parents = Array.isArray(json.extends) ? json.extends : [json.extends];
  for (const parent of parents) {
    if (typeof parent !== "string" || !parent.startsWith(".")) continue;
    const target = resolve(dir, parent);
    merged = {
      ...merged,
      ...readTsconfig(target.endsWith(".json") ? target : `${target}.json`, seen),
    };
  }
  const options = json.compilerOptions ?? {};
  if (typeof options.baseUrl === "string")
    merged.baseUrl = resolve(dir, options.baseUrl);
  if (options.paths && typeof options.paths === "object") {
    merged.paths = options.paths;
    merged.pathsBase = merged.baseUrl ?? dir;
  } else if (merged.paths && typeof options.baseUrl === "string") {
    merged.pathsBase = merged.baseUrl;
  }
  return merged;
}

/**
 * Every tsconfig of the project that may declare aliases: `tsconfig.json`,
 * the configs it references, and the usual Vite split (`tsconfig.app.json`).
 *
 * @param {string} projectDir
 */
function projectTsconfigs(projectDir) {
  const root = join(projectDir, "tsconfig.json");
  const files = [root, join(projectDir, "tsconfig.app.json")];
  try {
    const json = parseJsonc(readFileSync(root, "utf8"));
    for (const ref of json.references ?? []) {
      if (typeof ref?.path !== "string") continue;
      const target = resolve(projectDir, ref.path);
      files.push(target.endsWith(".json") ? target : join(target, "tsconfig.json"));
    }
  } catch {
    // No tsconfig, or one this cannot read: relative imports only.
  }
  return [...new Set(files)].filter(isFile);
}

/** @param {string} specifier */
function packageName(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

const BUILTINS = new Set(builtinModules);

/**
 * @param {string} projectDir
 */
export function createResolver(projectDir) {
  const configs = projectTsconfigs(projectDir).map((f) => readTsconfig(f));
  /** @type {Array<{prefix: string, suffix: string, wildcard: boolean, targets: string[]}>} */
  const aliases = [];
  /** @type {string[]} */
  const baseUrls = [];
  for (const config of configs) {
    if (config.baseUrl) baseUrls.push(config.baseUrl);
    if (!config.paths || !config.pathsBase) continue;
    for (const [pattern, targets] of Object.entries(config.paths)) {
      if (!Array.isArray(targets)) continue;
      const star = pattern.indexOf("*");
      aliases.push({
        prefix: star === -1 ? pattern : pattern.slice(0, star),
        suffix: star === -1 ? "" : pattern.slice(star + 1),
        wildcard: star !== -1,
        targets: targets.map((t) =>
          resolve(/** @type {string} */ (config.pathsBase), t),
        ),
      });
    }
  }
  // Longest prefix first, as TypeScript matches.
  aliases.sort((a, b) => b.prefix.length - a.prefix.length);

  /** @type {Map<string, boolean>} */
  const installed = new Map();
  /** @param {string} name */
  const isInstalled = (name) => {
    let hit = installed.get(name);
    if (hit !== undefined) return hit;
    hit = false;
    for (let dir = projectDir; ;) {
      if (existsSync(join(dir, "node_modules", name))) {
        hit = true;
        break;
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    installed.set(name, hit);
    return hit;
  };

  /** Alias-like specifiers nothing resolved, by their first segment. @type {Map<string, number>} */
  const unresolved = new Map();

  /**
   * @param {string} fromFile absolute
   * @param {string} specifier
   * @param {{probe?: boolean}} [options] probe: a lookup that records no miss
   * @returns {string | null}
   */
  function resolveImport(fromFile, specifier, { probe = false } = {}) {
    if (specifier.startsWith(".") || specifier.startsWith("/")) {
      return resolveFile(resolve(dirname(fromFile), specifier));
    }
    if (specifier.includes(":") || BUILTINS.has(packageName(specifier))) return null;
    let aliased = false;
    for (const alias of aliases) {
      let rest;
      if (alias.wildcard) {
        if (!specifier.startsWith(alias.prefix) || !specifier.endsWith(alias.suffix))
          continue;
        rest = specifier.slice(
          alias.prefix.length,
          specifier.length - alias.suffix.length,
        );
      } else if (specifier !== alias.prefix) continue;
      aliased = true;
      for (const target of alias.targets) {
        const hit = resolveFile(
          rest === undefined ? target : target.replace("*", rest),
        );
        if (hit) return hit;
      }
    }
    // A tsconfig alias to a stylesheet or JSON file: resolved, just not a script.
    if (aliased) return null;
    const name = packageName(specifier);
    if (isInstalled(name)) return null;
    for (const base of baseUrls) {
      const hit = resolveFile(join(base, specifier));
      if (hit) return hit;
    }
    if (probe) return null;
    // Only what looks like an alias is worth reporting: a bare name that is
    // not installed is as likely a package this checkout has not installed.
    const first = specifier.split("/")[0];
    if (
      (/^[@~#$]/.test(specifier) && !/^@[\w-]/.test(specifier)) ||
      existsSync(join(projectDir, first))
    ) {
      const key = `${first}/`;
      unresolved.set(key, (unresolved.get(key) ?? 0) + 1);
    }
    return null;
  }

  return { resolveImport, unresolved };
}
