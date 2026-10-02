/**
 * `astryx component CountBadge` (and `ui-common component CountBadge`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "CountBadge",
  displayName: "CountBadge",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: ["count", "badge", "overlay", "notification dot", "unread", "99+"],
  description:
    "A count or a dot overlaid on the top-end corner of its child, such as unread notices on a bell. Astryx Badge is an inline pill with no anchored form; CountBadge positions one. The overlay is a named role=status live region.",
  props: [
    {
      name: "count",
      type: "number | ReactNode",
      description: "The number, or node, shown.",
    },
    {
      name: "hasDot",
      type: "boolean",
      description: "A bare dot instead of the count.",
      default: "false",
    },
    {
      name: "max",
      type: "number",
      description: "A numeric count above this renders as `${max}+`.",
      default: "99",
    },
    {
      name: "isZeroShown",
      type: "boolean",
      description: "Keep the overlay when the count is 0.",
      default: "false",
    },
    {
      name: "offset",
      type: "[number, number]",
      description: "Pixel nudge of the overlay: +x right, +y down.",
    },
    {
      name: "size",
      type: "'sm' | 'md'",
      description: "`sm` is a denser pill for tab rails and table headers.",
      default: "'md'",
    },
    {
      name: "label",
      type: "string",
      description: 'Accessible name of the overlay, e.g. "3 unread notifications".',
    },
    {
      name: "variant",
      type: "BadgeVariant",
      description: "The Badge variant; also colours the dot.",
      default: "'neutral'",
    },
    {
      name: "children",
      type: "ReactNode",
      description: "The element the overlay is anchored to.",
    },
    {
      name: "className",
      type: "string",
      description: "On the wrapper around the child, so a rule can scope the overlay.",
    },
  ],
  usage: {
    description:
      "Wrap the element the count belongs to. A zero or missing count renders nothing.",
    bestPractices: [
      {
        guidance: true,
        description:
          "Give it a label: a dot has no text, and a bare number rarely says what it counts.",
      },
      {
        guidance: false,
        description: "Use it for a standalone pill; that is Astryx Badge.",
      },
    ],
  },
  examples: [
    {
      label: "Unread notices on a button",
      code: '<CountBadge count={unread} variant="error" label={`${unread} unread`}>\n  <IconButton icon={<Bell />} label="Notifications" />\n</CountBadge>',
    },
  ],
};
