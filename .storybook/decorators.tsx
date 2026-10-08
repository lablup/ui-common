import { useEffect, useMemo, useState, type ReactNode } from "react";
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

// Astryx's own catalogs, loaded when a locale is first picked. ui-common's
// catalog (`uiCommonMessages`) is small and always present.
const astryxCatalogs = import.meta.glob<Catalog>(
  "../node_modules/@astryxdesign/core/locales/*.json",
  { import: "default" },
);

function useAstryxCatalog(locale: string): Record<string, Catalog> {
  const [loaded, setLoaded] = useState<Record<string, Catalog>>({});

  useEffect(() => {
    const load =
      astryxCatalogs[`../node_modules/@astryxdesign/core/locales/${locale}.json`];
    if (!load || loaded[locale]) return;
    let cancelled = false;
    void load().then((catalog) => {
      if (!cancelled) setLoaded((current) => ({ ...current, [locale]: catalog }));
    });
    return () => {
      cancelled = true;
    };
  }, [locale, loaded]);

  return loaded;
}

function StoryProviders({
  locale,
  themeStyle,
  isDarkMode,
  children,
}: {
  locale: string;
  themeStyle: ThemeStyle;
  isDarkMode: boolean;
  children: ReactNode;
}) {
  const astryx = useAstryxCatalog(locale);
  const messages = useMemo(() => mergeMessages(astryx, uiCommonMessages), [astryx]);

  return (
    <Theme theme={themes[themeStyle]} mode={isDarkMode ? "dark" : "light"}>
      <InternationalizationProvider locale={locale} messages={messages}>
        {children}
      </InternationalizationProvider>
    </Theme>
  );
}

/** Body background and text follow the mounted theme, as in an app. */
function useBodyColors() {
  useEffect(() => {
    document.body.style.backgroundColor = "var(--color-background-body)";
    document.body.style.color = "var(--color-text-primary)";
    document.body.style.fontFamily = "var(--font-family-body)";
  }, []);
}

function WithGlobalProviders({
  Story,
  context,
}: {
  Story: Parameters<Decorator>[0];
  context: Parameters<Decorator>[1];
}) {
  const isDarkMode = useDarkMode();
  useBodyColors();
  const { locale, themeStyle } = context.globals as {
    locale: string;
    themeStyle: ThemeStyle;
  };

  return (
    <StoryProviders locale={locale} themeStyle={themeStyle} isDarkMode={isDarkMode}>
      <Story />
    </StoryProviders>
  );
}

export const withGlobalProviders: Decorator = (Story, context) => (
  <WithGlobalProviders Story={Story} context={context} />
);
