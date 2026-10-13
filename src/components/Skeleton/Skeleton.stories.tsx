import type { Meta, StoryObj } from "@storybook/react-vite";

import { SkeletonCard } from "./SkeletonCard";
import { SkeletonChart } from "./SkeletonChart";
import { SkeletonRow } from "./SkeletonRow";
import { SkeletonText } from "./SkeletonText";

const meta = {
  title: "Components/Skeleton",
  component: SkeletonCard,
  subcomponents: { SkeletonText, SkeletonRow, SkeletonChart },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "compact", "stat"] },
  },
} satisfies Meta<typeof SkeletonCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Card: Story = {};

export const CardVariants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
      {(["default", "compact", "stat"] as const).map((variant) => (
        <SkeletonCard key={variant} variant={variant} />
      ))}
    </div>
  ),
};

export const Text: Story = {
  render: () => <SkeletonText lines={4} />,
};

export const Row: Story = {
  render: () => <SkeletonRow count={3} showAvatar showActions />,
};

export const Chart: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, 1fr)" }}>
      {(["bar", "line", "pie", "area"] as const).map((variant) => (
        <SkeletonChart key={variant} variant={variant} height="160px" />
      ))}
    </div>
  ),
};
