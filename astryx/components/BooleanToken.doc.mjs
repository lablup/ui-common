/**
 * `astryx component BooleanToken` (and `ui-common component BooleanToken`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "BooleanToken",
  displayName: "BooleanToken",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: ["boolean", "true false", "on off", "enabled", "token", "yes no"],
  description:
    "An on/off value as an Astryx Token: green for true, the default outline for false, and a fallback when the value is not a boolean.",
  props: [
    {
      name: "value",
      type: "boolean | null | undefined",
      description: "The value.",
      required: true,
    },
    {
      name: "trueLabel",
      type: "string",
      description: "Label for true.",
      default: "the catalog's uic.BooleanToken.true",
    },
    {
      name: "falseLabel",
      type: "string",
      description: "Label for false.",
      default: "the catalog's uic.BooleanToken.false",
    },
    {
      name: "fallback",
      type: "ReactNode",
      description: "Rendered when the value is not a boolean.",
      default: '"-"',
    },
  ],
  usage: {
    description: "In table cells and metadata lists that show a setting.",
    bestPractices: [
      {
        guidance: true,
        description:
          "Name what true means (Enabled, Public) when the column title does not.",
      },
    ],
  },
  examples: [
    {
      label: "A setting",
      code: '<BooleanToken value={policy.isPublic} trueLabel="Public" falseLabel="Private" />',
    },
  ],
};
