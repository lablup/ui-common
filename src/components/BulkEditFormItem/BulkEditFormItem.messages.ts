import { defineMessages } from "../../i18n/catalog";

export const bulkEditFormItemMessages = defineMessages({
  "uic.BulkEditFormItem.keepAsIs": {
    defaultMessage: "Keep as is",
    description:
      "Placeholder of a bulk-edit field that leaves every selected item's current value unchanged",
  },
  "uic.BulkEditFormItem.clear": {
    defaultMessage: "Clear",
    description:
      "Link that clears the field on every selected item, and the field's placeholder once cleared",
  },
  "uic.BulkEditFormItem.undoChanges": {
    defaultMessage: "Undo changes",
    description: "Link that returns a bulk-edit field to keeping the current values",
  },
});
