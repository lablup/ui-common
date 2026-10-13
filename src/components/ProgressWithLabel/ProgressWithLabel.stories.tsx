import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProgressWithLabel } from "./ProgressWithLabel";

const meta = {
  title: "Components/ProgressWithLabel",
  component: ProgressWithLabel,
  args: {
    label: "CPU",
    valueLabel: "3 / 8 cores",
    value: 37.5,
    width: 220,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof ProgressWithLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 12 }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <ProgressWithLabel key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const CustomColor: Story = {
  args: {
    label: "Memory",
    valueLabel: "58 / 64 GiB",
    value: 90.6,
    color: "var(--color-warning)",
  },
};

export const MissingValue: Story = {
  args: { label: "GPU", valueLabel: "-", value: undefined },
};

export const OverFull: Story = {
  args: { label: "Storage", valueLabel: "12 / 8 TiB", value: 150 },
};

export const WithoutValueLabel: Story = {
  args: { hasValueLabel: false },
};

export const FillsContainer: Story = {
  args: { width: undefined },
  render: (args) => (
    <div style={{ display: "flex", maxWidth: 480 }}>
      <ProgressWithLabel {...args} />
    </div>
  ),
};
