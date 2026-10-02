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
 *
 * Two tarballs come out of this repository, at one version: the library
 * (@lablup/ui-common, the root) and its command line (@lablup/ui-common-cli,
 * packages/cli). Both are packed with pnpm, as the publish workflow packs
 * them, so the manifests checked are the published ones, with `workspace:`
 * ranges already rewritten. The library must carry none of the CLI; the CLI
 * must carry nothing of the library's build.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { builtinModules } from "node:module";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import {
  dirname as posixDirname,
  join as posixJoin,
  normalize as posixNormalize,
} from "node:path/posix";

import { LAYER_ORDER_STATEMENT, startsWithLayerOrder } from "./layer-order.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliRoot = resolve(root, "packages/cli");

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

/** What only the CLI package ships. */
const CLI_ONLY = [
  {
    pattern: /^(bin|cli|codemods|migration|skill)\//,
    reason: "the CLI ships in @lablup/ui-common-cli",
  },
];
/** The CLI's toolchain, which must stay out of a consumer's production install. */
const CLI_DEPENDENCIES = [
  "@astryxdesign/cli",
  "jscodeshift",
  "postcss",
  "postcss-selector-parser",
];

const scratch = mkdtempSync(join(tmpdir(), "uic-check-pack-"));
process.on("exit", () => rmSync(scratch, { recursive: true, force: true }));

/**
 * Pack `dir` with pnpm and return the packed paths and the packed manifest.
 *
 * @param {string} dir
 */
function pack(dir) {
  const raw = execFileSync("pnpm", ["pack", "--pack-destination", scratch, "--json"], {
    cwd: dir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const parsed = JSON.parse(raw);
  const manifest = JSON.parse(
    execFileSync("tar", ["-xzOf", parsed.filename, "package/package.json"], {
      encoding: "utf8",
    }),
  );
  return { files: parsed.files.map((f) => f.path), manifest };
}

const failures = [];

const { files: packed, manifest: pkg } = pack(root);

for (const file of packed) {
  for (const { pattern, reason } of [...FORBIDDEN_IN_TARBALL, ...CLI_ONLY]) {
    if (pattern.test(file)) failures.push(`unexpected file "${file}": ${reason}`);
  }
}
if (pkg.bin)
  failures.push(
    `@lablup/ui-common declares a bin; it belongs to @lablup/ui-common-cli`,
  );
for (const name of CLI_DEPENDENCIES) {
  if (pkg.dependencies?.[name]) {
    failures.push(
      `@lablup/ui-common depends on "${name}", which only the CLI needs; it belongs to @lablup/ui-common-cli`,
    );
  }
}

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
 * Every packed stylesheet opens with the full cascade layer order. A layer's
 * position is fixed by the first sheet that names it, and a consumer usually
 * loads a component's sheet (through its module) before its own entry
 * stylesheet, so a packed sheet that opens `@layer ui-common{…}` first makes
 * ui-common the lowest layer, below Astryx's base and theme. The build
 * prepends the statement (`prependLayerOrder` in vite.config.ts).
 */
for (const stylesheet of packed.filter((f) => f.endsWith(".css"))) {
  const css = await readFile(resolve(root, stylesheet), "utf8");
  if (!startsWithLayerOrder(css)) {
    failures.push(
      `"${stylesheet}" does not start with "${LAYER_ORDER_STATEMENT}", so loaded ` +
        `before the app's own order statement it can reorder the cascade layers`,
    );
  }
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

/**
 * Third-party code that ships inside dist carries its licence with it. The MIT
 * licence asks for its copyright line and permission notice in every copy, so
 * both have to be in a packed file, not just in the repository.
 */
const THIRD_PARTY_NOTICES = [
  {
    what: "Ant Design Icons path data (src/components/Form/feedbackIcons.tsx)",
    file: "NOTICE",
    mustContain: [
      "Copyright (c) 2018-present Ant UED, https://xtech.antfin.com/",
      "Permission is hereby granted, free of charge, to any person obtaining",
      "The above copyright notice and this permission notice shall be\nincluded in all copies or substantial portions of the Software.",
    ],
  },
  {
    what: "Astryx source in the forks (src/forks/, dist/forks/)",
    file: "NOTICE",
    mustContain: [
      "Copyright (c) 2026 Meta Platforms, Inc.",
      "Permission is hereby granted, free of charge, to any person obtaining a copy",
      "The above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.",
    ],
  },
];

for (const { what, file, mustContain } of THIRD_PARTY_NOTICES) {
  if (!packedSet.has(file)) {
    failures.push(`${what}: its licence lives in "${file}", which is not packed`);
    continue;
  }
  const text = await readFile(resolve(root, file), "utf8");
  for (const line of mustContain) {
    if (!text.includes(line)) {
      failures.push(
        `${what}: "${file}" lacks the licence text "${line.split("\n")[0]}"`,
      );
    }
  }
}

/**
 * The CLI tarball: its bin, its modules and the data they read, nothing of the
 * library's build, and a manifest a consumer can install next to the library.
 */
const { files: cliPacked, manifest: cliPkg } = pack(cliRoot);
const cliPackedSet = new Set(cliPacked);

for (const file of cliPacked) {
  for (const { pattern, reason } of [
    ...FORBIDDEN_IN_TARBALL,
    { pattern: /^dist\//, reason: "the library's build ships in @lablup/ui-common" },
  ]) {
    if (pattern.test(file)) failures.push(`unexpected CLI file "${file}": ${reason}`);
  }
}
for (const required of [
  "migration/0.1-to-0.2.json",
  "codemods/registry.mjs",
  "cli/main.mjs",
  "skill/ui-common-adopt/SKILL.md",
  "LICENSE",
  "NOTICE",
]) {
  if (!cliPackedSet.has(required)) failures.push(`the CLI tarball lacks "${required}"`);
}
const cliBin = cliPkg.bin?.["ui-common"]?.replace(/^\.\//, "");
if (!cliBin) failures.push(`@lablup/ui-common-cli declares no "ui-common" bin`);
else if (!cliPackedSet.has(cliBin))
  failures.push(`the "ui-common" bin "${cliBin}" is not packed`);
if (cliPkg.version !== pkg.version) {
  failures.push(
    `@lablup/ui-common-cli is ${cliPkg.version} but @lablup/ui-common is ${pkg.version}; they are released in lockstep`,
  );
}
const cliPeer = cliPkg.peerDependencies?.["@lablup/ui-common"];
if (cliPeer !== pkg.version) {
  failures.push(
    `@lablup/ui-common-cli's @lablup/ui-common peer is "${cliPeer}", not exactly ${pkg.version}`,
  );
}
for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
  for (const [name, range] of Object.entries(cliPkg[field] ?? {})) {
    if (String(range).startsWith("workspace:"))
      failures.push(`@lablup/ui-common-cli ${field}["${name}"] is still "${range}"`);
  }
}

// Every import in a packed module resolves: a relative one to a packed file,
// a bare one to a dependency or peer the consumer is guaranteed to install.
const cliDeclared = new Set([
  ...Object.keys(cliPkg.dependencies ?? {}),
  ...Object.keys(cliPkg.peerDependencies ?? {}),
]);
const builtins = new Set(builtinModules);
const anyImport =
  /(?:\bimport\s*(?:[\w*{}\s,$]+\s*from\s*)?|\bexport\s*[\w*{}\s,$]+\s*from\s*|\bimport\s*\()\s*["']([.@\w][\w@./:-]*)["']/g;
for (const file of cliPacked.filter((f) => f.endsWith(".mjs"))) {
  const code = await readFile(resolve(cliRoot, file), "utf8");
  for (const [, specifier] of code.matchAll(anyImport)) {
    if (specifier.startsWith(".")) {
      const target = posixNormalize(posixJoin(posixDirname(file), specifier));
      if (!cliPackedSet.has(target)) {
        failures.push(`CLI "${file}" imports "${specifier}", which is not packed`);
      }
      continue;
    }
    if (specifier.startsWith("node:") || builtins.has(specifier)) continue;
    const name = packageOf(specifier);
    if (!cliDeclared.has(name)) {
      failures.push(
        `CLI "${file}" imports "${specifier}", but "${name}" is neither a dependency nor a peer`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`Packed artifact check failed (${failures.length}):\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(
    `\nPacked ${packed.length} file(s) in @lablup/ui-common, ${cliPacked.length} in @lablup/ui-common-cli.`,
  );
  process.exit(1);
}

console.log(
  `Packed artifact clean: @lablup/ui-common ${packed.length} file(s), ` +
    `${Object.keys(pkg.exports ?? {}).length} export path(s) resolve; ` +
    `@lablup/ui-common-cli ${cliPacked.length} file(s), bin and imports resolve.`,
);
