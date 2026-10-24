/**
 * ui-common's form controls as a consumer's source meets them: the names
 * ui-common exports as `Form.Item` wrappers, the local names a module binds
 * them to, and the Astryx field chrome they do not take. Shared by
 * `ui-common adopt` (moving from Astryx) and the 0.2.0-alpha.20 upgrade step
 * (the release that made them wrappers).
 */
import { customExports } from "../../cli/paths.mjs";
import { lineAt, lineTextAt } from "../../cli/project.mjs";

/**
 * @typedef {{category: string, file: string, line: number, text: string, detail?: string}} Finding
 */

/** Astryx props ui-common's form-control wrappers do not take. */
export const CHROME_PROPS = [
  "label",
  "isLabelHidden",
  "description",
  "labelTooltip",
  "labelIcon",
  "isRequired",
  "isOptional",
  "isDisabled",
  "statusVariant",
  "status",
];

/**
 * The names ui-common exports as Form.Item wrappers (exports.customs.json,
 * `wraps` on a `formControls/` source), from the ui-common being adopted.
 *
 * @param {string} root
 */
export function formControlWrappers(root) {
  return new Set(
    customExports(root)
      .filter(
        (/** @type {any} */ c) =>
          c.wraps != null && c.source.startsWith("formControls/"),
      )
      .map((c) => c.name),
  );
}

/**
 * Local names a module binds to ui-common's form-control wrappers.
 *
 * @param {string} text
 * @param {Set<string>} wrappers
 */
export function wrapperBindings(text, wrappers) {
  /** @type {Map<string, string>} */
  const local = new Map();
  for (const m of text.matchAll(
    /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]@lablup\/ui-common(?:\/([A-Za-z]+))?['"]/g,
  )) {
    for (const part of m[1].split(",")) {
      const named =
        /^\s*(?:type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?\s*$/.exec(
          part,
        );
      if (!named || !wrappers.has(named[1])) continue;
      if (m[2] && m[2] !== named[1]) continue;
      local.set(named[2] ?? named[1], named[1]);
    }
  }
  return local;
}

/**
 * The attribute text of the JSX opening tag that starts at `start` (after
 * `<Name`), up to its closing `>` outside braces and strings.
 *
 * @param {string} text
 * @param {number} start
 */
function openingTag(text, start) {
  let depth = 0;
  /** @type {string | null} */
  let quote = null;
  for (let i = start; i < text.length && i < start + 4000; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return text.slice(start, i);
  }
  return text.slice(start, start + 4000);
}

/**
 * JSX of ui-common's form-control wrappers that passes the field chrome
 * Astryx's controls take and the wrappers do not. A text scan: it reads
 * attribute names only, so it also runs where a file does not parse.
 *
 * @param {string} file
 * @param {string} text
 * @param {Set<string>} wrappers
 * @param {string} [category]
 * @returns {Finding[]}
 */
export function scanFormControls(file, text, wrappers, category = "form-controls") {
  /** @type {Finding[]} */
  const out = [];
  const bindings = wrapperBindings(text, wrappers);
  if (bindings.size === 0) return out;
  const tag = new RegExp(`<(${[...bindings.keys()].join("|")})(?=[\\s/>])`, "g");
  const prop = new RegExp(
    `(?:^|[\\s}])(${CHROME_PROPS.join("|")})(?=\\s*=|[\\s/]|$)`,
    "g",
  );
  for (const m of text.matchAll(tag)) {
    const attrs = openingTag(text, (m.index ?? 0) + m[0].length);
    // Attribute names only: values (strings, expressions) become a space.
    let flat = "";
    let depth = 0;
    /** @type {string | null} */
    let quote = null;
    for (const c of attrs) {
      if (quote) {
        if (c === quote) quote = null;
      } else if (depth === 0 && (c === '"' || c === "'")) quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (depth === 0) {
        flat += c;
        continue;
      }
      flat += " ";
    }
    const props = [...new Set([...flat.matchAll(prop)].map((p) => p[1]))];
    if (props.length === 0) continue;
    const index = m.index ?? 0;
    out.push({
      category,
      file,
      line: lineAt(text, index),
      text: lineTextAt(text, index),
      detail: `${bindings.get(m[1])}: ${props.map((p) => `\`${p}\``).join(", ")}`,
    });
  }
  return out;
}
