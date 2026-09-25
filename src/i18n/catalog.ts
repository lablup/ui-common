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
 *   export const modalMessages = defineMessages({
 *     "uic.Modal.close": { defaultMessage: "Close", description: "..." },
 *   });
 *
 * then spread `modalMessages` into `uiCommonCatalog` below. Keep message
 * files free of React and CSS imports: the build reads this catalog.
 */
import type { Catalog, MessageEntry } from "@astryxdesign/core/i18n";

// These modules import `defineMessages` back from here. The cycle is safe:
// it is a function declaration, so it is bound before either module runs.
import { booleanTokenMessages } from "../components/BooleanToken/BooleanToken.messages";
import { modalMessages } from "../components/Modal/Modal.messages";
import { notificationStackMessages } from "../components/NotificationStack/NotificationStack.messages";
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
  ...booleanTokenMessages,
  ...modalMessages,
  ...notificationStackMessages,
  ...pageHeaderMessages,
  ...skeletonMessages,
};
