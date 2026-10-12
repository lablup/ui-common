import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { NotificationItem } from "./NotificationItem";
import { withMaxWidth } from "../../stories/helpers";

const meta = {
  title: "Components/NotificationItem",
  component: NotificationItem,
  args: {
    title: "Upload finished",
    description: "report.csv",
    action: <Button label="Open" size="sm" variant="ghost" />,
    footer: "2 minutes ago",
  },
  decorators: [withMaxWidth(360)],
} satisfies Meta<typeof NotificationItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutAction: Story = {
  args: { action: undefined },
};

export const DescriptionOnly: Story = {
  args: {
    title: undefined,
    action: undefined,
    footer: undefined,
    description: "Your session will restart in 5 minutes.",
  },
};

export const LongText: Story = {
  args: {
    title: "Export finished with warnings for several rows in the selected range",
    description:
      "Rows 12, 48 and 103 had values outside the allowed range and were left empty. Review them before you share the file.",
  },
};
