import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useUicTranslator } from "./i18n/useUicTranslator";

import {
  INSTANCE_KEY,
  registerInstance,
  registerInstanceIn,
  type UiCommonInstance,
} from "./instance";

const ROOT = join(__dirname, "..");

function copy(
  version: string,
  astryxIdentity: unknown = "core",
  url = `file:///node_modules/@lablup/ui-common@${version}/dist/instance.js`,
): UiCommonInstance {
  return { version, astryxVersion: "0.6.2", url, astryxIdentity };
}

describe("registerInstanceIn", () => {
  it("stays quiet for one copy, however often it registers", () => {
    const host = {};
    const warn = vi.fn();
    const only = copy("0.2.0");
    registerInstanceIn(host, only, warn);
    registerInstanceIn(host, only, warn);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once when a second copy registers, naming both", () => {
    const host = {};
    const warn = vi.fn();
    registerInstanceIn(host, copy("0.2.0"), warn);
    registerInstanceIn(host, copy("0.2.1"), warn);
    registerInstanceIn(host, copy("0.2.2"), warn);
    expect(warn).toHaveBeenCalledTimes(1);
    const message = warn.mock.calls[0]?.[0] as string;
    expect(message).toMatch(/2 copies are loaded/);
    expect(message).toContain("@lablup/ui-common@0.2.0/dist/instance.js");
    expect(message).toContain("@lablup/ui-common@0.2.1/dist/instance.js");
    expect(message).not.toMatch(/copies of @astryxdesign\/core/);
  });

  it("says so when the copies also run on two copies of Astryx core", () => {
    const host = {};
    const warn = vi.fn();
    registerInstanceIn(host, copy("0.2.0", {}), warn);
    registerInstanceIn(host, copy("0.2.0", {}), warn);
    expect(warn.mock.calls[0]?.[0]).toMatch(
      /2 copies of @astryxdesign\/core, so Theme, i18n and layer contexts/,
    );
  });

  it("tells two copies of the same version apart", () => {
    const host = {};
    const warn = vi.fn();
    registerInstanceIn(host, copy("0.2.0", "core", "same"), warn);
    registerInstanceIn(host, copy("0.2.0", "core", "same"), warn);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("registerInstance", () => {
  it("registers this copy on globalThis the first time a component translates", () => {
    renderHook(() => useUicTranslator());
    renderHook(() => useUicTranslator());
    const registry = (
      globalThis as { [INSTANCE_KEY]?: { instances: UiCommonInstance[] } }
    )[INSTANCE_KEY];
    expect(registry?.instances).toHaveLength(1);
    const [self] = registry?.instances ?? [];
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    expect(self?.version).toBe(pkg.version);
    expect(self?.astryxVersion).toBe(pkg.dependencies["@astryxdesign/core"]);
    expect(self?.url).toMatch(/instance\.ts$/);
  });

  it("is a no-op in production", () => {
    const host = globalThis as { [INSTANCE_KEY]?: unknown };
    const saved = host[INSTANCE_KEY];
    delete host[INSTANCE_KEY];
    vi.stubEnv("NODE_ENV", "production");
    try {
      registerInstance();
      expect(host[INSTANCE_KEY]).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
      host[INSTANCE_KEY] = saved;
    }
  });
});
