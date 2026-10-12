import type { Meta, StoryObj } from "@storybook/react-vite";

import { Statistic } from "./Statistic";

const meta = {
  title: "Components/Statistic",
  component: Statistic,
  args: {
    label: "Memory",
    value: 12,
    total: 64,
    unit: "GiB",
  },
  argTypes: {
    progressMode: {
      control: "inline-radio",
      options: ["hidden", "placeholder", "visible"],
    },
  },
} satisfies Meta<typeof Statistic>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ProgressModes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 32 }}>
      {(["hidden", "placeholder", "visible"] as const).map((progressMode) => (
        <Statistic key={progressMode} {...args} progressMode={progressMode} />
      ))}
    </div>
  ),
};

export const CustomSteps: Story = {
  args: {
    label: "Accelerators",
    value: 3,
    total: 8,
    unit: "",
    progressMode: "visible",
    progressSteps: 8,
  },
};

export const CustomColor: Story = {
  args: {
    label: "Disk",
    value: 1.8,
    total: 2,
    unit: "TiB",
    progressMode: "visible",
    color: "var(--color-error)",
  },
};

export const Precision: Story = {
  args: {
    label: "Load average",
    value: 3.14159,
    total: undefined,
    unit: "",
    precision: 3,
  },
};

export const Unlimited: Story = {
  args: { label: "Quota", value: Infinity, total: Infinity, progressMode: "visible" },
};
