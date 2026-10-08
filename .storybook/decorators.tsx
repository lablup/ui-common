import { useEffect, useMemo, useState } from "react";
import type { Decorator } from "@storybook/react-vite";
import { useDarkMode } from "@vueless/storybook-dark-mode";

import { InternationalizationProvider } from "../src/astryx/i18n";
import type { Catalog } from "../src/astryx/i18n";
import { Theme } from "../src/astryx/theme";
import { neutralTheme } from "../src/astryx/theme/neutral/built";
import { mergeMessages, uiCommonMessages } from "../src/i18n";
import { lablupTheme } from "../src/theme/lablup/built/lablup";

export type ThemeStyle = "lablup" | "neutral";

/**
 * The "Theme" toolbar: the Lablup brand, or Astryx's neutral baseline as the
 * "does this component assume the brand?" check. Both are the pre-built
 * themes a consumer mounts, paired with their `theme.css` in storybook.css.
 */
const themes = { lablup: lablupTheme, neutral: neutralTheme };

// Astryx's own catalogs, loaded when a locale is first picked and kept for the
// session, so switching stories does not reload them. ui-common's catalog
// (`uiCommonMessages`) is small and always present.
const astryxCatalogs = import.meta.glob<Catalog>(
  "../node_modules/@astryxdesign/core/locales/*.json",
  { import: "default" },
);
const loadedCatalogs: Record<string, Catalog> = {};

function useAstryxCatalog(locale: string): Catalog | undefined {
  const [, setLoaded] = useState(0);

  useEffect(() => {
    const load =
      astryxCatalogs[`../node_modules/@astryxdesign/core/locales/${locale}.json`];
    if (!load || loadedCatalogs[locale]) return;
    let cancelled = false;
    void load().then((catalog) => {
      loadedCatalogs[locale] = catalog;
      if (!cancelled) setLoaded((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return loadedCatalogs[locale];
}

function StoryProviders({
  Story,
  context,
}: {
  Story: Parameters<Decorator>[0];
  context: Parameters<Decorator>[1];
}) {
  const isDarkMode = useDarkMode();
  const { locale, themeStyle } = context.globals as {
    locale: string;
    themeStyle: ThemeStyle;
  };
  const astryxCatalog = useAstryxCatalog(locale);
  const messages = useMemo(
    () =>
      mergeMessages(astryxCatalog ? { [locale]: astryxCatalog } : {}, uiCommonMessages),
    [locale, astryxCatalog],
  );

  return (
    <Theme theme={themes[themeStyle]} mode={isDarkMode ? "dark" : "light"}>
      <InternationalizationProvider locale={locale} messages={messages}>
        <Story />
      </InternationalizationProvider>
    </Theme>
  );
}

export const withGlobalProviders: Decorator = (Story, context) => (
  <StoryProviders Story={Story} context={context} />
);
