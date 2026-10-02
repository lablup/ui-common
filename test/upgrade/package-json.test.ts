/**
 * `transformPackageJson` on its own: the dependency edits a fixture project
 * does not pin down.
 */
import { describe, expect, it } from "vitest";

import { transformPackageJson } from "../../codemods/0.2/package-json.mjs";
import { LAB_PACKAGE, stylexPeer } from "../../codemods/0.2/map.mjs";

const UIC = "@lablup/ui-common";
const stylex = stylexPeer();

function run(pkg: object, packages = new Map<string, string>()) {
  const notes: string[] = [];
  const out = transformPackageJson(`${JSON.stringify(pkg, null, 2)}\n`, {
    to: "0.2.0",
    flags: { packages },
    note: (m: string) => notes.push(m),
  });
  return { pkg: out === undefined ? pkg : JSON.parse(out), notes };
}

describe("a library (ui-common as a peer)", () => {
  it("adds the StyleX peer although StyleX is already a devDependency", () => {
    const { pkg } = run({
      peerDependencies: { [UIC]: "^0.1.0" },
      devDependencies: { [UIC]: "0.1.0", [stylex.name]: "0.19.0" },
    });
    expect(pkg.peerDependencies[stylex.name]).toBe(stylex.range);
    expect(pkg.devDependencies[stylex.name]).toBe("0.19.0");
  });

  it("adds the StyleX devDependency although StyleX is already a peer", () => {
    const { pkg } = run({
      peerDependencies: { [UIC]: "^0.1.0", [stylex.name]: "^0.19.0" },
      devDependencies: { [UIC]: "0.1.0" },
    });
    expect(pkg.peerDependencies[stylex.name]).toBe("^0.19.0");
    expect(pkg.devDependencies[stylex.name]).toBe(stylex.range);
  });

  it("leaves both alone when both are declared", () => {
    const input = {
      peerDependencies: { [UIC]: "^0.2.0", [stylex.name]: "^0.19.0" },
      devDependencies: { [UIC]: "0.2.0", [stylex.name]: "0.19.0" },
    };
    expect(
      transformPackageJson(`${JSON.stringify(input, null, 2)}\n`, {
        to: "0.2.0",
        flags: { packages: new Map() },
        note: () => {},
      }),
    ).toBeUndefined();
  });

  it("adds the lab peer although lab is already a devDependency", () => {
    const { pkg } = run(
      {
        peerDependencies: { [UIC]: "^0.1.0", [stylex.name]: "^0.19.0" },
        devDependencies: {
          [UIC]: "0.1.0",
          [stylex.name]: "0.19.0",
          [LAB_PACKAGE]: "1.0.0",
        },
      },
      new Map([[LAB_PACKAGE, "1.0.0"]]),
    );
    expect(pkg.peerDependencies[LAB_PACKAGE]).toBe("1.0.0");
  });
});

describe("an application", () => {
  it("does not add StyleX when any field already has it", () => {
    const { pkg } = run({
      dependencies: { [UIC]: "^0.1.0" },
      devDependencies: { [stylex.name]: "0.19.0" },
    });
    expect(pkg.dependencies[stylex.name]).toBeUndefined();
  });
});
