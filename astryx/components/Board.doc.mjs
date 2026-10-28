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
        "The items: id, data, optional title and description (each a string or a node), rowSpan (from 2) and columnSpan (from 1), definition (minRowSpan, minColumnSpan, defaultRowSpan, defaultColumnSpan) and columnOffset, a column per column count ({ 4: 2, 6: 3 }) the board writes back. A string title renders as a level-5 heading in a header row, with the drag handle on its first line; a node title (a BoardItemTitle, say) renders there as is, so a help tooltip or end-of-row actions are the node's to include. Without a title, the first BoardItemTitle inside the description renders in the header row instead (unless it is inline); with neither there is no header row and the description takes the whole item. A string description renders as text; a node as is, and scrolls. Inside the description, useIsInBoardItem() returns true.",
      required: true,
    },
    {
      name: "itemPadding",
      type: "number | string | { top?: number | string; right?: …; bottom?: …; left?: … }",
      description:
        "The padding of every item's title row and description: a number (px) or a CSS length ('1rem', 'var(--spacing-3)') for every side, or one per side. The drag handle is not padded; it keeps the item's top-left corner, so the left padding is what clears it.",
      default: "--spacing-5 top and bottom, --spacing-8 left and right",
    },
    {
      name: "onItemsChange",
      type: "(detail: BoardItemsChangeDetail<D>) => void",
      description:
        "Called when the user moves or resizes an item, with items (the whole board in its new order, spans and columnOffset updated) and the movedItem or resizedItem. A move that ends where it started does not fire. Removing an item is the consumer's: pass items without it.",
      required: true,
    },
    {
      name: "isMovable",
      type: "boolean",
      description:
        "Renders a drag handle at each item's top-left corner, in the inline padding on the title row's first line (the block padding from the top, --spacing-1 from the start).",
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
  ],
  usage: {
    description:
      "Persist what onItemsChange reports (minus data) and pass it back as items; the board snaps back otherwise. Drag a handle to move or resize by pointer (a resized item follows the pointer's size and snaps to the grid on release). Click a handle, or press Enter or Space on it, to activate it: direction buttons appear and they or the arrow keys step one cell, Enter, Space or leaving the handle commits, Escape discards. A step that would overlap an item only partly, in the direction of the move, is a conflict and does not commit. The drag handle is absolute at the item's top-left corner, in the inline padding on the title row's first line, and stays there when a title wraps or a node title grows; an item without a title keeps it in the same spot. A pointer drag held near an edge of the nearest scroll container scrolls it. CSS knobs on the root or above: --board-row-height (96px), --board-gap (--spacing-5), --board-item-radius (--radius-container), --board-transition-duration (200ms, off under prefers-reduced-motion), --board-handle-z (51), --board-item-padding-top / -right / -bottom / -left (the title row's and the description's padding, --spacing-5 top and bottom, --spacing-8 left and right; itemPadding sets them per board). Other div attributes reach the root.",
  },
  examples: [
    {
      label: "A movable, resizable dashboard",
      code: '<Board\n  items={[\n    { id: "sessions", title: "Active sessions", description: <SessionCount />, data: {} },\n    {\n      id: "usage",\n      title: <BoardItemTitle title="Resource usage" endContent={<Button label="Refresh" />} />,\n      description: <UsageChart />,\n      data: {},\n    },\n  ]}\n  isMovable\n  isResizable\n  variant="bordered"\n  onItemsChange={({ items }) => setItems(items)}\n/>',
    },
    {
      label: "Title-less tiles with a tighter inset",
      code: "<Board\n  items={actions.map((a) => ({ id: a.id, description: <ActionTile {...a} />, data: a }))}\n  isMovable\n  itemPadding={{ top: 16, right: 20, bottom: 16, left: 20 }}\n  onItemsChange={({ items }) => setItems(items)}\n/>",
    },
  ],
};
