import type { Meta, StoryObj } from "@storybook/react-vite";

import { DoubleBadge } from "./DoubleBadge";

const meta = {
  title: "Components/DoubleBadge",
  component: DoubleBadge,
  args: {
    values: [{ label: "RUNNING", variant: "success" }, "2m"],
  },
} satisfies Meta<typeof DoubleBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      {(["neutral", "info", "success", "warning", "error"] as const).map((variant) => (
        <DoubleBadge
          key={variant}
          values={[{ label: variant.toUpperCase(), variant }, "5m"]}
        />
      ))}
    </div>
  ),
};

export const ThreeValues: Story = {
  args: {
    values: [
      { label: "PENDING", variant: "warning" },
      { label: "Queued", variant: "info" },
      "12s",
    ],
  },
};

export const Single: Story = {
  args: { values: ["Draft"] },
};
