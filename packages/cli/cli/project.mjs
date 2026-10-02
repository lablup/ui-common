/**
 * What `adopt` and `doctor` need to know about a consumer project: its
 * package roots (a single package, or a workspace and its members), its
 * files, its lockfile and its pnpm catalog. Read-only.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

/** Directories that never hold the project's own source. */
export const SKIPPED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  ".next",
  "coverage",
  ".turbo",
  ".cache",
  "target",
  ".venv",
  "venv",
  "__pycache__",
  "storybook-static",
  "playwright-report",
  "test-results",
  ".svelte-kit",
  ".nuxt",
  ".output",
  ".vite",
  ".yarn",
  ".pnpm-store",
  ".claude",
]);

/** Bigger than any hand-written file; a bundle or a generated one. */
const MAX_BYTES = 512 * 1024;

export const SCRIPT_EXTENSIONS = new Set([
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
]);
export const STYLE_EXTENSIONS = new Set([".css", ".scss", ".sass", ".less"]);
/** Read by the finding scans only, never rewritten. */
export const TEXT_EXTENSIONS = new Set([
  ...SCRIPT_EXTENSIONS,
  ...STYLE_EXTENSIONS,
  ".html",
  ".md",
  ".mdx",
  ".json",
  ".yml",
  ".yaml",
  ".sh",
  ".toml",
]);

/** @param {string} file */
export function readJsonFile(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** @param {string} file */
export function readText(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/** Posix path of `file` relative to `dir`. */
export function relPath(dir, file) {
  return relative(dir, file).split(sep).join("/") || ".";
}

/**
 * The `packages:` list of a pnpm-workspace.yaml (a block list of strings).
 *
 * @param {string} yaml
 * @returns {string[]}
 */
export function pnpmWorkspaceGlobs(yaml) {
  const out = [];
  const block = /^packages:[ \t]*(?:#.*)?\r?\n((?:[ \t]+.*\r?\n?|[ \t]*\r?\n)*)/m.exec(
    yaml,
  );
  if (!block) return out;
  for (const line of block[1].split("\n")) {
    const item = /^[ \t]+-[ \t]*["']?([^"'#\s]+)["']?/.exec(line);
    if (item) out.push(item[1]);
  }
  return out;
}

/**
 * A pnpm `catalog:` (the default catalog) as a map. Named catalogs
 * (`catalogs: { name: {…} }`) are read too, under `name`.
 *
 * @param {string | null} yaml
 * @returns {{default: Record<string, string>, named: Record<string, Record<string, string>>}}
 */
export function pnpmCatalogs(yaml) {
  /** @type {Record<string, string>} */
  const def = {};
  /** @type {Record<string, Record<string, string>>} */
  const named = {};
  if (!yaml) return { default: def, named };
  const unquote = (/** @type {string} */ s) => s.trim().replace(/^["']|["']$/g, "");
  /** @type {null | 'catalog' | 'catalogs'} */
  let section = null;
  /** @type {string | null} */
  let current = null;
  for (const raw of yaml.split("\n")) {
    const line = raw.replace(/\s+#.*$/, "");
    if (/^\S/.test(line)) {
      section = /^catalog:\s*$/.test(line)
        ? "catalog"
        : /^catalogs:\s*$/.test(line)
          ? "catalogs"
          : null;
      current = null;
      continue;
    }
    if (section === "catalog") {
      const m = /^ {2}(["']?[^"':]+["']?)\s*:\s*(\S.*)$/.exec(line);
      if (m) def[unquote(m[1])] = unquote(m[2]);
    } else if (section === "catalogs") {
      const name = /^ {2}(["']?[^"':\s]+["']?)\s*:\s*$/.exec(line);
      if (name) {
        current = unquote(name[1]);
        named[current] = {};
        continue;
      }
      const m = /^ {4}(["']?[^"':]+["']?)\s*:\s*(\S.*)$/.exec(line);
      if (m && current) named[current][unquote(m[1])] = unquote(m[2]);
    }
  }
  return { default: def, named };
}

/**
 * A dependency spec with `catalog:` resolved through the workspace catalog.
 *
 * @param {string} name
 * @param {string | undefined} spec
 * @param {ReturnType<typeof pnpmCatalogs>} catalogs
 */
export function resolveSpec(name, spec, catalogs) {
  if (typeof spec !== "string") return spec;
  const m = /^catalog:(.*)$/.exec(spec.trim());
  if (!m) return spec;
  const which = m[1].trim();
  const value =
    which === "" || which === "default"
      ? catalogs.default[name]
      : catalogs.named[which]?.[name];
  return value ?? spec;
}

/** @param {string} glob */
function globToRegExp(glob) {
  let re = "";
  const g = glob.replace(/^\.\//, "").replace(/\/+$/, "");
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === "*") {
      if (g[i + 1] === "*") {
        re += ".*";
        i++;
        if (g[i + 1] === "/") i++;
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

/**
 * The workspace member globs declared at `dir`: pnpm-workspace.yaml's
 * `packages`, else package.json `workspaces` (npm, yarn, bun).
 *
 * @param {string} dir
 */
export function workspaceGlobs(dir) {
  const yaml = readText(join(dir, "pnpm-workspace.yaml"));
  if (yaml) {
    const globs = pnpmWorkspaceGlobs(yaml);
    if (globs.length > 0) return globs;
  }
  const pkg = readJsonFile(join(dir, "package.json"));
  const ws = pkg?.workspaces;
  if (Array.isArray(ws)) return ws.filter((w) => typeof w === "string");
  if (Array.isArray(ws?.packages)) return ws.packages;
  return [];
}

/**
 * The package roots a command works on: `projectDir`, plus every workspace
 * member when `projectDir` is a workspace root. Absolute, `projectDir` first.
 *
 * @param {string} projectDir
 */
export function packageRoots(projectDir) {
  const globs = workspaceGlobs(projectDir);
  const roots = [projectDir];
  if (globs.length === 0) return roots;
  const include = globs.filter((g) => !g.startsWith("!")).map(globToRegExp);
  const exclude = globs
    .filter((g) => g.startsWith("!"))
    .map((g) => globToRegExp(g.slice(1)));
  const visit = (/** @type {string} */ dir, /** @type {number} */ depth) => {
    if (depth > 6) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || SKIPPED_DIRS.has(entry.name)) continue;
      const full = join(dir, entry.name);
      const rel = relPath(projectDir, full);
      if (
        existsSync(join(full, "package.json")) &&
        include.some((r) => r.test(rel)) &&
        !exclude.some((r) => r.test(rel))
      )
        roots.push(full);
      visit(full, depth + 1);
    }
  };
  visit(projectDir, 0);
  return [...new Set(roots)];
}

/**
 * The root of the install: the nearest directory at or above `start` with a
 * lockfile or pnpm-workspace.yaml (stopping at a `.git`), else `start`.
 *
 * @param {string} start
 */
export function installRoot(start) {
  const markers = [
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "package-lock.json",
    "npm-shrinkwrap.json",
    "yarn.lock",
    "bun.lock",
  ];
  for (let dir = resolve(start); ;) {
    if (markers.some((m) => existsSync(join(dir, m)))) return dir;
    const parent = dirname(dir);
    if (parent === dir || existsSync(join(dir, ".git"))) return resolve(start);
    dir = parent;
  }
}

/**
 * Every text file of the project the commands read: git's view in a git
 * checkout (so ignored files are skipped), a directory walk otherwise.
 * Build output, dependencies, files over 512 KiB and packages nested in the
 * project that are not workspace members are left out.
 *
 * @param {string} projectDir
 * @param {string[]} roots package roots (absolute)
 */
export function listProjectFiles(projectDir, roots = [projectDir]) {
  /** @type {string[]} */
  let listed = [];
  const git = spawnSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", "."],
    { cwd: projectDir, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
  if (git.status === 0 && git.stdout) {
    listed = git.stdout
      .split("\0")
      .filter(Boolean)
      .map((f) => join(projectDir, f));
  } else {
    const walk = (/** @type {string} */ dir) => {
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!SKIPPED_DIRS.has(entry.name)) walk(full);
        } else listed.push(full);
      }
    };
    walk(projectDir);
  }
  const rootSet = new Set(roots);
  const nested = new Set(
    listed
      .filter((f) => f.endsWith(`${sep}package.json`))
      .map((f) => dirname(f))
      .filter((d) => d !== projectDir && !rootSet.has(d))
      .map((d) => d + sep),
  );
  return listed
    .filter((f) => {
      const name = f.slice(f.lastIndexOf(sep) + 1);
      const ext = extname(name);
      if (!TEXT_EXTENSIONS.has(ext) && name !== "package.json") return false;
      if (name.endsWith(".d.ts") || /\.min\.[cm]?[jt]s$|\.min\.css$/.test(name))
        return false;
      if (/^(pnpm-lock\.yaml|package-lock\.json|npm-shrinkwrap\.json)$/.test(name))
        return false;
      const parts = relative(projectDir, f).split(sep);
      if (parts.slice(0, -1).some((d) => SKIPPED_DIRS.has(d))) return false;
      for (const dir of nested) if (f.startsWith(dir)) return false;
      // A package root's own tree belongs to it, even when it sits inside
      // another root's directory.
      try {
        return statSync(f).size <= MAX_BYTES;
      } catch {
        return false;
      }
    })
    .sort();
}

/**
 * The package root a file belongs to: the deepest root that contains it.
 *
 * @param {string} file
 * @param {string[]} roots
 */
export function ownerRoot(file, roots) {
  let best = null;
  for (const root of roots) {
    if (file === root || file.startsWith(root + sep)) {
      if (!best || root.length > best.length) best = root;
    }
  }
  return best;
}

/** A file whose header says a tool wrote it. */
export function isGenerated(/** @type {string} */ text) {
  return /@generated\b|\bDO NOT EDIT\b/i.test(text.slice(0, 600));
}

/** Line number of `index` in `text`, 1-based. */
export function lineAt(/** @type {string} */ text, /** @type {number} */ index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === "\n") line++;
  return line;
}

/** The trimmed text of the line holding `index`. */
export function lineTextAt(/** @type {string} */ text, /** @type {number} */ index) {
  const start = text.lastIndexOf("\n", index - 1) + 1;
  const end = text.indexOf("\n", index);
  return text.slice(start, end === -1 ? text.length : end).trim();
}

/**
 * Keys of a pnpm lockfile's `packages:` and `snapshots:` sections, from every
 * YAML document in it.
 *
 * @param {string} text
 */
export function pnpmLockKeys(text) {
  /** @type {{packages: string[], snapshots: string[], importers: string[]}} */
  const keys = { packages: [], snapshots: [], importers: [] };
  /** @type {keyof typeof keys | null} */
  let section = null;
  for (const line of text.split("\n")) {
    if (/^\S/.test(line)) {
      const top = /^([a-zA-Z]+):\s*$/.exec(line);
      section =
        top && top[1] in keys ? /** @type {keyof typeof keys} */ (top[1]) : null;
      continue;
    }
    if (section === null) continue;
    const key = /^ {2}(\S.*?):(\s|$)/.exec(line);
    if (key) keys[section].push(key[1].trim().replace(/^['"]|['"]$/g, ""));
  }
  return keys;
}

/** `@scope/name@1.2.3(peer@…)` → `1.2.3(peer@…)` when the name matches. */
export function lockVersionOf(/** @type {string} */ key, /** @type {string} */ name) {
  return key.startsWith(`${name}@`) ? key.slice(name.length + 1) : null;
}

/** `1.2.3(peer@…)(…)` → `1.2.3`. */
export function bareVersion(/** @type {string} */ v) {
  const at = v.indexOf("(");
  return at === -1 ? v : v.slice(0, at);
}

/**
 * The installed copies of `name` an npm lockfile (v2/v3) records: one entry
 * per `node_modules/…/name` path.
 *
 * @param {any} lock parsed package-lock.json
 * @param {string} name
 * @returns {Array<{path: string, version: string}>}
 */
export function npmLockCopies(lock, name) {
  const out = [];
  for (const [path, entry] of Object.entries(lock?.packages ?? {})) {
    if (path.endsWith(`node_modules/${name}`) && !(/** @type {any} */ (entry).link)) {
      out.push({ path, version: /** @type {any} */ (entry).version });
    }
  }
  return out;
}

/** The dependency fields a package.json can declare a package in. */
export const DEP_FIELDS = /** @type {const} */ ([
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
]);

/**
 * Where a package.json declares `name`, as [field, spec] pairs.
 *
 * @param {any} pkg
 * @param {string} name
 * @returns {Array<[string, string]>}
 */
export function declarations(pkg, name) {
  /** @type {Array<[string, string]>} */
  const out = [];
  for (const field of DEP_FIELDS) {
    const spec = pkg?.[field]?.[name];
    if (typeof spec === "string") out.push([field, spec]);
  }
  return out;
}
