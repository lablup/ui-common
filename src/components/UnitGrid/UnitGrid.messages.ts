import { defineMessages } from "../../i18n/catalog";

export const unitGridMessages = defineMessages({
  "uic.UnitGrid.label": {
    defaultMessage: "Resource grid",
    description: "Accessible name of a unit grid whose caller gave it no aria-label",
  },
  "uic.UnitGrid.changeGroupColor": {
    defaultMessage: "Change group color",
    description:
      "Button in a unit grid's hover card that opens the palette for the group",
  },
  "uic.UnitGrid.useColor": {
    defaultMessage: "Use color {index}",
    description:
      "Accessible name of one palette swatch in a unit grid; {index} is its 1-based position",
  },
});
