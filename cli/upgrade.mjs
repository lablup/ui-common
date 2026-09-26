/**
 * `ui-common upgrade`: run the registered codemod steps between two ui-common
 * versions over a consumer's source, edit its package.json, and write a
 * manual-review report.
 *
 * All edits are made in memory first. `--dry-run` stops there and prints what
 * would change and the report, writing nothing (the report only to an
 * explicit `--report <path>`); otherwise the files and the report are
 * written. A file is written only if this run read it, or created it where
 * nothing existed.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

import { registeredVersions, stepsBetween } from "../codemods/registry.mjs";
import { TODO_TAG } from "../codemods/lib/jsx.mjs";
import { diffStat, unifiedDiff } from "./diff.mjs";
import { findProjectDir, ownPackageJson } from "./paths.mjs";
import { renderReport, REPORT_HEADING } from "./report.mjs";
import { coerce, compare, parse } from "./semver.mjs";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  ".next",
  "coverage",
  ".turbo",
  ".cache",
]);

export const SOURCE_EXTENSIONS = new Set([
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".css",
  ".scss",
  ".sass",
  ".less",
]);

/**
 * @param {string} dir
 * @param {string[]} out
 */
function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) walk(full, out);
    } else if (
      SOURCE_EXTENSIONS.has(extname(entry.name)) &&
      !entry.name.endsWith(".d.ts")
    ) {
      out.push(full);
    }
  }
}

/** @param {string[]} paths absolute */
export function collectFiles(paths) {
  /** @type {string[]} */
  const out = [];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    if (readdirSafe(p)) walk(p, out);
    else if (SOURCE_EXTENSIONS.has(extname(p))) out.push(p);
  }
  return [...new Set(out)].sort();
}

/** @param {string} p */
function readdirSafe(p) {
  try {
    readdirSync(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * @typedef {object} UpgradeOptions
 * @property {string} cwd
 * @property {string[]} paths as given (relative to cwd)
 * @property {string} [from]
 * @property {string} [to]
 * @property {boolean} [dryRun]
 * @property {string} [report] report path
 * @property {boolean} [diff] print unified diffs in a dry run
 * @property {(line: string) => void} [log]
 * @property {(line: string) => void} [warn]
 */

/**
 * @param {UpgradeOptions} options
 */
export async function runUpgrade(options) {
  const log = options.log ?? ((line) => process.stdout.write(`${line}\n`));
  const warn = options.warn ?? ((line) => process.stderr.write(`${line}\n`));
  const cwd = resolve(options.cwd);
  const projectDir = findProjectDir(cwd) ?? cwd;
  const pkgFile = join(projectDir, "package.json");
  const pkgText = existsSync(pkgFile) ? readFileSync(pkgFile, "utf8") : null;
  const pkg = pkgText ? JSON.parse(pkgText) : {};
  const own = ownPackageJson();

  const declared =
    pkg.dependencies?.["@lablup/ui-common"] ??
    pkg.devDependencies?.["@lablup/ui-common"] ??
    pkg.peerDependencies?.["@lablup/ui-common"];
  const from = options.from ? coerce(options.from) : declared ? coerce(declared) : null;
  if (!from) {
    warn(
      options.from
        ? `ui-common upgrade: --from "${options.from}" is not a version.`
        : `ui-common upgrade: cannot tell which ui-common version this project is on (package.json: ${declared ?? "no @lablup/ui-common"}). Pass --from <version>.`,
    );
    return { code: 2 };
  }
  const to = options.to ? coerce(options.to) : own.version;
  if (!to || !parse(to)) {
    warn(`ui-common upgrade: --to "${options.to}" is not a version.`);
    return { code: 2 };
  }
  if (compare(from, to) >= 0) {
    log(`ui-common upgrade: ${from} → ${to} is not an upgrade; nothing to do.`);
    return { code: 0 };
  }

  const steps = await stepsBetween(from, to);
  if (steps.length === 0) {
    log(
      `ui-common upgrade: no codemods between ${from} and ${to} (registered: ${registeredVersions().join(", ")}).`,
    );
    return { code: 0 };
  }

  const roots = (options.paths.length > 0 ? options.paths : ["src"]).map((p) =>
    resolve(cwd, p),
  );
  const missing = roots.filter((p) => !existsSync(p));
  if (missing.length === roots.length) {
    warn(
      `ui-common upgrade: nothing to scan: ${missing.map((p) => relative(cwd, p) || ".").join(", ")} not found.`,
    );
    return { code: 2 };
  }
  const files = collectFiles(roots);

  // A dry run prints the report unless --report names a file for it. The
  // report replaces an earlier report, never anything else.
  const writeReport = !options.dryRun || options.report != null;
  const reportFile = resolve(cwd, options.report ?? "ui-common-upgrade-report.md");
  if (
    writeReport &&
    existsSync(reportFile) &&
    !readFileSync(reportFile, "utf8").startsWith(REPORT_HEADING)
  ) {
    warn(
      `ui-common upgrade: ${relative(cwd, reportFile)} exists and is not an upgrade report; not overwriting it. Pass --report <path>.`,
    );
    return { code: 2 };
  }

  const { default: jscodeshift } = await import("jscodeshift");

  /** @type {Map<string, {original: string, current: string, transforms: string[], created: boolean, project?: boolean}>} */
  const state = new Map();
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    state.set(file, {
      original: source,
      current: source,
      transforms: [],
      created: false,
    });
  }
  const rel = (/** @type {string} */ file) =>
    relative(projectDir, file).split(sep).join("/");

  /** @type {string[]} */
  const packageNotes = [];
  /** @type {Array<{file: string, transform: string, error: string}>} */
  const errors = [];
  /** @type {string[]} */
  const notices = [];
  const ctx = {
    from,
    to,
    flags: { packages: new Map(), touched: new Set() },
    projectDir,
    note: (/** @type {string} */ message) => packageNotes.push(message),
    /**
     * Edit a project file outside the scanned sources (pnpm-workspace.yaml).
     * `edit` gets its current text (null: absent) and returns the new text,
     * or undefined to leave it. The write goes through the same checks, diff
     * and dry run as the sources.
     *
     * @param {string} path
     * @param {(current: string | null) => string | undefined} edit
     */
    editFile: (path, edit) => {
      const known = state.get(path);
      const current = known
        ? known.current
        : existsSync(path)
          ? readFileSync(path, "utf8")
          : null;
      const next = edit(current);
      if (next == null || next === current) return;
      if (known) {
        known.current = next;
        if (!known.transforms.includes("package-json"))
          known.transforms.push("package-json");
        return;
      }
      state.set(path, {
        original: current ?? "",
        current: next,
        transforms: ["package-json"],
        created: current == null,
        project: true,
      });
    },
    /**
     * Claim a new file and return the path it will be written to. A file the
     * project already has, scanned or not, is never overwritten: one holding
     * exactly `content` is reused, otherwise the next free numbered sibling
     * (`ui-common-entry-2.css`) is used and the report says so.
     *
     * @param {string} path
     * @param {string} content
     */
    createFile: (path, content) => {
      const ext = extname(path);
      const stem = path.slice(0, path.length - ext.length);
      for (let n = 1; ; n++) {
        const candidate = n === 1 ? path : `${stem}-${n}${ext}`;
        const known = state.get(candidate);
        const onDisk =
          known?.current ??
          (existsSync(candidate) ? readFileSync(candidate, "utf8") : null);
        if (onDisk === content) return candidate;
        if (onDisk != null) continue;
        if (n > 1 && !notices.some((m) => m.startsWith(`${rel(path)} `))) {
          notices.push(
            `${rel(path)} exists already and is not the 0.2 stylesheet entry, so it was left alone. The entry was written to ${rel(candidate)} instead, and the script that imported styles/base.css imports it.`,
          );
        }
        state.set(candidate, {
          original: "",
          current: content,
          transforms: ["stylesheet-entry"],
          created: true,
        });
        return candidate;
      }
    },
  };

  for (const { version, step } of steps) {
    log(`Applying ${step.title} (${version})`);
    for (const transform of step.transforms) {
      const extensions = new Set(transform.extensions);
      for (const [file, entry] of state) {
        if (entry.created || !extensions.has(extname(file))) continue;
        const ext = extname(file);
        const j = jscodeshift.withParser(/\.[cm]?tsx?$/.test(ext) ? "tsx" : "babel");
        let out;
        try {
          out = transform.run(
            { path: file, source: entry.current },
            { jscodeshift: j },
            ctx,
          );
        } catch (err) {
          errors.push({
            file: rel(file),
            transform: transform.id,
            error: /** @type {Error} */ (err).message,
          });
          continue;
        }
        if (out == null || out === entry.current) continue;
        if (transform.parse) {
          try {
            j(out);
          } catch (err) {
            errors.push({
              file: rel(file),
              transform: transform.id,
              error: `produced unparseable output, not applied: ${/** @type {Error} */ (err).message}`,
            });
            continue;
          }
        }
        entry.current = out;
        if (!entry.transforms.includes(transform.id))
          entry.transforms.push(transform.id);
      }
    }
  }

  // package.json, after every source transform has set its flags.
  let pkgAfter = pkgText;
  if (pkgText) {
    for (const { step } of steps) {
      if (!step.packageJson || pkgAfter == null) continue;
      try {
        pkgAfter = step.packageJson(pkgAfter, ctx) ?? pkgAfter;
      } catch (err) {
        errors.push({
          file: "package.json",
          transform: "package-json",
          error: /** @type {Error} */ (err).message,
        });
      }
    }
  }

  // Report-only scans, over the final content.
  /** @type {Array<{category: string, file: string, line: number, text: string, detail?: string}>} */
  const findings = [];
  /** @type {Record<string, {title: string, help: string}>} */
  const categories = {};
  for (const { step } of steps) {
    Object.assign(categories, step.categories ?? {});
    if (!step.scan) continue;
    for (const [file, entry] of state) {
      if (entry.created || entry.project) continue;
      findings.push(...step.scan(rel(file), entry.current));
    }
  }
  /** @type {Array<{file: string, line: number, text: string}>} */
  const todos = [];
  let tokenReads = 0;
  for (const [file, entry] of state) {
    entry.current.split("\n").forEach((line, i) => {
      if (line.includes(TODO_TAG)) {
        todos.push({
          file: rel(file),
          line: i + 1,
          text: line
            .replace(/^.*TODO\(ui-common-upgrade\):\s*/, "")
            .replace(/\s*\*\/\s*\}?\s*$/, "")
            .trim(),
        });
      }
    });
    tokenReads += (entry.current.match(/var\(\s*--token-/g) ?? []).length;
  }

  const changed = [...state.entries()]
    .filter(([, e]) => e.current !== e.original)
    .map(([file, e]) => ({
      file: rel(file),
      abs: file,
      ...e,
      stat: diffStat(e.original, e.current),
    }));
  const pkgChanged = pkgText != null && pkgAfter != null && pkgAfter !== pkgText;

  const dryRun = Boolean(options.dryRun);
  if (!dryRun) {
    for (const c of changed) {
      // Only what this run read, or a file it claimed that is still absent.
      const now = existsSync(c.abs) ? readFileSync(c.abs, "utf8") : null;
      if (c.created ? now != null : now !== c.original) {
        errors.push({
          file: c.file,
          transform: c.transforms.join(", "),
          error: c.created
            ? "appeared on disk during the run; left alone."
            : "changed on disk during the run; left alone.",
        });
        continue;
      }
      mkdirSync(dirname(c.abs), { recursive: true });
      writeFileSync(c.abs, c.current);
    }
    if (pkgChanged && pkgAfter != null) writeFileSync(pkgFile, pkgAfter);
  }

  const report = renderReport({
    from,
    to,
    version: own.version,
    dryRun,
    roots: roots.map((r) => relative(projectDir, r).split(sep).join("/") || "."),
    fileCount: files.length,
    steps: steps.map(({ version, step }) => ({
      version,
      title: step.title,
      notes: typeof step.notes === "function" ? step.notes(ctx) : (step.notes ?? []),
    })),
    changed: changed.map((c) => ({
      file: c.file,
      created: c.created,
      transforms: c.transforms,
      ...c.stat,
    })),
    packageJson: { changed: pkgChanged, notes: packageNotes },
    todos,
    findings,
    categories,
    errors,
    notices,
    tokenReads,
  });
  if (writeReport) {
    mkdirSync(dirname(reportFile), { recursive: true });
    writeFileSync(reportFile, report);
  }

  // Terminal summary.
  const verb = dryRun ? "Would change" : "Changed";
  for (const c of changed) {
    log(`  ${c.created ? "+" : "~"} ${c.file} (+${c.stat.added} -${c.stat.removed})`);
  }
  if (pkgChanged) log(`  ~ ${rel(pkgFile)}`);
  log(
    `${verb} ${changed.length} file${changed.length === 1 ? "" : "s"}${pkgChanged ? " and package.json" : ""}; ` +
      `${todos.length} TODO marker${todos.length === 1 ? "" : "s"}, ${findings.length} manual-review item${findings.length === 1 ? "" : "s"}.`,
  );
  if (dryRun && options.diff) {
    for (const c of changed) log(unifiedDiff(c.file, c.original, c.current));
    if (pkgChanged && pkgText != null && pkgAfter != null)
      log(unifiedDiff("package.json", pkgText, pkgAfter));
  }
  for (const e of errors) warn(`  ! ${e.file} [${e.transform}]: ${e.error}`);
  for (const notice of notices) warn(`  note: ${notice}`);
  if (writeReport) log(`Report: ${relative(cwd, reportFile) || reportFile}`);
  else log(`\n${report}`);
  if (dryRun)
    log(
      `Dry run: nothing was written${writeReport ? " but the report" : ""}. Run without --dry-run to apply${writeReport ? "" : ", or pass --report <path> to keep the report"}.`,
    );
  if (!dryRun && pkgChanged)
    log("package.json changed: run your package manager's install.");

  return {
    code: errors.length > 0 ? 1 : 0,
    changed,
    todos,
    findings,
    errors,
    report,
    pkgAfter,
  };
}

export const UPGRADE_HELP = `Usage: ui-common upgrade [--from <version>] [--to <version>] [--dry-run] [--diff] [--report <path>] [paths…]

Run the codemods registered between two @lablup/ui-common versions over your
source (TS/TSX/JS/JSX through jscodeshift, CSS through postcss), update
package.json, and write a manual-review report.

  --from <version>  The ui-common version the code is written against.
                    Default: the version package.json declares.
  --to <version>    Default: the installed @lablup/ui-common version.
  --dry-run         Write nothing; list what would change and print the report.
  --diff            With --dry-run, also print unified diffs.
  --report <path>   Where to write the report. Default: ui-common-upgrade-report.md,
                    except in a dry run, which writes a report only to a path
                    given here. An existing file is replaced only if it is an
                    earlier report.
  paths…            Directories or files to scan. Default: src/

Exit codes: 0 done, 1 some files could not be transformed (see the report),
2 bad arguments or nothing to scan.
`;

/**
 * @param {string[]} argv arguments after `upgrade`
 */
export async function upgradeCommand(argv) {
  /** @type {UpgradeOptions} */
  const options = { cwd: process.cwd(), paths: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inline] =
      arg.startsWith("--") && arg.includes("=")
        ? arg.split(/=(.*)/s)
        : [arg, undefined];
    const value = () => inline ?? argv[++i];
    switch (flag) {
      case "--from":
        options.from = value();
        break;
      case "--to":
        options.to = value();
        break;
      case "--report":
        options.report = value();
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--diff":
        options.diff = true;
        break;
      case "-h":
      case "--help":
        process.stdout.write(UPGRADE_HELP);
        return 0;
      default:
        if (arg.startsWith("-")) {
          process.stderr.write(
            `ui-common upgrade: unknown option "${arg}"\n${UPGRADE_HELP}`,
          );
          return 2;
        }
        options.paths.push(arg);
    }
    if (["--from", "--to", "--report"].includes(flag)) {
      const v = /** @type {any} */ (options)[flag.slice(2)];
      if (!v) {
        process.stderr.write(`ui-common upgrade: ${flag} needs a value\n`);
        return 2;
      }
    }
  }
  const result = await runUpgrade(options);
  return result.code;
}
