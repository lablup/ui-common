/**
 * `astryx component DoubleBadge` (and `ui-common component DoubleBadge`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "DoubleBadge",
  displayName: "DoubleBadge",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: ["badge", "pair", "welded", "status and detail", "badge group"],
  description:
    "A run of Astryx Badges welded into one chip, for a live pair such as a status and its detail. Neighbours overlap by one border width and square their inner corners.",
  props: [
    {
      name: "values",
      type: "Array<string> | Array<{ label: string; variant?: BadgeVariant }>",
      description:
        "The badges, in order. A string is a neutral Badge; an empty label is skipped.",
    },
  ],
  usage: {
    description:
      "For values the system changes on its own. An empty list renders nothing.",
    bestPractices: [
      { guidance: true, description: "Keep it to two or three parts." },
      {
        guidance: false,
        description: "Use it for values only a user edits; weld Tokens for those.",
      },
    ],
  },
  examples: [
    {
      label: "Status and elapsed time",
      code: '<DoubleBadge values={[{ label: "RUNNING", variant: "success" }, "2m"]} />',
    },
  ],
};
