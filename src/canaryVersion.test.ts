import { canaryVersion } from "../scripts/canary-version.mjs";

const SHA = "2ba8853ab0123456789abcdef0123456789abcde";

describe("canaryVersion", () => {
  it("extends main's prerelease with one identifier", () => {
    expect(canaryVersion("0.2.0-alpha.19", "20261019094312", SHA)).toBe(
      "0.2.0-alpha.19.canary-20261019094312-2ba8853ab",
    );
  });

  it("hangs a plain version's canary off the next patch", () => {
    expect(canaryVersion("0.2.0", "20261019094312", SHA)).toBe(
      "0.2.1-canary-20261019094312-2ba8853ab",
    );
  });

  it("names a PR preview after its PR", () => {
    expect(canaryVersion("0.2.0-alpha.19", "20261019094312", SHA, "pr-78")).toBe(
      "0.2.0-alpha.19.pr-78-20261019094312-2ba8853ab",
    );
  });

  it("refuses malformed input", () => {
    expect(() => canaryVersion("v0.2.0", "20261019094312", SHA)).toThrow(
      /Not a semver/,
    );
    expect(() => canaryVersion("0.2.0", "2026-10-19", SHA)).toThrow(/timestamp/);
    expect(() => canaryVersion("0.2.0", "20261019094312", "HEAD")).toThrow(
      /commit hash/,
    );
    expect(() => canaryVersion("0.2.0", "20261019094312", SHA, "next")).toThrow(
      /channel/,
    );
  });
});
