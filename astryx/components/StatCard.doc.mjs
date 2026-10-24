/**
 * `astryx component StatCard` (and `ui-common component StatCard`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "StatCard",
  displayName: "StatCard",
  import: "@lablup/ui-common",
  category: "Container",
  keywords: [
    "stat card",
    "metric card",
    "kpi",
    "dashboard card",
    "summary card",
    "trend",
    "sparkline",
    "count up",
  ],
  description:
    "A compact metric card for dashboards, built on Astryx Card: an uppercase label, a large value with an optional suffix, and optionally an icon, hint line, trend, sparkline or tone. With onClick it becomes a ClickableCard. Numeric values are formatted with toLocaleString (or format) and can count up or pop their digits in; both are off under prefers-reduced-motion. While loading it shows skeletons.",
  props: [
    {
      name: "label",
      type: "string",
      description:
        "Short label above the value. Also the accessible name unless ariaLabel is set.",
      required: true,
    },
    {
      name: "labelNode",
      type: "ReactNode",
      description:
        "Shown in place of label when it is not plain text (a glossary term, an info tip). Pass the same words in label.",
    },
    {
      name: "value",
      type: "string | number",
      description: "The metric.",
      required: true,
    },
    {
      name: "valueSuffix",
      type: "string",
      description: 'Appended to the value ("/ 4", "GB").',
    },
    {
      name: "hint",
      type: "ReactNode",
      description: "Helper line under the value.",
    },
    {
      name: "icon",
      type: "ReactNode",
      description: "Leading icon, drawn in an accent badge.",
    },
    {
      name: "tone",
      type: "'default' | 'success' | 'warning' | 'danger' | 'info'",
      description: "Accent tone.",
      default: "'default'",
    },
    {
      name: "trend",
      type: "{ direction: 'up' | 'down' | 'flat'; label: string; ariaLabel?: string }",
      description: "Trend indicator under the value.",
    },
    {
      name: "emphasis",
      type: "'compact' | 'default' | 'prominent'",
      description: "Visual weight; sets the card padding.",
      default: "'default'",
    },
    {
      name: "animate",
      type: "boolean | 'count' | 'digits'",
      description:
        "Animate a numeric value on mount and on change: true or 'count' counts up, 'digits' pops each character in. Ignored for string values and while loading.",
      default: "false",
    },
    {
      name: "format",
      type: "(value: number) => string",
      description:
        'Formats a numeric value ("1.2K", "98%"); defaults to toLocaleString.',
    },
    {
      name: "sparkline",
      type: "ReactNode",
      description: "Trailing visual on the value line.",
    },
    {
      name: "onClick",
      type: "() => void",
      description: "Renders the card as an Astryx ClickableCard.",
    },
    {
      name: "loading",
      type: "boolean",
      description: "Skeletons in place of the value, trend and hint.",
      default: "false",
    },
    {
      name: "ariaLabel",
      type: "string",
      description: "Overrides the accessible name (default: label and value).",
    },
    {
      name: "className / testId",
      type: "string",
      description: "Extra class on the root; data-testid.",
    },
  ],
  usage: {
    description:
      "One card per headline number, in a grid. Use Statistic instead for a value against a total with a usage bar. Pass the loading prop while the number is fetched so the card keeps its size.",
  },
  examples: [
    {
      label: "Metric with a trend",
      code: '<StatCard\n  label="Active sessions"\n  value={1284}\n  icon={<Activity />}\n  tone="success"\n  animate="digits"\n  trend={{ direction: "up", label: "+12%" }}\n  hint="vs. last week"\n/>',
    },
  ],
};
