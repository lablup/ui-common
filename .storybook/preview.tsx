import type { Preview } from "@storybook/react-vite";

import "./storybook.css";
import { DocsContainer } from "./DocsContainer";
import { withGlobalProviders } from "./decorators";
import { localeItems } from "./localeConfig";
import { storybookDarkTheme, storybookLightTheme } from "./storybookTheme";

const preview: Preview = {
  tags: ["autodocs"],
  decorators: [withGlobalProviders],
  parameters: {
    darkMode: {
      dark: storybookDarkTheme,
      light: storybookLightTheme,
      current: "light",
      stylePreview: true,
    },
    docs: {
      container: DocsContainer,
    },
    layout: "padded",
  },
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Locale passed to Astryx's InternationalizationProvider",
      toolbar: {
        icon: "globe",
        items: localeItems,
        dynamicTitle: true,
      },
    },
    themeStyle: {
      name: "Theme",
      description: "The Lablup brand theme vs. Astryx's neutral baseline",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "lablup", title: "Lablup" },
          { value: "neutral", title: "Astryx (neutral)" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    locale: "en",
    themeStyle: "lablup",
  },
};

export default preview;
