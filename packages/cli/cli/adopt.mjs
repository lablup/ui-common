/**
 * `ui-common adopt --from astryx`: move an app that imports Astryx directly
 * (`@astryxdesign/*`) onto `@lablup/ui-common`, in one pass.
 *
 * - Every `@astryxdesign/core[/X]`, `@astryxdesign/lab` and
 *   `@astryxdesign/theme-neutral` module specifier becomes its ui-common
 *   mirror, in scripts and stylesheets (../codemods/adopt/specifiers.mjs).
 * - `Dialog` / `AlertDialog` become `Modal` / `AlertModal`
 *   (../codemods/adopt/dialog.mjs).
 * - Each Astryx layer-order statement gains `ui-common`; an entry stylesheet
 *   and an `index.html` that declare none get one (../codemods/adopt/layers.mjs).
 * - Each package that used Astryx gets ui-common in its package.json
 *   (../codemods/adopt/package-json.mjs); a pnpm project declines the Astryx
 *   postinstalls in `allowBuilds`, and `/lab` brings the lab override.
 * - The report lists what needs a person (../codemods/adopt/scan.mjs).
 *
 * The edits are made in memory first: `--dry-run` writes nothing, `--check`
 * writes nothing and exits 1 when anything is left to do. A second run
 * changes nothing. In a workspace, every member package is covered.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";

import {
  applyAllowBuilds,
  DECLINED_BUILDS,
  addLabOverride,
} from "../codemods/0.2/package-json.mjs";
import { DIALOG_NAMES, transformDialogs } from "../codemods/adopt/dialog.mjs";
import {
  addUiCommonLayer,
  ensureHtmlLayerStatement,
  ensureLayerStatement,
  LAYER_ORDER,
  layerStatements,
} from "../codemods/adopt/layers.mjs";
import { adoptPackageJson, CLI_PACKAGE } from "../codemods/adopt/package-json.mjs";
import { CATEGORIES, scanFile, scanPatches } from "../codemods/adopt/scan.mjs";
import { isTestFile } from "../codemods/0.2/scan.mjs";
import {
  findSpecifiers,
  importedNamesAt,
  mapSpecifier,
  rewriteSpecifiers,
  UIC,
} from "../codemods/adopt/specifiers.mjs";
import { detectPackageManager } from "./lab-peer.mjs";
import { diffStat, unifiedDiff } from "./diff.mjs";
import {
  cliPackageJson,
  findProjectDir,
  targetUiCommonRoot,
  uiCommonPackageJson,
} from "./paths.mjs";
import {
  declarations,
  installRoot,
  isGenerated,
  listProjectFiles,
  ownerRoot,
  packageRoots,
  pnpmCatalogs,
  readText,
  relPath,
  SCRIPT_EXTENSIONS,
  STYLE_EXTENSIONS,
} from "./project.mjs";
import { ADOPT_REPORT_HEADING, renderReport } from "./report.mjs";

export const DEFAULT_ADOPT_REPORT = "ui-common-adopt-report.md";

/** Root-barrel names ui-common does not export (the hidden Dialog family). */
const HIDDEN_ROOT_NAMES = new Set([
  "Dialog",
  "DialogProps",
  "AlertDialog",
  "AlertDialogProps",
  "DialogVariantMap",
  "useImperativeDialog",
  "ImperativeDialogReturn",
  "useImperativeAlertDialog",
  "ImperativeAlertDialogReturn",
]);

const MIRRORED = /@astryxdesign\/(?:core|lab|theme-neutral)\b/;

/**
 * @typedef {object} AdoptOptions
 * @property {string} cwd
 * @property {string[]} [paths] where to rewrite (relative to cwd); default: the whole project
 * @property {string[]} [ignore] project-relative paths (or `*` globs) to leave alone
 * @property {boolean} [dryRun]
 * @property {boolean} [check] write nothing; exit 1 when anything is left
 * @property {boolean} [diff]
 * @property {string} [report]
 * @property {string} [version] the ui-common version to adopt (default: this CLI's)
 * @property {(line: string) => void} [log]
 * @property {(line: string) => void} [warn]
 */

/** @param {string} pattern project-relative path or glob */
function ignoreMatcher(pattern) {
  const p = pattern.replace(/^\.\//, "").replace(/\/+$/, "");
  if (!/[*?]/.test(p))
    return (/** @type {string} */ rel) => rel === p || rel.startsWith(`${p}/`);
  let re = "";
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "*" && p[i + 1] === "*") {
      re += ".*";
      i++;
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  const rx = new RegExp(`^${re}(/.*)?$`);
  return (/** @type {string} */ rel) => rx.test(rel);
}

/**
 * @param {AdoptOptions} options
 */
export async function runAdopt(options) {
  const log = options.log ?? ((line) => process.stdout.write(`${line}\n`));
  const warn = options.warn ?? ((line) => process.stderr.write(`${line}\n`));
  const cwd = resolve(options.cwd);
  const projectDir = findProjectDir(cwd) ?? cwd;
  const roots = packageRoots(projectDir);
  const install = installRoot(projectDir);
  const own = cliPackageJson();
  // The ui-common version adopted is the CLI's own (they are released in
  // lockstep); `version` overrides it for the tests' fixtures.
  const version = options.version ?? own.version;
  const target = uiCommonPackageJson(targetUiCommonRoot(projectDir));
  const exportsMap = /** @type {Record<string, unknown>} */ (target.exports ?? {});
  const corePin = target.dependencies?.["@astryxdesign/core"] ?? "";
  const labPin = target.peerDependencies?.["@astryxdesign/lab"] ?? "";
  const stylexRange = target.peerDependencies?.["@stylexjs/stylex"] ?? "^0.19.0";
  const check = Boolean(options.check);
  const dryRun = Boolean(options.dryRun) || check;
  const rel = (/** @type {string} */ f) => relPath(projectDir, f);

  const reportFile = resolve(cwd, options.report ?? DEFAULT_ADOPT_REPORT);
  const writeReport = !dryRun || (options.report != null && !check);
  if (
    writeReport &&
    existsSync(reportFile) &&
    !readFileSync(reportFile, "utf8").startsWith(ADOPT_REPORT_HEADING)
  ) {
    warn(
      `ui-common adopt: ${relative(cwd, reportFile)} exists and is not an adopt report; not overwriting it. Pass --report <path>.`,
    );
    return { code: 2 };
  }

  const scopeRoots = (options.paths ?? []).map((p) => resolve(cwd, p));
  const missing = scopeRoots.filter((p) => !existsSync(p));
  if (scopeRoots.length > 0 && missing.length === scopeRoots.length) {
    warn(
      `ui-common adopt: nothing to adopt: ${missing.map((p) => relative(cwd, p) || ".").join(", ")} not found.`,
    );
    return { code: 2 };
  }
  const ignores = (options.ignore ?? []).map(ignoreMatcher);
  const inScope = (/** @type {string} */ f) =>
    (scopeRoots.length === 0 ||
      scopeRoots.some((r) => f === r || f.startsWith(r.endsWith(sep) ? r : r + sep))) &&
    !ignores.some((m) => m(rel(f)));

  const allFiles = listProjectFiles(projectDir, roots).filter((f) => f !== reportFile);
  const { default: jscodeshift } = await import("jscodeshift");

  /** @type {Map<string, {original: string, current: string, transforms: string[], created: boolean}>} */
  const state = new Map();
  /** @type {Array<{file: string, transform: string, error: string}>} */
  const errors = [];
  /** @type {Array<{category: string, file: string, line: number, text: string, detail?: string}>} */
  const findings = [];
  /** @type {string[]} */
  const notes = [];
  /** @type {string[]} */
  const notices = [];
  /** @type {string[]} */
  const alerts = [];
  /** @type {Record<string, number>} */
  const rows = {};
  /** @type {string[]} */
  const generated = [];
  /** Package roots whose modules imported Astryx before the run. */
  /** @type {Set<string>} */
  const usingRoots = new Set();

  const touch = (
    /** @type {string} */ file,
    /** @type {string} */ next,
    /** @type {string} */ transform,
  ) => {
    const entry = state.get(file);
    if (!entry || next === entry.current) return;
    entry.current = next;
    if (!entry.transforms.includes(transform)) entry.transforms.push(transform);
  };

  // 1. Module specifiers and Dialog renames, in scripts and stylesheets.
  for (const file of allFiles) {
    if (!inScope(file)) continue;
    const ext = extname(file);
    const script = SCRIPT_EXTENSIONS.has(ext);
    const style = STYLE_EXTENSIONS.has(ext);
    if (!script && !style) continue;
    const source = readText(file);
    if (source == null) continue;
    if (!MIRRORED.test(source) && !(style && /@layer\b/.test(source))) continue;
    if (isGenerated(source)) {
      if (
        findSpecifiers(source, script ? "script" : "style").some((s) =>
          mapSpecifier(s.spec, exportsMap),
        )
      )
        generated.push(rel(file));
      continue;
    }
    state.set(file, {
      original: source,
      current: source,
      transforms: [],
      created: false,
    });
    if (
      findSpecifiers(source, script ? "script" : "style").some((s) =>
        mapSpecifier(s.spec, exportsMap),
      )
    )
      usingRoots.add(ownerRoot(file, roots) ?? projectDir);

    if (script && DIALOG_NAMES.test(source)) {
      const j = jscodeshift.withParser(/\.[cm]?tsx?$/.test(ext) ? "tsx" : "babel");
      try {
        const result = transformDialogs({ source, path: file }, j);
        if (result.text != null) touch(file, result.text, "dialog-to-modal");
        for (const f of result.findings) findings.push({ ...f, file: rel(file) });
      } catch (err) {
        errors.push({
          file: rel(file),
          transform: "dialog-to-modal",
          error: `could not be parsed, so Dialog imports were not renamed: ${/** @type {Error} */ (err).message}`,
        });
      }
    }
    const entry = /** @type {NonNullable<ReturnType<typeof state.get>>} */ (
      state.get(file)
    );
    const text = entry.current;
    const rewritten = rewriteSpecifiers(
      text,
      script ? "script" : "style",
      exportsMap,
      (spec, at) => {
        if (spec !== "@astryxdesign/core") return null;
        const names = importedNamesAt(text, at);
        const hidden = names?.filter((n) => HIDDEN_ROOT_NAMES.has(n)) ?? [];
        return hidden.length > 0
          ? `${UIC}'s root does not export ${hidden.join(", ")}: rename to Modal / AlertModal (${UIC}/Modal, ${UIC}/AlertModal), then run adopt again.`
          : null;
      },
    );
    touch(file, rewritten.text, "specifiers");
    for (const [row, n] of Object.entries(rewritten.rows))
      rows[row] = (rows[row] ?? 0) + n;
    for (const l of rewritten.left) {
      findings.push({
        category: "unmirrored",
        file: rel(file),
        line: l.line,
        text: l.text,
        detail: l.reason,
      });
    }
    if (style) {
      touch(file, addUiCommonLayer(entry.current).text, "layer-order");
      const ensured = ensureLayerStatement(entry.current, file);
      if (ensured != null) touch(file, ensured, "layer-order");
    }
  }

  // Roots that declare Astryx count as using it, whatever their modules say.
  for (const r of roots) {
    const pkg = readJsonSafe(join(r, "package.json"));
    if (
      ["@astryxdesign/core", "@astryxdesign/lab", "@astryxdesign/theme-neutral"].some(
        (n) => declarations(pkg, n).length > 0,
      )
    )
      usingRoots.add(r);
  }

  // 2. index.html (and Storybook's head) copies of the layer order. One page
  // of the project that declares the order is enough: a second index.html is
  // usually a build-entry stub whose content a plugin replaces.
  const htmlDeclares = allFiles.some(
    (f) =>
      basename(f) === "index.html" &&
      layerStatements(readText(f) ?? "").some((s) =>
        s.names.some((n) => n.startsWith("astryx-")),
      ),
  );
  for (const r of roots) {
    if (!usingRoots.has(r)) continue;
    const statements = new Set();
    for (const [file, entry] of state) {
      if (ownerRoot(file, roots) !== r || !STYLE_EXTENSIONS.has(extname(file)))
        continue;
      for (const s of layerStatements(entry.current))
        if (s.names.includes("ui-common"))
          statements.add(`@layer ${s.names.join(", ")};`);
    }
    const statement = statements.size === 1 ? [...statements][0] : LAYER_ORDER;
    for (const html of [
      join(r, "index.html"),
      join(r, ".storybook", "preview-head.html"),
    ]) {
      if (!existsSync(html) || !inScope(html)) continue;
      const source = readFileSync(html, "utf8");
      state.set(html, {
        original: source,
        current: source,
        transforms: [],
        created: false,
      });
      touch(html, addUiCommonLayer(source).text, "layer-order");
      if (basename(html) === "index.html" && !htmlDeclares) {
        const ensured = ensureHtmlLayerStatement(
          state.get(html)?.current ?? source,
          statement,
        );
        if (ensured != null) touch(html, ensured, "layer-order");
      }
    }
  }

  // 3. package.json, per package that used Astryx; pnpm-workspace.yaml once.
  const { manager, workspaceYaml } = detectPackageManager(
    projectDir,
    readJsonSafe(join(projectDir, "package.json")),
  );
  const yamlText = workspaceYaml ? readText(workspaceYaml) : null;
  const catalogs = pnpmCatalogs(yamlText);
  const usingList = roots.filter((r) => usingRoots.has(r));
  const declaresCli = roots.some(
    (r) => declarations(readJsonSafe(join(r, "package.json")), CLI_PACKAGE).length > 0,
  );
  // The bin goes next to ui-common in an application, else the first package.
  const cliHome =
    usingList.find((r) => {
      const pkg = readJsonSafe(join(r, "package.json"));
      return ![
        "@astryxdesign/core",
        "@astryxdesign/lab",
        "@astryxdesign/theme-neutral",
        UIC,
      ].some((n) => pkg?.peerDependencies?.[n] != null);
    }) ?? usingList[0];
  /** @type {Array<{file: string, before: string, after: string}>} */
  const pkgEdits = [];
  let anyLab = false;
  const editFile = (
    /** @type {string} */ path,
    /** @type {(current: string | null) => string | undefined} */ edit,
    id = "package-json",
  ) => {
    const known = state.get(path);
    const current = known
      ? known.current
      : existsSync(path)
        ? readFileSync(path, "utf8")
        : null;
    const next = edit(current);
    if (next == null || next === current) return;
    if (known) {
      touch(path, next, id);
      return;
    }
    state.set(path, {
      original: current ?? "",
      current: next,
      transforms: [id],
      created: current == null,
    });
  };
  for (const r of usingList) {
    const pkgFile = join(r, "package.json");
    const text = readText(pkgFile);
    if (text == null) continue;
    // Every module of the package as the run leaves it, not only the rewritten ones.
    const owned = allFiles
      .filter(
        (f) =>
          ownerRoot(f, roots) === r &&
          (SCRIPT_EXTENSIONS.has(extname(f)) || STYLE_EXTENSIONS.has(extname(f))),
      )
      .map((f) => state.get(f)?.current ?? readText(f) ?? "");
    const usesLab = owned.some((t) => /['"]@lablup\/ui-common\/lab\b/.test(t));
    if (usesLab) anyLab = true;
    const keepsLab = owned.some((t) => /['"]@astryxdesign\/lab\b/.test(t));
    const keepsNeutral = owned.some((t) =>
      /['"]@astryxdesign\/theme-neutral\b/.test(t),
    );
    const result = adoptPackageJson(text, {
      rel: rel(r),
      version,
      corePin,
      labPin,
      stylexRange,
      astryxCliPin: own.dependencies?.["@astryxdesign/cli"],
      usesLab,
      keepsLab,
      keepsNeutral,
      addCli: !declaresCli && r === cliHome,
      catalogs,
      note: (m) => notes.push(m),
      alert: (m) => alerts.push(m),
    });
    let after = result.text ?? text;
    if (usesLab && (result.labAdded || !result.declaresCore)) {
      const pkg = JSON.parse(after);
      addLabOverride(pkg, {
        projectDir: r,
        note: (/** @type {string} */ m) => m && notes.push(m),
        editFile,
      });
      const indent = /^([ \t]+)"/m.exec(after)?.[1] ?? "  ";
      after = `${JSON.stringify(pkg, null, indent)}${text.endsWith("\n") ? "\n" : ""}`;
    }
    if (after !== text) pkgEdits.push({ file: pkgFile, before: text, after });
  }
  if (usingList.length > 0 && manager === "pnpm" && workspaceYaml) {
    editFile(workspaceYaml, (current) => {
      const edit = applyAllowBuilds(current, DECLINED_BUILDS);
      for (const note of edit.notes) notes.push(note);
      return edit.yaml;
    });
    const yaml = readText(workspaceYaml) ?? "";
    if (/^minimumReleaseAge\s*:/m.test(yaml)) {
      const wanted = [
        `${UIC}@${version}`,
        `${CLI_PACKAGE}@${version}`,
        ...(labPin && anyLab ? [`@astryxdesign/lab@${labPin}`] : []),
      ];
      const missingExcludes = wanted.filter((w) => !yaml.includes(w));
      if (missingExcludes.length > 0)
        notices.push(
          `pnpm-workspace.yaml sets \`minimumReleaseAge\`: a ${UIC} release younger than that will not install. Until it ages out, list ${missingExcludes.map((w) => `\`${w}\``).join(", ")} under \`minimumReleaseAgeExclude\`${missingExcludes.some((w) => w.startsWith("@astryxdesign/lab@")) ? " (a lab canary never ages out)" : ""}.`,
        );
    }
  }
  for (const e of pkgEdits) {
    state.set(e.file, {
      original: e.before,
      current: e.after,
      transforms: ["package-json"],
      created: false,
    });
  }

  // 4. Report-only findings, over the whole project as the run leaves it.
  // Runtime findings (overlays, shortcuts, i18n) come from the packages that
  // use Astryx, without their tests; tooling findings from everywhere.
  const runtime = new Set(["portals", "hotkeys", "escape", "i18n"]);
  for (const file of allFiles) {
    const text = state.get(file)?.current ?? readText(file);
    if (text == null || isGenerated(text)) continue;
    const app = usingRoots.has(ownerRoot(file, roots) ?? "") && !isTestFile(rel(file));
    findings.push(
      ...scanFile(rel(file), text).filter((f) => app || !runtime.has(f.category)),
    );
  }
  findings.push(...scanPatches(install, projectDir));
  // ui-common's catalog wired anywhere answers the i18n finding for the project.
  const catalogWired = allFiles.some((f) =>
    /@lablup\/ui-common\/(?:i18n-catalog|ui-common-locales)/.test(
      state.get(f)?.current ?? readText(f) ?? "",
    ),
  );
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  // One row per place and kind: details of the same line are joined.
  for (let i = findings.length - 1; i >= 0; i--) {
    const f = findings[i];
    if (catalogWired && f.category === "i18n") {
      findings.splice(i, 1);
      continue;
    }
    const twin = findings.findIndex(
      (g, j) =>
        j < i && g.category === f.category && g.file === f.file && g.line === f.line,
    );
    if (twin !== -1) {
      const g = findings[twin];
      if (f.detail && f.detail !== g.detail)
        g.detail = g.detail ? `${g.detail}; ${f.detail}` : f.detail;
      findings.splice(i, 1);
    }
  }
  if (generated.length > 0) {
    notices.push(
      `${generated.length} generated file${generated.length === 1 ? "" : "s"} (an \`@generated\` header) still name${generated.length === 1 ? "s" : ""} \`@astryxdesign/*\` and ${generated.length === 1 ? "was" : "were"} left as ${generated.length === 1 ? "it is" : "they are"}: ${generated
        .slice(0, 5)
        .map((g) => `\`${g}\``)
        .join(
          ", ",
        )}${generated.length > 5 ? ", …" : ""}. Regenerate them after adopting; \`astryx theme build\` output keeps Astryx's own ids.`,
    );
  }

  const changed = [...state.entries()]
    .filter(([, e]) => e.current !== e.original)
    .map(([file, e]) => ({
      file: rel(file),
      abs: file,
      ...e,
      stat: diffStat(e.original, e.current),
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
  const left = findings.filter((f) => f.category === "unmirrored");

  if (!dryRun) {
    for (const c of changed) {
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
  }

  const rewrites = Object.entries(rows)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([row, count]) => ({ row, count }));
  const total = rewrites.reduce((n, r) => n + r.count, 0);
  const pkgChanged = changed.some((c) => basename(c.abs) === "package.json");
  const report = renderReport({
    heading: ADOPT_REPORT_HEADING,
    command: "ui-common adopt",
    from: "astryx",
    to: `${UIC} ${version}`,
    version,
    dryRun,
    roots:
      scopeRoots.length > 0 ? scopeRoots.map((r) => rel(r)) : roots.map((r) => rel(r)),
    fileCount: state.size,
    scanRoots: ["."],
    scanCount: allFiles.length,
    steps: [
      { version, title: "Astryx (`@astryxdesign/*`) → @lablup/ui-common", notes: [] },
    ],
    rewrites,
    changed: changed.map((c) => ({
      file: c.file,
      created: c.created,
      transforms: c.transforms,
      ...c.stat,
    })),
    packageJson: { changed: pkgChanged, notes },
    todos: [],
    findings,
    categories: CATEGORIES,
    errors,
    notices,
    alerts,
    tokenReads: 0,
  });
  if (writeReport) {
    mkdirSync(dirname(reportFile), { recursive: true });
    writeFileSync(reportFile, report);
  }

  const verb = dryRun ? "Would change" : "Changed";
  for (const c of changed)
    log(`  ${c.created ? "+" : "~"} ${c.file} (+${c.stat.added} -${c.stat.removed})`);
  log(
    `${verb} ${changed.length} file${changed.length === 1 ? "" : "s"} (${total} specifier${total === 1 ? "" : "s"} rewritten); ${findings.length} manual-review item${findings.length === 1 ? "" : "s"}, ${left.length} \`@astryxdesign/*\` import${left.length === 1 ? "" : "s"} left.`,
  );
  if (dryRun && options.diff)
    for (const c of changed) log(unifiedDiff(c.file, c.original, c.current));
  for (const e of errors) warn(`  ! ${e.file} [${e.transform}]: ${e.error}`);
  for (const a of alerts) warn(`  ACTION REQUIRED: ${a}`);
  for (const n of notices) warn(`  note: ${n}`);

  if (check) {
    const pending = changed.length + left.length;
    if (pending === 0) log("ui-common adopt --check: nothing left to adopt.");
    else {
      for (const c of changed)
        warn(`  would change ${c.file} (${c.transforms.join(", ")})`);
      for (const l of left) warn(`  left: ${l.file}:${l.line} ${l.text}`);
      warn(
        `ui-common adopt --check: ${changed.length} file${changed.length === 1 ? "" : "s"} to change, ${left.length} \`@astryxdesign/*\` import${left.length === 1 ? "" : "s"} left. ${changed.length > 0 ? "Run `ui-common adopt --from astryx`" : "Move what is left by hand (the reason is beside each)"}${changed.length > 0 && left.length > 0 ? ", then move what it leaves by hand" : ""}.`,
      );
    }
    return {
      code: errors.length > 0 || pending > 0 ? 1 : 0,
      changed,
      findings,
      left,
      errors,
      report,
      rows,
    };
  }

  if (writeReport) log(`Report: ${relative(cwd, reportFile) || reportFile}`);
  else log(`\n${report}`);
  if (dryRun)
    log(
      `Dry run: nothing was written${writeReport ? " but the report" : ""}. Run without --dry-run to apply${writeReport ? "" : ", or pass --report <path> to keep the report"}.`,
    );
  else if (pkgChanged)
    log(
      "package.json changed: run your package manager's install, then `ui-common doctor`.",
    );
  return {
    code: errors.length > 0 ? 1 : 0,
    changed,
    findings,
    left,
    errors,
    report,
    rows,
  };
}

/** @param {string} file */
function readJsonSafe(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export const ADOPT_HELP = `Usage: ui-common adopt --from astryx [--dry-run | --check] [--diff] [--report <path>] [--ignore <path>]… [paths…]

Move a project that imports Astryx directly (@astryxdesign/*) onto
@lablup/ui-common, in one pass. In a workspace, every member package is
covered. \`ui-common upgrade --from astryx\` is the same command.

- Rewrites every @astryxdesign/core[/X], @astryxdesign/lab and
  @astryxdesign/theme-neutral module specifier to its @lablup/ui-common
  mirror: imports, export … from, import(), require(), typeof import,
  vi.mock/jest.mock, and CSS/SCSS @import/@use. @astryxdesign/cli and
  \`declare module\` augmentations are left alone.
- Renames Dialog / AlertDialog to Modal / AlertModal (ui-common hides them).
- Adds the \`ui-common\` layer to every Astryx @layer order statement, and the
  statement to an entry stylesheet or index.html that has none.
- package.json: adds @lablup/ui-common and @lablup/ui-common-cli at this CLI's
  version, keeps @astryxdesign/core only where declared and at ui-common's
  pin, drops @astryxdesign/theme-neutral and an unused @astryxdesign/lab, and
  (pnpm) declines the Astryx postinstalls in allowBuilds.
- Writes ui-common-adopt-report.md: what changed, and what needs a person
  (local Astryx patches, Modal refs, body portals, global hotkeys, ASTRYX agent
  blocks, \`astryx\` CLI calls, i18n wiring).

One-off, before ui-common is installed (\`@next\` until 0.2.0 is published):
  pnpm dlx @lablup/ui-common-cli@next adopt --from astryx --dry-run
  (npx @lablup/ui-common-cli@next adopt --from astryx --dry-run)

  --from astryx     What the project uses now. Required; \`astryx\` is the only value.
  --dry-run         Write nothing; list what would change and print the report.
  --check           Write nothing; exit 1 when a file would change or an
                    @astryxdesign/* import is left. For CI, after adopting:
                    every merge can bring new @astryxdesign/* imports back.
  --diff            With --dry-run, also print unified diffs.
  --report <path>   Where to write the report. Default: ${DEFAULT_ADOPT_REPORT}
                    (a dry run writes one only to a path given here).
  --ignore <path>   A project-relative path or glob to leave alone. Repeatable.
                    Files with an @generated header are always left alone.
  paths…            Only rewrite under these. Default: the whole project
                    (git-tracked and untracked files, without node_modules,
                    build output, and nested packages that are not workspace
                    members).

Exit codes: 0 done (or, with --check, nothing left), 1 a file could not be
transformed or --check found work, 2 bad arguments.
`;

/**
 * @param {string[]} argv arguments after `adopt`
 */
export async function adoptCommand(argv) {
  /** @type {AdoptOptions} */
  const options = { cwd: process.cwd(), paths: [], ignore: [] };
  /** @type {string | undefined} */
  let from;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inline] =
      arg.startsWith("--") && arg.includes("=")
        ? arg.split(/=(.*)/s)
        : [arg, undefined];
    const value = () => inline ?? argv[++i];
    switch (flag) {
      case "--from":
        from = value();
        break;
      case "--report":
        options.report = value();
        if (!options.report) {
          process.stderr.write("ui-common adopt: --report needs a value\n");
          return 2;
        }
        break;
      case "--ignore": {
        const v = value();
        if (!v) {
          process.stderr.write("ui-common adopt: --ignore needs a value\n");
          return 2;
        }
        options.ignore?.push(v);
        break;
      }
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--check":
        options.check = true;
        break;
      case "--diff":
        options.diff = true;
        break;
      case "-h":
      case "--help":
        process.stdout.write(ADOPT_HELP);
        return 0;
      default:
        if (arg.startsWith("-")) {
          process.stderr.write(
            `ui-common adopt: unknown option "${arg}"\n${ADOPT_HELP}`,
          );
          return 2;
        }
        options.paths?.push(arg);
    }
  }
  if (from === undefined) {
    process.stderr.write(
      "ui-common adopt: say what the project uses now: --from astryx (an app on @astryxdesign/*). An app on ui-common 0.1 runs `ui-common upgrade --from 0.1` instead.\n",
    );
    return 2;
  }
  if (from.toLowerCase() !== "astryx") {
    process.stderr.write(
      `ui-common adopt: --from "${from}" is not supported; the only value is "astryx". An app on ui-common 0.1 runs \`ui-common upgrade --from 0.1\`.\n`,
    );
    return 2;
  }
  if (options.check && options.dryRun) {
    process.stderr.write(
      "ui-common adopt: --check already writes nothing; drop --dry-run.\n",
    );
    return 2;
  }
  const result = await runAdopt(options);
  return result.code;
}
