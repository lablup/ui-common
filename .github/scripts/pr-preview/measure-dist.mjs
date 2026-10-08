#!/usr/bin/env node
// Measure the built package: raw and gzip bytes of the JS and CSS in `dist`,
// grouped by what a consumer imports. The build preserves modules, so one file
// is not one entry; a component's group is its whole directory
// (`components/StatCard`, `forks/Drawer`), and everything else is grouped by
// its top-level directory. Run once for the PR head and once for the merge
// base; the PR comment renders the delta between the two reports.
//
// Usage: node measure-dist.mjs --dist <dir> --output <file.json>

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { gzipSync } from "node:zlib";

const getArg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

const distDir = getArg("dist");
const output = getArg("output");
if (!distDir || !output) {
  console.error("usage: measure-dist.mjs --dist <dir> --output <file.json>");
  process.exit(1);
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

/** `components/StatCard/StatCard.js` -> `components/StatCard`; `index.js` -> `index.js`. */
const groupOf = (file) => {
  const parts = file.split("/");
  if ((parts[0] === "components" || parts[0] === "forks") && parts.length > 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return parts.length > 1 ? parts[0] : file;
};

// Only what ships to a browser. Source maps and declarations do not, and the
// locale catalogs are data the consumer loads one at a time.
const groups = new Map();
for (const path of walk(distDir)) {
  const file = relative(distDir, path).split(sep).join("/");
  if (!/\.(js|css)$/.test(file) || /(^|\/)(locales|ui-common-locales)\//.test(file)) {
    continue;
  }
  const buf = readFileSync(path);
  const group = groupOf(file);
  const current = groups.get(group) ?? {
    file: group,
    bytes: 0,
    gzipBytes: 0,
    hash: createHash("sha256"),
  };
  current.bytes += buf.length;
  current.gzipBytes += gzipSync(buf, { level: 9 }).length;
  current.hash.update(file).update(buf);
  groups.set(group, current);
}

const entries = [...groups.values()]
  .map((g) => ({ ...g, hash: g.hash.digest("hex").slice(0, 12) }))
  .sort((a, b) => b.bytes - a.bytes);

writeFileSync(output, `${JSON.stringify({ entries }, null, 2)}\n`);
console.log(`Measured ${entries.length} dist group(s) -> ${output}`);
