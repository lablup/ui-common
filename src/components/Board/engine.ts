/**
 * The board's layout engine: what the rest of the board does while one item
 * moves, resizes or leaves.
 *
 * The active item is placed where the user put it. Every item it overlaps
 * moves, in reading order: into the space the active item vacated when it fits
 * there without touching anything, else straight down to the row below the
 * item that displaced it, keeping its column. Whatever a moved item now
 * overlaps moves in turn. Then every item but the active one floats up to the
 * lowest row it can reach without overlapping another. Pushing only moves
 * items down and floating only up to a free row, so both end.
 *
 * Each result is computed from the layout the operation started with, so a
 * preview depends on where the active item is, not on the path it took.
 */
import { compareLayoutItems, type GridLayout, type GridLayoutItem } from "./layout";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

function rows(items: ReadonlyArray<GridLayoutItem>): number {
  return items.reduce((max, item) => Math.max(max, item.y + item.height), 0);
}

function fitsVacated(
  items: ReadonlyArray<GridLayoutItem>,
  item: GridLayoutItem,
  vacated: Rect,
  columns: number,
): boolean {
  if (item.width > vacated.width || item.height > vacated.height) return false;
  const candidate = { ...item, x: vacated.x, y: vacated.y };
  if (candidate.x + candidate.width > columns) return false;
  return !items.some((other) => other.id !== item.id && intersects(other, candidate));
}

function pushDown(
  items: GridLayoutItem[],
  activeId: string | null,
  vacated: Rect | null,
  columns: number,
): void {
  // Without an active item (a removal) nothing is displaced.
  const queue = items.filter((item) => item.id === activeId);
  while (queue.length > 0) {
    const over = queue.shift() as GridLayoutItem;
    const pushed = items
      .filter(
        (item) => item.id !== over.id && item.id !== activeId && intersects(item, over),
      )
      .sort(compareLayoutItems);
    for (const item of pushed) {
      if (vacated && fitsVacated(items, item, vacated, columns)) {
        item.x = vacated.x;
        item.y = vacated.y;
        continue;
      }
      // Just below the pusher, keeping the vertical order; what it now
      // overlaps is pushed in turn. Every push moves an item down, so this ends.
      item.y = over.y + over.height;
      queue.push(item);
    }
  }
}

function floatUp(items: GridLayoutItem[], activeId: string | null): void {
  const sorted = [...items].sort(compareLayoutItems);
  for (const item of sorted) {
    if (item.id === activeId) continue;
    while (item.y > 0) {
      const probe = { ...item, y: item.y - 1 };
      if (items.some((other) => other.id !== item.id && intersects(other, probe)))
        break;
      item.y -= 1;
    }
  }
}

function settle(
  layout: GridLayout,
  items: GridLayoutItem[],
  activeId: string | null,
  vacated: Rect | null = null,
): GridLayout {
  pushDown(items, activeId, vacated, layout.columns);
  floatUp(items, activeId);
  items.sort(compareLayoutItems);
  return { items, columns: layout.columns, rows: rows(items) };
}

/** The layout with `itemId` moved to `(x, y)`, the rest displaced as needed. */
export function moveItem(
  layout: GridLayout,
  itemId: string,
  x: number,
  y: number,
): GridLayout {
  const origin = layout.items.find((item) => item.id === itemId) ?? null;
  const items = layout.items.map((item) =>
    item.id === itemId ? { ...item, x, y } : { ...item },
  );
  return settle(layout, items, itemId, origin);
}

/** The layout with `itemId` spanning `width` x `height`, the rest displaced as needed. */
export function resizeItem(
  layout: GridLayout,
  itemId: string,
  width: number,
  height: number,
): GridLayout {
  const items = layout.items.map((item) =>
    item.id === itemId ? { ...item, width, height } : { ...item },
  );
  return settle(layout, items, itemId);
}

/** The layout without `itemId`, the rest floated up into its place. */
export function removeItem(layout: GridLayout, itemId: string): GridLayout {
  const items = layout.items
    .filter((item) => item.id !== itemId)
    .map((item) => ({ ...item }));
  return settle(layout, items, null);
}
