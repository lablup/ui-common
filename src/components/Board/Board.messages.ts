import { defineMessages } from "../../i18n/catalog";

export const boardMessages = defineMessages({
  "uic.Board.dragHandle": {
    defaultMessage: "Drag handle",
    description:
      "Accessible name of the button at a board item's top-left corner that moves the item",
  },
  "uic.Board.resizeHandle": {
    defaultMessage: "Resize handle",
    description:
      "Accessible name of the button at a board item's bottom-right corner that resizes the item",
  },
  "uic.Board.moveStarted": {
    defaultMessage: "Dragging.",
    description:
      "Screen reader announcement when a board item is picked up to be moved",
  },
  "uic.Board.resizeStarted": {
    defaultMessage: "Resizing.",
    description: "Screen reader announcement when a board item starts being resized",
  },
  "uic.Board.itemMoved": {
    defaultMessage: "Item moved to column {column}, row {row}.",
    description:
      "Screen reader announcement while a board item moves. {column} and {row} are 1-based",
  },
  "uic.Board.itemResized": {
    defaultMessage: "Item resized to {columns} columns by {rows} rows.",
    description: "Screen reader announcement while a board item is resized",
  },
  "uic.Board.moveCommitted": {
    defaultMessage: "Move committed.",
    description:
      "Screen reader announcement when a board item is dropped in its new place",
  },
  "uic.Board.resizeCommitted": {
    defaultMessage: "Resize committed.",
    description: "Screen reader announcement when a board item's new size is applied",
  },
  "uic.Board.moveDiscarded": {
    defaultMessage: "Move discarded.",
    description: "Screen reader announcement when moving a board item is cancelled",
  },
  "uic.Board.resizeDiscarded": {
    defaultMessage: "Resize discarded.",
    description: "Screen reader announcement when resizing a board item is cancelled",
  },
  "uic.Board.itemRemoved": {
    defaultMessage: "Item removed.",
    description: "Screen reader announcement when a board item is removed",
  },
});
