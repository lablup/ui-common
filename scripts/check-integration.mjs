#!/usr/bin/env node
/**
 * `astryx doctor integration validate`, with warnings failing too.
 *
 * Astryx exits 0 on warnings and turns some of them into errors in a later
 * minor (#90), so a warning landing on main would break the next Astryx bump.
 * This fails on any issue and on any finding of the doc checks, then prints
 * Astryx's own report for them.
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string[]} args */
function astryx(args) {
  return spawnSync("pnpm", ["exec", "astryx", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

const run = astryx(["--json", "doctor", "integration", "validate"]);
/** @type {any} */
let data;
try {
  data = JSON.parse(run.stdout).data;
} catch {
  process.stderr.write(run.stdout + run.stderr);
  console.error(
    "check:integration: could not read `astryx doctor integration validate --json`",
  );
  process.exit(1);
}

const problems = [];
if (!data.validated) problems.push("the manifest did not validate");
if (data.issues.length) problems.push(`${data.issues.length} issue(s)`);
for (const [section, report] of Object.entries(data)) {
  const findings = /** @type {any} */ (report)?.findings;
  if (Array.isArray(findings) && findings.length) {
    problems.push(`${findings.length} ${section} finding(s)`);
  }
}

if (run.status !== 0 || problems.length) {
  process.stdout.write(astryx(["doctor", "integration", "validate"]).stdout);
  console.error(
    `check:integration: ${problems.join(", ") || `astryx exited ${run.status}`}; warnings fail here (#90)`,
  );
  process.exit(1);
}
console.log(
  `check:integration: ${data.name}@${data.version} validates with 0 errors, 0 warnings (${data.docTypes?.docs ?? "?"} docs type-checked)`,
);
