import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Key } from "react";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";

import { NotificationItem } from "../NotificationItem/NotificationItem";
import { NotificationStack, type NotificationStackItem } from "./NotificationStack";
import { overlayDocs } from "../../stories/helpers";

const meta = {
  title: "Components/NotificationStack",
  component: NotificationStack,
  args: {
    onClose: fn(),
    notifications: [
      { key: "saved", title: "Settings saved", status: "success" },
      {
        key: "update",
        title: "A new version is available",
        description: "Reload the page to use it.",
      },
    ],
  },
  // The stack floats in the bottom-end corner of the viewport.
  parameters: overlayDocs("400px"),
  // The caller owns the list: closing a notice removes it here.
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    const onClose = (key: Key) => {
      args.onClose?.(key);
      updateArgs({
        notifications: args.notifications.filter((item) => item.key !== key),
      });
    };
    return <NotificationStack {...args} onClose={onClose} />;
  },
} satisfies Meta<typeof NotificationStack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Statuses: Story = {
  args: {
    notifications: (["info", "success", "warning", "error"] as const).map(
      (status): NotificationStackItem => ({
        key: status,
        title: `A ${status} notice`,
        description: "Supporting detail for the notice.",
        status,
      }),
    ),
  },
};

export const Progress: Story = {
  args: {
    notifications: [
      {
        key: "upload",
        title: "Uploading 12 files",
        description: "dataset-archive.zip",
        percent: 40,
        onCancel: fn(),
        isClosable: false,
      },
      {
        key: "prepare",
        title: "Preparing the export",
        isProgressIndeterminate: true,
        onCancel: fn(),
      },
    ],
  },
};

/** An error notice opens its detail (`children`) up front. */
export const ErrorWithDetail: Story = {
  args: {
    notifications: [
      {
        key: "failed",
        title: "Upload failed",
        description: "dataset-archive.zip",
        status: "error",
        onRetry: fn(),
        children: "The connection closed before the upload finished.",
      },
    ],
  },
};

export const WithAction: Story = {
  args: {
    notifications: [
      {
        key: "done",
        title: "Upload finished",
        description: "12 files were added to the folder.",
        status: "success",
        actionText: "View folder",
        onAction: fn(),
      },
    ],
  },
};

/** Closes itself after five seconds; hovering or focusing it pauses the countdown. */
export const AutoClose: Story = {
  args: {
    notifications: [
      { key: "copied", title: "Link copied", status: "success", duration: 5 },
    ],
  },
};

export const MaxVisible: Story = {
  args: {
    maxVisible: 3,
    notifications: Array.from({ length: 6 }, (_, index) => ({
      key: `notice-${index + 1}`,
      title: `Notice ${index + 1}`,
    })),
  },
};

/** `content` replaces the title, description and progress with a body of the caller's own. */
export const CustomContent: Story = {
  args: {
    notifications: [
      {
        key: "custom",
        title: "Report ready",
        content: (
          <NotificationItem
            title="Report ready"
            description="monthly-usage.pdf"
            footer="Just now"
          />
        ),
      },
    ],
  },
};
