/**
 * `ui-common agents`: the agent block for a project that uses ui-common.
 *
 * Built from the block `astryx init --features agents` would write, rendered
 * in memory through the pinned CLI (nothing is written to disk to get it),
 * then rewritten into ui-common terms and extended with ui-common's own rules.
 * It lives between UI-COMMON markers, not ASTRYX ones, so `astryx init` and
 * `astryx upgrade` never overwrite it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import {
  binInvocation,
  customExports,
  dependencyDir,
  dependencyVersion,
  excludedExports,
  findProjectDir,
  importAstryxInternal,
  ownPackageJson,
} from "./paths.mjs";
import { rewriteOutput } from "./rewrite.mjs";

export const MARKER_START = "<!-- UI-COMMON:START -->";
export const MARKER_END = "<!-- UI-COMMON:END -->";
const ASTRYX_START = "<!-- ASTRYX:START -->";
const ASTRYX_END = "<!-- ASTRYX:END -->";

export const LAYER_ORDER =
  "@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;";

/** Files `--check` looks at when no `--write` target is given, in order. */
export const DEFAULT_AGENT_FILES = ["AGENTS.md", "CLAUDE.md", ".claude/CLAUDE.md"];

/**
 * The block `astryx init --features agents` would install in `cwd`.
 *
 * @param {string} cwd
 */
async function renderAstryxBlock(cwd) {
  const { renderAgentDocsBlock } = await importAstryxInternal(
    "foundation/agent-docs/agent-docs.mjs",
  );
  return /** @type {string} */ (await renderAgentDocsBlock(cwd));
}

/**
 * Astryx counts components from the core it finds under the project. A
 * consumer that depends on ui-common alone has no core of its own there, and
 * the header falls back to "90+"; count from the core ui-common pins instead.
 */
async function coreComponentCount() {
  const coreDir = dependencyDir("@astryxdesign/core");
  if (!coreDir) return null;
  try {
    const { discoverComponents } = await importAstryxInternal(
      "foundation/discovery/component-discovery.mjs",
    );
    let total = 0;
    for (const list of Object.values(discoverComponents(coreDir))) {
      total += /** @type {unknown[]} */ (list).length;
    }
    return total > 0 ? total : null;
  } catch {
    return null;
  }
}

/** ui-common's own lines, appended to the rewritten Astryx block. */
function uiCommonSection({ version, astryxVersion, invocation }) {
  const components = customExports()
    .filter((c) => !c.legacy && /^[A-Z]/.test(c.name))
    .map((c) => c.name);
  const lines = [
    `UI-COMMON (@lablup/ui-common v${version} wraps Astryx v${astryxVersion}):`,
    "- Import only from @lablup/ui-common: the root, or the same subpath Astryx uses (@lablup/ui-common/Button, /theme/tokens.stylex, /lab). Never import @astryxdesign/* directly.",
    `- Layers: declare \`${LAYER_ORDER}\` once, first, in the entry stylesheet. ui-common's styles sit in \`ui-common\`; yours go in \`components\` / \`utilities\`.`,
  ];
  for (const entry of excludedExports()) {
    if (!entry.replacedBy) continue;
    lines.push(
      `- Use ${entry.replacedBy} (@lablup/ui-common/${entry.replacedBy}), not ${entry.name}: ui-common hides ${entry.name}.`,
    );
  }
  lines.push(
    "- Theme: <Theme theme={lablupTheme}> with lablupTheme from @lablup/ui-common/theme/lablup/built, plus @lablup/ui-common/theme/lablup/theme.css. A product palette is its own defineTheme over lablupTheme.",
    "- Strings: every built-in string is a prop; defaults come from ui-common's catalog. Pass uiCommonMessages from @lablup/ui-common/i18n-catalog to Astryx's InternationalizationProvider. Never a product i18n runtime.",
  );
  if (components.length > 0) {
    lines.push(
      `- ui-common's own components: ${components.join(", ")}. \`${invocation} docs ui-common\` explains them.`,
    );
  }
  lines.push(
    `- After bumping @lablup/ui-common: \`${invocation} upgrade --from <old version>\`, then read ui-common-upgrade-report.md.`,
  );
  return lines;
}

/**
 * Turn the Astryx block into the ui-common block. Exported for the tests.
 *
 * @param {string} astryxBlock
 * @param {{version: string, astryxVersion: string, invocation: string, componentCount?: number|null}} ctx
 */
export function transformBlock(astryxBlock, ctx) {
  const { invocation, componentCount } = ctx;
  let lines = astryxBlock.split("\n");

  // Markers.
  lines = lines.filter((l) => l !== ASTRYX_START && l !== ASTRYX_END);

  // Header.
  lines = lines.map((l) => {
    const header = /^Astryx v(\S+) · (\S+) components$/.exec(l);
    if (!header) return l;
    const count =
      header[2] === "90+" && componentCount ? String(componentCount) : header[2];
    return `@lablup/ui-common v${ctx.version} · Astryx v${header[1]} · ${count} components`;
  });

  // SETUP: ui-common's stylesheet entry replaces Astryx's two imports.
  const setupAt = lines.findIndex((l) => l.startsWith("SETUP"));
  if (setupAt !== -1) {
    let end = setupAt + 1;
    while (end < lines.length && lines[end].trim() !== "") end++;
    lines.splice(
      setupAt,
      end - setupAt,
      "SETUP (once, first in your entry stylesheet) — without these, components render unstyled:",
      `  ${LAYER_ORDER}`,
      '  @import "@lablup/ui-common/reset.css";',
      '  @import "@lablup/ui-common/astryx.css";',
      '  @import "@lablup/ui-common/theme/lablup/theme.css";',
      '  @import "@lablup/ui-common/ui-common.css";',
    );
  }

  // Integration lines ui-common contributes itself are restated below, in
  // ui-common's own section; keep every other integration's.
  lines = lines.filter((l) => !l.startsWith("- `@lablup/ui-common`:"));
  const integrationsAt = lines.indexOf("INTEGRATIONS:");
  if (integrationsAt !== -1 && !(lines[integrationsAt + 1] ?? "").startsWith("- ")) {
    lines.splice(integrationsAt, 1);
    if (lines[integrationsAt - 1] === "") lines.splice(integrationsAt - 1, 1);
  }

  lines = lines.map((l) =>
    l
      .replace(/\(shown below as `astryx \.\.\.`\)/, "(shown below as `ui-common ...`)")
      .replace(
        /^ {2}upgrade --apply {4}.*$/,
        "  upgrade --from <v> run after bumping @lablup/ui-common: ui-common's codemods, then Astryx's",
      ),
  );

  let text = rewriteOutput(lines.join("\n"), invocation);
  // `ui-common ...` in the CLI line refers to the bin; bare `astryx` mentions
  // left in prose name the design system and stay.
  text = text.replace(/\n+$/, "");

  return [MARKER_START, text, "", ...uiCommonSection(ctx), MARKER_END].join("\n");
}

/**
 * Generate the block for the project at `cwd`.
 *
 * @param {string} cwd
 */
export async function generateBlock(cwd) {
  const projectDir = findProjectDir(cwd) ?? cwd;
  const astryxBlock = await renderAstryxBlock(projectDir);
  return transformBlock(astryxBlock, {
    version: ownPackageJson().version,
    astryxVersion: dependencyVersion("@astryxdesign/core") ?? "unknown",
    invocation: binInvocation(projectDir),
    componentCount: await coreComponentCount(),
  });
}

/**
 * Locate the one UI-COMMON block in `content`.
 *
 * @param {string} content
 * @returns {{start: number, end: number} | null}
 */
export function findBlock(content) {
  const start = content.indexOf(MARKER_START);
  if (start === -1) {
    if (content.includes(MARKER_END)) {
      throw new Error(`Malformed agent block: ${MARKER_END} without ${MARKER_START}.`);
    }
    return null;
  }
  if (content.indexOf(MARKER_START, start + MARKER_START.length) !== -1) {
    throw new Error(`Malformed agent block: more than one ${MARKER_START}.`);
  }
  const endAt = content.indexOf(MARKER_END, start);
  if (endAt === -1) {
    throw new Error(`Malformed agent block: ${MARKER_START} without ${MARKER_END}.`);
  }
  return { start, end: endAt + MARKER_END.length };
}

/**
 * The file's content with `block` in place of its UI-COMMON block, or with
 * `block` appended when it has none. Text outside the markers is untouched.
 *
 * @param {string|null} content null when the file does not exist
 * @param {string} block
 */
export function injectBlock(content, block) {
  if (content == null || content === "") return `${block}\n`;
  const found = findBlock(content);
  if (found) return content.slice(0, found.start) + block + content.slice(found.end);
  return `${content.replace(/\s+$/, "")}\n\n${block}\n`;
}

/**
 * @param {string[]} argv arguments after `agents`
 * @returns {Promise<number>}
 */
export async function agentsCommand(argv) {
  /** @type {string|undefined} */
  let write;
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--write") {
      write = argv[++i];
      if (!write) {
        process.stderr.write("ui-common agents: --write needs a file path\n");
        return 2;
      }
    } else if (arg.startsWith("--write=")) {
      write = arg.slice("--write=".length);
    } else if (arg === "--check") {
      check = true;
    } else if (arg === "-h" || arg === "--help") {
      process.stdout.write(AGENTS_HELP);
      return 0;
    } else {
      process.stderr.write(
        `ui-common agents: unknown argument "${arg}"\n${AGENTS_HELP}`,
      );
      return 2;
    }
  }

  const cwd = process.cwd();
  let block;
  try {
    block = await generateBlock(cwd);
  } catch (err) {
    process.stderr.write(`ui-common agents: ${/** @type {Error} */ (err).message}\n`);
    return 1;
  }

  if (check) {
    const projectDir = findProjectDir(cwd) ?? cwd;
    const candidates = write
      ? [resolve(cwd, write)]
      : DEFAULT_AGENT_FILES.map((f) => join(projectDir, f));
    for (const file of candidates) {
      if (!existsSync(file)) continue;
      const content = readFileSync(file, "utf8");
      let found;
      try {
        found = findBlock(content);
      } catch (err) {
        process.stderr.write(
          `ui-common agents: ${file}: ${/** @type {Error} */ (err).message}\n`,
        );
        return 1;
      }
      if (!found) continue;
      if (content.slice(found.start, found.end) === block) {
        process.stdout.write(`ui-common agents: ${file} is up to date.\n`);
        return 0;
      }
      process.stderr.write(
        `ui-common agents: the ui-common block in ${file} is stale. Run \`ui-common agents --write ${write ?? file}\`.\n`,
      );
      return 1;
    }
    process.stderr.write(
      `ui-common agents: no ui-common block found in ${candidates.join(", ")}.\n`,
    );
    return 1;
  }

  if (write) {
    const file = resolve(cwd, write);
    const before = existsSync(file) ? readFileSync(file, "utf8") : null;
    let after;
    try {
      after = injectBlock(before, block);
    } catch (err) {
      process.stderr.write(
        `ui-common agents: ${file}: ${/** @type {Error} */ (err).message}\n`,
      );
      return 1;
    }
    if (after === before) {
      process.stdout.write(`ui-common agents: ${write} is already up to date.\n`);
      return 0;
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, after);
    process.stdout.write(`ui-common agents: wrote the ui-common block to ${write}.\n`);
    return 0;
  }

  process.stdout.write(`${block}\n`);
  return 0;
}

export const AGENTS_HELP = `Usage: ui-common agents [--write <file>] [--check]

Print the ui-common agent block: Astryx's \`init --features agents\` block,
rewritten for @lablup/ui-common, between ${MARKER_START} and ${MARKER_END}.

  --write <file>  Put the block in <file>, replacing an existing ui-common block
                  and keeping everything outside the markers. Creates the file.
  --check         Exit 1 when the block in <file> (or the first of AGENTS.md,
                  CLAUDE.md, .claude/CLAUDE.md that has one) is stale or missing.
`;
