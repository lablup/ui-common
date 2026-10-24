/**
 * `astryx component SkeletonText` (and `ui-common component SkeletonText`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "SkeletonText",
  displayName: "SkeletonText",
  import: "@lablup/ui-common",
  category: "Feedback & Status",
  keywords: [
    "skeleton text",
    "loading text",
    "text placeholder",
    "paragraph placeholder",
    "loading placeholder",
    "skeleton",
  ],
  description:
    "Loading placeholder for a block of text: lines lines, alternating full and slightly short, with a shorter last line. The container is role=status with a name; the lines are decorative.",
  props: [
    {
      name: "lines",
      type: "number",
      description: "Number of lines.",
      default: "3",
    },
    {
      name: "spacing",
      type: "'compact' | 'normal' | 'relaxed'",
      description: "Space between lines.",
      default: "'normal'",
    },
    {
      name: "loadingLabel",
      type: "string",
      description: "Accessible name for the placeholder as a whole.",
      default: 'the catalog\'s uic.SkeletonText.loading ("Loading")',
    },
    {
      name: "className / testId",
      type: "string",
      description: "Extra class; data-testid.",
    },
  ],
  usage: {
    description:
      "Use it for a description or paragraph that has not arrived. Set lines to roughly the expected length.",
  },
  examples: [
    {
      label: "Loading description",
      code: '<SkeletonText lines={5} spacing="compact" />',
    },
  ],
};
