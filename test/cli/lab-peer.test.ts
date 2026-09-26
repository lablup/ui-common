/**
 * The lab canary declares an exact peer on the core canary it was cut from,
 * not on the stable core ui-common pins. Without an override a consumer gets
 * a second core (pnpm, npm) and `@lablup/ui-common/lab` runs on it. These
 * guard the recipe README gives consumers, the `sync-astryx` step that keeps
 * it at the pin, and `upgrade`'s package-manager edits that apply it.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  applyLabOverride,
  labCorePeer,
  labOverrideProblems,
  syncLabOverrideDocs,
} from "../../cli/lab-peer.mjs";
import { ownPackageJson } from "../../cli/paths.mjs";
import { labOverrideEdits } from "../../cli/sync-astryx.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const readme = readFileSync(join(root, "README.md"), "utf8");
const corePin = ownPackageJson().dependencies["@astryxdesign/core"] as string;

describe("the lab core override", () => {
  it("is documented in README at the core pin whenever lab's core peer differs", () => {
    const peer = labCorePeer();
    expect(peer, "@astryxdesign/lab is installed as a devDependency").toBeTruthy();
    if (peer === corePin) return;
    expect(labOverrideProblems(readme, corePin)).toEqual([]);
  });

  it("reports a stale or missing recipe", () => {
    expect(labOverrideProblems("# nothing here\n", corePin)).toHaveLength(2);
    const stale = syncLabOverrideDocs(readme, "0.0.1");
    expect(labOverrideProblems(stale, corePin)).toHaveLength(2);
    expect(labOverrideProblems(stale, "0.0.1")).toEqual([]);
  });

  it("moves both recipes to a new pin and nothing else", () => {
    const moved = syncLabOverrideDocs(readme, "9.9.9");
    const changed = moved
      .split("\n")
      .filter((line, i) => line !== readme.split("\n")[i]);
    expect(changed).toHaveLength(2);
    for (const line of changed) expect(line).toContain('"9.9.9"');
    expect(syncLabOverrideDocs(moved, corePin)).toBe(readme);
  });
});

describe("sync-astryx", () => {
  it("moves README's recipes and the repository's own peer rule with the core pin", () => {
    const repo = mkdtempSync(join(tmpdir(), "uic-sync-lab-"));
    try {
      for (const name of ["README.md", "pnpm-workspace.yaml"])
        writeFileSync(join(repo, name), readFileSync(join(root, name), "utf8"));
      expect(labOverrideEdits(repo, corePin)).toEqual([]);
      const edits = labOverrideEdits(repo, "9.9.9");
      expect(edits.map((e) => e.name)).toEqual(["README.md", "pnpm-workspace.yaml"]);
      expect(labOverrideProblems(edits[0]!.after, "9.9.9")).toEqual([]);
      expect(edits[1]!.after).toContain(
        '"@astryxdesign/lab>@astryxdesign/core": "9.9.9"',
      );
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

describe("applyLabOverride", () => {
  const pin = "0.6.2";

  it("adds the npm override to package.json", () => {
    const pkg = { name: "x", dependencies: { "@astryxdesign/lab": "canary" } };
    const edit = applyLabOverride({ manager: "npm", pkg, pin });
    expect(pkg).toMatchObject({
      overrides: { "@astryxdesign/lab": { "@astryxdesign/core": pin } },
    });
    expect(edit.note).toContain("overrides");
  });

  it("keeps an npm override that already names a core for lab", () => {
    const pkg = {
      overrides: {
        "@astryxdesign/lab": { "@astryxdesign/core": "$@astryxdesign/core" },
      },
    };
    const edit = applyLabOverride({ manager: "npm", pkg, pin });
    expect(pkg.overrides["@astryxdesign/lab"]["@astryxdesign/core"]).toBe(
      "$@astryxdesign/core",
    );
    expect(edit.note).toContain("left");
  });

  it("adds the pnpm override to a workspace file, under an existing overrides block", () => {
    const yaml = `packages:\n  - app\noverrides:\n    foo: 1.0.0\nallowBuilds:\n  esbuild: true\n`;
    const edit = applyLabOverride({ manager: "pnpm", workspaceYaml: yaml, pin });
    expect(edit.workspaceYaml).toBe(
      `packages:\n  - app\noverrides:\n    "@astryxdesign/lab>@astryxdesign/core": "${pin}"\n    foo: 1.0.0\nallowBuilds:\n  esbuild: true\n`,
    );
  });

  it("appends an overrides block, or writes a new workspace file", () => {
    expect(
      applyLabOverride({ manager: "pnpm", workspaceYaml: "packages:\n  - app", pin })
        .workspaceYaml,
    ).toBe(
      `packages:\n  - app\n\noverrides:\n  "@astryxdesign/lab>@astryxdesign/core": "${pin}"\n`,
    );
    expect(
      applyLabOverride({ manager: "pnpm", workspaceYaml: null, pin }).workspaceYaml,
    ).toBe(`overrides:\n  "@astryxdesign/lab>@astryxdesign/core": "${pin}"\n`);
  });

  it("moves a stale pnpm override to the pin and leaves a current one alone", () => {
    const stale = `overrides:\n  '@astryxdesign/lab>@astryxdesign/core': 0.6.1\n`;
    expect(
      applyLabOverride({ manager: "pnpm", workspaceYaml: stale, pin }).workspaceYaml,
    ).toBe(`overrides:\n  '@astryxdesign/lab>@astryxdesign/core': "${pin}"\n`);
    const current = `overrides:\n  "@astryxdesign/lab>@astryxdesign/core": "${pin}"\n`;
    expect(
      applyLabOverride({ manager: "pnpm", workspaceYaml: current, pin }).workspaceYaml,
    ).toBeUndefined();
  });

  it("does not mistake a peerDependencyRules entry for the override", () => {
    const yaml = `peerDependencyRules:\n  allowedVersions:\n    "@astryxdesign/lab>@astryxdesign/core": "${pin}"\n`;
    expect(
      applyLabOverride({ manager: "pnpm", workspaceYaml: yaml, pin }).workspaceYaml,
    ).toBe(`${yaml}\noverrides:\n  "@astryxdesign/lab>@astryxdesign/core": "${pin}"\n`);
  });

  it("only notes the recipe for a package manager it cannot edit", () => {
    const edit = applyLabOverride({ manager: null, pin });
    expect(edit.workspaceYaml).toBeUndefined();
    expect(edit.note).toContain('"@astryxdesign/lab>@astryxdesign/core"');
    expect(edit.note).toContain('"overrides"');
  });
});
