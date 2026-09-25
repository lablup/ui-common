/**
 * `astryx component Statistic` (and `ui-common component Statistic`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "Statistic",
  displayName: "Statistic",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: ["metric", "statistic", "usage", "quota", "progress", "steps"],
  description:
    "A dashboard metric: a caption, a large value with its unit, and an optional segmented usage bar of value against total. The bar is a strip of notches with role=progressbar and a value / total tooltip. A value that is not finite shows the Unlimited label.",
  props: [
    {
      name: "label",
      type: "ReactNode",
      description: "The caption.",
      required: true,
    },
    {
      name: "value",
      type: "number",
      description: "The value. Not finite renders unlimitedLabel.",
    },
    {
      name: "total",
      type: "number",
      description: "What the value is measured against; the bar needs it.",
    },
    {
      name: "unit",
      type: "string",
      description: "Unit after the value.",
    },
    {
      name: "precision",
      type: "number",
      description: "Decimal places, trailing zeros dropped.",
      default: "2",
    },
    {
      name: "infinityLabel",
      type: "string",
      description: "A non-finite value or total in the bar's tooltip.",
      default: "'∞'",
    },
    {
      name: "progressMode",
      type: "'hidden' | 'placeholder' | 'visible'",
      description:
        "visible draws the bar (with a total), placeholder keeps its space without painting it, hidden leaves it out.",
      default: "'hidden'",
    },
    {
      name: "progressSteps",
      type: "number",
      description: "Notches in the bar.",
      default: "20",
    },
    {
      name: "color",
      type: "string",
      description: "Colour of the value and of the bar's filled notches.",
    },
    {
      name: "unlimitedLabel",
      type: "string",
      description: "Shown for a non-finite value.",
      default: 'the catalog\'s uic.Statistic.unlimited ("Unlimited")',
    },
  ],
  usage: {
    description:
      "A resource or quota figure on a dashboard, where the notch bar tells 3 of 20 from 4 of 20 at a glance. Other div attributes reach the root.",
  },
  examples: [
    {
      label: "Memory against its quota",
      code: '<Statistic label="Memory" value={12} total={64} unit="GiB" progressMode="visible" />',
    },
  ],
};
