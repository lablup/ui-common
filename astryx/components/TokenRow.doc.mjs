/**
 * `astryx component TokenRow` (and `ui-common component TokenRow`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "TokenRow",
  displayName: "TokenRow",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: ["tokens", "tags", "row", "and more", "overflow", "count"],
  description:
    'A row of read-only tokens that stops at maxCount and ends with "and N more". With totalCount, the count reports the whole collection when items is only a fetched page.',
  props: [
    {
      name: "items",
      type: "ReadonlyArray<{ key?: Key; label: string }>",
      description: "The tokens, in order.",
      required: true,
    },
    {
      name: "maxCount",
      type: "number",
      description: "How many tokens render before the count.",
      default: "3",
    },
    {
      name: "totalCount",
      type: "number",
      description: "Size of the whole collection when items is a page of it.",
      default: "items.length",
    },
    {
      name: "color",
      type: "TokenColor",
      description: "Colour of every token.",
    },
    {
      name: "emptyText",
      type: "ReactNode",
      description: "Rendered instead of the row when there is nothing to show.",
      default: "'-'",
    },
    {
      name: "moreLabel",
      type: "(count: number) => string",
      description: "The count after the tokens, given how many were left out.",
      default: 'the catalog\'s uic.TokenRow.more ("and {count} more")',
    },
  ],
  usage: {
    description:
      "A table cell listing a record's aliases or members, where one long record must not stretch the row. Other div attributes reach the row.",
  },
  examples: [
    {
      label: "Aliases, two shown",
      code: "<TokenRow items={aliases.map((a) => ({ key: a, label: a }))} maxCount={2} />",
    },
  ],
};
