/**
 * `ui-common init --user`: the computer-level agent skill, ui-common's
 * counterpart of the one `astryx init --user` writes (Astryx 0.7.2).
 *
 * Astryx's skill tells every agent on the computer to run `astryx` and add
 * `@astryxdesign/core`; in a project that depends on @lablup/ui-common that
 * is the wrong advice. ui-common writes its own instead, from
 * `skill/ui-common/SKILL.md`, at `~/.agents/skills/ui-common/SKILL.md`, and
 * links its folder into the skill folders Astryx links its own into (the
 * table is Astryx's, `SKILL_LINKS`, so the two reach the same agents):
 * `~/.claude/skills` always, the others when their agent is installed, and a
 * managed copy where the agent skips links.
 *
 * The written file carries a hash line, so a file a person edited, a file
 * ui-common did not write, a symlinked file, and a link target holding
 * anything else are never changed or removed. The text is version-free, so
 * nothing refreshes it in the background; running the command again after
 * an upgrade does.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmdirSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

import { CLI_ROOT, importAstryxInternal } from "./paths.mjs";

export const USER_SKILL_NAME = "ui-common";
export const USER_SKILL_SOURCE = join(CLI_ROOT, "skill", USER_SKILL_NAME, "SKILL.md");

/** The skill folder, relative to the home folder: where Astryx keeps its own. */
const SKILL_FOLDER = join(".agents", "skills", USER_SKILL_NAME);
/** Astryx's skill file, which the receipt mentions when it is there too. */
const ASTRYX_SKILL = join(".agents", "skills", "astryx", "SKILL.md");

const HASH_LINE = /^<!-- ui-common-managed sha256:([0-9a-f]{64}) -->\n/m;

/** @param {string} text */
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/**
 * The file `init --user` writes: the shipped skill with a hash line after its
 * frontmatter, so a later run tells an unedited file from an edited one.
 *
 * @param {string} [source] the skill text
 */
export function renderUserSkill(source = readFileSync(USER_SKILL_SOURCE, "utf8")) {
  const end = source.indexOf("\n---\n", 4);
  if (!source.startsWith("---\n") || end === -1) {
    throw new Error(`${USER_SKILL_SOURCE} has no frontmatter`);
  }
  const cut = end + "\n---\n".length;
  return `${source.slice(0, cut)}<!-- ui-common-managed sha256:${sha256(source)} -->\n${source.slice(cut)}`;
}

/**
 * - `absent`: nothing there.
 * - `current`: exactly this release's rendering.
 * - `differs`: an unedited file ui-common wrote, from another release.
 * - `edited`: a file ui-common wrote that a person changed. Never touched.
 * - `foreign`: no hash line, a symlink, or not a regular file. Never touched.
 *
 * @typedef {'absent' | 'current' | 'differs' | 'edited' | 'foreign'} FileState
 */

/**
 * @param {string} file
 * @param {string} expected
 * @returns {FileState}
 */
function fileState(file, expected) {
  let stat;
  try {
    stat = lstatSync(file);
  } catch {
    return "absent";
  }
  if (!stat.isFile()) return "foreign";
  const content = readFileSync(file, "utf8");
  const match = HASH_LINE.exec(content);
  if (!match) return "foreign";
  if (content === expected) return "current";
  return sha256(content.replace(HASH_LINE, "")) === match[1] ? "differs" : "edited";
}

/**
 * Where a link sits: `linked` (a link to the skill folder), `absent`, a
 * managed copy (`copy`, unedited) or `foreign` (anything else; never touched).
 *
 * @param {string} at
 * @param {string} folder
 */
function linkState(at, folder) {
  let stat;
  try {
    stat = lstatSync(at);
  } catch {
    return "absent";
  }
  if (stat.isSymbolicLink()) {
    const target = resolve(dirname(at), readlinkSync(at));
    let real = target;
    try {
      real = realpathSync(target);
    } catch {
      // dangling: compare the target as written
    }
    let ours = folder;
    try {
      ours = realpathSync(folder);
    } catch {
      // the skill folder is gone
    }
    return real === ours || target === folder ? "linked" : "foreign";
  }
  if (!stat.isDirectory()) return "foreign";
  const entries = readdirSync(at);
  if (entries.length !== 1 || entries[0] !== "SKILL.md") return "foreign";
  const state = fileState(join(at, "SKILL.md"), "");
  return state === "differs" ? "copy" : "foreign";
}

/** @param {string} at @param {string} folder */
function makeLink(at, folder) {
  mkdirSync(dirname(at), { recursive: true });
  if (process.platform === "win32") {
    symlinkSync(folder, at, "junction");
    return;
  }
  const real = realpathSync(folder);
  const rel = relative(realpathSync(dirname(at)), real);
  symlinkSync(isAbsolute(rel) ? real : rel, at, "dir");
}

/** @param {string} file */
function removeFile(file) {
  unlinkSync(file);
  try {
    rmdirSync(dirname(file));
  } catch {
    // the folder holds something else
  }
}

/** `~/.claude/skills/ui-common` for a path in `home`. @param {string} file @param {string} home */
export function displayPath(file, home) {
  const rel = relative(home, file);
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? `~${sep}${rel}` : file;
}

/**
 * The skill folders to link, from Astryx's table, for the ui-common skill.
 *
 * @param {string} home
 * @returns {Promise<Array<{path: string, wanted: boolean, mode: 'link' | 'copy'}>>}
 */
export async function userSkillLinks(home) {
  const { SKILL_LINKS } = await importAstryxInternal(
    "foundation/agent-docs/computer-agent-text.mjs",
  );
  return /** @type {Array<{skills: string, when: string | null, mode: 'link' | 'copy'}>} */ (
    SKILL_LINKS
  ).map(({ skills, when, mode }) => ({
    path: join(home, skills, USER_SKILL_NAME),
    wanted: when == null || existsSync(join(home, when)),
    mode,
  }));
}

/**
 * @typedef {{path: string, action: 'written' | 'unchanged' | 'linked' | 'removed' | 'absent' | 'kept', reason?: string}} Row
 */

/**
 * Write or refresh the skill and link it where agents read it.
 *
 * @param {{home?: string, source?: string}} [options]
 * @returns {Promise<Row[]>}
 */
export async function writeUserSkill({ home = homedir(), source } = {}) {
  const expected = renderUserSkill(source);
  const folder = join(home, SKILL_FOLDER);
  const file = join(folder, "SKILL.md");
  /** @type {Row[]} */
  const rows = [];
  const state = fileState(file, expected);
  if (state === "current") rows.push({ path: file, action: "unchanged" });
  else if (state === "absent" || state === "differs") {
    mkdirSync(folder, { recursive: true });
    writeFileSync(file, expected);
    rows.push({ path: file, action: "written" });
  } else {
    rows.push({ path: file, action: "kept", reason: state });
    return rows;
  }
  for (const place of await userSkillLinks(home)) {
    if (!place.wanted) continue;
    const at = place.path;
    const now = linkState(at, folder);
    if (now === "linked") {
      rows.push({ path: at, action: "unchanged" });
      continue;
    }
    if (now === "foreign") {
      rows.push({ path: at, action: "kept", reason: "foreign" });
      continue;
    }
    if (place.mode === "link") {
      if (now === "copy") removeFile(join(at, "SKILL.md"));
      try {
        makeLink(at, folder);
        rows.push({ path: at, action: "linked" });
        continue;
      } catch {
        // no links on this file system: a managed copy instead
      }
    }
    const copy = join(at, "SKILL.md");
    if (fileState(copy, expected) === "current") {
      rows.push({ path: at, action: "unchanged" });
      continue;
    }
    mkdirSync(at, { recursive: true });
    writeFileSync(copy, expected);
    rows.push({ path: at, action: "written" });
  }
  return rows;
}

/**
 * Remove the skill, its links and its managed copies; anything ui-common did
 * not write, or a person edited, stays.
 *
 * @param {{home?: string}} [options]
 * @returns {Promise<Row[]>}
 */
export async function removeUserSkill({ home = homedir() } = {}) {
  const folder = join(home, SKILL_FOLDER);
  const file = join(folder, "SKILL.md");
  const state = fileState(file, "");
  if (state === "absent") return [{ path: file, action: "absent" }];
  // An edited or foreign file stays, and so do the links that reach it.
  if (state !== "differs") return [{ path: file, action: "kept", reason: state }];
  /** @type {Row[]} */
  const rows = [];
  for (const place of await userSkillLinks(home)) {
    const now = linkState(place.path, folder);
    if (now === "linked") unlinkSync(place.path);
    else if (now === "copy") removeFile(join(place.path, "SKILL.md"));
    else continue;
    rows.push({ path: place.path, action: "removed" });
  }
  removeFile(file);
  rows.unshift({ path: file, action: "removed" });
  return rows;
}

const VERBS = { written: "Wrote", linked: "Linked", removed: "Removed" };

const KEPT = {
  edited: "edited by hand, left as it is",
  foreign: "not written by ui-common, left as it is",
};

/**
 * @param {string[]} argv arguments after `init`, `--user` included
 * @param {{home?: string, out?: (s: string) => void, err?: (s: string) => void}} [io]
 * @returns {Promise<number>}
 */
export async function initUserCommand(argv, io = {}) {
  const home = io.home ?? homedir();
  const out = io.out ?? ((s) => process.stdout.write(s));
  const err = io.err ?? ((s) => process.stderr.write(s));
  let remove = false;
  for (const arg of argv) {
    if (arg === "--user") continue;
    if (arg === "--remove-agents") remove = true;
    else if (arg === "-h" || arg === "--help") {
      out(INIT_USER_HELP);
      return 0;
    } else {
      err(`ui-common init --user: unknown argument "${arg}"\n${INIT_USER_HELP}`);
      return 2;
    }
  }
  const rows = remove
    ? await removeUserSkill({ home })
    : await writeUserSkill({ home });
  for (const row of rows) {
    const where = displayPath(row.path, home);
    const line =
      row.action === "kept"
        ? `[keep] ${where}: ${KEPT[/** @type {'edited' | 'foreign'} */ (row.reason)] ?? row.reason}`
        : row.action === "absent"
          ? `[ok] ${where} was not there`
          : row.action === "unchanged"
            ? `[ok] ${where} is up to date`
            : `[ok] ${VERBS[row.action]} ${where}`;
    out(`${line}\n`);
  }
  if (!remove && existsSync(join(home, ASTRYX_SKILL))) {
    out(
      `Note: ${displayPath(join(home, ASTRYX_SKILL), home)} is Astryx's own skill, which steers agents to \`astryx\` and @astryxdesign/*. The ui-common skill tells them to use ui-common instead in a project that depends on @lablup/ui-common. If you do not use Astryx directly, remove Astryx's with \`ui-common astryx init --user --remove-agents\`.\n`,
    );
  }
  return rows.some((r) => r.action === "kept" && !remove && r.path.endsWith("SKILL.md"))
    ? 1
    : 0;
}

export const INIT_USER_HELP = `Usage: ui-common init --user [--remove-agents]

Install the ui-common agent skill for every agent on this computer:
~/.agents/skills/${USER_SKILL_NAME}/SKILL.md, linked into ~/.claude/skills and the
skill folders of the other agents Astryx reaches (Kiro, Windsurf, Letta,
Xcode, ~/.config/agents) when they are installed. It tells agents to use the
ui-common CLI (search, build, template, component, docs) and @lablup/ui-common
imports, not \`astryx\` and @astryxdesign/*, in a project that depends on
@lablup/ui-common. Run it again after upgrading @lablup/ui-common-cli.

This replaces what \`astryx init --user\` writes; \`ui-common astryx init --user\`
still runs Astryx's own.

  --remove-agents  Remove the skill, its links and its copies. A file you
                   edited, or one ui-common did not write, is kept.

Exit codes: 0 done, 1 the skill file was kept because it is not ui-common's
or was edited, 2 bad arguments.
`;
