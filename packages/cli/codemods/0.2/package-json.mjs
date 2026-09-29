/**
 * 0.1 -> 0.2 package.json edits:
 * - bump @lablup/ui-common to the target version (keeping `^`/`~`);
 * - add @lablup/ui-common-cli, the `ui-common` bin, to devDependencies at
 *   exactly the target version (0.1 shipped the bin inside ui-common);
 * - add the @stylexjs/stylex peer ui-common 0.2 needs, when missing;
 * - in a library, drop React 18 from the react / react-dom peer ranges;
 * - in a pnpm project, decline the Astryx postinstalls in `allowBuilds`;
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

/** Packages whose postinstall pnpm 11 must be told to run or skip. */
export const DECLINED_BUILDS = ["@astryxdesign/core", "@astryxdesign/cli"];

/**
 * `pnpm-workspace.yaml` with `allowBuilds` declining each of `names` it does
 * not decide yet. An entry set to true or false is left as it is; one with
 * any other value (pnpm writes "set this to true or false" when it stops an
 * install) counts as undecided and is set to false. Comments and every other
 * line are kept.
 *
 * @param {string | null} yaml current text, null when there is no file
 * @param {string[]} names
 * @returns {{yaml?: string, notes: string[]}}
 */
export function applyAllowBuilds(yaml, names) {
  const line = (/** @type {string} */ name, indent = "  ") =>
    `${indent}"${name}": false`;
  const why =
    "their postinstall only prints an `astryx init` nudge, and pnpm 11 stops the install (ERR_PNPM_IGNORED_BUILDS) until each is allowed or declined";
  if (yaml == null) {
    return {
      yaml: `allowBuilds:\n${names.map((n) => line(n)).join("\n")}\n`,
      notes: [
        `wrote pnpm-workspace.yaml with allowBuilds declining ${names.join(", ")}: ${why}.`,
      ],
    };
  }
  const block = /^allowBuilds:[ \t]*(#.*)?(\r?\n)/m.exec(yaml);
  if (!block) {
    if (/^allowBuilds\s*:/m.test(yaml)) {
      return {
        notes: [
          `pnpm-workspace.yaml has an allowBuilds entry this cannot edit; decline ${names.join(", ")} in it: ${why}.`,
        ],
      };
    }
    const base = yaml.replace(/\s*$/, "");
    return {
      yaml: `${base}${base ? "\n\n" : ""}allowBuilds:\n${names.map((n) => line(n)).join("\n")}\n`,
      notes: [
        `added allowBuilds declining ${names.join(", ")} to pnpm-workspace.yaml: ${why}.`,
      ],
    };
  }
  const at = block.index + block[0].length;
  const after = yaml.slice(at);
  const end = /^\S/m.exec(after)?.index ?? after.length;
  let body = after.slice(0, end);
  const indent = /^([ \t]+)\S/m.exec(body)?.[1] ?? "  ";
  const notes = [];
  const added = [];
  for (const name of names) {
    const esc = name.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    const entry = new RegExp(
      `^([ \\t]+["']?${esc}["']?[ \\t]*:[ \\t]*)([^\\r\\n#]*?)([ \\t]*(#.*)?)$`,
      "m",
    );
    const match = entry.exec(body);
    if (!match) {
      added.push(name);
      continue;
    }
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (value === "true" || value === "false") continue;
    body = body.replace(entry, (_m, head, _v, tail) => `${head}false${tail}`);
    notes.push(
      `pnpm-workspace.yaml allowBuilds["${name}"] was "${match[2].trim()}", which pnpm does not accept; set it to false.`,
    );
  }
  if (added.length > 0) {
    const trimmed = body.replace(/\s*$/, "");
    const rest = body.slice(trimmed.length);
    body = `${trimmed}${trimmed ? "\n" : ""}${added.map((n) => line(n, indent)).join("\n")}${rest.includes("\n") ? rest : "\n"}`;
    notes.push(
      `added ${added.join(", ")} to allowBuilds in pnpm-workspace.yaml, declined: ${why}.`,
    );
  }
  const next = `${yaml.slice(0, at)}${body}${after.slice(end)}`;
  return next === yaml ? { notes } : { yaml: next, notes };
}

/**
 * `range` without its alternatives that accept React below 19
 * (`^18.2.0 || ^19.0.0` → `^19.0.0`); `fallback` when none is left.
 *
 * @param {string} range
 * @param {string} fallback
 */
export function dropBelow19(range, fallback) {
  if (/^(workspace:|link:|file:|npm:|catalog:)/.test(range.trim())) return range;
  const alternatives = range.split("||").map((a) => a.trim());
  const kept = alternatives.filter((a) => {
    const major = /(\d+)/.exec(a)?.[1];
    return major != null && Number(major) >= 19 && !/^<|^\*|^x/i.test(a);
  });
  if (kept.length === alternatives.length) return range;
  return kept.length > 0 ? kept.join(" || ") : fallback;
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

  // 0.2 needs React 19: a library that still accepts 18 in its peers would
  // install beside a React 18 app and break there.
  const reactPeers =
    uiCommonPackageJson(targetUiCommonRoot(ctx.projectDir)).peerDependencies ?? {};
  for (const name of ["react", "react-dom"]) {
    const spec = pkg.peerDependencies?.[name];
    if (library && typeof spec === "string") {
      const next = dropBelow19(spec, reactPeers[name] ?? "^19.0.0");
      if (next !== spec) {
        pkg.peerDependencies[name] = next;
        ctx.note(
          `peerDependencies["${name}"]: "${spec}" → "${next}": ${UIC} 0.2 needs React 19.`,
        );
      }
    }
    const own = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
    if (typeof own === "string" && dropBelow19(own, "") !== own) {
      ctx.note(
        `${pkg.dependencies?.[name] ? "dependencies" : "devDependencies"}["${name}"] is "${own}": ${UIC} 0.2 needs React 19; upgrade React too.`,
      );
    }
  }

  // pnpm 11 refuses to install until the Astryx postinstalls are decided.
  if (ctx.projectDir && ctx.editFile) {
    const { manager, workspaceYaml } = detectPackageManager(ctx.projectDir, pkg);
    if (manager === "pnpm" && workspaceYaml) {
      ctx.editFile(workspaceYaml, (current) => {
        const edit = applyAllowBuilds(current, DECLINED_BUILDS);
        for (const note of edit.notes) ctx.note(note);
        return edit.yaml;
      });
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
