/**
 * `@astryxdesign/lab` is a canary with an exact peer on the core canary it was
 * cut from, not on the stable core ui-common pins. Left alone, pnpm installs
 * that canary core beside ui-common's and npm nests one under lab, so
 * `@lablup/ui-common/lab` runs on a second copy of Astryx (two React
 * contexts: lab components stop seeing the theme). One override per package
 * manager points lab's core at ui-common's:
 *
 * - pnpm (`pnpm-workspace.yaml`): `"@astryxdesign/lab>@astryxdesign/core": "<pin>"`
 * - npm (`package.json`): `"overrides": {"@astryxdesign/lab": {"@astryxdesign/core": "<pin>"}}`
 *
 * README carries both recipes at the core pin; `sync-astryx` moves them with
 * the pin, a test fails when they go stale, and `ui-common upgrade` applies
 * the one for the project's package manager when it adds lab.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { dependencyDir } from "./paths.mjs";

export const LAB = "@astryxdesign/lab";
export const CORE = "@astryxdesign/core";
export const PNPM_OVERRIDE_KEY = `${LAB}>${CORE}`;

/** The installed lab's declared core peer, or null when lab is not installed. */
export function labCorePeer() {
  const dir = dependencyDir(LAB);
  if (!dir) return null;
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  return pkg.peerDependencies?.[CORE] ?? null;
}

/** @param {string} pin */
export const pnpmOverrideLine = (pin) => `"${PNPM_OVERRIDE_KEY}": "${pin}"`;

/** @param {string} pin */
export const npmOverride = (pin) => ({ [LAB]: { [CORE]: pin } });

const esc = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

// The value slot is group 2 in both.
const PNPM_LINE = new RegExp(
  String.raw`^([ \t]*["']?${esc(PNPM_OVERRIDE_KEY)}["']?[ \t]*:[ \t]*)(["']?[^"'\s#]+["']?)`,
  "m",
);
const NPM_ENTRY = new RegExp(
  String.raw`("${esc(LAB)}"\s*:\s*\{\s*"${esc(CORE)}"\s*:\s*)("[^"]*")`,
);

const unquote = (/** @type {string} */ s) => s.replace(/^["']|["']$/g, "");

/**
 * What is wrong with the recipes in `text` (README) for core `pin`: each one
 * missing or at another version. Empty when both are current.
 *
 * @param {string} text
 * @param {string} pin
 * @returns {string[]}
 */
export function labOverrideProblems(text, pin) {
  const problems = [];
  for (const [name, pattern] of /** @type {const} */ ([
    ["pnpm", PNPM_LINE],
    ["npm", NPM_ENTRY],
  ])) {
    const match = pattern.exec(text);
    if (!match)
      problems.push(`the ${name} override for ${LAB}'s ${CORE} peer is missing`);
    else if (unquote(match[2]) !== pin)
      problems.push(
        `the ${name} override pins ${CORE} ${unquote(match[2])}, not ${pin}`,
      );
  }
  return problems;
}

/**
 * `text` with both recipes moved to `pin`. Everything else is left as it is.
 *
 * @param {string} text
 * @param {string} pin
 */
export function syncLabOverrideDocs(text, pin) {
  return text
    .replace(PNPM_LINE, (_m, head) => `${head}"${pin}"`)
    .replace(NPM_ENTRY, (_m, head) => `${head}"${pin}"`);
}

/**
 * The package manager a project installs with, from `packageManager` and the
 * nearest lockfile or pnpm workspace file at or above `projectDir`.
 *
 * @param {string} projectDir
 * @param {any} pkg the project's package.json
 * @returns {{manager: 'pnpm' | 'npm' | 'yarn' | 'bun' | null, root: string, workspaceYaml: string | null}}
 */
export function detectPackageManager(projectDir, pkg) {
  const declared = /^(pnpm|npm|yarn|bun)@/.exec(pkg?.packageManager ?? "")?.[1] ?? null;
  const markers = /** @type {const} */ ([
    ["pnpm-workspace.yaml", "pnpm"],
    ["pnpm-lock.yaml", "pnpm"],
    ["package-lock.json", "npm"],
    ["npm-shrinkwrap.json", "npm"],
    ["yarn.lock", "yarn"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
  ]);
  for (let dir = projectDir; ;) {
    const hit = markers.find(([file]) => existsSync(join(dir, file)));
    if (hit) {
      const manager = declared ?? hit[1];
      const workspaceYaml =
        manager === "pnpm"
          ? (nearestUp(dir, "pnpm-workspace.yaml") ?? join(dir, "pnpm-workspace.yaml"))
          : null;
      return { manager, root: dir, workspaceYaml };
    }
    const parent = dirname(dir);
    if (parent === dir || existsSync(join(dir, ".git"))) break;
    dir = parent;
  }
  return {
    manager: declared,
    root: projectDir,
    workspaceYaml: declared === "pnpm" ? join(projectDir, "pnpm-workspace.yaml") : null,
  };
}

/**
 * @param {string} start
 * @param {string} file
 */
function nearestUp(start, file) {
  for (let dir = start; ;) {
    if (existsSync(join(dir, file))) return join(dir, file);
    const parent = dirname(dir);
    if (parent === dir || existsSync(join(dir, ".git"))) return null;
    dir = parent;
  }
}

/**
 * Both recipes, for a note where neither could be applied.
 *
 * @param {string} pin
 */
export function recipesNote(pin) {
  return `pnpm: \`overrides: { ${pnpmOverrideLine(pin)} }\` in pnpm-workspace.yaml; npm: \`"overrides": ${JSON.stringify(npmOverride(pin))}\` in the root package.json`;
}

/**
 * Point lab's core peer at `pin` for one package manager.
 *
 * - npm: sets `pkg.overrides` in place (`pkg` is the parsed package.json).
 * - pnpm: returns the edited `workspaceYaml` text (`null` in: a new file), or
 *   undefined when it already holds the pin or has a shape this cannot edit.
 * - anything else: only a note, with both recipes.
 *
 * @param {{manager: string | null, pin: string, pkg?: any, workspaceYaml?: string | null}} options
 * @returns {{note: string, workspaceYaml?: string}}
 */
export function applyLabOverride({ manager, pin, pkg, workspaceYaml }) {
  const why = `${LAB} peers on a core canary, and without it the lab components run on a second copy of ${CORE}`;
  if (manager === "npm" && pkg) {
    const current = pkg.overrides?.[LAB];
    if (current !== undefined) {
      const core = typeof current === "object" ? current?.[CORE] : undefined;
      if (typeof core === "string" && core !== pin && !core.startsWith("$")) {
        current[CORE] = pin;
        return { note: `overrides["${LAB}"]["${CORE}"]: "${core}" → "${pin}".` };
      }
      return {
        note: `overrides["${LAB}"] was left as it is; it must resolve ${LAB}'s ${CORE} to ${pin} (${recipesNote(pin)}).`,
      };
    }
    pkg.overrides = { ...pkg.overrides, ...npmOverride(pin) };
    return { note: `added overrides["${LAB}"]["${CORE}"] = "${pin}": ${why}.` };
  }
  if (manager === "pnpm") {
    const line = pnpmOverrideLine(pin);
    if (workspaceYaml == null) {
      return {
        workspaceYaml: `overrides:\n  ${line}\n`,
        note: `wrote pnpm-workspace.yaml with overrides ${line}: ${why}.`,
      };
    }
    // Only the top-level `overrides:` block counts: the same key under
    // `peerDependencyRules.allowedVersions` silences a warning, nothing more.
    const block = /^overrides:[ \t]*(\r?\n)/m.exec(workspaceYaml);
    if (block) {
      const at = block.index + block[0].length;
      const after = workspaceYaml.slice(at);
      const end = /^\S/m.exec(after)?.index ?? after.length;
      const body = after.slice(0, end);
      const existing = PNPM_LINE.exec(body);
      if (existing) {
        if (unquote(existing[2]) === pin) return { note: "" };
        return {
          workspaceYaml: `${workspaceYaml.slice(0, at)}${body.replace(
            PNPM_LINE,
            (_m, head) => `${head}"${pin}"`,
          )}${after.slice(end)}`,
          note: `pnpm-workspace.yaml overrides: ${PNPM_OVERRIDE_KEY} ${unquote(existing[2])} → ${pin}.`,
        };
      }
      const indent = /^([ \t]+)\S/.exec(after)?.[1] ?? "  ";
      return {
        workspaceYaml: `${workspaceYaml.slice(0, at)}${indent}${line}\n${after}`,
        note: `added ${line} to the overrides in pnpm-workspace.yaml: ${why}.`,
      };
    }
    if (/^overrides\s*:/m.test(workspaceYaml)) {
      return {
        note: `pnpm-workspace.yaml has an overrides entry this cannot edit; add ${line} to it: ${why}.`,
      };
    }
    const base = workspaceYaml.replace(/\s*$/, "");
    return {
      workspaceYaml: `${base}${base ? "\n\n" : ""}overrides:\n  ${line}\n`,
      note: `added overrides: ${line} to pnpm-workspace.yaml: ${why}.`,
    };
  }
  return {
    note: `${manager ? `${manager} projects are not edited for this` : "no package manager was detected"}, so point ${LAB}'s ${CORE} peer at ui-common's by hand (${recipesNote(pin)}) and check that \`why ${CORE}\` lists one version.`,
  };
}
