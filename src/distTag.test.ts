import { distTagFor, releaseLine } from "../scripts/dist-tag.mjs";

describe("releaseLine", () => {
  it("is major.minor before 1.0 and major from 1.0 on", () => {
    expect(releaseLine("0.1.0-alpha.23")).toBe("0.1");
    expect(releaseLine("0.2.3")).toBe("0.2");
    expect(releaseLine("1.4.0")).toBe("1");
  });

  it("refuses something that is not a version", () => {
    expect(() => releaseLine("v0.1.0")).toThrow(/Not a semver/);
  });
});

describe("distTagFor", () => {
  it("publishes main's line under next or latest", () => {
    expect(distTagFor("0.2.0-alpha.16", "0.2.0-alpha.15")).toBe("next");
    expect(distTagFor("0.2.0", "0.2.0-alpha.15")).toBe("latest");
    expect(distTagFor("1.3.0", "1.2.0")).toBe("latest");
  });

  it("publishes an older line under its own tag, prerelease or not", () => {
    expect(distTagFor("0.1.0-alpha.24", "0.2.0-alpha.15")).toBe("release-0.1");
    expect(distTagFor("0.1.1", "0.2.0")).toBe("release-0.1");
    expect(distTagFor("1.4.2", "2.0.0-rc.1")).toBe("release-1");
    expect(distTagFor("0.9.1", "1.0.0")).toBe("release-0.9");
  });

  it("refuses a version ahead of main", () => {
    expect(() => distTagFor("0.3.0-alpha.0", "0.2.0")).toThrow(/ahead of main/);
    expect(() => distTagFor("1.0.0", "0.9.0")).toThrow(/ahead of main/);
  });
});
