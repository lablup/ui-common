/**
 * Board
 *
 * A dashboard grid of items the user can move and resize. The column count
 * follows the board's width; items persist as spans plus a column offset per
 * column count, the model `@cloudscape-design/board-components` used, so a
 * stored layout renders the same here (see `./layout.ts`). The board is
 * controlled: `onItemsChange` reports the whole board in its new order, and
 * what the parent passes back is what renders.
 *
 * A drag handle at an item's top-left corner moves it, a handle at the
 * bottom-right resizes it. Dragging a handle moves or resizes by pointer: the
 * item follows the pointer, the rest of the board previews where everything
 * lands, and releasing snaps to the grid. Clicking a handle, or pressing
 * Enter or Space on it, activates it instead: direction buttons appear around
 * it, and they or the arrow keys move or resize one cell at a time; Enter,
 * Space or leaving the handle commits, Escape discards. Neither handle renders
 * unless `isMovable` / `isResizable` says so. How the other items make room
 * is `./engine.ts`; every step is announced in a live region.
 *
 * @example
 * <Board
 *   items={items}
 *   isMovable
 *   isResizable
 *   variant="bordered"
 *   renderItem={(item) => <Panel {...item.data} />}
 *   onItemsChange={({ items }) => setItems(items)}
 * />
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { IconButton } from "@astryxdesign/core/IconButton";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import {
  appendPath,
  LayoutEngine,
  removeItem as removeFromLayout,
  type Direction,
  type LayoutShift,
  type Position,
  type Rect,
} from "./engine";
import {
  getMinColumnSpan,
  getMinRowSpan,
  interpretItems,
  transformItems,
  type BoardItem,
  type GridLayout,
} from "./layout";
import {
  autoScrollStep,
  compensateForScroll,
  findScrollParent,
  scrollBounds,
  type Point,
} from "./scroll";
import "./Board.css";

export type BoardOperation = "move" | "resize";

export interface BoardItemPlacement {
  /** Column, from 0. */
  x: number;
  /** Row, from 0. */
  y: number;
  width: number;
  height: number;
}

export interface BoardDndDetail<D = unknown> {
  item: BoardItem<D>;
  /** Where the item is at this step. */
  placement: BoardItemPlacement;
}

export interface BoardItemRemovedDetail<D = unknown> {
  item: BoardItem<D>;
}

export interface BoardItemsChangeDetail<D = unknown> {
  /** The whole board in its new order, spans and column offsets updated. */
  items: ReadonlyArray<BoardItem<D>>;
  movedItem?: BoardItem<D>;
  resizedItem?: BoardItem<D>;
  removedItem?: BoardItem<D>;
}

export interface BoardItemActions {
  /** Removes the item: `onItemsChange` fires with the rest, re-laid out. */
  removeItem: () => void;
}

export interface BoardColumnBreakpoint {
  /** The least content width, in px, at which the board has `columns` columns. */
  minWidth: number;
  columns: number;
}

/** Cloudscape's: 1 column under 688px, 2 under 912px, 4 under 2100px, else 6. */
export const DEFAULT_BOARD_COLUMN_BREAKPOINTS: ReadonlyArray<BoardColumnBreakpoint> = [
  { minWidth: 0, columns: 1 },
  { minWidth: 688, columns: 2 },
  { minWidth: 912, columns: 4 },
  { minWidth: 2100, columns: 6 },
];

/** How far a pointer travels before a press on a handle is a drag, not a click. */
export const CLICK_DRAG_THRESHOLD_PX = 3;

export interface BoardProps<D = unknown> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onChange"
> {
  items: ReadonlyArray<BoardItem<D>>;
  /** An item's content. The board draws the surface, border and handles around it. */
  renderItem: (item: BoardItem<D>, actions: BoardItemActions) => ReactNode;
  /** Called when the user moves, resizes or removes an item. */
  onItemsChange: (detail: BoardItemsChangeDetail<D>) => void;
  /** Whether items have a drag handle and can be moved. @default false */
  isMovable?: boolean;
  /** Whether items have a resize handle and can be resized. @default false */
  isResizable?: boolean;
  /** `bordered` draws a border on each item. @default 'plain' */
  variant?: "bordered" | "plain";
  /** Rendered in place of the grid when there are no items. */
  emptyContent?: ReactNode;
  /** Content width to column count. @default DEFAULT_BOARD_COLUMN_BREAKPOINTS */
  columnBreakpoints?: ReadonlyArray<BoardColumnBreakpoint>;
  /** An extra class on each item's surface; a function gets the item. */
  itemClassName?: string | ((item: BoardItem<D>) => string | undefined);
  /** Glyph of the drag handle. @default a grip */
  dragHandleIcon?: ReactNode;
  /** Glyph of the resize handle. @default a corner grip */
  resizeHandleIcon?: ReactNode;
  /** Accessible name of the drag handle. Default: the catalog's `uic.Board.dragHandle` */
  dragHandleLabel?: string;
  /** Accessible name of the resize handle. Default: the catalog's `uic.Board.resizeHandle` */
  resizeHandleLabel?: string;
  /** Announced when a move or resize starts. Default: `uic.Board.moveStarted` / `resizeStarted` */
  liveAnnouncementDndStarted?: (operation: BoardOperation) => string;
  /** Announced at each step of a move. Default: `uic.Board.itemMoved` */
  liveAnnouncementDndItemMoved?: (detail: BoardDndDetail<D>) => string;
  /** Announced at each step of a resize. Default: `uic.Board.itemResized` */
  liveAnnouncementDndItemResized?: (detail: BoardDndDetail<D>) => string;
  /** Announced when a move or resize is committed. Default: `uic.Board.moveCommitted` / `resizeCommitted` */
  liveAnnouncementDndCommitted?: (operation: BoardOperation) => string;
  /** Announced when a move or resize is discarded. Default: `uic.Board.moveDiscarded` / `resizeDiscarded` */
  liveAnnouncementDndDiscarded?: (operation: BoardOperation) => string;
  /** Announced when an item is removed. Default: `uic.Board.itemRemoved` */
  liveAnnouncementItemRemoved?: (detail: BoardItemRemovedDetail<D>) => string;
}

export interface BoardMetrics {
  cellWidth: number;
  cellHeight: number;
  gap: number;
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface PointerDrag {
  id: number;
  /** Where the pointer went down, and the grid's origin then. */
  start: Point;
  gridOrigin: Point;
  /** The last pointer position; re-applied when an ancestor scrolls. */
  last: Point;
  /** The item's box when the drag started, in px from the grid's origin. */
  itemBox: Box;
  /** The scroll-compensated travel, which a moved item translates by. */
  dx: number;
  dy: number;
  /** The live size of a resized item, in px. */
  size?: { width: number; height: number };
}

interface Transition {
  operation: BoardOperation;
  interaction: "pointer" | "keyboard";
  itemId: string;
  /** The layout when the operation started; its column count is frozen. */
  base: GridLayout;
  engine: LayoutEngine;
  /** The active item's placement at the start. */
  origin: Rect;
  /** Cells the operation went through, one step at a time. */
  path: Position[];
  /** The board at the path's end; null before the first step, or off the grid. */
  shift: LayoutShift | null;
  /** The cells under the pointer, for the placeholders. */
  hovered: Rect | null;
  metrics: BoardMetrics;
  pointer?: PointerDrag;
}

/** A press on a handle that has not yet travelled far enough to be a drag. */
interface PendingPress {
  operation: BoardOperation;
  itemId: string;
  pointerId: number;
  start: Point;
}

const gridOriginOf = (grid: HTMLElement | null): Point => {
  const rect = grid?.getBoundingClientRect();
  return { x: rect?.left ?? 0, y: rect?.top ?? 0 };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

export function columnsForWidth(
  width: number,
  breakpoints: ReadonlyArray<BoardColumnBreakpoint>,
): number {
  let columns = 0;
  for (const bp of [...breakpoints].sort((a, b) => a.minWidth - b.minWidth)) {
    if (bp.minWidth <= width) columns = bp.columns;
  }
  return columns;
}

const overlapArea = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

/**
 * The cells a box covers, in grid units: each edge of the box snaps to the
 * nearest edge among the cells it touches, and the cells inside the snapped
 * bounds are hovered. Null when the box touches no cell.
 */
export function hoveredCells(
  box: Box,
  columns: number,
  rows: number,
  metrics: BoardMetrics,
): Rect | null {
  const stepX = metrics.cellWidth + metrics.gap;
  const stepY = metrics.cellHeight + metrics.gap;
  const nearer = (min: number, current: number, edge: number) =>
    Math.abs(current - edge) < Math.abs(min - edge) ? current : min;
  const cellBox = (col: number, row: number): Box => ({
    left: col * stepX,
    top: row * stepY,
    right: col * stepX + metrics.cellWidth,
    bottom: row * stepY + metrics.cellHeight,
  });
  let bounds: Box = {
    left: Infinity,
    top: Infinity,
    right: Infinity,
    bottom: Infinity,
  };
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cell = cellBox(col, row);
      if (overlapArea(cell, box) > 0) {
        bounds = {
          left: nearer(bounds.left, cell.left, box.left),
          top: nearer(bounds.top, cell.top, box.top),
          right: nearer(bounds.right, cell.right, box.right),
          bottom: nearer(bounds.bottom, cell.bottom, box.bottom),
        };
      }
    }
  }
  let rect: Rect | null = null;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cell = cellBox(col, row);
      const inside =
        cell.top >= bounds.top &&
        cell.left >= bounds.left &&
        cell.right <= bounds.right &&
        cell.bottom <= bounds.bottom;
      if (!inside) continue;
      if (!rect) {
        rect = { x: col, y: row, width: 1, height: 1 };
      } else {
        const x = Math.min(rect.x, col);
        const y = Math.min(rect.y, row);
        rect = {
          x,
          y,
          width: Math.max(rect.x + rect.width, col + 1) - x,
          height: Math.max(rect.y + rect.height, row + 1) - y,
        };
      }
    }
  }
  return rect;
}

function GripGlyph() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="6" cy="3" r="1.5" />
      <circle cx="10" cy="3" r="1.5" />
      <circle cx="6" cy="8" r="1.5" />
      <circle cx="10" cy="8" r="1.5" />
      <circle cx="6" cy="13" r="1.5" />
      <circle cx="10" cy="13" r="1.5" />
    </svg>
  );
}

function CornerGlyph() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M13 8 8 13" />
      <path d="M13 3 3 13" />
    </svg>
  );
}

const ARROW_PATHS: Record<Direction, string> = {
  up: "M8 12V4M4 8l4-4 4 4",
  down: "M8 4v8M4 8l4 4 4-4",
  left: "M12 8H4M8 4 4 8l4 4",
  right: "M4 8h8M8 4l4 4-4 4",
};

function ArrowGlyph({ direction }: { direction: Direction }) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ARROW_PATHS[direction]} />
    </svg>
  );
}

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

const cx = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).join(" ");

export function Board<D = unknown>({
  items,
  renderItem,
  onItemsChange,
  isMovable = false,
  isResizable = false,
  variant = "plain",
  emptyContent,
  columnBreakpoints = DEFAULT_BOARD_COLUMN_BREAKPOINTS,
  itemClassName,
  dragHandleIcon,
  resizeHandleIcon,
  dragHandleLabel,
  resizeHandleLabel,
  liveAnnouncementDndStarted,
  liveAnnouncementDndItemMoved,
  liveAnnouncementDndItemResized,
  liveAnnouncementDndCommitted,
  liveAnnouncementDndDiscarded,
  liveAnnouncementItemRemoved,
  className,
  ...divProps
}: BoardProps<D>): ReactNode {
  const t = useUicTranslator();
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const shellRefs = useRef(new Map<string, HTMLDivElement>());
  const [width, setWidth] = useState<number | null>(null);
  const [transition, setTransitionState] = useState<Transition | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Event handlers read the latest transition and items without re-binding.
  const transitionRef = useRef<Transition | null>(null);
  const setTransition = (next: Transition | null) => {
    transitionRef.current = next;
    setTransitionState(next);
  };
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pendingRef = useRef<PendingPress | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (typeof ResizeObserver === "undefined") {
      setWidth(root.clientWidth);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setWidth(entry ? entry.contentRect.width : root.clientWidth);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const measuredColumns =
    width === null ? 0 : columnsForWidth(width, columnBreakpoints);
  const columns = transition ? transition.base.columns : measuredColumns;
  const layout = interpretItems(items, columns);

  const announceStarted = (operation: BoardOperation) =>
    setAnnouncement(
      liveAnnouncementDndStarted?.(operation) ??
        t(operation === "resize" ? "uic.Board.resizeStarted" : "uic.Board.moveStarted"),
    );
  const announceStep = (tr: Transition, placement: Rect) => {
    const item = itemsRef.current.find((it) => it.id === tr.itemId);
    if (!item) return;
    const detail: BoardDndDetail<D> = { item, placement: { ...placement } };
    setAnnouncement(
      tr.operation === "resize"
        ? (liveAnnouncementDndItemResized?.(detail) ??
            t("uic.Board.itemResized", {
              columns: placement.width,
              rows: placement.height,
            }))
        : (liveAnnouncementDndItemMoved?.(detail) ??
            t("uic.Board.itemMoved", {
              column: placement.x + 1,
              row: placement.y + 1,
            })),
    );
  };
  const announceEnd = (operation: BoardOperation, committed: boolean) =>
    setAnnouncement(
      committed
        ? (liveAnnouncementDndCommitted?.(operation) ??
            t(
              operation === "resize"
                ? "uic.Board.resizeCommitted"
                : "uic.Board.moveCommitted",
            ))
        : (liveAnnouncementDndDiscarded?.(operation) ??
            t(
              operation === "resize"
                ? "uic.Board.resizeDiscarded"
                : "uic.Board.moveDiscarded",
            )),
    );

  /** Cell geometry from the grid's styles, else from the item's own box. */
  const measure = (cols: number, itemId: string, placed: Rect): BoardMetrics => {
    const grid = gridRef.current;
    if (!grid) return { cellWidth: 0, cellHeight: 0, gap: 0 };
    const style = getComputedStyle(grid);
    const gap = parseFloat(style.rowGap) || 0;
    const shell = shellRefs.current.get(itemId)?.getBoundingClientRect();
    const fromShell = (size: number | undefined, cells: number) =>
      size === undefined ? 0 : Math.max((size - gap * (cells - 1)) / cells, 0);
    const gridWidth = grid.getBoundingClientRect().width;
    const cellWidth =
      gridWidth > 0 && cols > 0
        ? Math.max((gridWidth - gap * (cols - 1)) / cols, 0)
        : fromShell(shell?.width, placed.width);
    const cellHeight =
      parseFloat(style.gridAutoRows) || fromShell(shell?.height, placed.height);
    return { cellWidth, cellHeight, gap };
  };

  /** The active item's placement at the path's end. */
  const placementOf = (tr: Transition): Rect => {
    const placed = (tr.shift?.next ?? tr.base).items.find((it) => it.id === tr.itemId);
    return placed
      ? { x: placed.x, y: placed.y, width: placed.width, height: placed.height }
      : tr.origin;
  };

  /** How many rows the placeholder lattice has during the operation. */
  const latticeRows = (tr: Transition): number => {
    const current = tr.shift?.next ?? tr.base;
    const placed = placementOf(tr);
    return tr.operation === "resize"
      ? Math.max(current.rows, placed.y + placed.height + 1)
      : Math.max(current.rows, tr.base.rows + placed.height);
  };

  const start = (
    operation: BoardOperation,
    interaction: Transition["interaction"],
    itemId: string,
    pointer?: PointerDrag,
  ): Transition | null => {
    const base = interpretItems(itemsRef.current, columns);
    const placed = base.items.find((it) => it.id === itemId);
    if (!placed) return null;
    const origin: Rect = {
      x: placed.x,
      y: placed.y,
      width: placed.width,
      height: placed.height,
    };
    const next: Transition = {
      operation,
      interaction,
      itemId,
      base,
      engine: new LayoutEngine(base),
      origin,
      path:
        interaction === "keyboard"
          ? [
              operation === "resize"
                ? { x: origin.x + origin.width, y: origin.y + origin.height }
                : { x: origin.x, y: origin.y },
            ]
          : [],
      shift: null,
      hovered: null,
      metrics: measure(columns, itemId, origin),
      pointer,
    };
    setTransition(next);
    announceStarted(operation);
    return next;
  };

  /** The path extended to `position` and its shift; null when the engine refuses the step. */
  const stepTo = (
    tr: Transition,
    position: Position,
  ): { path: Position[]; shift: LayoutShift } | null => {
    const path = appendPath(tr.path, position);
    try {
      const shift =
        tr.operation === "resize"
          ? tr.engine.resize(tr.itemId, path)
          : tr.engine.move(tr.itemId, path);
      return { path, shift };
    } catch (error) {
      if (error instanceof RangeError) return null;
      throw error;
    }
  };

  // The handle that had focus when an operation ended. The commit may move
  // its item's node to a new place in the DOM, which drops focus; the handle
  // is focused again once the board has re-rendered.
  const refocusRef = useRef<{ itemId: string; operation: BoardOperation } | null>(null);

  const end = (): Transition | null => {
    const tr = transitionRef.current;
    if (!tr) return null;
    const shell = shellRefs.current.get(tr.itemId);
    const active = typeof document === "undefined" ? null : document.activeElement;
    refocusRef.current =
      shell && active instanceof HTMLElement && shell.contains(active)
        ? { itemId: tr.itemId, operation: tr.operation }
        : null;
    setTransition(null);
    pendingRef.current = null;
    return tr;
  };

  useEffect(() => {
    const target = refocusRef.current;
    if (!target || transition) return;
    refocusRef.current = null;
    const shell = shellRefs.current.get(target.itemId);
    const handle = shell?.querySelector<HTMLElement>(
      target.operation === "resize"
        ? ".uic-board-item__resize-handle"
        : ".uic-board-item__drag-handle",
    );
    if (handle && document.activeElement !== handle)
      handle.focus({ preventScroll: true });
  });

  const commit = () => {
    const tr = end();
    if (!tr) return;
    const { shift } = tr;
    const committable =
      shift !== null && shift.conflicts.length === 0 && shift.moves.length > 0;
    if (committable) {
      const resizeTarget = tr.operation === "resize" ? tr.itemId : undefined;
      const next = transformItems(itemsRef.current, shift.next, resizeTarget);
      const changed = next.find((it) => it.id === tr.itemId);
      onItemsChange(
        tr.operation === "resize"
          ? { items: next, resizedItem: changed }
          : { items: next, movedItem: changed },
      );
    }
    announceEnd(tr.operation, !(shift !== null && shift.conflicts.length > 0));
  };

  const discard = () => {
    const tr = end();
    if (tr) announceEnd(tr.operation, false);
  };
  const discardRef = useRef(discard);
  discardRef.current = discard;

  // Escape discards a pointer drag too, where no handle holds the keyboard.
  const isPointerDrag = transition?.pointer !== undefined;
  useEffect(() => {
    if (!isPointerDrag) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        discardRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPointerDrag]);

  const removeItemAction = (item: BoardItem<D>) => {
    const current = interpretItems(itemsRef.current, columns);
    const rest = itemsRef.current.filter((it) => it.id !== item.id);
    onItemsChange({
      items: transformItems(rest, removeFromLayout(current, item.id)),
      removedItem: item,
    });
    setAnnouncement(
      liveAnnouncementItemRemoved?.({ item }) ?? t("uic.Board.itemRemoved"),
    );
  };

  /** One keyboard or direction-button step of the active transition. */
  const stepBy = (tr: Transition, direction: Direction) => {
    const dx = direction === "left" ? -1 : direction === "right" ? 1 : 0;
    const dy = direction === "up" ? -1 : direction === "down" ? 1 : 0;
    const last = tr.path[tr.path.length - 1];
    if (!last) return;
    if (tr.operation === "resize") {
      const item = itemsRef.current.find((it) => it.id === tr.itemId);
      const placed = placementOf(tr);
      const minWidth = item ? getMinColumnSpan(item, tr.base.columns) : 1;
      const minHeight = item ? getMinRowSpan(item) : 1;
      if (placed.width + dx < minWidth || placed.height + dy < minHeight) return;
    }
    const stepped = stepTo(tr, { x: last.x + dx, y: last.y + dy });
    if (!stepped) return;
    const updated: Transition = { ...tr, ...stepped, hovered: null };
    setTransition(updated);
    announceStep(updated, placementOf(updated));
  };

  const onHandlePointerDown =
    (operation: BoardOperation, itemId: string) =>
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || transitionRef.current?.pointer) return;
      // jsdom has no pointer capture.
      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      pendingRef.current = {
        operation,
        itemId,
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
      };
    };

  const beginDrag = (press: PendingPress, point: Point): Transition | null => {
    const shell = shellRefs.current.get(press.itemId);
    const gridOrigin = gridOriginOf(gridRef.current);
    const rect = shell?.getBoundingClientRect();
    const itemBox: Box = rect
      ? {
          left: rect.left - gridOrigin.x,
          top: rect.top - gridOrigin.y,
          right: rect.right - gridOrigin.x,
          bottom: rect.bottom - gridOrigin.y,
        }
      : { left: 0, top: 0, right: 0, bottom: 0 };
    // A keyboard activation on a handle gives way to a drag from it.
    if (transitionRef.current) setTransition(null);
    return start(press.operation, "pointer", press.itemId, {
      id: press.pointerId,
      start: press.start,
      gridOrigin,
      last: point,
      itemBox,
      dx: 0,
      dy: 0,
    });
  };

  /** Moves the drag to a pointer position, in viewport coordinates. */
  const applyPointer = (tr: Transition, point: Point) => {
    const drag = tr.pointer;
    if (!drag) return;
    const travel = compensateForScroll(
      point,
      drag.start,
      drag.gridOrigin,
      gridOriginOf(gridRef.current),
    );
    const { itemBox } = drag;
    const { cellWidth, cellHeight, gap } = tr.metrics;
    const span = (cells: number, cell: number) =>
      Math.max(cells * cell + (cells - 1) * gap, 0);
    const item = itemsRef.current.find((it) => it.id === tr.itemId);
    const cols = tr.base.columns;
    const rows = latticeRows(tr);

    let box: Box;
    let size = drag.size;
    if (tr.operation === "resize") {
      const minWidth = span(item ? getMinColumnSpan(item, cols) : 1, cellWidth);
      const minHeight = span(item ? getMinRowSpan(item) : 1, cellHeight);
      const maxWidth = span(cols - tr.origin.x, cellWidth);
      size = {
        width: clamp(itemBox.right - itemBox.left + travel.x, minWidth, maxWidth),
        height: Math.max(itemBox.bottom - itemBox.top + travel.y, minHeight),
      };
      box = {
        left: itemBox.left,
        top: itemBox.top,
        right: itemBox.left + size.width,
        bottom: itemBox.top + size.height,
      };
    } else {
      box = {
        left: itemBox.left + travel.x,
        top: itemBox.top + travel.y,
        right: itemBox.right + travel.x,
        bottom: itemBox.bottom + travel.y,
      };
    }

    const hovered = hoveredCells(box, cols, rows, tr.metrics);
    const placed = placementOf(tr);
    // A moved item must have a whole place to land on; a resized one any cell.
    const onGrid =
      hovered !== null &&
      (tr.operation === "resize" ||
        hovered.width * hovered.height >= placed.width * placed.height);
    let { shift, path } = tr;
    if (!onGrid) {
      shift = null;
    } else {
      const next =
        tr.operation === "resize"
          ? { x: hovered.x + hovered.width, y: hovered.y + hovered.height }
          : { x: hovered.x, y: hovered.y };
      const last = path[path.length - 1];
      if (!last || last.x !== next.x || last.y !== next.y || shift === null) {
        const stepped = stepTo(tr, next);
        if (stepped) ({ shift, path } = stepped);
      }
    }
    const updated: Transition = {
      ...tr,
      shift,
      path,
      hovered: onGrid ? hovered : null,
      pointer: { ...drag, last: point, dx: travel.x, dy: travel.y, size },
    };
    // A pointer step is not announced: the board under the pointer shows it.
    setTransition(updated);
  };
  const applyPointerRef = useRef(applyPointer);
  applyPointerRef.current = applyPointer;

  const onHandlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const point = { x: event.clientX, y: event.clientY };
    const press = pendingRef.current;
    if (press && press.pointerId === event.pointerId) {
      const moved =
        Math.abs(point.x - press.start.x) > CLICK_DRAG_THRESHOLD_PX ||
        Math.abs(point.y - press.start.y) > CLICK_DRAG_THRESHOLD_PX;
      if (!moved) return;
      pendingRef.current = null;
      const tr = beginDrag(press, point);
      if (tr) applyPointer(tr, point);
      return;
    }
    const tr = transitionRef.current;
    if (!tr?.pointer || tr.pointer.id !== event.pointerId) return;
    applyPointer(tr, point);
  };

  // While a pointer drag is on: an ancestor scrolling moves the grid under a
  // still pointer, so the last position is re-applied; and a pointer held
  // near an edge of the nearest scroll container scrolls it, frame by frame.
  useEffect(() => {
    if (!isPointerDrag) return;
    const reapply = () => {
      const tr = transitionRef.current;
      if (tr?.pointer) applyPointerRef.current(tr, tr.pointer.last);
    };
    window.addEventListener("scroll", reapply, { capture: true, passive: true });

    const grid = gridRef.current;
    const container = grid ? findScrollParent(grid) : null;
    let frame = 0;
    const tick = () => {
      const tr = transitionRef.current;
      if (tr?.pointer && container) {
        const step = autoScrollStep(tr.pointer.last, scrollBounds(container));
        if (
          (step.x !== 0 || step.y !== 0) &&
          typeof container.scrollBy === "function"
        ) {
          container.scrollBy(step.x, step.y);
          reapply();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    if (typeof requestAnimationFrame === "function")
      frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", reapply, { capture: true });
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isPointerDrag]);

  const onHandlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const press = pendingRef.current;
    if (press && press.pointerId === event.pointerId) {
      // A click activates the handle for keyboard and button steps, or
      // commits the activation already on it.
      pendingRef.current = null;
      const tr = transitionRef.current;
      if (tr) commit();
      if (!(tr && tr.itemId === press.itemId && tr.operation === press.operation)) {
        start(press.operation, "keyboard", press.itemId);
      }
      return;
    }
    const tr = transitionRef.current;
    if (!tr?.pointer || tr.pointer.id !== event.pointerId) return;
    commit();
  };

  const onHandlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    if (pendingRef.current?.pointerId === event.pointerId) pendingRef.current = null;
    const tr = transitionRef.current;
    if (!tr?.pointer || tr.pointer.id !== event.pointerId) return;
    discard();
  };

  const onHandleKeyDown =
    (operation: BoardOperation, itemId: string) =>
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const tr = transitionRef.current;
      if (tr && (tr.itemId !== itemId || tr.operation !== operation)) return;
      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          // Arrows step only once the handle is activated (a click, Enter or Space).
          if (tr?.interaction !== "keyboard") return;
          event.preventDefault();
          stepBy(tr, event.key.slice(5).toLowerCase() as Direction);
          return;
        }
        case "Enter":
        case " ":
          event.preventDefault();
          if (tr) commit();
          else start(operation, "keyboard", itemId);
          return;
        case "Escape":
          if (tr) {
            event.preventDefault();
            discard();
          }
          return;
        default:
          return;
      }
    };

  const onHandleBlur = () => {
    const tr = transitionRef.current;
    if (tr?.interaction === "keyboard") commit();
  };

  const preview = transition ? (transition.shift?.next ?? transition.base) : null;
  const previewById = new Map(preview?.items.map((it) => [it.id, it]) ?? []);
  const activePlacement = transition ? placementOf(transition) : null;
  const hovered =
    transition?.hovered ??
    (transition?.interaction === "keyboard" && transition.shift
      ? activePlacement
      : null);
  const placeholders: ReactNode[] = [];
  if (transition) {
    const rows = latticeRows(transition);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const hover =
          hovered !== null &&
          col >= hovered.x &&
          col < hovered.x + hovered.width &&
          row >= hovered.y &&
          row < hovered.y + hovered.height;
        placeholders.push(
          <div
            key={`placeholder-${row}-${col}`}
            className={cx(
              "uic-board__placeholder",
              "uic-board__placeholder--active",
              hover && "uic-board__placeholder--hover",
            )}
            style={{
              gridColumn: `${col + 1} / span 1`,
              gridRow: `${row + 1} / span 1`,
            }}
          />,
        );
      }
    }
  }

  const itemById = new Map(items.map((item) => [item.id, item]));
  const toPx = (cells: number, cell: number) =>
    cells * (cell + (transition?.metrics.gap ?? 0));

  /** The direction buttons of an activated handle. */
  const renderDirections = (operation: BoardOperation, itemId: string) => {
    const shown =
      transition !== null &&
      transition.interaction === "keyboard" &&
      transition.itemId === itemId &&
      transition.operation === operation;
    if (!shown) return null;
    return DIRECTIONS.map((direction) => (
      <span
        key={direction}
        className={cx("uic-board__direction", `uic-board__direction--${direction}`)}
        role="presentation"
        data-direction={direction}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => {
          const current = transitionRef.current;
          if (current) stepBy(current, direction);
        }}
      >
        <ArrowGlyph direction={direction} />
      </span>
    ));
  };

  return (
    <div
      ref={rootRef}
      className={cx("uic-board", transition && "uic-board--active", className)}
      {...divProps}
    >
      {columns > 0 && items.length > 0 ? (
        <div
          ref={gridRef}
          className="uic-board__grid"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {placeholders}
          {layout.items.map((placed) => {
            const item = itemById.get(placed.id);
            if (!item) return null;
            const isActive = transition?.itemId === placed.id;
            const pointer = isActive ? transition?.pointer : undefined;
            let column = `${placed.x + 1} / span ${placed.width}`;
            let row = `${placed.y + 1} / span ${placed.height}`;
            let transform: string | undefined;
            let liveWidth: number | undefined;
            let liveHeight: number | undefined;
            if (transition && isActive && activePlacement) {
              if (transition.operation === "resize") {
                if (pointer?.size) {
                  liveWidth = pointer.size.width;
                  liveHeight = pointer.size.height;
                } else {
                  column = `${placed.x + 1} / span ${activePlacement.width}`;
                  row = `${placed.y + 1} / span ${activePlacement.height}`;
                }
              } else if (pointer) {
                transform = `translate(${pointer.dx}px, ${pointer.dy}px)`;
              } else {
                const { cellWidth, cellHeight } = transition.metrics;
                transform = `translate(${toPx(activePlacement.x - placed.x, cellWidth)}px, ${toPx(activePlacement.y - placed.y, cellHeight)}px)`;
              }
            } else if (transition) {
              const next = previewById.get(placed.id);
              if (next && (next.x !== placed.x || next.y !== placed.y)) {
                const { cellWidth, cellHeight } = transition.metrics;
                transform = `translate(${toPx(next.x - placed.x, cellWidth)}px, ${toPx(next.y - placed.y, cellHeight)}px)`;
              }
            }
            const style: CSSProperties = {
              gridColumn: column,
              gridRow: row,
              transform,
              width: liveWidth,
              height: liveHeight,
            };
            const extra =
              typeof itemClassName === "function" ? itemClassName(item) : itemClassName;
            return (
              <div
                key={item.id}
                ref={(node) => {
                  if (node) shellRefs.current.set(item.id, node);
                  else shellRefs.current.delete(item.id);
                }}
                className={cx(
                  "uic-board-item",
                  variant === "bordered" && "uic-board-item--bordered",
                  isActive && "uic-board-item--active",
                  // The slide is the item's own class, so it and the
                  // transform leave in one update: a transition that lived on
                  // an ancestor could outlive the transform by a style pass.
                  transition !== null && "uic-board-item--sliding",
                  pointer &&
                    transition?.operation === "move" &&
                    "uic-board-item--dragging",
                  pointer &&
                    transition?.operation === "resize" &&
                    "uic-board-item--resizing",
                  extra,
                )}
                style={style}
                data-board-item-id={item.id}
              >
                {isMovable ? (
                  <span className="uic-board-item__handle uic-board-item__handle--drag">
                    <IconButton
                      className="uic-board-item__drag-handle"
                      variant="ghost"
                      size="sm"
                      label={dragHandleLabel ?? t("uic.Board.dragHandle")}
                      icon={dragHandleIcon ?? <GripGlyph />}
                      onPointerDown={onHandlePointerDown("move", item.id)}
                      onPointerMove={onHandlePointerMove}
                      onPointerUp={onHandlePointerUp}
                      onPointerCancel={onHandlePointerCancel}
                      onKeyDown={onHandleKeyDown("move", item.id)}
                      onBlur={onHandleBlur}
                    />
                    {renderDirections("move", item.id)}
                  </span>
                ) : null}
                <div className="uic-board-item__content">
                  {renderItem(item, { removeItem: () => removeItemAction(item) })}
                </div>
                {isResizable ? (
                  <span className="uic-board-item__handle uic-board-item__handle--resize">
                    <IconButton
                      className="uic-board-item__resize-handle"
                      variant="ghost"
                      size="sm"
                      label={resizeHandleLabel ?? t("uic.Board.resizeHandle")}
                      icon={resizeHandleIcon ?? <CornerGlyph />}
                      onPointerDown={onHandlePointerDown("resize", item.id)}
                      onPointerMove={onHandlePointerMove}
                      onPointerUp={onHandlePointerUp}
                      onPointerCancel={onHandlePointerCancel}
                      onKeyDown={onHandleKeyDown("resize", item.id)}
                      onBlur={onHandleBlur}
                    />
                    {renderDirections("resize", item.id)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : items.length === 0 ? (
        emptyContent
      ) : null}
      <VisuallyHidden as="div" aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden>
    </div>
  );
}

Board.displayName = "Board";
