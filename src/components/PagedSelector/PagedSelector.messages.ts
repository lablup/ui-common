import { defineMessages } from "../../i18n/catalog";

export const pagedSelectorMessages = defineMessages({
  "uic.PagedSelector.placeholder": {
    defaultMessage: "Select {label}",
    description:
      "Placeholder of a selector with nothing selected; {label} is the field's label",
  },
  "uic.PagedSelector.searchOptions": {
    defaultMessage: "Search options",
    description:
      "Accessible name of the search box at the top of a selector's option list",
  },
  "uic.PagedSelector.searchPlaceholder": {
    defaultMessage: "Search",
    description: "Placeholder of the search box at the top of a selector's option list",
  },
  "uic.PagedSelector.clearSearch": {
    defaultMessage: "Clear search options",
    description: "Accessible name of the button that empties a selector's search box",
  },
  "uic.PagedSelector.noResults": {
    defaultMessage: "No results",
    description: "Shown in a selector's option list when no option matches",
  },
  "uic.PagedSelector.loading": {
    defaultMessage: "Loading...",
    description:
      "Shown in a selector's empty option list while options are being fetched",
  },
  "uic.PagedSelector.totalItems": {
    defaultMessage: "Total {total} items",
    description:
      "Foot of a selector's option list; {total} is how many options exist in all pages",
  },
});
