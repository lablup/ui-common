import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

import { buildDefines } from "./scripts/build-defines.mjs";

const root = dirname(fileURLToPath(import.meta.url));

// Read by .storybook/main.ts to drop the CDN fonts. Set here rather than in the
// npm script, so every way of running this config gets it.
process.env.UI_COMMON_VISUAL_TEST = "1";

// The test frame and the page around it must be the same size: a frame larger
// than the page is shrunk, and the screenshots come out blurred at 80%.
const VIEWPORT = { width: 1200, height: 900 };

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
function shotPath(data: ShotData) {
  const story = data.testFileName.replace(/\.stories\.tsx?$/, "");
  return resolve(
    root,
    "test/visual/__screenshots__",
    relative("src", data.testFileDirectory),
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
    // addon-vitest turns API writes off unless they are allowed here, and
    // Vitest writes screenshots through that API: without this, every new or
    // failing screenshot errors with "Couldn't write file to fs".
    api: { allowWrite: true },
    setupFiles: ["./test/visual/setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        contextOptions: { reducedMotion: "reduce", viewport: VIEWPORT },
      }),
      instances: [{ browser: "chromium" }],
      viewport: VIEWPORT,
      screenshotFailures: false,
      expect: {
        toMatchScreenshot: {
          // Vitest's defaults otherwise: pixelmatch, no mismatched pixels
          // allowed, diffs under .vitest/attachments.
          resolveScreenshotPath: shotPath,
        },
      },
    },
  },
});
