/**
 * `astryx component UncontrolledInput` (and `ui-common component UncontrolledInput`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "UncontrolledInput",
  displayName: "UncontrolledInput",
  import: "@lablup/ui-common",
  category: "Inputs",
  keywords: ["input", "commit", "on blur", "enter", "uncontrolled", "setting"],
  description:
    "A text or number field that reports its value only when the user commits it, by pressing Enter or leaving the field. On Astryx TextInput and NumberInput.",
  props: [
    {
      name: "defaultValue",
      type: "string",
      description: "Initial value. A new value drops an uncommitted edit.",
    },
    {
      name: "onCommit",
      type: "(value: string) => void",
      description: "Called on Enter and on blur.",
    },
    {
      name: "type",
      type: '"text" | "number" | "password" | "email"',
      description: "number renders NumberInput.",
      default: '"text"',
    },
    { name: "placeholder", type: "string", description: "Placeholder text." },
    { name: "isDisabled", type: "boolean", description: "Disable the field." },
    {
      name: "status",
      type: "TextInputStatus",
      description: "Validation state, as on TextInput.",
    },
    {
      name: "label",
      type: "string",
      description: "Accessible name.",
      default: 'the catalog\'s uic.UncontrolledInput.label ("Select"), hidden',
    },
    {
      name: "isLabelHidden",
      type: "boolean",
      description: "Hide the label.",
      default: "true without label, else false",
    },
  ],
  usage: {
    description:
      "For a value whose change is expensive (persisting a setting, refetching). For a live value, use TextInput.",
    bestPractices: [
      {
        guidance: true,
        description: "Pass a real label; the catalog fallback is a placeholder name.",
      },
    ],
  },
  examples: [
    {
      label: "A persisted setting",
      code: '<UncontrolledInput label="Page size" type="number" defaultValue="20" onCommit={setPageSize} />',
    },
  ],
};
