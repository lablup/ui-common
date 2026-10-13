import type { Meta, StoryObj } from "@storybook/react-vite";

import { TokenList } from "./TokenList";

const EMAILS = [
  "alice@example.com",
  "bob@example.com",
  "carol@example.com",
  "dave@example.com",
  "erin@example.com",
  "frank@example.com",
];

const meta = {
  title: "Components/TokenList",
  component: TokenList,
  args: {
    items: EMAILS,
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["token", "text"] },
    trigger: { control: "inline-radio", options: ["hover", "click"] },
  },
} satisfies Meta<typeof TokenList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TextVariant: Story = {
  args: { variant: "text", maxInline: 2 },
};

export const ClickTrigger: Story = {
  args: { trigger: "click" },
};

export const NoOverflow: Story = {
  args: { items: EMAILS.slice(0, 2) },
};

export const Numbers: Story = {
  args: { items: [8080, 8443, 9000, 9090, 3000], variant: "text" },
};

export const Empty: Story = {
  args: { items: [] },
};

export const CustomEmptyText: Story = {
  args: { items: [], emptyText: "No recipients" },
};
