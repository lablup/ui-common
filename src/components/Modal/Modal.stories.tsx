import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { Text } from "../../astryx/Text";
import { Modal } from "./Modal";
import { ModalHeader } from "./index";
import { overlayDocs, useOpenState } from "../../stories/helpers";

const meta = {
  title: "Components/Modal",
  component: Modal,
  subcomponents: { ModalHeader },
  args: {
    isOpen: true,
    onOpenChange: fn(),
    title: "Rename folder",
    onAction: fn(),
    actionLabel: "Rename",
    children: <Text>The new name applies to every member of the project.</Text>,
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["standard", "fullscreen"] },
    purpose: { control: "inline-radio", options: ["info", "form", "required"] },
    actionVariant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "destructive"],
    },
  },
  parameters: overlayDocs("400px"),
  render: function Render(args) {
    const [isOpen, setOpen] = useOpenState(args.isOpen, args.onOpenChange);
    return (
      <>
        <Button label="Open modal" onClick={() => setOpen(true)} />
        <Modal {...args} isOpen={isOpen} onOpenChange={setOpen} />
      </>
    );
  },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSubtitle: Story = {
  args: { subtitle: "Folder names must be unique within the project." },
};

export const Loading: Story = {
  args: { isLoading: true, isActionDisabled: true },
};

export const ActionLoading: Story = {
  args: { isActionLoading: true },
};

/** Without `onAction` or `footer` there is no footer; closing is the header's job. */
export const WithoutFooter: Story = {
  args: {
    title: "About this folder",
    onAction: undefined,
    actionLabel: undefined,
    children: <Text>Created three days ago. 1.2 GB in 48 files.</Text>,
  },
};

export const CustomFooter: Story = {
  args: {
    onAction: undefined,
    actionLabel: undefined,
    footer: <Text color="secondary">Changes save automatically.</Text>,
  },
};

/** Without `title`, `onAction` or `footer`, `children` is the whole surface. */
export const Bare: Story = {
  args: {
    title: undefined,
    onAction: undefined,
    actionLabel: undefined,
    children: (
      <div style={{ padding: 24 }}>
        <Text>Everything inside is the caller&apos;s own layout.</Text>
      </div>
    ),
  },
};

/** `ModalHeader` builds a header by hand, for a surface without the generated one. */
export const Header: Story = {
  render: function Render(args) {
    const [isOpen, setOpen] = useOpenState(args.isOpen, args.onOpenChange);
    return (
      <>
        <Button label="Open modal" onClick={() => setOpen(true)} />
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
          <ModalHeader
            title="Folder details"
            subtitle="Read only"
            onOpenChange={setOpen}
          />
          <div style={{ padding: 24 }}>
            <Text>Created three days ago. 1.2 GB in 48 files.</Text>
          </div>
        </Modal>
      </>
    );
  },
};

/** A modal opened from inside another paints above it and takes Escape. */
export const Nested: Story = {
  render: function Render(args) {
    const [isInnerOpen, setIsInnerOpen] = useState(false);
    const [isOpen, setOpen] = useOpenState(args.isOpen, args.onOpenChange);
    return (
      <>
        <Button label="Open modal" onClick={() => setOpen(true)} />
        <Modal
          isOpen={isOpen}
          onOpenChange={setOpen}
          title="Project settings"
          footer={null}
        >
          <Button label="Open nested modal" onClick={() => setIsInnerOpen(true)} />
          <Modal
            isOpen={isInnerOpen}
            onOpenChange={setIsInnerOpen}
            title="Confirm change"
            actionLabel="Apply"
            onAction={() => setIsInnerOpen(false)}
          >
            <Text>Apply the new settings to every folder?</Text>
          </Modal>
        </Modal>
      </>
    );
  },
};
