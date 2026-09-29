/**
 * `astryx component DoubleToken` (and `ui-common component DoubleToken`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "DoubleToken",
  displayName: "DoubleToken",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: ["token pair", "welded tokens", "key value", "chip", "tag pair"],
  description:
    "A run of Tokens welded into one chip, for a settled pair (a type and its version, a scope and its name); the live counterpart is DoubleBadge. A string value is a blue Token; empty labels are skipped. highlightKeyword marks the keyword in each label with TextHighlighter and keeps the plain label as the accessible name.",
  props: [
    {
      name: "values",
      type: "Array<string> | Array<{ label: string; color?: TokenColor }>",
      description: "The tokens, in order.",
    },
    {
      name: "highlightKeyword",
      type: "string",
      description: "Marks this text in every label.",
    },
  ],
  usage: {
    description:
      "Values that change only when someone edits them. A status that changes on its own is a DoubleBadge.",
  },
  examples: [
    {
      label: "A runtime and its version",
      code: '<DoubleToken values={[{ label: "CUDA", color: "green" }, "12.4"]} />',
    },
  ],
};
