import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

import { buildDefines } from "./scripts/build-defines.mjs";

const root = dirname(fileURLToPath(import.meta.url));

interface ShotData {
  arg: string;
  browserName: string;
  ext: string;
  platform: string;
  testFileDirectory: string;
  testFileName: string;
}

// Keyed by directory as well as story file: Switch and FileInput each have two
// story files with the same name.
function shotPath(base: string, data: ShotData) {
  const story = data.testFileName.replace(/\.stories\.tsx?$/, "");
  const directory = relative("src", data.testFileDirectory);
  return resolve(
    root,
    base,
    directory,
    story,
    `${data.arg}-${data.browserName}-${data.platform}${data.ext}`,
  );
}

/**
 * Visual regression: every story renders in Chromium and is compared with a
 * committed screenshot. Separate from vite.config.ts on purpose, so `pnpm test`
 * stays the fast jsdom suite. Baselines are only valid from the pinned
 * Playwright container, so run this through scripts/visual-test.sh.
 */
export default defineConfig({
  // The constants .storybook/vite.config.ts defines; the plugin does not read
  // that file's `define`.
  define: buildDefines(),
  plugins: [
    storybookTest({
      configDir: join(root, ".storybook"),
      tags: { exclude: ["no-vrt"] },
    }),
  ],
  test: {
    name: "visual",
    setupFiles: ["./test/visual/setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        contextOptions: {
          reducedMotion: "reduce",
          // Larger than the page, Vitest shrinks the test frame and the
          // screenshots come out blurred at 80%.
          viewport: { width: 1200, height: 900 },
        },
      }),
      instances: [{ browser: "chromium" }],
      viewport: { width: 1200, height: 900 },
      screenshotFailures: false,
      expect: {
        toMatchScreenshot: {
          comparatorName: "pixelmatch",
          comparatorOptions: { threshold: 0.1, allowedMismatchedPixelRatio: 0 },
          resolveScreenshotPath: (data) =>
            shotPath("test/visual/__screenshots__", data),
          resolveDiffPath: (data) => shotPath(data.attachmentsDir, data),
        },
      },
    },
  },
});
