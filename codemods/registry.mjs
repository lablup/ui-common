/**
 * The ui-common upgrade registry: codemod steps keyed by the ui-common version
 * that introduced the change. `ui-common upgrade --from A --to B` runs every
 * step with A < version <= B, in version order (semver precedence, so
 * prerelease keys work: 0.1.0-alpha.19 < 0.2.0-alpha.0 < 0.2.0).
 *
 * Two kinds of step:
 * - hand-written ones, listed in STATIC_STEPS (0.1 -> 0.2);
 * - `codemods/<version>/upstream.json`, written by `ui-common sync-astryx`
 *   when ui-common moves to a new Astryx: the Astryx codemods a consumer needs
 *   for that bump, run through ./upstream.mjs.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { compare, parse } from "../cli/semver.mjs";

/**
 * @typedef {object} Transform
 * @property {string} id
 * @property {string} title
 * @property {string[]} extensions
 * @property {boolean} [parse] re-parse the output as a script before accepting it
 * @property {(file: {path: string, source: string}, api: {jscodeshift: any}, ctx: any) => string | null | undefined} run
 *
 * @typedef {object} Step
 * @property {string} title
 * @property {Transform[]} transforms
 * @property {(text: string, ctx: any) => string | undefined} [packageJson]
 * @property {(file: string, source: string) => Array<{category: string, file: string, line: number, text: string, detail?: string}>} [scan]
 * @property {Record<string, {title: string, help: string}>} [categories]
 * @property {string[] | ((ctx: any) => string[])} [notes] report notes, or a function of the run
 */

export const CODEMODS_DIR = dirname(fileURLToPath(import.meta.url));

/** @type {Array<{version: string, load: () => Promise<Step>}>} */
const STATIC_STEPS = [
  {
    version: "0.2.0-alpha.0",
    load: async () => (await import("./0.2/index.mjs")).default,
  },
];

/** Upstream steps recorded by `sync-astryx`: `codemods/<version>/upstream.json`. */
export function upstreamManifests() {
  if (!existsSync(CODEMODS_DIR)) return [];
  return readdirSync(CODEMODS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && parse(e.name) && /^\d+\.\d+\.\d+/.test(e.name))
    .map((e) => ({
      version: e.name,
      file: join(CODEMODS_DIR, e.name, "upstream.json"),
    }))
    .filter((m) => existsSync(m.file));
}

/** Every registered version, ascending. */
export function registeredVersions() {
  const versions = new Set([
    ...STATIC_STEPS.map((s) => s.version),
    ...upstreamManifests().map((m) => m.version),
  ]);
  return [...versions].sort(compare);
}

/**
 * The steps to run for `from` (exclusive) to `to` (inclusive).
 *
 * @param {string} from
 * @param {string} to
 * @returns {Promise<Array<{version: string, step: Step}>>}
 */
export async function stepsBetween(from, to) {
  /** @type {Array<{version: string, step: Step}>} */
  const out = [];
  for (const version of registeredVersions()) {
    if (compare(version, from) <= 0 || compare(version, to) > 0) continue;
    for (const s of STATIC_STEPS.filter((x) => x.version === version)) {
      out.push({ version, step: await s.load() });
    }
    const upstream = upstreamManifests().find((m) => m.version === version);
    if (upstream) {
      const { upstreamStep } = await import("./upstream.mjs");
      out.push({
        version,
        step: await upstreamStep(JSON.parse(readFileSync(upstream.file, "utf8"))),
      });
    }
  }
  return out;
}
