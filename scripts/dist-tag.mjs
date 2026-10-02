/**
 * The npm dist-tag a release publishes under.
 *
 * `main` develops the current release line. Its versions publish under `next`
 * (a prerelease) or `latest` (a plain version). An older line is maintained on
 * a `release/<line>` branch, and its hotfixes publish under `release-<line>`
 * only, so a fix to an old line never moves the tags that point at the current
 * one. A line is `<major>.<minor>` before 1.0 and `<major>` from 1.0 on: the
 * part a breaking change bumps (CONTRIBUTING.md, "Versioning").
 *
 * Usage: node scripts/dist-tag.mjs <version> <version on main>
 */

import { pathToFileURL } from "node:url";

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z.-]+)?$/;

function parse(version) {
  const match = SEMVER.exec(version);
  if (!match) throw new Error(`Not a semver version: ${JSON.stringify(version)}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    prerelease: match[4] !== undefined,
  };
}

/** The release line a version belongs to: `0.1`, `0.2`, … then `1`, `2`, … */
export function releaseLine(version) {
  const { major, minor } = parse(version);
  return major === 0 ? `0.${minor}` : `${major}`;
}

function lineKey(version) {
  const { major, minor } = parse(version);
  return major === 0 ? [0, minor] : [major, 0];
}

/**
 * @param {string} version the version being published
 * @param {string} mainVersion the version in `package.json` on `main`
 */
export function distTagFor(version, mainVersion) {
  const [major, minor] = lineKey(version);
  const [mainMajor, mainMinor] = lineKey(mainVersion);
  if (major === mainMajor && minor === mainMinor) {
    return parse(version).prerelease ? "next" : "latest";
  }
  if (major > mainMajor || (major === mainMajor && minor > mainMinor)) {
    throw new Error(
      `${version} is ahead of main (${mainVersion}). Release a new line from main, after bumping it there.`,
    );
  }
  return `release-${releaseLine(version)}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [version, mainVersion] = process.argv.slice(2);
  if (!version || !mainVersion) {
    console.error("Usage: node scripts/dist-tag.mjs <version> <version on main>");
    process.exit(2);
  }
  console.log(distTagFor(version, mainVersion));
}
