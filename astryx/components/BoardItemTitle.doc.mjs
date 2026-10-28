/**
 * `astryx component BoardItemTitle` (and `ui-common component BoardItemTitle`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "BoardItemTitle",
  displayName: "BoardItemTitle",
  import: "@lablup/ui-common",
  category: "Layout",
  keywords: ["title", "panel", "dashboard", "board", "header"],
  description:
    "A Board item's title node: a heading with an optional help tooltip, and actions at the end. The board pads and places the row, and its two groups wrap onto separate lines when the item is narrow.",
  props: [
    {
      name: "title",
      type: "ReactNode",
      description:
        "The title. A string renders as a level-5 heading; a node renders as is.",
      required: true,
    },
    {
      name: "tooltip",
      type: "ReactNode",
      description:
        "Help text in a tooltip beside the title. Without it, no help glyph.",
    },
    {
      name: "tooltipIcon",
      type: "ReactNode",
      description: "Glyph of the help tooltip.",
      default: "the theme's info icon",
    },
    {
      name: "endContent",
      type: "ReactNode",
      description: "Actions at the end of the row.",
    },
    {
      name: "inline",
      type: "boolean",
      description:
        "Inside a Board item's description, stay in the body instead of moving to the item's header row (a second section title, say).",
      default: "false",
    },
  ],
  usage: {
    description:
      "As a Board item's title, or inside its description: when the item has no title, the first BoardItemTitle in the description renders in the item's header row, with the same layout and drag-handle alignment as a title node; inline keeps it in the body. Other div attributes (className, style, data-*) reach the row.",
  },
  examples: [
    {
      label: "Panel title with help and an action",
      code: '<BoardItemTitle\n  title="Active sessions"\n  tooltip="Counts only running sessions."\n  endContent={<Button label="Refresh" />}\n/>',
    },
  ],
};
