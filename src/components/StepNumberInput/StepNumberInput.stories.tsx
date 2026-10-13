import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { InputGroup } from "../../astryx/InputGroup";
import { NumberInput } from "../../astryx/NumberInput";
import { getNextStepIndex, NumberStepper } from "./NumberStepper";
import { StepNumberInput, type StepNumberInputProps } from "./StepNumberInput";
import { useArgState, withMaxWidth } from "../../stories/helpers";

const MEMORY_STEPS = [0.25, 0.5, 1, 2, 4, 8, 16];

/** Holds the value in state, so the stepper and typing both update the field. */
function ControlledStepNumberInput(args: StepNumberInputProps) {
  const [value, setValue] = useArgState(args.value ?? args.steps[0] ?? 0);
  return (
    <StepNumberInput
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange?.(next);
      }}
    />
  );
}

/** A plain `NumberInput` with a `NumberStepper` that doubles and halves. */
function PowerOfTwoField() {
  const steps = [1, 2, 4, 8, 16, 32, 64, 128];
  const [value, setValue] = useState<number | null>(8);
  return (
    <InputGroup label="Batch size">
      <NumberInput
        label="Batch size"
        isLabelHidden
        value={value}
        onChange={setValue}
        width="100%"
      />
      <NumberStepper
        onStep={(direction) => {
          const index = getNextStepIndex(steps, value ?? 0, direction);
          const next = steps[index];
          if (next !== undefined) setValue(next);
        }}
      />
    </InputGroup>
  );
}

const meta = {
  title: "Components/StepNumberInput",
  component: StepNumberInput,
  subcomponents: { NumberStepper },
  args: {
    label: "Shared memory",
    steps: MEMORY_STEPS,
    value: 1,
    units: "GiB",
    onChange: fn(),
  },
  decorators: [withMaxWidth(240)],
  render: (args) => <ControlledStepNumberInput {...args} />,
} satisfies Meta<typeof StepNumberInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMinMax: Story = {
  args: { min: 0.5, max: 8, value: 2 },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const Stepper: Story = {
  render: () => <PowerOfTwoField />,
};
