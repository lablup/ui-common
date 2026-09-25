import { cp, mkdir, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, posix, relative, resolve, sep } from "node:path";

import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { configDefaults, defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";
import { globSync } from "tinyglobby";

import { uiCommonCatalog } from "./src/i18n/catalog.ts";

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
  };

  const patterns = [
    "src/components/*/index.ts",
    // The generated Astryx mirrors (scripts/gen-exports.mjs). Each one is a
    // one-line re-export that stays a one-line re-export in dist, because
    // every @astryxdesign/* specifier is external.
    "src/astryx/**/*.ts",
    // The Lablup brand theme, as source. Its pre-built form is copied below.
    "src/theme/*/index.ts",
    // `@lablup/ui-common/i18n-catalog`.
    "src/i18n/index.ts",
  ];
  for (const file of globSync(patterns, { cwd: root, ignore: ["**/*.test.*"] })) {
    entries[file.replace(/^src\//, "").replace(/\.ts$/, "")] = resolve(root, file);
  }

  return entries;
}

/** Keep stylesheets and walk into directories; nothing else ships. */
const cssOnly = (source: string) =>
  statSync(source).isDirectory() || source.endsWith(".css");

const jsonOnly = (source: string) =>
  statSync(source).isDirectory() || source.endsWith(".json");

/**
 * Files no module imports, so Rollup never sees them, copied verbatim.
 *
 * - `ui-common.css`: the global sheet, in `@layer ui-common`.
 * - `legacy-tokens.css` and `styles/`: the deprecated 0.1 token sheets.
 * - `astryx/**.css`: the generated one-line `@import` mirrors of the Astryx
 *   stylesheets. They stay `@import`s so the consumer's bundler resolves the
 *   Astryx sheet from this package's install location.
 * - `locales/`: Astryx core's own locale catalogs, mirrored 1:1 at
 *   `@lablup/ui-common/locales/<locale>.json`. JSON cannot re-export, so this
 *   is the one mirror that is a copy. It is taken from the installed, pinned
 *   core at build time, so it cannot drift from the JS.
 * - `ui-common-locales/`: ui-common's own `uic.*` catalog, one JSON file per
 *   Astryx locale name. `en.json` is written from the code catalog.
 * - `theme/lablup/built/`: the output of `astryx theme build`, committed and
 *   shipped as is (JS, declarations and `theme.css`). Its staleness gate is
 *   `pnpm run theme:check`.
 *
 * Stylesheets only where the source is a source directory. The copy used to
 * take the whole of `styles/`, so anything that ever landed beside the tokens
 * shipped inside the tarball: a test, a script, a note.
 */
function copyAssets(): Plugin {
  const copies: { from: string; to: string; filter: (source: string) => boolean }[] = [
    { from: "src/ui-common.css", to: "dist/ui-common.css", filter: cssOnly },
    { from: "src/legacy-tokens.css", to: "dist/legacy-tokens.css", filter: cssOnly },
    { from: "src/styles", to: "dist/styles", filter: cssOnly },
    { from: "src/astryx", to: "dist/astryx", filter: cssOnly },
    {
      from: "src/theme/lablup/built",
      to: "dist/theme/lablup/built",
      filter: (source) => !/\.test\./.test(source),
    },
    {
      from: "node_modules/@astryxdesign/core/locales",
      to: "dist/locales",
      filter: jsonOnly,
    },
    { from: "src/i18n/locales", to: "dist/ui-common-locales", filter: jsonOnly },
  ];
  return {
    name: "ui-common-copy-assets",
    apply: "build",
    async closeBundle() {
      for (const { from, to, filter } of copies) {
        const source = resolve(root, from);
        if (!existsSync(source)) continue;
        const target = resolve(root, to);
        await mkdir(dirname(target), { recursive: true });
        await cp(source, target, { recursive: true, dereference: true, filter });
      }

      // ui-common's English catalog lives in code; the translations beside it
      // are JSON. Ship English as JSON too, so every locale has one file.
      const english = resolve(root, "dist/ui-common-locales/en.json");
      await mkdir(dirname(english), { recursive: true });
      await writeFile(english, `${JSON.stringify(uiCommonCatalog, null, 2)}\n`);
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

            // A stylesheet from a dependency stays a bare specifier that the
            // consumer resolves, and is already present in the output as one.
            // Only this package's own files are re-linked. Deciding that on
            // the specifier form rather than on where the path lands is what
            // this package needs before it grows such an import: resolving a
            // bare specifier against the root produces a path inside it, so
            // the "outside the package" test never fires and the build stops
            // on a stylesheet it was never meant to touch. `@lablup/ui-ai`
            // found this the hard way with `katex/dist/katex.min.css`.
            if (!imported.startsWith(".") && !isAbsolute(imported)) continue;

            const key = sourceKey(imported);
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
    dts({
      include: ["src"],
      exclude: ["src/**/*.test.*", "src/test/**", "src/theme/*/built/**"],
    }),
    copyAssets(),
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
      // already installs, and the two then drift apart. For Astryx it would
      // be worse than drift: a bundled second copy splits the React contexts
      // (Theme, i18n, SizeContext) from the copy the consumer's other code
      // sees. Every @astryxdesign/* and @stylexjs/* import stays external.
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
    // Consumer source the upgrade codemods run on, not tests of this package.
    exclude: [...configDefaults.exclude, "test/upgrade/fixtures/**"],
  },
});
