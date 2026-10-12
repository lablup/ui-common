import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell } from "lucide-react";

import { IconButton } from "../../astryx/IconButton";
import { CountBadge } from "./CountBadge";

const anchor = <IconButton label="Notifications" icon={<Bell size={16} />} />;

const meta = {
  title: "Components/CountBadge",
  component: CountBadge,
  args: {
    count: 3,
    label: "3 unread notifications",
    variant: "error",
    children: anchor,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    variant: {
      control: "select",
      options: ["neutral", "info", "success", "warning", "error"],
    },
  },
} satisfies Meta<typeof CountBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OverMax: Story = {
  args: { count: 250, label: "More than 99 unread notifications" },
};

export const CustomMax: Story = {
  args: { count: 12, max: 9, label: "More than 9 unread notifications" },
};

export const Dot: Story = {
  args: { hasDot: true, label: "New notifications" },
};

export const Zero: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
      <CountBadge {...args} count={0} label="No unread notifications" />
      <CountBadge {...args} count={0} isZeroShown label="No unread notifications" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
      {(["md", "sm"] as const).map((size) => (
        <CountBadge key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
      {(["neutral", "info", "success", "warning", "error"] as const).map((variant) => (
        <CountBadge key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const WithOffset: Story = {
  args: { offset: [4, -4] },
};
