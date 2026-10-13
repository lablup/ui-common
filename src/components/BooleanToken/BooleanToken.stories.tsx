import type { Meta, StoryObj } from "@storybook/react-vite";

import { BooleanToken } from "./BooleanToken";

const meta = {
  title: "Components/BooleanToken",
  component: BooleanToken,
  args: {
    value: true,
  },
} satisfies Meta<typeof BooleanToken>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Values: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <BooleanToken {...args} value={true} />
      <BooleanToken {...args} value={false} />
      <BooleanToken {...args} value={null} />
    </div>
  ),
};

export const CustomLabels: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <BooleanToken {...args} value={true} trueLabel="Enabled" falseLabel="Disabled" />
      <BooleanToken {...args} value={false} trueLabel="Enabled" falseLabel="Disabled" />
    </div>
  ),
};

export const CustomFallback: Story = {
  args: { value: null, fallback: "Not set" },
};
