import type { Meta, StoryObj } from "@storybook/react-vite";

import { StatCard } from "../StatCard/StatCard";
import { DividedRow } from "./DividedRow";
import { withMaxWidth } from "../../stories/helpers";

const STATS = [
  { label: "CPU", value: "4 cores" },
  { label: "Memory", value: "16 GiB" },
  { label: "Storage", value: "120 GiB" },
  { label: "Accelerators", value: "2" },
  { label: "Uptime", value: "3 days" },
];

const items = STATS.map((stat) => (
  <div key={stat.label}>
    <div>{stat.label}</div>
    <strong>{stat.value}</strong>
  </div>
));

const meta = {
  title: "Components/DividedRow",
  component: DividedRow,
  args: {
    children: items,
  },
  argTypes: {
    wrap: { control: "inline-radio", options: ["wrap", "nowrap"] },
  },
} satisfies Meta<typeof DividedRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Wrapped: Story = {
  decorators: [withMaxWidth(360)],
};

export const NoWrap: Story = {
  args: { wrap: "nowrap", columnGap: 24 },
};

export const CustomDivider: Story = {
  args: { dividerWidth: 2, dividerInset: 6, columnGap: 32, rowGap: 16 },
};

export const WithStatCards: Story = {
  args: {
    columnGap: 24,
    children: [
      <StatCard
        key="sessions"
        label="Active sessions"
        value={128}
        emphasis="compact"
      />,
      <StatCard
        key="queued"
        label="Queued"
        value={7}
        emphasis="compact"
        tone="warning"
      />,
      <StatCard
        key="failed"
        label="Failed"
        value={2}
        emphasis="compact"
        tone="danger"
      />,
    ],
  },
};
