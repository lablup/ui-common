import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { CheckboxInput, type CheckboxInputProps } from "./CheckboxInput";
import { useArgState } from "../../stories/helpers";

/** Holds the value, so toggling changes the control. */
function CheckboxInputDemo(args: CheckboxInputProps) {
  const [value, setValue] = useArgState<boolean>(args.value === true);
  return (
    <CheckboxInput
      {...args}
      value={value}
      onChange={(next, event) => {
        setValue(next);
        args.onChange?.(next, event);
      }}
    />
  );
}

const meta = {
  title: "Forks/CheckboxInput",
  component: CheckboxInput,
  args: { label: "Accept terms", value: false, onChange: fn() },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  render: (args) => <CheckboxInputDemo {...args} />,
} satisfies Meta<typeof CheckboxInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const On: Story = {
  args: { value: true },
};

export const WithDescription: Story = {
  args: { description: "You can withdraw at any time." },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const WithStatus: Story = {
  args: { status: { type: "error", message: "Required." } },
};
