/**
 * ui-common's catalog for every locale it ships, as one `MessagesByLocale`.
 *
 * English is the code catalog. Every other locale is the matching
 * `./locales/<locale>.json` file, picked up automatically: adding a
 * translation needs no code change.
 */
import type { Catalog, MessagesByLocale } from "@astryxdesign/core/i18n";

import { uiCommonCatalog } from "./catalog";

const translations = import.meta.glob<Catalog>("./locales/*.json", {
  eager: true,
  import: "default",
});

function localeOf(path: string): string {
  return path.replace(/^.*\//, "").replace(/\.json$/, "");
}

export const uiCommonMessages: MessagesByLocale = {
  en: uiCommonCatalog,
  ...Object.fromEntries(
    Object.entries(translations).map(([path, catalog]) => [localeOf(path), catalog]),
  ),
};

/**
 * Merge several `MessagesByLocale` maps into one, locale by locale. A later
 * map wins on the same key. Use it to hand Astryx's provider ui-common's
 * catalog together with your own:
 *
 *   <InternationalizationProvider
 *     locale={locale}
 *     messages={mergeMessages(uiCommonMessages, myMessages)}
 *   />
 */
export function mergeMessages(...sources: MessagesByLocale[]): MessagesByLocale {
  const merged: MessagesByLocale = {};
  for (const source of sources) {
    for (const [locale, catalog] of Object.entries(source)) {
      merged[locale] = { ...merged[locale], ...catalog };
    }
  }
  return merged;
}
