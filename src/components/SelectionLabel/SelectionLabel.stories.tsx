import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { SelectionLabel } from "./SelectionLabel";

const meta = {
  title: "Components/SelectionLabel",
  component: SelectionLabel,
  args: {
    count: 3,
    onClear: fn(),
  },
} satisfies Meta<typeof SelectionLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutClearButton: Story = {
  args: { onClear: undefined },
};

export const CustomLabels: Story = {
  args: { label: "3 files chosen", clearLabel: "Clear choice" },
};
