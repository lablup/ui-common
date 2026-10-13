import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { CheckboxInput } from "../../astryx/CheckboxInput";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { overlayDocs, useOpenState } from "../../stories/helpers";

const folders = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    key: `folder-${index + 1}`,
    label: `dataset-${index + 1}`,
  }));

function BackupOption() {
  const [value, setValue] = useState(false);
  return (
    <CheckboxInput
      label="Also delete the folders' backups"
      value={value}
      onChange={setValue}
    />
  );
}

const meta = {
  title: "Components/DeleteConfirmModal",
  component: DeleteConfirmModal,
  argTypes: {
    extraContent: { control: false },
  },
  args: {
    isOpen: true,
    onOpenChange: fn(),
    onAction: fn(),
    items: [{ key: "folder-1", label: "training-data" }],
  },
  parameters: overlayDocs("440px"),
  render: function Render(args) {
    const [isOpen, setOpen] = useOpenState(args.isOpen, args.onOpenChange);
    return (
      <>
        <Button label="Delete" variant="destructive" onClick={() => setOpen(true)} />
        <DeleteConfirmModal {...args} isOpen={isOpen} onOpenChange={setOpen} />
      </>
    );
  },
} satisfies Meta<typeof DeleteConfirmModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTarget: Story = {
  args: { target: "Folder" },
};

/** Several items: the user types the confirm text before the action enables. */
export const MultipleItems: Story = {
  args: { items: folders(3), target: "Folder" },
};

/** A long selection scrolls inside `itemListMaxHeight`. */
export const ManyItems: Story = {
  args: { items: folders(20), target: "Folder" },
};

export const ConfirmInputRequired: Story = {
  args: { target: "Folder", isConfirmInputRequired: true },
};

export const Reversible: Story = {
  args: {
    title: "Revoke access",
    description: "Revoke access to these folders? They can be shared again later.",
    items: folders(2),
    actionLabel: "Revoke",
    isReversible: true,
  },
};

export const WithExtraContent: Story = {
  args: {
    items: folders(2),
    extraContent: <BackupOption />,
  },
};

export const PlainItems: Story = {
  args: { items: folders(2), isReversible: true, hasPlainItems: true },
};
