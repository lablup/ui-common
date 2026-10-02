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

/**
 * @typedef {{version: string, inclusive: boolean, text?: string}} Bound
 * `text` is the comparator as written, kept when the bound survives.
 */

/**
 * A partial version (`19`, `19.x`, `19.2.*`) as its first admitted version
 * and the version its x-range stops before. Null for anything else.
 *
 * @param {string} input
 */
function partial(input) {
  const m =
    /^v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(
      input,
    );
  if (!m) return null;
  const wild = (/** @type {string | undefined} */ s) => s == null || /^[xX*]$/.test(s);
  if (wild(m[1])) return { min: null, end: null, full: false, parts: 0 };
  const major = Number(m[1]);
  if (wild(m[2]))
    return { min: `${major}.0.0`, end: `${major + 1}.0.0`, full: false, parts: 1 };
  const minor = Number(m[2]);
  if (wild(m[3]))
    return {
      min: `${major}.${minor}.0`,
      end: `${major}.${minor + 1}.0`,
      full: false,
      parts: 2,
    };
  const version = `${major}.${minor}.${Number(m[3])}${m[4] ? `-${m[4]}` : ""}`;
  return { min: version, end: null, full: true, parts: 3 };
}

/**
 * One `||` alternative as a lower and an upper bound; null when it is not a
 * range this reads (a tag, a URL).
 *
 * @param {string} alternative
 * @returns {{lower: Bound | null, upper: Bound | null, hyphen?: string} | null}
 */
function bounds(alternative) {
  const text = alternative.trim();
  if (text === "") return { lower: null, upper: null };
  const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(text);
  if (hyphen) {
    const from = partial(hyphen[1]);
    const to = partial(hyphen[2]);
    if (!from || !to) return null;
    return {
      lower: from.min ? { version: from.min, inclusive: true } : null,
      upper: to.full
        ? { version: /** @type {string} */ (to.min), inclusive: true }
        : to.end
          ? { version: to.end, inclusive: false }
          : null,
      hyphen: hyphen[2],
    };
  }
  /** @type {Bound | null} */
  let lower = null;
  /** @type {Bound | null} */
  let upper = null;
  /** @param {Bound} b */
  const raise = (b) => {
    if (!lower || compare(b.version, lower.version) > 0) lower = b;
  };
  /** @param {Bound} b */
  const cap = (b) => {
    const c = upper ? compare(b.version, upper.version) : -1;
    if (c < 0 || (c === 0 && !b.inclusive)) upper = b;
  };
  for (const token of text.replace(/(<=|>=|[<>=^~])\s+/g, "$1").split(/\s+/)) {
    const m = /^(<=|>=|<|>|=|\^|~)?(.*)$/.exec(token);
    const op = m?.[1] ?? "";
    const v = partial(m?.[2] ?? "");
    if (!v) return null;
    if (!v.min) {
      // `*`, `x`, `>=*`: no bound; `<*` admits nothing.
      if (op === "<" || op === ">")
        return { lower: null, upper: { version: "0.0.0", inclusive: false } };
      continue;
    }
    const at = /** @type {string} */ (v.min);
    if (op === "^" || op === "~") {
      const p = /** @type {{major: number, minor: number, patch: number}} */ (
        parse(at)
      );
      raise({ version: at, inclusive: true });
      const end =
        op === "~"
          ? v.parts >= 2
            ? `${p.major}.${p.minor + 1}.0`
            : `${p.major + 1}.0.0`
          : p.major > 0 || v.parts === 1
            ? `${p.major + 1}.0.0`
            : p.minor > 0 || v.parts === 2
              ? `0.${p.minor + 1}.0`
              : `0.0.${p.patch + 1}`;
      cap({ version: end, inclusive: false });
    } else if (op === ">=") raise({ version: at, inclusive: true, text: token });
    else if (op === ">")
      raise(
        v.full
          ? { version: at, inclusive: false, text: token }
          : { version: /** @type {string} */ (v.end), inclusive: true, text: token },
      );
    else if (op === "<") cap({ version: at, inclusive: false, text: token });
    else if (op === "<=")
      cap(
        v.full
          ? { version: at, inclusive: true, text: token }
          : { version: /** @type {string} */ (v.end), inclusive: false, text: token },
      );
    else {
      raise({ version: at, inclusive: true });
      cap(
        v.full
          ? { version: at, inclusive: true }
          : { version: /** @type {string} */ (v.end), inclusive: false },
      );
    }
  }
  return { lower, upper };
}

/**
 * `range` narrowed to the versions at or above `floor`, alternative by
 * alternative: `>=18 <21 || ^22` at 19.2.0 is `>=19.2.0 <21 || ^22`. An
 * alternative already above the floor keeps its text; one wholly below it is
 * dropped. Null when nothing is left; `range` itself when it is not a range
 * this reads.
 *
 * @param {string} range
 * @param {string} floor a full version
 * @returns {string | null}
 */
export function narrowToFloor(range, floor) {
  const f = parse(floor);
  if (!f) throw new Error(`Not a version: ${floor}`);
  const alternatives = range.split("||").map((a) => a.trim());
  const parsed = alternatives.map(bounds);
  if (parsed.some((b) => b == null)) return range;
  /** @type {string[]} */
  const kept = [];
  for (const [i, b] of /** @type {NonNullable<ReturnType<typeof bounds>>[]} */ (
    parsed
  ).entries()) {
    const { lower, upper } = b;
    if (lower && compare(lower.version, floor) >= 0) {
      kept.push(alternatives[i]);
      continue;
    }
    if (upper) {
      const c = compare(upper.version, floor);
      if (c < 0 || (c === 0 && !upper.inclusive)) continue;
    }
    let next;
    if (!upper) next = `>=${floor}`;
    else if (b.hyphen != null) next = `${floor} - ${b.hyphen}`;
    else if (!upper.inclusive && upper.version === `${f.major + 1}.0.0` && f.major > 0)
      next = `^${floor}`;
    else if (upper.inclusive && upper.version === floor) next = floor;
    else
      next = `>=${floor} ${upper.text ?? `${upper.inclusive ? "<=" : "<"}${upper.version}`}`;
    kept.push(next);
  }
  const unique = [...new Set(kept)];
  if (unique.length === 0) return null;
  return unique.length === alternatives.length &&
    unique.every((a, i) => a === alternatives[i])
    ? range
    : unique.join(" || ");
}
