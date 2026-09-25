/**
 * `astryx component TokenList` (and `ui-common component TokenList`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "TokenList",
  displayName: "TokenList",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: ["tokens", "tags", "overflow", "more", "list", "emails"],
  description:
    "A bounded list of settled values: the first maxInline items inline, then +N that shows the rest on hover and focus in a HoverCard (a Popover with trigger=click). variant=token draws Tokens and a +N link; variant=text draws plain text and a +N badge for dense table cells.",
  props: [
    {
      name: "items",
      type: "ReadonlyArray<string | number>",
      description: "The values.",
      required: true,
    },
    {
      name: "maxInline",
      type: "number",
      description: "How many items show inline before +N.",
      default: "3",
    },
    {
      name: "emptyText",
      type: "ReactNode",
      description: "Rendered instead of the list when items is empty.",
      default: "'-'",
    },
    {
      name: "variant",
      type: "'token' | 'text'",
      description:
        "token for Tokens and a +N link, text for plain text and a +N badge.",
      default: "'token'",
    },
    {
      name: "trigger",
      type: "'hover' | 'click'",
      description: "How the overflow opens.",
      default: "'hover'",
    },
  ],
  usage: {
    description:
      "A cell or field that holds a list of values of unknown length, such as a user's groups.",
  },
  examples: [
    {
      label: "In a table cell",
      code: '<TokenList items={emails} maxInline={2} variant="text" />',
    },
  ],
};
