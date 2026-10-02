/**
 * `astryx component DataGrid` (and `ui-common component DataGrid`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "DataGrid",
  displayName: "DataGrid",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: [
    "data grid",
    "table",
    "pagination",
    "sorting",
    "row selection",
    "column settings",
    "csv export",
    "expandable rows",
  ],
  description:
    "Astryx Table with what a list page needs around it: a page bar with a range line, client or server sorting, row selection by key, resizable and pinnable columns, expandable rows, per-user column settings (visibility, order, width in one overrides record) and a CSV export picker. Rows are paged unless pagination.totalItems says they already are one page. DataGridSettingsModal and DataGridExportModal, from the same import, are its dialogs on their own. Astryx Table props it does not own (isStriped, verticalAlign, aria-*) pass through.",
  props: [
    {
      name: "data",
      type: "ReadonlyArray<T>",
      description: "The rows.",
    },
    {
      name: "columns",
      type: "ReadonlyArray<DataGridColumn<T>>",
      description:
        "key, header, renderCell(item, index), width (px), minWidth, align, sortKey (sortable), compare (client sort), pin ('start' | 'end'), isAlwaysVisible, isHiddenByDefault, exportKeys, groupHeader, label, getCellProps.",
    },
    {
      name: "idKey",
      type: "string | ((item: T) => Key)",
      description:
        "Row identity. A missing field falls back to the row's key, then id, then position.",
      default: "'id'",
    },
    {
      name: "sort",
      type: "DataGridSort | null",
      description:
        "Controlled sort, { sortKey, direction }. Columns with compare sort on the client; others only report onSortChange.",
    },
    {
      name: "defaultSort",
      type: "DataGridSort | null",
      description: "Initial sort when uncontrolled.",
    },
    {
      name: "onSortChange",
      type: "(sort: DataGridSort | null) => void",
      description: "Called when a header changes the sort.",
    },
    {
      name: "pagination",
      type: "false | DataGridPagination",
      description:
        "page, defaultPage, pageSize, defaultPageSize, totalItems, onChange(page, pageSize), hasPageSizeSelector, isHiddenOnSinglePage, endContent, plus Astryx Pagination props. false shows every row and no bar.",
    },
    {
      name: "selection",
      type: "DataGridSelection<T>",
      description:
        "selectedKeys (controlled), onChange(keys, items), getIsItemEnabled (select-all leaves a disabled row as it is), getRowLabel, isPreservingOtherPages.",
    },
    {
      name: "columnSettings",
      type: "DataGridColumnSettings",
      description:
        "Shows the settings button. overrides / defaultOverrides / onOverridesChange hold { hidden, order, width } per column key; resized widths persist there too. isReorderable (default true).",
    },
    {
      name: "csvExport",
      type: "DataGridCsvExport",
      description:
        "Shows the export button: supportedKeys, onExport(keys) (the dialog closes when it resolves), notice.",
    },
    {
      name: "expansion",
      type: "DataGridExpansion<T>",
      description:
        "renderExpandedRow, getIsRowExpandable, expandedKeys / defaultExpandedKeys / onExpandedKeysChange, columnHeader, columnWidth.",
    },
    {
      name: "emptyState",
      type: "ReactNode | false",
      description:
        "Shown without rows. A string gets the default icon and layout, false shows nothing.",
      default: "the catalog's uic.DataGrid.noData",
    },
    {
      name: "isLoading",
      type: "boolean",
      description: "Dims the rows and blocks input while data is refetched.",
      default: "false",
    },
    {
      name: "isResizable",
      type: "boolean",
      description: "Drag-to-resize column borders.",
      default: "true",
    },
    {
      name: "scrollWidth",
      type: "number | string",
      description:
        "Scrolls horizontally with the table at this width; width-less columns size to their content.",
    },
    {
      name: "maxHeight",
      type: "number | string",
      description: "Caps the rows' height and makes the header sticky.",
    },
    {
      name: "isHeaderHidden",
      type: "boolean",
      description: "Hides the header row, and with it sorting and select-all.",
      default: "false",
    },
    {
      name: "getRowProps",
      type: "(item: T, index?: number) => HTMLAttributes<HTMLTableRowElement>",
      description: "Extra attributes for a body row.",
    },
    {
      name: "density",
      type: "'compact' | 'balanced' | 'spacious'",
      description: "Astryx Table density.",
      default: "'compact'",
    },
    {
      name: "dividers",
      type: "'rows' | 'columns' | 'grid' | 'none'",
      description:
        "Astryx Table dividers. Every value but grid adds a split between header cells.",
      default: "'rows'",
    },
    {
      name: "renderRange",
      type: "(range: { start: number; end: number; total: number }) => ReactNode",
      description: "The range line beside the page navigation.",
      default: "the catalog's uic.DataGrid.range",
    },
    {
      name: "expandRowLabel, invalidPageText, goToFirstPageLabel, paginationLabel, settingsLabel, exportLabel",
      type: "string",
      description: "Strings of the grid's chrome.",
      default: "the catalog's uic.DataGrid.* keys",
    },
  ],
  usage: {
    description:
      "A paged list with sorting and per-user columns. Persist columnSettings.overrides where the product keeps user settings. For server paging pass totalItems and the page's rows; for server sorting pass sort and onSortChange and leave compare off. The dialogs: DataGridSettingsModal (isOpen, onOpenChange, columns, visibleColumnKeys, isReorderable, onApply) and DataGridExportModal (isOpen, onOpenChange, columns with exportKeys, supportedKeys, onExport, notice).",
  },
  examples: [
    {
      label: "Server-paged grid with column settings",
      code: '<DataGrid\n  data={page.items}\n  idKey="id"\n  columns={[\n    { key: "name", header: "Name", renderCell: (u) => u.name, sortKey: "name", isAlwaysVisible: true },\n    { key: "email", header: "Email", renderCell: (u) => u.email, exportKeys: ["email"] },\n  ]}\n  sort={sort}\n  onSortChange={setSort}\n  pagination={{ page, pageSize, totalItems: page.total, onChange: setPage }}\n  columnSettings={{ overrides, onOverridesChange: setOverrides }}\n/>',
    },
  ],
};
