import { uiCommonMessages } from "../src/i18n";

const names = (locale: string) => new Intl.DisplayNames([locale], { type: "language" });

/**
 * The locale toolbar's list: every locale ui-common ships a catalog for
 * (`src/i18n/locales`, English first), each named in its own language. Values
 * are Astryx locale names, the ones a consumer passes to
 * `InternationalizationProvider`.
 */
export const localeItems = Object.keys(uiCommonMessages)
  .sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)))
  .map((value) => ({ value, title: names(value).of(value) ?? value }));
