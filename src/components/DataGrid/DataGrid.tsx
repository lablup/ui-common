/**
 * DataGrid
 *
 * Astryx `Table` with the pieces a list page needs around it: a page bar with
 * a range line, client or server sorting, row selection by key, resizable
 * and pinnable columns, expandable rows, per-user column settings (visibility,
 * order, width) and a CSV export picker.
 *
 * Rows are sliced to the page unless `pagination.totalItems` says the caller
 * already sliced them. Sorting is client-side for columns with `compare`,
 * otherwise it only reports `onSortChange`. Column settings live in one
 * overrides record (`hidden`, `order`, `width` per column key) that a product
 * persists as it likes.
 *
 * Plugin order matters: Astryx runs columnSettings, sort, selection, then
 * unknown names in insertion order. `resize` / `sticky` / `scrollX` /
 * `scrollY` / `cellRow` / `expansion` read the final column list, and
 * `scrollY` runs before `cellRow` so a column's `getCellProps` wins.
 *
 * @example
 * <DataGrid
 *   data={users}
 *   idKey="id"
 *   columns={[
 *     { key: "name", header: "Name", renderCell: (u) => u.name, sortKey: "name" },
 *     { key: "email", header: "Email", renderCell: (u) => u.email },
 *   ]}
 *   sort={sort}
 *   onSortChange={setSort}
 *   pagination={{ page, pageSize, totalItems, onChange: setPage }}
 * />
 */
import {
  isValidElement,
  type Key,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TdHTMLAttributes,
} from "react";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Pagination, type PaginationProps } from "@astryxdesign/core/Pagination";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import {
  Table,
  pixel,
  proportional,
  useTableColumnResize,
  useTableColumnSettings,
  useTableSelection,
  useTableSortable,
  useTableStickyColumns,
  type TableColumn,
  type TablePlugin,
  type TableProps,
  type TableSortState,
} from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { ChevronDown, ChevronRight, FileDown, Inbox, Settings } from "lucide-react";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import {
  DataGridExportModal,
  type DataGridExportModalProps,
} from "./DataGridExportModal";
import {
  DataGridSettingsModal,
  type DataGridSettingsModalProps,
  type DataGridSettingsResult,
} from "./DataGridSettingsModal";
import { nodeToPlainText } from "./nodeToPlainText";
import "./DataGrid.css";

/** A row identity, as `idKey` returns it. */
export type DataGridKey = Key;

export type DataGridSortDirection = "ascending" | "descending";

/** The active sort: one column, by its `sortKey`. */
export interface DataGridSort {
  sortKey: string;
  direction: DataGridSortDirection;
}

export interface DataGridColumn<T> {
  /** Stable identity: column settings, widths and pinning use it. */
  key: string;
  /** Header content. It is clipped to the column width. */
  header?: ReactNode;
  /** Caption above the header, for a column that belongs to a group. */
  groupHeader?: ReactNode;
  /**
   * Plain-text name in the settings and export dialogs. Default: the text of
   * `groupHeader` and `header` joined with " / ", else the key.
   */
  label?: string;
  /** Cell content. `index` is the row's position on the current page. */
  renderCell?: (item: T, index: number) => ReactNode;
  /** Width in pixels. A resized width replaces it. Without one the column flexes. */
  width?: number;
  /** Lower bound, in pixels, of a flexing column. */
  minWidth?: number;
  align?: "start" | "center" | "end";
  /** Makes the column sortable. The sort state names it by this key. */
  sortKey?: string;
  /**
   * Sorts the rows on the client when this column is sorted. Compare in
   * ascending order; the grid reverses the result for descending.
   */
  compare?: (a: T, b: T, direction: DataGridSortDirection) => number;
  /**
   * Pins the column to an edge. Only the contiguous run of pinned columns at
   * each edge of the displayed order is pinned.
   */
  pin?: "start" | "end";
  /** Column settings cannot hide it. */
  isAlwaysVisible?: boolean;
  /** Hidden until the user shows it in the column settings. */
  isHiddenByDefault?: boolean;
  /** Fields this column exports as. Without them it cannot be exported. */
  exportKeys?: ReadonlyArray<string>;
  /** Extra attributes for this column's body cells. */
  getCellProps?: (item: T, index: number) => TdHTMLAttributes<HTMLTableCellElement>;
}

/** Per-column settings a user changed, keyed by column key. */
export interface DataGridColumnOverride {
  hidden?: boolean;
  /** Display position. Lower comes first. Set only after a reorder. */
  order?: number;
  /** Resized width in pixels. */
  width?: number;
}

export type DataGridColumnOverrides = Record<string, DataGridColumnOverride>;

export interface DataGridColumnSettings {
  /** Controlled overrides. */
  overrides?: DataGridColumnOverrides;
  /** Initial overrides when uncontrolled; always merged under `overrides`. */
  defaultOverrides?: DataGridColumnOverrides;
  onOverridesChange?: (overrides: DataGridColumnOverrides) => void;
  /** Whether the settings dialog lets the user reorder columns. Default: true */
  isReorderable?: boolean;
  /** Strings of the settings dialog. */
  modalProps?: Pick<
    DataGridSettingsModalProps,
    "title" | "subtitle" | "searchLabel" | "noMatchText" | "applyLabel" | "cancelLabel"
  >;
}

export interface DataGridCsvExport {
  /** Export keys the backend can produce. Columns asking for others are disabled. */
  supportedKeys: ReadonlyArray<string>;
  /** Runs the export with the chosen keys. The dialog closes when it resolves. */
  onExport: (keys: string[]) => Promise<void>;
  /** A warning above the column list, e.g. that the export is truncated. */
  notice?: ReactNode;
  /** Strings of the export dialog. */
  modalProps?: Pick<
    DataGridExportModalProps,
    "title" | "subtitle" | "searchLabel" | "noMatchText" | "exportLabel" | "cancelLabel"
  >;
}

export interface DataGridSelection<T> {
  /** The selected row keys. Selection is controlled. */
  selectedKeys?: ReadonlyArray<DataGridKey>;
  onChange?: (keys: string[], items: T[]) => void;
  /** Whether a row's checkbox is enabled. Select-all leaves a disabled row as it is. */
  getIsItemEnabled?: (item: T) => boolean;
  /** Accessible name of a row's checkbox. Default: the row key. */
  getRowLabel?: (item: T) => string;
  /** Select-all keeps keys of rows on other pages. Default: false */
  isPreservingOtherPages?: boolean;
}

export interface DataGridExpansion<T> {
  renderExpandedRow: (item: T, index: number) => ReactNode;
  getIsRowExpandable?: (item: T) => boolean;
  /** Controlled expanded row keys. */
  expandedKeys?: ReadonlyArray<DataGridKey>;
  defaultExpandedKeys?: ReadonlyArray<DataGridKey>;
  onExpandedKeysChange?: (keys: ReadonlyArray<DataGridKey>) => void;
  /** Header content of the expand-button column. */
  columnHeader?: ReactNode;
  /** Width in pixels of the expand-button column. */
  columnWidth?: number;
}

export interface DataGridPagination extends Omit<
  PaginationProps,
  | "page"
  | "totalItems"
  | "onChange"
  | "onPageSizeChange"
  | "label"
  | "ref"
  | "totalPages"
  | "hasMore"
> {
  /** Controlled page, 1-based. */
  page?: number;
  defaultPage?: number;
  defaultPageSize?: number;
  /**
   * Total row count. Without it the grid pages `data` itself; a total larger
   * than `data` declares the rows already sliced to the page.
   */
  totalItems?: number;
  onChange?: (page: number, pageSize: number) => void;
  /** Whether the bar offers a page-size choice. Default: true */
  hasPageSizeSelector?: boolean;
  /** Hides the page bar while every row fits on one page. Default: false */
  isHiddenOnSinglePage?: boolean;
  /** Content at the end of the bar. */
  endContent?: ReactNode;
}

type AnyRow = Record<string, unknown>;

export interface DataGridProps<T extends object = AnyRow> extends Omit<
  TableProps<AnyRow>,
  | "data"
  | "columns"
  | "idKey"
  | "rowIndexStart"
  | "rowCount"
  | "children"
  | "scrollWrapper"
  | "ref"
  | "emptyState"
  | "className"
  | "style"
  | "plugins"
  | "onChange"
> {
  data?: ReadonlyArray<T>;
  columns?: ReadonlyArray<DataGridColumn<T>>;
  /**
   * Row identity: a field name or a function. A missing field falls back to
   * the row's `key`, then its `id`, then its position.
   */
  idKey?: string | ((item: T) => DataGridKey);
  /** Dims the rows and blocks input while data is refetched. */
  isLoading?: boolean;
  /** Drag-to-resize column borders. Default: true */
  isResizable?: boolean;
  /** Controlled sort; `null` for none. */
  sort?: DataGridSort | null;
  defaultSort?: DataGridSort | null;
  onSortChange?: (sort: DataGridSort | null) => void;
  selection?: DataGridSelection<T>;
  /** The page bar. `false` shows every row and no bar. */
  pagination?: false | DataGridPagination;
  /** Enables the column settings button and persists resized widths. */
  columnSettings?: DataGridColumnSettings;
  /** Enables the CSV export button. */
  csvExport?: DataGridCsvExport;
  expansion?: DataGridExpansion<T>;
  /**
   * Shown in place of the rows when there are none. A string gets the default
   * icon and layout, a node is rendered as is, `false` shows nothing. Default:
   * the catalog's `uic.DataGrid.noData`.
   */
  emptyState?: ReactNode | false;
  /** Extra attributes for a body row. */
  getRowProps?: (
    item: T,
    index: number | undefined,
  ) => HTMLAttributes<HTMLTableRowElement>;
  /**
   * Scrolls horizontally with the table at this width (at least the
   * container's). Columns without a width then size to their content.
   */
  scrollWidth?: number | string;
  /** Caps the rows' height and makes the header sticky. */
  maxHeight?: number | string;
  /** Hides the header row, and with it sorting and select-all. */
  isHeaderHidden?: boolean;
  /** Accessible name of the expand buttons. Default: the catalog's `uic.DataGrid.expandRow` */
  expandRowLabel?: string;
  /** Shown when the page lies past the last one. Default: the catalog's `uic.DataGrid.invalidPage` */
  invalidPageText?: string;
  /** Default: the catalog's `uic.DataGrid.goToFirstPage` */
  goToFirstPageLabel?: string;
  /** Accessible name of the page navigation. Default: the catalog's `uic.DataGrid.pagination` */
  paginationLabel?: string;
  /** The range line beside the page navigation. Default: the catalog's `uic.DataGrid.range` */
  renderRange?: (range: { start: number; end: number; total: number }) => ReactNode;
  /** Default: the catalog's `uic.DataGrid.settings` */
  settingsLabel?: string;
  /** Default: the catalog's `uic.DataGrid.exportCsv` */
  exportLabel?: string;
  className?: string;
  style?: CSSProperties;
}

const EXPAND_COLUMN_KEY = "__uic_expand__";
/** Key of the checkbox column Astryx's selection plugin injects; not exported by Astryx. */
const SELECTION_COLUMN_KEY = "__xds_selection";
/**
 * Measured column widths, in pixels. Selection: Astryx's 24px first-column
 * inset + the 20px checkbox + an 8px trailing pad (the plugin's own 36 lets
 * the checkbox overhang its cell). Expand: the same inset + the 24px button +
 * 8px, or an 8px lead-in instead of the inset behind a selection column.
 */
const SELECTION_COLUMN_WIDTH = 52;
const EXPAND_COLUMN_WIDTH_FIRST = 56;
const EXPAND_COLUMN_WIDTH_AFTER_SELECTION = 40;
const MIN_COLUMN_WIDTH = 60;
const DETAIL_ROW_MARKER = "__uic_detail_for__";
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

const EMPTY_STATE_ICON = <Icon icon={Inbox} size="lg" color="secondary" />;

const X_HEADER_RELEASE: CSSProperties = { width: "auto", maxWidth: "none" };
const X_BODY_RELEASE: CSSProperties = { maxWidth: "none" };
// Inline beats the sticky-header rule's z 2 for pinned header cells.
const Y_PINNED_HEADER_STACK: CSSProperties = { zIndex: 3 };

const isDetailRow = (item: unknown): item is AnyRow =>
  !!item && typeof item === "object" && DETAIL_ROW_MARKER in item;

const toCssLength = (value: number | string): string =>
  typeof value === "number" ? `${value}px` : value;

function mergeCellStyle<P extends { htmlProps: { style?: CSSProperties } }>(
  props: P,
  extra: CSSProperties,
): P {
  return {
    ...props,
    htmlProps: {
      ...props.htmlProps,
      style: props.htmlProps.style ? { ...props.htmlProps.style, ...extra } : extra,
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** The label a column carries in the settings and export dialogs. */
export function dataGridColumnLabel<T>(column: DataGridColumn<T>): string {
  if (column.label) return column.label;
  const own = nodeToPlainText(column.header).trim();
  const group = nodeToPlainText(column.groupHeader).trim();
  const label = group && own ? `${group} / ${own}` : own || group;
  return label || column.key;
}

/** Whether a column shows, given the user's overrides. */
export function isDataGridColumnVisible<T>(
  column: Pick<DataGridColumn<T>, "key" | "isAlwaysVisible" | "isHiddenByDefault">,
  overrides?: DataGridColumnOverrides,
): boolean {
  if (column.isAlwaysVisible) return true;
  const hidden = overrides?.[column.key]?.hidden;
  return hidden !== undefined ? !hidden : !column.isHiddenByDefault;
}

/** Controlled when `value` is not undefined; the setter writes state only when uncontrolled. */
function useControllableState<V>(value: V | undefined, initial: () => V) {
  const [state, setState] = useState<V>(initial);
  const isControlled = value !== undefined;
  const current = isControlled ? value : state;
  const set = (next: V) => {
    if (!isControlled) setState(next);
  };
  return [current, set] as const;
}

export function DataGrid<T extends object = AnyRow>({
  data,
  columns = [],
  idKey = "id",
  isLoading = false,
  isResizable = true,
  sort: sortProp,
  defaultSort,
  onSortChange,
  selection,
  pagination,
  columnSettings,
  csvExport,
  expansion,
  emptyState,
  getRowProps,
  scrollWidth,
  maxHeight,
  isHeaderHidden = false,
  expandRowLabel,
  invalidPageText,
  goToFirstPageLabel,
  paginationLabel,
  renderRange,
  settingsLabel,
  exportLabel,
  density = "compact",
  dividers = "rows",
  hasHover = true,
  textOverflow = "truncate",
  className,
  style,
  ...tableProps
}: DataGridProps<T>): ReactElement {
  const t = useUicTranslator();

  const isScrollX = scrollWidth !== undefined;
  const isScrollY = maxHeight !== undefined;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  /* ---- column overrides (visibility / order / width) ------------------- */

  const [storedOverrides, setStoredOverrides] = useState<DataGridColumnOverrides>(
    () => columnSettings?.defaultOverrides ?? {},
  );
  const isOverridesControlled = columnSettings?.overrides !== undefined;
  const ownOverrides = isOverridesControlled
    ? (columnSettings?.overrides ?? {})
    : storedOverrides;
  const setOverrides = (next: DataGridColumnOverrides) => {
    if (!isOverridesControlled) setStoredOverrides(next);
    columnSettings?.onOverridesChange?.(next);
  };
  const overrides: DataGridColumnOverrides = {
    ...(columnSettings?.defaultOverrides ?? {}),
    ...ownOverrides,
  };
  const isReorderable = !!columnSettings && columnSettings.isReorderable !== false;

  /* ---- resized widths ---------------------------------------------------- */

  // With columnSettings a width rides in the overrides record, so a resize
  // persists like a visibility change; without it the width is local state.
  const [localWidths, setLocalWidths] = useState<Record<string, number>>({});
  const columnWidths: Record<string, number> = {};
  if (columnSettings) {
    for (const [key, override] of Object.entries(overrides)) {
      if (typeof override?.width === "number") columnWidths[key] = override.width;
    }
  } else {
    Object.assign(columnWidths, localWidths);
  }

  const handleResizeEnd = (updates: Record<string, number>) => {
    if (!columnSettings) {
      setLocalWidths((prev) => ({ ...prev, ...updates }));
      return;
    }
    const next: DataGridColumnOverrides = { ...ownOverrides };
    for (const [key, width] of Object.entries(updates)) {
      if (key === EXPAND_COLUMN_KEY) continue;
      next[key] = { ...next[key], width };
    }
    setOverrides(next);
  };

  /* ---- row keys ---------------------------------------------------------- */

  const getRowKey = (item: T): string => {
    if (typeof idKey === "function") return String(idKey(item));
    const row = item as AnyRow;
    const direct = row[idKey];
    if (direct != null) return String(direct);
    const fallback = row.key ?? row.id;
    if (fallback != null) return String(fallback);
    return `__row_${data ? data.indexOf(item) : -1}`;
  };

  /* ---- sort -------------------------------------------------------------- */

  const [activeSort, setActiveSort] = useControllableState<DataGridSort | null>(
    sortProp,
    () => defaultSort ?? null,
  );

  const sortedRows = ((): T[] => {
    const source = data ? [...data] : [];
    if (!activeSort) return source;
    const compare = columns.find(
      (column) => column.sortKey === activeSort.sortKey && column.compare,
    )?.compare;
    if (!compare) return source;
    const { direction } = activeSort;
    return source.sort((a, b) =>
      direction === "descending" ? -compare(a, b, direction) : compare(a, b, direction),
    );
  })();

  /* ---- pagination -------------------------------------------------------- */

  const pager = pagination === false ? undefined : (pagination ?? {});
  const [currentPage, setCurrentPage] = useControllableState<number>(
    pager?.page,
    () => pager?.defaultPage ?? 1,
  );
  const [pageSize, setPageSize] = useControllableState<number>(
    pager?.pageSize,
    () => pager?.defaultPageSize ?? DEFAULT_PAGE_SIZE,
  );

  // Astryx's Pagination answers a page-size pick with onPageSizeChange(size)
  // and then onChange(1) in the same event, still closing over the old size.
  // Forwarding the second call would undo the pick on a controlled grid, so it
  // is dropped; a microtask clears the flag.
  const isPageSizeChangingRef = useRef(false);

  const total = pager?.totalItems ?? sortedRows.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const activePage = clamp(currentPage, 1, lastPage);
  const isPageOutOfRange =
    !!pager && total > 0 && (currentPage < 1 || currentPage > lastPage);
  // A total above the rows in hand means they are already one page.
  const isServerSliced = total > sortedRows.length;
  const pagedRows =
    pager && !isServerSliced && sortedRows.length > pageSize
      ? sortedRows.slice((activePage - 1) * pageSize, activePage * pageSize)
      : sortedRows;
  const rows = isPageOutOfRange ? [] : pagedRows;

  /* ---- expansion --------------------------------------------------------- */

  const [storedExpandedKeys, setStoredExpandedKeys] = useState<DataGridKey[]>(() => [
    ...(expansion?.defaultExpandedKeys ?? []),
  ]);
  const expandedKeys = expansion?.expandedKeys ?? storedExpandedKeys;
  const expandedKeySet = new Set(expandedKeys.map(String));
  const hasExpansion = !!expansion;
  const expandColumnWidth =
    expansion?.columnWidth ??
    (selection ? EXPAND_COLUMN_WIDTH_AFTER_SELECTION : EXPAND_COLUMN_WIDTH_FIRST);
  const detailInsetStart = (selection ? SELECTION_COLUMN_WIDTH : 0) + expandColumnWidth;

  const toggleExpanded = (key: string) => {
    const next = expandedKeySet.has(key)
      ? expandedKeys.filter((k) => String(k) !== key)
      : [...expandedKeys, key];
    if (!expansion?.expandedKeys) setStoredExpandedKeys(next);
    expansion?.onExpandedKeysChange?.(next);
  };

  const rowIndexByKey = new Map<string, number>();
  rows.forEach((item, index) => rowIndexByKey.set(getRowKey(item), index));

  // Each expanded row is followed by a marker row the expansion plugin turns
  // into one full-width cell.
  const tableData: AnyRow[] = [];
  for (const item of rows) {
    tableData.push(item as AnyRow);
    if (!hasExpansion) continue;
    const key = getRowKey(item);
    if (expandedKeySet.has(key) && (expansion?.getIsRowExpandable?.(item) ?? true)) {
      tableData.push({ [DETAIL_ROW_MARKER]: key, id: `${key}__detail` });
    }
  }

  // From every row, not the page: selection resolves keys on other pages too.
  const itemByKey = new Map<string, T>();
  sortedRows.forEach((item) => itemByKey.set(getRowKey(item), item));

  /* ---- Astryx columns ---------------------------------------------------- */

  const tableColumns: TableColumn<AnyRow>[] = [];
  if (hasExpansion) {
    tableColumns.push({
      key: EXPAND_COLUMN_KEY,
      header: expansion?.columnHeader ?? "",
      width: pixel(expandColumnWidth),
      resizable: false,
      renderCell: (row) => {
        if (isDetailRow(row)) return null;
        const item = row as T;
        if (!(expansion?.getIsRowExpandable?.(item) ?? true)) return null;
        const key = getRowKey(item);
        return (
          <IconButton
            label={expandRowLabel ?? t("uic.DataGrid.expandRow")}
            icon={expandedKeySet.has(key) ? <ChevronDown /> : <ChevronRight />}
            variant="ghost"
            size="sm"
            onClick={() => toggleExpanded(key)}
          />
        );
      },
    });
  }

  for (const column of columns) {
    const width = columnWidths[column.key] ?? column.width;
    const header = (
      <span className="uic-data-grid__clip">
        {column.groupHeader == null ? (
          column.header
        ) : (
          <VStack gap={0} align="start">
            <Text type="supporting" color="secondary">
              {column.groupHeader}
            </Text>
            <span>{column.header}</span>
          </VStack>
        )}
      </span>
    );
    tableColumns.push({
      key: column.key,
      header,
      align: column.align === "start" ? undefined : column.align,
      sortable: column.sortKey ? { sortKey: column.sortKey } : false,
      resizable: isResizable,
      // In scroll-x mode a width-less column takes no width, so its content sizes it.
      width:
        width != null
          ? pixel(width)
          : isScrollX
            ? undefined
            : proportional(
                1,
                typeof column.minWidth === "number"
                  ? { minWidth: column.minWidth }
                  : undefined,
              ),
      renderCell: (row) => {
        if (isDetailRow(row)) return null;
        const item = row as T;
        const content = column.renderCell
          ? column.renderCell(item, rowIndexByKey.get(getRowKey(item)) ?? 0)
          : defaultCell(row[column.key]);
        if (textOverflow !== "truncate" || content == null) return content;
        return <span className="uic-data-grid__clip">{content}</span>;
      },
    });
  }

  /* ---- visibility + order ------------------------------------------------ */

  const visibleColumns = columnSettings
    ? columns.filter((column) => isDataGridColumnVisible(column, overrides))
    : [...columns];
  const orderedColumns = isReorderable
    ? visibleColumns
        .map((column, index) => ({ column, index }))
        .sort(
          (a, b) =>
            (overrides[a.column.key]?.order ?? Number.MAX_SAFE_INTEGER) -
              (overrides[b.column.key]?.order ?? Number.MAX_SAFE_INTEGER) ||
            a.index - b.index,
        )
        .map(({ column }) => column)
    : visibleColumns;
  const activeColumnKeys = [
    ...(hasExpansion ? [EXPAND_COLUMN_KEY] : []),
    ...orderedColumns.map((column) => column.key),
  ];

  const columnSettingsPlugin = useTableColumnSettings<AnyRow>({
    columns: [
      ...(hasExpansion
        ? [{ key: EXPAND_COLUMN_KEY, label: "", isAlwaysVisible: true }]
        : []),
      ...columns.map((column) => ({
        key: column.key,
        label: dataGridColumnLabel(column),
        isAlwaysVisible: !!column.isAlwaysVisible,
      })),
    ],
    activeColumnKeys,
    // The settings dialog owns the write path (it keeps `order` and `width`).
    onChangeActiveColumnKeys: () => {},
  });

  /* ---- pinning ----------------------------------------------------------- */

  const startKeys: string[] = [];
  for (const column of orderedColumns) {
    if (column.pin === "start") startKeys.push(column.key);
    else break;
  }
  const endKeys: string[] = [];
  for (const column of [...orderedColumns].reverse()) {
    if (column.pin === "end") endKeys.unshift(column.key);
    else break;
  }
  const stickyConfig = {
    startKeys:
      startKeys.length === 0
        ? undefined
        : [
            ...(selection ? [SELECTION_COLUMN_KEY] : []),
            ...(hasExpansion ? [EXPAND_COLUMN_KEY] : []),
            ...startKeys,
          ],
    endKeys: endKeys.length === 0 ? undefined : endKeys,
  };
  const stickyPlugin = useTableStickyColumns<AnyRow>(
    stickyConfig.startKeys || stickyConfig.endKeys ? stickyConfig : {},
  );

  /* ---- per-cell / per-row attributes -------------------------------------- */

  const columnByKey = new Map(columns.map((column) => [column.key, column]));

  const cellRowPlugin: TablePlugin<AnyRow> = {
    transformBodyCell: (props, column, row) => {
      if (isDetailRow(row)) return props;
      const item = row as T;
      const extra = columnByKey
        .get(column.key)
        ?.getCellProps?.(item, rowIndexByKey.get(getRowKey(item)) ?? 0);
      if (!extra) return props;
      return {
        ...props,
        htmlProps: {
          ...props.htmlProps,
          ...extra,
          style: { ...props.htmlProps.style, ...extra.style },
        },
      };
    },
    transformBodyRow: (props, row) => {
      if (!getRowProps || isDetailRow(row)) return props;
      const item = row as T;
      const extra = getRowProps(item, rowIndexByKey.get(getRowKey(item)));
      if (!extra) return props;
      return {
        ...props,
        htmlProps: {
          ...props.htmlProps,
          ...extra,
          style: { ...props.htmlProps.style, ...extra.style },
        },
      };
    },
  };

  // Astryx clips cells with `max-width: 0`; scroll-x releases width-less columns only.
  const scrollXPlugin: TablePlugin<AnyRow> = {
    transformHeaderCell: (props, column) =>
      column.width != null ? props : mergeCellStyle(props, X_HEADER_RELEASE),
    transformBodyCell: (props, column) =>
      column.width != null ? props : mergeCellStyle(props, X_BODY_RELEASE),
  };

  const pinnedKeys = new Set([
    ...(stickyConfig.startKeys ?? []),
    ...(stickyConfig.endKeys ?? []),
  ]);
  const scrollYPlugin: TablePlugin<AnyRow> = {
    transformHeaderCell: (props, column) =>
      pinnedKeys.has(column.key) ? mergeCellStyle(props, Y_PINNED_HEADER_STACK) : props,
  };

  /* ---- sorting ----------------------------------------------------------- */

  const sortState: TableSortState = activeSort
    ? [{ sortKey: activeSort.sortKey, direction: activeSort.direction }]
    : [];

  const sortPlugin = useTableSortable<AnyRow>({
    sort: sortState,
    allowUnsortedState: true,
    onSortChange: (next) => {
      const first = next[0];
      const nextSort: DataGridSort | null = first
        ? { sortKey: first.sortKey, direction: first.direction }
        : null;
      setActiveSort(nextSort);
      onSortChange?.(nextSort);
    },
  });

  /* ---- selection --------------------------------------------------------- */

  const selectedKeySet = new Set((selection?.selectedKeys ?? []).map(String));
  const emitSelection = (keys: string[]) => {
    const items = keys
      .map((key) => itemByKey.get(key))
      .filter((item) => item !== undefined);
    selection?.onChange?.(keys, items);
  };
  const isRowSelected = (item: T) => selectedKeySet.has(getRowKey(item));
  const isRowEnabled = (item: T) => selection?.getIsItemEnabled?.(item) ?? true;
  // Select-all acts on the enabled rows only; a disabled row keeps its state.
  const enabledRows = rows.filter(isRowEnabled);

  const selectionPlugin = useTableSelection<AnyRow>({
    getIsItemSelectable: (row) => !isDetailRow(row),
    getIsItemSelected: (row) => !isDetailRow(row) && isRowSelected(row as T),
    getIsItemEnabled: (row) => !isDetailRow(row) && isRowEnabled(row as T),
    getRowLabel: (row) =>
      isDetailRow(row)
        ? ""
        : (selection?.getRowLabel?.(row as T) ?? getRowKey(row as T)),
    getIsAllSelected: () => enabledRows.length > 0 && enabledRows.every(isRowSelected),
    getIsIndeterminate: () =>
      enabledRows.some(isRowSelected) && !enabledRows.every(isRowSelected),
    onSelectItem: ({ item, isSelected }) => {
      if (isDetailRow(item)) return;
      const key = getRowKey(item as T);
      const next = new Set(selectedKeySet);
      if (isSelected) next.add(key);
      else next.delete(key);
      emitSelection([...next]);
    },
    onSelectAll: ({ isAllSelected }) => {
      const next = new Set(selection?.isPreservingOtherPages ? selectedKeySet : []);
      for (const item of rows) {
        const key = getRowKey(item);
        const isSelected = isRowEnabled(item) ? isAllSelected : isRowSelected(item);
        if (isSelected) next.add(key);
        else next.delete(key);
      }
      emitSelection([...next]);
    },
  });

  const selectionWidthPlugin: TablePlugin<AnyRow> = {
    transformColumns: (cols) =>
      cols.map((column) =>
        column.key === SELECTION_COLUMN_KEY
          ? { ...column, width: pixel(SELECTION_COLUMN_WIDTH) }
          : column,
      ),
  };

  /* ---- resize ------------------------------------------------------------ */

  const resizePlugin = useTableColumnResize<AnyRow>({
    columns: tableColumns,
    columnWidths,
    minWidth: MIN_COLUMN_WIDTH,
    onColumnResizeEnd: handleResizeEnd,
  });

  /* ---- expansion --------------------------------------------------------- */

  const renderedColumnCount = activeColumnKeys.length + (selection ? 1 : 0);
  const expansionPlugin: TablePlugin<AnyRow> = {
    transformBodyRow: (props, row) => {
      if (!isDetailRow(row)) return props;
      const parentKey = String(row[DETAIL_ROW_MARKER]);
      const item = itemByKey.get(parentKey);
      if (!item) return props;
      return {
        ...props,
        children: (
          <td
            colSpan={renderedColumnCount}
            className="uic-data-grid__detail"
            style={{ paddingInlineStart: detailInsetStart }}
          >
            {expansion?.renderExpandedRow(item, rowIndexByKey.get(parentKey) ?? 0)}
          </td>
        ),
      };
    },
  };

  const plugins: Record<string, TablePlugin<AnyRow>> = {
    columnSettings: columnSettingsPlugin,
    sort: sortPlugin,
  };
  if (selection) {
    plugins.selection = selectionPlugin;
    plugins.selectionWidth = selectionWidthPlugin;
  }
  if (isResizable) plugins.resize = resizePlugin;
  plugins.sticky = stickyPlugin;
  if (isScrollX) plugins.scrollX = scrollXPlugin;
  // Without pinned columns the sticky header is pure CSS.
  if (isScrollY && pinnedKeys.size > 0) plugins.scrollY = scrollYPlugin;
  plugins.cellRow = cellRowPlugin;
  if (hasExpansion) plugins.expansion = expansionPlugin;

  /* ---- bottom bar -------------------------------------------------------- */

  const {
    page: _page,
    defaultPage: _defaultPage,
    defaultPageSize: _defaultPageSize,
    totalItems: _totalItems,
    onChange: _onChange,
    hasPageSizeSelector = true,
    isHiddenOnSinglePage = false,
    endContent,
    pageSizeOptions,
    size: pagerSize = "sm",
    ...paginationRest
  } = pager ?? {};

  const rangeStart = total === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(activePage * pageSize, total);
  const isPagerVisible = !!pager && !(isHiddenOnSinglePage && total <= pageSize);
  const hasBottomBar = isPagerVisible || !!columnSettings || !!csvExport;

  const emptyStateNode = isPageOutOfRange ? (
    // The way back outranks any empty state the caller gave.
    <EmptyState
      isCompact
      icon={EMPTY_STATE_ICON}
      title={invalidPageText ?? t("uic.DataGrid.invalidPage")}
      actions={
        <Button
          variant="primary"
          label={goToFirstPageLabel ?? t("uic.DataGrid.goToFirstPage")}
          onClick={() => {
            setCurrentPage(1);
            pager?.onChange?.(1, pageSize);
          }}
        />
      }
    />
  ) : emptyState === false ? (
    false
  ) : emptyState == null || typeof emptyState === "string" ? (
    <EmptyState
      isCompact
      icon={EMPTY_STATE_ICON}
      title={emptyState ?? t("uic.DataGrid.noData")}
    />
  ) : (
    emptyState
  );

  const applySettings = (result: DataGridSettingsResult) => {
    setIsSettingsOpen(false);
    const naturalOrder = columns.map((column) => column.key);
    const isReordered =
      isReorderable &&
      (result.columnOrder.length !== naturalOrder.length ||
        result.columnOrder.some((key, index) => key !== naturalOrder[index]));
    const next: DataGridColumnOverrides = {};
    for (const column of columns) {
      const override: DataGridColumnOverride = {};
      const shouldBeVisible = result.selectedColumnKeys.includes(column.key);
      if (shouldBeVisible === !!column.isHiddenByDefault)
        override.hidden = !shouldBeVisible;
      if (isReordered) {
        const orderIndex = result.columnOrder.indexOf(column.key);
        if (orderIndex !== -1) override.order = orderIndex;
      }
      // A settings change must not reset resized widths.
      const persistedWidth = overrides[column.key]?.width;
      if (typeof persistedWidth === "number") override.width = persistedWidth;
      if (Object.keys(override).length > 0) next[column.key] = override;
    }
    setOverrides(next);
  };

  return (
    <div
      className={["uic-data-grid", className].filter(Boolean).join(" ")}
      style={style}
    >
      <div
        aria-busy={isLoading || undefined}
        className={[
          "uic-data-grid__body",
          isLoading && "uic-data-grid__body--loading",
          isHeaderHidden && "uic-data-grid__body--no-header",
          dividers !== "grid" && "uic-data-grid__body--header-split",
          isScrollX && "uic-data-grid__body--scroll-x",
          isScrollY && "uic-data-grid__body--scroll-y",
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          {
            ...(isScrollX
              ? { "--uic-data-grid-scroll-width": toCssLength(scrollWidth) }
              : null),
            ...(isScrollY
              ? { "--uic-data-grid-max-height": toCssLength(maxHeight) }
              : null),
          } as CSSProperties
        }
      >
        <Table<AnyRow>
          {...tableProps}
          data={tableData}
          columns={tableColumns}
          idKey={(row: AnyRow) =>
            isDetailRow(row)
              ? `${String(row[DETAIL_ROW_MARKER])}__detail`
              : getRowKey(row as T)
          }
          density={density}
          dividers={dividers}
          hasHover={hasHover}
          textOverflow={textOverflow}
          emptyState={emptyStateNode}
          rowCount={total || undefined}
          rowIndexStart={pager ? (activePage - 1) * pageSize + 1 : undefined}
          plugins={plugins}
        />
      </div>

      {hasBottomBar ? (
        <HStack justify="end" align="center" gap={2} className="uic-data-grid__footer">
          {isPagerVisible ? (
            <>
              <Text type="supporting" color="secondary">
                {renderRange
                  ? renderRange({ start: rangeStart, end: rangeEnd, total })
                  : t("uic.DataGrid.range", {
                      start: rangeStart,
                      end: rangeEnd,
                      total,
                    })}
              </Text>
              <Pagination
                variant="pages"
                {...paginationRest}
                page={activePage}
                pageSize={pageSize}
                totalItems={total}
                // Astryx shows the size choice exactly when options are passed.
                pageSizeOptions={
                  hasPageSizeSelector
                    ? (pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS)
                    : undefined
                }
                size={pagerSize}
                label={paginationLabel ?? t("uic.DataGrid.pagination")}
                onChange={(page) => {
                  if (isPageSizeChangingRef.current) return;
                  setCurrentPage(page);
                  pager?.onChange?.(page, pageSize);
                }}
                onPageSizeChange={(nextSize) => {
                  isPageSizeChangingRef.current = true;
                  queueMicrotask(() => {
                    isPageSizeChangingRef.current = false;
                  });
                  setCurrentPage(1);
                  setPageSize(nextSize);
                  pager?.onChange?.(1, nextSize);
                }}
              />
            </>
          ) : null}
          {columnSettings ? (
            <IconButton
              label={settingsLabel ?? t("uic.DataGrid.settings")}
              icon={<Settings />}
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
            />
          ) : null}
          {csvExport ? (
            <IconButton
              label={exportLabel ?? t("uic.DataGrid.exportCsv")}
              icon={<FileDown />}
              variant="ghost"
              size="sm"
              onClick={() => setIsExportOpen(true)}
            />
          ) : null}
          {pager ? endContent : null}
        </HStack>
      ) : null}

      {columnSettings ? (
        <DataGridSettingsModal
          {...columnSettings.modalProps}
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          columns={columns.map((column) => ({
            key: column.key,
            label: dataGridColumnLabel(column),
            isAlwaysVisible: !!column.isAlwaysVisible,
          }))}
          visibleColumnKeys={orderedColumns.map((column) => column.key)}
          isReorderable={isReorderable}
          onApply={applySettings}
        />
      ) : null}

      {csvExport ? (
        <DataGridExportModal
          {...csvExport.modalProps}
          isOpen={isExportOpen}
          onOpenChange={setIsExportOpen}
          columns={columns.map((column) => ({
            key: column.key,
            label: dataGridColumnLabel(column),
            exportKeys: column.exportKeys ?? [],
          }))}
          supportedKeys={csvExport.supportedKeys}
          notice={csvExport.notice}
          onExport={async (keys) => {
            await csvExport.onExport(keys);
            setIsExportOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function defaultCell(value: unknown): ReactNode {
  if (value == null || value === "") return null;
  if (isValidElement(value)) return value;
  return String(value);
}
