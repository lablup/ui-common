/**
 * `ui-common adopt` package.json edits, for one package of the project:
 *
 * - `@lablup/ui-common` is added at exactly the CLI's version (a library
 *   takes it as a peer and a devDependency), with the `@stylexjs/stylex` peer
 *   it needs when that is missing. A declaration already there is left alone.
 * - `@lablup/ui-common-cli`, the `ui-common` bin, is added once per project
 *   (`addCli`) as a devDependency at the same version.
 * - `@astryxdesign/core` stays only where it is declared, moved to exactly the
 *   version ui-common pins (a second version would be a second copy of
 *   Astryx). It is never added. A library's core peer is dropped: ui-common
 *   brings core.
 * - `@astryxdesign/theme-neutral` is removed once no module imports it.
 * - `@astryxdesign/lab` is removed once no module uses `@lablup/ui-common/lab`;
 *   while one does, it is pinned to the canary ui-common is built against.
 * - `catalog:`, `workspace:`, `link:` and `file:` specs are never edited; a
 *   catalog entry that disagrees with ui-common's pin is reported.
 */
import { addDependency } from "../0.2/package-json.mjs";
import { coerce, compare } from "../../cli/semver.mjs";
import { DEP_FIELDS, resolveSpec } from "../../cli/project.mjs";
import { UIC } from "./specifiers.mjs";

export const CLI_PACKAGE = "@lablup/ui-common-cli";
const CORE = "@astryxdesign/core";
const LAB = "@astryxdesign/lab";
const NEUTRAL = "@astryxdesign/theme-neutral";
const ASTRYX_CLI = "@astryxdesign/cli";
const STYLEX = "@stylexjs/stylex";

/** @param {string} spec */
const isIndirect = (spec) =>
  /^(catalog:|workspace:|link:|file:|npm:|git|https?:|portal:)/.test(spec.trim());

/**
 * @typedef {object} AdoptPackageContext
 * @property {string} rel the package's directory, project-relative ("." for the root)
 * @property {string} version the ui-common version to adopt (the CLI's own)
 * @property {string} corePin ui-common's `@astryxdesign/core`
 * @property {string} labPin ui-common's `@astryxdesign/lab` peer
 * @property {string} stylexRange ui-common's `@stylexjs/stylex` peer
 * @property {string | undefined} astryxCliPin the `@astryxdesign/cli` the CLI wraps
 * @property {boolean} usesLab a module of the package imports `@lablup/ui-common/lab`
 * @property {boolean} keepsLab a module still imports `@astryxdesign/lab`
 * @property {boolean} keepsNeutral a module still imports `@astryxdesign/theme-neutral`
 * @property {boolean} addCli add `@lablup/ui-common-cli` here
 * @property {ReturnType<typeof import("../../cli/project.mjs").pnpmCatalogs>} catalogs
 * @property {(message: string) => void} note
 * @property {(message: string) => void} alert
 */

/**
 * @param {string} text package.json source
 * @param {AdoptPackageContext} ctx
 * @returns {{text: string | undefined, labAdded: boolean, declaresCore: boolean}}
 */
export function adoptPackageJson(text, ctx) {
  const pkg = JSON.parse(text);
  const indent = /^([ \t]+)"/m.exec(text)?.[1] ?? "  ";
  const where = ctx.rel === "." ? "" : `${ctx.rel}/package.json: `;
  const note = (/** @type {string} */ m) => ctx.note(`${where}${m}`);
  const has = (/** @type {string} */ name) =>
    DEP_FIELDS.some((f) => pkg[f]?.[name] != null);
  const library = [CORE, LAB, NEUTRAL, UIC].some(
    (n) => pkg.peerDependencies?.[n] != null,
  );
  let labAdded = false;

  /**
   * Where a package this project needs goes: an application's dependencies,
   * a library's peers plus devDependencies.
   *
   * @param {string} name
   * @param {string} range
   * @param {string} why
   */
  const ensure = (name, range, why) => {
    const fields = library
      ? [
          ...(pkg.peerDependencies?.[name] == null && pkg.dependencies?.[name] == null
            ? ["peerDependencies"]
            : []),
          ...(pkg.devDependencies?.[name] == null && pkg.dependencies?.[name] == null
            ? ["devDependencies"]
            : []),
        ]
      : has(name)
        ? []
        : ["dependencies"];
    for (const field of fields) addDependency(pkg, field, name, range);
    if (fields.length > 0)
      note(`added ${name} ${range} to ${fields.join(" and ")}${why}.`);
    return fields.length > 0;
  };

  /** Remove `name` from every field. */
  const drop = (/** @type {string} */ name, /** @type {string} */ why) => {
    const fields = DEP_FIELDS.filter((f) => pkg[f]?.[name] != null);
    for (const f of fields) {
      delete pkg[f][name];
      if (Object.keys(pkg[f]).length === 0) delete pkg[f];
    }
    if (fields.length > 0)
      note(`removed ${name} from ${fields.join(" and ")}: ${why}.`);
  };

  /**
   * Move `name` to exactly `pin` wherever it is declared with a plain range.
   *
   * @param {string} name
   * @param {string} pin
   */
  const pinExactly = (name, pin) => {
    for (const field of DEP_FIELDS) {
      const spec = pkg[field]?.[name];
      if (typeof spec !== "string") continue;
      if (isIndirect(spec)) {
        const resolved = resolveSpec(name, spec, ctx.catalogs);
        if (resolved !== spec && resolved !== pin)
          note(
            `${field}["${name}"] is "${spec}", which resolves to ${resolved}; ${UIC} ${ctx.version} pins ${pin}. Move that entry to ${pin}.`,
          );
        continue;
      }
      if (spec === pin) continue;
      const from = coerce(spec);
      pkg[field][name] = pin;
      note(
        `${field}["${name}"]: "${spec}" → "${pin}", the version ${UIC} ${ctx.version} pins.`,
      );
      if (name === CORE && from && compare(from, pin) < 0) {
        ctx.alert(
          `**Astryx moves from ${from} to ${pin}${where ? ` in ${ctx.rel}` : ""}.** ${UIC} ${ctx.version} is built on Astryx ${pin}. Run Astryx's own codemods for that span while the code still imports \`@astryxdesign/*\` (before this adopt run, or on a revert of it): \`ui-common astryx upgrade --from ${from} --path <src> --apply\`, then adopt again.`,
        );
      }
    }
  };

  // ui-common itself, and what it needs.
  if (!has(UIC)) {
    ensure(
      UIC,
      ctx.version,
      `: the one dependency that brings Astryx (core, theme-neutral) at the versions it pins`,
    );
    ensure(STYLEX, ctx.stylexRange, `: the StyleX runtime ${UIC} and Astryx share`);
  }
  if (ctx.addCli && !has(CLI_PACKAGE)) {
    addDependency(pkg, "devDependencies", CLI_PACKAGE, ctx.version);
    note(
      `added ${CLI_PACKAGE} ${ctx.version} to devDependencies: the \`ui-common\` bin (\`ui-common doctor\`, \`ui-common agents\`, the Astryx CLI in ${UIC} terms), released at the same version as ${UIC}.`,
    );
  }

  // Astryx core: kept only at ui-common's pin.
  if (has(CORE)) {
    if (library && pkg.peerDependencies?.[CORE] != null) {
      delete pkg.peerDependencies[CORE];
      if (Object.keys(pkg.peerDependencies).length === 0) delete pkg.peerDependencies;
      note(`removed ${CORE} from peerDependencies: ${UIC} brings it, pinned.`);
    }
    pinExactly(CORE, ctx.corePin);
  }

  // theme-neutral: mirrored as @lablup/ui-common/theme/neutral.
  if (has(NEUTRAL)) {
    if (ctx.keepsNeutral)
      note(
        `${NEUTRAL} stays: a module still imports it (see the report). ${UIC}/theme/neutral mirrors it.`,
      );
    else drop(NEUTRAL, `${UIC} depends on it and mirrors it as ${UIC}/theme/neutral`);
  }

  // lab: an optional peer of ui-common, exact-pinned.
  if (ctx.usesLab) {
    if (has(LAB)) pinExactly(LAB, ctx.labPin);
    else {
      labAdded = ensure(
        LAB,
        ctx.labPin,
        `: ${UIC}/lab needs it, and ${UIC} pins the lab canary exactly`,
      );
    }
  } else if (has(LAB)) {
    if (ctx.keepsLab) note(`${LAB} stays: a module still imports it (see the report).`);
    else drop(LAB, `no module uses ${UIC}/lab`);
  }

  // The Astryx CLI: kept, but it should be the one ui-common-cli wraps.
  for (const field of DEP_FIELDS) {
    const spec = pkg[field]?.[ASTRYX_CLI];
    if (typeof spec !== "string" || !ctx.astryxCliPin) continue;
    const resolved = resolveSpec(ASTRYX_CLI, spec, ctx.catalogs);
    if (resolved === ctx.astryxCliPin) continue;
    note(
      `${field}["${ASTRYX_CLI}"] is "${spec}"; ${CLI_PACKAGE} wraps ${ASTRYX_CLI} ${ctx.astryxCliPin}. Use \`ui-common <command>\` and drop it, or keep it at ${ctx.astryxCliPin}.`,
    );
  }

  const out = `${JSON.stringify(pkg, null, indent)}${text.endsWith("\n") ? "\n" : ""}`;
  return {
    text: out === text ? undefined : out,
    labAdded,
    declaresCore: DEP_FIELDS.some(
      (f) => f !== "peerDependencies" && pkg[f]?.[CORE] != null,
    ),
  };
}
