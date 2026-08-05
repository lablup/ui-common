import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, posix, relative, resolve, sep } from "node:path";

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
 * Rollup never sees them. They are copied verbatim so the palette stays an
 * opt-in entry point rather than being folded into a single bundle.
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

/** Strip a query suffix and express an id relative to the repository root. */
function sourceKey(id: string): string {
  const path = id.split("?")[0] ?? id;
  const absolute = isAbsolute(path) ? path : resolve(root, path);
  return relative(root, absolute).split(sep).join("/");
}

/**
 * Re-attach each emitted stylesheet to the chunk whose module imported it.
 *
 * In library mode Rollup strips `import "./Button.css"` out of the chunk and
 * leaves an "empty css" marker comment, because an application build would
 * have injected a link tag instead. Nothing puts the import back, so a published
 * package can carry a component's stylesheet as an emitted asset that no code
 * path reaches. That is what 0.1.0-alpha.0 shipped: 20 stylesheets under
 * `dist/assets/`, none imported by any chunk, and no exports entry pointing at
 * them either, so a consumer rendered every component unstyled with no
 * supported way to fix it. Both the package build and the install fixture were
 * green throughout, since neither one looked at whether an emitted asset was
 * reachable.
 *
 * Restoring the import here is what makes README's "component CSS travels with
 * the component" true, and keeps `styles/base.css` the tokens-only entry point
 * it is documented to be rather than a second thing to remember. Imports are
 * appended rather than prepended: ES modules hoist them, so execution order is
 * unchanged while every existing line keeps its position and the sourcemap
 * emitted moments earlier stays accurate.
 */
function linkComponentStyles(): Plugin {
  return {
    name: "ui-common-link-component-styles",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const emittedBySource = new Map<string, string>();

      for (const file of Object.values(bundle)) {
        if (file.type !== "asset" || !file.fileName.endsWith(".css")) continue;
        for (const original of file.originalFileNames ?? []) {
          emittedBySource.set(sourceKey(original), file.fileName);
        }
      }

      for (const file of Object.values(bundle)) {
        if (file.type !== "chunk") continue;

        // The stripped import is gone from `moduleIds`, but the edge that
        // produced it survives in the module graph, so the graph is what this
        // reads. Pairing `Button.css` with `Button.tsx` by filename would
        // agree on every component the package has today and quietly stop
        // agreeing on the first one that breaks the convention.
        const specifiers: string[] = [];
        for (const id of file.moduleIds) {
          for (const imported of this.getModuleInfo(id)?.importedIds ?? []) {
            if (!imported.endsWith(".css")) continue;

            const key = sourceKey(imported);
            // A stylesheet from a dependency stays a bare specifier that the
            // consumer resolves; only this package's own files are re-linked.
            if (key.startsWith("..")) continue;

            const emitted = emittedBySource.get(key);
            if (!emitted) {
              this.error(
                `${file.fileName} imports "${key}", which was not emitted as an asset. ` +
                  `Its rules would ship with nothing able to reach them. ` +
                  `Emitted stylesheets: ${[...emittedBySource.keys()].join(", ")}`,
              );
            }

            const relativeToChunk = posix.relative(
              posix.dirname(file.fileName),
              emitted,
            );
            const specifier = relativeToChunk.startsWith(".")
              ? relativeToChunk
              : `./${relativeToChunk}`;
            if (!specifiers.includes(specifier)) specifiers.push(specifier);
          }
        }

        if (specifiers.length === 0) continue;
        file.code += `\n${specifiers.map((s) => `import "${s}";`).join("\n")}\n`;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ["src"], exclude: ["src/**/*.test.*", "src/test/**"] }),
    copyStyles(),
    linkComponentStyles(),
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
