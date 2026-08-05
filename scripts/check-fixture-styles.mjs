#!/usr/bin/env node
/**
 * Consumer-side stylesheet check.
 *
 * `check-pack.mjs` asserts that every packed stylesheet is reachable. This
 * asserts the consequence a user actually experiences: a project that installs
 * the tarball and imports a component ends up with that component's rules in
 * its own bundle. Run against the built install fixture, after `vite build`.
 *
 * Two components, because there are two import shapes and each could break on
 * its own: `Button` arrives through the package root, `Drawer` through a
 * component subpath.
 *
 * Markers are read out of the packed stylesheet rather than written down here,
 * so renaming a class is not a false failure.
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDist = resolve(root, process.argv[2] ?? "fixture/dist");

const COMPONENTS = ["Button", "Drawer"];

async function collectCss(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectCss(path)));
    else if (entry.name.endsWith(".css")) out.push(await readFile(path, "utf8"));
  }
  return out;
}

/** The first class selector in a stylesheet, e.g. ".button" out of ".button{...". */
function firstClassSelector(css, source) {
  const match = css.match(/\.(-?[_a-zA-Z][\w-]*)/);
  if (!match) throw new Error(`${source} defines no class selector to check against`);
  return match[0];
}

const bundled = (await collectCss(fixtureDist)).join("\n");
if (bundled.trim() === "") {
  console.error(`No stylesheet found under ${fixtureDist}. Build the fixture first.`);
  process.exit(1);
}

const missing = [];

for (const component of COMPONENTS) {
  const source = `dist/assets/components/${component}/${component}.css`;
  const marker = firstClassSelector(
    await readFile(resolve(root, source), "utf8"),
    source,
  );
  if (!bundled.includes(marker)) {
    missing.push(
      `the fixture imports ${component} but its bundle carries no "${marker}" rule, ` +
        `so ${source} never reached the consumer`,
    );
  }
}

if (missing.length > 0) {
  console.error(`Consumer stylesheet check failed (${missing.length}):\n`);
  for (const line of missing) console.error(`  ${line}`);
  process.exit(1);
}

console.log(`Consumer stylesheets present: ${COMPONENTS.join(", ")}.`);
