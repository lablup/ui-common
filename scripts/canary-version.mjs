/**
 * The version a merge to `main` publishes under the `canary` dist-tag, and a
 * same-repository PR under `pr-<number>` (the channel then replaces `canary`).
 *
 * `<main's version>.<channel>-<UTC commit time>-<sha>`, e.g.
 * `0.2.0-alpha.19.canary-20261019094312-2ba8853ab`: one extra prerelease
 * identifier, so it sorts after the release it was cut on top of and before
 * the next one (`alpha.19` < the canary < `alpha.20`), and canaries sort by
 * time. A plain version has no prerelease to extend, so its canary hangs off
 * the next patch: `0.2.0` → `0.2.1-canary-…`. Nothing is committed; the
 * version exists only in the published tarballs.
 *
 * Usage: node scripts/canary-version.mjs <version> <YYYYMMDDHHmmss> <sha> [channel]
 */

import { pathToFileURL } from "node:url";

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

/**
 * @param {string} version the version in `package.json` on `main`
 * @param {string} timestamp the commit time in UTC, `YYYYMMDDHHmmss`
 * @param {string} sha the commit hash; its first nine characters are used
 * @param {string} [channel] `canary`, or `pr-<number>` for a PR preview
 */
export function canaryVersion(version, timestamp, sha, channel = "canary") {
  const match = SEMVER.exec(version);
  if (!match) throw new Error(`Not a semver version: ${JSON.stringify(version)}`);
  if (!/^\d{14}$/.test(timestamp)) {
    throw new Error(`Not a YYYYMMDDHHmmss timestamp: ${JSON.stringify(timestamp)}`);
  }
  if (!/^[0-9a-f]{9,40}$/.test(sha)) {
    throw new Error(`Not a commit hash: ${JSON.stringify(sha)}`);
  }
  if (!/^(canary|pr-[1-9]\d*)$/.test(channel)) {
    throw new Error(`Not a canary channel: ${JSON.stringify(channel)}`);
  }

  const suffix = `${channel}-${timestamp}-${sha.slice(0, 9)}`;
  const [, major, minor, patch, prerelease] = match;
  return prerelease
    ? `${major}.${minor}.${patch}-${prerelease}.${suffix}`
    : `${major}.${minor}.${Number(patch) + 1}-${suffix}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [version, timestamp, sha, channel] = process.argv.slice(2);
  if (!version || !timestamp || !sha) {
    console.error(
      "Usage: node scripts/canary-version.mjs <version> <YYYYMMDDHHmmss> <sha> [channel]",
    );
    process.exit(2);
  }
  console.log(canaryVersion(version, timestamp, sha, channel));
}
