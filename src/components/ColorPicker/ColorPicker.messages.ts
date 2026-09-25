import { defineMessages } from "../../i18n/catalog";

export const colorPickerMessages = defineMessages({
  "uic.ColorPicker.label": {
    defaultMessage: "Select color",
    description: "Accessible name of a color picker whose caller gave it no label",
  },
  "uic.ColorPicker.hexValue": {
    defaultMessage: "Hex value",
    description: "Hidden label of the color picker's text field for a #rrggbb value",
  },
  "uic.ColorPicker.clear": {
    defaultMessage: "Clear",
    description: "Button in a color picker that removes the chosen color",
  },
  "uic.ColorPicker.noColor": {
    defaultMessage: "No color",
    description: "Shown on a color picker's trigger when no color is set",
  },
});
