/**
 * `ui-common <astryx command> …`: run the pinned Astryx CLI and hand its
 * output back in ui-common terms.
 *
 * The child's stdout and stderr are buffered, rewritten, then written; the
 * exit code is the child's. `--json` output is rewritten inside its strings
 * and re-checked, so it stays valid JSON. Notes about hidden names go to
 * stderr in that mode, never into the JSON.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { astryxBin, binInvocation, findProjectDir } from "./paths.mjs";
import { createShadow, needsShadow } from "./shadow.mjs";
import { exclusionNotes, rewriteOutput } from "./rewrite.mjs";

const UI_COMMON_MARKER = "<!-- UI-COMMON:START -->";
const AGENT_DOC_FILES = ["AGENTS.md", "CLAUDE.md", ".claude/CLAUDE.md", ".cursorrules"];

/** @param {string} dir */
function hasUiCommonBlock(dir) {
  return AGENT_DOC_FILES.some((f) => {
    const file = join(dir, f);
    return existsSync(file) && readFileSync(file, "utf8").includes(UI_COMMON_MARKER);
  });
}

/**
 * Astryx nudges every command toward `astryx init` until an ASTRYX block
 * exists. A ui-common project keeps a UI-COMMON block instead, so point the
 * nudge there, or drop it when that block is present.
 *
 * @param {string} stderr
 * @param {string} cwd
 * @param {string} invocation
 */
function rewriteSetupNudge(stderr, cwd, invocation) {
  const nudge =
    /\n?Next step: run `[^`]*init` to finish setup and install the Astryx agent prompt\.\n?/;
  if (!nudge.test(stderr)) return stderr;
  const project = findProjectDir(cwd);
  if (project && hasUiCommonBlock(project)) return stderr.replace(nudge, "");
  return stderr.replace(
    nudge,
    `\nNext step: run \`${invocation} agents --write AGENTS.md\` to install the ui-common agent block.\n`,
  );
}

/**
 * Run the pinned astryx bin with `args` and collect its output.
 *
 * @param {string[]} args
 * @param {{cwd?: string, env?: NodeJS.ProcessEnv}} [options]
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
export function runAstryx(args, { cwd = process.cwd(), env = process.env } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [astryxBin(), ...args], {
      cwd,
      env,
      stdio: ["inherit", "pipe", "pipe"],
    });
    /** @type {Buffer[]} */
    const out = [];
    /** @type {Buffer[]} */
    const err = [];
    child.stdout.on("data", (chunk) => out.push(chunk));
    child.stderr.on("data", (chunk) => err.push(chunk));
    child.on("error", reject);
    child.on("close", (code, signal) => {
      resolvePromise({
        code: code ?? (signal ? 128 + (signalNumber(signal) ?? 1) : 1),
        stdout: Buffer.concat(out).toString("utf8"),
        stderr: Buffer.concat(err).toString("utf8"),
      });
    });
  });
}

/** @param {NodeJS.Signals} signal */
function signalNumber(signal) {
  return { SIGHUP: 1, SIGINT: 2, SIGQUIT: 3, SIGKILL: 9, SIGTERM: 15 }[signal];
}

/**
 * Rewrite one captured run. Exported for the tests.
 *
 * @param {{stdout: string, stderr: string}} result
 * @param {{args: string[], cwd: string, invocation: string}} ctx
 */
export function rewriteRun({ stdout, stderr }, { args, cwd, invocation }) {
  const json = args.includes("--json");
  let newStdout = rewriteOutput(stdout, invocation);
  if (json && stdout.trim()) {
    // Belt and braces: the substitutions cannot break JSON, but if they ever
    // did, hand back Astryx's own output rather than something unparseable.
    try {
      JSON.parse(stdout);
      try {
        JSON.parse(newStdout);
      } catch {
        newStdout = stdout;
      }
    } catch {
      // Astryx did not print JSON either; nothing to protect.
    }
  }
  let newStderr = rewriteSetupNudge(rewriteOutput(stderr, invocation), cwd, invocation);
  const notes = exclusionNotes(newStdout, args);
  if (notes.length > 0) {
    if (json) {
      newStderr += `${newStderr && !newStderr.endsWith("\n") ? "\n" : ""}${notes.join("\n")}\n`;
    } else {
      newStdout += `${newStdout && !newStdout.endsWith("\n") ? "\n" : ""}\n${notes.join("\n")}\n`;
    }
  }
  return { stdout: newStdout, stderr: newStderr };
}

/**
 * @param {string[]} args
 * @param {{raw?: boolean}} [options] raw: no rewriting (`ui-common astryx …`)
 * @returns {Promise<number>} exit code
 */
export async function passthrough(args, { raw = false } = {}) {
  const cwd = process.cwd();
  let result;
  if (needsShadow(args, cwd)) {
    const shadow = createShadow(cwd);
    try {
      result = await runAstryx(args, { cwd: shadow.dir });
    } finally {
      shadow.cleanup();
    }
    // Paths Astryx printed point into the shadow; show the project's.
    for (const key of /** @type {const} */ (["stdout", "stderr"])) {
      result[key] = result[key].split(shadow.dir).join(shadow.projectDir);
    }
  } else {
    result = await runAstryx(args, { cwd });
  }
  if (raw) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    return result.code;
  }
  const invocation = binInvocation(findProjectDir(cwd) ?? cwd);
  const { stdout, stderr } = rewriteRun(result, { args, cwd, invocation });
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  return result.code;
}
