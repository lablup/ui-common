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
 * bottom-right resizes it: by pointer, or with the arrow keys once the handle
 * has focus, Enter or Space to commit and Escape to discard. Neither handle
 * renders unless `isMovable` / `isResizable` says so. Items the active one
 * overlaps are pushed down and the rest float up (`./engine.ts`); every step
 * is announced in a live region.
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
  moveItem,
  removeItem as removeFromLayout,
  resizeItem,
  type Rect,
} from "./engine";
import {
  getMinColumnSpan,
  getMinRowSpan,
  interpretItems,
  isSameLayout,
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

interface Metrics {
  cellWidth: number;
  cellHeight: number;
  gap: number;
}

interface Transition {
  operation: BoardOperation;
  interaction: "pointer" | "keyboard";
  itemId: string;
  /** The layout when the operation started; its column count is frozen. */
  base: GridLayout;
  /** The active item's placement at the start. */
  origin: Rect;
  /** The active item's placement now. */
  target: Rect;
  preview: GridLayout;
  metrics: Metrics;
  pointer?: {
    id: number;
    /** Where the pointer went down, and the grid's origin then. */
    start: Point;
    gridOrigin: Point;
    /** The last pointer position; re-applied when an ancestor scrolls. */
    last: Point;
    /** The scroll-compensated travel, which the dragged item translates by. */
    dx: number;
    dy: number;
  };
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

const cx = (...names: Array<string | false | undefined>) =>
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
  const announceStep = (tr: Transition) => {
    const item = itemsRef.current.find((it) => it.id === tr.itemId);
    if (!item) return;
    const detail: BoardDndDetail<D> = { item, placement: { ...tr.target } };
    setAnnouncement(
      tr.operation === "resize"
        ? (liveAnnouncementDndItemResized?.(detail) ??
            t("uic.Board.itemResized", {
              columns: tr.target.width,
              rows: tr.target.height,
            }))
        : (liveAnnouncementDndItemMoved?.(detail) ??
            t("uic.Board.itemMoved", {
              column: tr.target.x + 1,
              row: tr.target.y + 1,
            })),
    );
  };

  const measure = (itemId: string, placement: Rect): Metrics => {
    const grid = gridRef.current;
    const shell = shellRefs.current.get(itemId);
    const gap = grid ? parseFloat(getComputedStyle(grid).rowGap) || 0 : 0;
    const rect = shell?.getBoundingClientRect();
    const cellWidth = rect
      ? (rect.width - gap * (placement.width - 1)) / placement.width
      : 0;
    const cellHeight = rect
      ? (rect.height - gap * (placement.height - 1)) / placement.height
      : 0;
    return {
      cellWidth: Math.max(cellWidth, 0),
      cellHeight: Math.max(cellHeight, 0),
      gap,
    };
  };

  const start = (
    operation: BoardOperation,
    interaction: Transition["interaction"],
    itemId: string,
    pointer?: Transition["pointer"],
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
      origin,
      target: { ...origin },
      preview: base,
      metrics: measure(itemId, origin),
      pointer,
    };
    setTransition(next);
    announceStarted(operation);
    return next;
  };

  /** Applies a target placement to the active transition, previewing the result. */
  const retarget = (tr: Transition, target: Rect, pointer = tr.pointer): Transition => {
    const changed =
      target.x !== tr.target.x ||
      target.y !== tr.target.y ||
      target.width !== tr.target.width ||
      target.height !== tr.target.height;
    const preview = !changed
      ? tr.preview
      : tr.operation === "resize"
        ? resizeItem(tr.base, tr.itemId, target.width, target.height)
        : moveItem(tr.base, tr.itemId, target.x, target.y);
    const next: Transition = { ...tr, target, preview, pointer };
    setTransition(next);
    if (changed) announceStep(next);
    return next;
  };

  const clampTarget = (tr: Transition, wanted: Rect): Rect => {
    const item = itemsRef.current.find((it) => it.id === tr.itemId);
    const { columns: cols, rows } = tr.base;
    if (tr.operation === "resize") {
      const minWidth = item ? getMinColumnSpan(item, cols) : 1;
      const minHeight = item ? getMinRowSpan(item) : 1;
      return {
        x: tr.origin.x,
        y: tr.origin.y,
        width: clamp(wanted.width, minWidth, cols - tr.origin.x),
        height: Math.max(wanted.height, minHeight),
      };
    }
    return {
      x: clamp(wanted.x, 0, cols - tr.origin.width),
      y: clamp(wanted.y, 0, rows),
      width: tr.origin.width,
      height: tr.origin.height,
    };
  };

  const commit = () => {
    const tr = transitionRef.current;
    if (!tr) return;
    setTransition(null);
    if (!isSameLayout(tr.base, tr.preview)) {
      const resizeTarget = tr.operation === "resize" ? tr.itemId : undefined;
      const next = transformItems(itemsRef.current, tr.preview, resizeTarget);
      const changed = next.find((it) => it.id === tr.itemId);
      onItemsChange(
        tr.operation === "resize"
          ? { items: next, resizedItem: changed }
          : { items: next, movedItem: changed },
      );
    }
    setAnnouncement(
      liveAnnouncementDndCommitted?.(tr.operation) ??
        t(
          tr.operation === "resize"
            ? "uic.Board.resizeCommitted"
            : "uic.Board.moveCommitted",
        ),
    );
  };

  const discard = () => {
    const tr = transitionRef.current;
    if (!tr) return;
    setTransition(null);
    setAnnouncement(
      liveAnnouncementDndDiscarded?.(tr.operation) ??
        t(
          tr.operation === "resize"
            ? "uic.Board.resizeDiscarded"
            : "uic.Board.moveDiscarded",
        ),
    );
  };
  const discardRef = useRef(discard);
  discardRef.current = discard;

  // Escape discards a pointer drag too, where no handle holds the keyboard.
  useEffect(() => {
    if (!transition) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        discardRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [transition]);

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

  const onHandlePointerDown =
    (operation: BoardOperation, itemId: string) =>
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || transitionRef.current) return;
      // jsdom has no pointer capture.
      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      const point = { x: event.clientX, y: event.clientY };
      start(operation, "pointer", itemId, {
        id: event.pointerId,
        start: point,
        gridOrigin: gridOriginOf(gridRef.current),
        last: point,
        dx: 0,
        dy: 0,
      });
    };

  /** Moves the drag to a pointer position, in viewport coordinates. */
  const applyPointer = (tr: Transition, point: Point) => {
    if (!tr.pointer) return;
    const { x: dx, y: dy } = compensateForScroll(
      point,
      tr.pointer.start,
      tr.pointer.gridOrigin,
      gridOriginOf(gridRef.current),
    );
    const stepX = tr.metrics.cellWidth + tr.metrics.gap || 1;
    const stepY = tr.metrics.cellHeight + tr.metrics.gap || 1;
    const cols = Math.round(dx / stepX);
    const rows = Math.round(dy / stepY);
    const wanted: Rect =
      tr.operation === "resize"
        ? {
            ...tr.origin,
            width: tr.origin.width + cols,
            height: tr.origin.height + rows,
          }
        : { ...tr.origin, x: tr.origin.x + cols, y: tr.origin.y + rows };
    retarget(tr, clampTarget(tr, wanted), { ...tr.pointer, last: point, dx, dy });
  };
  const applyPointerRef = useRef(applyPointer);
  applyPointerRef.current = applyPointer;

  const onHandlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const tr = transitionRef.current;
    if (!tr?.pointer || tr.pointer.id !== event.pointerId) return;
    applyPointer(tr, { x: event.clientX, y: event.clientY });
  };

  // While a pointer drag is on: an ancestor scrolling moves the grid under a
  // still pointer, so the last position is re-applied; and a pointer held
  // near an edge of the nearest scroll container scrolls it, frame by frame.
  const isPointerDrag = transition?.pointer !== undefined;
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
    const tr = transitionRef.current;
    if (!tr?.pointer || tr.pointer.id !== event.pointerId) return;
    commit();
  };

  const onHandlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    const tr = transitionRef.current;
    if (!tr?.pointer || tr.pointer.id !== event.pointerId) return;
    discard();
  };

  const onHandleKeyDown =
    (operation: BoardOperation, itemId: string) =>
    (event: KeyboardEvent<HTMLButtonElement>) => {
      let tr = transitionRef.current;
      if (tr && (tr.itemId !== itemId || tr.operation !== operation)) return;
      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          event.preventDefault();
          tr ??= start(operation, "keyboard", itemId);
          if (!tr) return;
          const dx =
            event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
          const dy = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
          const wanted: Rect =
            operation === "resize"
              ? {
                  ...tr.target,
                  width: tr.target.width + dx,
                  height: tr.target.height + dy,
                }
              : { ...tr.target, x: tr.target.x + dx, y: tr.target.y + dy };
          retarget(tr, clampTarget(tr, wanted));
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
    if (tr?.interaction === "keyboard") discard();
  };

  const previewById = new Map(transition?.preview.items.map((it) => [it.id, it]) ?? []);
  const latticeRows = transition
    ? Math.max(
        layout.rows,
        transition.preview.rows,
        transition.target.y + transition.target.height,
      ) + 1
    : 0;
  const placeholders: ReactNode[] = [];
  if (transition) {
    const { target } = transition;
    for (let row = 0; row < latticeRows; row++) {
      for (let col = 0; col < columns; col++) {
        const hover =
          col >= target.x &&
          col < target.x + target.width &&
          row >= target.y &&
          row < target.y + target.height;
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

  return (
    <div ref={rootRef} className={cx("uic-board", className)} {...divProps}>
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
            let column = `${placed.x + 1} / span ${placed.width}`;
            let row = `${placed.y + 1} / span ${placed.height}`;
            let transform: string | undefined;
            if (transition && isActive) {
              if (transition.operation === "resize") {
                column = `${placed.x + 1} / span ${transition.target.width}`;
                row = `${placed.y + 1} / span ${transition.target.height}`;
              } else if (transition.pointer) {
                transform = `translate(${transition.pointer.dx}px, ${transition.pointer.dy}px)`;
              } else {
                const { cellWidth, cellHeight } = transition.metrics;
                transform = `translate(${toPx(transition.target.x - placed.x, cellWidth)}px, ${toPx(transition.target.y - placed.y, cellHeight)}px)`;
              }
            } else if (transition) {
              const preview = previewById.get(placed.id);
              if (preview && (preview.x !== placed.x || preview.y !== placed.y)) {
                const { cellWidth, cellHeight } = transition.metrics;
                transform = `translate(${toPx(preview.x - placed.x, cellWidth)}px, ${toPx(preview.y - placed.y, cellHeight)}px)`;
              }
            }
            const style: CSSProperties = {
              gridColumn: column,
              gridRow: row,
              transform,
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
                  isActive &&
                    transition?.pointer !== undefined &&
                    "uic-board-item--dragging",
                  extra,
                )}
                style={style}
                data-board-item-id={item.id}
              >
                {isMovable ? (
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
                ) : null}
                <div className="uic-board-item__content">
                  {renderItem(item, { removeItem: () => removeItemAction(item) })}
                </div>
                {isResizable ? (
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
