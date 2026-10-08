#!/usr/bin/env node
// Render the "PR Analysis Report" comment body from the artifacts CI produced.
// Writes markdown to stdout; the calling workflow posts or updates it.
//
// Usage:
//   node generate-pr-comment.mjs --meta pr-meta.json --analysis analysis.json \
//     [--bundle-head bundle-head.json] [--bundle-base bundle-base.json]

import { existsSync, readFileSync } from "node:fs";

const getArg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

const readJson = (path) =>
  path && existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;

const analysis = readJson(getArg("analysis"));
const meta = readJson(getArg("meta"));
const bundleHead = readJson(getArg("bundle-head"));
const bundleBase = readJson(getArg("bundle-base"));

if (!meta) {
  console.error("Missing pr-meta.json");
  process.exit(1);
}
if (!analysis) {
  console.error("Missing analysis.json — nothing to report");
  process.exit(1);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
const signed = (bytes) =>
  `${bytes > 0 ? "+" : bytes < 0 ? "−" : "±"}${kb(Math.abs(bytes))}`;

const link = (text, href) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

// Story titles come from the PR's own tree, so they are escaped before they
// reach the Markdown.
const escapeText = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])
    .replace(/([\\`*_[\]|~])/g, "\\$1")
    .trim()
    .slice(0, 120);

const out = [];
out.push("## PR Analysis Report");
out.push("");

// ── Storybook preview ────────────────────────────────────────────────────────
out.push("### 📚 Storybook Preview");
out.push("");
if (meta.storybookUrl) {
  out.push(`**${link("View Storybook for this PR", meta.storybookUrl)}**`);
  out.push("");
  out.push("_GitHub Pages may take up to a minute to hydrate after the deploy._");
} else {
  out.push("_No preview was deployed for this run._");
}
out.push("");

// ── Changed components ───────────────────────────────────────────────────────
out.push("### 🧩 Changed Components");
out.push("");
// The table is the actionable part, so it holds only the components a reviewer
// can actually open. Everything else goes below it, out of the way — a wall of
// "no story, nothing to open" rows is what makes a report like this get ignored.
const previewable = analysis.components.filter(
  (c) => c.links.length > 0 && meta.storybookUrl,
);
const unpreviewable = analysis.components.filter(
  (c) => c.links.length === 0 || !meta.storybookUrl,
);
const MAX_ROWS = 30;

// `components/Drawer` would read the same as `forks/Drawer`; name the kind only
// when a PR touches both.
const nameCounts = new Map();
for (const c of analysis.components) {
  nameCounts.set(c.name, (nameCounts.get(c.name) ?? 0) + 1);
}
const label = (c) => (nameCounts.get(c.name) === 1 ? c.name : `${c.kind}/${c.name}`);

if (analysis.components.length === 0) {
  out.push("_No files changed under `src/components/` or `src/forks/`._");
} else if (previewable.length === 0) {
  out.push(
    `_${analysis.components.length} component(s) changed, none of which has a ` +
      "`*.stories.tsx` — nothing to open in the preview._",
  );
} else {
  out.push("| Component | Changed | Stories | Open |");
  out.push("|---|---|---|---|");
  for (const c of previewable.slice(0, MAX_ROWS)) {
    const changed = [
      c.isNew ? "new" : c.sourceChanged && "source",
      c.storiesChanged && "stories",
    ]
      .filter(Boolean)
      .join(" + ");
    // One link per stories file in the directory, named by its story title
    // when there is more than one.
    const open = c.links
      .map((l) =>
        link(
          c.links.length === 1 ? "Storybook ↗" : `${escapeText(l.title)} ↗`,
          `${meta.storybookUrl}${l.deepLink}`,
        ),
      )
      .join("<br>");
    out.push(`| \`${label(c)}\` | ${changed} | ${c.storyCount} | ${open} |`);
  }
  if (previewable.length > MAX_ROWS) {
    out.push(`| _…and ${previewable.length - MAX_ROWS} more_ | | | |`);
  }
}
out.push("");

if (analysis.summary.newWithoutStories > 0) {
  const names = analysis.components
    .filter((c) => c.isNew && !c.hasStories)
    .map((c) => `\`${label(c)}\``)
    .join(", ");
  out.push(
    `> ⚠️ New component(s) without a \`*.stories.tsx\`: ${names}. They cannot appear ` +
      "in the preview, and a story is the cheapest way to make a new component " +
      "reviewable.",
  );
  out.push("");
}

if (unpreviewable.length > 0) {
  out.push(
    `<details><summary>${unpreviewable.length} changed component(s) with no story ` +
      "to open</summary>",
  );
  out.push("");
  for (const c of unpreviewable) out.push(`- \`${label(c)}\` — \`${c.dir}\``);
  out.push("");
  out.push("</details>");
  out.push("");
}

if (analysis.otherSourceFiles.length > 0) {
  const shown = analysis.otherSourceFiles.slice(0, 10);
  out.push(
    `<details><summary>${analysis.otherSourceFiles.length} other changed file(s) in ` +
      "<code>src/</code></summary>",
  );
  out.push("");
  for (const f of shown) out.push(`- \`${f}\``);
  if (analysis.otherSourceFiles.length > shown.length) {
    out.push(`- …and ${analysis.otherSourceFiles.length - shown.length} more`);
  }
  out.push("");
  out.push("</details>");
  out.push("");
}

// ── Bundle size ──────────────────────────────────────────────────────────────
out.push("### 📦 Bundle Size");
out.push("");
if (!bundleHead) {
  out.push("_Bundle was not measured for this run._");
} else {
  const totalHead = bundleHead.entries.reduce((n, e) => n + e.gzipBytes, 0);
  if (bundleBase) {
    const baseByFile = new Map(bundleBase.entries.map((e) => [e.file, e]));
    const headFiles = new Set(bundleHead.entries.map((e) => e.file));
    // Only what moved. With every module its own file, an unchanged group is
    // byte-identical and its row says nothing.
    const changed = [
      ...bundleHead.entries
        .filter((e) => baseByFile.get(e.file)?.hash !== e.hash)
        .map((e) => ({ file: e.file, head: e, prev: baseByFile.get(e.file) })),
      ...bundleBase.entries
        .filter((e) => !headFiles.has(e.file))
        .map((e) => ({ file: e.file, head: null, prev: e })),
    ];
    const totalBase = bundleBase.entries.reduce((n, e) => n + e.gzipBytes, 0);
    if (changed.length === 0) {
      out.push("_No change to the built JS or CSS._");
    } else {
      out.push("| Group | Gzip | Δ Gzip vs base |");
      out.push("|---|---|---|");
      for (const { file, head, prev } of changed.slice(0, MAX_ROWS)) {
        const delta = !prev
          ? "🆕 new"
          : !head
            ? "🗑️ removed"
            : signed(head.gzipBytes - prev.gzipBytes);
        out.push(`| \`${file}\` | ${head ? kb(head.gzipBytes) : "—"} | ${delta} |`);
      }
      if (changed.length > MAX_ROWS) {
        out.push(`| _…and ${changed.length - MAX_ROWS} more_ | | |`);
      }
    }
    out.push("");
    out.push(
      `**Total gzip (JS + CSS):** ${kb(totalHead)} (${signed(totalHead - totalBase)} vs \`${analysis.base}\`)`,
    );
  } else {
    out.push(`**Total gzip (JS + CSS):** ${kb(totalHead)}`);
    out.push("");
    out.push(
      "_No base measurement — the merge-base build was skipped " +
        "(a build input outside `src/` changed, or the base build failed)._",
    );
  }
}
out.push("");

if (analysis.diffMode === "two-dot") {
  out.push(
    "> ℹ️ The changed-file list came from a two-dot diff (no merge base was " +
      "reachable in the shallow clone), so it may over- or under-report.",
  );
  out.push("");
}

out.push("---");
out.push("");
out.push(
  `<sub>Generated by the PR Preview workflow for \`${meta.shortHash}\` · ${
    meta.storybookUrl ? `${link("Storybook", meta.storybookUrl)} · ` : ""
  }${link("CI run", meta.runUrl)}</sub>`,
);

console.log(out.join("\n"));
