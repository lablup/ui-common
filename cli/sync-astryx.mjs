/**
 * `ui-common sync-astryx <version>`: the maintainer's Astryx bump, inside the
 * ui-common repository.
 *
 * 1. Move the exact pins (core, theme-neutral, cli; lab with --lab), and the
 *    core version README and pnpm-workspace.yaml override lab's core peer to.
 * 2. Install, regenerate the export mirror and the built Lablup theme.
 * 3. Run Astryx's codemods on ui-common's own src/ (dry run, then applied).
 * 4. Run the tests, which include the export and theme drift checks.
 * 5. Record the Astryx codemods consumers need for this bump under the next
 *    ui-common version: codemods/<version>/upstream.json. `ui-common upgrade`
 *    runs them for consumers, with the import specifiers swapped.
 *
 * `--dry-run` changes nothing: it prints the plan, runs Astryx's codemods on
 * src/ in dry-run mode against the installed CLI, and shows what would be
 * recorded.
 *
 * The codemods run before the tests (the order in the design note had them
 * after): a rename Astryx ships a codemod for would otherwise fail the tests
 * before the codemod could fix it.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { syncLabOverrideDocs } from "./lab-peer.mjs";
import { findProjectDir, readJson } from "./paths.mjs";
import { compare, nextBreaking, parse } from "./semver.mjs";

const PINNED = [
  "@astryxdesign/core",
  "@astryxdesign/theme-neutral",
  "@astryxdesign/cli",
];
const LAB = "@astryxdesign/lab";

export const SYNC_HELP = `Usage: ui-common sync-astryx <version> [--lab <version>] [--as <version>] [--dry-run]

Maintainers only, inside the @lablup/ui-common repository. Moves the Astryx
pin set to <version>, regenerates the export mirror and the Lablup theme, runs
Astryx's codemods on src/, runs the tests, and records the Astryx codemods
consumers need under the next ui-common version (codemods/<as>/upstream.json).

  --lab <version>  Also move the @astryxdesign/lab canary pin (dev + peer).
  --as <version>   The ui-common version to record the codemods under.
                   Default: the next prerelease (or minor) after package.json's.
  --dry-run        Change nothing; print the plan and a dry run of Astryx's
                   codemods on src/.

Exit codes: 0 done, 1 a step failed (the tree is left as it was at that step),
2 bad arguments or not run inside the ui-common repository.
`;

/**
 * @param {string} cwd
 * @returns {string | null} the repository root, or null outside it
 */
export function findUiCommonRepo(cwd) {
  const dir = findProjectDir(cwd);
  if (!dir) return null;
  try {
    const pkg = readJson(join(dir, "package.json"));
    if (pkg.name !== "@lablup/ui-common") return null;
  } catch {
    return null;
  }
  // A consumer's node_modules copy has the name but not the repository.
  if (
    !existsSync(join(dir, "scripts/gen-exports.mjs")) ||
    !existsSync(join(dir, "exports.exclude.json"))
  ) {
    return null;
  }
  return dir;
}

/**
 * @param {string} repo
 * @param {string} from
 * @param {string} to
 * @returns {{codemods: Array<{id: string, version: string, title: string}>, optional: string[]} | null}
 */
function listAstryxCodemods(repo, from, to) {
  const result = spawnSync("pnpm", ["exec", "astryx", "upgrade", "--list", "--json"], {
    cwd: repo,
    encoding: "utf8",
  });
  if (result.status !== 0) return null;
  const listed =
    /** @type {{data: Array<{name: string, title: string, version: string, optional: boolean}>}} */ (
      JSON.parse(result.stdout)
    ).data;
  const inRange = listed.filter(
    (c) => compare(c.version, from) > 0 && compare(c.version, to) <= 0,
  );
  return {
    codemods: inRange
      .filter((c) => !c.optional)
      .map((c) => ({ id: c.name, version: c.version, title: c.title })),
    optional: inRange.filter((c) => c.optional).map((c) => c.name),
  };
}

/**
 * @param {string} repo
 * @param {string} version ui-common version to record under
 * @param {{from: string, to: string}} astryx
 * @param {{codemods: Array<{id: string, version: string, title: string}>, optional: string[]}} listed
 */
export function upstreamManifest(repo, version, astryx, listed) {
  const file = join(repo, "codemods", version, "upstream.json");
  /** @type {any} */
  let manifest = {
    $comment:
      "Written by `ui-common sync-astryx`. Astryx codemods consumers need when they upgrade across this ui-common version; `ui-common upgrade` runs them with @lablup/ui-common specifiers swapped for Astryx's.",
    astryx,
    codemods: listed.codemods,
    optional: listed.optional,
  };
  if (existsSync(file)) {
    // Two bumps before one release: keep one range and the union of codemods.
    const previous = readJson(file);
    const ids = new Set(previous.codemods.map((/** @type {any} */ c) => c.id));
    manifest = {
      ...manifest,
      astryx: { from: previous.astryx.from, to: astryx.to },
      codemods: [
        ...previous.codemods,
        ...listed.codemods.filter((c) => !ids.has(c.id)),
      ],
      optional: [...new Set([...(previous.optional ?? []), ...listed.optional])],
    };
  }
  return { file, manifest };
}

/**
 * The files that name the core version lab's core peer is overridden to:
 * README's consumer recipes and this repository's own peer rule. They move
 * with the core pin (test/cli/lab-peer.test.ts fails when README lags).
 *
 * @param {string} repo
 * @param {string} pin the new @astryxdesign/core pin
 * @returns {Array<{name: string, file: string, after: string}>}
 */
export function labOverrideEdits(repo, pin) {
  const edits = [];
  for (const name of ["README.md", "pnpm-workspace.yaml"]) {
    const file = join(repo, name);
    if (!existsSync(file)) continue;
    const before = readFileSync(file, "utf8");
    const after = syncLabOverrideDocs(before, pin);
    if (after !== before) edits.push({ name, file, after });
  }
  return edits;
}

/**
 * @param {string[]} argv arguments after `sync-astryx`
 */
export async function syncAstryxCommand(argv) {
  /** @type {string|undefined} */
  let target;
  /** @type {string|undefined} */
  let lab;
  /** @type {string|undefined} */
  let as;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--lab") lab = argv[++i];
    else if (arg.startsWith("--lab=")) lab = arg.slice(6);
    else if (arg === "--as") as = argv[++i];
    else if (arg.startsWith("--as=")) as = arg.slice(5);
    else if (arg === "-h" || arg === "--help") {
      process.stdout.write(SYNC_HELP);
      return 0;
    } else if (arg.startsWith("-")) {
      process.stderr.write(
        `ui-common sync-astryx: unknown option "${arg}"\n${SYNC_HELP}`,
      );
      return 2;
    } else if (!target) target = arg;
    else {
      process.stderr.write(`ui-common sync-astryx: unexpected argument "${arg}"\n`);
      return 2;
    }
  }
  if (!target || !parse(target)) {
    process.stderr.write(
      `ui-common sync-astryx: give the Astryx version to move to.\n${SYNC_HELP}`,
    );
    return 2;
  }
  for (const [flag, value] of /** @type {const} */ ([
    ["--lab", lab],
    ["--as", as],
  ])) {
    if (value !== undefined && !parse(value)) {
      process.stderr.write(
        `ui-common sync-astryx: ${flag} "${value}" is not a version.\n`,
      );
      return 2;
    }
  }

  const repo = findUiCommonRepo(process.cwd());
  if (!repo) {
    process.stderr.write(
      "ui-common sync-astryx: run this inside the @lablup/ui-common repository. It edits ui-common's own pins and generated files; a consumer upgrades with `ui-common upgrade`.\n",
    );
    return 2;
  }

  const pkgFile = join(repo, "package.json");
  const pkgText = readFileSync(pkgFile, "utf8");
  const pkg = JSON.parse(pkgText);
  const current = pkg.dependencies?.["@astryxdesign/core"];
  if (!current || !parse(current)) {
    process.stderr.write(
      `ui-common sync-astryx: package.json pins @astryxdesign/core as "${current}"; expected an exact version.\n`,
    );
    return 1;
  }
  const recordAs = as ?? nextBreaking(pkg.version);
  const out = (/** @type {string} */ line) => process.stdout.write(`${line}\n`);

  out(
    `ui-common sync-astryx: Astryx ${current} → ${target}${lab ? `, lab → ${lab}` : ""}${dryRun ? " (dry run)" : ""}`,
  );
  out(`  repository: ${repo}`);
  const edits = [];
  for (const name of PINNED) {
    const from = pkg.dependencies?.[name];
    if (from !== target) edits.push(`dependencies["${name}"]: ${from} → ${target}`);
  }
  if (lab) {
    for (const field of ["devDependencies", "peerDependencies"]) {
      const from = pkg[field]?.[LAB];
      if (from !== lab) edits.push(`${field}["${LAB}"]: ${from} → ${lab}`);
    }
  }
  out(
    edits.length > 0
      ? `  package.json: ${edits.join("; ")}`
      : "  package.json: pins already at the target",
  );
  for (const edit of labOverrideEdits(repo, target)) {
    out(`  ${edit.name}: lab's core override → ${target}`);
  }

  /** @param {string} title @param {string} cmd @param {string[]} args */
  const step = (title, cmd, args) => {
    out(`\n▸ ${title}: ${cmd} ${args.join(" ")}`);
    if (dryRun) return true;
    try {
      execFileSync(cmd, args, { cwd: repo, stdio: "inherit" });
      return true;
    } catch {
      process.stderr.write(
        `ui-common sync-astryx: "${title}" failed. The tree is left as it is; fix and re-run.\n`,
      );
      return false;
    }
  };

  if (dryRun) {
    out("\nWould run: pnpm install; pnpm run gen:exports; pnpm run theme:build;");
    out(
      `  pnpm exec astryx upgrade --from ${current} --path src (dry run, then --apply); pnpm run test`,
    );
    out(
      `\n▸ Astryx codemods on src/ (dry run, installed CLI): pnpm exec astryx upgrade --from ${current} --path src`,
    );
    const dry = spawnSync(
      "pnpm",
      ["exec", "astryx", "upgrade", "--from", current, "--path", "src"],
      {
        cwd: repo,
        encoding: "utf8",
      },
    );
    out((dry.stdout + dry.stderr).trim());
    if (compare(target, current) <= 0) {
      out(
        `\nNothing would be recorded: ${target} is not newer than the pinned ${current}.`,
      );
      return 0;
    }
    const listed = listAstryxCodemods(repo, current, target);
    if (!listed) {
      out("\nCould not list Astryx codemods with the installed CLI.");
      return 0;
    }
    const { file, manifest } = upstreamManifest(
      repo,
      recordAs,
      { from: current, to: target },
      listed,
    );
    out(
      `\nWould record ${manifest.codemods.length} codemod(s) in ${file.slice(repo.length + 1)} (as listed by the installed CLI; the new CLI may add more):`,
    );
    for (const c of manifest.codemods) out(`  - ${c.version} ${c.id}: ${c.title}`);
    return 0;
  }

  // Pins.
  for (const name of PINNED) {
    pkg.dependencies[name] = target;
  }
  if (lab) {
    pkg.devDependencies = { ...pkg.devDependencies, [LAB]: lab };
    pkg.peerDependencies = { ...pkg.peerDependencies, [LAB]: lab };
  }
  writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
  out("  package.json written");
  for (const edit of labOverrideEdits(repo, target)) {
    writeFileSync(edit.file, edit.after);
    out(`  ${edit.name}: lab's core override moved to ${target}`);
  }

  if (!step("Install", "pnpm", ["install"])) return 1;
  if (!step("Regenerate the export mirror", "pnpm", ["run", "gen:exports"])) return 1;
  if (!step("Rebuild the Lablup theme", "pnpm", ["run", "theme:build"])) return 1;
  if (
    !step("Astryx codemods on src/ (dry run)", "pnpm", [
      "exec",
      "astryx",
      "upgrade",
      "--from",
      current,
      "--path",
      "src",
    ])
  )
    return 1;
  if (
    !step("Astryx codemods on src/", "pnpm", [
      "exec",
      "astryx",
      "upgrade",
      "--from",
      current,
      "--path",
      "src",
      "--apply",
    ])
  )
    return 1;
  if (!step("Tests and drift checks", "pnpm", ["run", "test"])) return 1;

  if (compare(target, current) > 0) {
    const listed = listAstryxCodemods(repo, current, target);
    if (!listed) {
      process.stderr.write(
        "ui-common sync-astryx: could not list Astryx codemods with the new CLI.\n",
      );
      return 1;
    }
    const { file, manifest } = upstreamManifest(
      repo,
      recordAs,
      { from: current, to: target },
      listed,
    );
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
    out(
      `\nRecorded ${manifest.codemods.length} Astryx codemod(s) for consumers in ${file.slice(repo.length + 1)}.`,
    );
    out(
      `Release it as ${recordAs} (or re-run with --as <version>), so \`ui-common upgrade\` runs them for consumers crossing it.`,
    );
  } else {
    out(`\nNo upstream codemods recorded: ${target} is not newer than ${current}.`);
  }
  out(
    "\nNext: read the gen:exports diff, note new and removed subpaths in CHANGELOG.md, run `pnpm run verify`.",
  );
  return 0;
}
