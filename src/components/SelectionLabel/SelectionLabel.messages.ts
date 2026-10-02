import { defineMessages } from "../../i18n/catalog";

export const selectionLabelMessages = defineMessages({
  "uic.SelectionLabel.selectedCount": {
    defaultMessage: "{count} selected",
    description:
      "How many items are selected, e.g. rows of a table; {count} is the number",
  },
  "uic.SelectionLabel.clear": {
    defaultMessage: "Deselect all",
    description: "Button that clears the whole selection",
  },
});
