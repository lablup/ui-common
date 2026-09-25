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
 *   // src/components/Foo/Foo.messages.ts
 *   export const fooMessages = defineMessages({
 *     "uic.Foo.expand": { defaultMessage: "Expand", description: "..." },
 *   });
 *
 * then spread `fooMessages` into `uiCommonCatalog` below. Generic action
 * words (OK, Cancel, Confirm, Retry, ...) are `uic.common.*` keys in
 * `./common.messages.ts`; use those instead of a key of your own. Keep message
 * files free of React and CSS imports: the build reads this catalog.
 */
import type { Catalog, MessageEntry } from "@astryxdesign/core/i18n";

// These modules import `defineMessages` back from here. The cycle is safe:
// it is a function declaration, so it is bound before either module runs.
import { booleanTokenMessages } from "../components/BooleanToken/BooleanToken.messages";
import { colorPickerMessages } from "../components/ColorPicker/ColorPicker.messages";
import { deleteConfirmModalMessages } from "../components/DeleteConfirmModal/DeleteConfirmModal.messages";
import { notificationStackMessages } from "../components/NotificationStack/NotificationStack.messages";
import { pageHeaderMessages } from "../components/PageHeader/PageHeader.messages";
import { selectionLabelMessages } from "../components/SelectionLabel/SelectionLabel.messages";
import { skeletonMessages } from "../components/Skeleton/Skeleton.messages";
import { statisticMessages } from "../components/Statistic/Statistic.messages";
import { numberStepperMessages } from "../components/StepNumberInput/NumberStepper.messages";
import { tokenRowMessages } from "../components/TokenRow/TokenRow.messages";
import { uncontrolledInputMessages } from "../components/UncontrolledInput/UncontrolledInput.messages";
import { unitGridMessages } from "../components/UnitGrid/UnitGrid.messages";
import { commonMessages } from "./common.messages";

/**
 * A catalog key: `uic.<Component>.<key>`, or `uic.common.<key>` for a word
 * every component shares (`./common.messages.ts`).
 */
export type UicMessageKey = `uic.${string}.${string}`;

/**
 * Type-checks a component's messages. Keys must be `uic.<Component>.<key>` or
 * `uic.common.<key>`.
 */
export function defineMessages<const T extends Record<UicMessageKey, MessageEntry>>(
  messages: T,
): T {
  return messages;
}

export const uiCommonCatalog: Catalog = {
  ...commonMessages,
  ...booleanTokenMessages,
  ...colorPickerMessages,
  ...deleteConfirmModalMessages,
  ...notificationStackMessages,
  ...numberStepperMessages,
  ...pageHeaderMessages,
  ...selectionLabelMessages,
  ...skeletonMessages,
  ...statisticMessages,
  ...tokenRowMessages,
  ...uncontrolledInputMessages,
  ...unitGridMessages,
};
