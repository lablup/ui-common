/**
 * `astryx component RadialChart` (and `ui-common component RadialChart`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "RadialChart",
  displayName: "Radial Chart",
  import: "@lablup/ui-common/lab",
  category: "Data Visualization",
  keywords: ["chart", "pie", "donut", "radar", "spider", "radial", "ring", "gauge"],
  description:
    "A pie, donut or spider (radar) chart. RadialChart owns the radial coordinate space and its children (RadialSlice, RadialGrid, RadialArea, RadialAxis, RadialTooltip) draw from it. Width follows the container; height is a prop. ui-common's copy of Astryx lab's RadialChart: it renders at its container's width on the first paint and in the same frame as a container resize, so it never flashes empty or trails a resizing card. Import RadialChart and its children from @lablup/ui-common/lab.",
  props: [
    {
      name: "data",
      type: "Record<string, unknown>[]",
      description: "The dataset: one row per slice (pie) or per series (spider).",
      required: true,
    },
    {
      name: "children",
      type: "ReactNode",
      description:
        "The marks: RadialSlice for a pie or donut; RadialGrid, RadialArea and RadialAxis for a spider chart; RadialTooltip for hover details.",
      required: true,
    },
    {
      name: "height",
      type: "number",
      description: "Chart height in pixels. The width follows the container.",
      default: "400",
    },
    {
      name: "valueKey",
      type: "string",
      description: "Pie/donut mode: the key holding each slice's number.",
    },
    {
      name: "labelKey",
      type: "string",
      description: "Pie/donut mode: the key holding each slice's label.",
    },
    {
      name: "axes",
      type: "string[]",
      description:
        "Spider mode: one key per axis. When set, the chart is a spider chart.",
    },
    {
      name: "innerRadius",
      type: "number",
      description:
        "Inner radius as a fraction of the outer one: 0 is a pie, 0.6 a donut.",
      default: "0",
    },
    {
      name: "padAngle",
      type: "number",
      description: "Gap between pie slices, in radians.",
      default: "0.02",
    },
    {
      name: "label",
      type: "string",
      description:
        "Accessible name of the chart's image. Defaults to an English description from the mode and keys; pass a localized string.",
    },
  ],
  usage: {
    description:
      "Put the chart in a container whose width it can follow and give it a height. Pass RadialSlice the colors from useChartColors().categorical(n).",
  },
  examples: [
    {
      label: "Donut",
      code: 'import { RadialChart, RadialSlice, useChartColors } from "@lablup/ui-common/lab";\n\nconst colors = useChartColors().categorical(data.length);\n\n<RadialChart data={data} valueKey="count" labelKey="state" innerRadius={0.6} height={240}>\n  <RadialSlice colors={colors} />\n</RadialChart>',
    },
  ],
};
