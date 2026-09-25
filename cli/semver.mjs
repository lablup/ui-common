/**
 * The little semver the upgrade registry needs: parse, compare with
 * prerelease precedence, and coerce the loose forms a person types
 * (`0.1`, `v0.1.0-alpha.19`) or a package.json holds (`^0.1.0-alpha.7`).
 */

const SEMVER =
  /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

/**
 * @param {string} input
 * @returns {{major: number, minor: number, patch: number, pre: string[]} | null}
 */
export function parse(input) {
  const match = SEMVER.exec(String(input).trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
    pre: match[4] ? match[4].split(".") : [],
  };
}

/** @param {{major: number, minor: number, patch: number, pre: string[]}} v */
export function format(v) {
  return `${v.major}.${v.minor}.${v.patch}${v.pre.length ? `-${v.pre.join(".")}` : ""}`;
}

/**
 * The first version a dependency spec admits, for `^0.1.0-alpha.7`,
 * `~0.1.0`, `0.1.0-alpha.19`, `>=0.1.0-alpha.0 <0.2.0`. Null for
 * `workspace:*`, tags and URLs.
 *
 * @param {string} spec
 */
export function coerce(spec) {
  const match = /(?:^|[\s^~>=<v])(\d+(?:\.\d+){0,2}(?:-[0-9A-Za-z.-]+)?)/.exec(
    ` ${String(spec).trim()}`,
  );
  if (!match) return null;
  const parsed = parse(match[1]);
  return parsed ? format(parsed) : null;
}

/** @param {string} a @param {string} b */
function compareIdentifiers(a, b) {
  const na = /^\d+$/.test(a);
  const nb = /^\d+$/.test(b);
  if (na && nb) return Number(a) - Number(b);
  if (na) return -1;
  if (nb) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Semver precedence. A version with a prerelease sorts before the same
 * version without one.
 *
 * @param {string} a
 * @param {string} b
 */
export function compare(a, b) {
  const va = parse(a);
  const vb = parse(b);
  if (!va || !vb) throw new Error(`Not a version: ${!va ? a : b}`);
  for (const key of /** @type {const} */ (["major", "minor", "patch"])) {
    if (va[key] !== vb[key]) return va[key] - vb[key];
  }
  if (va.pre.length === 0 || vb.pre.length === 0) {
    return vb.pre.length - va.pre.length;
  }
  for (let i = 0; i < Math.max(va.pre.length, vb.pre.length); i++) {
    const x = va.pre[i];
    const y = vb.pre[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const c = compareIdentifiers(x, y);
    if (c !== 0) return c;
  }
  return 0;
}

/**
 * The version after `version` for a release that carries a breaking change:
 * the next prerelease number while in prerelease, else the next minor (pre-1.0
 * a breaking change bumps the minor).
 *
 * @param {string} version
 */
export function nextBreaking(version) {
  const v = parse(version);
  if (!v) throw new Error(`Not a version: ${version}`);
  if (v.pre.length > 0) {
    const last = v.pre[v.pre.length - 1];
    const pre = /^\d+$/.test(last)
      ? [...v.pre.slice(0, -1), String(Number(last) + 1)]
      : [...v.pre, "1"];
    return format({ ...v, pre });
  }
  if (v.major === 0) return format({ major: 0, minor: v.minor + 1, patch: 0, pre: [] });
  return format({ major: v.major + 1, minor: 0, patch: 0, pre: [] });
}
