/**
 * `astryx component SelectionLabel` (and `ui-common component SelectionLabel`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "SelectionLabel",
  displayName: "SelectionLabel",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: ["selected", "selection", "bulk action", "deselect", "count"],
  description:
    '"3 selected" beside a bulk-action toolbar, with an optional button that clears the selection. Renders nothing while the count is 0.',
  props: [
    {
      name: "count",
      type: "number",
      description: "How many items are selected.",
      required: true,
    },
    {
      name: "onClear",
      type: "() => void",
      description: "Clears the selection. Without it, no clear button.",
    },
    {
      name: "label",
      type: "string",
      description: "The text.",
      default: 'the catalog\'s uic.SelectionLabel.selectedCount ("{count} selected")',
    },
    {
      name: "clearLabel",
      type: "string",
      description: "Accessible name and tooltip of the clear button.",
      default: 'the catalog\'s uic.SelectionLabel.clear ("Deselect all")',
    },
    {
      name: "clearIcon",
      type: "ReactNode",
      description: "Glyph of the clear button.",
      default: "the theme's close icon",
    },
  ],
  usage: {
    description: "Next to the actions that apply to a table's selected rows.",
  },
  examples: [
    {
      label: "Table selection",
      code: "<SelectionLabel count={selectedKeys.length} onClear={() => setSelectedKeys([])} />",
    },
  ],
};
