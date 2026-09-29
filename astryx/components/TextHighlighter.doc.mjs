/**
 * `astryx component TextHighlighter` (and `ui-common component TextHighlighter`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "TextHighlighter",
  displayName: "TextHighlighter",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: ["highlight", "search", "mark", "keyword", "match"],
  description:
    "Marks every case-insensitive occurrence of keyword in a string, for search results. The keyword matches literally. Without a keyword the text renders plain; without text nothing renders. The mark is the theme's --color-warning-border-hover when it declares one, else --color-warning-muted.",
  props: [
    {
      name: "children",
      type: "string | null",
      description: "The text to search in.",
    },
    {
      name: "keyword",
      type: "string",
      description: "The text to mark.",
    },
    {
      name: "highlightStyle",
      type: "CSSProperties",
      description: "Inline style of each mark.",
    },
    {
      name: "className",
      type: "string",
      description: "Class on the outer span.",
    },
  ],
  usage: {
    description:
      "Inside a Token, which takes a string label, pass label={text} isLabelHidden and the highlighter as endContent, so the plain text stays the accessible name.",
  },
  examples: [
    {
      label: "A search result",
      code: "<TextHighlighter keyword={search}>{row.name}</TextHighlighter>",
    },
  ],
};
