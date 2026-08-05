import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, resolve } from "node:path";

import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";
import { globSync } from "tinyglobby";

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Every component and hook barrel is its own Rollup entry. Combined with
 * `preserveModules`, this is what makes the subpath exports in package.json
 * resolve to real files and keeps a consumer that imports one component from
 * pulling in the rest of the package.
 */
function entryPoints(): Record<string, string> {
  const entries: Record<string, string> = {
    index: resolve(root, "src/index.ts"),
    "hooks/index": resolve(root, "src/hooks/index.ts"),
  };

  for (const file of globSync("src/components/*/index.ts", { cwd: root })) {
    entries[file.replace(/^src\//, "").replace(/\.ts$/, "")] = resolve(root, file);
  }

  return entries;
}

/**
 * Design tokens are standalone stylesheets that no component imports, so
 * Rollup never sees them. They are copied verbatim so each theme family stays
 * an opt-in entry point rather than being folded into a single bundle.
 */
function copyStyles(): Plugin {
  return {
    name: "ui-common-copy-styles",
    apply: "build",
    async closeBundle() {
      const from = resolve(root, "src/styles");
      if (!existsSync(from)) return;
      const to = resolve(root, "dist/styles");
      await mkdir(to, { recursive: true });
      await cp(from, to, { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ["src"], exclude: ["src/**/*.test.*", "src/test/**"] }),
    copyStyles(),
  ],
  build: {
    target: "es2022",
    sourcemap: true,
    cssCodeSplit: true,
    lib: {
      entry: entryPoints(),
      formats: ["es"],
    },
    rollupOptions: {
      // Externalize every bare specifier. A library resolves its dependencies
      // at the consumer, so nothing from node_modules belongs in dist. With
      // preserveModules, a bare specifier that is not external gets written
      // into dist/node_modules as a vendored copy of a package the consumer
      // already installs, and the two then drift apart. This package has no
      // runtime dependencies today; the rule is here so adding one cannot
      // silently start shipping it.
      external: (id) => {
        if (id.startsWith("\0")) return false; // plugin virtual module
        if (id.startsWith(".") || isAbsolute(id)) return false;
        return true;
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
