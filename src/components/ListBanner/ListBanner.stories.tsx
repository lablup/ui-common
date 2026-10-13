import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ListBanner } from "./ListBanner";
import { withMaxWidth } from "../../stories/helpers";

const users = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    key: `user-${index + 1}`,
    content: `user${index + 1}@example.com`,
  }));

// Annotated rather than `satisfies`: the inferred type reaches into an Astryx
// internal path that a declaration cannot name (TS2742).
const meta: Meta<typeof ListBanner> = {
  title: "Components/ListBanner",
  component: ListBanner,
  args: {
    status: "warning",
    title: "3 users will be updated",
    items: users(3),
  },
  argTypes: {
    status: {
      control: "inline-radio",
      options: ["info", "success", "warning", "error"],
    },
  },
  decorators: [withMaxWidth(480)],
};

export default meta;

type Story = StoryObj<typeof ListBanner>;

export const Default: Story = {};

/** The list scrolls once it passes `maxHeight`. */
export const ManyItems: Story = {
  args: { title: "24 users will be updated", items: users(24) },
};

/** Without a title the list takes the title slot. */
export const WithoutTitle: Story = {
  args: { status: "info", title: undefined },
};

export const Dismissable: Story = {
  args: { isDismissable: true, onDismiss: fn() },
};
