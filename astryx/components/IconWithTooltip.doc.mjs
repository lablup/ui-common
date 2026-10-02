/**
 * `astryx component IconWithTooltip` (and `ui-common component IconWithTooltip`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "IconWithTooltip",
  displayName: "IconWithTooltip",
  import: "@lablup/ui-common",
  category: "Overlay",
  keywords: ["help icon", "info icon", "tooltip", "hint", "question mark"],
  description:
    "A glyph that explains itself: the icon in an unstyled, focusable button wrapped in an Astryx Tooltip, named by the tooltip's text. Takes every Tooltip prop except children and anchorRef.",
  props: [
    { name: "icon", type: "ReactNode", description: "The glyph.", required: true },
    {
      name: "content",
      type: "ReactNode",
      description: "The tooltip; its text names the trigger.",
      required: true,
    },
    {
      name: "focusable",
      type: "boolean",
      description:
        "false renders a plain span (hover only), for use inside a link or an option.",
      default: "true",
    },
    {
      name: "className",
      type: "string",
      description: "Extra class names on the trigger.",
    },
    {
      name: "style",
      type: "CSSProperties",
      description: "Inline styles on the trigger.",
    },
  ],
  usage: {
    description: "Next to a label or a value that needs a sentence of explanation.",
    bestPractices: [
      { guidance: true, description: "Keep the hint short; it is read on hover." },
      {
        guidance: false,
        description: "Put information only here that a user needs to act.",
      },
    ],
  },
  examples: [
    {
      label: "Help glyph",
      code: '<IconWithTooltip icon={<CircleHelp />} content="Counts running sessions only." />',
    },
  ],
};
