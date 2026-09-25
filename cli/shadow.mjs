/**
 * Let Astryx's lookup commands find @astryxdesign/core in a project that only
 * depends on @lablup/ui-common.
 *
 * `astryx component`, `search`, `docs`, `build` and friends locate core by
 * walking up from the working directory for `node_modules/@astryxdesign/core`.
 * Under pnpm's isolated layout a ui-common consumer has no such directory:
 * core is ui-common's dependency, not the project's. So, for read-only
 * commands only, the CLI runs in a throwaway "shadow" of the project: its
 * package.json, config and lockfile, and a node_modules made of symlinks to
 * the project's own packages plus the Astryx packages ui-common pins. The
 * project's integrations (ui-common's included) load exactly as they would in
 * place. Paths in the output are mapped back to the project.
 *
 * Commands that write files (`init`, `swizzle`, `template <name> <path>`,
 * `theme add`, …) never run in a shadow.
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { dependencyDir, findProjectDir } from "./paths.mjs";

/** Astryx commands that only read. */
const READ_ONLY = new Set([
  "component",
  "search",
  "docs",
  "build",
  "hook",
  "discover",
  "blog",
  "layout",
  "template",
]);

const ASTRYX_PACKAGES = ["@astryxdesign/core", "@astryxdesign/theme-neutral", "@astryxdesign/lab"];

const PROJECT_FILES = [
  "package.json",
  "astryx.config.ts",
  "astryx.config.mts",
  "astryx.config.js",
  "astryx.config.mjs",
  "astryx.config.cjs",
  "pnpm-lock.yaml",
  "yarn.lock",
  "package-lock.json",
  "bun.lock",
  "AGENTS.md",
  "CLAUDE.md",
  ".claude",
  ".cursorrules",
];

/**
 * Whether the Astryx CLI finds core from `cwd` (its own findCoreDir walk:
 * five levels of `packages/core` or `node_modules/@astryxdesign/core`).
 *
 * @param {string} cwd
 */
export function coreReachableFrom(cwd) {
  let dir = cwd;
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(dir, "packages", "core"))) return true;
    if (existsSync(join(dir, "node_modules", "@astryxdesign", "core"))) return true;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return false;
}

/**
 * Whether this command should run in a shadow of the project.
 *
 * @param {string[]} args
 * @param {string} cwd
 */
export function needsShadow(args, cwd) {
  const positionals = args.filter((a) => !a.startsWith("-"));
  const command = positionals[0];
  if (!command || !READ_ONLY.has(command)) return false;
  // `template <name> <path>` and `--cdn` write files.
  if (command === "template" && (positionals.length > 2 || args.some((a) => a.startsWith("--cdn")))) {
    return false;
  }
  if (!dependencyDir("@astryxdesign/core")) return false;
  return !coreReachableFrom(cwd);
}

/** @param {string} target @param {string} link */
function link(target, link) {
  symlinkSync(target, link, process.platform === "win32" ? "junction" : undefined);
}

/**
 * @param {string} cwd
 * @returns {{dir: string, projectDir: string, cleanup: () => void}}
 */
export function createShadow(cwd) {
  const projectDir = findProjectDir(cwd) ?? cwd;
  const dir = mkdtempSync(join(tmpdir(), "ui-common-astryx-"));
  for (const file of PROJECT_FILES) {
    const source = join(projectDir, file);
    if (existsSync(source)) link(source, join(dir, file));
  }

  const modules = join(dir, "node_modules");
  mkdirSync(modules);
  // The project's installed packages, from the nearest node_modules.
  let search = projectDir;
  for (;;) {
    const nm = join(search, "node_modules");
    if (existsSync(nm)) {
      for (const entry of readdirSync(nm)) {
        if (entry.startsWith(".")) continue;
        if (entry.startsWith("@")) {
          mkdirSync(join(modules, entry), { recursive: true });
          for (const scoped of readdirSync(join(nm, entry))) {
            link(join(nm, entry, scoped), join(modules, entry, scoped));
          }
        } else {
          link(join(nm, entry), join(modules, entry));
        }
      }
      break;
    }
    const parent = dirname(search);
    if (parent === search) break;
    search = parent;
  }
  // The Astryx packages ui-common pins, where the project has none.
  for (const name of ASTRYX_PACKAGES) {
    const target = join(modules, ...name.split("/"));
    const source = dependencyDir(name);
    if (!source || existsSync(target)) continue;
    mkdirSync(dirname(target), { recursive: true });
    link(source, target);
  }

  return {
    dir,
    projectDir,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
