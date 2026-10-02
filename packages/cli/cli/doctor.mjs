/**
 * `ui-common doctor`: read-only checks that a project is wired onto
 * @lablup/ui-common the way the first adopters learned it has to be. Each
 * check names the problem, a fix, and the section of
 * docs/adopting-from-astryx.md that explains it. Exit 1 on any failure.
 *
 * Works on a single package or a workspace (each member that depends on
 * ui-common or Astryx is checked), with pnpm or npm.
 */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, extname, join } from "node:path";

import { LAB, CORE, PNPM_OVERRIDE_KEY, detectPackageManager } from "./lab-peer.mjs";
import { DEFAULT_AGENT_FILES, findBlock, generateBlock } from "./agents.mjs";
import { cliPackageJson, findProjectDir } from "./paths.mjs";
import { coerce, compare } from "./semver.mjs";
import {
  bareVersion,
  declarations,
  installRoot,
  isGenerated,
  listProjectFiles,
  lockVersionOf,
  npmLockCopies,
  ownerRoot,
  packageRoots,
  pnpmCatalogs,
  pnpmLockKeys,
  readJsonFile,
  readText,
  relPath,
  resolveSpec,
  SCRIPT_EXTENSIONS,
  STYLE_EXTENSIONS,
} from "./project.mjs";
import { findSpecifiers, mapSpecifier, UIC } from "../codemods/adopt/specifiers.mjs";
import { blankComments, layerStatements } from "../codemods/adopt/layers.mjs";

const CLI_PACKAGE = "@lablup/ui-common-cli";
const DOC = "docs/adopting-from-astryx.md";
const DOC_URL =
  "https://github.com/lablup/ui-common/blob/main/docs/adopting-from-astryx.md";
const NODE_FLOOR = "22.13.0";

/**
 * @typedef {"pass" | "warn" | "fail" | "skip"} Status
 * @typedef {{id: string, title: string, status: Status, summary: string, details: string[], fix?: string, doc: string}} Check
 */

/**
 * @param {string} id
 * @param {string} title
 * @param {Status} status
 * @param {string} summary
 * @param {{details?: string[], fix?: string}} [more]
 * @returns {Check}
 */
function result(id, title, status, summary, more = {}) {
  return {
    id,
    title,
    status,
    summary,
    details: more.details ?? [],
    ...(more.fix && (status === "fail" || status === "warn") ? { fix: more.fix } : {}),
    doc: `${DOC}#${id}`,
  };
}

/** The package directory `name` resolves to from `fromDir`, real path, or null. */
function resolvePackageDir(/** @type {string} */ name, /** @type {string} */ fromDir) {
  try {
    const req = createRequire(join(fromDir, "package.json"));
    let file;
    try {
      file = req.resolve(`${name}/package.json`);
    } catch {
      file = req.resolve(name);
    }
    let dir = file;
    for (;;) {
      const parent = join(dir, "..");
      if (parent === dir) return null;
      dir = parent;
      const pkg = readJsonFile(join(dir, "package.json"));
      if (pkg?.name === name) return realpathSync(dir);
    }
  } catch {
    return null;
  }
}

/**
 * Everything the checks read, gathered once.
 *
 * @param {string} cwd
 */
export function gatherProject(cwd) {
  const start = findProjectDir(cwd) ?? cwd;
  const install = installRoot(start);
  // Run from a workspace member, the checks cover that member, but read the
  // whole workspace: the page that declares the layer order, the lockfile
  // and the catalog live at its root.
  const workspace = install !== start && packageRoots(install).includes(start);
  const projectDir = workspace ? install : start;
  const roots = packageRoots(projectDir);
  const rootPkg = readJsonFile(join(projectDir, "package.json"));
  const pm = detectPackageManager(projectDir, rootPkg);
  const workspaceYaml = pm.workspaceYaml ? readText(pm.workspaceYaml) : null;
  const catalogs = pnpmCatalogs(workspaceYaml);
  const pkgs = new Map(roots.map((r) => [r, readJsonFile(join(r, "package.json"))]));
  const relevant = (/** @type {any} */ pkg) =>
    [UIC, CLI_PACKAGE, CORE, LAB, "@astryxdesign/theme-neutral"].some(
      (n) => declarations(pkg, n).length > 0,
    );
  // Every package of the project that depends on ui-common or Astryx.
  let related = roots.filter((r) => relevant(pkgs.get(r)));
  if (related.length === 0) related = [projectDir];
  let using = workspace ? [start] : related;
  if (using.length === 0) using = [projectDir];
  const files = listProjectFiles(projectDir, roots);
  /** @type {Map<string, string | null>} */
  const cache = new Map();
  const text = (/** @type {string} */ f) => {
    if (!cache.has(f)) cache.set(f, readText(f));
    return cache.get(f) ?? null;
  };
  const lockText = existsSync(join(install, "pnpm-lock.yaml"))
    ? readText(join(install, "pnpm-lock.yaml"))
    : null;
  const npmLock =
    readJsonFile(join(install, "package-lock.json")) ??
    readJsonFile(join(install, "npm-shrinkwrap.json"));
  return {
    projectDir,
    roots,
    using,
    related,
    install,
    pm,
    workspaceYaml,
    catalogs,
    pkgs,
    files,
    text,
    lockText,
    npmLock,
    rel: (/** @type {string} */ f) => relPath(projectDir, f),
  };
}

/** @typedef {ReturnType<typeof gatherProject>} Project */

/** @param {Project} p */
export function checkNode(p, nodeVersion = process.versions.node) {
  void p;
  const ok = compare(nodeVersion, NODE_FLOOR) >= 0;
  return result(
    "node",
    "Node for the CLI",
    ok ? "pass" : "fail",
    ok
      ? `Node ${nodeVersion} (the CLI needs ${NODE_FLOOR} or later).`
      : `Node ${nodeVersion} is older than ${NODE_FLOOR}, which @lablup/ui-common-cli and the Astryx CLI it wraps need.`,
    {
      fix: `Run the CLI on Node ${NODE_FLOOR} or later (the app itself may build on its own Node).`,
    },
  );
}

/** @param {Project} p */
export function checkVersions(p) {
  const id = "versions";
  const title = "@lablup/ui-common and @lablup/ui-common-cli at one version";
  /** @type {string[]} */
  const details = [];
  /** @type {Set<string>} */
  const ui = new Set();
  /** @type {Set<string>} */
  const cli = new Set();
  for (const r of p.related) {
    const pkg = p.pkgs.get(r);
    for (const [field, spec] of declarations(pkg, UIC)) {
      const v = resolveSpec(UIC, spec, p.catalogs) ?? spec;
      ui.add(coerce(v) ?? v);
      details.push(
        `${p.rel(r)}: ${field}["${UIC}"] = ${spec}${v !== spec ? ` (${v})` : ""}`,
      );
    }
    for (const [field, spec] of declarations(pkg, CLI_PACKAGE)) {
      const v = resolveSpec(CLI_PACKAGE, spec, p.catalogs) ?? spec;
      cli.add(coerce(v) ?? v);
      details.push(
        `${p.rel(r)}: ${field}["${CLI_PACKAGE}"] = ${spec}${v !== spec ? ` (${v})` : ""}`,
      );
    }
  }
  if (ui.size === 0)
    return result(id, title, "fail", `No package declares ${UIC}.`, {
      details,
      fix: "Run `ui-common adopt --from astryx` (an app on @astryxdesign/*), or add @lablup/ui-common.",
    });
  /** @type {Set<string>} */
  const installedUi = new Set();
  /** @type {Set<string>} */
  const installedCli = new Set();
  for (const r of p.related) {
    const u = resolvePackageDir(UIC, r);
    if (u) installedUi.add(readJsonFile(join(u, "package.json"))?.version);
    const c = resolvePackageDir(CLI_PACKAGE, r);
    if (c) installedCli.add(readJsonFile(join(c, "package.json"))?.version);
  }
  if (installedUi.size > 0)
    details.push(`installed ${UIC}: ${[...installedUi].join(", ")}`);
  if (installedCli.size > 0)
    details.push(`installed ${CLI_PACKAGE}: ${[...installedCli].join(", ")}`);
  const all = new Set([...ui, ...cli]);
  if (ui.size > 1 || all.size > 1)
    return result(
      id,
      title,
      "fail",
      `Declared versions differ: ${[...all].join(", ")}.`,
      {
        details,
        fix: `Pin ${UIC} and ${CLI_PACKAGE} to the same exact version everywhere, and bump them together.`,
      },
    );
  if (installedUi.size === 0)
    return result(id, title, "fail", `${UIC} is declared but not installed.`, {
      details,
      fix: "Run your package manager's install.",
    });
  const installed = new Set([...installedUi, ...installedCli]);
  if (installedUi.size > 1 || installed.size > 1)
    return result(
      id,
      title,
      "fail",
      `Installed versions differ: ${[...installed].join(", ")}.`,
      {
        details,
        fix: "Run your package manager's install; dedupe until one version of each is installed.",
      },
    );
  if (cli.size === 0)
    return result(
      id,
      title,
      "warn",
      `${UIC} ${[...ui][0]}; ${CLI_PACKAGE} is not a dependency.`,
      {
        details,
        fix: `Add ${CLI_PACKAGE}@${[...ui][0]} as a devDependency, so \`ui-common doctor\` and \`ui-common agents\` run at the project's version.`,
      },
    );
  return result(
    id,
    title,
    "pass",
    `${UIC} and ${CLI_PACKAGE} at ${[...installed][0]}.`,
    { details },
  );
}

/** Installed core copies, from the lockfile, as [label, version] pairs. */
function lockCopies(/** @type {Project} */ p, /** @type {string} */ name) {
  if (p.lockText) {
    const keys = pnpmLockKeys(p.lockText);
    return {
      kind: "pnpm-lock.yaml",
      versions: keys.packages
        .map((k) => lockVersionOf(k, name))
        .filter((v) => v != null),
      snapshots: keys.snapshots
        .map((k) => lockVersionOf(k, name))
        .filter((v) => v != null),
    };
  }
  if (p.npmLock) {
    const copies = npmLockCopies(p.npmLock, name);
    return {
      kind: "package-lock.json",
      versions: [...new Set(copies.map((c) => c.version))],
      snapshots: copies.map((c) => `${c.version} at ${c.path}`),
    };
  }
  return null;
}

/** The core ui-common pins, from the installed ui-common. */
function pinnedCore(/** @type {Project} */ p) {
  for (const r of p.using) {
    const dir = resolvePackageDir(UIC, r);
    const pin = dir
      ? readJsonFile(join(dir, "package.json"))?.dependencies?.[CORE]
      : null;
    if (pin) return { pin, dir };
  }
  return { pin: null, dir: null };
}

/** @param {Project} p */
export function checkSingleCore(p) {
  const id = "single-core";
  const title = "One @astryxdesign/core";
  /** @type {string[]} */
  const details = [];
  const fix = `Remove every other source of ${CORE}: keep it in your own package.json only at the version ${UIC} pins, add the lab override when you use ${UIC}/lab, then reinstall until \`pnpm why -r ${CORE}\` (npm: \`npm ls ${CORE}\`) lists one version.`;
  const { pin, dir: uiDir } = pinnedCore(p);
  const copies = lockCopies(p, CORE);
  const problems = [];
  if (copies) {
    details.push(
      `${copies.kind}: ${copies.snapshots.length} ${copies.kind === "pnpm-lock.yaml" ? "resolution" : "cop"}${copies.snapshots.length === 1 ? (copies.kind === "pnpm-lock.yaml" ? "" : "y") : copies.kind === "pnpm-lock.yaml" ? "s" : "ies"}`,
    );
    for (const s of copies.snapshots) details.push(`  ${CORE}@${s}`);
    if (copies.versions.length === 0) problems.push(`${CORE} is not in ${copies.kind}`);
    if (copies.versions.length > 1)
      problems.push(
        `${copies.versions.length} versions: ${copies.versions.map(bareVersion).join(", ")}`,
      );
    if (copies.snapshots.length > 1 && copies.versions.length <= 1)
      problems.push(
        copies.kind === "pnpm-lock.yaml"
          ? `the same version resolved against ${copies.snapshots.length} peer sets, which pnpm installs as separate copies`
          : `${copies.snapshots.length} copies of one version in separate directories`,
      );
    if (pin && copies.versions.length === 1 && bareVersion(copies.versions[0]) !== pin)
      problems.push(
        `the lockfile has ${bareVersion(copies.versions[0])}, ${UIC} pins ${pin}`,
      );
  }
  // What actually resolves: from ui-common, from lab, from each package.
  /** @type {Map<string, string[]>} */
  const resolved = new Map();
  const add = (/** @type {string | null} */ d, /** @type {string} */ from) => {
    if (!d) return;
    resolved.set(d, [...(resolved.get(d) ?? []), from]);
  };
  if (uiDir) add(resolvePackageDir(CORE, uiDir), UIC);
  const labDir = p.using.map((r) => resolvePackageDir(LAB, r)).find(Boolean) ?? null;
  if (labDir) add(resolvePackageDir(CORE, labDir), LAB);
  for (const r of p.using) {
    if (declarations(p.pkgs.get(r), CORE).length > 0)
      add(resolvePackageDir(CORE, r), p.rel(r));
  }
  if (resolved.size > 1) {
    problems.push(`${resolved.size} copies resolve at runtime`);
    for (const [d, from] of resolved) details.push(`  ${from.join(", ")} → ${d}`);
  }
  if (!copies && resolved.size === 0)
    return result(
      id,
      title,
      "fail",
      `Nothing to read: no lockfile, and ${CORE} does not resolve.`,
      {
        details,
        fix: "Run your package manager's install.",
      },
    );
  if (problems.length > 0)
    return result(
      id,
      title,
      "fail",
      `More than one ${CORE}, or not ui-common's: ${problems.join("; ")}.`,
      { details, fix },
    );
  const version = copies?.versions[0] ? bareVersion(copies.versions[0]) : (pin ?? "");
  return result(
    id,
    title,
    "pass",
    `One ${CORE}${version ? ` (${version})` : ""}${pin ? `, the version ${UIC} pins` : ""}.`,
    { details },
  );
}

/** Whether the project's modules use `@lablup/ui-common/lab`, by package root. */
function labUsers(/** @type {Project} */ p) {
  /** @type {Set<string>} */
  const users = new Set();
  for (const f of p.files) {
    const ext = extname(f);
    if (!SCRIPT_EXTENSIONS.has(ext) && !STYLE_EXTENSIONS.has(ext)) continue;
    const t = p.text(f);
    const owner = ownerRoot(f, p.roots) ?? p.projectDir;
    if (p.using.includes(owner) && t && /['"]@lablup\/ui-common\/lab\b/.test(t))
      users.add(owner);
  }
  return users;
}

/** @param {Project} p */
export function checkLabCore(p) {
  const id = "lab-core";
  const title = `${LAB} runs on that core`;
  const fix = `Point ${LAB}'s ${CORE} peer at ${UIC}'s: \`ui-common adopt\` adds the override, or see README "With @lablup/ui-common/lab".`;
  /** @type {string[]} */
  const details = [];
  const copies = lockCopies(p, LAB);
  const core = lockCopies(p, CORE);
  const labDir = p.using.map((r) => resolvePackageDir(LAB, r)).find(Boolean) ?? null;
  if ((!copies || copies.versions.length === 0) && !labDir)
    return result(id, title, "skip", `${LAB} is not installed.`);
  const problems = [];
  if (copies?.kind === "pnpm-lock.yaml" && core) {
    const coreVersion =
      core.versions.length === 1 ? bareVersion(core.versions[0]) : null;
    for (const snap of copies.snapshots) {
      const peer = /\(@astryxdesign\/core@([^()]+)/.exec(snap)?.[1] ?? null;
      details.push(`${LAB}@${bareVersion(snap)} → ${CORE} ${peer ?? "(none)"}`);
      if (!peer) problems.push(`a ${LAB} resolution has no ${CORE} peer`);
      else if (coreVersion && peer !== coreVersion)
        problems.push(
          `${LAB} resolves ${CORE} ${peer}, everything else ${coreVersion}`,
        );
    }
  }
  if (copies?.kind === "package-lock.json" && p.npmLock) {
    for (const c of npmLockCopies(p.npmLock, CORE)) {
      if (c.path.includes(`node_modules/${LAB}/node_modules/`))
        problems.push(`npm nested ${CORE} ${c.version} under ${LAB}`);
    }
  }
  if (labDir) {
    const fromLab = resolvePackageDir(CORE, labDir);
    const { dir: uiDir } = pinnedCore(p);
    const fromUi = uiDir ? resolvePackageDir(CORE, uiDir) : null;
    if (fromLab && fromUi && fromLab !== fromUi) {
      problems.push(`${LAB} resolves a different ${CORE} directory than ${UIC}`);
      details.push(`  ${LAB} → ${fromLab}`, `  ${UIC} → ${fromUi}`);
    }
  }
  if (problems.length > 0)
    return result(id, title, "fail", `${problems.join("; ")}.`, { details, fix });
  return result(id, title, "pass", `${LAB} shares ${UIC}'s ${CORE}.`, { details });
}

/** @param {Project} p */
export function checkLabOverride(p) {
  const id = "lab-override";
  const title = "The lab override, where /lab is used";
  const users = labUsers(p);
  if (users.size === 0)
    return result(id, title, "skip", `No module imports ${UIC}/lab.`);
  const pin = pinnedCore(p).pin;
  /** @type {string[]} */
  const details = [
    `${UIC}/lab is imported in ${[...users].map((u) => p.rel(u)).join(", ")}`,
  ];
  let override = null;
  if (p.pm.manager === "pnpm" && p.workspaceYaml) {
    const block = /^overrides:[ \t]*\r?\n((?:[ \t]+.*\r?\n?)*)/m.exec(p.workspaceYaml);
    const key = PNPM_OVERRIDE_KEY.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    const m = block
      ? new RegExp(`["']?${key}["']?\\s*:\\s*["']?([^"'\\s#]+)`).exec(block[1])
      : null;
    if (m) override = m[1];
  } else {
    const rootPkg = readJsonFile(join(p.pm.root, "package.json"));
    const o = rootPkg?.overrides?.[LAB]?.[CORE];
    if (typeof o === "string") override = o;
  }
  if (override) {
    details.push(`override: ${PNPM_OVERRIDE_KEY} → ${override}`);
    if (pin && override !== pin && !override.startsWith("$"))
      return result(
        id,
        title,
        "fail",
        `The override pins ${CORE} ${override}; ${UIC} pins ${pin}.`,
        {
          details,
          fix: `Move the override to ${pin}.`,
        },
      );
    return result(
      id,
      title,
      "pass",
      `${LAB}'s core peer is overridden to ${override}.`,
      { details },
    );
  }
  // Without an override, pnpm resolves lab's core peer to the core the
  // importing package declares itself (README, "With @lablup/ui-common/lab").
  const own = [...users].map((u) =>
    declarations(p.pkgs.get(u), CORE)
      .filter(([field]) => field !== "peerDependencies")
      .map(([, spec]) => resolveSpec(CORE, spec, p.catalogs) ?? spec),
  );
  const direct = own.every((specs) => specs.length > 0);
  const atPin = direct && own.every((specs) => specs.every((s) => !pin || s === pin));
  const recipe =
    p.pm.manager === "npm"
      ? `"overrides": {"${LAB}": {"${CORE}": "${pin ?? "<core pin>"}"}} in the root package.json`
      : `overrides: { "${PNPM_OVERRIDE_KEY}": "${pin ?? "<core pin>"}" } in pnpm-workspace.yaml`;
  if (atPin && p.pm.manager === "pnpm")
    return result(
      id,
      title,
      "pass",
      `No override; each package that uses /lab declares ${CORE} ${pin ?? ""} itself, which pnpm resolves ${LAB}'s peer to.`,
      { details },
    );
  if (direct)
    return result(
      id,
      title,
      "warn",
      `No override; ${LAB}'s core peer relies on the package's own ${CORE}${atPin ? "" : `, which is not at ${UIC}'s pin ${pin}`}.`,
      {
        details,
        fix: `Add ${recipe}, so lab runs on ${UIC}'s core whatever the package declares.`,
      },
    );
  return result(
    id,
    title,
    "fail",
    `No override, and no ${CORE} of the package's own for ${LAB}'s peer to resolve to.`,
    {
      details,
      fix: `Add ${recipe}, then reinstall.`,
    },
  );
}

/** @param {Project} p */
export function checkImports(p) {
  const id = "imports";
  const title = "No @astryxdesign/* imports";
  /** @type {string[]} */
  const details = [];
  let count = 0;
  const exportsAny = new Proxy({}, { has: () => true });
  for (const f of p.files) {
    const ext = extname(f);
    const script = SCRIPT_EXTENSIONS.has(ext);
    if (!script && !STYLE_EXTENSIONS.has(ext)) continue;
    const t = p.text(f);
    if (!t || !/@astryxdesign\//.test(t) || isGenerated(t)) continue;
    for (const s of findSpecifiers(t, script ? "script" : "style")) {
      if (!mapSpecifier(s.spec, /** @type {any} */ (exportsAny))) continue;
      count++;
      if (details.length < 25) details.push(`${p.rel(f)}:${s.line} ${s.spec}`);
    }
  }
  if (count > 25) details.push(`… and ${count - 25} more`);
  if (count > 0)
    return result(
      id,
      title,
      "fail",
      `${count} module specifier${count === 1 ? "" : "s"} still import Astryx directly.`,
      {
        details,
        fix: "Run `ui-common adopt --from astryx` (then `--check` in CI), and ban `@astryxdesign/*` in ESLint (see the doc).",
      },
    );
  return result(
    id,
    title,
    "pass",
    "Every Astryx import goes through @lablup/ui-common.",
  );
}

/**
 * Where a layer-order statement has to be: the first `<style>` of an
 * index.html, before any stylesheet link; the first rule of a stylesheet.
 *
 * @param {string} file
 * @param {string} text
 * @returns {{names: string[] | null, problem: string | null}}
 */
export function readCopy(file, text) {
  const statements = layerStatements(text);
  const first = statements[0] ?? null;
  if (file.endsWith(".html")) {
    const scannable = blankComments(text);
    if (!first) return { names: null, problem: "declares no layer order" };
    const link = scannable.search(/<link\b[^>]*rel\s*=\s*["']stylesheet["']/i);
    if (link !== -1 && first.index > link)
      return {
        names: first.names,
        problem: 'the statement comes after a <link rel="stylesheet">',
      };
    const style = /<style\b[^>]*>([\s\S]*?)<\/style>/i.exec(scannable);
    if (style) {
      const bodyAt = (style.index ?? 0) + style[0].indexOf(">") + 1;
      const before = scannable.slice(bodyAt, first.index);
      if (first.index < bodyAt || before.trim() !== "")
        return {
          names: first.names,
          problem: "the first <style> does not open with the statement",
        };
    }
    return { names: first.names, problem: null };
  }
  const scannable = blankComments(text)
    .replace(/^\uFEFF/, "")
    .replace(/^\s*@charset\s+"[^"]*";/, (m) => " ".repeat(m.length));
  if (!first) return { names: null, problem: "declares no layer order" };
  // Sass requires @use/@forward first; nothing else may precede the statement.
  const before = scannable
    .slice(0, first.index)
    .replace(/\/\/[^\n]*/g, "")
    .replace(/@(?:use|forward)\b[^;]*;/g, "")
    .replace(/\$[\w-]+\s*:[^;]*;/g, "");
  if (before.trim() !== "")
    return {
      names: first.names,
      problem: "the statement is not the first rule in the file",
    };
  return { names: first.names, problem: null };
}

/** @param {string[]} names */
function orderProblem(names) {
  const at = (/** @type {string} */ n) => names.indexOf(n);
  if (at("ui-common") === -1) return "omits `ui-common`";
  if (at("astryx-theme") !== -1 && at("astryx-theme") > at("ui-common"))
    return "puts `ui-common` before `astryx-theme`";
  if (at("astryx-base") !== -1 && at("astryx-base") > at("ui-common"))
    return "puts `ui-common` before `astryx-base`";
  if (at("components") !== -1 && at("components") < at("ui-common"))
    return "puts `ui-common` after `components`";
  return null;
}

const LOADS_ASTRYX =
  /["']@(?:lablup\/ui-common|astryxdesign\/core)\/(?:reset|astryx)\.css["']/;

/** @param {Project} p */
export function checkLayerOrder(p) {
  const id = "layer-order";
  const title = "Layer order: declared first, with ui-common, the same everywhere";
  /** @type {string[]} */
  const details = [];
  /** @type {string[]} */
  const problems = [];
  /** @type {Map<string, string[]>} */
  const copies = new Map();
  const isAstryxOrder = (/** @type {string} */ t) =>
    layerStatements(t).some((s) =>
      s.names.some(
        (n) => n === "astryx-base" || n === "astryx-theme" || n === "ui-common",
      ),
    );
  const isHtml = (/** @type {string} */ f) =>
    basename(f) === "index.html" ||
    (basename(f) === "preview-head.html" && f.includes(".storybook"));
  // The page that decides the order may belong to a package of its own (a
  // workspace root's index.html): HTML copies count from anywhere. An
  // index.html without one is missing only when no page declares it.
  const htmlDeclares = p.files.some((f) => isHtml(f) && isAstryxOrder(p.text(f) ?? ""));
  /** @type {string[]} */
  const pagesWithout = [];
  for (const f of p.files) {
    const ext = extname(f);
    const html = isHtml(f);
    if (!html && !STYLE_EXTENSIONS.has(ext)) continue;
    const t = p.text(f);
    if (!t || isGenerated(t)) continue;
    const astryxStatement = isAstryxOrder(t);
    if (!html && !p.using.includes(ownerRoot(f, p.roots) ?? "")) continue;
    if (html && !astryxStatement) {
      if (
        basename(f) === "index.html" &&
        p.using.includes(ownerRoot(f, p.roots) ?? "") &&
        /type\s*=\s*["']module["']/.test(t)
      )
        pagesWithout.push(p.rel(f));
      continue;
    }
    const loads = !html && LOADS_ASTRYX.test(blankComments(t));
    if (!astryxStatement && !loads) continue;
    const copy = readCopy(f, t);
    if (copy.problem) problems.push(`${p.rel(f)}: ${copy.problem}`);
    if (copy.names) {
      copies.set(p.rel(f), copy.names);
      const bad = orderProblem(copy.names);
      if (bad) problems.push(`${p.rel(f)}: the order ${bad}`);
    }
  }
  if (!htmlDeclares)
    for (const f of pagesWithout)
      problems.push(
        `${f}: declares no layer order (put it in the first <style>, before any stylesheet)`,
      );
  for (const [f, names] of copies) details.push(`${f}: @layer ${names.join(", ")};`);
  const distinct = new Set([...copies.values()].map((n) => n.join(", ")));
  if (distinct.size > 1)
    problems.push(
      `${distinct.size} different statements; the first one parsed wins, so the order depends on load order`,
    );
  if (copies.size === 0 && problems.length === 0)
    return result(id, title, "fail", "No layer-order statement found.", {
      details,
      fix: "Put `@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;` first in the entry stylesheet and as the first <style> of index.html (`ui-common adopt` adds both).",
    });
  if (problems.length > 0)
    return result(
      id,
      title,
      "fail",
      problems[0] + (problems.length > 1 ? ` (+${problems.length - 1} more)` : "."),
      {
        details: [...problems.slice(1), ...details],
        fix: "Make every copy the same statement, first in its file, with `ui-common` after `astryx-theme` and before `components`.",
      },
    );
  return result(
    id,
    title,
    "pass",
    `${copies.size} cop${copies.size === 1 ? "y" : "ies"}, all \`@layer ${[...copies.values()][0].join(", ")};\`.`,
    { details },
  );
}

const CONFIG = /^(vite|vitest)\.(?:config|workspace)\.[cm]?[jt]s$/;

/** @param {Project} p */
export function checkVitePrebundle(p) {
  const id = "vite-prebundle";
  const title = "Vite pre-bundles ui-common under the StyleX plugin";
  /** @type {string[]} */
  const details = [];
  /** @type {string[]} */
  const missing = [];
  for (const f of p.files) {
    if (!/^vite\.config\.[cm]?[jt]s$/.test(basename(f))) continue;
    if (!p.using.includes(ownerRoot(f, p.roots) ?? "")) continue;
    const t = p.text(f);
    if (!t || !/@stylexjs\/unplugin/.test(t)) continue;
    const fixed =
      /['"]@lablup\/ui-common['"]/.test(t) && /optimizeDeps|exclude|include/.test(t);
    details.push(
      `${p.rel(f)}: StyleX unplugin, ${fixed ? "ui-common pre-bundled" : "no pre-bundle fix"}`,
    );
    if (!fixed) missing.push(p.rel(f));
  }
  if (details.length === 0)
    return result(id, title, "skip", "No Vite config uses @stylexjs/unplugin.");
  if (missing.length > 0)
    return result(
      id,
      title,
      "fail",
      `${missing.join(", ")}: a cold dev start can hang.`,
      {
        details,
        fix: "Add the `prebundle-ui-common` plugin after the StyleX plugin (it takes @lablup/ui-common back out of `optimizeDeps.exclude`), then start the dev server with `node_modules/.vite` removed.",
      },
    );
  return result(
    id,
    title,
    "pass",
    "Every Vite config with the StyleX plugin keeps ui-common pre-bundled.",
    { details },
  );
}

/** @param {Project} p */
export function checkVitestInline(p) {
  const id = "vitest-inline";
  const title = "Vitest processes ui-common";
  /** @type {string[]} */
  const details = [];
  /** @type {string[]} */
  const missing = [];
  for (const r of p.using) {
    const tests = p.files.filter(
      (f) =>
        ownerRoot(f, p.roots) === r &&
        /\.(test|spec)\.[cm]?[jt]sx?$/.test(f) &&
        /@testing-library\/react|['"]@lablup\/ui-common/.test(p.text(f) ?? ""),
    );
    if (tests.length === 0) continue;
    const configs = p.files.filter((f) => {
      if (ownerRoot(f, p.roots) !== r || !CONFIG.test(basename(f))) return false;
      const t = p.text(f) ?? "";
      return basename(f).startsWith("vitest") || /\btest\s*:/.test(t);
    });
    if (configs.length === 0) continue;
    for (const c of configs) {
      const t = p.text(c) ?? "";
      const ok = /inline\s*:\s*(?:true|\[[^\]]*ui-common)/.test(t);
      details.push(
        `${p.rel(c)}: ${ok ? "inlines" : "does not inline"} @lablup/ui-common (${tests.length} render test${tests.length === 1 ? "" : "s"})`,
      );
      if (!ok) missing.push(p.rel(c));
    }
  }
  if (details.length === 0)
    return result(
      id,
      title,
      "skip",
      "No Vitest config with tests that render ui-common.",
    );
  if (missing.length > 0)
    return result(
      id,
      title,
      "fail",
      `${missing.join(", ")}: a test that renders ui-common fails with "Unknown file extension .css".`,
      {
        details,
        fix: "Add `server: { deps: { inline: [/@lablup\\/ui-common/] } }` under `test` in each config.",
      },
    );
  return result(
    id,
    title,
    "pass",
    "Every Vitest config that renders ui-common inlines it.",
    { details },
  );
}

/** @param {Project} p */
export function checkI18n(p) {
  const id = "i18n";
  const title = "InternationalizationProvider gets ui-common's strings";
  /** @type {string[]} */
  const providers = [];
  let wired = false;
  for (const f of p.files) {
    if (!SCRIPT_EXTENSIONS.has(extname(f))) continue;
    const t = p.text(f);
    if (!t) continue;
    if (/@lablup\/ui-common\/(?:i18n-catalog|ui-common-locales)/.test(t)) wired = true;
    if (/<InternationalizationProvider\b/.test(t)) providers.push(p.rel(f));
  }
  if (providers.length === 0)
    return result(
      id,
      title,
      "skip",
      "No InternationalizationProvider: everything renders in English.",
    );
  if (!wired)
    return result(
      id,
      title,
      "fail",
      `${providers.join(", ")} render${providers.length === 1 ? "s" : ""} InternationalizationProvider, and nothing imports ui-common's catalog.`,
      {
        details: providers,
        fix: "Pass `mergeMessages({ [locale]: astryxCatalog }, uiCommonMessages)` (from @lablup/ui-common/i18n-catalog) as its `messages`.",
      },
    );
  return result(
    id,
    title,
    "pass",
    "ui-common's catalog is wired into the provider's messages.",
    { details: providers },
  );
}

/**
 * @param {Project} p
 * @param {(dir: string) => Promise<string>} [generate] the block for a directory
 */
export async function checkAgents(p, generate = generateBlock) {
  const id = "agents";
  const title = "The UI-COMMON agent block";
  /** @type {string[]} */
  const details = [];
  const dirs = [...new Set([p.projectDir, ...p.related])];
  const files = dirs
    .flatMap((d) => DEFAULT_AGENT_FILES.map((f) => join(d, f)))
    .filter((f) => existsSync(f));
  if (files.length === 0)
    return result(id, title, "warn", "No AGENTS.md or CLAUDE.md.", {
      fix: "`ui-common agents --write AGENTS.md` (or CLAUDE.md) gives coding agents ui-common's rules.",
    });
  /** @type {Map<string, string | null>} */
  const blocks = new Map();
  const blockFor = async (/** @type {string} */ dir) => {
    if (!blocks.has(dir)) {
      try {
        blocks.set(dir, await generate(dir));
      } catch {
        blocks.set(dir, null);
      }
    }
    return blocks.get(dir);
  };
  const problems = [];
  let current = 0;
  for (const f of files) {
    const t = readFileSync(f, "utf8");
    if (/<!--\s*ASTRYX:START\s*-->/.test(t))
      problems.push(
        `${p.rel(f)} still has an ASTRYX block: delete it (the UI-COMMON block replaces it)`,
      );
    let found;
    try {
      found = findBlock(t);
    } catch (err) {
      problems.push(`${p.rel(f)}: ${/** @type {Error} */ (err).message}`);
      continue;
    }
    if (!found) continue;
    const block = t.slice(found.start, found.end);
    let matches = false;
    for (const d of dirs) {
      if ((await blockFor(d)) === block) {
        matches = true;
        break;
      }
    }
    details.push(`${p.rel(f)}: ${matches ? "current" : "stale"}`);
    if (matches) current++;
    else problems.push(`${p.rel(f)}: the UI-COMMON block is stale`);
  }
  if (problems.length > 0)
    return result(
      id,
      title,
      "fail",
      problems[0] + (problems.length > 1 ? ` (+${problems.length - 1} more)` : "."),
      {
        details: [...problems.slice(1), ...details],
        fix: "Run `ui-common agents --write <file>` from the package the block was written for; keep project lines outside the markers.",
      },
    );
  if (current === 0)
    return result(
      id,
      title,
      "fail",
      `No UI-COMMON block in ${files.map((f) => p.rel(f)).join(", ")}.`,
      {
        fix: "`ui-common agents --write AGENTS.md` (or the agent file you use).",
      },
    );
  return result(
    id,
    title,
    "pass",
    `${current} current UI-COMMON block${current === 1 ? "" : "s"}.`,
    { details },
  );
}

/**
 * @param {{cwd: string, generateBlock?: (dir: string) => Promise<string>}} options
 */
export async function runDoctor(options) {
  const p = gatherProject(options.cwd);
  /** @type {Check[]} */
  const checks = [
    checkNode(p),
    checkVersions(p),
    checkSingleCore(p),
    checkLabCore(p),
    checkLabOverride(p),
    checkImports(p),
    checkLayerOrder(p),
    checkVitePrebundle(p),
    checkVitestInline(p),
    checkI18n(p),
    await checkAgents(p, options.generateBlock),
  ];
  const failed = checks.filter((c) => c.status === "fail").length;
  return { code: failed > 0 ? 1 : 0, projectDir: p.projectDir, checks };
}

const LABEL = { pass: "PASS", warn: "WARN", fail: "FAIL", skip: "SKIP" };

/** @param {Awaited<ReturnType<typeof runDoctor>>} run */
export function formatDoctor(run, verbose = false) {
  const out = [`ui-common doctor: ${run.projectDir}`, ""];
  for (const c of run.checks) {
    out.push(`${LABEL[c.status]}  ${c.id}: ${c.summary}`);
    if (c.status === "fail" || c.status === "warn" || verbose) {
      for (const d of c.details.slice(0, verbose ? undefined : 12))
        out.push(`        ${d}`);
      if (c.fix) out.push(`        fix: ${c.fix}`);
      if (c.status !== "pass" && c.status !== "skip") out.push(`        why: ${c.doc}`);
    }
  }
  const n = (/** @type {Status} */ s) =>
    run.checks.filter((c) => c.status === s).length;
  out.push(
    "",
    `${n("pass")} passed, ${n("warn")} warning${n("warn") === 1 ? "" : "s"}, ${n("fail")} failed, ${n("skip")} skipped.${n("fail") > 0 ? ` Each check is explained in ${DOC_URL}.` : ""}`,
  );
  return `${out.join("\n")}\n`;
}

export const DOCTOR_HELP = `Usage: ui-common doctor [--json] [--verbose]

Read-only checks that the project is wired onto @lablup/ui-common: one
@astryxdesign/core (and lab on it), no direct @astryxdesign/* imports, the
cascade-layer order, the Vite and Vitest settings ui-common needs, i18n
wiring, the UI-COMMON agent block, matching ui-common / ui-common-cli
versions, and Node for the CLI. Run from the project, or from a workspace
root to check every member. Each failure prints a fix and the section of
${DOC} that explains it.

  --json     Print {ok, projectDir, checks: [{id, title, status, summary,
             details, fix, doc}]} instead of text.
  --verbose  Print every check's details, not only failures'.

Exit codes: 0 no check failed (warnings allowed), 1 a check failed, 2 bad
arguments.
`;

/** @param {string[]} argv arguments after `doctor` */
export async function doctorCommand(argv) {
  let json = false;
  let verbose = false;
  for (const arg of argv) {
    if (arg === "--json") json = true;
    else if (arg === "--verbose") verbose = true;
    else if (arg === "-h" || arg === "--help") {
      process.stdout.write(DOCTOR_HELP);
      return 0;
    } else {
      process.stderr.write(
        `ui-common doctor: unknown argument "${arg}"\n${DOCTOR_HELP}`,
      );
      return 2;
    }
  }
  const run = await runDoctor({ cwd: process.cwd() });
  if (json) {
    process.stdout.write(
      `${JSON.stringify({ ok: run.code === 0, version: cliPackageJson().version, projectDir: run.projectDir, checks: run.checks }, null, 2)}\n`,
    );
  } else process.stdout.write(formatDoctor(run, verbose));
  return run.code;
}
