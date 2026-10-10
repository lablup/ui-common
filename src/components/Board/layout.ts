/**
 * The board's layout model.
 *
 * Items persist as `BoardItem`s: spans plus a column offset per column count.
 * A board renders them as a `GridLayout` for the column count it has at the
 * moment, and writes a committed change back the same way. The two
 * conversions, `interpretItems` and `transformItems`, keep the model
 * compatible with layouts persisted by `@cloudscape-design/board-components`
 * (the board this one replaces), so a stored dashboard renders identically.
 */

export interface BoardItemDefinition {
  /** The least rows the item may take. Floor 2. @default 2 */
  minRowSpan?: number;
  /** The least columns the item may take. Floor 1. @default 1 */
  minColumnSpan?: number;
  /** Rows the item takes when it has no `rowSpan`. Floored at `minRowSpan`. */
  defaultRowSpan?: number;
  /** Columns the item takes when it has no `columnSpan`. Floored at `minColumnSpan`. */
  defaultColumnSpan?: number;
}

export interface BoardItem<D = unknown> {
  /** Unique on the board. */
  id: string;
  definition?: BoardItemDefinition;
  /**
   * Column offset per column count, e.g. `{ 4: 2, 6: 3 }`. Written back by
   * `onItemsChange`; an offset that no longer fits renders at 0.
   */
  columnOffset?: Readonly<Record<number, number>>;
  /** Rows, from 2. Written back by `onItemsChange` after a resize. */
  rowSpan?: number;
  /** Columns, from 1. Written back by `onItemsChange` after a resize. */
  columnSpan?: number;
  data: D;
}

export interface GridLayoutItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridLayout {
  items: GridLayoutItem[];
  columns: number;
  rows: number;
}

export const MIN_ROW_SPAN = 2;
export const MIN_COL_SPAN = 1;

type Spanned = Pick<BoardItem, "definition" | "rowSpan" | "columnSpan">;

export function getMinColumnSpan(item: Spanned, columns: number): number {
  return Math.min(columns, Math.max(MIN_COL_SPAN, item.definition?.minColumnSpan ?? 0));
}

export function getDefaultColumnSpan(item: Spanned, columns: number): number {
  return Math.min(
    columns,
    Math.max(getMinColumnSpan(item, columns), item.definition?.defaultColumnSpan ?? 0),
  );
}

export function getMinRowSpan(item: Spanned): number {
  return Math.max(MIN_ROW_SPAN, item.definition?.minRowSpan ?? 0);
}

export function getDefaultRowSpan(item: Spanned): number {
  return Math.max(getMinRowSpan(item), item.definition?.defaultRowSpan ?? 0);
}

/** The span an item renders with: its own, clamped to its minimum and the board. */
export function getColumnSpan(item: Spanned, columns: number): number {
  const span = item.columnSpan ?? getDefaultColumnSpan(item, columns);
  return Math.min(columns, Math.max(getMinColumnSpan(item, columns), span));
}

export function getRowSpan(item: Spanned): number {
  return Math.max(getMinRowSpan(item), item.rowSpan ?? getDefaultRowSpan(item));
}

/** Reading order: by row, then by column. */
export function compareLayoutItems(a: GridLayoutItem, b: GridLayoutItem): number {
  if (a.y !== b.y) return a.y - b.y;
  return a.x - b.x;
}

/**
 * Lays the items out on `columns` columns.
 *
 * Each item in turn takes `columnOffset[columns]` when it fits there, else the
 * first offset, scanning right from where the previous item ended and then
 * from the start, where it fits without rising above the tallest column; the
 * row is the height of the columns it covers. The result is in reading order.
 */
export function interpretItems<D>(
  items: ReadonlyArray<BoardItem<D>>,
  columns: number,
): GridLayout {
  const columnHeights: number[] = Array<number>(columns).fill(0);

  const rowOffset = (x: number, width: number): number => {
    let row = 0;
    for (let col = x; col < x + width; col++) {
      row = Math.max(row, columnHeights[col] ?? 0);
    }
    return row;
  };

  const findOffset = (from: number, width: number, height: number): number => {
    const total = rowOffset(0, columns);
    for (let x = from; x + width <= columns; x++) {
      if (rowOffset(x, width) + height <= total) return x;
    }
    for (let x = 0; x + width <= columns; x++) {
      if (rowOffset(x, width) + height <= total) return x;
    }
    return from;
  };

  const layoutItems: GridLayoutItem[] = [];
  let next = 0;
  for (const item of items) {
    const width = getColumnSpan(item, columns);
    const height = getRowSpan(item);
    const wanted = item.columnOffset?.[columns] ?? findOffset(next, width, height);
    const x = wanted + width <= columns ? wanted : 0;
    const y = rowOffset(x, width);
    layoutItems.push({ id: item.id, x, y, width, height });
    for (let col = x; col < x + width; col++) columnHeights[col] = y + height;
    next = x + width;
  }

  layoutItems.sort(compareLayoutItems);
  return { items: layoutItems, columns, rows: rowOffset(0, columns) };
}

/**
 * Writes a committed layout back into the items.
 *
 * The items come back in the layout's reading order, each with
 * `columnOffset[columns]` set to its x. The offsets stored for other column
 * counts are kept up to the first item whose position in the order changed
 * (or the resized item) and dropped from there on: a change at index n cannot
 * leave the placement of what follows valid on another column count.
 */
export function transformItems<D>(
  sourceItems: ReadonlyArray<BoardItem<D>>,
  layout: GridLayout,
  resizeTargetId?: string,
): BoardItem<D>[] {
  const byId = new Map(sourceItems.map((item) => [item.id, item]));
  const sorted = [...layout.items].sort(compareLayoutItems);

  let changeFrom = sorted.findIndex(
    ({ id }, index) => id !== sourceItems[index]?.id || id === resizeTargetId,
  );
  if (changeFrom === -1) changeFrom = sorted.length;

  return sorted.map(({ id, x, width, height }, index) => {
    const source = byId.get(id);
    if (!source) throw new Error(`Board: no item matches layout id "${id}".`);
    const item: BoardItem<D> = { ...source };
    const kept = index >= changeFrom ? undefined : item.columnOffset;
    item.columnOffset = { ...kept, [layout.columns]: x };
    if (id === resizeTargetId) {
      item.columnSpan = width;
      item.rowSpan = height;
    }
    return item;
  });
}

/** Whether two layouts place the same items the same way. */
export function isSameLayout(a: GridLayout, b: GridLayout): boolean {
  if (a.columns !== b.columns || a.items.length !== b.items.length) return false;
  const byId = new Map(b.items.map((item) => [item.id, item]));
  return a.items.every((item) => {
    const other = byId.get(item.id);
    return (
      other !== undefined &&
      other.x === item.x &&
      other.y === item.y &&
      other.width === item.width &&
      other.height === item.height
    );
  });
}
