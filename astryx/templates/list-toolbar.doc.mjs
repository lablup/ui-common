/** @type {import("@astryxdesign/cli/authoring").IntegrationTemplateDoc} */
export default {
  type: "block",
  name: "list-toolbar",
  displayName: "List Toolbar",
  description:
    "The toolbar above a list's table: a segment that switches the list's scope (Running / Finished) and a PowerSearch filter on the start side; the selection count with bulk actions and a refresh button with an auto-refresh countdown on the end side.",
  keywords: [
    "toolbar",
    "list toolbar",
    "table toolbar",
    "filter bar",
    "bulk actions",
    "bulk delete",
    "selection",
    "segment",
    "scope toggle",
    "refresh",
    "refresh button",
    "auto refresh",
    "fetch key",
  ],
  componentsUsed: [
    "SegmentedControl",
    "PowerSearch",
    "SelectionLabel",
    "IconButton",
    "CountdownBorder",
  ],
  category: "Table - Bulk Actions",
  aspectRatio: 16 / 7,
};
