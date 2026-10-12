import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy } from "lucide-react";

import { DoubleToken } from "./DoubleToken";

const meta = {
  title: "Components/DoubleToken",
  component: DoubleToken,
  args: {
    values: [{ label: "CUDA", color: "green" }, "12.4"],
  },
} satisfies Meta<typeof DoubleToken>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Colors: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      {(["default", "green", "orange", "purple", "gray"] as const).map((color) => (
        <DoubleToken key={color} values={[{ label: "Python", color }, "3.12"]} />
      ))}
    </div>
  ),
};

export const ThreeValues: Story = {
  args: {
    values: [
      { label: "project", color: "gray" },
      { label: "storage", color: "purple" },
      "data",
    ],
  },
};

export const HighlightKeyword: Story = {
  args: {
    values: [{ label: "Python", color: "green" }, "3.12"],
    highlightKeyword: "py",
  },
};

export const WithEndContent: Story = {
  args: {
    values: [
      { label: "region", color: "gray" },
      {
        label: "example-west-1",
        endContent: (
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
            example-west-1
            <Copy size={12} aria-hidden />
          </span>
        ),
      },
    ],
  },
};
