/**
 * `astryx component StepNumberInput` (and `ui-common component StepNumberInput`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "StepNumberInput",
  displayName: "StepNumberInput",
  import: "@lablup/ui-common",
  category: "Inputs",
  keywords: [
    "number",
    "stepper",
    "steps",
    "ladder",
    "power of two",
    "non-linear",
    "spin",
  ],
  description:
    "A number field that steps along a list of values (1, 2, 4, 8, ...) on its stepper and on ArrowUp/ArrowDown, where NumberInput steps linearly. The same module exports NumberStepper, the stepper column for an InputGroup, and getNextStepIndex, for fields that build their own stepping.",
  props: [
    { name: "label", type: "string", description: "Accessible name.", required: true },
    {
      name: "steps",
      type: "readonly number[]",
      description: "The values the stepper moves between.",
      required: true,
    },
    { name: "value", type: "number", description: "The value, when controlled." },
    {
      name: "defaultValue",
      type: "number",
      description: "First value when uncontrolled.",
      default: "steps[0]",
    },
    {
      name: "onChange",
      type: "(value: number) => void",
      description: "Called with the new value. A cleared field reports 0.",
    },
    {
      name: "min",
      type: "number",
      description: "Lower bound for typing and stepping.",
    },
    {
      name: "max",
      type: "number",
      description: "Upper bound for typing and stepping.",
    },
    { name: "units", type: "string", description: 'Unit shown in the field ("GiB").' },
    {
      name: "isLabelHidden",
      type: "boolean",
      description: "Hides the label visually.",
      default: "false",
    },
    { name: "placeholder", type: "string", description: "Placeholder." },
    {
      name: "isDisabled",
      type: "boolean",
      description: "Disables the field and the stepper.",
    },
    {
      name: "increaseLabel",
      type: "string",
      description: "Accessible name of the step-up button.",
      default: 'the catalog\'s uic.NumberStepper.increase ("Increase")',
    },
    {
      name: "decreaseLabel",
      type: "string",
      description: "Accessible name of the step-down button.",
      default: 'the catalog\'s uic.NumberStepper.decrease ("Decrease")',
    },
  ],
  usage: {
    description:
      "Quantities that grow geometrically, such as sizes and counts of accelerators. For a linear step, use NumberInput with hasNumberSteppers.",
  },
  examples: [
    {
      label: "Power-of-two sizes",
      code: `<StepNumberInput
  label="Shared memory"
  steps={[0.25, 0.5, 1, 2, 4, 8]}
  units="GiB"
  value={value}
  onChange={setValue}
/>`,
    },
    {
      label: "The stepper alone, for a field of your own",
      code: `<InputGroup label="Size" isLabelHidden>
  <NumberInput label="Size" isLabelHidden value={value} onChange={setValue} />
  <NumberStepper onStep={(direction) => setValue(nextValue(direction))} />
</InputGroup>`,
    },
  ],
};
