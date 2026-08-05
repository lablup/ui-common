#!/usr/bin/env node
/**
 * Public boundary guard.
 *
 * The package promises three things a reader cannot verify by eye once the
 * source grows: it never reaches back into a product, it never depends on the
 * private AI package, and it never resolves user-facing text itself. Each one
 * is a grep away from being broken by a well-meaning import, so CI checks them
 * on every push rather than at review time.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";

import { globSync } from "tinyglobby";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const FORBIDDEN = [
  {
    pattern: /@lablup\/ui-ai/,
    reason:
      "the public package must never import, re-export, or test against the private package",
  },
  {
    pattern: /from\s+["']@\//,
    reason: "product path aliases do not exist outside the source product",
  },
  {
    pattern: /["']react-i18next["']|\bi18next\b/,
    reason:
      "user-facing strings are supplied by the consumer as props, not resolved from a product locale bundle",
  },
  {
    pattern: /@tauri-apps\//,
    reason: "the package must not depend on the desktop shell",
  },
  {
    pattern: /\bzustand\b/,
    reason: "product state stays with the consumer",
  },
  {
    pattern: /from\s+["'](\.\.\/){3,}/,
    reason: "an import escaping three levels up is reaching outside src/",
  },
];

const files = globSync("src/**/*.{ts,tsx,css}", { cwd: root, absolute: true });
const violations = [];

for (const file of files) {
  const contents = await readFile(file, "utf8");
  const lines = contents.split("\n");

  lines.forEach((line, index) => {
    if (line.trimStart().startsWith("*") || line.trimStart().startsWith("//")) return;

    for (const { pattern, reason } of FORBIDDEN) {
      if (pattern.test(line)) {
        violations.push({
          file: relative(root, file),
          line: index + 1,
          text: line.trim(),
          reason,
        });
      }
    }
  });
}

/**
 * Disclosure guard.
 *
 * This repository is published publicly, so a reference to a private repository
 * or an unannounced product is a leak, not a broken link. The first import
 * shipped a README hyperlink straight into a private repository's issue, and a
 * scan for credentials, hostnames and IP ranges did not see it, because none of
 * those is what a leak looks like here.
 *
 * Comments are checked too: the CSS token file ships inside the tarball, so an
 * explanatory comment naming an internal product travels to every consumer.
 */
/**
 * Deliberately an allowlist, not a blocklist of private names.
 *
 * A blocklist has to spell out the things it protects, so the guard itself
 * becomes the leak: the first version of this file named three internal
 * products in a regex and was the last place they survived. Naming what is
 * public instead means this file discloses nothing, and a repository that has
 * not been added here fails closed rather than slipping through because nobody
 * remembered to blocklist it.
 */
// Public repositories, plus the sibling package name that the boundary rules
// above have to spell out in order to forbid it. Anything absent fails closed.
const ALLOWED_LABLUP_REFERENCES = ["all-smi", "backend.ai", "ui-common", "ui-ai"];

const DISCLOSURE = [
  {
    pattern: new RegExp(
      String.raw`lablup/(?!(?:${ALLOWED_LABLUP_REFERENCES.join("|").replace(/\./g, String.raw`\.`)})(?![\w.-]))[\w.-]+`,
      "i",
    ),
    reason: "references a Lablup repository that is not public",
  },
  {
    // A product family name followed by a capitalised qualifier is an edition
    // that has not been announced. The bare family name, its design system, and
    // the public WebUI are fine.
    pattern: /Backend\.AI\s+(?!WebUI\b|Design\b)[A-Z][\w]+|Continuum\s+[A-Z][\w]+/,
    reason: "names an unannounced product edition",
  },
];

const docFiles = globSync(["*.md", "NOTICE", ".github/**/*.yml"], {
  cwd: root,
  absolute: true,
});

for (const file of [...files, ...docFiles]) {
  const contents = await readFile(file, "utf8");
  contents.split("\n").forEach((line, index) => {
    for (const { pattern, reason } of DISCLOSURE) {
      if (pattern.test(line)) {
        violations.push({
          file: relative(root, file),
          line: index + 1,
          text: line.trim(),
          reason: `${reason}; this repository is published publicly`,
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`Public boundary violated in ${violations.length} place(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.text}`);
    console.error(`    ${v.reason}\n`);
  }
  process.exit(1);
}

console.log(`Public boundary clean across ${files.length} file(s).`);
