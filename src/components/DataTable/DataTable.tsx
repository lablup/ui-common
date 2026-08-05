/**
 * DataTable Component (epic #2730 / issue #2738 · sort: epic #2859 / issue #2861)
 *
 * Generic, type-safe table primitive modeled after the Backend.AI WebUI
 * `BAITable`. Designed so future menus (Models, Sessions, Data, ...)
 * can share one tabular surface instead of inventing a new one each
 * time.
 *
 * Features (V1 — additional capabilities planned for follow-up issues):
 * - Type-safe column definitions with custom cell renderers
 * - Optional column-visibility persistence via `localStorage` when
 *   `persistKey` is supplied
 * - Optional resizable columns (drag the right edge of a header cell)
 *   with widths persisted alongside visibility
 * - Empty-state slot rendered when `rows` is empty
 * - Loading-state slot rendered when `loading` is `true`
 * - Stable `getRowKey` accessor so rows with the same identifier remain
 *   referentially identical across event-driven updates
 *
 * Sorting (V2 — epic #2859 / issue #2861):
 * - Optional per-column sortable flag with sort value accessor or
 *   custom comparator
 * - Optional defaultSortDirection per column
 * - Controlled (`sortColumnId` + `sortDirection` + `onSortChange`) and
 *   uncontrolled (internal state) modes
 * - Accessible `aria-sort` attributes on header cells
 * - Keyboard activation (Enter / Space) for sortable headers
 * - Stable sort — equal-valued rows retain their original order
 * - Sorting never mutates the original `rows` prop
 *
 * The component is intentionally domain-agnostic — it MUST NOT carry
 * Session, Model, or Agent-specific knowledge. The first consumer is
 * `SessionListTable` (epic #2730 / #2738) but the API is generic.
 */

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./DataTable.css";

// ============================================================================
// Public types
// ============================================================================

/** Direction a column is currently sorted. */
export type SortDirection = "asc" | "desc";

export interface DataTableColumn<T> {
  /** Unique identifier for the column. Used for visibility + width persistence. */
  id: string;
  /** Header label. */
  header: ReactNode;
  /**
   * Cell renderer. Receives the row and returns a React node. Pure
   * functions are encouraged so memoization stays effective.
   */
  render: (row: T, index: number) => ReactNode;
  /** Optional minimum column width in pixels. Defaults to 80. */
  minWidth?: number;
  /** Optional initial width in pixels (only honored on the first paint). */
  initialWidth?: number;
  /** When `true`, the column cannot be resized. Defaults to `false`. */
  noResize?: boolean;
  /** When `true`, the column cannot be hidden by the user. Defaults to `false`. */
  alwaysVisible?: boolean;
  /** Extra `class` for the column's `<th>` and `<td>` cells. */
  className?: string;
  /**
   * When provided, the value is exposed via the `align` style on the
   * column's cells. Useful for right-aligned numeric columns.
   */
  align?: "left" | "right" | "center";

  // ---- Sorting API (added epic #2859 / issue #2861) -------------------------

  /**
   * When `true`, the column header renders a sort affordance and clicking
   * (or pressing Enter / Space) cycles through ascending → descending →
   * unsorted states. Defaults to `false`.
   */
  sortable?: boolean;
  /**
   * Extracts a primitive comparable value from a row for sorting purposes.
   * Used when the default ascending/descending behavior is sufficient.
   * Mutually exclusive with `sortComparator` — if both are provided,
   * `sortComparator` takes precedence.
   *
   * @example
   * ```tsx
   * sortValueAccessor: (row) => row.name.toLowerCase()
   * ```
   */
  sortValueAccessor?: (row: T) => string | number | boolean | null | undefined;
  /**
   * Custom comparator used for sorting. Receives two rows and the active
   * sort direction. Return a negative number if `a` should come first, a
   * positive number if `b` should come first, or `0` if they are equal.
   * The table applies a stable fallback on `0` to preserve original order.
   *
   * @example
   * ```tsx
   * sortComparator: (a, b, dir) =>
   *   dir === "asc"
   *     ? a.createdAt - b.createdAt
   *     : b.createdAt - a.createdAt
   * ```
   */
  sortComparator?: (a: T, b: T, direction: SortDirection) => number;
  /**
   * The sort direction applied when this column is first activated.
   * Defaults to `"asc"`.
   */
  defaultSortDirection?: SortDirection;
}

export interface DataTablePersistedState {
  /** column id → user-overridden width in pixels. */
  widths: Record<string, number>;
  /** column id → visibility flag. Missing keys count as visible. */
  visibility: Record<string, boolean>;
}

export interface DataTableProps<T> {
  /** Column definitions, in display order. */
  columns: DataTableColumn<T>[];
  /** Row data. */
  rows: T[];
  /**
   * Stable identifier accessor — used as the React key for each row.
   * Must be deterministic for the lifetime of the row.
   */
  getRowKey: (row: T, index: number) => string;
  /** Render this node when `rows` is empty. */
  emptyState?: ReactNode;
  /** Render this node when `loading` is `true`. */
  loadingState?: ReactNode;
  /** When `true`, the loading slot replaces the table body. */
  loading?: boolean;
  /**
   * When provided, column widths and visibility settings are persisted
   * to `localStorage` under this key. Use a stable, namespaced string
   * (e.g. `"sessions.activeTab"`).
   */
  persistKey?: string;
  /** Extra class for the table's wrapping element. */
  className?: string;
  /** ARIA label for the table. Defaults to "Data table". */
  ariaLabel?: string;
  /** Test ID for testing harnesses. */
  testId?: string;
  /**
   * Callback invoked when a row is clicked. When provided, rows render
   * with a clickable affordance (cursor: pointer + keyboard binding).
   */
  onRowClick?: (row: T) => void;

  // ---- Sorting props (added epic #2859 / issue #2861) -----------------------

  /**
   * Controlled — the column currently being sorted. Pass `undefined` to
   * indicate no active sort. When this prop is present, the component
   * operates in controlled mode: the caller is responsible for updating
   * the sort state via `onSortChange`.
   */
  sortColumnId?: string;
  /**
   * Controlled — the direction of the active sort. Ignored when
   * `sortColumnId` is `undefined`.
   */
  sortDirection?: SortDirection;
  /**
   * Called when the user activates a sortable column header. In
   * controlled mode the caller must propagate this back as
   * `sortColumnId` / `sortDirection`. In uncontrolled mode this prop is
   * purely observational.
   *
   * @param columnId  The column being sorted, or `undefined` when the
   *                  sort is cleared.
   * @param direction The new direction.
   */
  onSortChange?: (
    columnId: string | undefined,
    direction: SortDirection | undefined,
  ) => void;
}

// ============================================================================
// Storage helpers
// ============================================================================

const STORAGE_NAMESPACE = "dataTable";

function buildStorageKey(persistKey: string): string {
  return `${STORAGE_NAMESPACE}.${persistKey}`;
}

/**
 * Load persisted state from `localStorage`. Returns an empty state on
 * any failure (missing storage, malformed JSON, schema drift) so the
 * component degrades gracefully.
 */
function loadPersistedState(persistKey: string | undefined): DataTablePersistedState {
  if (!persistKey || typeof window === "undefined") {
    return { widths: {}, visibility: {} };
  }
  try {
    const raw = window.localStorage.getItem(buildStorageKey(persistKey));
    if (!raw) return { widths: {}, visibility: {} };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return { widths: {}, visibility: {} };
    }
    const obj = parsed as { widths?: unknown; visibility?: unknown };
    const widths =
      typeof obj.widths === "object" && obj.widths !== null
        ? (obj.widths as Record<string, number>)
        : {};
    const visibility =
      typeof obj.visibility === "object" && obj.visibility !== null
        ? (obj.visibility as Record<string, boolean>)
        : {};
    return { widths, visibility };
  } catch {
    return { widths: {}, visibility: {} };
  }
}

function savePersistedState(
  persistKey: string | undefined,
  state: DataTablePersistedState,
): void {
  if (!persistKey || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(buildStorageKey(persistKey), JSON.stringify(state));
  } catch {
    // Quota exceeded / disabled storage — silently ignore.
  }
}

// ============================================================================
// Sorting helpers
// ============================================================================

/**
 * Stable sort — rows with equal comparison result keep their original
 * relative order. We achieve stability by augmenting each row with its
 * original index and using that as a tie-breaker.
 *
 * The input array is never mutated.
 */
function stableSort<T>(rows: T[], comparator: (a: T, b: T) => number): T[] {
  const indexed = rows.map((row, i) => ({ row, i }));
  indexed.sort((a, b) => {
    const result = comparator(a.row, b.row);
    return result !== 0 ? result : a.i - b.i;
  });
  return indexed.map(({ row }) => row);
}

/**
 * Builds a comparator from a `DataTableColumn` + active sort direction.
 * Falls back to string comparison when neither `sortComparator` nor
 * `sortValueAccessor` is provided on the column.
 */
function buildComparator<T>(
  col: DataTableColumn<T>,
  direction: SortDirection,
): (a: T, b: T) => number {
  const { sortComparator } = col;
  if (sortComparator) {
    return (a, b) => sortComparator(a, b, direction);
  }
  const accessor = col.sortValueAccessor;
  if (accessor) {
    return (a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      // Nullish values sort last regardless of direction.
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return direction === "asc" ? cmp : -cmp;
    };
  }
  // No accessor — unsortable in practice (column should not be sortable).
  return () => 0;
}

/**
 * Returns the `aria-sort` attribute value for a column header cell.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-sort
 */
function ariaSortValue(
  col: DataTableColumn<unknown>,
  activeSortColumnId: string | undefined,
  activeSortDirection: SortDirection | undefined,
): "ascending" | "descending" | "none" | undefined {
  if (!col.sortable) return undefined;
  if (col.id === activeSortColumnId) {
    return activeSortDirection === "asc" ? "ascending" : "descending";
  }
  return "none";
}

// Sort indicator icons rendered as inline SVG so there is no external
// asset dependency. They intentionally reuse design-token colours so they
// automatically adapt to light / dark themes.

function SortIcon({ direction }: { direction: SortDirection | "none" }) {
  if (direction === "none") {
    // Neutral chevron stack — both arrows in muted colour
    return (
      <span
        className="data-table__sort-icon data-table__sort-icon--none"
        aria-hidden="true"
      >
        <svg
          width="10"
          height="14"
          viewBox="0 0 10 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 1L1 5H9L5 1Z" fill="currentColor" opacity="0.35" />
          <path d="M5 13L9 9H1L5 13Z" fill="currentColor" opacity="0.35" />
        </svg>
      </span>
    );
  }
  if (direction === "asc") {
    return (
      <span
        className="data-table__sort-icon data-table__sort-icon--asc"
        aria-hidden="true"
      >
        <svg
          width="10"
          height="14"
          viewBox="0 0 10 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 1L1 5H9L5 1Z" fill="currentColor" />
          <path d="M5 13L9 9H1L5 13Z" fill="currentColor" opacity="0.25" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="data-table__sort-icon data-table__sort-icon--desc"
      aria-hidden="true"
    >
      <svg
        width="10"
        height="14"
        viewBox="0 0 10 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5 1L1 5H9L5 1Z" fill="currentColor" opacity="0.25" />
        <path d="M5 13L9 9H1L5 13Z" fill="currentColor" />
      </svg>
    </span>
  );
}

// ============================================================================
// Component
// ============================================================================

function DataTableInner<T>({
  columns,
  rows,
  getRowKey,
  emptyState,
  loadingState,
  loading = false,
  persistKey,
  className = "",
  ariaLabel = "Data table",
  testId,
  onRowClick,
  // Sorting (controlled)
  sortColumnId: controlledSortColumnId,
  sortDirection: controlledSortDirection,
  onSortChange,
}: DataTableProps<T>) {
  // ---- Persisted state (widths + visibility) -------------------------------
  const [persisted, setPersisted] = useState<DataTablePersistedState>(() =>
    loadPersistedState(persistKey),
  );

  // Refresh persisted state when the storage key changes (defensive — the
  // expected use case is a stable key).
  useEffect(() => {
    setPersisted(loadPersistedState(persistKey));
  }, [persistKey]);

  // ---- Sorting state (uncontrolled fallback) -------------------------------
  //
  // Controlled mode is detected by the presence of `sortColumnId` as a prop
  // (the caller explicitly manages the sort column). Using only this prop as
  // the signal (rather than OR-ing with `sortDirection`) avoids a
  // pathological state where `sortDirection` is set but `sortColumnId` is
  // not, which would enter controlled mode with no sort effect.
  //
  // Note: TypeScript cannot distinguish "prop not passed" from "prop passed
  // as undefined", so we rely on the convention that controlled callers
  // always pass both `sortColumnId` and `sortDirection` together.
  const isControlled =
    controlledSortColumnId !== undefined || controlledSortDirection !== undefined;

  const [internalSortColumnId, setInternalSortColumnId] = useState<string | undefined>(
    undefined,
  );
  const [internalSortDirection, setInternalSortDirection] = useState<
    SortDirection | undefined
  >(undefined);

  const activeSortColumnId = isControlled
    ? controlledSortColumnId
    : internalSortColumnId;
  const activeSortDirection = isControlled
    ? controlledSortDirection
    : internalSortDirection;

  /** Handle a click / keypress on a sortable column header. */
  const handleSortToggle = useCallback(
    (col: DataTableColumn<T>) => {
      if (!col.sortable) return;

      let nextColumnId: string | undefined;
      let nextDirection: SortDirection | undefined;

      if (activeSortColumnId !== col.id) {
        // Activate this column in its default direction.
        nextColumnId = col.id;
        nextDirection = col.defaultSortDirection ?? "asc";
      } else if (activeSortDirection === (col.defaultSortDirection ?? "asc")) {
        // Flip to the opposite direction.
        nextColumnId = col.id;
        nextDirection = activeSortDirection === "asc" ? "desc" : "asc";
      } else {
        // Already in the non-default direction — clear the sort.
        nextColumnId = undefined;
        nextDirection = undefined;
      }

      if (!isControlled) {
        setInternalSortColumnId(nextColumnId);
        setInternalSortDirection(nextDirection);
      }
      onSortChange?.(nextColumnId, nextDirection);
    },
    [activeSortColumnId, activeSortDirection, isControlled, onSortChange],
  );

  // ---- Visibility computation (column always-visible wins) -----------------
  const visibleColumns = useMemo(
    () =>
      columns.filter((col) => {
        if (col.alwaysVisible) return true;
        const flag = persisted.visibility[col.id];
        return flag !== false;
      }),
    [columns, persisted.visibility],
  );

  // ---- Width resolution ----------------------------------------------------
  const resolveWidth = useCallback(
    (col: DataTableColumn<T>): number | undefined => {
      const persistedWidth = persisted.widths[col.id];
      if (typeof persistedWidth === "number" && persistedWidth > 0) {
        return persistedWidth;
      }
      return col.initialWidth;
    },
    [persisted.widths],
  );

  // ---- Resize handling -----------------------------------------------------
  const resizeRef = useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
    minWidth: number;
  } | null>(null);

  const beginResize = useCallback(
    (
      ev: React.MouseEvent<HTMLDivElement>,
      col: DataTableColumn<T>,
      currentWidth: number,
    ) => {
      if (col.noResize) return;
      ev.preventDefault();
      ev.stopPropagation();
      resizeRef.current = {
        columnId: col.id,
        startX: ev.clientX,
        startWidth: currentWidth,
        minWidth: col.minWidth ?? 80,
      };

      const onMove = (e: MouseEvent) => {
        const ref = resizeRef.current;
        if (!ref) return;
        const delta = e.clientX - ref.startX;
        const next = Math.max(ref.minWidth, ref.startWidth + delta);
        setPersisted((prev) => ({
          ...prev,
          widths: { ...prev.widths, [ref.columnId]: next },
        }));
      };
      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [],
  );

  // Persist when state changes
  useEffect(() => {
    savePersistedState(persistKey, persisted);
  }, [persistKey, persisted]);

  // ---- Sorted rows --------------------------------------------------------
  const sortedRows = useMemo(() => {
    if (!activeSortColumnId || !activeSortDirection) return rows;
    const col = columns.find((c) => c.id === activeSortColumnId);
    if (!col?.sortable) return rows;
    return stableSort(rows, buildComparator(col, activeSortDirection));
  }, [rows, columns, activeSortColumnId, activeSortDirection]);

  // ---- Body rendering ------------------------------------------------------
  const composedClassName = ["data-table", className].filter(Boolean).join(" ");

  const renderBody = () => {
    if (loading) {
      return (
        <tr className="data-table__row data-table__row--state">
          <td colSpan={visibleColumns.length || 1} className="data-table__state-cell">
            {loadingState ?? <div className="data-table__loading" />}
          </td>
        </tr>
      );
    }
    if (sortedRows.length === 0) {
      return (
        <tr className="data-table__row data-table__row--state">
          <td colSpan={visibleColumns.length || 1} className="data-table__state-cell">
            {emptyState}
          </td>
        </tr>
      );
    }
    return sortedRows.map((row, index) => {
      const key = getRowKey(row, index);
      return (
        <tr
          key={key}
          className={["data-table__row", onRowClick && "data-table__row--clickable"]
            .filter(Boolean)
            .join(" ")}
          onClick={
            onRowClick
              ? () => {
                  onRowClick(row);
                }
              : undefined
          }
          onKeyDown={
            onRowClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }
              : undefined
          }
          tabIndex={onRowClick ? 0 : undefined}
          role={onRowClick ? "button" : undefined}
        >
          {visibleColumns.map((col) => (
            <td
              key={col.id}
              className={[
                "data-table__cell",
                col.className,
                col.align && `data-table__cell--align-${col.align}`,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {col.render(row, index)}
            </td>
          ))}
        </tr>
      );
    });
  };

  return (
    <div className={composedClassName} data-testid={testId}>
      <table className="data-table__table" aria-label={ariaLabel} role="table">
        <thead className="data-table__head">
          <tr className="data-table__row data-table__row--head">
            {visibleColumns.map((col) => {
              const width = resolveWidth(col);
              const isSortActive = col.sortable && col.id === activeSortColumnId;

              return (
                <th
                  key={col.id}
                  scope="col"
                  className={[
                    "data-table__cell",
                    "data-table__cell--head",
                    col.sortable && "data-table__cell--sortable",
                    isSortActive && "data-table__cell--sort-active",
                    col.className,
                    col.align && `data-table__cell--align-${col.align}`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={width ? { width: `${String(width)}px` } : undefined}
                  aria-sort={ariaSortValue(
                    col as DataTableColumn<unknown>,
                    activeSortColumnId,
                    activeSortDirection,
                  )}
                  onClick={
                    col.sortable
                      ? () => {
                          handleSortToggle(col);
                        }
                      : undefined
                  }
                  onKeyDown={
                    col.sortable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSortToggle(col);
                          }
                        }
                      : undefined
                  }
                  tabIndex={col.sortable ? 0 : undefined}
                >
                  <span className="data-table__head-label">{col.header}</span>
                  {col.sortable && (
                    <SortIcon
                      direction={
                        isSortActive && activeSortDirection
                          ? activeSortDirection
                          : "none"
                      }
                    />
                  )}
                  {!col.noResize && (
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      className="data-table__resize-handle"
                      onMouseDown={(e) => {
                        beginResize(e, col, width ?? col.minWidth ?? 120);
                      }}
                    />
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="data-table__body">{renderBody()}</tbody>
      </table>
    </div>
  );
}

// Memoize while preserving the generic signature.
export const DataTable = memo(DataTableInner) as typeof DataTableInner;

export default DataTable;
