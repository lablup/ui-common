/**
 * `astryx component Board` (and `ui-common component Board`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "Board",
  displayName: "Board",
  import: "@lablup/ui-common",
  category: "Layout",
  keywords: [
    "board",
    "dashboard",
    "grid",
    "drag",
    "resize",
    "panel",
    "widget",
    "layout",
  ],
  description:
    "A dashboard grid of items the user can move and resize, by pointer or keyboard. The column count follows the board's width (1, 2, 4 or 6 columns by default); each item persists as its spans plus a column offset per column count, the model of @cloudscape-design/board-components, so a layout stored by that board renders the same here. Controlled: onItemsChange reports the whole board in its new order and the parent passes it back.",
  props: [
    {
      name: "items",
      type: "ReadonlyArray<BoardItem<D>>",
      description:
        "The items: id, data, optional rowSpan (from 2) and columnSpan (from 1), definition (minRowSpan, minColumnSpan, defaultRowSpan, defaultColumnSpan) and columnOffset, a column per column count ({ 4: 2, 6: 3 }) the board writes back.",
      required: true,
    },
    {
      name: "renderItem",
      type: "(item: BoardItem<D>, actions: { removeItem: () => void }) => ReactNode",
      description:
        "An item's content. The board draws the surface, border and handles around it; the content area scrolls, so a BoardItemTitle inside stays at the top. removeItem reports the board without the item.",
      required: true,
    },
    {
      name: "onItemsChange",
      type: "(detail: BoardItemsChangeDetail<D>) => void",
      description:
        "Called when the user moves, resizes or removes an item, with items (the whole board in its new order, spans and columnOffset updated) and the movedItem, resizedItem or removedItem. A move that ends where it started does not fire.",
      required: true,
    },
    {
      name: "isMovable",
      type: "boolean",
      description: "Renders a drag handle at each item's top-left corner.",
      default: "false",
    },
    {
      name: "isResizable",
      type: "boolean",
      description: "Renders a resize handle at each item's bottom-right corner.",
      default: "false",
    },
    {
      name: "variant",
      type: "'bordered' | 'plain'",
      description: "bordered draws a border on each item.",
      default: "'plain'",
    },
    {
      name: "emptyContent",
      type: "ReactNode",
      description: "Rendered in place of the grid when items is empty.",
    },
    {
      name: "columnBreakpoints",
      type: "ReadonlyArray<{ minWidth: number; columns: number }>",
      description: "Content width (px) to column count.",
      default: "1 under 688px, 2 under 912px, 4 under 2100px, else 6",
    },
    {
      name: "itemClassName",
      type: "string | ((item: BoardItem<D>) => string | undefined)",
      description: "An extra class on each item's surface.",
    },
    {
      name: "dragHandleIcon, resizeHandleIcon",
      type: "ReactNode",
      description: "The handles' glyphs.",
      default: "a grip, a corner grip",
    },
    {
      name: "dragHandleLabel, resizeHandleLabel",
      type: "string",
      description: "Accessible names of the handles.",
      default: "the catalog's uic.Board.dragHandle / resizeHandle",
    },
    {
      name: "liveAnnouncementDndStarted, liveAnnouncementDndCommitted, liveAnnouncementDndDiscarded",
      type: "(operation: 'move' | 'resize') => string",
      description:
        "Live-region announcements at the start and end of a move or resize.",
      default: "the catalog's uic.Board.* keys",
    },
    {
      name: "liveAnnouncementDndItemMoved, liveAnnouncementDndItemResized",
      type: "(detail: { item: BoardItem<D>; placement: { x; y; width; height } }) => string",
      description: "Live-region announcement at each step; the placement is 0-based.",
      default: "the catalog's uic.Board.itemMoved / itemResized",
    },
    {
      name: "liveAnnouncementItemRemoved",
      type: "(detail: { item: BoardItem<D> }) => string",
      description: "Live-region announcement when an item is removed.",
      default: "the catalog's uic.Board.itemRemoved",
    },
  ],
  usage: {
    description:
      "Persist what onItemsChange reports (minus data) and pass it back as items; the board snaps back otherwise. Drag a handle to move or resize by pointer (a resized item follows the pointer's size and snaps to the grid on release). Click a handle, or press Enter or Space on it, to activate it: direction buttons appear and they or the arrow keys step one cell, Enter, Space or leaving the handle commits, Escape discards. A step that would overlap an item only partly, in the direction of the move, is a conflict and does not commit. The drag handle overlays the item's top-left corner, so give the content a horizontal inset. A pointer drag held near an edge of the nearest scroll container scrolls it. CSS knobs on the root or above: --board-row-height (96px), --board-gap (--spacing-5), --board-item-radius (--radius-container), --board-transition-duration (200ms, off under prefers-reduced-motion), --board-handle-z (51; BoardItemTitle's sticky row is 50). Other div attributes reach the root.",
  },
  examples: [
    {
      label: "A movable, resizable dashboard",
      code: '<Board\n  items={items}\n  isMovable\n  isResizable\n  variant="bordered"\n  renderItem={(item) => (\n    <Stack gap={2} xstyle={inset}>\n      <BoardItemTitle title={item.data.title} />\n      {item.data.content}\n    </Stack>\n  )}\n  onItemsChange={({ items }) => setItems(items)}\n/>',
    },
  ],
};
