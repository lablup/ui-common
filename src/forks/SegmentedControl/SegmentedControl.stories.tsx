import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import {
  SegmentedControl,
  SegmentedControlItem,
  type SegmentedControlProps,
} from "./index";
import { useArgState } from "../../stories/helpers";

/** Holds the value, so picking a segment changes the control. */
function SegmentedControlDemo(args: SegmentedControlProps) {
  const [value, setValue] = useArgState<string>(args.value);
  return (
    <SegmentedControl
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange(next);
      }}
    >
      <SegmentedControlItem value="grid" label="Grid" />
      <SegmentedControlItem value="list" label="List" />
      <SegmentedControlItem value="table" label="Table" isDisabled />
    </SegmentedControl>
  );
}

/**
 * The fork's fix: a passed `aria-describedby` describes the radiogroup.
 * `Hint` shows it; `SegmentedControlItem` is upstream's, copied for the
 * context.
 */
const meta = {
  title: "Forks/SegmentedControl",
  component: SegmentedControl,
  subcomponents: { SegmentedControlItem },
  args: { label: "View", value: "grid", onChange: fn(), children: null },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    layout: { control: "inline-radio", options: ["hug", "fill"] },
    children: { control: false },
  },
  render: (args) => <SegmentedControlDemo {...args} />,
} satisfies Meta<typeof SegmentedControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hint: Story = {
  render: (args) => (
    <>
      <p id="view-hint">Applies to every list.</p>
      <SegmentedControlDemo {...args} aria-describedby="view-hint" />
    </>
  ),
};

export const DisabledWithReason: Story = {
  args: { isDisabled: true, disabledMessage: "Locked by your administrator." },
};
