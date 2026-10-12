import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { Icon } from "../../astryx/Icon";
import { ConfirmPopover } from "./ConfirmPopover";
import { overlayDocs } from "../../stories/helpers";

const meta = {
  title: "Components/ConfirmPopover",
  component: ConfirmPopover,
  args: {
    title: "Deactivate this key?",
    description: "It can be restored later.",
    actionLabel: "Deactivate",
    onAction: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
    children: <Button label="Deactivate" />,
  },
  argTypes: {
    // The trigger element; editing it as JSON in Controls only breaks it.
    children: { control: false },
    actionVariant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "destructive"],
    },
  },
  parameters: overlayDocs("240px"),
} satisfies Meta<typeof ConfirmPopover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Destructive: Story = {
  args: { actionVariant: "destructive" },
};

export const WithIcon: Story = {
  args: { icon: <Icon icon="warning" size="sm" /> },
};

export const TitleOnly: Story = {
  args: {
    title: "Reset the form?",
    description: undefined,
    actionLabel: "Reset",
    children: <Button label="Reset" variant="secondary" />,
  },
};

/** A returned promise keeps the popover open, and the button pending, until it settles. */
export const PendingAction: Story = {
  args: {
    onAction: fn(() => new Promise<void>((resolve) => setTimeout(resolve, 1500))),
  },
};

export const ActionDisabled: Story = {
  args: { isActionDisabled: true },
};
