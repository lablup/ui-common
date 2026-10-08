import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { PageHeader } from "./PageHeader";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  args: {
    title: "Sessions",
    description: "Compute sessions running in this project.",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    actions: <Button variant="primary" label="Start session" />,
  },
};

export const WithError: Story = {
  args: {
    error: "Could not load the session list.",
    errorDetail: "502 Bad Gateway",
    onRetry: fn(),
    onErrorDismiss: fn(),
  },
};
