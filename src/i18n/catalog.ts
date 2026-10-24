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
import type { Catalog } from "@astryxdesign/core/i18n";

// Message modules take `defineMessages` from `./defineMessages`, never from
// here: in a cycle a bundler may run a messages module after this one, and
// the spread below then reads it as `undefined` (Form's keys leaked so).
import { boardMessages } from "../components/Board/Board.messages";
import { booleanTokenMessages } from "../components/BooleanToken/BooleanToken.messages";
import { bulkEditFormItemMessages } from "../components/BulkEditFormItem/BulkEditFormItem.messages";
import { bulkErrorModalMessages } from "../components/BulkErrorModal/BulkErrorModal.messages";
import { colorPickerMessages } from "../components/ColorPicker/ColorPicker.messages";
import { dataGridMessages } from "../components/DataGrid/DataGrid.messages";
import { deleteConfirmModalMessages } from "../components/DeleteConfirmModal/DeleteConfirmModal.messages";
import { formMessages } from "../components/Form/Form.messages";
import { notificationStackMessages } from "../components/NotificationStack/NotificationStack.messages";
import { pageHeaderMessages } from "../components/PageHeader/PageHeader.messages";
import { pagedSelectorMessages } from "../components/PagedSelector/PagedSelector.messages";
import { selectionLabelMessages } from "../components/SelectionLabel/SelectionLabel.messages";
import { skeletonMessages } from "../components/Skeleton/Skeleton.messages";
import { statisticMessages } from "../components/Statistic/Statistic.messages";
import { numberStepperMessages } from "../components/StepNumberInput/NumberStepper.messages";
import { tokenRowMessages } from "../components/TokenRow/TokenRow.messages";
import { uncontrolledInputMessages } from "../components/UncontrolledInput/UncontrolledInput.messages";
import { unitGridMessages } from "../components/UnitGrid/UnitGrid.messages";
import { tagsInputMessages } from "../formControls/TagsInput/TagsInput.messages";
import { commonMessages } from "./common.messages";

export { defineMessages, type UicMessageKey } from "./defineMessages";

export const uiCommonCatalog: Catalog = {
  ...commonMessages,
  ...boardMessages,
  ...booleanTokenMessages,
  ...bulkEditFormItemMessages,
  ...bulkErrorModalMessages,
  ...colorPickerMessages,
  ...dataGridMessages,
  ...deleteConfirmModalMessages,
  ...formMessages,
  ...notificationStackMessages,
  ...numberStepperMessages,
  ...pageHeaderMessages,
  ...pagedSelectorMessages,
  ...selectionLabelMessages,
  ...skeletonMessages,
  ...statisticMessages,
  ...tagsInputMessages,
  ...tokenRowMessages,
  ...uncontrolledInputMessages,
  ...unitGridMessages,
};
