#!/usr/bin/env node
/**
 * Packed-artifact guard.
 *
 * `files` allowlists drift quietly: a new directory gets added, nobody
 * re-inspects the tarball, and internal sources or fixtures ship to consumers.
 * This packs the real tarball, asserts nothing unexpected is inside it, and
 * asserts every path the exports map advertises actually resolves to a packed
 * file, so a broken subpath is caught here rather than by a consumer.
 *
 * It also asserts the converse, which is how 0.1.0-alpha.0 shipped every
 * component unstyled: each of the 20 emitted stylesheets was packed, imported
 * by nothing, and named by no exports entry, so a consumer had no supported
 * way to load it. Checking that advertised paths resolve says nothing about
 * files that arrive advertised by no one.
 */
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  dirname as posixDirname,
  join as posixJoin,
  normalize as posixNormalize,
} from "node:path/posix";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const FORBIDDEN_IN_TARBALL = [
  { pattern: /(^|\/)src\//, reason: "package source must not ship" },
  { pattern: /\.test\.[jt]sx?$/, reason: "tests must not ship" },
  { pattern: /(^|\/)test\//, reason: "test harness must not ship" },
  { pattern: /(^|\/)fixture\//, reason: "the install fixture must not ship" },
  { pattern: /(^|\/)scripts\//, reason: "repository scripts must not ship" },
  { pattern: /(^|\/)\.github\//, reason: "workflows must not ship" },
  { pattern: /\.env/, reason: "environment files must never ship" },
  { pattern: /\.npmrc$/, reason: "registry credentials must never ship" },
  {
    pattern: /(^|\/)node_modules\//,
    reason:
      "a dependency got bundled into dist instead of being resolved at the consumer. " +
      "Check rollupOptions.external in vite.config.ts: a bare specifier that is not " +
      "external gets vendored, which ships a second copy of a package the consumer " +
      "already installs and lets the two drift apart",
  },
];

function packFileList() {
  const raw = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const parsed = JSON.parse(raw);
  return parsed[0].files.map((f) => f.path);
}

const packed = packFileList();
const failures = [];

for (const file of packed) {
  for (const { pattern, reason } of FORBIDDEN_IN_TARBALL) {
    if (pattern.test(file)) failures.push(`unexpected file "${file}": ${reason}`);
  }
}

const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const packedSet = new Set(packed);

/** Turn an exports target into a predicate over packed file paths. */
function targetMatcher(target) {
  const clean = target.replace(/^\.\//, "");

  if (!clean.includes("*")) return (file) => file === clean;

  const pattern = new RegExp(
    "^" +
      clean
        .split("*")
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".+") +
      "$",
  );
  return (file) => pattern.test(file);
}

function assertResolves(target, subpath) {
  const clean = target.replace(/^\.\//, "");
  const matches = targetMatcher(target);

  if (!clean.includes("*")) {
    if (!packedSet.has(clean)) {
      failures.push(`exports["${subpath}"] points at "${clean}", which is not packed`);
    }
    return;
  }

  if (!packed.some(matches)) {
    failures.push(`exports["${subpath}"] pattern "${clean}" matches nothing packed`);
  }
}

const exportedMatchers = [];

for (const [subpath, target] of Object.entries(pkg.exports ?? {})) {
  if (subpath === "./package.json") continue;
  if (typeof target === "string") {
    assertResolves(target, subpath);
    exportedMatchers.push(targetMatcher(target));
  } else {
    for (const value of Object.values(target)) {
      assertResolves(value, subpath);
      exportedMatchers.push(targetMatcher(value));
    }
  }
}

/**
 * Every packed stylesheet has to be loadable. A component's CSS is loadable
 * because the chunk that owns it imports it (see `linkComponentStyles` in
 * vite.config.ts); a token or theme stylesheet is loadable because the exports
 * map names it and a consumer imports it directly. A stylesheet that is
 * neither reaches nobody, and the build stays green while every rule in it
 * goes missing at the consumer.
 */
const importedStylesheets = new Set();

for (const file of packed.filter((f) => f.endsWith(".js"))) {
  const code = await readFile(resolve(root, file), "utf8");
  for (const [, specifier] of code.matchAll(/\bimport\s*["']([^"']+\.css)["']/g)) {
    if (!specifier.startsWith(".")) continue; // resolved at the consumer
    importedStylesheets.add(posixNormalize(posixJoin(posixDirname(file), specifier)));
  }
}

for (const stylesheet of packed.filter((f) => f.endsWith(".css"))) {
  if (importedStylesheets.has(stylesheet)) continue;
  if (exportedMatchers.some((matches) => matches(stylesheet))) continue;
  failures.push(
    `"${stylesheet}" is packed but unreachable: no packed module imports it and no ` +
      `exports entry names it, so a consumer cannot load its rules`,
  );
}

/**
 * Every bare specifier a packed module imports has to be something the
 * consumer is guaranteed to install: a dependency or a peer. Astryx and
 * StyleX are external on purpose, so a missing declaration does not fail the
 * build; it fails at the consumer, as an unresolvable import, and only for
 * the subpath that happens to reach it.
 */
const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]);

function packageOf(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

const bareImport =
  /(?:\bimport\s*(?:[\w*{}\s,$]+\s*from\s*)?|\bexport\s*[\w*{}\s,$]+\s*from\s*|\bimport\s*\()\s*["']([^"'./][^"']*)["']/g;

for (const file of packed.filter((f) => f.endsWith(".js"))) {
  const code = await readFile(resolve(root, file), "utf8");
  for (const [, specifier] of code.matchAll(bareImport)) {
    if (specifier.startsWith("node:")) continue;
    const name = packageOf(specifier);
    if (!declared.has(name)) {
      failures.push(
        `"${file}" imports "${specifier}", but "${name}" is neither a dependency nor a ` +
          `peer, so a consumer is not guaranteed to have it`,
      );
    }
  }
}

/**
 * `locales/*.json` mirrors Astryx core's catalogs. A pattern export only has
 * to match one file to pass the check above, so compare the whole set.
 */
const coreLocales = (
  await readdir(resolve(root, "node_modules/@astryxdesign/core/locales"))
).filter((f) => f.endsWith(".json"));
for (const locale of coreLocales) {
  if (!packedSet.has(`dist/locales/${locale}`)) {
    failures.push(
      `Astryx locale "${locale}" is not mirrored at dist/locales/${locale}`,
    );
  }
}

if (failures.length > 0) {
  console.error(`Packed artifact check failed (${failures.length}):\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\nPacked ${packed.length} file(s).`);
  process.exit(1);
}

console.log(
  `Packed artifact clean: ${packed.length} file(s), ` +
    `${Object.keys(pkg.exports ?? {}).length} export path(s) resolve.`,
);
