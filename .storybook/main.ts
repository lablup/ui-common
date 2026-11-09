import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    {
      titlePrefix: "Docs Overview",
      directory: "../src",
      files: "Introduction.mdx",
    },
    "../src/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-docs", "@vueless/storybook-dark-mode"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      // The repository's own vite.config.ts is the library build (lib mode,
      // dts emission, the dist copies), none of which belongs in Storybook.
      builder: { viteConfigPath: ".storybook/vite.config.ts" },
    },
  },
  // The visual tests must not depend on what a CDN serves today, so they
  // render with the pinned container's own fonts.
  previewHead: (head) =>
    process.env.UI_COMMON_VISUAL_TEST ? head.replace(/<link\b[^>]*>/g, "") : head,
  docs: {
    defaultName: "Documentation",
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
