#!/usr/bin/env node
// Regenerate the gh-pages landing page from whatever `storybook/` (main, from
// storybook.yml) and `pr/<n>/` directories are currently on disk. Every job
// that changes the tree calls this, so the index never claims a build that is
// gone.
//
// Usage: node write-index.mjs --root <gh-pages checkout>

import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const {
  values: { root },
} = parseArgs({ options: { root: { type: "string" } } });
if (!root) {
  console.error("usage: write-index.mjs --root <dir>");
  process.exit(1);
}

const prRoot = join(root, "pr");
const isDir = (path) => existsSync(path) && statSync(path).isDirectory();

const previews = isDir(prRoot)
  ? readdirSync(prRoot)
      .filter((name) => /^\d+$/.test(name))
      .filter((name) => isDir(join(prRoot, name, "storybook")))
      .map(Number)
      .sort((a, b) => b - a)
  : [];

const hasMain = isDir(join(root, "storybook"));

const items = previews
  .map(
    (n) =>
      `      <li>PR #${n} — <a href="./pr/${n}/storybook/">Storybook</a> ` +
      `<a class="src" href="https://github.com/lablup/ui-common/pull/${n}">source ↗</a></li>`,
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>ui-common — Storybook</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        font: 16px/1.6 ui-sans-serif, system-ui, sans-serif;
        margin: 0 auto; max-width: 42rem; padding: 3rem 1.5rem;
      }
      h1 { font-size: 1.4rem; margin-bottom: .25rem; }
      h2 { font-size: 1.1rem; margin: 2rem 0 .25rem; }
      p { color: color-mix(in srgb, currentColor 65%, transparent); margin-top: 0; }
      ul { padding-left: 1.1rem; }
      li { margin: .3rem 0; }
      .src { font-size: .8em; opacity: .6; margin-left: .5rem; }
    </style>
  </head>
  <body>
    <h1>ui-common — Storybook</h1>
${hasMain ? `    <p><a href="./storybook/">Storybook for main</a>, rebuilt on every merge.</p>\n` : ""}    <h2>PR previews</h2>
    <p>
      One Storybook build per open pull request that changed it. Previews are
      removed when their PR is merged or closed.
    </p>
${previews.length > 0 ? `    <ul>\n${items}\n    </ul>` : "    <p>No live previews right now.</p>"}
  </body>
</html>
`;

writeFileSync(join(root, "index.html"), html);
console.log(
  `Wrote index.html listing ${hasMain ? "main and " : ""}${previews.length} preview(s).`,
);
