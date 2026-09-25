/**
 * `ui-common-upgrade-report.md`: what `ui-common upgrade` changed, and what it
 * left for a person. Deterministic (no timestamps), so a report can be
 * committed and diffed between runs.
 */

/** @param {string} text */
function code(text) {
  const ticks = text.includes("`") ? "``" : "`";
  const pad = text.startsWith("`") || text.endsWith("`") ? " " : "";
  return `${ticks}${pad}${text}${pad}${ticks}`;
}

/** @param {string} text */
function escapeCell(text) {
  return text.replace(/\|/g, "\\|");
}

/**
 * @param {object} data
 * @param {string} data.from
 * @param {string} data.to
 * @param {string} data.version installed ui-common
 * @param {boolean} data.dryRun
 * @param {string[]} data.roots
 * @param {number} data.fileCount
 * @param {Array<{version: string, title: string, notes: string[]}>} data.steps
 * @param {Array<{file: string, created: boolean, transforms: string[], added: number, removed: number}>} data.changed
 * @param {{changed: boolean, notes: string[]}} data.packageJson
 * @param {Array<{file: string, line: number, text: string}>} data.todos
 * @param {Array<{category: string, file: string, line: number, text: string, detail?: string}>} data.findings
 * @param {Record<string, {title: string, help: string}>} data.categories
 * @param {Array<{file: string, transform: string, error: string}>} data.errors
 * @param {number} data.tokenReads
 */
export function renderReport(data) {
  const out = [];
  out.push("# ui-common upgrade report", "");
  out.push(
    `\`ui-common upgrade\` ${data.from} → ${data.to} (installed @lablup/ui-common ${data.version})` +
      `${data.dryRun ? ", **dry run: nothing was written**" : ""}.`,
    "",
    `Scanned ${data.fileCount} file${data.fileCount === 1 ? "" : "s"} under ${data.roots.map(code).join(", ")}.`,
    "",
  );

  const manual = data.findings.length;
  out.push("## Summary", "");
  out.push("| | Count |", "|---|---:|");
  out.push(
    `| Files ${data.dryRun ? "that would change" : "changed"} | ${data.changed.length} |`,
  );
  out.push(
    `| package.json ${data.dryRun ? "would change" : "changed"} | ${data.packageJson.changed ? "yes" : "no"} |`,
  );
  out.push(`| TODO markers left in code | ${data.todos.length} |`);
  out.push(`| Manual-review findings | ${manual} |`);
  if (data.errors.length > 0)
    out.push(`| Files the codemods could not transform | ${data.errors.length} |`);
  out.push("");

  out.push("## Steps", "");
  for (const step of data.steps) out.push(`- ${step.version}: ${step.title}`);
  out.push("");

  if (data.errors.length > 0) {
    out.push(
      "## Errors",
      "",
      "These files were left as they were. Migrate them by hand.",
      "",
    );
    for (const e of data.errors)
      out.push(`- ${code(e.file)} (${e.transform}): ${e.error}`);
    out.push("");
  }

  out.push(`## ${data.dryRun ? "Files that would change" : "Changed files"}`, "");
  if (data.changed.length === 0) out.push("None.");
  for (const c of data.changed) {
    out.push(
      `- ${code(c.file)}${c.created ? " (new)" : ""}: +${c.added} −${c.removed}, ${c.transforms.join(", ")}`,
    );
  }
  out.push("");

  out.push("## package.json", "");
  if (data.packageJson.notes.length === 0) out.push("No change.");
  for (const note of data.packageJson.notes) out.push(`- ${note}`);
  out.push("");

  out.push("## Manual review", "");
  out.push(`### TODO markers (${data.todos.length})`, "");
  if (data.todos.length === 0) {
    out.push("None.", "");
  } else {
    out.push(
      "Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.",
      "",
    );
    for (const t of data.todos) out.push(`- ${code(`${t.file}:${t.line}`)} ${t.text}`);
    out.push("");
  }

  const byCategory = new Map();
  for (const f of data.findings) {
    const list = byCategory.get(f.category) ?? [];
    list.push(f);
    byCategory.set(f.category, list);
  }
  for (const [category, meta] of Object.entries(data.categories)) {
    const list = byCategory.get(category) ?? [];
    out.push(`### ${meta.title} (${list.length})`, "");
    if (list.length === 0) {
      out.push("None.", "");
      continue;
    }
    out.push(meta.help, "");
    out.push("| Where | What | Detail |", "|---|---|---|");
    for (const f of list) {
      out.push(
        `| ${code(`${f.file}:${f.line}`)} | ${escapeCell(code(f.text.length > 120 ? `${f.text.slice(0, 117)}...` : f.text))} | ${escapeCell(f.detail ?? "")} |`,
      );
    }
    out.push("");
  }

  const notes = data.steps.flatMap((s) => s.notes);
  if (notes.length > 0 || data.tokenReads > 0) {
    out.push("## Notes", "");
    for (const note of notes) out.push(`- ${note}`);
    if (data.tokenReads > 0) {
      out.push(
        `- ${data.tokenReads} \`var(--token-*)\` read${data.tokenReads === 1 ? "" : "s"} left as they are. \`@lablup/ui-common/legacy-tokens.css\` declares the 0.1 names (deprecated, removed in 0.3).`,
      );
    }
    out.push("");
  }

  return `${out.join("\n").replace(/\n+$/, "")}\n`;
}
