/**
 * 0.1 -> 0.2 package.json edits:
 * - bump @lablup/ui-common to the target version (keeping `^`/`~`);
 * - add the @stylexjs/stylex peer ui-common 0.2 needs, when missing;
 * - add @astryxdesign/lab, pinned to the canary ui-common is built against,
 *   when a Drawer import was moved to `@lablup/ui-common/lab`.
 */
import { mapping } from "./components.mjs";

const UIC = "@lablup/ui-common";
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
 * @param {string} text package.json source
 * @param {{to: string, flags: {peers: Set<string>}, uiCommonPeers: Record<string, string>, note: (message: string) => void}} ctx
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
  // A library that takes ui-common as a peer takes StyleX as a peer too;
  // an application depends on it.
  const library = fields.includes("peerDependencies");

  const stylex = mapping.packageJson.stylex;
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

  const lab = mapping.packageJson.lab.name;
  if (ctx.flags.peers.has(lab) && !has(lab)) {
    const range = ctx.uiCommonPeers[lab];
    if (range) {
      const field = library
        ? "peerDependencies"
        : fields.includes("dependencies")
          ? "dependencies"
          : fields[0];
      addDependency(pkg, field, lab, range);
      if (library && fields.includes("devDependencies"))
        addDependency(pkg, "devDependencies", lab, range);
      ctx.note(
        `added ${lab} ${range} to ${field}: a Drawer moved to ${UIC}/lab, and ui-common pins the lab canary exactly.`,
      );
    }
  }

  const out = `${JSON.stringify(pkg, null, indent)}${text.endsWith("\n") ? "\n" : ""}`;
  return out === text ? undefined : out;
}
