import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { buildDefines } from "../scripts/build-defines.mjs";

/**
 * Storybook's Vite config. Only what the components need at runtime: React,
 * and the build constants the duplicate-copy warning reads (src/instance.ts).
 */
export default defineConfig({
  plugins: [react()],
  define: buildDefines(),
});
