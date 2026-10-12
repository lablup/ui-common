import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CircleAlert, CircleHelp, Info } from "lucide-react";

import { IconWithTooltip } from "./IconWithTooltip";

const meta = {
  title: "Components/IconWithTooltip",
  component: IconWithTooltip,
  args: {
    icon: <CircleHelp size={16} />,
    content: "Counts only running sessions.",
    onOpenChange: fn(),
  },
  argTypes: {
    placement: { control: "select", options: ["above", "below", "start", "end"] },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 48 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IconWithTooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  args: { isDefaultOpen: true },
};

export const NotFocusable: Story = {
  args: { focusable: false },
};

export const RichContent: Story = {
  args: {
    icon: <Info size={16} />,
    content: (
      <span>
        Usage is sampled every <strong>5 minutes</strong>.
      </span>
    ),
  },
};

export const InlineWithText: Story = {
  render: (args) => (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      Quota exceeded
      <IconWithTooltip
        {...args}
        icon={<CircleAlert size={14} />}
        content="Remove unused files to free up space."
      />
    </span>
  ),
};
