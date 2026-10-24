/**
 * ui-common's page and block templates: `ui-common template`, and the
 * template parts of `search` and `build`.
 *
 * Astryx's own templates import `@astryxdesign/*` and Heroicons directly, and
 * the Astryx CLI copies a template's source verbatim, so a scaffolded Astryx
 * template breaks a ui-common project's import rules. ui-common therefore
 * offers only the templates @lablup/ui-common ships (`astryx/templates`,
 * written against `@lablup/ui-common` and lucide-react):
 *
 * - `template` is ui-common's own command; it never runs Astryx's.
 * - `search` drops Astryx's templates from its results (filterSearchOutput).
 * - `build` replaces the kit's template sections with ui-common's templates
 *   ranked against the query (filterBuildOutput). Astryx's own ranking reads
 *   a template's keywords as prose only, which ranks these few templates
 *   poorly ("admin dashboard" → tabbed-page), so they are matched here.
 *
 * `ui-common astryx template …` still runs Astryx's command as is.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { detectPackageManager } from "./lab-peer.mjs";
import {
  UI_COMMON,
  binInvocation,
  findProjectDir,
  readJson,
  uiCommonPackageJson,
  uiCommonRoot,
} from "./paths.mjs";

/**
 * @typedef {object} Template
 * @property {string} id
 * @property {"page"|"block"} type
 * @property {string} displayName
 * @property {string} description
 * @property {string[]} keywords
 * @property {string[]} componentsUsed
 * @property {string} file  absolute path of the `.tsx` source
 */

/** @param {string} root the installed @lablup/ui-common */
function templatesDir(root) {
  return join(root, "astryx", "templates");
}

/**
 * Ids of the templates @lablup/ui-common ships, sorted.
 *
 * @param {string} [root] the installed @lablup/ui-common
 */
export function templateIds(root = uiCommonRoot()) {
  const dir = templatesDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".doc.mjs"))
    .map((f) => f.slice(0, -".doc.mjs".length))
    .sort();
}

/**
 * The ui-common components a template renders: the names it imports from
 * `@lablup/ui-common` that appear as a JSX tag, in import order.
 *
 * @param {string} source
 * @returns {string[]}
 */
export function componentsIn(source) {
  const imported = [
    ...source.matchAll(
      /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']@lablup\/ui-common(?:\/[^"']*)?["']/g,
    ),
  ].flatMap((m) =>
    (m[1] ?? "")
      .split(",")
      .map(
        (s) =>
          s
            .trim()
            .replace(/^type\s+/, "")
            .split(/\s+as\s+/)
            .pop() ?? "",
      )
      .filter((name) => /^[A-Z]/.test(name)),
  );
  return [...new Set(imported)].filter((name) =>
    new RegExp(`(?<![\\w$])<${name}[\\s/>.]`).test(source),
  );
}

/**
 * The templates @lablup/ui-common ships, sorted by id. Astryx allows
 * `componentsUsed` on block templates only, so a page's list is read from
 * its source.
 *
 * @param {string} [root] the installed @lablup/ui-common
 * @returns {Promise<Template[]>}
 */
export async function loadTemplates(root = uiCommonRoot()) {
  const dir = templatesDir(root);
  return Promise.all(
    templateIds(root).map(async (id) => {
      const doc = (await import(pathToFileURL(join(dir, `${id}.doc.mjs`)).href))
        .default;
      const file = join(dir, `${id}.tsx`);
      return {
        id,
        type: doc.type,
        displayName: doc.displayName ?? id,
        description: doc.description ?? "",
        keywords: doc.keywords ?? [],
        componentsUsed:
          doc.componentsUsed ??
          (existsSync(file) ? componentsIn(readFileSync(file, "utf8")) : []),
        file,
      };
    }),
  );
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

/**
 * Words that say what kind of thing is wanted, not which one. "page" is in
 * half the template ids; matched alone it would turn any "<x> page" into a
 * list page.
 */
const GENERIC_TERMS = new Set([
  "page",
  "pages",
  "screen",
  "view",
  "ui",
  "template",
  "block",
]);

/** @param {string} s */
function words(s) {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP_WORDS.has(w));
}

/**
 * Templates that match `query`, best first. A term scores on the template's
 * id, keywords and display name, then components and description; a template
 * matched only through its description, or only through a generic term, is
 * left out.
 *
 * @param {string} query
 * @param {Template[]} templates
 * @returns {Template[]}
 */
export function matchTemplates(query, templates) {
  const all = words(query);
  const generic = all.filter((term) => GENERIC_TERMS.has(term));
  const terms = all.filter((term) => !GENERIC_TERMS.has(term));
  const phrase = ` ${all.join(" ")} `;
  const scored = [];
  for (const t of templates) {
    const id = new Set(words(t.id));
    const keywords = new Set(t.keywords.flatMap(words));
    const name = new Set(words(t.displayName));
    const components = new Set(t.componentsUsed.flatMap(words));
    const description = new Set(words(t.description));
    let score = 0;
    let strong = false;
    for (const term of terms) {
      if (id.has(term)) score += 3;
      if (keywords.has(term)) score += 2;
      if (name.has(term)) score += 2;
      if (id.has(term) || keywords.has(term) || name.has(term)) strong = true;
      if (components.has(term)) score += 1;
      if (description.has(term)) score += 1;
    }
    // A whole keyword phrase ("list page", "detail drawer") in the query.
    for (const keyword of t.keywords) {
      const k = words(keyword);
      if (k.length > 1 && phrase.includes(` ${k.join(" ")} `)) score += 3;
    }
    for (const term of generic) if (id.has(term)) score += 1;
    if (strong) scored.push({ t, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id))
    .map((s) => s.t);
}

/**
 * Packages a template needs beyond @lablup/ui-common and React, with the
 * range ui-common uses, that the project does not list.
 *
 * @param {string} source
 * @param {string} projectDir
 * @param {string} root the installed @lablup/ui-common
 * @returns {{name: string, range?: string}[]}
 */
export function missingDependencies(source, projectDir, root) {
  const pkg = uiCommonPackageJson(root);
  /** @type {Record<string, string|undefined>} */
  const needs = {};
  if (/from\s+["']lucide-react["']/.test(source)) {
    needs["lucide-react"] = pkg.dependencies?.["lucide-react"];
  }
  if (/from\s+["']@lablup\/ui-common\/lab["']/.test(source)) {
    needs["@astryxdesign/lab"] = pkg.peerDependencies?.["@astryxdesign/lab"];
  }
  const projectFile = join(projectDir, "package.json");
  const project = existsSync(projectFile) ? readJson(projectFile) : {};
  const listed = {
    ...project.dependencies,
    ...project.devDependencies,
    ...project.peerDependencies,
  };
  return Object.entries(needs)
    .filter(([name]) => !(name in listed))
    .map(([name, range]) => (range ? { name, range } : { name }));
}

/** How the project adds packages, and each one quoted for a shell. */
function installCommand(
  /** @type {string} */ projectDir,
  /** @type {{name: string, range?: string}[]} */ packages,
) {
  const projectFile = join(projectDir, "package.json");
  const { manager } = detectPackageManager(
    projectDir,
    existsSync(projectFile) ? readJson(projectFile) : {},
  );
  const add = manager === "npm" || !manager ? "npm install" : `${manager} add`;
  return `${add} ${packages.map((p) => (p.range ? `${p.name}@"${p.range}"` : p.name)).join(" ")}`;
}

/** @param {Template[]} templates @param {"page"|"block"} type */
function ofType(templates, type) {
  return templates.filter((t) => t.type === type);
}

/** The first sentence of a description. */
function summary(/** @type {string} */ description) {
  const end = description.search(/\.(\s|$)/);
  return end === -1 ? description : description.slice(0, end + 1);
}

/** The command that prints a template, or scaffolds a page. */
function scaffoldCommand(/** @type {Template} */ t, /** @type {string} */ invocation) {
  return `${invocation} template ${t.id}${t.type === "page" ? " <path>" : ""}`;
}

/** `key: value` lines aligned the way Astryx prints a record. */
function record(/** @type {Record<string, string>} */ fields) {
  return Object.entries(fields)
    .map(([key, value]) => `${`${key}:`.padEnd(13)}${value}`)
    .join("\n");
}

/** Print an API-style JSON response, as Astryx's `--json` does. */
function printJson(/** @type {string} */ type, /** @type {unknown} */ data) {
  process.stdout.write(`${JSON.stringify({ apiVersion: 1, type, data }, null, 2)}\n`);
}

export const TEMPLATE_HELP = `Usage: ui-common template [<name> [<path>]] [options]

List, print or scaffold one of @lablup/ui-common's templates. They import only
@lablup/ui-common, react and lucide-react. Astryx's own templates are not
offered: they import @astryxdesign/* directly. (\`ui-common astryx template\`
still runs Astryx's command.)

  ui-common template                     List the templates
  ui-common template <name>              Print one's source
  ui-common template <name> <path>       Write it. A <path> ending in .tsx/.ts/.jsx/.js
                                         is the file; otherwise a directory, which gets
                                         page.tsx for a page and <name>.tsx for a block.

Options:
  --list            List the templates and do nothing else
  --type <type>     With --list: only pages or only blocks (page|block)
  --overwrite       Replace an existing file
  --json            Print JSON
  -h, --help        Show this help
`;

/** Astryx's template options, which select Astryx's templates. */
const REFUSED = ["package", "cdn", "skeleton"];

/**
 * `ui-common template …`.
 *
 * @param {string[]} argv
 * @returns {Promise<number>}
 */
export async function templateCommand(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        help: { type: "boolean", short: "h" },
        list: { type: "boolean" },
        overwrite: { type: "boolean" },
        json: { type: "boolean" },
        type: { type: "string" },
        package: { type: "string" },
        cdn: { type: "boolean" },
        skeleton: { type: "boolean" },
      },
    });
  } catch (err) {
    process.stderr.write(
      `ui-common template: ${/** @type {Error} */ (err).message}\n${TEMPLATE_HELP}`,
    );
    return 2;
  }
  const { values, positionals } = parsed;
  if (values.help) {
    process.stdout.write(TEMPLATE_HELP);
    return 0;
  }
  const refused = REFUSED.find(
    (name) => values[/** @type {"package"} */ (name)] !== undefined,
  );
  if (refused) {
    process.stderr.write(
      `ui-common template: --${refused} selects Astryx's templates, which ui-common does not offer. Use \`ui-common astryx template --${refused} …\` for Astryx's command as is.\n`,
    );
    return 2;
  }
  if (values.type !== undefined && values.type !== "page" && values.type !== "block") {
    process.stderr.write("ui-common template: --type is page or block\n");
    return 2;
  }
  if (positionals.length > 2 || (values.list && positionals.length > 0)) {
    process.stderr.write(`ui-common template: too many arguments\n${TEMPLATE_HELP}`);
    return 2;
  }

  const cwd = process.cwd();
  const projectDir = findProjectDir(cwd) ?? cwd;
  const invocation = binInvocation(projectDir);
  let root;
  try {
    root = uiCommonRoot(cwd);
  } catch (err) {
    process.stderr.write(`ui-common template: ${/** @type {Error} */ (err).message}\n`);
    return 1;
  }
  const templates = await loadTemplates(root);
  const [name, path] = positionals;

  if (!name) {
    const shown = values.type ? ofType(templates, values.type) : templates;
    if (values.json) {
      printJson("template-list", {
        templates: shown.map((t) => ({
          name: t.id,
          type: t.type,
          displayName: t.displayName,
          description: t.description,
          package: UI_COMMON,
          command: scaffoldCommand(t, invocation),
        })),
      });
      return 0;
    }
    const out = [`ui-common templates (${shown.length})`];
    for (const [heading, kind] of /** @type {const} */ ([
      ["Pages", "page"],
      ["Blocks", "block"],
    ])) {
      const group = ofType(shown, kind);
      if (group.length === 0) continue;
      out.push("", heading);
      const width = Math.max(...group.map((t) => t.id.length)) + 2;
      for (const t of group)
        out.push(`  ${t.id.padEnd(width)}${summary(t.description)}`);
    }
    out.push(
      "",
      `Print one: ${invocation} template <name>`,
      `Scaffold one: ${invocation} template <name> <path>`,
      `Find one for a need: ${invocation} build "<need>"`,
    );
    process.stdout.write(`${out.join("\n")}\n`);
    return 0;
  }

  const template = templates.find((t) => t.id === name);
  if (!template) {
    process.stderr.write(
      `ui-common template: "${name}" is not a ui-common template. Astryx's templates are not offered: they import @astryxdesign/* directly.\nui-common's: ${templates.map((t) => t.id).join(", ")}\n`,
    );
    return 1;
  }
  const source = readFileSync(template.file, "utf8");

  if (!path) {
    if (values.json) {
      printJson("template", { name: template.id, type: template.type, source });
    } else {
      process.stdout.write(source);
    }
    return 0;
  }

  const target = isAbsolute(path) ? path : resolve(projectDir, path);
  const rel = relative(projectDir, target);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    process.stderr.write(
      `ui-common template: ${path} is outside the project (${projectDir})\n`,
    );
    return 1;
  }
  const file = /\.(tsx|ts|jsx|js)$/.test(extname(target))
    ? target
    : join(target, template.type === "page" ? "page.tsx" : `${template.id}.tsx`);
  if (existsSync(file) && !values.overwrite) {
    process.stderr.write(
      `ui-common template: ${relative(projectDir, file)} exists. Pass --overwrite to replace it.\n`,
    );
    return 1;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, source);
  const missing = missingDependencies(source, projectDir, root);
  if (values.json) {
    printJson("template-copy", {
      name: template.id,
      file: relative(projectDir, file),
      missingDependencies: missing,
    });
    return 0;
  }
  const out = [`Wrote ${relative(projectDir, file)} (${template.displayName}).`];
  if (missing.length > 0) {
    out.push(`Install missing dependencies: ${installCommand(projectDir, missing)}`);
  }
  process.stdout.write(`${out.join("\n")}\n`);
  return 0;
}

/** Options of `search` and `build` that take a value. */
const VALUE_OPTIONS = new Set(["--limit", "--type"]);

/** The value of `--name <v>` or `--name=<v>` in `args`. */
function optionValue(/** @type {string[]} */ args, /** @type {string} */ name) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name) return args[i + 1];
    if (args[i]?.startsWith(`${name}=`)) return args[i]?.slice(name.length + 1);
  }
  return undefined;
}

/** The positional arguments of an invocation: the command, then its words. */
export function positionalsOf(/** @type {string[]} */ args) {
  /** @type {string[]} */
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = /** @type {string} */ (args[i]);
    if (VALUE_OPTIONS.has(arg)) i++;
    else if (!arg.startsWith("-")) out.push(arg);
  }
  return out;
}

/** Whether `--type` keeps templates out of a search or build anyway. */
function excludesTemplates(/** @type {string[]} */ args) {
  const type = optionValue(args, "--type");
  return type !== undefined && type !== "template";
}

/** Astryx's own templates, as `search` and `build` report them. */
function isAstryxTemplate(/** @type {{domain?: string, package?: string}} */ item) {
  return item.domain === "template" && /^@astryxdesign\//.test(item.package ?? "");
}

/**
 * The `--limit` a search asked for (default 20), and the arguments to run it
 * with: when templates can be in the results, a limit large enough to see
 * every match, so dropping Astryx's templates does not leave the page short.
 *
 * @param {string[]} args
 */
export function searchArgs(args) {
  const given = optionValue(args, "--limit");
  const limit = given === undefined ? 20 : Number(given);
  // An invalid limit goes through as given, for Astryx to refuse.
  if (excludesTemplates(args) || !Number.isInteger(limit) || limit <= 0) {
    return { limit, args };
  }
  const rest = args.filter(
    (a, i) => a !== "--limit" && args[i - 1] !== "--limit" && !a.startsWith("--limit="),
  );
  return { limit, args: [...rest, "--limit", "1000"] };
}

/**
 * Edit the `data` of an Astryx `--json` response, or hand it back unchanged
 * when it is not one.
 *
 * @param {string} stdout
 * @param {(data: any) => void} edit
 */
function editJson(stdout, edit) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return stdout;
  }
  if (!parsed?.data || typeof parsed.data !== "object") return stdout;
  edit(parsed.data);
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

/**
 * Drop Astryx's templates from a `search` run made with `searchArgs`, and cut
 * the results back to the limit asked for. Runs on Astryx's output, before
 * it is rewritten to ui-common terms (which would relabel the package).
 *
 * @param {string} stdout
 * @param {{json: boolean, limit: number}} options
 */
export function filterSearchOutput(stdout, { json, limit }) {
  if (json) {
    return editJson(stdout, (data) => {
      if (!Array.isArray(data.results)) return;
      const kept = data.results.filter((/** @type {any} */ r) => !isAstryxTemplate(r));
      if (typeof data.matchCount === "number") {
        data.matchCount -= data.results.length - kept.length;
      }
      data.results = kept.slice(0, limit);
    });
  }
  const chunks = stdout.split(/\n{2,}/);
  const isRecord = (/** @type {string} */ c) => c.startsWith("name:");
  const records = chunks.filter(isRecord);
  if (records.length === 0) return stdout;
  const isAstryx = (/** @type {string} */ c) =>
    /^domain:\s+template$/m.test(c) && /^package:\s+@astryxdesign\//m.test(c);
  const kept = records.filter((c) => !isAstryx(c));
  const shown = new Set(kept.slice(0, limit));
  return chunks
    .filter((c) => !isRecord(c) || shown.has(c))
    .map((c) =>
      c.replace(/^(Results for .*) \((\d+)(?: of (\d+))?\)$/m, (_, head, n, total) => {
        const all = Number(total ?? n) - (records.length - kept.length);
        return shown.size < all
          ? `${head} (${shown.size} of ${all})`
          : `${head} (${all})`;
      }),
    )
    .join("\n\n");
}

/** A kit entry in the shape Astryx's `build --json` gives one. */
function kitEntry(/** @type {Template} */ t, /** @type {string} */ invocation) {
  return {
    domain: "template",
    name: t.id,
    package: UI_COMMON,
    displayName: t.displayName,
    description: t.description,
    kind: t.type,
    command: scaffoldCommand(t, invocation),
  };
}

const KIT_PAGES = 3;
const KIT_BLOCKS = 5;

/**
 * The template part of a build kit, from ui-common's templates alone.
 *
 * @param {string} query
 * @param {Template[]} templates
 */
function templateKit(query, templates) {
  const matches = matchTemplates(query, templates);
  const pages = ofType(matches, "page");
  return {
    start: pages[0] ?? null,
    alternatives: pages.slice(1, KIT_PAGES),
    blocks: ofType(matches, "block").slice(0, KIT_BLOCKS),
  };
}

/** Section headings in Astryx's build text that hold templates. */
const TEMPLATE_SECTIONS = new Set(["TEMPLATE", "OTHER TEMPLATES", "BLOCKS"]);

/**
 * Replace the template parts of a `build` run with ui-common's templates.
 * Runs on Astryx's output, before it is rewritten to ui-common terms.
 *
 * @param {string} stdout
 * @param {{json: boolean, query: string, templates: Template[], invocation: string}} options
 */
export function filterBuildOutput(stdout, { json, query, templates, invocation }) {
  const kit = templateKit(query, templates);
  if (json) {
    return editJson(stdout, (data) => {
      data.start = kit.start
        ? {
            ...kitEntry(kit.start, invocation),
            alternatives: kit.alternatives.map((t) => kitEntry(t, invocation)),
          }
        : null;
      data.pages = [kit.start, ...kit.alternatives]
        .filter((t) => t !== null)
        .map((t) => kitEntry(t, invocation));
      data.blocks = kit.blocks.map((t) => kitEntry(t, invocation));
      data.hasResults = Boolean(
        data.hasResults || data.pages.length > 0 || data.blocks.length > 0,
      );
    });
  }

  /** @type {string[]} */
  const out = [];
  let skipping = false;
  let inserted = false;
  const ours = renderKit(kit, invocation);
  for (const line of stdout.split("\n")) {
    const heading = /^[A-Z][A-Z ]+$/.test(line) ? line : null;
    const isTail = /^(frame|foundation):\s/.test(line) || /^Next step:/.test(line);
    if (heading && TEMPLATE_SECTIONS.has(heading)) {
      if (!inserted) out.push(...ours);
      inserted = true;
      skipping = true;
      continue;
    }
    if (skipping && (heading || isTail)) skipping = false;
    if (skipping) continue;
    if (!inserted && (heading || isTail)) {
      out.push(...ours);
      inserted = true;
    }
    out.push(line);
  }
  if (!inserted) out.push("", ...ours);
  return out.join("\n");
}

/**
 * ui-common's template sections, laid out as Astryx lays out a kit.
 *
 * @param {ReturnType<typeof templateKit>} kit
 * @param {string} invocation
 * @returns {string[]}
 */
function renderKit(kit, invocation) {
  const entry = (/** @type {Template} */ t) =>
    record({
      name: t.id,
      package: UI_COMMON,
      description: summary(t.description),
      command: scaffoldCommand(t, invocation),
    });
  const out = ["TEMPLATE"];
  if (kit.start) {
    out.push(
      "Scaffold it, then replace its content. Keep its layout and spacing.",
      "",
      entry(kit.start),
      "",
    );
  } else {
    out.push(
      `No ui-common page template matches. All of them: ${invocation} template --list --type page`,
      "",
    );
  }
  if (kit.alternatives.length > 0) {
    out.push(
      "OTHER TEMPLATES",
      "If the layout is wrong, scaffold one of these instead.",
      "",
    );
    for (const t of kit.alternatives) out.push(entry(t), "");
  }
  if (kit.blocks.length > 0) {
    out.push(
      "BLOCKS",
      `Ready-made sections for parts the template lacks. Print one: ${invocation} template <name>`,
      "",
    );
    for (const t of kit.blocks) out.push(entry(t), "");
  }
  return out;
}

/**
 * Apply the template filters to a passed-through `search` or `build` run.
 *
 * @param {"search"|"build"} command
 * @param {string[]} args the arguments the user gave
 * @param {string} stdout
 * @param {{invocation: string, limit: number}} options
 */
export async function filterTemplates(command, args, stdout, { invocation, limit }) {
  if (excludesTemplates(args)) return stdout;
  const json = args.includes("--json");
  if (command === "search") return filterSearchOutput(stdout, { json, limit });
  const query = positionalsOf(args).slice(1).join(" ");
  if (!query) return stdout;
  return filterBuildOutput(stdout, {
    json,
    query,
    templates: await loadTemplates(),
    invocation,
  });
}
