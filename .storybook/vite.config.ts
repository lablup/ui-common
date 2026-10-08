import { readFileSync } from "node:fs";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as {
  version: string;
  dependencies: Record<string, string>;
};

/**
 * Storybook's Vite config. Only what the components need at runtime: React,
 * and the build constants the duplicate-copy warning reads (src/instance.ts),
 * defined the same way as the library build.
 */
export default defineConfig({
  plugins: [react()],
  define: {
    __UI_COMMON_VERSION__: JSON.stringify(pkg.version),
    __ASTRYX_CORE_VERSION__: JSON.stringify(pkg.dependencies["@astryxdesign/core"]),
  },
});
