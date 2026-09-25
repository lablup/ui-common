/**
 * `astryx component DividedRow` (and `ui-common component DividedRow`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "DividedRow",
  displayName: "DividedRow",
  import: "@lablup/ui-common",
  category: "Layout",
  keywords: ["divider", "separator", "wrap", "row", "stat row"],
  description:
    "Lays its children out in a wrapping row and draws a vertical divider between neighbours on the same line only, centred in the column gap. An item that ends a line has no divider after it; line ends are measured after layout and on every resize.",
  props: [
    {
      name: "children",
      type: "ReactNode",
      description: "The items. Empty children are skipped.",
    },
    {
      name: "wrap",
      type: "'wrap' | 'nowrap'",
      description: "Whether items flow onto more lines.",
      default: "'wrap'",
    },
    {
      name: "rowGap",
      type: "number | string",
      description: "Gap between lines. A number is pixels.",
      default: "var(--spacing-8)",
    },
    {
      name: "columnGap",
      type: "number | string",
      description:
        "Gap between items on a line; the divider sits in its middle. A number is pixels.",
      default: "var(--spacing-12)",
    },
    {
      name: "dividerWidth",
      type: "number",
      description: "Divider thickness in pixels.",
      default: "1",
    },
    {
      name: "dividerColor",
      type: "string",
      description: "Divider colour.",
      default: "var(--color-border)",
    },
    {
      name: "dividerInset",
      type: "number",
      description:
        "How far the divider stops short of the item's top and bottom, in pixels.",
      default: "0",
    },
    {
      name: "itemStyle",
      type: "CSSProperties",
      description: "Inline styles on each item's wrapper.",
    },
    {
      name: "className",
      type: "string",
      description: "Class names on the row.",
    },
    {
      name: "style",
      type: "CSSProperties",
      description: "Inline styles on the row.",
    },
  ],
  usage: {
    description:
      "A row of metrics or summaries that should read as separate columns and still wrap on a narrow screen.",
  },
  examples: [
    {
      label: "Metrics separated by dividers",
      code: '<DividedRow>\n  <Statistic label="CPU" value={4} />\n  <Statistic label="Memory" value={16} unit="GiB" />\n</DividedRow>',
    },
  ],
};
