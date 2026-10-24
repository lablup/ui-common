/**
 * `astryx component SkeletonChart` (and `ui-common component SkeletonChart`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "SkeletonChart",
  displayName: "SkeletonChart",
  import: "@lablup/ui-common",
  category: "Feedback & Status",
  keywords: [
    "skeleton chart",
    "loading chart",
    "chart placeholder",
    "loading placeholder",
    "skeleton",
  ],
  description:
    "Loading placeholder for a chart: eight bars, a pie with a four-item legend, or one block for line and area charts. The container is role=status with a name; the shapes inside are decorative.",
  props: [
    {
      name: "variant",
      type: "'bar' | 'line' | 'pie' | 'area'",
      description: "Chart shape.",
      default: "'bar'",
    },
    {
      name: "height",
      type: "string",
      description: "Chart height, any CSS length.",
      default: "'300px'",
    },
    {
      name: "loadingLabel",
      type: "string",
      description: "Accessible name while the chart loads.",
      default: 'the catalog\'s uic.SkeletonChart.loading ("Loading chart")',
    },
    {
      name: "className / testId",
      type: "string",
      description: "Extra class; data-testid.",
    },
  ],
  usage: {
    description:
      "Match variant to the chart that replaces it and keep height equal so the page does not jump.",
  },
  examples: [
    {
      label: "Pie chart loading",
      code: '{isLoading ? <SkeletonChart variant="pie" height="20rem" /> : <UsageChart data={data} />}',
    },
  ],
};
