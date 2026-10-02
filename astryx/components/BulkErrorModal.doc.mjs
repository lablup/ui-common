/**
 * `astryx component BulkErrorModal` (and `ui-common component BulkErrorModal`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "BulkErrorModal",
  displayName: "BulkErrorModal",
  import: "@lablup/ui-common",
  category: "Overlay",
  keywords: ["bulk", "partial failure", "error report", "failed items", "batch"],
  description:
    "Reports the failures of a bulk operation: a Modal with a DataGrid of the failed items, in columns the caller describes, under an optional error banner with guidance. It has no footer; the header's close button, the backdrop or Escape close it. The grid is compact with column rules, pages at ten rows and hides its page bar on one page.",
  props: [
    {
      name: "columns",
      type: "ReadonlyArray<DataGridColumn<T>>",
      description: "How one failed item renders.",
      required: true,
    },
    {
      name: "data",
      type: "ReadonlyArray<T>",
      description: "One item per failure.",
      required: true,
    },
    {
      name: "idKey",
      type: "string | ((item: T) => Key)",
      description: "Row identity.",
      default: "'id', then key",
    },
    {
      name: "description",
      type: "ReactNode",
      description:
        "Guidance in an error banner above the grid. Without it there is no banner.",
    },
    {
      name: "descriptionTitle",
      type: "ReactNode",
      description: "The banner's title.",
      default: "the catalog's uic.BulkErrorModal.errorOccurred",
    },
    {
      name: "title",
      type: "ReactNode",
      description: "The modal's title.",
      default: "an error glyph and the catalog's uic.BulkErrorModal.title",
    },
    {
      name: "isOpen / onOpenChange",
      type: "boolean / (isOpen: boolean) => void",
      description: "Visibility, as on Modal.",
      required: true,
    },
    {
      name: "width",
      type: "number | string",
      description: "Modal width.",
      default: "720",
    },
  ],
  usage: {
    description:
      "Only for a partial failure; a wholly failed operation is one error notice. Keep the caller's form open behind it, so the user can fix the failed items and retry.",
  },
  examples: [
    {
      label: "Failed folder deletions",
      code: '<BulkErrorModal\n  isOpen={failures.length > 0}\n  onOpenChange={(open) => !open && setFailures([])}\n  description="Fix the failed folders and try again."\n  columns={[\n    { key: "name", header: "Folder", renderCell: (f) => f.name },\n    { key: "message", header: "Error", renderCell: (f) => f.message },\n  ]}\n  data={failures}\n/>',
    },
  ],
};
