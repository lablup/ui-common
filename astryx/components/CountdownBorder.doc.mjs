/**
 * `astryx component CountdownBorder` (and `ui-common component CountdownBorder`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "CountdownBorder",
  displayName: "CountdownBorder",
  import: "@lablup/ui-common",
  category: "Feedback",
  keywords: ["countdown", "auto refresh", "border", "timer", "progress border"],
  description:
    "Wraps its children in a rounded-rect border that fills clockwise over durationMs and starts again: a countdown to the next automatic refresh. It measures its own box, so the outline fits the content; the stroke is centred on the content's edge. No animation under prefers-reduced-motion. style.stroke (default var(--color-accent)), style.strokeWidth (1.5) and style.borderRadius (the theme's --radius-inner) style the border; the rest of style reaches the wrapper.",
  props: [
    {
      name: "durationMs",
      type: "number",
      description: "Length of one fill cycle.",
      required: true,
    },
    {
      name: "isAnimated",
      type: "boolean",
      description: "Whether the border shows and fills.",
      default: "true",
    },
    {
      name: "resetKey",
      type: "Key",
      description:
        "Restarts the fill when it changes; pass the real refresh's trigger.",
    },
    {
      name: "isPaused",
      type: "boolean",
      description: "Freezes the fill and hides the border while a refresh runs.",
      default: "false",
    },
    {
      name: "className / style",
      type: "string / CSSProperties",
      description:
        "The wrapper's class and style; see the description for the border keys.",
    },
  ],
  usage: {
    description:
      "Wrap an auto-refresh control so the user sees when the next refresh lands. Drive resetKey and isPaused from the same state as the refresh.",
  },
  examples: [
    {
      label: "Auto-refresh button",
      code: '<CountdownBorder durationMs={5000} resetKey={fetchKey} isPaused={isFetching}>\n  <IconButton label="Refresh" icon={<RotateCw />} onClick={refetch} />\n</CountdownBorder>',
    },
  ],
};
