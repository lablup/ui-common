/**
 * ui-common's message catalog: every built-in string a custom component
 * shows, with its English text.
 *
 * English lives in code, as `defaultMessage`. Translations live in
 * `./locales/<locale>.json`, one file per Astryx locale name (`ko-KR.json`,
 * `ja-JP.json`, ...), holding the same keys. The build writes `en.json` from
 * this catalog and ships every file at
 * `@lablup/ui-common/ui-common-locales/<locale>.json`.
 *
 * Adding strings for a component:
 *
 *   // src/components/Modal/Modal.messages.ts
 *     "uic.Modal.close": { defaultMessage: "Close", description: "..." },
 *   });
 *
 * files free of React and CSS imports: the build reads this catalog.
 */
import type { Catalog, MessageEntry } from "@astryxdesign/core/i18n";

// These modules import `defineMessages` back from here. The cycle is safe:
// it is a function declaration, so it is bound before either module runs.
import { pageHeaderMessages } from "../components/PageHeader/PageHeader.messages";
import { skeletonMessages } from "../components/Skeleton/Skeleton.messages";

/** A catalog key: `uic.<Component>.<key>`. */
export type UicMessageKey = `uic.${string}.${string}`;

/** Type-checks a component's messages. Keys must be `uic.<Component>.<key>`. */
export function defineMessages<const T extends Record<UicMessageKey, MessageEntry>>(
  messages: T,
): T {
  return messages;
}

export const uiCommonCatalog: Catalog = {
  ...pageHeaderMessages,
  ...skeletonMessages,
};
