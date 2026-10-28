/**
 * `astryx component Stat` (and `ui-common component Stat`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "Stat",
  displayName: "Stat",
  import: "@lablup/ui-common/lab",
  category: "Content",
  keywords: [
    "stat",
    "kpi",
    "metric",
    "number",
    "value",
    "delta",
    "trend",
    "dashboard",
    "tooltip",
  ],
  description:
    "A KPI/metric display: label, large tabular-nums value, an optional sentiment-aware delta, a supporting description and a trend media slot. ui-common's copy of Astryx lab's Stat: deltaTooltip explains the delta in a tooltip anchored to it. Import Stat from @lablup/ui-common/lab.",
  props: [
    {
      name: "label",
      type: "string",
      description: 'Metric name shown above the value, e.g. "Total requests".',
      required: true,
    },
    {
      name: "value",
      type: "ReactNode",
      description:
        'Headline metric with tabular numerals. Pass a pre-formatted string like "1.2M".',
      required: true,
    },
    {
      name: "delta",
      type: "{value: string, direction: 'up' | 'down' | 'flat', sentiment?: 'positive' | 'negative' | 'neutral'}",
      description:
        "Change indicator next to the value: a direction glyph plus colored text. sentiment overrides the direction color for inverted metrics like error rate.",
    },
    {
      name: "deltaTooltip",
      type: "ReactNode",
      description:
        "Explains the delta, e.g. the ranges it compares and their values. Shown in a tooltip anchored to the delta on hover, keyboard focus and tap; the delta becomes focusable and is described by it. media stays outside it. Ignored without a delta.",
    },
    {
      name: "description",
      type: "string",
      description:
        'Muted supporting line under the value, e.g. "vs. previous 30 days".',
    },
    {
      name: "media",
      type: "ReactNode",
      description:
        "Trend slot below the text, e.g. a sparkline. Stat renders no chart itself.",
    },
    {
      name: "size",
      type: "'sm' | 'md' | 'lg'",
      description: "Size of the value's font.",
      default: "'md'",
    },
  ],
  usage: {
    description:
      "Use deltaTooltip to say what the delta compares instead of wrapping the whole Stat in a Tooltip: the tooltip then opens next to the change, is reachable by keyboard, and leaves a sparkline in media its own tooltip.",
  },
  examples: [
    {
      label: "Delta with an explanation",
      code: 'import { Stat } from "@lablup/ui-common/lab";\n\n<Stat\n  label="Sessions"\n  value="1,204"\n  delta={{ value: "-918", direction: "down" }}\n  deltaTooltip="Previous 7 days: 2,122"\n  description="Last 7 days"\n/>',
    },
  ],
};
