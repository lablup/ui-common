import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { AlertModal } from "./AlertModal";
import { overlayDocs, useOpenState } from "../../stories/helpers";

const meta = {
  title: "Components/AlertModal",
  component: AlertModal,
  args: {
    isOpen: true,
    onOpenChange: fn(),
    title: "Delete this session?",
    description: "The session and its unsaved work will be lost.",
    actionLabel: "Delete",
    onAction: fn(),
  },
  argTypes: {
    actionVariant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "destructive"],
    },
  },
  parameters: overlayDocs("360px"),
  render: function Render(args) {
    const [isOpen, setOpen] = useOpenState(args.isOpen, args.onOpenChange);
    return (
      <>
        <Button label="Open alert" onClick={() => setOpen(true)} />
        <AlertModal {...args} isOpen={isOpen} onOpenChange={setOpen} />
      </>
    );
  },
} satisfies Meta<typeof AlertModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NonDestructive: Story = {
  args: {
    title: "Restart the service?",
    description: "Running requests finish first. This takes about a minute.",
    actionLabel: "Restart",
    actionVariant: "primary",
  },
};

export const ActionLoading: Story = {
  args: { isActionLoading: true, isCancelDisabled: true },
};

export const ActionDisabled: Story = {
  args: { isActionDisabled: true },
};

export const CustomCancelLabel: Story = {
  args: { cancelLabel: "Keep session" },
};
