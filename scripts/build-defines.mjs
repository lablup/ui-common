/**
 * The build-time constants `src/instance.ts` reads (the duplicate-copy
 * warning), for every Vite config that compiles `src`: the library build and
 * Storybook's.
 */
import { readFileSync } from "node:fs";

export function buildDefines() {
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  return {
    __UI_COMMON_VERSION__: JSON.stringify(pkg.version),
    __ASTRYX_CORE_VERSION__: JSON.stringify(pkg.dependencies["@astryxdesign/core"]),
  };
}
