import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ColorPicker, type ColorPickerProps } from "./ColorPicker";

/** Holds the colour in state; clearing sets it to `null`. */
function ControlledColorPicker(args: ColorPickerProps) {
  const [value, setValue] = useState<string | null | undefined>(args.value);
  return (
    <ColorPicker
      {...args}
      value={value}
      onChange={(hex) => {
        setValue(hex);
        args.onChange?.(hex);
      }}
      onClear={() => {
        setValue(null);
        args.onClear?.();
      }}
    />
  );
}

const meta = {
  title: "Components/ColorPicker",
  component: ColorPicker,
  args: {
    value: "#3b82f6",
    onChange: fn(),
    onClear: fn(),
  },
  render: (args) => <ControlledColorPicker {...args} />,
} satisfies Meta<typeof ColorPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithClear: Story = {
  args: { hasValueLabel: true, hasClear: true },
};

export const NoColor: Story = {
  args: { value: null, hasValueLabel: true, hasClear: true },
};

export const ShortHexAndRgb: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12 }}>
      <ControlledColorPicker {...args} value="#f80" hasValueLabel />
      <ControlledColorPicker {...args} value="rgb(16, 185, 129)" hasValueLabel />
    </div>
  ),
};

export const Disabled: Story = {
  args: { hasValueLabel: true, isDisabled: true },
};
