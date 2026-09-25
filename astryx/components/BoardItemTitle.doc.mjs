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
  keywords: ["title", "panel", "dashboard", "board", "sticky", "header"],
  description:
    "The title row of a dashboard panel: a heading with an optional help tooltip, and actions at the end. It sticks to the top of the panel's scroll area on the surface colour, and its two groups wrap onto separate lines when the panel is narrow.",
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
  ],
  usage: {
    description:
      "At the top of a dashboard panel or a board item. Other div attributes (className, style, data-*) reach the row. The --uic-board-item-title-z property sets its z-index (default 50).",
  },
  examples: [
    {
      label: "Panel title with help and an action",
      code: '<BoardItemTitle\n  title="Active sessions"\n  tooltip="Counts only running sessions."\n  endContent={<Button label="Refresh" />}\n/>',
    },
  ],
};
