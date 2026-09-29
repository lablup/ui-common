/**
 * 0.1 -> 0.2 package.json edits:
 * - bump @lablup/ui-common to the target version (keeping `^`/`~`);
 * - add @lablup/ui-common-cli, the `ui-common` bin, to devDependencies at
 *   exactly the target version (0.1 shipped the bin inside ui-common);
 * - add the @stylexjs/stylex peer ui-common 0.2 needs, when missing;
 * - add @astryxdesign/lab, pinned to the canary ui-common is built against,
 *   when a Drawer import was moved to `@lablup/ui-common/lab`, and point its
 *   core peer at ui-common's core with the project's package manager's
 *   override (../../cli/lab-peer.mjs).
 */
import { applyLabOverride, CORE, detectPackageManager } from "../../cli/lab-peer.mjs";
import { targetUiCommonRoot, uiCommonPackageJson } from "../../cli/paths.mjs";
import { LAB_PACKAGE, stylexPeer, UIC } from "./map.mjs";

/** The CLI package, released in lockstep with ui-common. */
export const CLI_PACKAGE = "@lablup/ui-common-cli";

const FIELDS = /** @type {const} */ ([
  "dependencies",
  "devDependencies",
  "peerDependencies",
]);

/** @param {Record<string, string>} object */
function isSorted(object) {
  const keys = Object.keys(object);
  return keys.every((k, i) => i === 0 || keys[i - 1].localeCompare(k) <= 0);
}

/**
 * @param {any} pkg
 * @param {string} field
 * @param {string} name
 * @param {string} range
 */
function addDependency(pkg, field, name, range) {
  const current = pkg[field] ?? {};
  const next = { ...current, [name]: range };
  pkg[field] = isSorted(current)
    ? Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)))
    : next;
}

/**
 * @param {string} spec
 * @param {string} to
 * @returns {{value: string, note?: string} | null}
 */
function bumpSpec(spec, to) {
  if (/^(workspace:|link:|file:|npm:|git|https?:)/.test(spec)) return null;
  const simple = /^([\^~]?)v?\d+(\.\d+){0,2}(-[0-9A-Za-z.-]+)?$/.exec(spec.trim());
  if (simple) return { value: `${simple[1]}${to}` };
  return {
    value: `^${to}`,
    note: `the range "${spec}" was replaced with "^${to}"; widen it again if this package must still accept 0.1.`,
  };
}

/**
 * Point the lab canary's core peer at ui-common's core: `overrides` in
 * package.json for npm (the project's own, when it is the install root),
 * `overrides` in pnpm-workspace.yaml for pnpm, a note otherwise.
 *
 * @param {any} pkg parsed package.json, edited in place
 * @param {{projectDir?: string, note: (message: string) => void, editFile?: (path: string, edit: (current: string | null) => string | undefined) => void}} ctx
 */
function addLabOverride(pkg, ctx) {
  const pin = uiCommonPackageJson(targetUiCommonRoot(ctx.projectDir)).dependencies?.[
    CORE
  ];
  if (!pin || !ctx.projectDir || !ctx.editFile) return;
  const { manager, root, workspaceYaml } = detectPackageManager(ctx.projectDir, pkg);
  if (manager === "npm" && root !== ctx.projectDir) {
    // npm reads overrides from the install root's package.json only.
    const { note } = applyLabOverride({ manager: null, pin });
    ctx.note(`npm installs from ${root}, not this package: ${note}`);
    return;
  }
  if (manager === "pnpm" && workspaceYaml) {
    const yamlFile = workspaceYaml;
    ctx.editFile(yamlFile, (current) => {
      const edit = applyLabOverride({ manager, pin, workspaceYaml: current });
      if (edit.note) ctx.note(edit.note);
      return edit.workspaceYaml;
    });
    return;
  }
  const { note } = applyLabOverride({ manager, pin, pkg });
  ctx.note(note);
}

/**
 * @param {string} text package.json source
 * @param {{to: string, flags: {packages: Map<string, string>}, note: (message: string) => void}} ctx
 */
export function transformPackageJson(text, ctx) {
  const pkg = JSON.parse(text);
  const indent = /^([ \t]+)"/m.exec(text)?.[1] ?? "  ";
  const fields = FIELDS.filter((f) => pkg[f]?.[UIC] != null);
  if (fields.length === 0) return undefined;

  for (const field of fields) {
    const spec = pkg[field][UIC];
    const bumped = bumpSpec(spec, ctx.to);
    if (!bumped) {
      ctx.note(`${field}["${UIC}"] is "${spec}"; not a version, so it was left alone.`);
      continue;
    }
    if (bumped.value !== spec) {
      pkg[field][UIC] = bumped.value;
      ctx.note(`${field}["${UIC}"]: "${spec}" → "${bumped.value}".`);
    }
    if (bumped.note) ctx.note(`${field}["${UIC}"]: ${bumped.note}`);
  }

  const has = (/** @type {string} */ name) =>
    FIELDS.some((f) => pkg[f]?.[name] != null);

  // The bin moved out of ui-common into its own package. It is a dev-time
  // tool, pinned exactly: it upgrades to and reads the ui-common of its own
  // version.
  const cliField = FIELDS.find((f) => pkg[f]?.[CLI_PACKAGE] != null);
  if (!cliField) {
    addDependency(pkg, "devDependencies", CLI_PACKAGE, ctx.to);
    ctx.note(
      `added ${CLI_PACKAGE} ${ctx.to} to devDependencies: the \`ui-common\` bin ships in its own package since 0.2, released at the same version as ${UIC}.`,
    );
  } else {
    const spec = pkg[cliField][CLI_PACKAGE];
    const bumped = bumpSpec(spec, ctx.to);
    if (!bumped) {
      ctx.note(
        `${cliField}["${CLI_PACKAGE}"] is "${spec}"; not a version, so it was left alone.`,
      );
    } else if (spec !== ctx.to) {
      pkg[cliField][CLI_PACKAGE] = ctx.to;
      ctx.note(`${cliField}["${CLI_PACKAGE}"]: "${spec}" → "${ctx.to}".`);
    }
  }
  // A library that takes ui-common as a peer takes StyleX as a peer too;
  // an application depends on it.
  const library = fields.includes("peerDependencies");

  const stylex = stylexPeer();
  if (!has(stylex.name)) {
    if (library) {
      addDependency(pkg, "peerDependencies", stylex.name, stylex.range);
      if (fields.includes("devDependencies"))
        addDependency(pkg, "devDependencies", stylex.name, stylex.range);
      ctx.note(
        `added ${stylex.name} ${stylex.range} to peerDependencies${fields.includes("devDependencies") ? " and devDependencies" : ""}.`,
      );
    } else {
      const field = fields.includes("dependencies") ? "dependencies" : fields[0];
      addDependency(pkg, field, stylex.name, stylex.range);
      ctx.note(`added ${stylex.name} ${stylex.range} to ${field}.`);
    }
  }

  // Packages the map says a moved component needs (the lab Drawer).
  for (const [lab, range] of ctx.flags.packages) {
    if (has(lab)) continue;
    {
      const field = library
        ? "peerDependencies"
        : fields.includes("dependencies")
          ? "dependencies"
          : fields[0];
      addDependency(pkg, field, lab, range);
      if (library && fields.includes("devDependencies"))
        addDependency(pkg, "devDependencies", lab, range);
      ctx.note(
        lab === LAB_PACKAGE
          ? `added ${lab} ${range} to ${field}: a Drawer moved to ${UIC}/lab, and ui-common pins the lab canary exactly.`
          : `added ${lab} ${range} to ${field}.`,
      );
      if (lab === LAB_PACKAGE) addLabOverride(pkg, ctx);
    }
  }

  const out = `${JSON.stringify(pkg, null, indent)}${text.endsWith("\n") ? "\n" : ""}`;
  return out === text ? undefined : out;
}
