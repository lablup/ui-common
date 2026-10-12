import type { Meta, StoryObj } from "@storybook/react-vite";

import { TokenRow } from "./TokenRow";

const TAGS = ["frontend", "backend", "staging", "nightly", "experimental"].map(
  (label) => ({ key: label, label }),
);

const COLORS = [
  "default",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "cyan",
  "blue",
  "purple",
  "pink",
  "gray",
] as const;

const meta = {
  title: "Components/TokenRow",
  component: TokenRow,
  args: {
    items: TAGS,
  },
  argTypes: {
    color: { control: "select", options: COLORS },
  },
} satisfies Meta<typeof TokenRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllShown: Story = {
  args: { items: TAGS.slice(0, 3) },
};

export const WithTotalCount: Story = {
  args: { items: TAGS.slice(0, 2), maxCount: 2, totalCount: 42 },
};

export const Colors: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 8 }}>
      {COLORS.map((color) => (
        <TokenRow key={color} {...args} color={color} />
      ))}
    </div>
  ),
};

export const CustomMoreLabel: Story = {
  args: { moreLabel: (count) => `+${count}` },
};

export const Empty: Story = {
  args: { items: [] },
};
