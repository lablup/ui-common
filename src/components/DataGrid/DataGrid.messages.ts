import { defineMessages } from "../../i18n/catalog";

export const dataGridMessages = defineMessages({
  "uic.DataGrid.noData": {
    defaultMessage: "No data to display",
    description: "Shown in place of a data grid's rows when there are none",
  },
  "uic.DataGrid.invalidPage": {
    defaultMessage: "Invalid page number",
    description:
      "Shown in place of a data grid's rows when the current page lies past the last page",
  },
  "uic.DataGrid.goToFirstPage": {
    defaultMessage: "Go to first page",
    description: "Button under the invalid page message that returns to page 1",
  },
  "uic.DataGrid.expandRow": {
    defaultMessage: "Expand row",
    description: "Accessible name of the button that shows or hides a row's details",
  },
  "uic.DataGrid.pagination": {
    defaultMessage: "Pagination",
    description: "Accessible name of a data grid's page navigation",
  },
  "uic.DataGrid.range": {
    defaultMessage: "{start} - {end} of {total} items",
    description:
      "Beside a data grid's page navigation: the rows on screen out of the total. {start} and {end} are 1-based row numbers",
  },
  "uic.DataGrid.settings": {
    defaultMessage: "Table Settings",
    description:
      "Button under a data grid that opens its column settings, and the title of that dialog",
  },
  "uic.DataGrid.exportCsv": {
    defaultMessage: "Export CSV",
    description:
      "Button under a data grid that opens the CSV export dialog, and the title of that dialog",
  },
  "uic.DataGrid.selectColumns": {
    defaultMessage: "Select columns to display",
    description: "Subtitle of a data grid's column settings and CSV export dialogs",
  },
  "uic.DataGrid.searchColumns": {
    defaultMessage: "Search table columns",
    description:
      "Placeholder of the column search field in a data grid's dialogs, also shown when no column matches",
  },
  "uic.DataGrid.reorderColumn": {
    defaultMessage: "Reorder {column}",
    description:
      "Accessible name of the drag handle beside a column in a data grid's column settings dialog. {column} is the column's label",
  },
  "uic.DataGrid.reorderInstructions": {
    defaultMessage:
      "Press Space to pick up the column, use the arrow keys to move it, then press Space again to drop it or Escape to cancel.",
    description:
      "Screen reader instructions for a drag handle in a data grid's column settings dialog",
  },
  "uic.DataGrid.reorderPickedUp": {
    defaultMessage: "Picked up {column}. It is at position {position} of {total}.",
    description:
      "Screen reader announcement when a column is picked up for reordering in the column settings dialog. {position} is 1-based",
  },
  "uic.DataGrid.reorderMoved": {
    defaultMessage: "{column} moved to position {position} of {total}.",
    description:
      "Screen reader announcement while a picked-up column moves in the column settings dialog. {position} is 1-based",
  },
  "uic.DataGrid.reorderDropped": {
    defaultMessage: "{column} dropped at position {position} of {total}.",
    description:
      "Screen reader announcement when a column is dropped in the column settings dialog. {position} is 1-based",
  },
  "uic.DataGrid.reorderCancelled": {
    defaultMessage:
      "Reordering cancelled. {column} is back at position {position} of {total}.",
    description:
      "Screen reader announcement when reordering a column is cancelled in the column settings dialog. {position} is 1-based",
  },
  "uic.DataGrid.export": {
    defaultMessage: "Export",
    description: "Primary button of a data grid's CSV export dialog",
  },
});
