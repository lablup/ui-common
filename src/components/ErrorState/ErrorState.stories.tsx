import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { WifiOff } from "lucide-react";

import { ErrorState } from "./ErrorState";

const meta = {
  title: "Components/ErrorState",
  component: ErrorState,
  args: {
    title: "Something went wrong",
    message: "The data could not be loaded. Try again in a moment.",
    primaryAction: { label: "Retry", onClick: fn() },
  },
  argTypes: {
    tone: { control: "inline-radio", options: ["danger", "warning", "accent"] },
  },
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 24 }}>
      {(["danger", "warning", "accent"] as const).map((tone) => (
        <ErrorState key={tone} {...args} tone={tone} title={`Tone: ${tone}`} />
      ))}
    </div>
  ),
};

export const WithSecondaryAction: Story = {
  args: {
    tone: "warning",
    title: "Connection error",
    message: "Could not reach the server. Check your network and try again.",
    primaryAction: { label: "Retry", onClick: fn() },
    secondaryAction: { label: "View logs", onClick: fn() },
  },
};

export const CustomIcon: Story = {
  args: {
    tone: "warning",
    title: "You are offline",
    message: "Reconnect to the network to continue.",
    icon: <WifiOff size={32} />,
  },
};

export const WithoutIcon: Story = {
  args: { showIcon: false },
};

export const WithoutActions: Story = {
  args: { primaryAction: undefined },
};
