/**
 * The translator ui-common's own components use for their built-in strings.
 * Internal: not exported from the package.
 *
 * It resolves through Astryx's `InternationalizationProvider`, so a consumer
 * supplies ui-common's translations the same way it supplies Astryx's: in the
 * provider's `messages` and `overrides`. There is no ui-common context.
 *
 * Why not Astryx's `useTranslator()` alone: when a key is missing for the
 * active locale, Astryx falls back to its own shipped English catalog, which
 * has no `uic.*` keys, and returns the key itself. Here the fallback is the
 * `defaultMessage` in ui-common's catalog, so a consumer that never passes
 * ui-common's messages still gets English.
 *
 * Lookup order, matching Astryx's for its own keys:
 *   1. `overrides` for the locale, then each parent locale (pt-BR, then pt)
 *   2. `messages` for the locale, then each parent locale
 *   3. the catalog's English `defaultMessage`
 *   4. the key itself
 *
 * A component still lets an explicit string prop win:
 *
 *   const t = useUicTranslator();
 *   const label = closeLabel ?? t("uic.Modal.close");
 */
import { useCallback, useContext } from "react";
import IntlMessageFormat from "intl-messageformat";
import {
  InternationalizationContext,
  type Catalog,
  type InternationalizationContextValue,
} from "@astryxdesign/core/i18n";

import { uiCommonCatalog } from "./catalog";

export type UicTranslate = (key: string, values?: Record<string, unknown>) => string;

/** `pt-BR` → `["pt-BR", "pt"]`, the walk Astryx's resolver uses. */
export function localeChain(locale: string): string[] {
  let canonical: string;
  try {
    canonical = new Intl.Locale(locale).baseName;
  } catch {
    canonical = locale;
  }
  const parts = canonical.split("-");
  const chain: string[] = [];
  for (let i = parts.length; i > 0; i--) chain.push(parts.slice(0, i).join("-"));
  return chain;
}

function providedByConsumer(
  ctx: InternationalizationContextValue,
  key: string,
): boolean {
  for (const tag of localeChain(ctx.locale)) {
    const override = ctx.overrides?.[tag]?.[key];
    if (override !== undefined && override !== null) return true;
  }
  for (const tag of localeChain(ctx.locale)) {
    const entry = ctx.messages[tag]?.[key];
    if (entry?.defaultMessage !== undefined && entry.defaultMessage !== null)
      return true;
  }
  return false;
}

export function useUicTranslator(catalog: Catalog = uiCommonCatalog): UicTranslate {
  const ctx = useContext(InternationalizationContext);
  return useCallback(
    (key, values) => {
      if (providedByConsumer(ctx, key)) return ctx.translate(key, values);
      const fallback = catalog[key]?.defaultMessage;
      if (fallback === undefined) return key;
      if (values === undefined) return fallback;
      return String(
        new IntlMessageFormat(fallback, ctx.locale).format(
          values as Record<string, string | number | boolean | null | undefined | Date>,
        ),
      );
    },
    [ctx, catalog],
  );
}
