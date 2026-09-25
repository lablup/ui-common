/**
 * Rewrite Astryx CLI output into ui-common terms.
 *
 * Every replacement is a plain substring swap between two strings that contain
 * no quote, backslash or control character, so it is safe inside JSON string
 * literals: `--json` output stays valid JSON.
 */
import { excludedExports } from "./paths.mjs";

/** Astryx CLI subcommands. Used to tell `astryx component` from `astryx-base`. */
export const ASTRYX_COMMANDS = [
  "init",
  "component",
  "docs",
  "blog",
  "swizzle",
  "gap-report",
  "template",
  "layout",
  "upgrade",
  "theme",
  "integration",
  "hook",
  "discover",
  "search",
  "build",
  "doctor",
  "manifest",
  "help",
];

const SPECIFIERS = [
  // Order matters: the bare package names last, so they never eat a subpath.
  [/@astryxdesign\/core(?=[/"'`\s),;:]|$)/g, "@lablup/ui-common"],
  [/@astryxdesign\/lab(?=[/"'`\s),;:]|$)/g, "@lablup/ui-common/lab"],
  [
    /@astryxdesign\/theme-neutral(?=[/"'`\s),;:]|$)/g,
    "@lablup/ui-common/theme/neutral",
  ],
];

/**
 * `@astryxdesign/core/Button` -> `@lablup/ui-common/Button`, and the lab and
 * neutral-theme packages onto their ui-common mirrors.
 *
 * @param {string} text
 */
export function rewriteSpecifiers(text) {
  let out = text;
  for (const [pattern, replacement] of SPECIFIERS) {
    out = out.replace(
      /** @type {RegExp} */ (pattern),
      /** @type {string} */ (replacement),
    );
  }
  return out;
}

/**
 * `pnpm exec astryx component X` -> `<invocation> component X`, and a bare
 * `astryx component` in prose -> `ui-common component`. `astryx-base`,
 * `astryx.css` and `.astryx-badge` are left alone: only the bin followed by a
 * real subcommand is rewritten.
 *
 * @param {string} text
 * @param {string} invocation how the project runs the ui-common bin
 */
export function rewriteCommands(text, invocation = "ui-common") {
  const commands = ASTRYX_COMMANDS.join("|");
  return (
    text
      // A one-off `npx @astryxdesign/cli` invocation, or an installed-bin
      // invocation through a package manager.
      .replace(
        /\b(?:npx|pnpm dlx|yarn dlx|bunx) @astryxdesign\/cli(?=[\s`'"]|$)/g,
        invocation,
      )
      .replace(
        /\b(?:npx|pnpm exec|pnpm|yarn|bunx|bun x|npm exec)\s+astryx(?=[\s`'"]|$)/g,
        invocation,
      )
      .replace(
        new RegExp(String.raw`(?<![\w/@.\-])astryx(?= (?:${commands})\b)`, "g"),
        "ui-common",
      )
  );
}

/**
 * Lines telling the reader that a name they are looking at is one ui-common
 * hides, and what to use instead.
 *
 * @param {string} text rewritten output
 * @param {string[]} args the command line, so `component Dialog` is caught
 *   even when the output never spells the name
 */
export function exclusionNotes(text, args = []) {
  const notes = [];
  for (const entry of excludedExports()) {
    // Asking about the replacement itself needs no pointer to it.
    if (!entry.replacedBy || args.includes(entry.replacedBy)) continue;
    const name = entry.name;
    const mention = new RegExp(String.raw`(?<![\w.-])${name}(?![\w.-])`);
    if (mention.test(text) || args.includes(name)) {
      notes.push(
        `Note: @lablup/ui-common does not export ${name}. Use ${entry.replacedBy} ` +
          `(@lablup/ui-common/${entry.replacedBy}), not ${name}. ${entry.reason}`,
      );
    }
  }
  return notes;
}

/**
 * The full output rewrite: specifiers, then command invocations.
 *
 * @param {string} text
 * @param {string} [invocation]
 */
export function rewriteOutput(text, invocation) {
  return rewriteCommands(rewriteSpecifiers(text), invocation);
}
