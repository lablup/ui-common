/**
 * `astryx component ProgressWithLabel` (and `ui-common component ProgressWithLabel`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "ProgressWithLabel",
  displayName: "ProgressWithLabel",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: ["progress", "usage bar", "resource", "labelled progress", "meter"],
  description:
    "A bar that carries its labels: label at the start and valueLabel at the end, over a fill of value percent, for compact resource readouts in cells and cards. A missing or NaN value draws no fill and greys the value label. The fill is color or --uic-progress-with-label-color (default --color-success); the frame's corner is --uic-progress-with-label-radius (default --radius-inner).",
  props: [
    {
      name: "label",
      type: "ReactNode",
      description: "Start label.",
    },
    {
      name: "valueLabel",
      type: "ReactNode",
      description: "End label.",
    },
    {
      name: "value",
      type: "number",
      description: "Fill, in percent; above 100 fills the bar.",
    },
    {
      name: "hasValueLabel",
      type: "boolean",
      description: "Whether the end label shows; its space stays reserved.",
      default: "true",
    },
    {
      name: "color",
      type: "string",
      description: "Fill colour, any CSS colour or var().",
    },
    {
      name: "width",
      type: "CSSProperties['width']",
      description: "Bar width. Without it the bar grows in its flex container.",
    },
    {
      name: "size",
      type: "'sm' | 'md' | 'lg'",
      description: "Label size.",
      default: "'sm'",
    },
    {
      name: "style / labelStyle",
      type: "CSSProperties",
      description: "Inline style of the frame / of both labels.",
    },
  ],
  usage: {
    description:
      "Use Astryx ProgressBar for a plain progress indicator; this one is a readout whose labels sit on the bar.",
  },
  examples: [
    {
      label: "CPU usage",
      code: '<ProgressWithLabel label="CPU" valueLabel="3 / 8" value={37.5} width={160} />',
    },
  ],
};
