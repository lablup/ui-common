#!/usr/bin/env node
// Work out which components a PR changed, and map each one onto the story
// entries that Storybook actually built for it. The mapping is read out of the
// built `index.json` rather than guessed, so a component whose stories live
// under a different title still resolves.
//
// A component here is a directory: `src/components/<Name>/` for ui-common's
// own components, `src/forks/<Name>/` for its copies of Astryx components. Any
// file inside it (source, stylesheet, messages, stories) counts as a change to
// that component; tests alone do not, since they change nothing to look at.
//
// Usage:
//   node analyze-pr.mjs --base origin/main --head HEAD \
//     --storybook-index <storybook-static/index.json> --output analysis.json

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const COMPONENT_DIR_RE = /^src\/(components|forks)\/([^/]+)\//;

const {
  values: { base, head, "storybook-index": indexPath, output },
} = parseArgs({
  options: {
    base: { type: "string", default: "origin/main" },
    head: { type: "string", default: "HEAD" },
    "storybook-index": { type: "string" },
    output: { type: "string", default: "analysis.json" },
  },
});

const git = (args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

// A three-dot diff reports only what the PR branch changed, ignoring commits
// that landed on base meanwhile — that is the list we want. It needs a merge
// base, which a shallow clone may not have once base has advanced past the
// fetch window; deepen and retry before degrading. The two-dot fallback needs
// no merge base but compares two trees, so it can both over-report base churn
// and under-report a change that also exists on base. Callers get `diffMode` so
// the report can say when the list is approximate.
function changedFiles() {
  // `--name-status` so a newly ADDED component can be told apart from a
  // modified one; the report only flags missing stories for the former.
  const parse = (raw) =>
    raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [status, ...rest] = line.split("\t");
        // Renames are `R100\told\tnew` — the new path is what we care about.
        return { status: status[0], file: rest[rest.length - 1] };
      });

  const threeDot = () => parse(git(["diff", "--name-status", `${base}...${head}`]));

  try {
    return { files: threeDot(), diffMode: "three-dot" };
  } catch {
    /* fall through to the deepen retry */
  }

  try {
    const bareBase = base.replace(/^origin\//, "");
    git([
      "fetch",
      "--deepen=200",
      "origin",
      `+refs/heads/${bareBase}:refs/remotes/origin/${bareBase}`,
    ]);
    return { files: threeDot(), diffMode: "three-dot" };
  } catch {
    /* fall through to the two-dot fallback */
  }

  try {
    return {
      files: parse(git(["diff", "--name-status", `${base}..${head}`])),
      diffMode: "two-dot",
    };
  } catch (error) {
    // A failed diff is not the same as "nothing changed" — publishing an empty
    // analysis here would look legitimate and silently drop the whole report.
    console.error(`::error::Could not diff ${base}..${head}: ${error.message}`);
    process.exit(1);
  }
}

const isStory = (file) => /\.stories\.(ts|tsx)$/.test(file);
const isTest = (file) => /\.test\.(ts|tsx)$/.test(file);

function loadStoryEntries() {
  if (!indexPath || !existsSync(indexPath)) return [];
  const parsed = JSON.parse(readFileSync(indexPath, "utf8"));
  return Object.values(parsed.entries ?? {});
}

/**
 * The stories built for one component directory, one link per story title
 * (a directory such as `Skeleton/` can hold several components, each with its
 * own stories file). The autodocs page comes first — it shows every story of
 * the component on one page, which is what a reviewer wants first.
 */
function linksFor(dir, storyEntries) {
  const byTitle = new Map();
  for (const entry of storyEntries) {
    if (!entry.importPath?.startsWith(`./${dir}`)) continue;
    const list = byTitle.get(entry.title) ?? [];
    list.push(entry);
    byTitle.set(entry.title, list);
  }
  return [...byTitle.entries()]
    .map(([title, entries]) => {
      const preferred = entries.find((e) => e.type === "docs") ?? entries[0];
      return {
        title,
        storyCount: entries.filter((e) => e.type === "story").length,
        deepLink: `?path=/${preferred.type}/${preferred.id}`,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

const { files, diffMode } = changedFiles();
const storyEntries = loadStoryEntries();

// One row per changed component directory.
const rows = new Map();
const accounted = new Set();

for (const { status, file } of files) {
  const match = COMPONENT_DIR_RE.exec(file);
  if (!match || isTest(file)) continue;
  const [dir, kind, name] = match;
  accounted.add(file);

  let row = rows.get(dir);
  if (!row) {
    const links = linksFor(dir, storyEntries);
    row = {
      name,
      kind,
      dir,
      links,
      hasStories: links.length > 0,
      storyCount: links.reduce((n, l) => n + l.storyCount, 0),
      sourceChanged: false,
      storiesChanged: false,
      isNew: false,
    };
    rows.set(dir, row);
  }

  if (isStory(file)) {
    row.storiesChanged = true;
  } else {
    row.sourceChanged = true;
    // A directory whose barrel was added in this PR is a new component.
    if (status === "A" && file === `${dir}index.ts`) row.isNew = true;
  }
}

const components = [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));

const analysis = {
  diffMode,
  base,
  // A hook, theme or i18n change still deploys a preview; the report says so
  // rather than pretending nothing happened.
  otherSourceFiles: files
    .map(({ file }) => file)
    .filter((f) => f.startsWith("src/") && !accounted.has(f) && !isTest(f)),
  components,
  summary: {
    // Only NEW components are counted as a gap. Most existing components
    // have no story yet, and nagging about them on every unrelated edit trains
    // reviewers to ignore the report.
    newWithoutStories: components.filter((c) => c.isNew && !c.hasStories).length,
  },
};

writeFileSync(output, `${JSON.stringify(analysis, null, 2)}\n`);
console.log(
  `Analyzed ${files.length} changed files (${diffMode}); ` +
    `${components.length} component(s) changed, ` +
    `${analysis.summary.newWithoutStories} new one(s) without stories.`,
);
