import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { DrawerHeader } from "../../astryx/lab";
import { Text } from "../../astryx/Text";
import { Modal } from "../../components/Modal";
import { Drawer, type DrawerProps } from "./Drawer";

type DemoProps = DrawerProps & {
  /** Puts a button in the drawer that opens a `Modal` from inside it. */
  hasModalInside?: boolean;
};

/** A trigger and the open state, so the drawer can be opened and closed. */
function DrawerDemo({ hasModalInside = false, ...args }: DemoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    args.onOpenChange(next);
  };

  return (
    <>
      <Button variant="primary" label="Open drawer" onClick={() => setIsOpen(true)} />
      <Drawer {...args} isOpen={isOpen} onOpenChange={handleOpenChange}>
        <DrawerHeader
          title="Item details"
          subtitle="Created 3 days ago"
          onOpenChange={handleOpenChange}
        />
        <div style={{ display: "grid", gap: 12, padding: 16 }}>
          <Text>
            Details of the selected item. Escape closes the drawer, and so does a click
            on the scrim when there is one.
          </Text>
          {hasModalInside && (
            <div>
              <Button label="Edit item" onClick={() => setIsModalOpen(true)} />
            </div>
          )}
        </div>
        {hasModalInside && (
          <Modal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            title="Edit item"
            onAction={() => setIsModalOpen(false)}
            actionLabel="Save"
          >
            <Text>This modal opens above the drawer and takes focus.</Text>
          </Modal>
        )}
      </Drawer>
    </>
  );
}

const meta = {
  title: "Forks/Drawer",
  component: Drawer,
  args: {
    label: "Item details",
    isOpen: false,
    onOpenChange: fn(),
    children: null,
  },
  argTypes: {
    side: { control: "inline-radio", options: ["start", "end"] },
    purpose: { control: "inline-radio", options: ["info", "form", "required"] },
    isOpen: { control: false },
  },
  render: (args) => <DrawerDemo {...args} />,
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StartSide: Story = {
  args: { side: "start", width: 320 },
};

/**
 * Non-modal: the page behind stays interactive. The fork opens it with
 * `show()` and a z-index instead of lab's top-layer popover, so a `Modal`
 * opened while it is up paints above it.
 */
export const WithoutScrim: Story = {
  args: { hasScrim: false },
  render: (args) => <DrawerDemo {...args} hasModalInside />,
};

/**
 * The fork's `Modal` support: a `Modal` opened from inside a scrimmed drawer
 * renders into the drawer's dialog and stays reachable above it.
 */
export const WithModalInside: Story = {
  render: (args) => <DrawerDemo {...args} hasModalInside />,
};

export const Required: Story = {
  args: { purpose: "required" },
};
