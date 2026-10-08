import type { Meta, StoryObj } from "@storybook/react-vite";

import { StatCard } from "./StatCard";

const meta = {
  title: "Components/StatCard",
  component: StatCard,
  args: {
    label: "Active sessions",
    value: 1284,
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "success", "warning", "danger", "info"],
    },
    emphasis: {
      control: "inline-radio",
      options: ["compact", "default", "prominent"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSuffixAndHint: Story = {
  args: {
    label: "GPUs in use",
    value: 3,
    valueSuffix: "/ 4",
    hint: "Across 2 nodes",
  },
};

export const WithTrend: Story = {
  args: {
    trend: { direction: "up", label: "+12%", ariaLabel: "Up 12 percent" },
  },
};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 12 }}>
      {(["default", "success", "warning", "danger", "info"] as const).map((tone) => (
        <StatCard key={tone} {...args} label={tone} tone={tone} />
      ))}
    </div>
  ),
};

export const Loading: Story = {
  args: { loading: true },
};

export const AnimatedDigits: Story = {
  args: { animate: "digits" },
};
